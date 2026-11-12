/**
 * Standard bacterial genetic code (NCBI translation table 11) and the E. coli
 * K-12 codon-usage ranking used by the rule-based embedder.
 */

export const BASES = ['A', 'C', 'G', 'T'] as const;
export type Base = (typeof BASES)[number];

const CODON_TABLE: Record<string, string> = {
  TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L',
  CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
  ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M',
  GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
  TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S',
  CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T',
  GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*',
  CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K',
  GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W',
  CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
  AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R',
  GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G',
};

/**
 * Codons ordered from most to least frequent in E. coli K-12 MG1655
 * (Kazusa-style usage table, rounded ranking only). The embedder uses the top
 * two codons of each amino acid as the bit pair.
 */
const EC_K12_CODON_RANKING: Record<string, string[]> = {
  F: ['TTC', 'TTT'],
  L: ['CTG', 'TTA', 'CTT', 'TTG', 'CTC', 'CTA'],
  I: ['ATC', 'ATT', 'ATA'],
  M: ['ATG'],
  V: ['GTG', 'GTT', 'GTC', 'GTA'],
  S: ['AGC', 'TCT', 'TCC', 'TCG', 'AGT', 'TCA'],
  P: ['CCG', 'CCA', 'CCT', 'CCC'],
  T: ['ACC', 'ACG', 'ACT', 'ACA'],
  A: ['GCG', 'GCA', 'GCT', 'GCC'],
  Y: ['TAC', 'TAT'],
  H: ['CAT', 'CAC'],
  Q: ['CAG', 'CAA'],
  N: ['AAC', 'AAT'],
  K: ['AAA', 'AAG'],
  D: ['GAT', 'GAC'],
  E: ['GAA', 'GAG'],
  C: ['TGC', 'TGT'],
  R: ['CGT', 'CGC', 'CGA', 'CGG', 'AGA', 'AGG'],
  W: ['TGG'],
  '*': ['TAA', 'TAG', 'TGA'],
};

const AMINO_ACID_TO_CODONS = Object.fromEntries(
  Object.entries(EC_K12_CODON_RANKING).map(([aminoAcid, codons]) => [aminoAcid, codons]),
) as Record<string, string[]>;

export function isBase(value: string): value is Base {
  return value === 'A' || value === 'C' || value === 'G' || value === 'T';
}

export function isValidCodon(codon: string): boolean {
  return codon.length === 3 && [...codon].every(isBase);
}

export function getAminoAcid(codon: string): string | undefined {
  return CODON_TABLE[codon];
}

export function isStopCodon(codon: string): boolean {
  return getAminoAcid(codon) === '*';
}

export function translate(sequence: string): string {
  const upper = sequence.toUpperCase();
  let protein = '';
  for (let i = 0; i + 2 < upper.length; i += 3) {
    const codon = upper.slice(i, i + 3);
    protein += getAminoAcid(codon) ?? 'X';
  }
  return protein;
}

export function synonymousCodons(aminoAcid: string): string[] {
  return AMINO_ACID_TO_CODONS[aminoAcid] ?? [];
}

/** A codon is eligible if its amino acid has two or more synonymous codons. */
export function isEligibleCodon(codon: string): boolean {
  const aminoAcid = getAminoAcid(codon);
  if (!aminoAcid || aminoAcid === 'M' || aminoAcid === 'W' || aminoAcid === '*') return false;
  return synonymousCodons(aminoAcid).length >= 2;
}

/** Indices (in codons, not nucleotides) of every eligible codon in a CDS. */
export function eligibleCodonIndices(sequence: string): number[] {
  const upper = sequence.toUpperCase();
  const indices: number[] = [];
  for (let codonIndex = 0; codonIndex * 3 + 2 < upper.length; codonIndex += 1) {
    const codon = upper.slice(codonIndex * 3, codonIndex * 3 + 3);
    if (isEligibleCodon(codon)) indices.push(codonIndex);
  }
  return indices;
}

/**
 * The two codons used to encode a bit for this amino acid. Order matters:
 * pair[0] => bit 0, pair[1] => bit 1.
 */
export function bitCodonPair(aminoAcid: string): [string, string] | undefined {
  const codons = synonymousCodons(aminoAcid);
  if (codons.length < 2) return undefined;
  return [codons[0], codons[1]];
}

export function codonForBit(aminoAcid: string, bit: 0 | 1): string | undefined {
  return bitCodonPair(aminoAcid)?.[bit];
}

export interface BitEstimate {
  /** Soft estimate in [0, 1]; values near 0 mean bit 0, near 1 mean bit 1. */
  estimate: number;
  /** Confidence in [0, 1]. */
  confidence: number;
  /** True when the codon cannot carry information (stop or single-codon AA). */
  erasure: boolean;
}

/**
 * Read a soft bit from a codon. A codon outside the designated pair yields a
 * low-confidence estimate so Reed-Solomon can treat it as an error.
 */
export function bitEstimateFromCodon(codon: string): BitEstimate {
  const aminoAcid = getAminoAcid(codon);
  if (!aminoAcid || aminoAcid === '*' || aminoAcid === 'M' || aminoAcid === 'W') {
    return { estimate: 0.5, confidence: 0, erasure: true };
  }

  const pair = bitCodonPair(aminoAcid);
  if (!pair) return { estimate: 0.5, confidence: 0, erasure: true };

  if (codon === pair[0]) return { estimate: 0, confidence: 0.99, erasure: false };
  if (codon === pair[1]) return { estimate: 1, confidence: 0.99, erasure: false };

  // A synonymous codon outside the pair: weak guess based on rank parity.
  const rank = synonymousCodons(aminoAcid).indexOf(codon);
  return { estimate: rank >= 0 && rank % 2 === 0 ? 0 : 1, confidence: 0.25, erasure: false };
}

/** Translate a codon index to a nucleotide offset. */
export function codonOffset(codonIndex: number): number {
  return codonIndex * 3;
}

export function codonsOf(sequence: string): string[] {
  const upper = sequence.toUpperCase();
  const codons: string[] = [];
  for (let i = 0; i + 2 < upper.length; i += 3) codons.push(upper.slice(i, i + 3));
  return codons;
}

/** Choose a different synonymous codon deterministically. */
export function alternateSynonymousCodon(codon: string, randomFloat: number): string {
  const aminoAcid = getAminoAcid(codon);
  if (!aminoAcid) return codon;
  const options = synonymousCodons(aminoAcid).filter((candidate) => candidate !== codon);
  if (options.length === 0) return codon;
  return options[Math.min(options.length - 1, Math.floor(randomFloat * options.length))];
}

export function codonUsageTable(): Readonly<Record<string, readonly string[]>> {
  return AMINO_ACID_TO_CODONS;
}
