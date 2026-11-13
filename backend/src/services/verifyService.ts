import { buildCarrierLayout } from '@/core/carrier';
import {
  decodeTiles,
  extractSoftBits,
  extractSoftBitsFromOffsets,
  type DecodeSummary,
  type TileExtraction,
} from '@/core/embed';
import { getMasterKey } from '@/core/crypto';
import { alignToReferenceDetailed, mapCarrierOffsets } from '@/core/align';
import { sha256Sequence } from '@/core/sequence';
import type { VerifyResponse, VerifyStatus } from '@/types';
import * as registry from './registry';
import { extract as mlExtract } from './mlClient';

export interface VerificationOutcome {
  status: VerifyStatus;
  decoded: DecodeSummary | null;
  record: registry.StampRecord | null;
  similarity: number;
  aligned: boolean;
}

async function extractionFor(
  sequence: string,
  positions: number[],
  useMlBridge: boolean,
  carrierStartOffsets?: (number | null)[],
): Promise<TileExtraction> {
  const useOffsets = carrierStartOffsets !== undefined && carrierStartOffsets.length > 0;
  if (!useMlBridge) {
    return useOffsets
      ? extractSoftBitsFromOffsets(sequence, carrierStartOffsets)
      : extractSoftBits(sequence, positions);
  }
  try {
    const result = await mlExtract(
      sequence,
      useOffsets ? undefined : positions,
      'E. coli K-12',
      useOffsets ? carrierStartOffsets : undefined,
    );
    return {
      estimates: result.bitEstimates,
      confidences: result.confidences,
      erasures: result.confidences.filter((confidence) => confidence === 0).length,
    };
  } catch {
    return useOffsets
      ? extractSoftBitsFromOffsets(sequence, carrierStartOffsets)
      : extractSoftBits(sequence, positions);
  }
}

async function namesFor(
  codes: { ownerCode: number; projectCode: number; batchCode: number },
  record: registry.StampRecord | null,
): Promise<{ owner: string; project: string; batch: string }> {
  const [ownerName, projectName, batchName] = await Promise.all([
    registry.getEntityName('owner', codes.ownerCode),
    registry.getEntityName('project', codes.projectCode),
    registry.getEntityName('batch', codes.batchCode),
  ]);

  const owner =
    ownerName ??
    (record && record.ownerCode === codes.ownerCode ? record.ownerName : null) ??
    `Owner #${codes.ownerCode}`;
  const project =
    projectName ??
    (record && record.projectCode === codes.projectCode ? record.projectName : null) ??
    `Project #${codes.projectCode}`;
  const batch =
    batchName ??
    (record && record.batchCode === codes.batchCode ? record.batchName : null) ??
    `Batch #${codes.batchCode}`;

  return { owner, project, batch };
}


/**
 * Verify a sequence against a known reference (or itself). Used directly by
 * stress/attack simulation and internally by the public verify endpoint.
 */
export async function verifyAgainstReference(
  sequence: string,
  referenceSequence: string,
  positions?: number[],
  useMlBridge = false,
): Promise<VerificationOutcome> {
  const masterKey = getMasterKey();
  const layout = positions
    ? { positions, tiles: Math.floor(positions.length / 128) }
    : buildCarrierLayout(referenceSequence, masterKey);

  let target = sequence.toUpperCase();
  let aligned = false;
  let carrierStartOffsets: (number | null)[] | undefined;

  if (target.length !== referenceSequence.length) {
    const alignment = alignToReferenceDetailed(referenceSequence, target);
    target = alignment.alignedSequence;
    aligned = true;
    carrierStartOffsets = mapCarrierOffsets(alignment.refToQuery, layout.positions);
  }

  const extraction = await extractionFor(
    carrierStartOffsets ? sequence.toUpperCase() : target,
    layout.positions,
    useMlBridge,
    carrierStartOffsets,
  );
  const decoded = decodeTiles(extraction, masterKey);

  if (!decoded) {
    return {
      status: 'not_found',
      decoded: null,
      record: null,
      similarity: 0,
      aligned,
    };
  }

  const status: VerifyStatus = decoded.macValid ? 'verified' : 'partially_recovered';
  return {
    status,
    decoded: {
      ...decoded,
      ownerCode: decoded.payload ? Buffer.from(decoded.payload).readUInt16BE(0) : 0,
      projectCode: decoded.payload ? Buffer.from(decoded.payload).readUInt16BE(2) : 0,
      batchCode: decoded.payload ? Buffer.from(decoded.payload).readUInt16BE(4) : 0,
    },
    record: null,
    similarity: 1,
    aligned,
  };
}

/**
 * Registry-assisted verification of an unknown sequence. Exact hashes are
 * checked first; otherwise the closest registered construct is aligned and its
 * carrier layout is reused.
 */
export async function verifySequence(sequence: string): Promise<VerificationOutcome> {
  const masterKey = getMasterKey();
  const normalized = sequence.toUpperCase();
  const hash = sha256Sequence(normalized);

  const exact = await registry.getStampByHash(hash);
  if (exact && exact.carrierPositions.length > 0) {
    const outcome = await verifyAgainstReference(
      normalized,
      exact.stampedSequence,
      exact.carrierPositions,
      true,
    );
    return { ...outcome, record: exact, similarity: 1 };
  }

  const candidates = await registry.findCandidateStamps(normalized, 3, 0.45);
  const best = candidates[0];

  if (best && best.stamp.carrierPositions.length > 0) {
    const outcome = await verifyAgainstReference(
      normalized,
      best.stamp.stampedSequence,
      best.stamp.carrierPositions,
      true,
    );
    if (outcome.status !== 'not_found') {
      return { ...outcome, record: best.stamp, similarity: best.similarity };
    }
  }

  // No registered reference: fall back to the self-describing layout. This
  // works for clean or synonymously modified constructs.
  let layout;
  try {
    layout = buildCarrierLayout(normalized, masterKey);
  } catch {
    return { status: 'not_found', decoded: null, record: null, similarity: 0, aligned: false };
  }
  const extraction = await extractionFor(normalized, layout.positions, true);
  const decoded = decodeTiles(extraction, masterKey);

  if (!decoded || !decoded.macValid) {
    return { status: 'not_found', decoded: null, record: null, similarity: 0, aligned: false };
  }

  return {
    status: 'verified',
    decoded: {
      ...decoded,
      ownerCode: Buffer.from(decoded.payload).readUInt16BE(0),
      projectCode: Buffer.from(decoded.payload).readUInt16BE(2),
      batchCode: Buffer.from(decoded.payload).readUInt16BE(4),
    },
    record: null,
    similarity: 0,
    aligned: false,
  };
}

/** Build the public verify response, including registry-resolved names. */
export async function verifyAndFormat(sequence: string): Promise<VerifyResponse> {
  const outcome = await verifySequence(sequence);
  if (!outcome.decoded || !outcome.decoded.payload) {
    return { status: 'not_found', data: null };
  }

  const { ownerCode, projectCode, batchCode } = outcome.decoded;
  const names = await namesFor({ ownerCode, projectCode, batchCode }, outcome.record);

  return {
    status: outcome.status,
    data: {
      owner: names.owner,
      project: names.project,
      batch: names.batch,
      errorsCorrected: Math.round(outcome.decoded.errorsCorrected),
      confidenceScore: outcome.decoded.confidence,
      timestamp: new Date().toISOString(),
    },
  };
}
