import { z } from 'zod';
import { ATTACK_TYPES } from './index';

const CodonMutationSchema = z.object({
  codonIndex: z.number().int().nonnegative(),
  fromCodon: z.string().length(3),
  toCodon: z.string().length(3),
  aminoAcid: z.string().length(1),
});

export const StampResponseSchema = z.object({
  status: z.literal('success'),
  data: z.object({
    stampId: z.string().min(1),
    owner: z.string().min(1),
    project: z.string().min(1),
    batch: z.string().min(1),
    originalSequenceLength: z.number().int().positive(),
    stampedSequence: z.string().regex(/^[ACGT]+$/),
    proteinTranslation: z.string().min(1),
    proteinIdentityPercent: z.number().min(0).max(100),
    mutations: z.array(CodonMutationSchema),
    stats: z.object({
      gcBefore: z.number().min(0).max(100),
      gcAfter: z.number().min(0).max(100),
      caiSimilarity: z.number().min(0).max(1),
      longestHomopolymer: z.number().int().nonnegative(),
      capacityUsed: z.number().int().nonnegative(),
      capacityTotal: z.number().int().nonnegative(),
    }),
    createdAt: z.string().min(1),
  }),
});

export const VerifyResponseSchema = z.object({
  status: z.enum(['verified', 'partially_recovered', 'not_found']),
  data: z
    .object({
      owner: z.string().min(1),
      project: z.string().min(1),
      batch: z.string().min(1),
      errorsCorrected: z.number().int().nonnegative(),
      confidenceScore: z.number().min(0).max(1),
      timestamp: z.string().min(1),
    })
    .nullable(),
});

const DetectorScoresSchema = z.object({
  kmerDetectorProb: z.number().min(0).max(1),
  cnnDetectorProb: z.number().min(0).max(1),
  aucScore: z.number().min(0).max(1),
});

export const StealthResponseSchema = z.object({
  data: z.object({
    naiveTag: DetectorScoresSchema,
    helixSign: DetectorScoresSchema,
  }),
});

export const StressResponseSchema = z.object({
  data: z.object({
    substitutionRate: z.number(),
    indelRate: z.number(),
    trials: z.number().int().positive(),
    recoveryRate: z.number().min(0).max(100),
    averageErrorsCorrected: z.number().nonnegative(),
    breakdownThresholdReached: z.boolean(),
    curve: z.array(
      z.object({
        noiseRate: z.number(),
        recoveryPercent: z.number().min(0).max(100),
      }),
    ),
  }),
});

export const AttackResponseSchema = z.object({
  data: z.object({
    attackType: z.enum(ATTACK_TYPES),
    intensity: z.number().min(0).max(1),
    watermarkSurvived: z.boolean(),
    proteinIntact: z.boolean(),
    mutationsApplied: z.number().int().nonnegative(),
    recoveryConfidence: z.number().min(0).max(1),
    breakPointEstimated: z.number().min(0).max(1),
  }),
});

export const TraceResponseSchema = z.object({
  data: z.object({
    matches: z.array(
      z.object({
        stampId: z.string().min(1),
        owner: z.string().min(1),
        project: z.string().min(1),
        batch: z.string().min(1),
        similarityPercent: z.number().min(0).max(100),
        confidence: z.number().min(0).max(1),
        tamperedRegions: z.array(
          z.object({
            start: z.number().int().nonnegative(),
            end: z.number().int().nonnegative(),
            type: z.string().min(1),
          }),
        ),
      }),
    ),
  }),
});

export const RegistryResponseSchema = z.object({
  stamps: z.array(
    z.object({
      id: z.string().min(1),
      owner: z.string().min(1),
      project: z.string().min(1),
      batch: z.string().min(1),
      sequenceHash: z.string().length(64),
      capacityUsed: z.number().int().nonnegative(),
      createdAt: z.string().min(1),
    }),
  ),
});

export const HealthResponseSchema = z.object({
  status: z.string().min(1),
  version: z.string().min(1),
  stubsActive: z.boolean(),
  mlServiceConnected: z.boolean(),
  databaseConnected: z.boolean(),
});
