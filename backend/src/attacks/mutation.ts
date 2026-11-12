import { BASES } from '../core/codons';
import { mulberry32 } from '../core/crypto';

export interface AttackResult {
  sequence: string;
  mutationsApplied: number;
}

const TRANSITIONS: Record<string, string> = {
  A: 'G',
  G: 'A',
  C: 'T',
  T: 'C',
};

const TRANSVERSIONS: Record<string, string[]> = {
  A: ['C', 'T'],
  G: ['C', 'T'],
  C: ['A', 'G'],
  T: ['A', 'G'],
};

/** Substitute bases at the requested per-base rate, biased toward transitions. */
export function randomMutation(sequence: string, rate: number, seed = 42): AttackResult {
  const clampedRate = Math.max(0, Math.min(1, rate));
  const random = mulberry32(seed >>> 0);
  const bases = [...sequence.toUpperCase()];
  let mutationsApplied = 0;

  for (let i = 0; i < bases.length; i += 1) {
    if (random() >= clampedRate) continue;
    const current = bases[i];
    if (!(BASES as readonly string[]).includes(current)) continue;

    const useTransition = random() < 2 / 3;
    const candidates = useTransition ? [TRANSITIONS[current]] : TRANSVERSIONS[current];
    const replacement = candidates[Math.floor(random() * candidates.length)];
    bases[i] = replacement;
    mutationsApplied += 1;
  }

  return { sequence: bases.join(''), mutationsApplied };
}
