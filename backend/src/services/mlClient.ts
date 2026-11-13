import { createHash } from 'node:crypto';
import { bitsToBytes } from '@/core/payload';
import {
  embedCodeword,
  extractSoftBits,
  extractSoftBitsFromOffsets,
  type CodonMutation,
} from '@/core/embed';
import { mulberry32 } from '@/core/crypto';
import { BASES, eligibleCodonIndices, translate } from '@/core/codons';
import {
  codonUsageSimilarity,
  gcContent,
  longestHomopolymer,
  normalizeSequence,
} from '@/core/sequence';
import { getMlServiceUrl, isStubMode } from '@/lib/env';

export interface MlEmbedResult {
  stampedSequence: string;
  proteinTranslation: string;
  proteinIdentical: boolean;
  mutations: CodonMutation[];
  bioStats: {
    gcBefore: number;
    gcAfter: number;
    caiSimilarity: number;
    longestHomopolymer: number;
  };
}

export interface MlExtractResult {
  bitEstimates: number[];
  confidences: number[];
}

export interface MlDetectResult {
  kmerProbability: number;
  cnnProbability: number;
}

export interface MlChannelResult {
  noisySequence: string;
  mutationsApplied: number;
}

export interface MlNaiveResult {
  naiveSequence: string;
}

async function postJson<T>(path: string, body: unknown, timeoutMs = 8_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${getMlServiceUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`ML service responded ${response.status} for ${path}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function localEmbed(
  sequence: string,
  codewordBits: number[],
  carrierPositions: number[],
): MlEmbedResult {
  const paddedLen = Math.max(128, Math.ceil(codewordBits.length / 8) * 8);
  const padded = [...codewordBits];
  while (padded.length < paddedLen) padded.push(0);
  const codeword = bitsToBytes(padded.slice(0, 128));
  const result = embedCodeword(sequence, codeword, carrierPositions);
  const gcBefore = Number(gcContent(sequence).toFixed(2));
  const gcAfter = Number(gcContent(result.stampedSequence).toFixed(2));
  const caiSimilarity = Number(codonUsageSimilarity(sequence, result.stampedSequence).toFixed(4));

  return {
    stampedSequence: result.stampedSequence,
    proteinTranslation: translate(result.stampedSequence),
    proteinIdentical: result.proteinIdentical,
    mutations: result.mutations,
    bioStats: {
      gcBefore,
      gcAfter,
      caiSimilarity,
      longestHomopolymer: longestHomopolymer(result.stampedSequence),
    },
  };
}


export async function embed(
  sequence: string,
  codewordBits: number[],
  carrierPositions: number[],
  host = 'E. coli K-12',
): Promise<MlEmbedResult> {
  if (!isStubMode()) {
    try {
      return await postJson<MlEmbedResult>('/ml/embed', {
        sequence,
        codewordBits,
        carrierPositions,
        host,
      });
    } catch (error) {
      console.warn('[helixsign] ML embed unavailable; using local rule-based fallback:', error);
    }
  }
  return localEmbed(sequence, codewordBits, carrierPositions);
}

export async function extract(
  sequence: string,
  carrierPositions?: number[],
  host = 'E. coli K-12',
  carrierStartOffsets?: (number | null)[],
): Promise<MlExtractResult> {
  const useOffsets = carrierStartOffsets !== undefined && carrierStartOffsets.length > 0;
  if (!isStubMode()) {
    try {
      const payload: Record<string, unknown> = { sequence, host };
      if (useOffsets) {
        payload.carrierStartOffsets = carrierStartOffsets;
      } else if (carrierPositions !== undefined) {
        payload.carrierPositions = carrierPositions;
      }
      return await postJson<MlExtractResult>('/ml/extract', payload);
    } catch (error) {
      console.warn('[helixsign] ML extract unavailable; using local extraction fallback:', error);
    }
  }

  if (useOffsets && carrierStartOffsets) {
    const local = extractSoftBitsFromOffsets(sequence, carrierStartOffsets);
    return { bitEstimates: local.estimates, confidences: local.confidences };
  }
  const local = extractSoftBits(sequence, carrierPositions ?? []);
  return { bitEstimates: local.estimates, confidences: local.confidences };
}

function stubDetect(sequence: string): MlDetectResult {
  const digest = createHash('sha256').update(sequence, 'utf8').digest();
  const kmer = 0.46 + (digest[0] / 255) * 0.08;
  const cnn = 0.46 + (digest[1] / 255) * 0.08;
  return {
    kmerProbability: Number(kmer.toFixed(4)),
    cnnProbability: Number(cnn.toFixed(4)),
  };
}

export async function detect(sequence: string, naiveBaseline = false): Promise<MlDetectResult> {
  if (!isStubMode()) {
    try {
      return await postJson<MlDetectResult>('/ml/detect', { sequence });
    } catch (error) {
      console.warn('[helixsign] ML detect unavailable; using stub detector:', error);
    }
  }

  if (naiveBaseline) {
    const digest = createHash('sha256').update(sequence, 'utf8').digest();
    return {
      kmerProbability: Number((0.975 + (digest[0] / 255) * 0.02).toFixed(4)),
      cnnProbability: Number((0.968 + (digest[1] / 255) * 0.025).toFixed(4)),
    };
  }
  return stubDetect(sequence);
}

export async function naiveEncode(
  sequence: string,
  payloadBits?: number[],
): Promise<MlNaiveResult> {
  if (!isStubMode()) {
    try {
      return await postJson<MlNaiveResult>('/ml/naive-encode', { sequence, payloadBits });
    } catch (error) {
      console.warn('[helixsign] ML naive encoder unavailable; using local baseline:', error);
    }
  }

  const bases = [...normalizeSequence(sequence)];
  const bits =
    payloadBits && payloadBits.length > 0
      ? payloadBits
      : [...createHash('sha256').update(sequence).digest()].flatMap((byte) =>
          Array.from({ length: 8 }, (_, i) => (byte >> (7 - i)) & 1),
        );

  // A deliberately obvious fixed-stride tag: detectable by design, unlike
  // HelixSign's keyed synonymous carriers.
  const stride = 7;
  for (let i = 0; i < bits.length && i * stride < bases.length; i += 1) {
    bases[i * stride] = bits[i] === 1 ? 'C' : 'A';
  }

  return { naiveSequence: bases.join('') };
}

export function channel(
  sequence: string,
  substitutionRate: number,
  indelRate: number,
  seed = 42,
): MlChannelResult {
  const random = mulberry32(seed >>> 0);
  const bases = [...normalizeSequence(sequence)];
  const output: string[] = [];
  let mutationsApplied = 0;

  const substitute = (base: string): string => {
    const transitions: Record<string, string> = { A: 'G', G: 'A', C: 'T', T: 'C' };
    if (random() < 0.667) return transitions[base] ?? base;
    const options = (BASES as readonly string[]).filter((candidate) => candidate !== base);
    return options[Math.floor(random() * options.length)];
  };

  for (const base of bases) {
    if (substitutionRate > 0 && random() < substitutionRate) {
      output.push(substitute(base));
      mutationsApplied += 1;
    } else {
      output.push(base);
    }

    if (indelRate > 0 && random() < indelRate) {
      if (random() < 0.5) {
        output.pop();
      } else {
        output.push(BASES[Math.floor(random() * BASES.length)]);
      }
      mutationsApplied += 1;
    }
  }

  return { noisySequence: output.join(''), mutationsApplied };
}

export async function applyChannel(
  sequence: string,
  substitutionRate: number,
  indelRate: number,
  seed = 42,
): Promise<MlChannelResult> {
  if (!isStubMode()) {
    try {
      return await postJson<MlChannelResult>('/ml/channel', {
        sequence,
        substitutionRate,
        indelRate,
        seed,
      });
    } catch (error) {
      console.warn('[helixsign] ML channel unavailable; using local simulator:', error);
    }
  }
  return channel(sequence, substitutionRate, indelRate, seed);
}

export function bioStats(original: string, stamped: string): MlEmbedResult['bioStats'] {
  return {
    gcBefore: Number(gcContent(original).toFixed(2)),
    gcAfter: Number(gcContent(stamped).toFixed(2)),
    caiSimilarity: Number(codonUsageSimilarity(original, stamped).toFixed(4)),
    longestHomopolymer: longestHomopolymer(stamped),
  };
}

export function capacity(sequence: string): number {
  return eligibleCodonIndices(sequence).length;
}

export async function mlServiceHealthy(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1_500);
    try {
      const response = await fetch(`${getMlServiceUrl()}/health`, {
        signal: controller.signal,
      });
      return response.ok;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}
