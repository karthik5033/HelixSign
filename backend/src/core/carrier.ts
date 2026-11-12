import { createHmacDrbg, deriveCarrierKey, getMasterKey, shuffleInPlace } from './crypto';
import { ECC_CODEWORD_BITS } from './ecc';
import { eligibleCodonIndices } from './codons';

export class CapacityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CapacityError';
  }
}

export interface CarrierLayout {
  /** Codon indices in bit order. Every eligible codon is used; the codeword repeats modulo 128. */
  positions: number[];
  /** Number of complete 128-bit codeword copies. */
  tiles: number;
  /** Number of eligible codons in the reference sequence. */
  eligibleCodons: number;
  /** Total bits of payload capacity (eligible codons). */
  capacityBits: number;
}

/**
 * Deterministically choose carrier codons.
 *
 * The eligible codon set is computed from the reference sequence (the wildtype
 * or the stamped construct). The permutation is seeded from the master secret
 * and construct length, so the verifier can reproduce it while the client never
 * sees the key or the positions.
 *
 * Every eligible codon is used. The 128-bit codeword repeats modulo 128, so a
 * partial final copy still contributes redundancy to the first bits.
 */
export function buildCarrierLayout(
  referenceSequence: string,
  masterKey: Buffer = getMasterKey(),
): CarrierLayout {
  const eligible = eligibleCodonIndices(referenceSequence);
  const capacityBits = eligible.length;
  const tiles = Math.floor(capacityBits / ECC_CODEWORD_BITS);

  if (tiles < 1) {
    throw new CapacityError(
      `Sequence has ${capacityBits} eligible codons but at least ${ECC_CODEWORD_BITS} are required for one Reed-Solomon tile`,
    );
  }

  const key = deriveCarrierKey(masterKey, referenceSequence.length);
  const prng = createHmacDrbg(key);
  const shuffled = shuffleInPlace([...eligible], prng);

  return {
    positions: shuffled,
    tiles,
    eligibleCodons: eligible.length,
    capacityBits,
  };
}

/** Split a flat list of bit positions into tiles of 128. */
export function tilePositions(positions: readonly number[]): number[][] {
  const tiles: number[][] = [];
  for (let i = 0; i < positions.length; i += ECC_CODEWORD_BITS) {
    tiles.push(positions.slice(i, i + ECC_CODEWORD_BITS));
  }
  return tiles;
}
