# 02 - Technical Requirements Document (TRD): GeneStamp

Version: 0.1 (draft)
Related docs: 01-PRD.md, 03-TEAM-SPLIT.md, 04-API-CONTRACT.md, 05-GIT-WORKFLOW.md

---

## 1. Architecture Overview
Three deployable parts in one monorepo:

- **Frontend (Next.js):** UI, calls the backend over HTTPS JSON. Deployed on Vercel.
- **Backend (FastAPI):** HTTP API, registry access, coding/crypto layer, attack suite, request validation. Imports the ML package in-process. Deployed on Hugging Face Spaces or Render.
- **ML/Data package (Python):** codon tables, embedder, learned realism refiner, detectors, channel simulator, evaluation. Imported by the backend as a library; trained offline on Colab or Kaggle.
- **Database (Supabase Postgres):** registry of stamps.

The backend calls the ML package only through a small set of frozen function signatures (Section 5). This is what lets three people work in parallel.

## 2. Repository Layout
Monorepo with strict folder ownership.

- `frontend/` - Next.js app (owner: Member A)
- `backend/` - FastAPI service (owner: Member B)
- `backend/app/` - routes, schemas, services, db access
- `backend/core_coding/` - Reed-Solomon framing, key derivation, MAC, carrier position selection (owner: Member B)
- `backend/core_attacks/` - attack suite (owner: Member B)
- `ml/` - ML and data package (owner: Member C)
- `ml/genestamp_ml/` - importable package (embed, detect, channel, bio, eval)
- `ml/training/` - training scripts and notebooks
- `ml/data/` - download scripts and small processed assets only
- `ml/artifacts/` - model weights are NOT committed; see Section 8
- `contracts/` - API contract, JSON fixtures, shared enums (owned by all; changes need all three approvals)
- `docs/` - the five markdown docs and paper material
- Root: `README.md`, `.gitignore`, `.env.example`, `CODEOWNERS`

Separate dependency files per area: `frontend/package.json`, `backend/requirements.txt`, `ml/requirements.txt`. No shared requirements file.

## 3. Tech Stack
- Frontend: Next.js (React, TypeScript), Tailwind for styling (from the existing template), Recharts or Plotly for charts, a small custom sequence viewer component.
- Types: generate TypeScript types from the backend OpenAPI schema once the contract is frozen.
- Backend: Python 3.11, FastAPI, Pydantic for schemas, Uvicorn.
- ML: PyTorch (CPU inference), NumPy, scikit-learn and XGBoost for the k-mer detector, Biopython for parsing and translation.
- Optional bio tooling: ViennaRNA for folding energy (skip if install is painful on the host).
- ECC: a Reed-Solomon library for Python.
- Crypto: Python `cryptography` and standard library HMAC/HKDF.
- Database: Supabase Postgres, accessed from the backend only (frontend never talks to the DB).
- Training: Google Colab or Kaggle free GPU.

## 4. Core Technical Design

### 4.1 Payload
- Raw payload is 64 bits: owner code (16), project code (16), batch code (16), check value (16, a truncated keyed MAC over the other fields).
- Owner/project/batch human-readable names live in the registry; the DNA carries compact codes.
- A full digital signature is too large for the payload. The registry holds the full record; the DNA holds the short code plus check value.

### 4.2 Coding layer (Backend owner)
- Reed-Solomon over bytes with parity sized to correct a configurable number of symbol errors (starting point: 8 data bytes plus 8 parity bytes).
- Optional interleaving so burst errors spread across codewords.
- Key handling: per-owner key derived with HKDF from a master secret and the owner code. No per-owner secrets stored in the database.
- Carrier position selection: key-derived pseudorandom permutation of eligible codon positions. Same key plus same sequence length gives the same positions.
- Tiling: if the gene has more eligible positions than one codeword needs, repeat the codeword in several tiles and use majority or soft voting at decode time.

### 4.3 Embedder (ML owner)
- Eligible codon: any codon whose amino acid has at least two synonymous codons (Met and Trp are never eligible).
- Bit mapping: for a position carrying one bit, choose between two designated synonymous options for that amino acid (a fixed, key-independent ordering; secrecy comes from which positions carry bits). For amino acids with more than two codons, the designated pair is chosen to be the two most host-frequent options so the result stays natural-looking.
- Capacity is roughly one bit per eligible codon. Measure real capacity on test genes and publish it; do not assume.
- Hard guarantee: the protein translation of the stamped sequence equals the original. Enforced by construction and checked by a unit test on every output.

### 4.4 Realism refinement (ML owner)
Two levels, same interface:

1. Rule-based (ship first): bias which synonymous option is used toward the host codon usage table and avoid homopolymers longer than a threshold and extreme local GC.
2. Learned (upgrade): a small conditional model plus a discriminator trained with a WGAN-GP objective and a k-mer MMD regularizer, adjusting choices within the allowed synonymous set. If the learned refiner does not converge in time, the product ships with level 1 and the paper reports level 2 as ablation or future work.

### 4.5 Decoder (ML owner)
- Extraction step reads the synonymous choice at each carrier position and returns soft bit estimates with confidence.
- Optional neural decoder (bidirectional LSTM or small transformer) trained on noisy sequences to improve soft estimates. Rule-based extraction is the baseline.
- Output goes to the Reed-Solomon decoder in the coding layer.

### 4.6 Indel handling (decision spike in Phase 1)
Insertions and deletions shift the reading frame, which breaks position-based extraction. Options:
- Registry-assisted alignment: align the suspect sequence to the nearest registry candidate, then read carriers in aligned coordinates. Default choice, also powers Forensic Trace.
- Marker resynchronization: embed periodic marker patterns so the decoder can recover frame. Costs capacity.
Decision owner: Member C with Member B. Whatever is chosen, the UI must show honest results; if standalone Verify cannot handle indels, say so.

### 4.7 Channel simulator (ML owner)
- Applies substitutions, insertions and deletions at configurable rates with a seed for reproducibility.
- Rates configurable from 0.1% to 5%.
- Optional later: platform-style error profiles.

### 4.8 Detectors (ML owner)
- Detector 1: k-mer frequency features (k = 3 to 6) with XGBoost, trained on real E. coli CDS windows vs naive-encoded and stamped windows.
- Detector 2 (held-out, never used in training of the refiner): small 1D CNN over one-hot windows.
- Both return a probability that the input is synthetic.
- Offline evaluation script produces AUC numbers saved as a static results file that the API serves to the Stealth Check screen.

### 4.9 Naive baseline (ML owner)
- Fixed mapping from bits to bases with no realism, wrapped as a function so Stealth Check can generate a naive-tagged sequence from the same payload.

### 4.10 Attack suite (Backend owner)
- random_mutation: substitute a fraction of bases.
- trim_ends: remove bases from either end.
- delete_block: remove a contiguous block.
- shuffle_synonymous: reshuffle synonymous choices within a fraction of codons (protein preserved).
- resynonymize_fraction: replace a fraction of codons with other synonymous codons (protein preserved).
- All attacks take a seed and report what they changed.

## 5. Internal Interface (Backend to ML) - frozen at end of Phase 0
Python functions in `ml/genestamp_ml/`. Exact fields in 04-API-CONTRACT.md Section 6.

- embed: takes a coding sequence, codeword bits, carrier positions and host name; returns stamped sequence plus per-codon change info.
- extract: takes a sequence, carrier positions and host name; returns soft bit estimates and per-bit confidence.
- detect: takes a sequence; returns probabilities from both detectors.
- naive_encode: takes payload bits and a template sequence length; returns a naive-tagged sequence.
- apply_channel: takes a sequence, rates and a seed; returns a noisy sequence.
- bio_stats: takes original and stamped sequences; returns protein identity, GC values, codon usage similarity, longest homopolymer.
- capacity: takes a sequence and host; returns eligible bit count.

Backend must be able to run with `USE_STUBS=true`, which swaps these for fake implementations returning fixed realistic values, so the backend and frontend are never blocked by ML progress.

## 6. Data Model (Supabase)
Table: stamps
- id (uuid, primary key)
- owner_code, owner_name
- project_code, project_name
- batch_code, batch_name
- host (text)
- gene_name (text, optional)
- sequence_hash (sha256 of the stamped sequence)
- stamped_sequence (text; stored so Trace can compare)
- original_sequence_hash (sha256 of the input sequence)
- capacity_used (int)
- created_at (timestamp)

Table: attack_runs (P1/P2)
- id, stamp_id, attack_type, params, survived (bool), created_at

Indexes: owner_code, sequence_hash. Row-level security off for the demo; the DB is only reachable from the backend using a service key kept in backend env.

## 7. Performance Budgets
- Stamp: under 3 seconds for 3000 nt.
- Verify: under 2 seconds.
- Stress Lab: bounded trial count so one request finishes in under 6 seconds (cap trials at 50 per request; sweeps use fewer trials per point or are precomputed).
- Stealth Check: under 2 seconds (CPU inference only).
- All endpoints synchronous in the MVP. If something exceeds budget, precompute and cache results for the demo genes.

## 8. Model and Data Artifact Management
- Weights and large datasets are never committed to git.
- Weights are uploaded to Hugging Face Hub (model repo) or bundled in the Space; backend downloads at startup using a pinned version tag.
- `ml/data/` holds download scripts (NCBI fetch) and tiny sample files only.
- Every training run records: config, random seed, data version, git commit, metrics. Keep a short run log file in `ml/training/runs.md`.
- Fixed random seeds for evaluation so numbers in the paper are reproducible.

## 9. Security
- Secrets (master key, Supabase service key) exist only in backend environment variables. Never in frontend env vars with the public prefix, never in git.
- `.env` files are gitignored; `.env.example` lists variable names only.
- CORS restricted to the frontend origin(s).
- Input validation on every endpoint (alphabet, length, multiple of 3).
- Simple rate limiting on heavy endpoints (stress, attack, trace).
- The API never returns carrier positions or keys.

## 10. Environments and Deployment
- local: each person runs their own area; frontend can run against mocks.
- preview: frontend branch previews on Vercel; backend dev instance (separate Space or Render service) tracking `develop`.
- production: tracks `main`; used for the demo.
- Environment variables (names only):
  - Frontend: NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_USE_MOCKS
  - Backend: MASTER_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, ALLOWED_ORIGINS, USE_STUBS, MODEL_VERSION
  - ML: HF_TOKEN (only for upload), DATA_DIR

## 11. Testing
- Unit tests (Member C): protein identity on every embed output; extraction recovers bits with no noise; channel reproducible by seed.
- Unit tests (Member B): Reed-Solomon round trip, key determinism, attack functions preserve protein where promised, schema validation.
- Contract tests (Member B): every endpoint response validates against the schemas in the contract; fixtures in `contracts/fixtures/` are generated from or validated against them.
- Frontend (Member A): runs fully against fixtures; a smoke checklist for the demo flow.
- Integration test (all, Phase 2): scripted run of the demo flow against the deployed dev backend.

## 12. Observability (minimal)
- Backend logs request id, endpoint, duration, error code.
- `/health` reports version and whether stubs are active.
- A visible "mode" indicator in the UI footer showing stub or real, so nobody demos fake data by accident.

## 13. Technical Risks
- ViennaRNA or PyTorch install size on free hosting: keep inference CPU-only, drop ViennaRNA if needed.
- Cold starts: ping the backend before the demo.
- Learned refiner may not converge: ship rule-based first.
- Indel robustness: decision spike and honest reporting.
- Capacity on short genes: capacity endpoint and clear errors; use a longer demo gene.
