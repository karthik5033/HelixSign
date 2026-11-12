# HelixSign ML ↔ Backend Integration Contract
*Document Version: 1.4.0 · Status: Final Frozen Implementation Specification*

This document defines the formal integration contract, framing layout, Galois field parameters, nucleotide start offset addressing, erasure mathematics, and error handling between **Person 3 (ML & Data)** and **Person 2 (Backend / ECC / Next.js API)**.

---

## 1. End-to-End System Architecture

```mermaid
flowchart LR
    subgraph Sender [Sender Pipeline: Person 2 Backend -> Person 3 ML]
        P[Original Payload Bytes] --> RS_ENC[1. RS Encoder: Person 2\nGeneric RS(n, k) over GF(256) poly 0x11D]
        RS_ENC --> FRAME[2. Framing & Header: Person 2\nPrepend 24-bit Sync Word + CRC-8 Protected Header]
        FRAME --> CW[3. Framed Codeword Bits\nMSB-first: Sync Word + Header + RS Codeword]
        CW --> ML_EMBED[4. ML Embedder: Person 3\nPOST /ml/embed\nSynonymous Substitution]
        ML_EMBED --> DNA[Watermarked CDS DNA]
    end

    subgraph Biological Channel
        DNA --> CH[Sequencing / Synthesis Noise Channel\nSubstitutions + Indels]
        CH --> NOISY_DNA[Observed DNA Sequence]
    end

    subgraph Receiver [Receiver Pipeline: Person 2 Backend -> Person 3 ML]
        NOISY_DNA --> ALIGN[1. Reference Codon Interval Mapping: Person 2\nPairwiseAligner Maps Ref Carrier -> Observed Nucleotide Start]
        ALIGN --> FRAME_VAL{Observed Carrier Intact\n3-base Triplet?}
        FRAME_VAL -- Ruptured / Deleted --> MARK_NULL[Set Offset = null\nExplicit Erasure]
        FRAME_VAL -- Intact Triplet --> SET_OFFSET[Record Mapped Nucleotide Start\ne.g. 104, 107 - Not Constrained to % 3]
        MARK_NULL --> EXTRACT_CALL[2. Submit carrierStartOffsets]
        SET_OFFSET --> EXTRACT_CALL
        EXTRACT_CALL --> ML_EXTRACT[3. ML Extractor: Person 3\nPOST /ml/extract\nReads Triplets at Exact Offsets]
        ML_EXTRACT --> RAW[Bit Estimates + Heuristic Confidences\nnull -> conf=0.0]
        RAW --> DEMUX[4. Frame Demux: Person 2\nSync Word Correlation & Header CRC-8 Validation]
        DEMUX -- Header Invalid --> CRC_ERR[Sync/CRC Failure: Person 2\nAbort Payload Reconstruction]
        DEMUX -- Header OK --> RS_MAP[5. Offset Erasure Aggregator: Person 2\nApply Offset i_RS -> Symbol Erasures]
        RS_MAP --> RS_DEC[6. Errors-and-Erasures RS Decoder: Person 2\nRecover Original Bytes]
        RS_DEC --> PAYLOAD[Recovered Payload Bytes]
    end
```

---

## 2. Framing Protocol & Serialization

The framed bit sequence submitted to `POST /ml/embed` (`codewordBits`) must adhere strictly to the following framing structure:

```
+-----------------------------+----------------------------+-----------------------------+
|   Sync Word (24 bits)       |    Header Field (16 bits)  |   RS Codeword (8 * n bits)  |
|   0xF9AE45 (Fixed Pattern)  |   Payload Len + CRC-8      |  Data Symbols + Parity      |
+-----------------------------+----------------------------+-----------------------------+
|<------- L_sync (24) ------->|<------- L_hdr (16) ------->|<---------- L_RS ----------->|
|<------------------------------ Total Codeword Bits ----------------------------------->|
```

### 2.1 Field Specifications
1. **24-bit Fixed Synchronization Word ($L_{\text{sync}} = 24$ bits)**:
   - **Pattern**: `0xF9AE45` (Binary: `111110011010111001000101`).
   - **Detection Rule**: Receiver correlates against this pattern. Synchronization is declared successful if the Hamming distance $d_H \le 2$ (tolerates up to 2 bit substitutions in the preamble).
2. **Header Field ($L_{\text{hdr}} = 16$ bits)**:
   - **Bits 0–7 (8 bits)**: `payload_byte_length` $k_{\text{payload}} \in [1, 223]$ (integer number of unpadded original payload bytes).
   - **Bits 8–15 (8 bits)**: `header_crc8` computed over `payload_byte_length`.
     - Generator Polynomial: $x^8 + x^2 + x + 1$ (`0x07`).
     - Initialization: `0x00`, Final XOR: `0x00`, Reflected: `False`.
   - **Failure Behavior**: If `header_crc8` fails on the receiver, extraction aborts immediately (prevents misinterpreting arbitrary length or buffer overflows).
3. **Reed–Solomon Codeword ($L_{\text{RS}} = 8 \times n$ bits)**:
   - $k$ payload bytes (padded with zeros if original payload $< k$) + $(n - k)$ parity bytes.

### 2.2 Strict Length Invariant
$$\boxed{ \text{len(codewordBits)} == \text{len(carrierPositions)} }$$
- No silent trailing padding is applied by the ML layer.
- If gene capacity exceeds packet size, Person 2's framing layer must pad `codewordBits` to exact carrier capacity prior to embedding. Any mismatch triggers **HTTP 400 Bad Request**.

---

## 3. Reed–Solomon Code Parameters (Generic Standard GF(256))

To avoid ambiguity, parameters are defined for a **standard generic $(n, k)$ Reed–Solomon code over $\text{GF}(256)$**:

| Parameter | Frozen Value | Notes |
|---|---|---|
| **Galois Field** | $\text{GF}(2^8)$ | 8-bit symbols ($m = 8$). |
| **Field Primitive Polynomial** | $p(x) = x^8 + x^4 + x^3 + x^2 + 1$ | Value: `0x11D` (285 decimal). |
| **Generator Polynomial Roots** | $g(x) = \prod_{i=0}^{2t-1} (x - \alpha^{i+1})$ | First consecutive root: $\alpha^1$, primitive element $\alpha = \text{0x02}$. |
| **Parity Placement** | Systematic Trailing | Codeword: $[ \text{Data Byte}_0, \dots, \text{Data Byte}_{k-1}, \text{Parity Byte}_0, \dots, \text{Parity Byte}_{2t-1} ]$. |
| **Code Length ($n, k$)** | E.g., $\text{RS}(64, 32)$ or $\text{RS}(255, 223)$ | Person 2 sets $n$ based on gene carrier capacity; parity symbols $2t = n - k$. |

### 3.1 Serialization & Bit Ordering (MSB-First)
All RS symbols $S_j \in [0, 255]$ are serialized MSB-first:
$$\text{ByteValue}(S_j) = \sum_{b=0}^{7} \text{bit}_{b} \cdot 2^{7-b}$$
- Bit index $0$ of symbol $S_j$ is the MSB ($2^7$).
- Bit index $7$ of symbol $S_j$ is the LSB ($2^0$).

---

## 4. Mathematical Definition of Erasure Offsets

### 4.1 The Offset Mapping Invariant
The RS codeword does **not** begin at bit index $0$. It starts after the framing prefix:
$$i_{\text{RS}} = L_{\text{sync}} + L_{\text{hdr}} = 24 + 16 = 40 \text{ bits}$$

### 4.2 Symbol Erasure Aggregation Formula
For each RS codeword symbol index $j \in \{0, 1, \dots, n-1\}$, the symbol is marked as an **erasure** if **any** of its constituent 8 bits has a confidence score below threshold $\tau$:

$$\boxed{ \text{symbol\_erased}[j] = \bigvee_{b=0}^{7} \Big( \text{confidences}[i_{\text{RS}} + 8j + b] < \tau \Big) }$$

- **Operational Threshold**: $\tau = 0.60$ (heuristic operational parameter; score $0.00$ denotes a definite carrier erasure).
- **Decoder Bound**: The RS decoder successfully recovers all $k$ payload bytes if:
  $$2t + e \le n - k$$
  where $t$ is the number of **erroneous RS symbols** and $e$ is the number of **erased RS symbols**.

---

## 5. Synchronization & Nucleotide Start Offset Addressing

### 5.1 The Nucleotide Offset Model (Indel Resilient)
After insertions or deletions, an intact carrier codon downstream from an indel may begin at a nucleotide index that is **not divisible by 3** (e.g. index 104, 107, 109).

To resolve this, `POST /ml/extract` directly accepts **`carrierStartOffsets`**:
- An array of integers specifying the exact 0-indexed nucleotide start position of each intact triplet in the observed sequence.
- **Explicit Erasure Representation**: If a reference carrier was deleted, interrupted, or ruptured by an indel, the backend passes **`null`** at that position.
- The ML extractor directly outputs:
  - Intact triplet: Bit estimate + confidence score ($0.99$ or $0.50$).
  - `null` offset: `bitEstimate = 0, confidence = 0.0` (definite erasure).
- The observed DNA sequence length submitted to `/ml/extract` is **not required to be divisible by 3** when `carrierStartOffsets` is provided.

---

## 6. Microservice API Schemas

### Contract 1: `POST /ml/embed`
- **Request Body**:
  ```json
  {
    "sequence": "ATGGCGGAACTGCGTCCGACGTATGGTGCAGACGAATTTCTTAAGCGGTAA...",
    "codewordBits": [1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, ...],
    "carrierPositions": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...],
    "host": "E. coli K-12"
  }
  ```
  *Requirement: `len(codewordBits) == len(carrierPositions)` strictly enforced (HTTP 400 otherwise).*

- **Response Body**:
  ```json
  {
    "stampedSequence": "ATGGCGGAGCTGCGTCCAACCTACGGCGCAGACGAATTTCTTAAGCGGTAA...",
    "proteinTranslation": "MAELRPTYGADEFLKR...",
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

### Contract 2: `POST /ml/extract`
- **Request Body (Offset Addressing Mode)**:
  ```json
  {
    "sequence": "ATGGCGGAGCCTG...",
    "carrierStartOffsets": [3, 6, null, 10],
    "host": "E. coli K-12"
  }
  ```
- **Response Body**:
  ```json
  {
    "bitEstimates": [0, 1, 0, 0],
    "confidences":  [0.99, 0.99, 0.0, 0.99]
  }
  ```
  - Invariant: `len(bitEstimates) == len(confidences) == len(carrierStartOffsets)`.
  - Offset `null` directly yields `confidence = 0.0` (definite erasure).

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
  - Returns `503 Service Unavailable` if model weights are unloaded.

---

## 7. The Eight Final Integration Acceptance Criteria

| # | Acceptance Criterion | Benchmark Target | Scope | Status |
|---|---|---|---|---|
| **1** | **No-Noise Round Trip** | 100% bit-exact payload recovery on all 5 test genes (`b3920`, `b1703`, `b2022`, `b0930`, `b0568`). | ML physical layer + Backend framing | **PASS (ML layer verified; end-to-end payload pending ECC)** |
| **2** | **Protein Invariance** | Zero amino acid translation mismatches under NCBI Table 11. | Full E. coli CDS genome (4,290 genes) | **PASS (4,290 / 4,290 verified)** |
| **3** | **Substitution Channel** | Raw extraction recovery $>92\%$ at 5.0% substitution rate; $>99\%$ at 0.5%. | Macro-averaged over 5 genes, 30 trials/gene | **PASS (92.9% at 5.0%; 99.4% at 0.5%)** |
| **4** | **Insertion-Only Channel** | Evaluated at rates $0.1\%, 0.5\%, 1.0\%, 2.0\%$ with reported erasures. | Macro-averaged over 5 genes, 30 trials/gene | **EVALUATED — raw recovery limited (ECC & Sync required)** |
| **5** | **Deletion-Only Channel** | Evaluated at rates $0.1\%, 0.5\%, 1.0\%, 2.0\%$ with reported erasures. | Macro-averaged over 5 genes, 30 trials/gene | **EVALUATED — raw recovery limited (ECC & Sync required)** |
| **6** | **Combined Indel Channel** | Evaluated at rates $0.1\%, 0.5\%, 1.0\%, 2.0\%$ with uncertainty intervals. | Macro-averaged over 5 genes, 30 trials/gene | **EVALUATED — raw recovery limited (ECC & Sync required)** |
| **7** | **Post-ECC Payload Recovery** | End-to-end recovery of original payload bits after RS errors-and-erasures decoding. | Full pipeline simulation under channel noise | **PENDING (Awaiting Person 2 Backend ECC implementation)** |
| **8** | **Full API Integration** | Automated test suite invoking live FastAPI service from Next.js backend. | Cross-repository E2E testing | **PENDING (Awaiting Backend Client)** |

---

## 8. TypeScript Implementation Template for Person 2

```typescript
// helixsign-codec.ts
// Specification-compliant framing, CRC-8, and offset erasure aggregation for Person 2

export const SYNC_WORD_BITS = [1,1,1,1,1,0,0,1,1,0,1,0,1,1,1,0,0,1,0,0,0,1,0,1]; // 0xF9AE45 (24 bits)
export const L_SYNC = 24;
export const L_HDR = 16;
export const I_RS_OFFSET = L_SYNC + L_HDR; // 40 bits
export const TAU_ERASURE_THRESHOLD = 0.60;

/** Compute CRC-8 over an 8-bit payload length (poly 0x07, init 0x00, xor 0x00) */
export function computeCrc8(val: number): number {
  let crc = 0x00;
  crc ^= val;
  for (let i = 0; i < 8; i++) {
    if (crc & 0x80) {
      crc = ((crc << 1) ^ 0x07) & 0xFF;
    } else {
      crc = (crc << 1) & 0xFF;
    }
  }
  return crc;
}

/** Serialize byte to 8 MSB-first bits */
export function byteToMsbBits(byte: number): number[] {
  const bits: number[] = [];
  for (let i = 7; i >= 0; i--) {
    bits.push((byte >> i) & 1);
  }
  return bits;
}

/** Aggregate bit-level confidences into symbol-level erasure indices for RS decoder */
export function extractSymbolErasures(confidences: number[], nSymbols: number): number[] {
  const erasedSymbols: number[] = [];
  for (let j = 0; j < nSymbols; j++) {
    const symbolStartBit = I_RS_OFFSET + (j * 8);
    let isErased = false;
    for (let b = 0; b < 8; b++) {
      const bitIndex = symbolStartBit + b;
      if (bitIndex >= confidences.length || confidences[bitIndex] < TAU_ERASURE_THRESHOLD) {
        isErased = true;
        break;
      }
    }
    if (isErased) {
      erasedSymbols.push(j);
    }
  }
  return erasedSymbols;
}
```
