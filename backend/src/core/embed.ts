import {
  bitEstimateFromCodon,
  codonForBit,
  getAminoAcid,
  isEligibleCodon,
  translate,
} from './codons';
import {
  ECC_CODEWORD_BITS,
  ECC_CODEWORD_BYTES,
  ECC_MAX_ERRORS,
  ECC_PARITY_BYTES,
  rsDecode,
} from './ecc';
import { bitsToBytes, bytesToBits, unpackPayload, verifyPayloadMac } from './payload';

export interface CodonMutation {
  codonIndex: number;
  fromCodon: string;
  toCodon: string;
  aminoAcid: string;
}

export interface EmbedResult {
  stampedSequence: string;
  mutations: CodonMutation[];
  proteinIdentical: boolean;
  proteinIdentityPercent: number;
}

/**
 * Embed a 16-byte Reed-Solomon codeword (128 bits) into the carrier codons.
 * The codeword is repeated in every tile for majority voting at extraction.
 */
export function embedCodeword(
  sequence: string,
  codeword: Uint8Array,
  positions: readonly number[],
): EmbedResult {
  if (codeword.length !== ECC_CODEWORD_BYTES) {
    throw new RangeError(`Expected a ${ECC_CODEWORD_BYTES}-byte codeword, got ${codeword.length}`);
  }
  if (positions.length < ECC_CODEWORD_BITS) {
    throw new RangeError(`At least ${ECC_CODEWORD_BITS} carrier positions are required`);
  }

  const bits = bytesToBits(codeword);
  const bases = [...sequence.toUpperCase()];
  const mutations: CodonMutation[] = [];
  const originalProtein = translate(sequence);
  const length = positions.length;

  for (let bitIndex = 0; bitIndex < length; bitIndex += 1) {
    const codonIndex = positions[bitIndex];
    const offset = codonIndex * 3;
    const current = bases.slice(offset, offset + 3).join('');

    if (!isEligibleCodon(current)) {
      throw new Error(`Carrier codon ${codonIndex} (${current}) is not eligible for embedding`);
    }

    const aminoAcid = getAminoAcid(current);
    if (!aminoAcid) throw new Error(`Unknown codon ${current}`);

    const target = codonForBit(aminoAcid, bits[bitIndex % ECC_CODEWORD_BITS] as 0 | 1);
    if (!target) throw new Error(`No bit codon mapping for amino acid ${aminoAcid}`);

    if (target !== current) {
      bases[offset] = target[0];
      bases[offset + 1] = target[1];
      bases[offset + 2] = target[2];
      mutations.push({
        codonIndex,
        fromCodon: current,
        toCodon: target,
        aminoAcid,
      });
    }
  }

  const stampedSequence = bases.join('');
  const stampedProtein = translate(stampedSequence);
  const proteinIdentical = stampedProtein === originalProtein;

  if (!proteinIdentical) {
    throw new Error('Protein identity invariant violated during embedding');
  }

  return {
    stampedSequence,
    mutations,
    proteinIdentical,
    proteinIdentityPercent: 100,
  };
}

export interface TileExtraction {
  estimates: number[];
  confidences: number[];
  erasures: number;
}

/**
 * Read soft bit estimates at the carrier positions. Bases marked with N (from
 * alignment gaps) become erasures.
 */
export function extractSoftBits(sequence: string, positions: readonly number[]): TileExtraction {
  const estimates: number[] = [];
  const confidences: number[] = [];
  let erasures = 0;

  for (let i = 0; i < positions.length; i += 1) {
    const offset = positions[i] * 3;
    const codon = sequence.slice(offset, offset + 3).toUpperCase();

    if (codon.length !== 3 || codon.includes('N') || !/^[ACGT]{3}$/.test(codon)) {
      estimates.push(0.5);
      confidences.push(0);
      erasures += 1;
      continue;
    }

    const result = bitEstimateFromCodon(codon);
    estimates.push(result.estimate);
    confidences.push(result.confidence);
    if (result.erasure) erasures += 1;
  }

  return { estimates, confidences, erasures };
}

export interface DecodedTiles {
  /** Decoded 8-byte payload, if at least one tile decoded. */
  payload: Uint8Array;
  /** Decoded 16-byte codeword. */
  codeword: Uint8Array;
  /** True when the payload MAC validates. */
  macValid: boolean;
  /** Number of tiles that decoded successfully. */
  tilesDecoded: number;
  /** Mean number of byte errors corrected across decoded tiles. */
  errorsCorrected: number;
  /** Confidence in [0, 1]. */
  confidence: number;
  /** Number of erasure positions observed. */
  erasures: number;
  /** Bit estimate rows per tile, handy for diagnostics/tests. */
  tileEstimates: number[][];
}

/**
 * Combine all carrier copies with confidence-weighted voting and then apply
 * Reed-Solomon once to the 128-bit codeword. A partial final copy still votes
 * for the first bits, so spare capacity is never wasted.
 */
export function decodeTiles(
  extraction: TileExtraction,
  masterKey: Buffer,
): DecodedTiles | null {
  if (extraction.estimates.length < ECC_CODEWORD_BITS) return null;

  const weighted = new Array<number>(ECC_CODEWORD_BITS).fill(0);
  const weights = new Array<number>(ECC_CODEWORD_BITS).fill(0);
  const maxConfidence = new Array<number>(ECC_CODEWORD_BITS).fill(0);

  for (let i = 0; i < extraction.estimates.length; i += 1) {
    const bitIndex = i % ECC_CODEWORD_BITS;
    const confidence = extraction.confidences[i] ?? 0;
    weighted[bitIndex] += extraction.estimates[i] * confidence;
    weights[bitIndex] += confidence;
    if (confidence > maxConfidence[bitIndex]) maxConfidence[bitIndex] = confidence;
  }

  const bits: number[] = [];
  const bitConfidences: number[] = [];
  for (let bit = 0; bit < ECC_CODEWORD_BITS; bit += 1) {
    if (weights[bit] > 0) {
      bits.push(weighted[bit] / weights[bit] >= 0.5 ? 1 : 0);
      bitConfidences.push(maxConfidence[bit]);
    } else {
      bits.push(0);
      bitConfidences.push(0);
    }
  }

  const codeword = bitsToBytes(bits);
  const byteErasures: number[] = [];
  for (let byteIndex = 0; byteIndex < ECC_CODEWORD_BYTES; byteIndex += 1) {
    const slice = bitConfidences.slice(byteIndex * 8, byteIndex * 8 + 8);
    if (slice.some((confidence) => confidence < 0.5)) byteErasures.push(byteIndex);
  }

  const attempts: number[][] =
    byteErasures.length > 0 && byteErasures.length <= ECC_PARITY_BYTES
      ? [byteErasures, []]
      : [[]];

  let decoded: ReturnType<typeof rsDecode> | null = null;
  for (const erasures of attempts) {
    try {
      decoded = rsDecode(Uint8Array.from(codeword), ECC_PARITY_BYTES, erasures);
      break;
    } catch {
      // Try the next decoding strategy.
    }
  }
  if (!decoded) return null;

  const payload = decoded.data;
  const macValid = verifyPayloadMac(payload, masterKey);
  const meanConfidence =
    bitConfidences.reduce((sum, value) => sum + value, 0) / bitConfidences.length;
  const repairFactor = Math.max(0, 1 - decoded.errorsCorrected / ECC_MAX_ERRORS);
  const baseConfidence = meanConfidence * 0.7 + repairFactor * 0.3;
  const confidence = macValid
    ? Math.min(0.999, baseConfidence)
    : Math.min(0.49, baseConfidence * 0.5);

  return {
    payload,
    codeword: decoded.codeword,
    macValid,
    tilesDecoded: Math.ceil(extraction.estimates.length / ECC_CODEWORD_BITS),
    errorsCorrected: decoded.errorsCorrected,
    confidence: Number(confidence.toFixed(3)),
    erasures: extraction.erasures,
    tileEstimates: [bits],
  };
}

export interface DecodeSummary extends DecodedTiles {
  ownerCode: number;
  projectCode: number;
  batchCode: number;
}

/** Decode carrier positions from a (possibly gapped) sequence. */
export function decodeSequence(
  sequence: string,
  positions: readonly number[],
  masterKey: Buffer,
): DecodeSummary | null {
  const extraction = extractSoftBits(sequence, positions);
  const decoded = decodeTiles(extraction, masterKey);
  if (!decoded) return null;

  const unpacked = unpackPayload(decoded.payload);
  return {
    ...decoded,
    ownerCode: unpacked.ownerCode,
    projectCode: unpacked.projectCode,
    batchCode: unpacked.batchCode,
  };
}
