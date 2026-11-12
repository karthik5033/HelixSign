import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Local SQLite registry. The schema is created automatically on first open.
 * Set DATABASE_PATH=:memory: for tests or ephemeral runs.
 */
const SCHEMA = `
  create table if not exists stamps (
    id text primary key,
    owner_code integer not null check (owner_code between 0 and 65535),
    owner_name text not null,
    project_code integer not null check (project_code between 0 and 65535),
    project_name text not null,
    batch_code integer not null check (batch_code between 0 and 65535),
    batch_name text not null,
    host text not null default 'E. coli K-12',
    gene_name text,
    sequence_hash text not null,
    original_sequence_hash text not null,
    stamped_sequence text not null,
    carrier_positions text not null default '[]',
    capacity_used integer not null default 64,
    capacity_total integer not null default 0,
    created_at text not null
  );

  create unique index if not exists idx_stamps_sequence_hash on stamps(sequence_hash);
  create index if not exists idx_stamps_owner on stamps(owner_code);
  create index if not exists idx_stamps_created_at on stamps(created_at desc);

  create table if not exists entity_codes (
    kind text not null check (kind in ('owner', 'project', 'batch')),
    name text not null,
    code integer not null check (code between 0 and 65535),
    created_at text not null default (datetime('now')),
    primary key (kind, name),
    unique (kind, code)
  );
`;

let database: DatabaseSync | null = null;
let databasePath: string | null = null;

export function resolveDatabasePath(): string {
  const configured = process.env.DATABASE_PATH?.trim();
  if (!configured) return resolve(process.cwd(), 'data', 'helixsign.db');
  if (configured === ':memory:') return configured;
  return resolve(process.cwd(), configured);
}

export function getDatabase(): DatabaseSync {
  if (database) return database;

  databasePath = resolveDatabasePath();
  if (databasePath !== ':memory:') {
    mkdirSync(dirname(databasePath), { recursive: true });
  }

  database = new DatabaseSync(databasePath);
  database.exec('PRAGMA journal_mode = WAL;');
  database.exec('PRAGMA foreign_keys = ON;');
  database.exec(SCHEMA);
  return database;
}

export function getDatabasePath(): string {
  if (!databasePath) getDatabase();
  return databasePath ?? resolveDatabasePath();
}

/** Delete all registry rows without closing the connection (test helper). */
export function resetDatabase(): void {
  const db = getDatabase();
  db.exec('DELETE FROM stamps; DELETE FROM entity_codes;');
}

/** Close the connection so a new DATABASE_PATH can take effect (test helper). */
export function closeDatabase(): void {
  if (!database) return;
  database.close();
  database = null;
  databasePath = null;
}
