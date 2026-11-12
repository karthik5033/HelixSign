# HelixSign ML ↔ Backend Integration Contract

This document freezes the interface between **Person 3 (ML & Data)** and **Person 2 (Backend / ECC / Next.js API)**.

---

## 1. End-to-End System Architecture

```mermaid
flowchart LR
    subgraph Sender
        P[User Payload Bits] --> ECC_ENC[ECC Encoder: Person 2\nReed-Solomon]
        ECC_ENC --> CW[Codeword Bits + Sync Header]
        CW --> ML_EMBED[ML Embedder: Person 3\nSynonymous Substitution]
        ML_EMBED --> DNA[Watermarked DNA]
    end

    subgraph Biological Channel
        DNA --> CH[Sequencing / Synthesis Noise\nSubstitutions + Indels]
        CH --> NOISY_DNA[Noisy DNA]
    end

    subgraph Receiver
        NOISY_DNA --> SYNC[Sync & Frame Recovery: Person 2\nLocate ORF Start]
        SYNC --> ML_EXTRACT[ML Extractor: Person 3\nCodon Reading]
        ML_EXTRACT --> RAW[Bit Estimates + Erasure Mask]
        RAW --> ECC_DEC[ECC Decoder: Person 2\nErrors-and-Erasures RS]
        ECC_DEC --> RECOVERED[Recovered Payload]
    end
```

---

## 2. API Schema & Data Contracts

All endpoints are hosted at `http://127.0.0.1:8000`.

### Contract 1: Watermark Embedding (`POST /ml/embed`)

- **Role**: Takes codeword bits produced by Person 2's ECC encoder, embeds them into synonymous carrier positions, and verifies 100% protein identity.
- **Request Body**:
  ```json
  {
    "sequence": "ATGGCGGAACTGCGTCCGACGTATGGTGCAGACGAATTTCTTAAGCGGTAA",
    "codewordBits": [0, 1, 0, 1, 1, 0, 1, 0],
    "carrierPositions": [1, 2, 3, 4, 5, 6, 7, 8],
    "host": "E. coli K-12"
  }
  ```
- **Response Body**:
  ```json
  {
    "stampedSequence": "ATGGCGGAGCTGCGTCCAACCTACGGCGCAGACGAATTTCTTAAGCGGTAA",
    "proteinTranslation": "MAELRPTYGADEFLKR*",
    "proteinIdentical": true,
    "mutations": [
      {
        "codonIndex": 2,
        "fromCodon": "GAA",
        "toCodon": "GAG",
        "aminoAcid": "E"
      }
    ],
    "bioStats": {
      "gcBefore": 51.0,
      "gcAfter": 54.9,
      "gcDelta": 3.9,
      "caiSimilarity": 0.902,
      "longestHomopolymer": 2
    }
  }
  ```
- **Error Codes**:
  - `400`: Sequence length not divisible by 3, invalid characters (non-ACGT), empty input, or `len(carrierPositions) < len(codewordBits)`.
  - `422`: Protein translation mismatch (fails biological invariant).

---

### Contract 2: Watermark Extraction (`POST /ml/extract`)

- **Role**: Reads observed codons at carrier positions and extracts hard bits, confidence values, and an explicit erasure mask.
- **Request Body**:
  ```json
  {
    "sequence": "ATGGCGGAGCTGCGTCCAACCTACGGCGCAGACGAATTTCTTAAGCGGTAA",
    "carrierPositions": [1, 2, 3, 4, 5, 6, 7, 8],
    "host": "E. coli K-12"
  }
  ```
- **Response Body**:
  ```json
  {
    "bitEstimates": [0, 1, 0, 1, 1, 0, 1, 0],
    "confidences": [0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99]
  }
  ```
- **Erasure Semantics**:
  - When a carrier position cannot be read (e.g. truncated sequence or ambiguous codon), `confidence` drops to `0.50` or the bit is mapped to an erasure in the backend parser.
  - Person 2's RS decoder should treat positions with `confidence < 0.60` as erasures to double the error-correction budget ($2t + e \le n - k$).

---

### Contract 3: Synthetic Stealth Detection (`POST /ml/detect`)

- **Role**: Evaluates whether an engineered sequence triggers statistical anomalies.
- **Request Body**:
  ```json
  {
    "sequence": "ATGGCGGAGCTGCGTCCAACCTACGGCGCAGACGAATTTCTTAAGCGGTAA"
  }
  ```
- **Response Body**:
  ```json
  {
    "kmerProbability": 0.0005,
    "cnnProbability": 0.9985,
    "degraded": false,
    "kmerAvailable": true,
    "cnnAvailable": true
  }
  ```
- **Error Handling**:
  - If detector weights are not found on the server, returns **HTTP 503 Service Unavailable** (no silent 0.50 fallback).

---

## 3. Responsibilities & Separation of Concerns

| Functionality | Owner | Implementation Status |
|---|---|---|
| **Codon usage table & RSCU calculations** | Person 3 (ML) | Done (`codon_usage_ecoli.json`, `bio.py`) |
| **Synonymous codon substitution engine** | Person 3 (ML) | Done (`embed.py`, `assert_protein_identity`) |
| **Raw codon bit extraction** | Person 3 (ML) | Done (`extract.py`) |
| **k-mer XGBoost & 1D CNN detectors** | Person 3 (ML) | Done (`detectors/`) |
| **Microservice endpoints & validation** | Person 3 (ML) | Done (`api/serve.py`) |
| **Reed–Solomon ECC encoder/decoder** | Person 2 (Backend) | **Pending** (Backend `src/` currently empty) |
| **Preamble / Barker sync header insertion** | Person 2 (Backend) | **Pending** (Required for indel synchronization) |
| **Next.js UI & Web client** | Person 1 (Frontend) | In Progress |

---

## 4. Acceptance Criteria Checklist for End-to-End Signoff

1. [x] **No-Noise Round Trip**: Bit-exact recovery across all 5 representative test genes (`b3920`, `b1703`, `b2022`, `b0930`, `b0568`).
2. [x] **Protein Invariance**: 4,290 / 4,290 CDS pass with 0 translation mismatches.
3. [x] **Substitution Channel**: >92% raw extraction up to 5% substitution rate.
4. [x] **Microservice Robustness**: 78 automated unit & integration tests passing (`pytest tests/`).
5. [ ] **Backend RS Integration**: Person 2 implements RS(255, 223) or RS(64, 32) errors-and-erasures decoding.
6. [ ] **Frame Recovery / Synchronization**: Person 2 implements preamble detection to locate ORF start post-indel.
7. [ ] **Post-ECC Combined Indel Benchmark**: Recovery evaluated after RS decoding.
