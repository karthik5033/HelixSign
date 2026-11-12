-- HelixSign registry schema (Supabase / PostgreSQL)
-- Run this once in the Supabase SQL editor before setting SUPABASE_URL and
-- SUPABASE_SERVICE_KEY. The backend falls back to an in-memory registry when
-- these variables are absent, so local development never blocks on the DB.

create extension if not exists pgcrypto;

create table if not exists stamps (
  id uuid primary key default gen_random_uuid(),
  owner_code integer not null,
  owner_name text not null,
  project_code integer not null,
  project_name text not null,
  batch_code integer not null,
  batch_name text not null,
  host text not null default 'E. coli K-12',
  gene_name text,
  sequence_hash text not null unique,
  original_sequence_hash text not null,
  stamped_sequence text not null,
  carrier_positions jsonb not null default '[]'::jsonb,
  capacity_used integer not null default 64,
  capacity_total integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_stamps_owner on stamps(owner_code);
create index if not exists idx_stamps_seq_hash on stamps(sequence_hash);
create index if not exists idx_stamps_created_at on stamps(created_at desc);

-- 16-bit namespace codes are allocated once per human-readable name.
create table if not exists entity_codes (
  kind text not null check (kind in ('owner', 'project', 'batch')),
  name text not null,
  code integer not null check (code between 0 and 65535),
  created_at timestamptz not null default now(),
  primary key (kind, name),
  unique (kind, code)
);

-- The backend uses the service-role key, so RLS can stay enabled with no
-- public policies. Never expose this key to the browser.
alter table stamps enable row level security;
alter table entity_codes enable row level security;
