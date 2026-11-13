import { alignToReference } from '@/core/align';
import { translate } from '@/core/codons';
import { changedRegions } from '@/core/sequence';
import type { TraceMatch, TraceResponse } from '@/types';
import { findCandidateStamps } from './registry';

export async function runTrace(suspectSequence: string): Promise<TraceResponse> {
  const suspect = suspectSequence.toUpperCase();
  const candidates = await findCandidateStamps(suspect, 5, 0.2);

  const matches: TraceMatch[] = candidates.map(({ stamp, similarity }) => {
    let regions: Array<{ start: number; end: number; type: string }> = [];

    try {
      if (stamp.stampedSequence.length === suspect.length) {
        const type =
          translate(stamp.stampedSequence) === translate(suspect)
            ? 'synonymous_shuffle'
            : 'point_mutation';
        regions = changedRegions(stamp.stampedSequence, suspect).map((region) => ({
          ...region,
          type,
        }));
      } else {
        const aligned = alignToReference(stamp.stampedSequence, suspect);
        regions = changedRegions(stamp.stampedSequence, aligned).map((region) => ({
          ...region,
          type: 'indel_or_trim',
        }));
      }
    } catch {
      regions = [];
    }

    return {
      stampId: stamp.id,
      owner: stamp.ownerName,
      project: stamp.projectName,
      batch: stamp.batchName,
      similarityPercent: Number((similarity * 100).toFixed(1)),
      confidence: Number(Math.min(0.999, 0.5 + similarity * 0.5).toFixed(3)),
      tamperedRegions: regions.slice(0, 25),
    };
  });

  return { status: 'success', data: { matches } };
}
