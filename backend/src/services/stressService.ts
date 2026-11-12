import { buildCarrierLayout, CapacityError } from '@/core/carrier';
import { ApiError } from '@/lib/http';
import type { StressRequest, StressResponse } from '@/types';
import { channel } from './mlClient';
import { verifyAgainstReference } from './verifyService';

const CURVE_RATES = [0.001, 0.005, 0.01, 0.02, 0.03, 0.04, 0.05];

interface TrialSummary {
  recovered: number;
  trials: number;
  errorsCorrected: number;
}

async function runTrials(
  sequence: string,
  substitutionRate: number,
  indelRate: number,
  trials: number,
  seed: number,
  positions: number[],
): Promise<TrialSummary> {
  let recovered = 0;
  let errorsCorrected = 0;

  for (let trial = 0; trial < trials; trial += 1) {
    const noisy = channel(sequence, substitutionRate, indelRate, seed + trial * 7919);
    try {
      const outcome = await verifyAgainstReference(noisy.noisySequence, sequence, positions);
      if (outcome.decoded?.macValid) recovered += 1;
      errorsCorrected += outcome.decoded?.errorsCorrected ?? 0;
    } catch {
      // An unrecoverable alignment counts as a failed trial.
    }
  }

  return { recovered, trials, errorsCorrected };
}

export async function runStressTest(input: StressRequest): Promise<StressResponse> {
  const sequence = input.sequence.toUpperCase();
  let layout;
  try {
    layout = buildCarrierLayout(sequence);
  } catch (error) {
    if (error instanceof CapacityError) {
      throw new ApiError(422, 'INSUFFICIENT_CAPACITY', error.message);
    }
    throw error;
  }

  const main = await runTrials(
    sequence,
    input.substitutionRate,
    input.indelRate,
    input.trials,
    input.seed,
    layout.positions,
  );

  const curveTrials = Math.min(input.trials, 12);
  const curve: Array<{ noiseRate: number; recoveryPercent: number }> = [];
  for (const rate of CURVE_RATES) {
    const summary = await runTrials(
      sequence,
      rate,
      input.indelRate,
      curveTrials,
      input.seed + Math.round(rate * 1_000_000),
      layout.positions,
    );
    curve.push({
      noiseRate: rate,
      recoveryPercent: Number(((summary.recovered / summary.trials) * 100).toFixed(1)),
    });
  }

  const recoveryRate = Number(((main.recovered / main.trials) * 100).toFixed(1));
  const averageErrorsCorrected = Number((main.errorsCorrected / main.trials).toFixed(2));

  return {
    data: {
      substitutionRate: input.substitutionRate,
      indelRate: input.indelRate,
      trials: input.trials,
      recoveryRate,
      averageErrorsCorrected,
      breakdownThresholdReached: recoveryRate < 90,
      curve,
    },
  };
}
