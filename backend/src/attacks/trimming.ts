import type { AttackResult } from './mutation';

/** Remove nucleotides from the 5' and/or 3' termini. */
export function trimEnds(sequence: string, length5p: number, length3p: number): AttackResult {
  const upper = sequence.toUpperCase();
  const fivePrime = Math.max(0, Math.min(upper.length - 1, Math.floor(length5p)));
  const threePrime = Math.max(0, Math.min(upper.length - fivePrime - 1, Math.floor(length3p)));
  const trimmed = upper.slice(fivePrime, upper.length - threePrime);
  return {
    sequence: trimmed,
    mutationsApplied: fivePrime + threePrime,
  };
}
