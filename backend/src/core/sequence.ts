import { createHash } from 'node:crypto';
import { codonsOf, translate } from './codons';

export function normalizeSequence(sequence: string): string {
  return sequence.trim().toUpperCase().replace(/\s+/g, '');
}

export function sha256Sequence(sequence: string): string {
  return createHash('sha256').update(sequence.toUpperCase(), 'utf8').digest('hex');
}

export function gcContent(sequence: string): number {
  if (sequence.length === 0) return 0;
  const upper = sequence.toUpperCase();
  let gc = 0;
  for (const base of upper) {
    if (base === 'G' || base === 'C') gc += 1;
  }
  return (gc / upper.length) * 100;
}

export function longestHomopolymer(sequence: string): number {
  const upper = sequence.toUpperCase();
  let longest = 0;
  let current = 0;
  let previous = '';
  for (const base of upper) {
    if (base === previous) {
      current += 1;
    } else {
      previous = base;
      current = 1;
    }
    if (current > longest) longest = current;
  }
  return longest;
}

export function kmerCounts(sequence: string, k: number): Map<string, number> {
  const upper = sequence.toUpperCase();
  const counts = new Map<string, number>();
  if (upper.length < k) return counts;
  for (let i = 0; i + k <= upper.length; i += 1) {
    const kmer = upper.slice(i, i + k);
    counts.set(kmer, (counts.get(kmer) ?? 0) + 1);
  }
  return counts;
}

function cosineFromCounts(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const value of a.values()) normA += value * value;
  for (const value of b.values()) normB += value * value;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const [key, value] of small) {
    const other = large.get(key);
    if (other) dot += value * other;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Similarity in [0, 1]. Cosine similarity over 6-mer frequencies is robust to
 * point mutations and small indels while still discriminating unrelated genes.
 */
export function sequenceSimilarity(a: string, b: string, k = 6): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const countsA = kmerCounts(a, k);
  const countsB = kmerCounts(b, k);
  return cosineFromCounts(countsA, countsB);
}

/** Cosine similarity of codon-usage vectors (a quick CAI-style proxy). */
export function codonUsageSimilarity(a: string, b: string): number {
  const counts = (sequence: string): Map<string, number> => {
    const map = new Map<string, number>();
    for (const codon of codonsOf(sequence)) {
      map.set(codon, (map.get(codon) ?? 0) + 1);
    }
    return map;
  };
  return cosineFromCounts(counts(a), counts(b));
}

export interface SequenceChange {
  start: number;
  end: number;
  type: string;
}

/**
 * Group nucleotide differences into contiguous regions. Only comparable for
 * equal-length sequences; callers should align first when lengths differ.
 */
export function changedRegions(reference: string, suspect: string, maxGap = 3): SequenceChange[] {
  if (reference.length !== suspect.length) return [];
  const regions: SequenceChange[] = [];
  let start = -1;
  let lastMismatch = -1;

  const flush = (): void => {
    if (start >= 0) {
      regions.push({ start, end: lastMismatch + 1, type: 'point_mutation' });
      start = -1;
      lastMismatch = -1;
    }
  };

  for (let i = 0; i < reference.length; i += 1) {
    if (reference[i].toUpperCase() !== suspect[i].toUpperCase()) {
      if (start < 0) start = i;
      else if (i - lastMismatch > maxGap) {
        flush();
        start = i;
      }
      lastMismatch = i;
    }
  }
  flush();
  return regions;
}

export function proteinIdentityPercent(reference: string, suspect: string): number {
  const refProtein = translate(reference);
  const suspectProtein = translate(suspect);
  if (refProtein.length === 0) return 100;
  let identical = 0;
  const length = Math.max(refProtein.length, suspectProtein.length);
  for (let i = 0; i < length; i += 1) {
    if (refProtein[i] === suspectProtein[i]) identical += 1;
  }
  return (identical / length) * 100;
}

export function sequenceStats(sequence: string): {
  length: number;
  gc: number;
  longestHomopolymer: number;
  protein: string;
} {
  return {
    length: sequence.length,
    gc: gcContent(sequence),
    longestHomopolymer: longestHomopolymer(sequence),
    protein: translate(sequence),
  };
}
