import { mulberry32 } from '@/core/crypto';

export const AA_TO_CODON: Record<string, string> = {
  A: 'GCG',
  C: 'TGC',
  D: 'GAT',
  E: 'GAA',
  F: 'TTC',
  G: 'GGC',
  H: 'CAT',
  I: 'ATC',
  K: 'AAA',
  L: 'CTG',
  N: 'AAC',
  P: 'CCG',
  Q: 'CAG',
  R: 'CGT',
  S: 'AGC',
  T: 'ACC',
  V: 'GTG',
  Y: 'TAC',
};

export const ELIGIBLE_AMINO_ACIDS = Object.keys(AA_TO_CODON);

/** Deterministic 600+ nt CDS with a start codon, 240 eligible codons and a stop. */
export function makeCds(length = 240, seed = 7): string {
  const random = mulberry32(seed);
  let sequence = 'ATG';
  for (let i = 0; i < length; i += 1) {
    const aminoAcid = ELIGIBLE_AMINO_ACIDS[Math.floor(random() * ELIGIBLE_AMINO_ACIDS.length)];
    sequence += AA_TO_CODON[aminoAcid];
  }
  sequence += 'TAA';
  return sequence;
}

export function makeMasterKey(): Buffer {
  return Buffer.from('11'.repeat(32), 'hex');
}
