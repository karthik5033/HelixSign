import { beforeEach, describe, expect, it } from 'vitest';
import { clearMemoryRegistry } from '@/services/registry';
import { stampSequence } from '@/services/stampService';
import { verifySequence, verifyAgainstReference } from '@/services/verifyService';
import {
  embed,
  extract,
  detect,
  applyChannel,
  mlServiceHealthy,
} from '@/services/mlClient';
import { translate } from '@/core/codons';
import { makeCds } from './helpers';

describe('HelixSign ML Microservice Integration (v1.5.0 Contract)', () => {
  beforeEach(() => {
    process.env.USE_STUBS = 'false';
    clearMemoryRegistry();
  });

  it('connects to live FastAPI /health endpoint with all services ready', async () => {
    const healthy = await mlServiceHealthy();
    expect(healthy).toBe(true);
  });

  it('executes live /ml/embed with strict protein translation invariance', async () => {
    const sequence = makeCds(60, 42);
    const codewordBits = [1, 0, 1, 1, 0];
    const carrierPositions = [1, 2, 3, 4, 5];

    const result = await embed(sequence, codewordBits, carrierPositions);
    expect(result.stampedSequence).toHaveLength(sequence.length);
    expect(result.proteinIdentical).toBe(true);
    expect(result.proteinTranslation).toBe(translate(sequence));
    expect(result.bioStats.gcBefore).toBeGreaterThan(0);
    expect(result.bioStats.caiSimilarity).toBeGreaterThan(0.5);
  });

  it('executes live /ml/extract with carrierStartOffsets and erasure offsets (Contract v1.5.0)', async () => {
    const sequence = 'ATGGCCAAGCTGAAATAA'; // Met (ATG), Ala (GCC), Lys (AAG), Leu (CTG), Lys (AAA), Stop (TAA)
    // Carrier offsets: GCC (offset 3), AAG (offset 6), null (erasure), AAA (offset 12)
    const carrierStartOffsets = [3, 6, null, 12];

    const result = await extract(sequence, undefined, 'E. coli K-12', carrierStartOffsets);
    expect(result.bitEstimates).toHaveLength(4);
    expect(result.confidences).toHaveLength(4);

    // Intact positions should have high confidence
    expect(result.confidences[0]).toBeGreaterThanOrEqual(0.5);
    expect(result.confidences[1]).toBeGreaterThanOrEqual(0.5);
    // Explicit null offset must produce confidence 0.0 (erasure)
    expect(result.confidences[2]).toBe(0.0);
    expect(result.confidences[3]).toBeGreaterThanOrEqual(0.5);
  });

  it('executes live /ml/detect with trained k-mer and 1D CNN models', async () => {
    const sequence = makeCds(120, 101);
    const result = await detect(sequence);

    expect(typeof result.kmerProbability).toBe('number');
    expect(typeof result.cnnProbability).toBe('number');
    expect(result.kmerProbability).toBeGreaterThanOrEqual(0);
    expect(result.kmerProbability).toBeLessThanOrEqual(1);
    expect(result.cnnProbability).toBeGreaterThanOrEqual(0);
    expect(result.cnnProbability).toBeLessThanOrEqual(1);
  });

  it('executes live /ml/channel noise simulation', async () => {
    const sequence = makeCds(60, 77);
    const result = await applyChannel(sequence, 0.05, 0.01, 123);

    expect(result.noisySequence).toBeDefined();
    expect(result.mutationsApplied).toBeGreaterThan(0);
  });

  it('executes full end-to-end stamp -> verify cycle through live ML microservice', async () => {
    const sequence = makeCds(240, 999);
    const request = {
      ownerName: 'QuantumBio Systems',
      projectName: 'Project Chimera',
      batchName: 'QC-2026-Alpha',
      sequence,
      host: 'E. coli K-12',
    };

    // 1. Stamp via live ML embedder
    const stampRes = await stampSequence(request);
    expect(stampRes.status).toBe('success');
    expect(stampRes.data.proteinIdentityPercent).toBe(100);
    expect(stampRes.data.stampedSequence).toHaveLength(sequence.length);

    // 2. Verify via live ML extractor
    const verifyRes = await verifySequence(stampRes.data.stampedSequence);
    expect(verifyRes.status).toBe('verified');
    expect(verifyRes.record?.ownerName).toBe(request.ownerName);
    expect(verifyRes.record?.projectName).toBe(request.projectName);
    expect(verifyRes.record?.batchName).toBe(request.batchName);
    expect(verifyRes.decoded?.macValid).toBe(true);
  });
});
