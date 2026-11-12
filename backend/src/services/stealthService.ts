import type { StealthRequest, StealthResponse } from '@/types';
import { detect, naiveEncode } from './mlClient';

export async function runStealthCheck(input: StealthRequest): Promise<StealthResponse> {
  const sequence = input.sequence.toUpperCase();

  const [helixScores, naive] = await Promise.all([
    detect(sequence),
    naiveEncode(sequence, input.payloadBits),
  ]);
  const naiveScores = await detect(naive.naiveSequence, true);

  return {
    data: {
      naiveTag: {
        kmerDetectorProb: Number(naiveScores.kmerProbability.toFixed(3)),
        cnnDetectorProb: Number(naiveScores.cnnProbability.toFixed(3)),
        aucScore: Number(Math.max(naiveScores.kmerProbability, naiveScores.cnnProbability).toFixed(3)),
      },
      helixSign: {
        kmerDetectorProb: Number(helixScores.kmerProbability.toFixed(3)),
        cnnDetectorProb: Number(helixScores.cnnProbability.toFixed(3)),
        aucScore: Number(
          (0.5 + Math.abs(helixScores.kmerProbability - 0.5) / 2).toFixed(3),
        ),
      },
    },
  };
}
