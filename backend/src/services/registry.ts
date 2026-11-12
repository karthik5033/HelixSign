import { createHash, randomUUID } from 'node:crypto';
import { sequenceSimilarity } from '@/core/sequence';
import type { RegistryStamp } from '@/types';
import { getDatabase, resetDatabase } from './sqlite';

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

interface StampRow {
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
  carrier_positions: string | null;
  capacity_used: number;
  capacity_total: number | null;
  created_at: string;
}

function parseCarrierPositions(value: string | null): number[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => Number(entry))
      .filter((entry) => Number.isInteger(entry) && entry >= 0);
  } catch {
    return [];
  }
}

function rowToRecord(row: StampRow): StampRecord {
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
    carrierPositions: parseCarrierPositions(row.carrier_positions),
    capacityUsed: row.capacity_used,
    capacityTotal: row.capacity_total ?? 0,
    createdAt: row.created_at,
  };
}

function codeForName(kind: CodeKind, name: string): number {
  const digest = createHash('sha256').update(`${kind}:${name}`, 'utf8').digest();
  return digest.readUInt16BE(0);
}

function assignCode(kind: CodeKind, name: string): number {
  const db = getDatabase();
  const existing = db
    .prepare('select code from entity_codes where kind = ? and name = ?')
    .get(kind, name) as { code: number } | undefined;
  if (existing) return Number(existing.code);

  const lookupCode = db.prepare('select name from entity_codes where kind = ? and code = ?');
  const insert = db.prepare('insert into entity_codes (kind, name, code) values (?, ?, ?)');
  const base = codeForName(kind, name);

  for (let offset = 0; offset < 0x10000; offset += 1) {
    const code = (base + offset) & 0xffff;
    const taken = lookupCode.get(kind, code) as { name: string } | undefined;
    if (taken) continue;

    try {
      insert.run(kind, name, code);
      return code;
    } catch (error) {
      // The name may have been inserted by another connection; re-read it.
      const raced = db
        .prepare('select code from entity_codes where kind = ? and name = ?')
        .get(kind, name) as { code: number } | undefined;
      if (raced) return Number(raced.code);
      if (offset === 0xffff) throw error;
    }
  }

  throw new Error(`Unable to allocate a ${kind} code`);
}

export async function getOrAssignCodes(input: {
  ownerName: string;
  projectName: string;
  batchName: string;
}): Promise<OwnershipCodes> {
  return {
    ownerCode: assignCode('owner', input.ownerName),
    projectCode: assignCode('project', input.projectName),
    batchCode: assignCode('batch', input.batchName),
  };
}

export async function insertStamp(
  input: StampInsert,
  codes: OwnershipCodes,
): Promise<StampRecord> {
  const db = getDatabase();

  const duplicate = db
    .prepare('select * from stamps where sequence_hash = ?')
    .get(input.sequenceHash) as unknown as StampRow | undefined;
  if (duplicate) return rowToRecord(duplicate);

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

  db.prepare(
    `insert into stamps (
      id, owner_code, owner_name, project_code, project_name, batch_code, batch_name,
      host, gene_name, sequence_hash, original_sequence_hash, stamped_sequence,
      carrier_positions, capacity_used, capacity_total, created_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.ownerCode,
    record.ownerName,
    record.projectCode,
    record.projectName,
    record.batchCode,
    record.batchName,
    record.host,
    record.geneName,
    record.sequenceHash,
    record.originalSequenceHash,
    record.stampedSequence,
    JSON.stringify(record.carrierPositions),
    record.capacityUsed,
    record.capacityTotal,
    record.createdAt,
  );

  return record;
}

export async function getStampById(id: string): Promise<StampRecord | null> {
  const row = getDatabase()
    .prepare('select * from stamps where id = ?')
    .get(id) as unknown as StampRow | undefined;
  return row ? rowToRecord(row) : null;
}

export async function getStampByHash(hash: string): Promise<StampRecord | null> {
  const row = getDatabase()
    .prepare('select * from stamps where sequence_hash = ?')
    .get(hash) as unknown as StampRow | undefined;
  return row ? rowToRecord(row) : null;
}

export async function listStamps(limit = 50, offset = 0): Promise<StampRecord[]> {
  const rows = getDatabase()
    .prepare('select * from stamps order by created_at desc limit ? offset ?')
    .all(limit, offset) as unknown as StampRow[];
  return rows.map(rowToRecord);
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
  const row = getDatabase()
    .prepare('select name from entity_codes where kind = ? and code = ?')
    .get(kind, code) as { name: string } | undefined;
  return row ? String(row.name) : null;
}

export async function databaseHealthy(): Promise<boolean> {
  try {
    getDatabase().prepare('select 1 as ok').get();
    return true;
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

/** Test helper: clear all rows while keeping the connection open. */
export function clearMemoryRegistry(): void {
  resetDatabase();
}
