# 06 - HelixSign Monitoring & Integration Guide

**Scope:** Cross-Service Connectivity, Network Topology, Health Checks, Telemetry, and Observability  
**Audience:** All 3 Developers (Frontend, Backend, ML Leads)

---

## 1. System Topology & Port Architecture

HelixSign is structured as an isolated 3-tier monorepo architecture:

```
[ Client Browser ]
       │
       ▼ (HTTP :3000)
┌──────────────────────────────────────────────┐
│  frontend/ (Next.js 15, App Router, React 19)│
│  - Port: 3000                                │
│  - Mode: Mock Mode (isolated) or Live API    │
└──────────────────────┬───────────────────────┘
                       │
                       │ JSON REST (/api/*)
                       ▼ (HTTP :3001)
┌──────────────────────────────────────────────┐
│  backend/ (Next.js / TypeScript API Routes)  │
│  - Port: 3001                                │
│  - Core Crypto (HKDF) & Reed-Solomon ECC     │
│  - Attack Arena Execution Engine             │
│  - Mode: Stub Mode or Live ML Bridge         │
└──────────────┬────────────────┬──────────────┘
               │                │
               │ HTTP (:8000)   │ SQL (:5432 / HTTPS)
               ▼                ▼
┌────────────────────────┐  ┌────────────────────────┐
│  ml/ (FastAPI/PyTorch) │  │  Supabase (PostgreSQL) │
│  - Port: 8000          │  │  - Table: stamps       │
│  - Embedder & Extractor│  │  - Table: attack_runs  │
│  - Detectors & Channel │  │  - Provenance Registry │
└────────────────────────┘  └────────────────────────┘
```

### Port Allocation Map

| Service | Directory | Local URL | Primary Protocol | Health Probe |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `frontend/` | `http://localhost:3000` | HTTP / React UI | Browser view (`/`) |
| **Backend API** | `backend/` | `http://localhost:3001` | HTTP / JSON REST | `GET /api/health` |
| **ML Inference** | `ml/` | `http://127.0.0.1:8000` | HTTP / JSON Microservice | `GET /ml/health` |
| **Database** | Supabase Cloud | `https://<proj>.supabase.co` | HTTPS REST / Postgres Wire | Managed by Supabase |

---

## 2. Operating Modes (Progressive Integration)

To guarantee that no developer is ever blocked by another developer's progress, the system supports three progressive operating levels:

```
Level 1: FULLY ISOLATED ──▶ Level 2: BACKEND CONNECTED ──▶ Level 3: FULL PRODUCTION PIPELINE
(Frontend Mocks = true)      (Frontend -> Backend)           (Frontend -> Backend -> ML -> DB)
(Backend Stubs  = true)      (Backend Stubs = true)          (Stubs & Mocks turned OFF)
```

### Level 1: Fully Isolated (Day 1 – Day 2)
- **Frontend:** Runs standalone with `NEXT_PUBLIC_USE_MOCKS=true`. Uses mock fixtures in `contracts/fixtures/`.
- **Backend:** Runs standalone with `USE_STUBS=true`. Returns mock biological embeddings and test registry records.
- **ML:** Trains models in Jupyter/Colab notebooks; verifies loss curves and AUC metrics independently.
- **Dependency:** 0 cross-service dependencies.

### Level 2: Backend-Connected (Day 2 – Day 3)
- **Frontend:** Flips `NEXT_PUBLIC_USE_MOCKS=false` and points `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api`.
- **Backend:** Still runs with `USE_STUBS=true`. Validates end-to-end HTTP requests, Reed-Solomon framing, and database persistence without requiring Python to be running.
- **Dependency:** Frontend $\leftrightarrow$ Backend verified.

### Level 3: Full Production Pipeline (Demo Ready)
- **Backend:** Flips `USE_STUBS=false` and connects to `ML_SERVICE_URL=http://127.0.0.1:8000`.
- **ML:** FastAPI server active on port 8000 serving PyTorch embedder and XGBoost/CNN detectors.
- **Database:** Live Supabase table populated with real stamp history.

---

## 3. Environment Variable Configuration Matrix

Create the respective `.env.local` files inside each subfolder:

### Frontend (`frontend/.env.local`)
```bash
# Point to backend (or set to relative /api if using next rewrites)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api

# Offline mock toggle (true = isolated mock mode, false = live backend)
NEXT_PUBLIC_USE_MOCKS=false

# Visual environment tag shown in UI footer
NEXT_PUBLIC_ENV_TAG=DEVELOPMENT
```

### Backend (`backend/.env.local`)
```bash
PORT=3001
NODE_ENV=development

# Master Cryptographic Secret (32-byte hex for HKDF carrier generation)
MASTER_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Supabase Credentials
SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_SERVICE_KEY=eyJh...service_role_secret

# ML Bridge
USE_STUBS=false
ML_SERVICE_URL=http://127.0.0.1:8000

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### ML Service (`ml/.env`)
```bash
PORT=8000
HOST=127.0.0.1
DEBUG=true
DATA_DIR=./data
ARTIFACTS_DIR=./artifacts
MODEL_VERSION=v1.0.0
```

---

## 4. Local Development Startup Sequence

To run all 3 services simultaneously during integrated testing:

### Terminal 1: ML Microservice (Python)
```bash
cd ml
# Activate virtual environment
source .venv/bin/activate    # On Windows: .venv\Scripts\activate
uvicorn api.serve:app --host 127.0.0.1 --port 8000 --reload
```
*Verify:* Open `http://127.0.0.1:8000/docs` in your browser to inspect the interactive Swagger UI.

### Terminal 2: Backend API (Next.js / Node)
```bash
cd backend
npm run dev
```
*Verify:* Send probe request:
```bash
curl http://localhost:3001/api/health
```

### Terminal 3: Frontend Web Application (Next.js)
```bash
cd frontend
npm run dev
```
*Verify:* Open `http://localhost:3000` in Chrome/Firefox.

---

## 5. Health Checks & Diagnostic Probes

### 1. Backend Health Probe (`GET /api/health`)
The backend exposes a consolidated diagnostic route:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-11-12T22:30:00.000Z",
  "environment": "development",
  "stubsActive": false,
  "dependencies": {
    "mlService": {
      "status": "connected",
      "latencyMs": 14,
      "url": "http://127.0.0.1:8000"
    },
    "database": {
      "status": "connected",
      "latencyMs": 42,
      "provider": "Supabase PostgreSQL"
    }
  }
}
```

### 2. ML Service Health Probe (`GET /ml/health`)
```json
{
  "status": "healthy",
  "service": "helixsign-ml-engine",
  "version": "1.0.0",
  "device": "cpu",
  "modelsLoaded": {
    "kmerDetector": true,
    "cnnDetector": true,
    "realismRefiner": true
  }
}
```

### 3. UI Status Pill in Footer
The frontend should render an unobtrusive diagnostic indicator in the bottom footer:
- `🟢 Live Pipeline Connected` (All services green)
- `🟡 Backend Connected (Stub Mode)` (`USE_STUBS=true`)
- `🔵 Mock Mode Active` (`NEXT_PUBLIC_USE_MOCKS=true`)
- `🔴 Service Disconnected` (Health probe failed)

> **Demo Rule:** This badge prevents presenting simulated stub data by mistake during an official presentation.

---

## 6. Performance Budgets & Latency Thresholds

For smooth live judge demonstrations, every endpoint must adhere to the following strict latency ceilings:

| Operation | Endpoint | Target Latency | Hard Timeout | Fallback Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Stamp Construct** | `POST /api/stamp` | `< 1.5s` | `3.0s` | Limit gene input to 3,000 nt for live demo |
| **Verify Suspect** | `POST /api/verify` | `< 800ms` | `2.0s` | Tile scan limit capped at 3 tiles |
| **Stealth Evaluation** | `POST /api/stealth` | `< 1.0s` | `2.0s` | Pre-compute k-mer background statistics |
| **Noise Stress Run** | `POST /api/stress` | `< 3.0s` | `6.0s` | Cap live trials to 30; pre-render curve data |
| **Attack Arena** | `POST /api/attack` | `< 500ms` | `1.5s` | Synchronous in-memory string mutation |
| **Forensic Trace** | `POST /api/trace` | `< 1.2s` | `3.0s` | K-mer index candidate filtering before alignment |

---

## 7. Troubleshooting & Common Failure Modes

### Issue 1: CORS Error in Browser Console
* **Symptom:** `Access to fetch at 'http://localhost:3001/api/stamp' from origin 'http://localhost:3000' has been blocked by CORS policy.`
* **Fix:** In `backend/src/app/api/...`, ensure the response headers include:
  ```ts
  headers: {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
  ```

### Issue 2: Port Collision (`EADDRINUSE`)
* **Symptom:** `Error: listen EADDRINUSE: address already in use :::3000` (or `3001`, `8000`).
* **Fix (Windows PowerShell):**
  ```powershell
  # Find process locking port 3001
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force
  ```

### Issue 3: ML Service Cold Start / Timeout on Free Tier
* **Symptom:** First request times out after 10 seconds.
* **Fix:**
  - Execute a "warm-up" `GET /ml/health` ping 60 seconds before doing a live demo.
  - Keep model weights CPU-optimized (avoid heavy CUDA allocations if hosting on free CPU instances like Hugging Face Spaces or Render).

### Issue 4: Supabase Connection Failure
* **Symptom:** `PostgrestError: JWT expired` or `connection refused`.
* **Fix:**
  - Check `SUPABASE_SERVICE_KEY` in `backend/.env.local`. Ensure you are using the **service_role** secret, not the public anon key (the backend requires service privileges to write to `stamps`).

---

## 8. Pre-Demo Verification Checklist (15 Minutes Before Demo)

- [ ] 1. Boot up ML service (`http://127.0.0.1:8000/ml/health`) $\to$ confirm `status: "healthy"`.
- [ ] 2. Boot up Backend service (`http://localhost:3001/api/health`) $\to$ confirm `mlServiceConnected: true`.
- [ ] 3. Verify `USE_STUBS=false` in `backend/.env.local` (or verify stubs work as fallback).
- [ ] 4. Boot up Frontend (`http://localhost:3000`) $\to$ confirm green status indicator in footer.
- [ ] 5. Run standard demo gene test:
  - Copy E. coli demo sequence from `ml/data/test_genes.fasta`.
  - Stamp gene $\to$ confirm 100% protein identity badge.
  - Run Stealth Check $\to$ confirm Naive AUC $\approx 1.0$ vs HelixSign AUC $\approx 0.50$.
  - Run Stress Lab $\to$ slider at 2.0% mutation $\to$ confirm recovery $> 95\%$.
  - Run Attacker Arena $\to$ run synonymous shuffle $\to$ confirm watermark survives.
- [ ] 6. Done! Ready to present.
