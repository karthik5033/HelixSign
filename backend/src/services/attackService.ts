import { buildCarrierLayout } from '@/core/carrier';
import { mulberry32 } from '@/core/crypto';
import { translate } from '@/core/codons';
import type { AttackRequest, AttackResponse, AttackType } from '@/types';
import { randomMutation } from '@/attacks/mutation';
import { trimEnds } from '@/attacks/trimming';
import { deleteBlock } from '@/attacks/deletion';
import { resynonymizeFraction, shuffleSynonymous } from '@/attacks/synonymous';
import { verifyAgainstReference } from './verifyService';

const BREAK_POINTS: Record<AttackType, number> = {
  random_mutation: 0.035,
  trim_ends: 0.06,
  delete_block: 0.06,
  shuffle_synonymous: 0.05,
  resynonymize_fraction: 0.05,
};

interface AppliedAttack {
  sequence: string;
  mutationsApplied: number;
}

function applyAttack(input: AttackRequest): AppliedAttack {
  const sequence = input.sequence.toUpperCase();
  const intensity = input.intensity;

  switch (input.attackType) {
    case 'random_mutation':
      return randomMutation(sequence, intensity, input.seed);

    case 'trim_ends': {
      const total = Math.floor(sequence.length * intensity);
      const fivePrime = Math.floor(total / 2);
      const threePrime = total - fivePrime;
      return trimEnds(sequence, fivePrime, threePrime);
    }

    case 'delete_block': {
      const random = mulberry32(input.seed >>> 0);
      const codonCount = Math.floor(sequence.length / 3);
      const blockCodons = Math.max(1, Math.floor(codonCount * intensity));
      const maxStartCodon = Math.max(1, codonCount - blockCodons - 1);
      const startCodon = Math.floor(random() * maxStartCodon);
      return deleteBlock(sequence, startCodon * 3, blockCodons * 3);
    }

    case 'shuffle_synonymous':
      return shuffleSynonymous(sequence, intensity, input.seed);

    case 'resynonymize_fraction':
      return resynonymizeFraction(sequence, intensity, input.seed);

    default:
      throw new Error(`Unsupported attack type: ${String(input.attackType)}`);
  }
}

export async function runAttack(input: AttackRequest): Promise<AttackResponse> {
  const original = input.sequence.toUpperCase();
  const applied = applyAttack(input);
  const attacked = applied.sequence;

  const proteinIntact = translate(original) === translate(attacked);

  let watermarkSurvived = false;
  let recoveryConfidence = 0;

  try {
    const layout = buildCarrierLayout(original);
    const outcome = await verifyAgainstReference(attacked, original, layout.positions);
    watermarkSurvived = Boolean(outcome.decoded?.macValid);
    recoveryConfidence = outcome.decoded?.confidence ?? 0;
  } catch {
    watermarkSurvived = false;
    recoveryConfidence = 0;
  }

  return {
    data: {
      attackType: input.attackType,
      intensity: input.intensity,
      watermarkSurvived,
      proteinIntact,
      mutationsApplied: applied.mutationsApplied,
      recoveryConfidence: Number(recoveryConfidence.toFixed(3)),
      breakPointEstimated: BREAK_POINTS[input.attackType],
    },
  };
}
