# HelixSign Backend

Node.js / TypeScript API and orchestration engine for HelixSign. It owns the
64-bit payload, Reed-Solomon framing, HKDF carrier selection, the attacker
arena, the provenance registry, and the bridge to the ML inference service.

## Quick start

```bash
cd backend
npm install
cp .env.example .env.local   # fill MASTER_KEY for anything beyond local stubs
npm run dev                  # http://127.0.0.1:3001
```

`USE_STUBS=true` (the default when unset) keeps the whole API functional with a
deterministic local ML fallback. The registry is SQLite, so no Python service,
database server, or cloud account is required for local development.

### Environment

| Variable | Purpose |
| --- | --- |
| `MASTER_KEY` | 32-byte hex master secret for HKDF and payload MACs. Required outside local dev. |
| `DATABASE_PATH` | SQLite registry file, default `./data/helixsign.db`. Use `:memory:` for ephemeral runs. |
| `USE_STUBS` | `true` (default) uses the local ML fallback; `false` calls `ML_SERVICE_URL`. |
| `ML_SERVICE_URL` | Person 3's FastAPI service, default `http://127.0.0.1:8000`. |
| `ALLOWED_ORIGINS` | Comma-separated frontend origins for CORS. |

## API

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/stamp` | Embed a payload and register the construct. |
| `POST` | `/api/verify` | Registry-assisted extraction and MAC verification. |
| `POST` | `/api/stealth` | Compare naive-tag and HelixSign detector scores. |
| `POST` | `/api/stress` | Substitution/indel recovery curve. |
| `POST` | `/api/attack` | Run one of the five attacker-arena vectors. |
| `POST` | `/api/trace` | Rank registry matches for a suspect construct. |
| `GET` | `/api/registry` | Paginated stamp list (`limit`, `offset`). |
| `GET` | `/api/health` | Stub, ML, and database status. |

Request and response shapes are frozen in `../contracts/api-spec.json`. The
backend never returns the master key or carrier positions.

## Core design

- **Payload** (`src/core/payload.ts`): `owner:16 | project:16 | batch:16 | MAC:16`.
  The MAC is a truncated HMAC over the first six bytes using a key derived from
  the owner code.
- **ECC** (`src/core/ecc.ts`): systematic Reed-Solomon over GF(2^8), 8 data +
  8 parity bytes. Corrects up to 4 byte errors or 8 byte erasures per codeword.
- **Crypto** (`src/core/crypto.ts`): HKDF key derivation, HMAC-DRBG stream, and
  constant-time MAC comparison.
- **Carriers** (`src/core/carrier.ts`): every eligible codon is a carrier. The
  128-bit codeword repeats modulo 128, so a partial final copy still contributes
  redundant bit votes.
- **Attacks** (`src/attacks/`): random mutation, end trimming, block deletion,
  synonymous shuffle, and synonymous re-encoding.
- **Verification** (`src/services/verifyService.ts`): exact hash lookup, then
  registry-assisted alignment, then self-layout fallback. Carrier positions are
  reused from the registered reference after indels or trimming.

## Registry

The registry is a local SQLite database (`backend/data/helixsign.db` by
default). The schema is created automatically on first open, so there is no
migration step and no external service to configure. The database stores the
stamped sequence and carrier positions, so forensic trace and indel-tolerant
verification survive process restarts.

SQLite needs a persistent filesystem. If the backend is later deployed to a
serverless platform with read-only or ephemeral storage, point `DATABASE_PATH`
at a mounted volume or replace the registry adapter with a hosted Postgres.

## Tests

```bash
npm test          # unit + API contract tests
npm run typecheck # tsc --noEmit
npm run lint      # ESLint
npm run build     # Next.js production build
```

The suite covers Reed-Solomon error/erasure correction, payload MAC tampering,
HKDF determinism, protein-preserving attacks, stamp/verify/attack/stress/trace
flows, and contract validation for every documented endpoint.
