# HelixSign - Backend Developer Guide (Person 2)

**Owner:** Backend Lead (Person 2)  
**Assigned Folder:** `backend/`  
**Tech Stack:** Next.js (TypeScript) API Route Handlers / TypeScript Backend Server, Node.js, Zod (Validation), Supabase (PostgreSQL), Crypto (`node:crypto` HMAC/HKDF), Reed-Solomon ECC Library  
**Role:** Complete ownership of API endpoints, cryptography, Reed-Solomon error correction coding, attack simulation suite, database registry, and the ML inference bridge.

---

## 1. Executive Summary & Context

**HelixSign** provides stealthy, damage-resistant ownership tagging for engineered DNA constructs. The backend acts as the authoritative orchestration engine:
1. It frames compact 64-bit ownership payloads and applies **Reed-Solomon error correction code (ECC)**.
2. It deterministically derives carrier codon positions using **HKDF cryptographic keys**.
3. It dispatches encoding and detector tasks to the ML service (or internal stubs).
4. It executes the **Attacker Arena** mutation suite.
5. It logs and queries watermark provenance in the **Supabase Registry** (Forensic Trace).

---

## 2. Zero-Conflict Golden Rules ("3-Folder Work")

To prevent merge collisions with the Frontend and ML leads:

| Boundary Rule | Specification |
| :--- | :--- |
| **Your Exclusive Territory** | `backend/**` (All API route handlers, business logic, crypto modules, ECC logic, database clients, and tests) |
| **Strictly Read-Only** | `contracts/` (Shared JSON schema and API contracts) |
| **Off-Limits** | `frontend/**` (Person 1's UI) and `ml/**` (Person 3's Python training & model weights) |
| **Dependencies** | Run `npm` / `pnpm` / `yarn` ONLY inside `backend/`. Maintain `backend/package.json`. |
| **Secrets & Env** | Store secrets (`MASTER_KEY`, `SUPABASE_SERVICE_KEY`) strictly in `backend/.env.local`. Commit only `backend/.env.example` with blank values. |

---

## 3. Git Branching & Collaboration Workflow

### Branch Strategy
- **Base Branch:** `develop` (never branch off individual feature branches or `main`).
- **Your Branch Namespace:** `feat/backend/<feature-name>`

Examples:
- `feat/backend/api-scaffold-and-stubs`
- `feat/backend/reed-solomon-coding`
- `feat/backend/hkdf-carrier-crypto`
- `feat/backend/supabase-registry`
- `feat/backend/attack-suite-engine`
- `feat/backend/ml-bridge-client`

### Daily Git Routine
```bash
# 1. Switch to develop and pull latest
git checkout develop
git pull origin develop

# 2. Merge develop into your feature branch
git checkout feat/backend/reed-solomon-coding
git merge develop

# 3. Work strictly inside backend/
git status # Verify NO files outside backend/ are touched!

# 4. Commit and push
git add backend/
git commit -m "feat(backend): implement 16-byte Reed-Solomon ECC encoder/decoder"
git push origin feat/backend/reed-solomon-coding
```

---

## 4. Architecture & Core Modules

```
backend/
├── src/
│   ├── app/api/                     # Next.js TypeScript API Route Handlers
│   │   ├── stamp/route.ts           # POST /api/stamp
│   │   ├── verify/route.ts          # POST /api/verify
│   │   ├── stealth/route.ts         # POST /api/stealth
│   │   ├── stress/route.ts          # POST /api/stress
│   │   ├── attack/route.ts          # POST /api/attack
│   │   ├── trace/route.ts           # POST /api/trace
│   │   └── registry/route.ts        # GET /api/registry
│   ├── core/
│   │   ├── payload.ts               # 64-bit compact payload packaging (Owner, Project, Batch, Check)
│   │   ├── crypto.ts                # HKDF key derivation & keyed MAC verification
│   │   ├── ecc.ts                   # Reed-Solomon encoding & decoding (8 data + 8 parity bytes)
│   │   └── carrier.ts               # Key-derived pseudorandom carrier position generator
│   ├── attacks/
│   │   ├── mutation.ts              # Random substitution mutations (transitions/transversions)
│   │   ├── trimming.ts              # 5' and 3' terminal sequence trimming
│   │   ├── deletion.ts              # Contiguous block deletion
│   │   └── synonymous.ts            # Synonymous codon shuffle & re-encoding
│   ├── services/
│   │   ├── registry.ts              # Supabase PostgreSQL client & query methods
│   │   └── mlClient.ts              # HTTP bridge to Person 3's ML service (with stub fallback)
│   └── types/
│       └── index.ts                 # Zod validation schemas & TypeScript types
├── package.json
└── .env.example
```

---

## 5. Technical Specifications & Business Logic

### 5.1 Compact 64-bit Payload Packaging (`core/payload.ts`)
DNA capacity is precious. Do not store full text strings inside the DNA sequence:
- **Owner Code:** 16-bit unsigned integer (0–65535)
- **Project Code:** 16-bit unsigned integer (0–65535)
- **Batch Code:** 16-bit unsigned integer (0–65535)
- **Check MAC:** 16-bit truncated HMAC computed over `[Owner || Project || Batch]` using the derived key.
- **Total Raw Payload:** 8 bytes (64 bits). Human-readable names are stored in the database registry mapped to these codes.

### 5.2 Reed-Solomon Error Correction Code (ECC) (`core/ecc.ts`)
- Take the 8-byte payload and encode it into a **16-byte codeword** (8 data bytes + 8 parity bytes).
- Standard Galois Field $GF(2^8)$.
- Corrects up to **4 byte errors** (or up to 8 erasures) per 16-byte block.
- For coding sequences with high capacity, **tile** (repeat) the 16-byte codeword across multiple blocks and perform majority voting at verification time.

### 5.3 Key Derivation & Carrier Selection (`core/crypto.ts` & `core/carrier.ts`)
- **Master Secret:** Loaded from `process.env.MASTER_KEY`.
- **Per-Owner Secret:** Derived via HKDF: `HKDF(master_key, salt=owner_code, info="HelixSign-Carrier-v1")`.
- **Carrier Positions:** Seed a cryptographic PRNG (e.g., ChaCha20 or HMAC-DRBG) with the derived key. Permute all eligible codon indices in the sequence to pick the carrier locations.
- **Security Rule:** Neither the carrier positions nor keys are ever sent to the client browser!

### 5.4 Attack Suite Engine (`attacks/`)
Implements the threat models for the **Attacker Arena**:
1. `random_mutation(seq, rate, seed)`: Substitutes nucleotides at rate `p` (default 1% to 10%).
2. `trim_ends(seq, length5p, length3p)`: Strips `N` nucleotides from either end.
3. `delete_block(seq, startCodon, lengthCodons)`: Simulates partial construct deletion.
4. `shuffle_synonymous(seq, fraction, seed)`: Shuffles synonymous codon choices across identical amino acids (guarantees protein identity = 100%).
5. `resynonymize_fraction(seq, fraction, seed)`: Re-encodes codons with alternative synonymous choices (adversarial rewrite attack).

### 5.5 Supabase Database Schema (`services/registry.ts`)
```sql
CREATE TABLE stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_code INT NOT NULL,
  owner_name TEXT NOT NULL,
  project_code INT NOT NULL,
  project_name TEXT NOT NULL,
  batch_code INT NOT NULL,
  batch_name TEXT NOT NULL,
  host_organism TEXT DEFAULT 'E. coli K-12',
  gene_name TEXT,
  sequence_hash TEXT NOT NULL UNIQUE,       -- SHA-256 of stamped sequence
  original_sequence_hash TEXT NOT NULL,     -- SHA-256 of original input
  stamped_sequence TEXT NOT NULL,
  capacity_used INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stamps_owner ON stamps(owner_code);
CREATE INDEX idx_stamps_seq_hash ON stamps(sequence_hash);
```

---

## 6. ML Service Integration & Stub Mode (`USE_STUBS=true`)

In `backend/.env.local`:
```bash
PORT=3001
MASTER_KEY="your-32-byte-hex-master-key"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_KEY="your-supabase-service-key"
USE_STUBS=true
ML_SERVICE_URL="http://127.0.0.1:8000"
```

### The `USE_STUBS` Mechanism
When `USE_STUBS=true`:
- The backend does **not** make any HTTP calls to Person 3's ML Python service.
- It returns realistic, deterministic stub responses for:
  - Codon embedding: flips synonymous codons at carrier positions and returns mock codon diffs.
  - Detectors: returns mock synthetic probabilities (Naive: 0.99, HelixSign: 0.51).
  - Noise channel: introduces synthetic mutations.
  - Bio stats: computes quick GC% and homopolymers locally.

When Person 3 has the Python ML service running on `http://127.0.0.1:8000`:
- Flip `USE_STUBS=false` in `backend/.env.local`.
- The backend calls the Python API endpoints:
  - `POST http://127.0.0.1:8000/ml/embed`
  - `POST http://127.0.0.1:8000/ml/extract`
  - `POST http://127.0.0.1:8000/ml/detect`
  - `POST http://127.0.0.1:8000/ml/channel`

---

## 7. API Endpoints Specification

### 1. `POST /api/stamp`
- **Request:**
  ```json
  {
    "ownerName": "ApexBio Lab",
    "projectName": "Project Helios",
    "batchName": "B-2026-X1",
    "sequence": "ATGGCCAAG...TAA",
    "host": "E. coli K-12"
  }
  ```
- **Validation:** Sequence must contain only A, C, G, T; length must be a multiple of 3; length ≥ 600 nt.
- **Workflow:** 
  1. Look up or assign 16-bit codes for owner, project, batch.
  2. Pack 64-bit payload and encode via Reed-Solomon.
  3. Derive carrier codon positions with HKDF.
  4. Call `mlClient.embed()` to embed codeword into CDS.
  5. Compute sequence hash and insert into Supabase `stamps` table.
  6. Return stamped FASTA, diff list, and bio metrics.

### 2. `POST /api/verify`
- **Request:** `{ "sequence": "ATGGCCAAG...TAA" }`
- **Workflow:**
  1. Call `mlClient.extract()` to read bit estimates from carriers.
  2. Decode codeword using Reed-Solomon (correcting any symbol errors).
  3. Verify 16-bit check MAC.
  4. Query Supabase registry by `owner_code`.
  5. Return verification status, recovered metadata, and error-correction stats.

### 3. `POST /api/stealth`
- **Request:** `{ "sequence": "ATGGCCAAG...TAA", "payloadBits": [ ... ] }`
- **Workflow:**
  1. Call `mlClient.detect(sequence)` for HelixSign.
  2. Generate naive tag baseline sequence via `mlClient.naiveEncode()`.
  3. Call `mlClient.detect()` for naive sequence.
  4. Return comparative detector probabilities and AUC metrics.

### 4. `POST /api/stress`
- **Request:** `{ "sequence": "ATGGCCAAG...TAA", "substitutionRate": 0.02, "indelRate": 0.005, "trials": 30 }`
- **Workflow:** Runs `N` trials through the channel simulator, attempts verification on each, and returns the percentage recovery curve.

### 5. `POST /api/attack`
- **Request:** `{ "sequence": "ATGGCCAAG...TAA", "attackType": "shuffle_synonymous", "intensity": 0.15 }`
- **Workflow:** Executes the attack algorithm, checks if the translation is intact, checks if the watermark survives, and returns the verdict.

### 6. `POST /api/trace`
- **Request:** `{ "suspectSequence": "ATGGCCAAG...TAA" }`
- **Workflow:** Queries Supabase registry, runs pairwise similarity / k-mer alignment, and returns top matching original constructs.

### 7. `GET /api/registry`
- **Workflow:** Returns list of all stamped constructs with pagination and metadata.

---

## 8. Implementation Checklist & Milestones

- [ ] **Milestone 1: Backend Scaffold & Stub Engine**
  - Set up Next.js / TypeScript API routes inside `backend/`.
  - Implement `USE_STUBS=true` engine with mock data for all 7 endpoints.
  - Verify Frontend can connect and perform full UI flows against `localhost:3000/api` or `localhost:3001/api`.
- [ ] **Milestone 2: Coding & Cryptography Modules**
  - Build `core/payload.ts` (64-bit compact bit packing).
  - Implement `core/ecc.ts` (Reed-Solomon 16-byte codeword with parity).
  - Implement `core/crypto.ts` (HKDF key derivation and deterministic PRNG carrier placement).
- [ ] **Milestone 3: Attack Arena Suite**
  - Implement `attacks/mutation.ts`, `attacks/trimming.ts`, `attacks/deletion.ts`, `attacks/synonymous.ts`.
  - Unit test to verify synonymous attacks leave protein translation 100% intact.
- [ ] **Milestone 4: Database Integration**
  - Connect Supabase client with Postgres service key.
  - Implement insert stamp and query registry for `POST /api/trace` and `GET /api/registry`.
- [ ] **Milestone 5: Real ML Service Bridge**
  - Implement `services/mlClient.ts` to call Person 3's Python FastAPI service.
  - Switch `USE_STUBS=false` and run end-to-end integration tests.

