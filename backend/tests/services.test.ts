import { beforeEach, describe, expect, it } from 'vitest';
import { translate } from '@/core/codons';
import { clearMemoryRegistry } from '@/services/registry';
import { stampSequence } from '@/services/stampService';
import { verifyAndFormat } from '@/services/verifyService';
import { runAttack } from '@/services/attackService';
import { runStressTest } from '@/services/stressService';
import { runTrace } from '@/services/traceService';
import { verifyAgainstReference } from '@/services/verifyService';
import { channel } from '@/services/mlClient';
import { buildCarrierLayout } from '@/core/carrier';
import { shuffleSynonymous } from '@/attacks/synonymous';
import { makeCds } from './helpers';

const sequence = makeCds(240, 21);
const request = {
  ownerName: 'ApexBio Lab',
  projectName: 'Project Helios',
  batchName: 'B-2026-X1',
  sequence,
  host: 'E. coli K-12',
};

describe('stamp -> verify -> attack pipeline', () => {
  beforeEach(() => {
    clearMemoryRegistry();
  });

  it('stamps a CDS without changing the protein', async () => {
    const response = await stampSequence(request);
    expect(response.status).toBe('success');
    expect(response.data.stampedSequence).toHaveLength(sequence.length);
    expect(response.data.proteinTranslation).toBe(translate(sequence));
    expect(response.data.proteinIdentityPercent).toBe(100);
    expect(response.data.mutations.length).toBeGreaterThan(0);
    expect(response.data.stats.capacityUsed).toBe(64);
    expect(response.data.stats.capacityTotal).toBeGreaterThanOrEqual(128);
    expect(response.data.stats.gcBefore).toBeGreaterThan(0);
    expect(response.data.stats.caiSimilarity).toBeGreaterThan(0.5);
  });

  it('verifies the exact stamped sequence and recovers names', async () => {
    const stamped = await stampSequence(request);
    const verified = await verifyAndFormat(stamped.data.stampedSequence);
    expect(verified.status).toBe('verified');
    expect(verified.data?.owner).toBe(request.ownerName);
    expect(verified.data?.project).toBe(request.projectName);
    expect(verified.data?.batch).toBe(request.batchName);
    expect(verified.data?.confidenceScore).toBeGreaterThan(0.9);
  });

  it('recovers the payload after low-rate substitution noise', async () => {
    const stamped = await stampSequence(request);
    const layout = buildCarrierLayout(sequence);
    const noisy = channel(stamped.data.stampedSequence, 0.01, 0, 99);
    const outcome = await verifyAgainstReference(
      noisy.noisySequence,
      stamped.data.stampedSequence,
      layout.positions,
    );
    expect(outcome.status).toBe('verified');
    expect(outcome.decoded?.macValid).toBe(true);
  });

  it('keeps the watermark through synonymous shuffling', async () => {
    const stamped = await stampSequence(request);
    const attack = await runAttack({
      sequence: stamped.data.stampedSequence,
      attackType: 'shuffle_synonymous',
      intensity: 0.02,
      seed: 42,
    });
    expect(attack.data.proteinIntact).toBe(true);
    expect(attack.data.mutationsApplied).toBeGreaterThan(0);
    expect(attack.data.watermarkSurvived).toBe(true);
  });

  it('detects protein damage from random mutation', async () => {
    const stamped = await stampSequence(request);
    const attack = await runAttack({
      sequence: stamped.data.stampedSequence,
      attackType: 'random_mutation',
      intensity: 0.05,
      seed: 42,
    });
    expect(attack.data.proteinIntact).toBe(false);
    expect(attack.data.mutationsApplied).toBeGreaterThan(0);
  });

  it('runs a stress curve end to end', async () => {
    const stamped = await stampSequence(request);
    const stress = await runStressTest({
      sequence: stamped.data.stampedSequence,
      substitutionRate: 0.01,
      indelRate: 0,
      trials: 2,
      seed: 42,
    });
    expect(stress.data.trials).toBe(2);
    expect(stress.data.recoveryRate).toBeGreaterThan(0);
    expect(stress.data.curve).toHaveLength(7);
    expect(stress.data.curve[0].noiseRate).toBe(0.001);
  });

  it('traces a synonymously modified suspect back to its stamp', async () => {
    const stamped = await stampSequence(request);
    const suspect = shuffleSynonymous(stamped.data.stampedSequence, 0.1, 7).sequence;
    const trace = await runTrace(suspect);
    expect(trace.data.matches.length).toBeGreaterThan(0);
    expect(trace.data.matches[0].owner).toBe(request.ownerName);
    expect(trace.data.matches[0].similarityPercent).toBeGreaterThan(90);
  });
});
