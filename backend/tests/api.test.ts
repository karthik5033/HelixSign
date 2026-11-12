import { beforeEach, describe, expect, it } from 'vitest';
import { clearMemoryRegistry } from '@/services/registry';
import { resetRateLimits } from '@/lib/rateLimit';
import { GET as healthGet } from '@/app/api/health/route';
import { POST as stampPost } from '@/app/api/stamp/route';
import { POST as verifyPost } from '@/app/api/verify/route';
import { POST as stealthPost } from '@/app/api/stealth/route';
import { POST as stressPost } from '@/app/api/stress/route';
import { POST as attackPost } from '@/app/api/attack/route';
import { POST as tracePost } from '@/app/api/trace/route';
import { GET as registryGet } from '@/app/api/registry/route';
import {
  AttackResponseSchema,
  HealthResponseSchema,
  RegistryResponseSchema,
  StampResponseSchema,
  StealthResponseSchema,
  StressResponseSchema,
  TraceResponseSchema,
  VerifyResponseSchema,
} from '@/types/contracts';
import { makeCds } from './helpers';

const sequence = makeCds(240, 55);

function post(url: string, body: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function readJson(response: Response): Promise<unknown> {
  return response.json();
}

async function stamp(): Promise<ReturnType<typeof StampResponseSchema.parse>> {
  const response = await stampPost(
    post('http://localhost/api/stamp', {
      ownerName: 'ApexBio Lab',
      projectName: 'Project Helios',
      batchName: 'B-2026-X1',
      sequence,
      host: 'E. coli K-12',
    }),
  );
  expect(response.status).toBe(200);
  return StampResponseSchema.parse(await readJson(response));
}

describe('API contract', () => {
  beforeEach(() => {
    clearMemoryRegistry();
    resetRateLimits();
  });

  it('GET /api/health returns the documented shape', async () => {
    const response = await healthGet(new Request('http://localhost/api/health'));
    expect(response.status).toBe(200);
    const body = HealthResponseSchema.parse(await readJson(response));
    expect(body.status).toBe('ok');
    expect(body.stubsActive).toBe(true);
  });

  it('POST /api/stamp validates input and returns a contract-compliant result', async () => {
    const invalid = await stampPost(
      post('http://localhost/api/stamp', {
        ownerName: 'A',
        projectName: 'B',
        batchName: 'C',
        sequence: 'ATGGCC',
      }),
    );
    expect(invalid.status).toBe(400);

    const body = await stamp();
    expect(body.data.proteinIdentityPercent).toBe(100);
    expect(body.data.stats.capacityUsed).toBe(64);
  });

  it('POST /api/verify recovers a registered timestamp', async () => {
    const stamped = await stamp();
    const response = await verifyPost(
      post('http://localhost/api/verify', { sequence: stamped.data.stampedSequence }),
    );
    expect(response.status).toBe(200);
    const body = VerifyResponseSchema.parse(await readJson(response));
    expect(body.status).toBe('verified');
    expect(body.data?.owner).toBe('ApexBio Lab');
  });

  it('POST /api/verify returns not_found for an unrelated sequence', async () => {
    const response = await verifyPost(
      post('http://localhost/api/verify', { sequence: makeCds(240, 999) }),
    );
    const body = VerifyResponseSchema.parse(await readJson(response));
    expect(body.status).toBe('not_found');
  });

  it('POST /api/stealth returns impossible-to-miss naive scores and stealthy HelixSign scores', async () => {
    const stamped = await stamp();
    const response = await stealthPost(
      post('http://localhost/api/stealth', { sequence: stamped.data.stampedSequence }),
    );
    const body = StealthResponseSchema.parse(await readJson(response));
    expect(body.data.naiveTag.kmerDetectorProb).toBeGreaterThan(0.9);
    expect(body.data.helixSign.kmerDetectorProb).toBeLessThan(0.6);
  });

  it('POST /api/attack runs all documented attack types', async () => {
    const stamped = await stamp();
    for (const attackType of [
      'random_mutation',
      'trim_ends',
      'delete_block',
      'shuffle_synonymous',
      'resynonymize_fraction',
    ] as const) {
      const response = await attackPost(
        post('http://localhost/api/attack', {
          sequence: stamped.data.stampedSequence,
          attackType,
          intensity: 0.02,
          seed: 42,
        }),
      );
      expect(response.status).toBe(200);
      const body = AttackResponseSchema.parse(await readJson(response));
      expect(body.data.attackType).toBe(attackType);
      expect(body.data.mutationsApplied).toBeGreaterThanOrEqual(0);
    }
  });

  it('POST /api/trace ranks a modified construct', async () => {
    const stamped = await stamp();
    const suspect = stamped.data.stampedSequence
      .split('')
      .map((base, index) => (index % 37 === 0 && base === 'A' ? 'G' : base))
      .join('');
    const response = await tracePost(
      post('http://localhost/api/trace', { suspectSequence: suspect }),
    );
    const body = TraceResponseSchema.parse(await readJson(response));
    expect(body.data.matches.length).toBeGreaterThan(0);
    expect(body.data.matches[0].stampId).toBe(stamped.data.stampId);
  });

  it('POST /api/stress returns a recovery curve', async () => {
    const stamped = await stamp();
    const response = await stressPost(
      post('http://localhost/api/stress', {
        sequence: stamped.data.stampedSequence,
        substitutionRate: 0.01,
        indelRate: 0,
        trials: 2,
        seed: 42,
      }),
    );
    expect(response.status).toBe(200);
    const body = StressResponseSchema.parse(await readJson(response));
    expect(body.data.curve).toHaveLength(7);
    expect(body.data.recoveryRate).toBeGreaterThan(0);
  });

  it('GET /api/registry lists stamps with pagination', async () => {
    const stamped = await stamp();
    const response = await registryGet(
      new Request('http://localhost/api/registry?limit=10&offset=0'),
    );
    expect(response.status).toBe(200);
    const body = RegistryResponseSchema.parse(await readJson(response));
    expect(body.stamps.some((entry) => entry.id === stamped.data.stampId)).toBe(true);
  });

  it('rejects unsupported attack types and malformed JSON', async () => {
    const badAttack = await attackPost(
      post('http://localhost/api/attack', {
        sequence,
        attackType: 'crispr',
        intensity: 0.1,
      }),
    );
    expect(badAttack.status).toBe(400);

    const malformed = await stampPost(
      new Request('http://localhost/api/stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{oops',
      }),
    );
    expect(malformed.status).toBe(400);
  });
});
