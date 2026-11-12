import { buildCarrierLayout, CapacityError } from '@/core/carrier';
import { getMasterKey } from '@/core/crypto';
import { PAYLOAD_BITS, bytesToBits, packPayload } from '@/core/payload';
import { ECC_CODEWORD_BITS, ECC_PARITY_BYTES, rsEncode } from '@/core/ecc';
import { translate } from '@/core/codons';
import { proteinIdentityPercent, sha256Sequence } from '@/core/sequence';
import type { StampRequest, StampResponse } from '@/types';
import { ApiError } from '@/lib/http';
import { embed } from './mlClient';
import { getOrAssignCodes, insertStamp } from './registry';

export { CapacityError };

/**
 * Full stamping pipeline:
 *   codes -> 64-bit payload -> Reed-Solomon codeword -> tiled bits ->
 *   keyed carrier codons -> registry record.
 */
export async function stampSequence(input: StampRequest): Promise<StampResponse> {
  const masterKey = getMasterKey();
  const sequence = input.sequence.toUpperCase();

  let layout;
  try {
    layout = buildCarrierLayout(sequence, masterKey);
  } catch (error) {
    if (error instanceof CapacityError) {
      throw new ApiError(422, 'INSUFFICIENT_CAPACITY', error.message);
    }
    throw error;
  }

  const codes = await getOrAssignCodes({
    ownerName: input.ownerName,
    projectName: input.projectName,
    batchName: input.batchName,
  });

  const payload = packPayload(codes, masterKey);
  const codeword = rsEncode(payload, ECC_PARITY_BYTES);
  const codewordBits = bytesToBits(codeword);
  const tiledBits = layout.positions.map((_, index) => codewordBits[index % ECC_CODEWORD_BITS]);

  const embedded = await embed(sequence, tiledBits, layout.positions, input.host);
  const stampedSequence = embedded.stampedSequence.toUpperCase();

  const originalProtein = translate(sequence);
  const stampedProtein = translate(stampedSequence);
  if (originalProtein !== stampedProtein) {
    throw new ApiError(
      500,
      'PROTEIN_INVARIANT_VIOLATION',
      'Embedding changed the translated protein; stamp aborted',
    );
  }

  const sequenceHash = sha256Sequence(stampedSequence);
  const originalSequenceHash = sha256Sequence(sequence);

  const record = await insertStamp(
    {
      ownerName: input.ownerName,
      projectName: input.projectName,
      batchName: input.batchName,
      host: input.host,
      geneName: input.geneName ?? null,
      sequenceHash,
      originalSequenceHash,
      stampedSequence,
      carrierPositions: layout.positions,
      capacityUsed: PAYLOAD_BITS,
      capacityTotal: layout.eligibleCodons,
    },
    codes,
  );

  return {
    status: 'success',
    data: {
      stampId: record.id,
      owner: record.ownerName,
      project: record.projectName,
      batch: record.batchName,
      originalSequenceLength: sequence.length,
      stampedSequence,
      proteinTranslation: stampedProtein,
      proteinIdentityPercent: Number(proteinIdentityPercent(sequence, stampedSequence).toFixed(2)),
      mutations: embedded.mutations,
      stats: {
        gcBefore: embedded.bioStats.gcBefore,
        gcAfter: embedded.bioStats.gcAfter,
        caiSimilarity: embedded.bioStats.caiSimilarity,
        longestHomopolymer: embedded.bioStats.longestHomopolymer,
        capacityUsed: PAYLOAD_BITS,
        capacityTotal: layout.eligibleCodons,
      },
      createdAt: record.createdAt,
    },
  };
}
