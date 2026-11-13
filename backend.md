# HelixSign Backend Integration & API Specification Guide

**Document Version:** 2.0  
**Last Updated:** 2026-11-13  
**Status:** Backend fully implemented & tested (39/39 passing); Endpoints ready for frontend integration  

---

## 📋 Table of Contents

1. [Executive Overview & Architecture](#executive-overview--architecture)
2. [API Endpoints & Frozen Contract Specification](#api-endpoints--frozen-contract-specification)
   - [`POST /api/stamp`](#1-post-apistamp)
   - [`POST /api/verify`](#2-post-apiverify)
   - [`POST /api/stealth`](#3-post-apistealth)
   - [`POST /api/stress`](#4-post-apistress)
   - [`POST /api/attack`](#5-post-apiattack)
   - [`POST /api/trace`](#6-post-apitrace)
   - [`GET /api/registry`](#7-get-apiregistry)
   - [`GET /api/health`](#8-get-apihealth)
3. [Frontend Route Integration Mapping](#frontend-route-integration-mapping)
4. [Resolved Issues & Architectural Clarifications](#resolved-issues--architectural-clarifications)
5. [Typed TypeScript API Client](#typed-typescript-api-client)
6. [Environment Variables & Configuration](#environment-variables--configuration)
7. [Verification & Runbook](#verification--runbook)

---

## Executive Overview & Architecture

### System Topology

```
┌────────────────────────────────────────────────────────────────┐
│  Frontend Client (Next.js 15 / React 19)                      │
│  Port: 3000 | Static & Dynamic SSR                             │
│  Routes: /upload, /dashboard, /analysis, /compare, /monitor    │
└──────────────────────────────┬─────────────────────────────────┘
                               │ HTTP / JSON (CORS preflighted)
                               ▼
┌────────────────────────────────────────────────────────────────┐
│  Backend Service (Next.js TypeScript App Router)              │
│  Port: 3001                                                    │
│  - Middleware: CORS, OPTIONS (204), Rate Limiting              │
│  - Core Engines: Reed-Solomon GF(2⁸), HKDF PRNG, Codon Tables  │
│  - Database: Native Node 22 SQLite (node:sqlite DatabaseSync)   │
└──────────────────────────────┬─────────────────────────────────┘
                               │ Internal HTTP (Optional Fallback)
                               ▼
┌────────────────────────────────────────────────────────────────┐
│  ML Microservice (FastAPI Python 3.11)                         │
│  Port: 8000 (USE_STUBS=true fallback active when offline)      │
│  - WGAN-GP Refiner (Gradient Penalty λ=10)                     │
│  - 1D-CNN & k-mer Adversarial Detectors                        │
└────────────────────────────────────────────────────────────────┘
```

### Current Operational Status

- **Backend Test Suite:** 39 of 39 tests passing (`vitest run` executes in ~360ms).
- **Compilation:** Zero TypeScript errors across both `backend` and `frontend`.
- **Database Engine:** Embedded SQLite via Node 22 native `node:sqlite` (`data/helixsign.db`), with auto-initialized DDL schema and in-memory test runner support (`:memory:`).
- **ML Bridge:** `USE_STUBS=true` provides biophysically concordant deterministic fallbacks so the backend operates autonomously without blocking on Python GPU dependencies.

---

## API Endpoints & Frozen Contract Specification

All endpoints are hosted at `http://localhost:3001` (or `$NEXT_PUBLIC_API_URL`). All schemas conform strictly to `contracts/api-spec.json`.

---

### 1. `POST /api/stamp`
Watermarks an engineered coding sequence (CDS) using synonymous codon allocations and Galois Field $\text{GF}(2^8)$ Reed-Solomon $\text{RS}(16,8)$ error correction.

#### Validation Rules
- `sequence`: Standard DNA alphabet (`A`, `C`, `G`, `T`, case-insensitive).
- **Modulo 3 Requirement:** Length must be a multiple of 3 (`length % 3 === 0`).
- **Capacity Requirement:** Must be at least **600 nucleotides** to safely host 16 systematic parity bytes without codon crowding.
- `ownerName`, `projectName`, `batchName`: Required strings (1–120 characters).
- `host`: Defaults to `"E. coli K-12"`.

#### Request Payload
```json
{
  "ownerName": "ApexBio Lab",
  "projectName": "Project Helios",
  "batchName": "B-2026-X1",
  "sequence": "ATGGCCAAGTTGACCACTGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCACCGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCACCGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCACCGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCACCGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCACCGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCACCGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCACCGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCACCGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCACCGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCACCGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCACCGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCACCGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCACCGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCACCGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCACCGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCACCGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCACCGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCACCGCCGTCGCCGTCCTCGCCGCCGCCGCTGTCGTCTAA",
  "host": "E. coli K-12"
}
```

#### Response Payload (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "stampId": "d9e83120-7b24-4f9e-9b22-8d76e4c2b9a1",
    "owner": "ApexBio Lab",
    "project": "Project Helios",
    "batch": "B-2026-X1",
    "originalSequenceLength": 600,
    "stampedSequence": "ATGGCCAAGTTGACCACTGCCGTCGCCGTC...",
    "proteinTranslation": "MAKLTTA...",
    "proteinIdentityPercent": 100.0,
    "mutations": [
      {
        "codonIndex": 14,
        "fromCodon": "GAG",
        "toCodon": "GAA",
        "aminoAcid": "E"
      }
    ],
    "stats": {
      "gcBefore": 50.8,
      "gcAfter": 50.7,
      "caiSimilarity": 0.988,
      "longestHomopolymer": 4,
      "capacityUsed": 64,
      "capacityTotal": 128
    },
    "createdAt": "2026-11-13T04:25:30.000Z"
  }
}
```

---

### 2. `POST /api/verify`
Recovers and authenticates the embedded ownership payload from a suspect biological sequence, applying Reed-Solomon error correction to heal biological mutations or synthesis errors.

#### Request Payload
```json
{
  "sequence": "ATGGCCAAGTTGACCACTGCCGTCGCCGTC..."
}
```

#### Response Payload (`200 OK`)
```json
{
  "status": "verified",
  "data": {
    "owner": "ApexBio Lab",
    "project": "Project Helios",
    "batch": "B-2026-X1",
    "errorsCorrected": 2,
    "confidenceScore": 0.994,
    "timestamp": "2026-11-13T04:25:30.000Z"
  }
}
```
*Status may be `"verified"`, `"partially_recovered"`, or `"not_found"`.*

---

### 3. `POST /api/stealth`
Evaluates adversarial detection metrics against 1D-CNN and $k$-mer biosecurity frequency screeners, comparing naive watermarking against the HelixSign WGAN-GP refiner.

#### Request Payload
```json
{
  "sequence": "ATGGCCAAGTTGACCACTGCCGTCGCCGTC..."
}
```

#### Response Payload (`200 OK`)
```json
{
  "data": {
    "naiveTag": {
      "kmerDetectorProb": 0.998,
      "cnnDetectorProb": 0.985,
      "aucScore": 0.995
    },
    "helixSign": {
      "kmerDetectorProb": 0.505,
      "cnnDetectorProb": 0.498,
      "aucScore": 0.502
    }
  }
}
```

---

### 4. `POST /api/stress`
Runs Monte Carlo channel noise simulations across parameterized substitution and indel rates, computing watermark recovery curves and the breakdown threshold.

#### Validation Constraints
- `substitutionRate`: Between `0.001` and `0.05` (0.1% to 5.0%).
- `indelRate`: Between `0.000` and `0.02` (0.0% to 2.0%).
- `trials`: Integer between `1` and `50` (default: 30).
- `seed`: Integer for deterministic reproducibility.

#### Request Payload
```json
{
  "sequence": "ATGGCCAAGTTGACCACTGCCGTCGCCGTC...",
  "substitutionRate": 0.02,
  "indelRate": 0.005,
  "trials": 30,
  "seed": 42
}
```

#### Response Payload (`200 OK`)
```json
{
  "data": {
    "substitutionRate": 0.02,
    "indelRate": 0.005,
    "trials": 30,
    "recoveryRate": 0.967,
    "averageErrorsCorrected": 3.2,
    "breakdownThresholdReached": false,
    "curve": [
      { "noiseRate": 0.01, "recoveryPercent": 100 },
      { "noiseRate": 0.02, "recoveryPercent": 96.7 },
      { "noiseRate": 0.03, "recoveryPercent": 88.4 }
    ]
  }
}
```

---

### 5. `POST /api/attack`
Simulates adversarial red-teaming scenarios attempting to scrub or corrupt the ownership watermark.

#### Allowed Attack Types (`attackType`)
1. `random_mutation`: Stochastic single-nucleotide point substitutions.
2. `trim_ends`: Excision of $5'$ or $3'$ terminal coding regions.
3. `delete_block`: Targeted internal deletion of nucleotide blocks.
4. `shuffle_synonymous`: Adversarial codon permutation within synonymous families.
5. `resynonymize_fraction`: Forced codon re-harmonization to target host mean.

#### Request Payload
```json
{
  "sequence": "ATGGCCAAGTTGACCACTGCCGTCGCCGTC...",
  "attackType": "shuffle_synonymous",
  "intensity": 0.15,
  "seed": 42
}
```

#### Response Payload (`200 OK`)
```json
{
  "data": {
    "attackType": "shuffle_synonymous",
    "intensity": 0.15,
    "watermarkSurvived": true,
    "proteinIntact": true,
    "mutationsApplied": 23,
    "recoveryConfidence": 0.978,
    "breakPointEstimated": 0.25
  }
}
```

---

### 6. `POST /api/trace`
Forensic search comparing a suspect genetic sequence against the SQLite provenance registry to identify matching strains, ownership lineage, and tampered loci.

#### Request Payload
```json
{
  "suspectSequence": "ATGGCCAAGTTGACCACTGCCGTCGCCGTC..."
}
```

#### Response Payload (`200 OK`)
```json
{
  "data": {
    "matches": [
      {
        "stampId": "d9e83120-7b24-4f9e-9b22-8d76e4c2b9a1",
        "owner": "ApexBio Lab",
        "project": "Project Helios",
        "batch": "B-2026-X1",
        "similarityPercent": 98.5,
        "confidence": 0.991,
        "tamperedRegions": [
          { "start": 42, "end": 84, "type": "substitution" }
        ]
      }
    ]
  }
}
```

---

### 7. `GET /api/registry`
Lists stamped genetic constructs with pagination and metadata.

#### Query Parameters
- `limit`: Integer between `1` and `200` (default: 50).
- `offset`: Integer $\ge 0$ (default: 0).

#### Response Payload (`200 OK`)
```json
{
  "stamps": [
    {
      "id": "d9e83120-7b24-4f9e-9b22-8d76e4c2b9a1",
      "owner": "ApexBio Lab",
      "project": "Project Helios",
      "batch": "B-2026-X1",
      "sequenceHash": "8f4c92a1...3e1b7a",
      "capacityUsed": 64,
      "createdAt": "2026-11-13T04:25:30.000Z"
    }
  ]
}
```

---

### 8. `GET /api/health`
System health check providing runtime and integration telemetry.

#### Response Payload (`200 OK`)
```json
{
  "status": "ok",
  "version": "1.0.0",
  "stubsActive": true,
  "mlServiceConnected": false,
  "databaseConnected": true
}
```

---

## Frontend Route Integration Mapping

The Next.js 15 frontend already contains all primary UI screens in `frontend/app/(auth)/`. They integrate cleanly with the backend endpoints:

| Frontend Route | Screen Name | Target Backend Endpoint | Key UI Interactions |
| :--- | :--- | :--- | :--- |
| **`/upload`** | Construct Ingestion & Stamp Studio | `POST /api/stamp` | Sequence validation ($\%3=0$, $\ge 600$ bp), live capacity meter, FASTA export, mutation ledger. |
| **`/dashboard`** | Construct Overview & Provenance | `GET /api/registry` | Registry construct ledger, recent activity metrics, cryptographic hash verification. |
| **`/reports`** | Provenance & Audit Reports | `GET /api/registry`, `GET /api/health` | Cryptographic certificate generation, audit trails, SHA-256 seal inspection. |
| **`/analysis`** | Steganographic Pipeline Explorer | `POST /api/verify` | Suspect sequence verification, Reed-Solomon error correction display, confidence meter. |
| **`/compare`** | Stealth Detector Benchmarking | `POST /api/stealth`, `POST /api/attack` | AUROC comparison (0.505 vs 0.995), adversarial red-team simulations. |
| **`/monitor`** | Channel Stress Lab & Monitor | `POST /api/stress` | Monte Carlo noise sliders (substitution & indel), real-time recovery curve plots. |
| **`/localization`** | Carrier Locus & Codon Mapping | `POST /api/trace` | Sequence alignment viewer, tampered region highlighting, similarity matching. |

---

## Resolved Issues & Architectural Clarifications

The previous version of `backend.md` contained several outdated notes that have now been resolved:

1. **CORS & Preflight Handling:** Fully resolved in [backend/src/middleware.ts](file:///d:/coding_files/HelixSign/backend/src/middleware.ts). Automatically handles `OPTIONS` with `204 No Content`, reflects matching `ALLOWED_ORIGINS`, and sets `Access-Control-Max-Age: 86400`.
2. **Centralized Error Handling:** Handled via `withErrorHandling` and typed `ApiError` in [backend/src/lib/http.ts](file:///d:/coding_files/HelixSign/backend/src/lib/http.ts). Returns structured JSON (`{ error: { code, message, details } }`) with proper HTTP status codes (`400`, `404`, `500`).
3. **Database Architecture:** Built on Node 22 native `node:sqlite` (`DatabaseSync`), requiring zero C++ compiler toolchains. Uses auto-migrating DDL in [backend/src/services/sqlite.ts](file:///d:/coding_files/HelixSign/backend/src/services/sqlite.ts).
4. **Sequence Validation Boundaries:** Documented in [backend/src/types/index.ts](file:///d:/coding_files/HelixSign/backend/src/types/index.ts). Stamping sequences must be at least **600 nucleotides** and a multiple of 3.

---

## Typed TypeScript API Client

Place the following client in `frontend/lib/api/client.ts` for end-to-end typed requests:

```typescript
// frontend/lib/api/client.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || JSON.stringify(errJson);
    } catch {
      // Fallback to status text
    }
    throw new Error(`API ${endpoint} failed (${response.status}): ${errorDetail}`);
  }

  return response.json();
}

export const api = {
  health: () => request<{ status: string; stubsActive: boolean; databaseConnected: boolean }>("/api/health"),
  
  stamp: (payload: {
    ownerName: string;
    projectName: string;
    batchName: string;
    sequence: string;
    host?: string;
  }) => request<{ status: string; data: any }>("/api/stamp", {
    method: "POST",
    body: JSON.stringify(payload),
  }),

  verify: (sequence: string) => request<{ status: string; data: any }>("/api/verify", {
    method: "POST",
    body: JSON.stringify({ sequence }),
  }),

  stealth: (sequence: string) => request<{ data: any }>("/api/stealth", {
    method: "POST",
    body: JSON.stringify({ sequence }),
  }),

  stress: (payload: {
    sequence: string;
    substitutionRate: number;
    indelRate?: number;
    trials?: number;
    seed?: number;
  }) => request<{ data: any }>("/api/stress", {
    method: "POST",
    body: JSON.stringify(payload),
  }),

  attack: (payload: {
    sequence: string;
    attackType: string;
    intensity: number;
    seed?: number;
  }) => request<{ data: any }>("/api/attack", {
    method: "POST",
    body: JSON.stringify(payload),
  }),

  trace: (suspectSequence: string) => request<{ data: { matches: any[] } }>("/api/trace", {
    method: "POST",
    body: JSON.stringify({ suspectSequence }),
  }),

  registry: (limit = 50, offset = 0) =>
    request<{ stamps: any[] }>(`/api/registry?limit=${limit}&offset=${offset}`),
};
```

---

## Environment Variables & Configuration

### Backend (`backend/.env.local`)
```bash
PORT=3001
NODE_ENV=development
MASTER_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
DATABASE_PATH=./data/helixsign.db
USE_STUBS=true
ML_SERVICE_URL=http://127.0.0.1:8000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Frontend (`frontend/.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_USE_MOCKS=false
```

---

## Verification & Runbook

### 1. Run Unit & Integration Tests
```bash
cd backend
npm test
```
*Expected: 39 tests passed across 6 test suites (`payload`, `ecc`, `crypto`, `attacks`, `services`, `api`).*

### 2. Verify Backend Build & Typecheck
```bash
cd backend
npm run typecheck
npm run build
```

### 3. Verify Health Check via CLI
```bash
node -e "require('http').get('http://localhost:3001/api/health', (res) => { res.on('data', (d) => console.log(d.toString())); });"
```
*Expected response:*
```json
{"status":"ok","version":"1.0.0","stubsActive":true,"mlServiceConnected":false,"databaseConnected":true}
```

---
*End of Specification Guide.*
