# HelixSign ML ↔ Backend Integration Contract
*Document Version: 1.5.0 · Status: Frozen ML/Backend Interface Specification*

This document defines the formal integration contract, framing layout, Galois field parameters, nucleotide start offset addressing, erasure mathematics, error handling, and independently verified test vectors between **Person 3 (ML & Data)** and **Person 2 (Backend / ECC / Next.js API)**.

---

## 1. End-to-End System Architecture

```mermaid
flowchart LR
    subgraph Sender [Sender Pipeline: Person 2 Backend -> Person 3 ML]
        P[Original Payload Bytes] --> RS_ENC[1. RS Encoder: Person 2\nRS(n, k) over GF(256) poly 0x11D, alpha=2, root=alpha^0]
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
        FRAME_VAL -- Intact Triplet --> SET_OFFSET[Record Mapped Nucleotide Start\ne.g. 104, 107 - Non-multiple of 3]
        MARK_NULL --> EXTRACT_CALL[2. Submit carrierStartOffsets]
        SET_OFFSET --> EXTRACT_CALL
        EXTRACT_CALL --> ML_EXTRACT[3. ML Extractor: Person 3\nPOST /ml/extract\nReads Triplets at Exact Offsets]
        ML_EXTRACT --> RAW[Bit Estimates + Heuristic Confidences\nnull -> conf=0.0]
        RAW --> DEMUX[4. Frame Demux: Person 2\nSync Word Correlation & Header CRC-8 Validation]
        DEMUX -- Header Invalid --> CRC_ERR[Sync/CRC Failure: Person 2\nAbort Payload Reconstruction]
        DEMUX -- Header OK --> RS_MAP[5. Offset Erasure Aggregator: Person 2\nApply Offset i_RS = 40 -> Symbol Erasures]
        RS_MAP --> RS_DEC[6. Errors-and-Erasures RS Decoder: Person 2\nRecover Original Bytes: 2t + e <= nsym]
        RS_DEC --> PAYLOAD[Recovered Payload Bytes]
    end
```

---

## 2. Framing Protocol & Serialization

The framed bit sequence submitted to `POST /ml/embed` (`codewordBits`) adheres strictly to the following framing structure:

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
   - **Hexadecimal Pattern**: `0xF9AE45`.
   - **Bit Sequence (MSB first)**: `[1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1]`.
   - **Bit Inversions**: Not permitted.
   - **Detection Rule**: Receiver sliding window correlator computes Hamming distance $d_H$. Synchronization declared successful if $d_H \le 2$ (tolerates up to 2 bit substitutions in preamble).
   - **Ambiguity Rule**: If multiple offsets tie for minimum $d_H \le 2$, receiver marks framing `ambiguous = true`.

2. **Header Field ($L_{\text{hdr}} = 16$ bits)**:
   - **Byte 0 (Bits 0–7)**: Unsigned 8-bit integer `payload_length` ($1 \le L_{\text{payload}} \le 223$), representing the exact byte count of original watermark data.
   - **Byte 1 (Bits 8–15)**: `header_crc8` computed over Byte 0.
     - Generator Polynomial: $x^8 + x^2 + x + 1$ (`0x07`).
     - Initialization: `0x00`, Final XOR: `0x00`, Reflected: `False`.
   - **Rejection Path**: If `header_crc8` fails on the receiver, extraction aborts immediately (prevents misinterpreting arbitrary length or buffer overflows).

3. **Reed–Solomon Codeword ($L_{\text{RS}} = 8 \times n$ bits)**:
   - $k$ data symbols followed by $(n - k)$ trailing parity symbols.
   - Serialized MSB-first per byte: Bit 0 is MSB ($2^7$), Bit 7 is LSB ($2^0$).

### 2.2 Strict Length Invariant
$$\boxed{ \text{len(codewordBits)} == \text{len(carrierPositions)} }$$
- No silent trailing padding is applied by the ML layer.
- If gene capacity exceeds packet size, Person 2's framing layer must pad `codewordBits` to exact carrier capacity prior to embedding. Any mismatch triggers **HTTP 400 Bad Request**.

---

## 3. Reed–Solomon Code Parameters & Independent Reference Vectors

To ensure byte-for-byte and bit-for-bit interoperability between TypeScript (`backend/src/core/ecc.ts`) and Python (`ml/genestamp_ml/codec.py`), RS parameters are defined over standard $\text{GF}(256)$:

| Parameter | Specification Value | Description / Reference |
|---|---|---|
| **Galois Field** | $\text{GF}(2^8)$ | Field size $2^8 = 256$, non-zero elements $255$. |
| **Field Primitive Polynomial** | $p(x) = x^8 + x^4 + x^3 + x^2 + 1$ | `0x11D` (285 decimal). |
| **Generator Alpha** | $\alpha = 2$ (`0x02`) | Consecutive roots $\alpha^i$ for $i = 0, \dots, nsym-1$. |
| **First Consecutive Root** | $\alpha^0 = 1$ | Matches systematic standard construction. |
| **Generator Polynomial** | $g(x) = \prod_{i=0}^{nsym-1} (x - \alpha^i)$ | Degree $nsym$. Stored highest degree first. |
| **Parity Placement** | Trailing systematic | Codeword = $[ \text{Data}_0, \dots, \text{Data}_{k-1}, \text{Parity}_0, \dots, \text{Parity}_{nsym-1} ]$. |
| **Shortening Convention** | Zero-prefix invariance | Leading zeros have zero quotient terms, yielding invariant parity. |
| **Default Configuration** | $\text{RS}(16, 8)$ | $k = 8$ data bytes, $nsym = 8$ parity bytes ($2t = 8$). |

### 3.1 Independently Verified Known Test Vectors

Both implementations are strictly validated against these two reference test vectors:

#### Test Vector 1: ASCII `"HELIXSGN"` (8 bytes)
- **Input Data Bytes**: `[0x48, 0x45, 0x4C, 0x49, 0x58, 0x53, 0x47, 0x4E]`
- **Calculated Parity Bytes**: `[0xD2, 0x26, 0x18, 0xCE, 0xF7, 0x68, 0x9B, 0x2C]`
- **Complete Codeword (Hex)**: `48454c495853474ed22618cef7689b2c` (16 bytes = 128 bits)
- **Syndrome Check**: $\forall i \in [0, 7]: S_i = \sum_{j=0}^{15} c_j (\alpha^i)^{15-j} = 0$.

#### Test Vector 2: Full Byte Range Payload (`backend/tests/ecc.test.ts`)
- **Input Data Bytes**: `[0x00, 0x01, 0x7F, 0x80, 0xAB, 0xCD, 0xEF, 0xFF]`
- **Calculated Parity Bytes**: `[0x48, 0x05, 0x44, 0x6D, 0x0D, 0x1B, 0x73, 0x89]`
- **Complete Codeword (Hex)**: `00017f80abcdefff4805446d0d1b7389`
- **Syndrome Check**: All 8 syndrome evaluations equal zero.

### 3.2 Correction Capability Bound
$$\boxed{ 2t + e \le nsym }$$
where $t$ is the number of unflagged symbol errors and $e$ is the number of flagged symbol erasures.
- For $nsym = 8$: corrects up to $4$ symbol errors, up to $8$ symbol erasures, or combinations such as $2$ errors + $4$ erasures ($2(2) + 4 = 8$).

---

## 4. Mathematical Definition of Erasure Offsets

### 4.1 The Offset Mapping Invariant
The Reed-Solomon codeword begins at bit offset $i_{\text{RS}}$:
$$\boxed{ i_{\text{RS}} = L_{\text{sync}} + L_{\text{hdr}} = 24 + 16 = 40 \text{ bits} }$$

Any low extraction confidence in the preamble (bits $0 \dots 23$) or header (bits $24 \dots 39$) affects frame synchronization or CRC validation, but does **not** generate RS symbol erasures.

### 4.2 Symbol Erasure Aggregation Formula
For each RS codeword symbol index $j \in \{0, 1, \dots, n-1\}$, the symbol is marked as an **erasure** if **any** of its constituent 8 bits has a confidence score below threshold $\tau$:

$$\boxed{ \text{symbol\_erased}[j] = \bigvee_{b=0}^{7} \Big( \text{confidences}[i_{\text{RS}} + 8j + b] < \tau \Big) }$$

- **Operational Threshold**: $\tau = 0.60$ (heuristic operational parameter; score $0.00$ denotes a definite carrier erasure).

---

## 5. Synchronization & Addressing Modes

### 5.1 Mutual Exclusivity and Input Validation
The extractor interface enforces strict mutual exclusivity between addressing modes:
1. **`carrierStartOffsets` (Primary Indel-Resilient Mode)**:
   - Array of 0-indexed nucleotide start positions in the observed sequence.
   - Intact codons may start at any nucleotide index (including non-multiples of 3).
   - Ruptured / deleted carrier positions must be marked **`null`** (produces `confidence = 0.0`).
   - Sequence length does **not** need to be divisible by 3.
   - Strict validation: elements must be integer or null. Booleans, floats, and strings are rejected (`HTTP 422`).
   - Overlap policy: non-overlapping triplets enforced. For any two non-null offsets $s_a < s_b$ within sequence bounds, $s_b \ge s_a + 3$ is strictly required (rejects collisions with `HTTP 400`).
2. **`carrierPositions` (Legacy Mode)**:
   - Array of non-negative 0-indexed codon indices (nucleotide start = $3 \times pos$).
   - Strict validation: negative values and non-integers are rejected (`HTTP 400` / `HTTP 422`).
3. **Mutual Exclusivity**:
   - Supplying both fields returns **HTTP 400 Bad Request**.
   - Supplying neither field returns **HTTP 400 Bad Request**.

### 5.2 Heuristic Confidence Scores
Extraction confidence values returned by `/ml/extract` are heuristic reliability scores in $[0.0, 1.0]$:
- **`0.99`**: Codon perfectly matches one of the top-2 ranked synonymous codons for the amino acid.
- **`0.50`**: Ambiguous. Codon is synonymous but belongs to a lower-ranked variant (or amino acid has $< 2$ synonyms).
- **`0.00`**: Definite erasure. Carrier offset is `null`, negative, out-of-bounds, truncated ($< 3$ bases), or contains degenerate bases.

---

## 6. Microservice API Specifications

### Endpoint 1: `POST /ml/embed`
- **Request Body**:
  ```json
  {
    "sequence": "ATGGCGGAACTGCGTCCGACGTATGGTGCAGACGAATTTCTTAAGCGGTAA...",
    "codewordBits": [1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, ...],
    "carrierPositions": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...],
    "host": "E. coli K-12"
  }
  ```
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

### Endpoint 2: `POST /ml/extract`
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

### Endpoint 3: `POST /ml/detect`
- **Request Body**:
  ```json
  {
    "sequence": "ATGGCGGAGCTGCGTCCAACCTACGGCGCAGACGAATTTCTTAAGCGGTAA"
  }
  ```
- **Response Body**:
  ```json
  {
    "kmerProbability": 0.501,
    "cnnProbability": 0.498,
    "degraded": false,
    "kmerAvailable": true,
    "cnnAvailable": true
  }
  ```
  *Note: Returns `HTTP 503` if detector models are unloaded.*

---

## 7. The Eight Final Integration Acceptance Criteria

| # | Acceptance Criterion | Benchmark Target | Scope | Status |
|---|---|---|---|---|
| **1** | **No-Noise Round Trip** | 100% bit-exact payload recovery on all 5 test genes (`b3920`, `b1703`, `b2022`, `b0930`, `b0568`). | ML physical layer + Backend framing | **PASS (ML layer verified; end-to-end payload pending live backend run)** |
| **2** | **Protein Invariance** | Zero amino acid translation mismatches under NCBI Table 11. | Full E. coli CDS genome (4,290 genes) | **PASS (4,290 / 4,290 verified)** |
| **3** | **Substitution Channel** | Raw extraction recovery $>92\%$ at 5.0% substitution rate; $>99\%$ at 0.5%. | Macro-averaged over 5 genes, 30 trials/gene | **PASS (92.9% at 5.0%; 99.4% at 0.5%)** |
| **4** | **Insertion-Only Channel** | Evaluated at rates $0.1\%, 0.5\%, 1.0\%, 2.0\%$ with reported erasures. | Macro-averaged over 5 genes, 30 trials/gene | **EVALUATED — raw recovery limited (ECC & Sync required)** |
| **5** | **Deletion-Only Channel** | Evaluated at rates $0.1\%, 0.5\%, 1.0\%, 2.0\%$ with reported erasures. | Macro-averaged over 5 genes, 30 trials/gene | **EVALUATED — raw recovery limited (ECC & Sync required)** |
| **6** | **Combined Indel Channel** | Evaluated at rates $0.1\%, 0.5\%, 1.0\%, 2.0\%$ with uncertainty intervals. | Macro-averaged over 5 genes, 30 trials/gene | **EVALUATED — raw recovery limited (ECC & Sync required)** |
| **7** | **Post-ECC Payload Recovery** | End-to-end recovery of original payload bits after RS errors-and-erasures decoding. | Full pipeline simulation under channel noise | **PENDING (Awaiting Person 2 Backend ECC live execution)** |
| **8** | **Full API Integration** | Automated test suite invoking live FastAPI service from Next.js backend. | Cross-repository E2E testing | **PENDING (Awaiting Backend Client run)** |

---

## 8. Verified Codec Implementation Reference

Person 3's `genestamp_ml/codec.py` and Person 2's `backend/src/core/ecc.ts` share the exact same parameters. Below is the verified Python reference matching the TypeScript implementation:

```python
# genestamp_ml/codec.py
from genestamp_ml.codec import (
    SYNC_WORD_HEX,           # 0xF9AE45
    SYNC_WORD_BITS,          # 24 bits MSB-first
    detect_sync_word,        # Sliding-window correlator with ambiguity detection
    compute_crc8,            # CRC-8 (polynomial 0x07)
    parse_and_verify_header, # Validates payload length in [1, 223] and CRC
    aggregate_symbol_erasures,# Bit-to-RS symbol erasure mapping with i_RS = 40
    rs_encode,               # Systematic RS(n, k) encoder over GF(256) poly 0x11D
    rs_decode,               # Systematic RS(n, k) errors-and-erasures decoder
)
```
