import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash, randomUUID } from 'node:crypto';
import { getSupabaseConfig, isDatabaseConfigured } from '@/lib/env';
import { sequenceSimilarity } from '@/core/sequence';
import type { RegistryStamp } from '@/types';

export interface StampRecord {
  id: string;
  ownerCode: number;
  ownerName: string;
  projectCode: number;
  projectName: string;
  batchCode: number;
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

export interface StampInsert {
  ownerName: string;
  projectName: string;
  batchName: string;
  host: string;
  geneName?: string | null;
  sequenceHash: string;
  originalSequenceHash: string;
  stampedSequence: string;
  carrierPositions: number[];
  capacityUsed: number;
  capacityTotal: number;
}

export interface OwnershipCodes {
  ownerCode: number;
  projectCode: number;
  batchCode: number;
}

type CodeKind = 'owner' | 'project' | 'batch';

interface DbStampRow {
  id: string;
  owner_code: number;
  owner_name: string;
  project_code: number;
  project_name: string;
  batch_code: number;
  batch_name: string;
  host: string | null;
  gene_name: string | null;
  sequence_hash: string;
  original_sequence_hash: string;
  stamped_sequence: string;
  carrier_positions: number[] | null;
  capacity_used: number;
  capacity_total: number | null;
  created_at: string;
}

const memoryStamps = new Map<string, StampRecord>();
const memorySequenceHashes = new Map<string, string>();
const memoryCodeByKey = new Map<string, number>();
const memoryNameByCode = new Map<string, string>();
const memoryUsedCodes = new Map<CodeKind, Set<number>>([
  ['owner', new Set()],
  ['project', new Set()],
  ['batch', new Set()],
]);

let client: SupabaseClient | null | undefined;

function getClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const config = getSupabaseConfig();
  if (!config) {
    client = null;
    return client;
  }
  client = createClient(config.url, config.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

function rowToRecord(row: DbStampRow): StampRecord {
  return {
    id: row.id,
    ownerCode: row.owner_code,
    ownerName: row.owner_name,
    projectCode: row.project_code,
    projectName: row.project_name,
    batchCode: row.batch_code,
    batchName: row.batch_name,
    host: row.host ?? 'E. coli K-12',
    geneName: row.gene_name,
    sequenceHash: row.sequence_hash,
    originalSequenceHash: row.original_sequence_hash,
    stampedSequence: row.stamped_sequence,
    carrierPositions: Array.isArray(row.carrier_positions) ? row.carrier_positions : [],
    capacityUsed: row.capacity_used,
    capacityTotal: row.capacity_total ?? 0,
    createdAt: row.created_at,
  };
}

function codeForName(kind: CodeKind, name: string): number {
  const digest = createHash('sha256').update(`${kind}:${name}`, 'utf8').digest();
  return digest.readUInt16BE(0);
}

function memoryAssignCode(kind: CodeKind, name: string): number {
  const key = `${kind}:${name}`;
  const existing = memoryCodeByKey.get(key);
  if (existing !== undefined) return existing;

  const used = memoryUsedCodes.get(kind)!;
  const base = codeForName(kind, name);
  let code = base;
  for (let offset = 0; offset < 0x10000; offset += 1) {
    code = (base + offset) & 0xffff;
    if (!used.has(code)) break;
  }
  used.add(code);
  memoryCodeByKey.set(key, code);
  memoryNameByCode.set(`${kind}:${code}`, name);
  return code;
}

function memoryAssignCodes(input: {
  ownerName: string;
  projectName: string;
  batchName: string;
}): OwnershipCodes {
  return {
    ownerCode: memoryAssignCode('owner', input.ownerName),
    projectCode: memoryAssignCode('project', input.projectName),
    batchCode: memoryAssignCode('batch', input.batchName),
  };
}

async function dbGetOrAssignCode(kind: CodeKind, name: string): Promise<number> {
  const supabase = getClient();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data: existing, error } = await supabase
    .from('entity_codes')
    .select('code')
    .eq('kind', kind)
    .eq('name', name)
    .maybeSingle();
  if (error) throw error;
  if (existing) return Number(existing.code);

  const base = codeForName(kind, name);
  for (let offset = 0; offset < 64; offset += 1) {
    const code = (base + offset) & 0xffff;
    const { data: taken, error: lookupError } = await supabase
      .from('entity_codes')
      .select('name')
      .eq('kind', kind)
      .eq('code', code)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (taken) continue;

    const { error: insertError } = await supabase.from('entity_codes').insert({ kind, name, code });
    if (!insertError) return code;
    // A concurrent writer may have claimed this code; retry with the next one.
  }
  throw new Error(`Unable to allocate a ${kind} code`);
}

export async function getOrAssignCodes(input: {
  ownerName: string;
  projectName: string;
  batchName: string;
}): Promise<OwnershipCodes> {
  if (isDatabaseConfigured()) {
    try {
      const [ownerCode, projectCode, batchCode] = await Promise.all([
        dbGetOrAssignCode('owner', input.ownerName),
        dbGetOrAssignCode('project', input.projectName),
        dbGetOrAssignCode('batch', input.batchName),
      ]);
      return { ownerCode, projectCode, batchCode };
    } catch (error) {
      console.warn('[helixsign] Supabase code allocation failed; using in-memory registry:', error);
    }
  }
  return memoryAssignCodes(input);
}

function memoryInsertStamp(input: StampInsert, codes: OwnershipCodes): StampRecord {
  const record: StampRecord = {
    id: `stmp_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
    ownerCode: codes.ownerCode,
    ownerName: input.ownerName,
    projectCode: codes.projectCode,
    projectName: input.projectName,
    batchCode: codes.batchCode,
    batchName: input.batchName,
    host: input.host,
    geneName: input.geneName ?? null,
    sequenceHash: input.sequenceHash,
    originalSequenceHash: input.originalSequenceHash,
    stampedSequence: input.stampedSequence,
    carrierPositions: input.carrierPositions,
    capacityUsed: input.capacityUsed,
    capacityTotal: input.capacityTotal,
    createdAt: new Date().toISOString(),
  };
  memoryStamps.set(record.id, record);
  memorySequenceHashes.set(record.sequenceHash, record.id);
  return record;
}

export async function insertStamp(
  input: StampInsert,
  codes: OwnershipCodes,
): Promise<StampRecord> {
  if (isDatabaseConfigured()) {
    const supabase = getClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('stamps')
        .insert({
          owner_code: codes.ownerCode,
          owner_name: input.ownerName,
          project_code: codes.projectCode,
          project_name: input.projectName,
          batch_code: codes.batchCode,
          batch_name: input.batchName,
          host: input.host,
          gene_name: input.geneName ?? null,
          sequence_hash: input.sequenceHash,
          original_sequence_hash: input.originalSequenceHash,
          stamped_sequence: input.stampedSequence,
          carrier_positions: input.carrierPositions,
          capacity_used: input.capacityUsed,
          capacity_total: input.capacityTotal,
        })
        .select('*')
        .single();

      if (!error && data) return rowToRecord(data as DbStampRow);
      console.warn('[helixsign] Supabase insert failed; using in-memory registry:', error);
    }
  }
  return memoryInsertStamp(input, codes);
}

export async function getStampById(id: string): Promise<StampRecord | null> {
  const supabase = getClient();
  if (supabase) {
    const { data, error } = await supabase.from('stamps').select('*').eq('id', id).maybeSingle();
    if (!error && data) return rowToRecord(data as DbStampRow);
  }
  return memoryStamps.get(id) ?? null;
}

export async function getStampByHash(hash: string): Promise<StampRecord | null> {
  const supabase = getClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('stamps')
      .select('*')
      .eq('sequence_hash', hash)
      .maybeSingle();
    if (!error && data) return rowToRecord(data as DbStampRow);
  }
  const id = memorySequenceHashes.get(hash);
  return id ? memoryStamps.get(id) ?? null : null;
}

export async function listStamps(limit = 50, offset = 0): Promise<StampRecord[]> {
  const supabase = getClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('stamps')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (!error && data) return (data as DbStampRow[]).map(rowToRecord);
  }

  return [...memoryStamps.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(offset, offset + limit);
}

export async function listAllStamps(limit = 2000): Promise<StampRecord[]> {
  return listStamps(limit, 0);
}

export interface CandidateStamp {
  stamp: StampRecord;
  similarity: number;
}

/** Registry-assisted candidate search used by verification and forensic trace. */
export async function findCandidateStamps(
  sequence: string,
  limit = 5,
  threshold = 0.2,
): Promise<CandidateStamp[]> {
  const stamps = await listAllStamps();
  return stamps
    .map((stamp) => ({ stamp, similarity: sequenceSimilarity(sequence, stamp.stampedSequence) }))
    .filter((candidate) => candidate.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

export async function getEntityName(kind: CodeKind, code: number): Promise<string | null> {
  const supabase = getClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('entity_codes')
      .select('name')
      .eq('kind', kind)
      .eq('code', code)
      .maybeSingle();
    if (!error && data) return String(data.name);
  }
  return memoryNameByCode.get(`${kind}:${code}`) ?? null;
}

export async function databaseHealthy(): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  const supabase = getClient();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('stamps').select('id', { head: true, count: 'exact' }).limit(1);
    return !error;
  } catch {
    return false;
  }
}

export function toRegistryStamp(record: StampRecord): RegistryStamp {
  return {
    id: record.id,
    owner: record.ownerName,
    project: record.projectName,
    batch: record.batchName,
    sequenceHash: record.sequenceHash,
    capacityUsed: record.capacityUsed,
    createdAt: record.createdAt,
  };
}

/** Test helper. */
export function clearMemoryRegistry(): void {
  memoryStamps.clear();
  memorySequenceHashes.clear();
  memoryCodeByKey.clear();
  memoryNameByCode.clear();
  memoryUsedCodes.forEach((set) => set.clear());
}
