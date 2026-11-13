import { z } from 'zod';

/** Uppercase a sequence and reject anything outside the DNA alphabet. */
export const DnaSequenceSchema = z
  .string()
  .trim()
  .min(1, 'Sequence is required')
  .transform((value) => value.toUpperCase().replace(/\s+/g, ''))
  .refine((value) => /^[ACGT]+$/.test(value), 'Sequence may contain only A, C, G and T');

export const CdsSequenceSchema = DnaSequenceSchema.refine(
  (value) => value.length % 3 === 0,
  'Coding sequence length must be a multiple of 3',
);

export const StampSequenceSchema = CdsSequenceSchema.refine(
  (value) => value.length >= 600,
  'Sequence must be at least 600 nucleotides',
);

export const StampRequestSchema = z.object({
  ownerName: z.string().trim().min(1).max(120),
  projectName: z.string().trim().min(1).max(120),
  batchName: z.string().trim().min(1).max(120),
  sequence: StampSequenceSchema,
  host: z.string().trim().min(1).max(120).default('E. coli K-12'),
  geneName: z.string().trim().min(1).max(120).optional(),
});

export const VerifyRequestSchema = z.object({
  sequence: DnaSequenceSchema,
});

export const StealthRequestSchema = z.preprocess(
  (val: unknown) => {
    if (val && typeof val === 'object') {
      const copy = { ...(val as Record<string, unknown>) };
      if (!copy.sequence && copy.stampedSequence) {
        copy.sequence = copy.stampedSequence;
      }
      return copy;
    }
    return val;
  },
  z.object({
    sequence: DnaSequenceSchema,
    payloadBits: z.array(z.number().int().min(0).max(1)).max(4096).optional(),
  })
);

export const StressRequestSchema = z.object({
  sequence: DnaSequenceSchema,
  substitutionRate: z.number().min(0.001).max(0.05),
  indelRate: z.number().min(0).max(0.02).default(0),
  trials: z.number().int().min(1).max(50).default(30),
  seed: z.number().int().min(0).max(0x7fffffff).default(42),
});

export const ATTACK_TYPES = [
  'random_mutation',
  'trim_ends',
  'delete_block',
  'shuffle_synonymous',
  'resynonymize_fraction',
] as const;

export type AttackType = (typeof ATTACK_TYPES)[number];

export const AttackRequestSchema = z.preprocess(
  (val: unknown) => {
    if (val && typeof val === 'object') {
      const copy = { ...(val as Record<string, unknown>) };
      if (!copy.attackType && copy.mode) {
        copy.attackType = copy.mode;
      }
      if (copy.attackType === 'synonymous') {
        copy.attackType = 'shuffle_synonymous';
      } else if (copy.attackType === 'mutation') {
        copy.attackType = 'random_mutation';
      } else if (copy.attackType === 'trim') {
        copy.attackType = 'trim_ends';
      } else if (copy.attackType === 'deletion') {
        copy.attackType = 'delete_block';
      }
      return copy;
    }
    return val;
  },
  z.object({
    sequence: DnaSequenceSchema,
    attackType: z.enum(ATTACK_TYPES),
    intensity: z.number().min(0).max(1),
    seed: z.number().int().min(0).max(0x7fffffff).default(42),
  })
);

export const TraceRequestSchema = z.object({
  suspectSequence: DnaSequenceSchema,
});

export const RegistryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type StampRequest = z.infer<typeof StampRequestSchema>;
export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;
export type StealthRequest = z.infer<typeof StealthRequestSchema>;
export type StressRequest = z.infer<typeof StressRequestSchema>;
export type AttackRequest = z.infer<typeof AttackRequestSchema>;
export type TraceRequest = z.infer<typeof TraceRequestSchema>;
export type RegistryQuery = z.infer<typeof RegistryQuerySchema>;

export interface CodonMutation {
  codonIndex: number;
  fromCodon: string;
  toCodon: string;
  aminoAcid: string;
}

export interface BioStats {
  gcBefore: number;
  gcAfter: number;
  caiSimilarity: number;
  longestHomopolymer: number;
  capacityUsed: number;
  capacityTotal: number;
}

export interface StampResponseData {
  stampId: string;
  owner: string;
  project: string;
  batch: string;
  originalSequenceLength: number;
  stampedSequence: string;
  proteinTranslation: string;
  proteinIdentityPercent: number;
  mutations: CodonMutation[];
  mutationsApplied?: number;
  stats: BioStats;
  createdAt: string;
}

export interface StampResponse {
  status: 'success';
  data: StampResponseData;
}

export type VerifyStatus = 'verified' | 'partially_recovered' | 'not_found';

export interface VerifyResponseData {
  owner: string;
  project: string;
  batch: string;
  errorsCorrected: number;
  confidenceScore: number;
  timestamp: string;
  verified?: boolean;
  status?: VerifyStatus;
}

export interface VerifyResponse {
  status: VerifyStatus;
  data: VerifyResponseData | null;
}

export interface DetectorScores {
  kmerDetectorProb: number;
  cnnDetectorProb: number;
  aucScore: number;
}

export interface StealthResponse {
  status?: string;
  data: {
    kmerProbability?: number;
    cnnProbability?: number;
    naiveTag: DetectorScores;
    helixSign: DetectorScores;
  };
}

export interface StressResponse {
  status?: string;
  data: {
    substitutionRate: number;
    indelRate: number;
    trials: number;
    recoveryRate: number;
    averageErrorsCorrected: number;
    breakdownThresholdReached: boolean;
    curve: Array<{ noiseRate: number; recoveryPercent: number }>;
  };
}

export interface AttackResponse {
  status?: string;
  data: {
    attackType: AttackType;
    intensity: number;
    watermarkSurvived: boolean;
    proteinIntact: boolean;
    mutationsApplied: number;
    recoveryConfidence: number;
    breakPointEstimated: number;
  };
}

export interface TraceMatch {
  stampId: string;
  owner: string;
  project: string;
  batch: string;
  similarityPercent: number;
  confidence: number;
  tamperedRegions: Array<{ start: number; end: number; type: string }>;
}

export interface TraceResponse {
  status?: string;
  data: {
    matches: TraceMatch[];
  };
}

export interface RegistryStamp {
  id: string;
  owner: string;
  project: string;
  batch: string;
  sequenceHash: string;
  capacityUsed: number;
  createdAt: string;
}

export interface RegistryResponse {
  stamps: RegistryStamp[];
}

export interface HealthResponse {
  status: string;
  version: string;
  stubsActive: boolean;
  mlServiceConnected: boolean;
  databaseConnected: boolean;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
