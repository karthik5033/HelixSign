# HelixSign ML ↔ Backend Integration Contract
*Document Version: 1.3.0 · Status: Final Frozen Implementation Specification*

This document defines the frozen interface contract, byte/bit serialization layouts, framing protocol, Galois field parameters, erasure offset mathematics, and indel alignment semantics between **Person 3 (ML & Data)** and **Person 2 (Backend / ECC / Next.js API)**.

---

## 1. End-to-End System Architecture

```mermaid
flowchart LR
    subgraph Sender [Sender Pipeline: Person 2 Backend -> Person 3 ML]
        P[Original Payload Bytes] --> RS_ENC[1. RS Encoder: Person 2\nRS(n, k) over GF(256) - CCSDS 0x11D]
        RS_ENC --> FRAME[2. Framing & Header: Person 2\nPrepend Sync Barker + CRC-8 Protected Header]
        FRAME --> CW[3. Framed Codeword Bits\nMSB-first: Preamble + Header + RS Codeword]
        CW --> ML_EMBED[4. ML Embedder: Person 3\nPOST /ml/embed\nSynonymous Substitution]
        ML_EMBED --> DNA[Watermarked CDS DNA]
    end

    subgraph Biological Channel
        DNA --> CH[Sequencing / Synthesis Noise Channel\nSubstitutions + Indels]
        CH --> NOISY_DNA[Observed DNA Sequence]
    end

    subgraph Receiver [Receiver Pipeline: Person 2 Backend -> Person 3 ML]
        NOISY_DNA --> ALIGN[1. Reference Codon Interval Mapping: Person 2\nPairwiseAligner Maps Ref Carrier -> Observed Interval]
        ALIGN --> FRAME_VAL{All Carriers In-Frame\nContiguous Triplet?}
        FRAME_VAL -- Ambiguous / Ruptured --> SYNC_ERR[Sync Failure: Person 2\nAbort with Unaligned Flag]
        FRAME_VAL -- Valid Intervals --> EXTRACT_CALL[2. Observed Carrier Coordinates]
        EXTRACT_CALL --> ML_EXTRACT[3. ML Extractor: Person 3\nPOST /ml/extract\nCodon Reading]
        ML_EXTRACT --> RAW[Raw Bit Estimates + Confidences]
        RAW --> DEMUX[4. Frame Demux: Person 2\nPreamble & Header Validation via CRC-8]
        DEMUX -- Header Invalid --> CRC_ERR[Header Corrupt: Person 2\nAbort Payload Reconstruction]
        DEMUX -- Header OK --> RS_MAP[5. Offset Erasure Aggregator: Person 2\nApply Offset i_RS -> Symbol Erasures]
        RS_MAP --> RS_DEC[6. Errors-and-Erasures RS Decoder: Person 2\nRecover Original Bytes]
        RS_DEC --> PAYLOAD[Recovered Payload Bytes]
    end
```

---

## 2. Framing Protocol & Packet Layout

The bit array submitted to the ML physical layer (`codewordBits`) must follow a strict, single-convention packet layout:

```
+------------------------+-----------------------+-----------------------------+
|  Sync Preamble (24 b)  |   Header Field (16 b) |   RS Codeword (8 * n bits)  |
|  Barker Code (fixed)   |  Payload Len + CRC-8  |  Data Symbols + RS Parity   |
+------------------------+-----------------------+-----------------------------+
|<----- L_preamble ----->|<----- L_header ------>|<---------- L_RS ----------->|
|<----------------------------- L_codewordBits ------------------------------->|
```

### 2.1 Field Definitions
1. **Sync Preamble ($L_{\text{preamble}} = 24$ bits)**:
   - Fixed 24-bit synchronization pattern: `0b111110011010111001000101` (`0xF9AE45`).
   - Used by the receiver to confirm forward orientation and detect complete framing loss.
2. **Header Field ($L_{\text{header}} = 16$ bits)**:
   - **Bits 0–7 (8 bits)**: `payload_byte_length` $k_{\text{payload}} \in [1, 223]$ (length of original user payload in bytes).
   - **Bits 8–15 (8 bits)**: `header_crc8` computed over `payload_byte_length` using generator polynomial $x^8 + x^2 + x + 1$ (`0x07`).
   - If `header_crc8` fails on the receiver, extraction aborts immediately (prevents misinterpreting arbitrary length or corrupting memory).
3. **RS Codeword ($L_{\text{RS}} = 8 \times n$ bits)**:
   - $k$ payload bytes (padded with zeros if original payload $< k$) + $(n - k)$ parity bytes.

### 2.2 Strict Length Invariant
$$\boxed{ \text{len(codewordBits)} == \text{len(carrierPositions)} }$$
- No implicit or trailing padding is performed by the ML microservice.
- If the carrier capacity of the gene exceeds $L_{\text{preamble}} + L_{\text{header}} + L_{\text{RS}}$, Person 2's backend framing layer must pad `codewordBits` with deterministic pseudo-random bits (or select an $(n, k)$ RS code with larger $n$) prior to invoking `POST /ml/embed`.
- If `len(codewordBits) != len(carrierPositions)`, `POST /ml/embed` returns **HTTP 400 Bad Request**.

---

## 3. Reed–Solomon Code Parameter Specification (CCSDS Standard)

To prevent interoperability divergence between independent implementations, the RS parameters are frozen to the **CCSDS 255/223 standard** (or its shortened equivalents):

| Parameter | Frozen Value | Notes |
|---|---|---|
| **Galois Field** | $\text{GF}(2^8)$ | 8-bit symbols ($m = 8$). |
| **Field Primitive Polynomial** | $p(x) = x^8 + x^4 + x^3 + x^2 + 1$ | Value: `0x11D` (285 decimal). |
| **First Consecutive Root ($b$)** | $1$ | Zero index offset (roots $\alpha^1, \dots, \alpha^{2t}$). |
| **Primitive Element ($\alpha$)** | `0x02` | Standard root representation. |
| **Parity Placement** | Systematic Trailing | Codeword: $[ \text{Data Byte}_0, \dots, \text{Data Byte}_{k-1}, \text{Parity Byte}_0, \dots, \text{Parity Byte}_{2t-1} ]$. |
| **Code Length ($n, k$)** | Default: $\text{RS}(64, 32)$ or $\text{RS}(255, 223)$ | Person 2 sets $n$ based on gene carrier capacity; parity symbols $2t = n - k$. |

### 3.1 Serialization & Bit Ordering (MSB-First)
All RS symbols $S_j \in [0, 255]$ are serialized MSB-first:
$$\text{ByteValue}(S_j) = \sum_{b=0}^{7} \text{bit}_{b} \cdot 2^{7-b}$$
- Bit index $0$ of symbol $S_j$ is the MSB ($2^7$).
- Bit index $7$ of symbol $S_j$ is the LSB ($2^0$).

---

## 4. Mathematical Definition of Erasure Offsets

### 4.1 The Offset Mapping Invariant
The RS codeword does **not** begin at bit index $0$. It starts after the preamble and header:
$$i_{\text{RS}} = L_{\text{preamble}} + L_{\text{header}} = 24 + 16 = 40 \text{ bits}$$

### 4.2 Symbol Erasure Aggregation Formula
For each RS codeword symbol index $j \in \{0, 1, \dots, n-1\}$, the symbol is marked as an **erasure** if **any** of its constituent 8 bits has a confidence score below the threshold $\tau$:

$$\boxed{ \text{symbol\_erased}[j] = \bigvee_{b=0}^{7} \Big( \text{confidences}[i_{\text{RS}} + 8j + b] < \tau \Big) }$$

- **Operational Threshold**: $\tau = 0.60$ (heuristic operational parameter).
- **Decoder Input**: The backend passes the list of erased symbol indices to the RS errors-and-erasures decoder:
  $$\text{erasure\_symbol\_indices} = \{ j \in \{0, \dots, n-1\} \mid \text{symbol\_erased}[j] == \text{True} \}$$
- **Error-Correction Capacity**: The RS decoder successfully recovers all $k$ payload bytes if and only if:
  $$2t + e \le n - k$$
  where $t$ is the number of **erroneous RS symbols** and $e$ is the number of **erased RS symbols**.

---

## 5. Synchronization, Reference Codon Interval Mapping & Indels

### 5.1 The Interval Mapping Model (Post-Indel Extraction)
When insertions or deletions occur, the observed DNA no longer matches reference codon offsets. Triplet reading from `ATG` produces invalid, out-of-frame codons.

**Person 2 (Backend Receiver)** must execute **Reference-to-Observed Codon Interval Mapping**:
1. Global pairwise alignment (`Bio.Align.PairwiseAligner`) aligns the observed DNA sequence against the known native reference CDS.
2. For each designated reference carrier codon $C_{\text{ref}}$ (which spans reference nucleotide interval $[3c, 3c+2]$):
   - Determine the mapped nucleotide coordinates in the observed sequence: $[u_{\text{start}}, u_{\text{end}}]$.
3. **Carrier Validity Check**:
   - If $u_{\text{end}} - u_{\text{start}} == 2$ AND $u_{\text{start}}$ is in-frame (modulo 3 from validated start codon): The observed triplet is **valid and intact**. The backend passes $p = u_{\text{start}} / 3$ in `carrierPositions` to `POST /ml/extract`.
   - If an insertion or deletion overlaps $[3c, 3c+2]$ ($u_{\text{end}} - u_{\text{start}} \ne 2$ or bases are deleted): The carrier is **ruptured**. The backend does NOT attempt extraction; it passes an out-of-bounds sentinel index (or flags `confidence = 0.0`) so the position becomes an **erasure**.
4. **Ambiguity Abort**: If multiple global alignments produce identical optimal scores with conflicting codon interval mappings, the backend **aborts with `SynchronizationFailure`** rather than arbitrarily selecting an alignment.

---

## 6. Microservice API Schemas

### Contract 1: Watermark Embedding (`POST /ml/embed`)
- **Request Body**:
  ```json
  {
    "sequence": "ATGGCGGAACTGCGTCCGACGTATGGTGCAGACGAATTTCTTAAGCGGTAA",
    "codewordBits": [1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0],
    "carrierPositions": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48],
    "host": "E. coli K-12"
  }
  ```
  *Requirement: `len(codewordBits) == len(carrierPositions)` strictly enforced.*

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

### Contract 2: Watermark Extraction (`POST /ml/extract`)
- **Request Body**:
  ```json
  {
    "sequence": "ATGGCGGAGCTGCGTCCAACCTACGGCGCAGACGAATTTCTTAAGCGGTAA...",
    "carrierPositions": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48],
    "host": "E. coli K-12"
  }
  ```
- **Response Body**:
  ```json
  {
    "bitEstimates": [1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, ...],
    "confidences":  [0.99, 0.99, 0.99, 0.99, 0.99, 0.50, 0.99, ...]
  }
  ```
  - Invariant: `len(bitEstimates) == len(confidences) == len(carrierPositions)`.
  - Confidences are heuristic scores $\in [0.0, 1.0]$. Values $< 0.60 \to$ RS symbol erasure.

### Contract 3: Stealth Detection (`POST /ml/detect`)
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
  - Returns `503 Service Unavailable` if model weights are absent.

---

## 7. The Eight Integration Acceptance Criteria

| # | Acceptance Criterion | Benchmark Target | Scope | Status |
|---|---|---|---|---|
| **1** | **No-Noise Round Trip** | 100% bit-exact payload recovery on all 5 held-out test genes (`b3920`, `b1703`, `b2022`, `b0930`, `b0568`). | ML physical layer + Backend framing | **PASS (ML layer verified; end-to-end payload pending ECC)** |
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
// Specification-compliant framing, CRC-8, and erasure aggregation for Person 2

export const PREAMBLE_BITS = [1,1,1,1,1,0,0,1,1,0,1,0,1,1,1,0,0,1,0,0,0,1,0,1]; // 0xF9AE45 (24 bits)
export const L_PREAMBLE = 24;
export const L_HEADER = 16;
export const I_RS_OFFSET = L_PREAMBLE + L_HEADER; // 40 bits
export const TAU_ERASURE_THRESHOLD = 0.60;

/** Compute CRC-8 over an 8-bit payload length (x^8 + x^2 + x + 1, poly 0x07) */
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
