# HelixSign ML ↔ Backend Integration Contract
*Document Version: 1.1.0 · Status: Frozen for Backend Implementation*

This document defines the formal API contract, payload schemas, erasure semantics, and synchronization boundaries between **Person 3 (ML & Data)** and **Person 2 (Backend / ECC / Next.js API)**.

---

## 1. End-to-End System Architecture

```mermaid
flowchart LR
    subgraph Sender [Sender Pipeline]
        P[Original Payload Bits] --> ECC_ENC[ECC Encoder: Person 2\nReed-Solomon RS(n, k)]
        ECC_ENC --> SYNC_ADD[Sync Header: Person 2\nPrepend Barker / Preamble]
        SYNC_ADD --> CW[Codeword Bits to Embed]
        CW --> ML_EMBED[ML Embedder: Person 3\nSynonymous Substitution]
        ML_EMBED --> DNA[Watermarked CDS DNA]
    end

    subgraph Biological Channel
        DNA --> CH[Synthesis / Sequencing Channel\nSubstitutions + Indels]
        CH --> NOISY_DNA[Observed DNA Sequence]
    end

    subgraph Receiver [Receiver Pipeline]
        NOISY_DNA --> SYNC_REC[Frame & Sync Recovery: Person 2\nDetect Barker / Align to Ref]
        SYNC_REC --> CARRIERS[Calibrated Carrier Positions]
        CARRIERS --> ML_EXTRACT[ML Extractor: Person 3\nCodon Reading]
        ML_EXTRACT --> RAW[Raw Bit Estimates + Confidences]
        RAW --> ERASURE_MAP[Erasure Aggregator: Person 2\nBit -> Symbol Erasure Mapping]
        ERASURE_MAP --> ECC_DEC[ECC Decoder: Person 2\nErrors-and-Erasures RS(n, k)]
        ECC_DEC --> RECOVERED[Recovered Original Payload]
    end
```

---

## 2. Interface Specifications & Semantics

All ML microservice endpoints run at `http://127.0.0.1:8000`.

### Contract 1: Watermark Embedding (`POST /ml/embed`)

- **Role**: Synonymous codon substitution embedding with NCBI Table 11 protein invariant verification.
- **Request Schema**:
  ```json
  {
    "sequence": "ATGGCGGAACTGCGTCCGACGTATGGTGCAGACGAATTTCTTAAGCGGTAA",
    "codewordBits": [0, 1, 0, 1, 1, 0, 1, 0],
    "carrierPositions": [1, 2, 3, 4, 5, 6, 7, 8],
    "host": "E. coli K-12"
  }
  ```
  - `sequence` (string, required): Full CDS string, uppercase ACGT, length divisible by 3.
  - `codewordBits` (int[], required): Encoded bits output by Person 2's ECC encoder (including sync preamble). Each value must be `0` or `1`.
  - `carrierPositions` (int[], required): 0-indexed codon positions (e.g. `1` = bases 3–5). Must satisfy `len(carrierPositions) >= len(codewordBits)`.
  - `host` (string, optional): Organism codon table to load (default: `"E. coli K-12"`).

- **Response Schema**:
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
- **Error Behavior**:
  - `400 Bad Request`: Invalid DNA characters, length not divisible by 3, empty inputs, or `len(carrierPositions) < len(codewordBits)`.
  - `422 Unprocessable Entity`: Protein identity check failed (translated protein altered).

---

### Contract 2: Watermark Extraction (`POST /ml/extract`)

- **Role**: Soft and hard bit extraction from carrier codons.
- **Request Schema**:
  ```json
  {
    "sequence": "ATGGCGGAGCTGCGTCCAACCTACGGCGCAGACGAATTTCTTAAGCGGTAA",
    "carrierPositions": [1, 2, 3, 4, 5, 6, 7, 8],
    "host": "E. coli K-12"
  }
  ```
- **Response Schema**:
  ```json
  {
    "bitEstimates": [0, 1, 0, 1, 1, 0, 1, 0],
    "confidences": [0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99]
  }
  ```

---

## 3. Four Core Architectural Invariants

### 1. Confidence Calibration
- **Definition**: Each value in `confidences[i]` is a **posterior probability estimate** $P(\text{bit}_i = \text{bitEstimates}[i] \mid \text{observed codon})$.
- **Calibration scale**:
  - `0.99`: Unambiguous detection of the primary synonymous codon pair (highest vs. second-highest RSCU).
  - `0.50`: Ambiguous or degenerate codon (uninformative prior; 50/50 chance).
  - `0.00`: Definite erasure / missing carrier position (e.g. sequence truncated before this codon).

### 2. Erasure Indexing & Length Invariance
- **Array Size Invariant**: The returned `bitEstimates` and `confidences` arrays **always have length equal to `len(carrierPositions)`**, even if the observed DNA is truncated or mutated.
- **Partial Sequence Handling**: If carrier position $p$ lies beyond the bounds of the provided sequence, the service emits:
  - `bitEstimates[i] = 0`
  - `confidences[i] = 0.0` (flagged as definite erasure).
- **Indexing Scope**: Indices $i \in [0, \dots, N-1]$ correspond directly to the **encoded codeword bit positions**, NOT the original un-encoded payload bits.

### 3. Reed–Solomon Bit-to-Symbol Erasure Aggregation
Reed–Solomon error correction operates on symbols (typically in $\text{GF}(2^8)$, where 1 symbol = $m = 8$ codeword bits), not individual bits. Person 2's backend must convert bit confidences to symbol erasures using the following rule:

$$\text{symbol\_erased}[S] = \begin{cases} 
\text{True} & \text{if } \exists j \in \{0, \dots, m-1\} \text{ such that } \text{confidences}[m \cdot S + j] < \tau \\
\text{False} & \text{otherwise}
\end{cases}$$

- **Recommended Threshold**: $\tau = 0.60$.
- **Correction Capacity**: Under Errors-and-Erasures decoding, RS can correct $t$ bit errors and $e$ symbol erasures provided:
  $$2t + e \le n - k$$
  Treating uncertain bits as erasures doubles decoding efficiency over treating them as potential errors.

### 4. Synchronization & Carrier Recovery under Indels
- When insertions and deletions occur, absolute nucleotide indices shift, destroying static codon coordinate assumptions.
- **Division of Responsibility**:
  - **Person 2 (Backend Receiver)** is responsible for:
    1. Aligning the observed read against the known reference gene (via pairwise global alignment) OR detecting the known sync preamble (e.g. Barker code).
    2. Generating the adjusted `carrierPositions` corresponding to in-frame codons in the observed sequence.
  - **Person 3 (ML Extractor)** is responsible for:
    1. Reading the exact codons at those adjusted `carrierPositions`.
    2. Returning the calibrated probabilities and erasures.

---

### Contract 3: Synthetic Stealth Detection (`POST /ml/detect`)

- **Request Schema**:
  ```json
  {
    "sequence": "ATGGCGGAGCTGCGTCCAACCTACGGCGCAGACGAATTTCTTAAGCGGTAA"
  }
  ```
- **Response Schema**:
  ```json
  {
    "kmerProbability": 0.0005,
    "cnnProbability": 0.9985,
    "degraded": false,
    "kmerAvailable": true,
    "cnnAvailable": true
  }
  ```
- **Error Behavior**:
  - Returns **`HTTP 503 Service Unavailable`** if either detector is missing or unloaded (no fake 0.50 stub responses).

---

## 4. The Eight Integration Acceptance Criteria

Before declaring HelixSign fully validated for publication and deployment, both Person 2 and Person 3 must confirm:

| # | Acceptance Test | Success Criteria | Responsible | Status |
|---|---|---|---|---|
| **1** | **No-Noise Round Trip** | 100% bit-exact payload recovery on all 5 held-out test genes (`b3920`, `b1703`, `b2022`, `b0930`, `b0568`). | Person 3 & 2 | **PASS (ML verified)** |
| **2** | **Protein Invariance** | 100% amino acid identity across all 4,290 *E. coli* CDS (NCBI Table 11). | Person 3 | **PASS (0 / 4,290 mismatches)** |
| **3** | **Substitution Channel** | Raw extraction recovery $>92\%$ at 5.0% substitution rate; $>99\%$ at 0.5%. | Person 3 | **PASS (92.9% at 5.0%)** |
| **4** | **Insertion-Only Channel** | Evaluated separately at rates $0.1\%, 0.5\%, 1.0\%, 2.0\%$ with reported erasures. | Person 3 | **PASS (Reported in JSON)** |
| **5** | **Deletion-Only Channel** | Evaluated separately at rates $0.1\%, 0.5\%, 1.0\%, 2.0\%$ with reported erasures. | Person 3 | **PASS (Reported in JSON)** |
| **6** | **Combined Indel Channel** | Evaluated at rates $0.1\%, 0.5\%, 1.0\%, 2.0\%$ with macro-averages and uncertainty bands. | Person 3 | **PASS (Monotonic: 45% -> 5.8%)** |
| **7** | **Post-ECC Payload Recovery** | End-to-end recovery of original payload bits after Reed-Solomon errors-and-erasures decoding. | Person 2 & 3 | **PENDING (Awaiting Person 2 Backend)** |
| **8** | **Full API Integration** | FastAPI ML microservice successfully invoked by Next.js backend with automated E2E tests. | Person 1, 2, 3 | **PENDING (Awaiting Backend Client)** |

---

## 5. Frozen Schema Summary for Person 2

```typescript
// TypeScript Types for Person 2's Next.js Backend Client

export interface EmbedRequest {
  sequence: string;
  codewordBits: number[];       // 0 or 1
  carrierPositions: number[];   // 0-indexed codon indices
  host?: string;                // default: "E. coli K-12"
}

export interface EmbedResponse {
  stampedSequence: string;
  proteinTranslation: string;
  proteinIdentical: boolean;
  mutations: Array<{
    codonIndex: number;
    fromCodon: string;
    toCodon: string;
    aminoAcid: string;
  }>;
  bioStats: {
    gcBefore: number;
    gcAfter: number;
    gcDelta: number;
    caiSimilarity: number;
    longestHomopolymer: number;
  };
}

export interface ExtractRequest {
  sequence: string;
  carrierPositions: number[];
  host?: string;
}

export interface ExtractResponse {
  bitEstimates: number[];       // Length == carrierPositions.length
  confidences: number[];        // Probability in [0.0, 1.0]; < 0.60 -> RS erasure
}

export interface DetectRequest {
  sequence: string;
}

export interface DetectResponse {
  kmerProbability: number;
  cnnProbability: number;
  degraded: boolean;
  kmerAvailable: boolean;
  cnnAvailable: boolean;
}
```
