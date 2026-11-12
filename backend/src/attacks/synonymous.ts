import { alternateSynonymousCodon, codonsOf, getAminoAcid, isEligibleCodon } from '../core/codons';
import { mulberry32 } from '../core/crypto';
import type { AttackResult } from './mutation';

function rewriteSynonymous(sequence: string, fraction: number, seed: number): AttackResult {
  const clampedFraction = Math.max(0, Math.min(1, fraction));
  const random = mulberry32(seed >>> 0);
  const codons = codonsOf(sequence);
  let mutationsApplied = 0;

  for (let i = 0; i < codons.length; i += 1) {
    const codon = codons[i];
    if (!isEligibleCodon(codon)) continue;
    if (random() >= clampedFraction) continue;

    const aminoAcid = getAminoAcid(codon);
    if (!aminoAcid) continue;
    const replacement = alternateSynonymousCodon(codon, random());
    if (replacement !== codon) {
      codons[i] = replacement;
      mutationsApplied += 1;
    }
  }

  return { sequence: codons.join(''), mutationsApplied };
}

/**
 * Adversarial synonymous rewrite. It uniformly picks another synonymous codon
 * for a fraction of eligible positions and always preserves the protein.
 */
export function resynonymizeFraction(sequence: string, fraction: number, seed = 42): AttackResult {
  return rewriteSynonymous(sequence, fraction, seed);
}

/**
 * Synonymous shuffle. For every selected amino acid, choose a different codon
 * from its synonymous set. The protein is preserved by construction.
 */
export function shuffleSynonymous(sequence: string, fraction: number, seed = 42): AttackResult {
  return rewriteSynonymous(sequence, fraction, seed);
}
