# HelixSign ML ↔ Backend Integration Contract
*Document Version: 1.2.0 · Status: Final Frozen Specification for Backend Implementation*

This document defines the formal integration contract, bit-to-symbol layout, mathematical definitions, erasure semantics, and architectural boundaries between **Person 3 (ML & Data)** and **Person 2 (Backend / ECC / Next.js API)**.

---

## 1. End-to-End System Architecture

```mermaid
flowchart LR
    subgraph Sender [Sender Pipeline: Person 2 Backend -> Person 3 ML]
        P[Original Payload Bytes/Bits] --> ECC_ENC[ECC Encoder: Person 2\nReed-Solomon RS(n, k) over GF(2^8)]
        ECC_ENC --> SYNC_FRAME[Framing & Header: Person 2\nPrepend Sync Barker Code + Payload Length]
        SYNC_FRAME --> CW[Full Framed Codeword Bits]
        CW --> ML_EMBED[ML Embedder: Person 3\nPOST /ml/embed\nSynonymous Substitution]
        ML_EMBED --> DNA[Watermarked CDS DNA]
    end

    subgraph Biological Channel
        DNA --> CH[Sequencing / Synthesis Noise Channel\nSubstitutions + Indels]
        CH --> NOISY_DNA[Observed DNA Sequence]
    end

    subgraph Receiver [Receiver Pipeline: Person 2 Backend -> Person 3 ML]
        NOISY_DNA --> ALIGN_SYNC[Frame & Sync Recovery: Person 2\nPairwiseAligner / Barker Correlator]
        ALIGN_SYNC --> FRAME_CHECK{Valid ORF &\nCodon Frame?}
        FRAME_CHECK -- No / Ambiguous --> ABORT[Sync Failure: Person 2\nAbort with Unaligned Flag]
        FRAME_CHECK -- Yes --> CARRIERS[Calibrated In-Frame Carrier Indices]
        CARRIERS --> ML_EXTRACT[ML Extractor: Person 3\nPOST /ml/extract\nCodon Reading]
        ML_EXTRACT --> RAW_BITS[Bit Estimates + Heuristic Confidences]
        RAW_BITS --> AGG[Symbol Erasure Aggregator: Person 2\nBit -> RS Symbol Erasure Mapping]
        AGG --> ECC_DEC[Errors-and-Erasures RS Decoder: Person 2\nRS(n, k) Decoder]
        ECC_DEC --> PAYLOAD[Recovered Payload Bytes]
    end
```

---

## 2. Framing, Bit-to-Symbol Layout & Byte Ordering

To ensure bit-exact compatibility between the TypeScript/Node.js backend and the Python ML microservice, the binary representation is frozen as follows:

### 2.1 Bit Ordering (MSB-First)
- All multi-bit entities are serialized **Most-Significant-Bit first (MSB-first / Big-Endian)**.
- Each Reed–Solomon symbol $S_j \in \text{GF}(2^8)$ represents $m = 8$ contiguous bits.
- Given a bit array $B = [b_0, b_1, b_2, \dots]$, the $j$-th RS symbol byte value is computed as:
  $$\text{ByteValue}(S_j) = \sum_{k=0}^{7} b_{8j + k} \cdot 2^{7-k} = b_{8j} \cdot 128 + b_{8j+1} \cdot 64 + \dots + b_{8j+7} \cdot 1$$
  where $b_{8j}$ is the MSB and $b_{8j+7}$ is the LSB.

### 2.2 Padding & Alignment
- If the original unencoded payload bit count is not a multiple of 8, it must be right-padded with zero bits (`0`) up to the nearest byte boundary before RS encoding.
- The framed codeword length in bits must exactly equal `len(carrierPositions)` used during embedding. If there are surplus carrier positions in the gene, the backend must pad the framed codeword with a deterministic pseudo-random trailing pattern or zero-padding.

### 2.3 Unified Preamble & Framing Convention
- **Single Convention**: The array `codewordBits` passed to `POST /ml/embed` is the **complete, finalized sequence of bits to embed**, already containing:
  1. **Sync Preamble**: e.g., 16-bit or 24-bit Barker sequence (`11111001101011100...`).
  2. **Header Field**: 16-bit payload length descriptor.
  3. **RS-Protected Payload**: Data symbols + RS parity symbols.
- The ML microservice operates strictly at the physical layer: it is agnostic to internal packet boundaries and maps `codewordBits[i]` to `carrierPositions[i]` $1:1$.

---

## 3. Mathematical Definitions & Error-Correction Capacity

### 3.1 Reed–Solomon Errors-and-Erasures Decoding
For an $(n, k)$ Reed–Solomon code over $\text{GF}(2^8)$ with $n - k = 2t_{\text{max}}$ parity symbols:
- Let $t$ denote the number of **erroneous RS symbols** (unknown locations).
- Let $e$ denote the number of **erased RS symbols** (known locations flagged prior to decoding).

The decoder is mathematically guaranteed to recover the original $k$ payload symbols if and only if:
$$2t + e \le n - k$$

*Note: $t$ and $e$ represent symbol counts, NOT bit counts.* A single corrupted bit within an 8-bit symbol corrupts the entire symbol.

### 3.2 Symbol-Level Erasure Aggregation Rule
Person 2's backend must translate bit-level extraction scores into symbol-level erasure flags before calling the RS decoder:
$$\text{symbol\_erased}[j] = \begin{cases} 
\text{True} & \text{if } \exists k \in \{0, \dots, 7\} \text{ such that } \text{confidences}[8j + k] < \tau \\
\text{False} & \text{otherwise}
\end{cases}$$

- **Threshold Calibration**: $\tau = 0.60$ is a provisional operating threshold. Because confidence scores currently represent heuristic probability estimates (where unambiguous synonymous codons score $0.99$, neutral/degenerate score $0.50$, and missing positions score $0.00$), setting $\tau = 0.60$ conservatively flags any ambiguous codon as an erasure.
- The backend RS decoder should receive the list of erased symbol indices:
  $$\text{erasure\_indices} = \{ j \in \{0, \dots, n-1\} \mid \text{symbol\_erased}[j] = \text{True} \}$$

---

## 4. Synchronization, Frame Validation & Failure Handling

When indels corrupt DNA, absolute nucleotide coordinates shift. Synchronization cannot be assumed; it must be verified.

### 4.1 Division of Responsibilities
1. **Person 2 (Backend Receiver)** owns synchronization and frame reconstruction:
   - Uses pairwise alignment against the known reference gene (via `PairwiseAligner`) OR correlates against the Barker preamble to locate the start of the CDS.
   - Verifies reading frame integrity: the start of each codon must be located at an offset $3c$ relative to the start codon (`ATG`).
   - Resolves or rejects multi-optimal alignments: if multiple distinct alignments yield identical scores with conflicting codon mappings, the backend **must abort and raise a Synchronization Error** rather than arbitrarily picking a path.
   - Maps reference carrier positions to observed sequence indices.
2. **Person 3 (ML Microservice)** owns codon reading:
   - Reads the triplets specified in the submitted `carrierPositions` array.
   - If a requested carrier index exceeds the length of the submitted DNA string, the endpoint returns `bitEstimate: 0` with `confidence: 0.0` (flagged as a definite erasure).
   - Array length invariant: `len(bitEstimates) == len(confidences) == len(carrierPositions)`.

---

## 5. API Schemas & HTTP Contracts

All endpoints are hosted at `http://127.0.0.1:8000`.

### Contract 1: `POST /ml/embed`
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
- **Status Codes**:
  - `200 OK`: Successful embedding; protein translation invariant confirmed.
  - `400 Bad Request`: Non-ACGT characters, length not divisible by 3, or `len(carrierPositions) < len(codewordBits)`.
  - `422 Unprocessable Entity`: Stamped sequence translation does not match native protein.

### Contract 2: `POST /ml/extract`
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
- **Status Codes**:
  - `200 OK`: Successful extraction.
  - `400 Bad Request`: Empty sequence, non-ACGT characters, or empty carrier list.

### Contract 3: `POST /ml/detect`
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
- **Status Codes**:
  - `200 OK`: Classification probabilities returned.
  - `503 Service Unavailable`: Detector weights missing from server (no silent fallback).

---

## 6. The Eight Final Integration Acceptance Criteria

| # | Acceptance Criterion | Benchmark Specification | Verification Scope | Status |
|---|---|---|---|---|
| **1** | **No-Noise Round Trip** | 100% bit-exact payload recovery across all 5 representative test genes (`b3920`, `b1703`, `b2022`, `b0930`, `b0568`). | ML physical layer & Backend framing | **PASS (for ML extraction; full payload verification pending ECC)** |
| **2** | **Protein Invariance** | Zero amino acid translation mismatches under NCBI Table 11 bacterial genetic code. | Full E. coli CDS genome (4,290 genes) | **PASS (4,290 / 4,290 verified)** |
| **3** | **Substitution Channel** | Raw extraction recovery $>92\%$ at 5.0% substitution rate; $>99\%$ at 0.5%. | Macro-averaged over 5 genes, 30 trials/gene | **PASS (92.9% at 5.0%; 99.4% at 0.5%)** |
| **4** | **Insertion-Only Channel** | Measured separately at rates $0.1\%, 0.5\%, 1.0\%, 2.0\%$ with reported erasures. | Macro-averaged over 5 genes, 30 trials/gene | **EVALUATED — raw recovery limited (ECC & Sync required)** |
| **5** | **Deletion-Only Channel** | Measured separately at rates $0.1\%, 0.5\%, 1.0\%, 2.0\%$ with reported erasures. | Macro-averaged over 5 genes, 30 trials/gene | **EVALUATED — raw recovery limited (ECC & Sync required)** |
| **6** | **Combined Indel Channel** | Measured at rates $0.1\%, 0.5\%, 1.0\%, 2.0\%$ with macro-averages and uncertainty intervals. | Macro-averaged over 5 genes, 30 trials/gene | **EVALUATED — raw recovery limited (ECC & Sync required)** |
| **7** | **Post-ECC Payload Recovery** | End-to-end recovery of original payload bits after Reed–Solomon errors-and-erasures decoding. | End-to-end pipeline with noise simulation | **PENDING (Awaiting Person 2 Backend ECC)** |
| **8** | **Full API Integration** | Automated test suite invoking live FastAPI service from Next.js backend. | Cross-repository integration tests | **PENDING (Awaiting Backend Client)** |

---

## 7. TypeScript Client Interface for Person 2

```typescript
// helixsign-ml-client.ts

export interface EmbedRequest {
  sequence: string;
  codewordBits: number[];       // Fully framed bits (Sync Header + RS Codeword)
  carrierPositions: number[];   // 0-indexed codon coordinates
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
  carrierPositions: number[];   // In-frame codon coordinates post-synchronization
  host?: string;
}

export interface ExtractResponse {
  bitEstimates: number[];       // Array of 0 or 1, length == carrierPositions.length
  confidences: number[];        // Probability score [0.0, 1.0]; score < tau -> RS erasure
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
