/**
 * mlPipelineClient.ts — HelixSign Frontend Client for Backend & ML Microservice
 *
 * Provides typed methods for interacting with:
 * - Next.js Backend API routes (/api/stamp, /api/verify, /api/stress, /api/stealth, /api/health, /api/registry)
 * - FastAPI ML Microservice (/ml/detect, /ml/channel, /ml/codon-usage, /ml/extract, /ml/embed)
 */

export interface HealthStatus {
  status: string;
  version: string;
  stubsActive: boolean;
  mlServiceConnected: boolean;
  databaseConnected: boolean;
}

export interface StampMutation {
  codonIndex: number;
  fromCodon: string;
  toCodon: string;
  aminoAcid: string;
}

export interface StampResult {
  stampId: string;
  owner: string;
  project: string;
  batch: string;
  originalSequenceLength: number;
  stampedSequence: string;
  proteinTranslation: string;
  proteinIdentityPercent: number;
  mutations: StampMutation[];
  stats: {
    gcBefore: number;
    gcAfter: number;
    caiSimilarity: number;
    longestHomopolymer: number;
    capacityUsed: number;
    capacityTotal: number;
  };
  createdAt: string;
}

export interface VerifyResult {
  status: "verified" | "partially_recovered" | "not_found";
  data: {
    owner: string;
    project: string;
    batch: string;
    ownerCode: number;
    projectCode: number;
    batchCode: number;
    tilesDecoded: number;
    errorsCorrected: number;
    erasures: number;
    confidenceScore: number;
    similarity: number;
    aligned: boolean;
    carrierCount: number;
  } | null;
}

export interface StealthResult {
  kmerProbability: number;
  cnnProbability: number;
  degraded?: boolean;
  kmerAvailable?: boolean;
  cnnAvailable?: boolean;
}

export interface StressResult {
  trials: number;
  substitutionRate: number;
  indelRate: number;
  recoveryRate: number;
  meanErrorsCorrected: number;
  meanErasures: number;
  sampleResults: Array<{
    trial: number;
    status: string;
    errors: number;
    erasures: number;
    mutationsApplied: number;
  }>;
}

export interface RegistryItem {
  id: string;
  ownerName: string;
  projectName: string;
  batchName: string;
  host: string;
  geneName: string | null;
  sequenceHash: string;
  originalSequenceHash: string;
  stampedSequence: string;
  carrierPositions: number[];
  capacityUsed: number;
  capacityTotal: number;
  createdAt: string;
}

const API_TIMEOUT = 12000;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${errorBody || res.statusText}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Check health of backend & ML microservice */
export async function getHealthStatus(): Promise<HealthStatus> {
  try {
    return await request<HealthStatus>("/api/health");
  } catch (err) {
    return {
      status: "degraded",
      version: "0.1.0",
      stubsActive: false,
      mlServiceConnected: false,
      databaseConnected: false,
    };
  }
}

/** Stamp sequence with watermark using ML embedder */
export async function stampConstruct(params: {
  ownerName: string;
  projectName: string;
  batchName: string;
  sequence: string;
  host?: string;
  geneName?: string;
}): Promise<{ status: string; data: StampResult }> {
  return await request<{ status: string; data: StampResult }>("/api/stamp", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/** Verify sequence against watermark using ML extractor */
export async function verifyConstruct(sequence: string): Promise<VerifyResult> {
  return await request<VerifyResult>("/api/verify", {
    method: "POST",
    body: JSON.stringify({ sequence }),
  });
}

/** Run stealth evaluation via trained k-mer and CNN detectors */
export async function runStealthCheck(sequence: string): Promise<StealthResult> {
  try {
    const res = await request<{ status: string; data: StealthResult }>("/api/stealth", {
      method: "POST",
      body: JSON.stringify({ sequence }),
    });
    return res.data;
  } catch {
    // Direct fallback to ML microservice proxy
    return await request<StealthResult>("/ml/detect", {
      method: "POST",
      body: JSON.stringify({ sequence }),
    });
  }
}

/** Run multi-trial channel stress test */
export async function runStressTest(params: {
  sequence: string;
  substitutionRate: number;
  indelRate?: number;
  trials?: number;
  seed?: number;
}): Promise<{ status: string; data: StressResult }> {
  return await request<{ status: string; data: StressResult }>("/api/stress", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/** Fetch all registered stamped constructs */
export async function fetchRegistry(): Promise<RegistryItem[]> {
  try {
    const res = await request<{ status: string; data: RegistryItem[] }>("/api/registry");
    return res.data || [];
  } catch {
    return [];
  }
}

/** Simulate biological channel noise */
export async function simulateChannel(params: {
  sequence: string;
  substitutionRate: number;
  indelRate: number;
  seed?: number;
}): Promise<{ noisySequence: string; mutationsApplied: number }> {
  return await request<{ noisySequence: string; mutationsApplied: number }>("/ml/channel", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
