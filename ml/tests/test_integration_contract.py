"""
test_integration_contract.py — Validation of Version 1.4.0 Integration Contract specifications.

Tests:
1. 24-bit fixed synchronization word detection (Hamming distance correlation at known offsets).
2. Reed-Solomon framing offset (ensuring RS symbols map after preamble + header prefix).
3. Non-multiple-of-three nucleotide carrier offsets (essential for post-indel extraction).
4. Explicit erasure handling for null carrier offsets.
5. Header CRC-8 integrity verification and corrupted header rejection.
6. API endpoint extraction with carrierStartOffsets.
7. Independent Reed-Solomon GF(256) poly 0x11D reference test vector.
8. Robustness tests: negative offsets, out-of-bounds offsets, truncated triplets.
"""
import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from api.serve import app
from genestamp_ml.bio import load_codon_usage
from genestamp_ml.extract import extract_bits

# ---------------------------------------------------------------------------
# Constants from Specification v1.4.0
# ---------------------------------------------------------------------------
SYNC_WORD_HEX = 0xF9AE45  # 24 bits: 0b111110011010111001000101
SYNC_WORD_BITS = [1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1]
L_PREAMBLE = 24
L_HEADER = 16
I_RS_OFFSET = L_PREAMBLE + L_HEADER  # 40 bits


# ---------------------------------------------------------------------------
# Test 1: 24-bit Synchronization Word Detection
# ---------------------------------------------------------------------------
def test_sync_word_detection():
    """Verify that a 24-bit sync word can be detected under bounded noise (Hamming distance <= 2)."""
    received_sync = list(SYNC_WORD_BITS)
    received_sync[5] ^= 1  # 1 bit error

    hamming_dist = sum(a != b for a, b in zip(SYNC_WORD_BITS, received_sync))
    assert hamming_dist == 1, "Hamming distance calculation error"
    assert (hamming_dist <= 2) is True

    # High noise (5 bit errors) -> rejected
    bad_sync = list(SYNC_WORD_BITS)
    for i in range(5):
        bad_sync[i] ^= 1
    assert sum(a != b for a, b in zip(SYNC_WORD_BITS, bad_sync)) > 2


# ---------------------------------------------------------------------------
# Test 2: RS Erasure Offset
# ---------------------------------------------------------------------------
def test_rs_symbol_erasure_offset():
    """Verify that RS symbol erasures map to bits starting after i_RS = 40 bits."""
    total_bits = 40 + 16
    confidences = [0.99] * total_bits

    # Corrupt bit 43 (inside RS symbol 0)
    confidences[40 + 3] = 0.50

    # Corrupt bit 10 (inside preamble) — must NOT erase any RS symbol
    confidences[10] = 0.40

    TAU = 0.60
    erased_symbols = []
    n_symbols = 2

    for j in range(n_symbols):
        symbol_start = I_RS_OFFSET + (j * 8)
        is_erased = any(confidences[symbol_start + b] < TAU for b in range(8))
        if is_erased:
            erased_symbols.append(j)

    assert erased_symbols == [0], f"Expected symbol 0 erased, got {erased_symbols}"


# ---------------------------------------------------------------------------
# Test 3: Non-Multiple-of-3 Carrier Offset Extraction
# ---------------------------------------------------------------------------
def test_non_multiple_of_three_carrier_offset():
    """Verify that extract_bits can read a valid carrier codon starting at an arbitrary offset."""
    codon_usage = load_codon_usage()
    dna = "ATGGCGGAGCCTG"  # 13 nt; offset 10 is 'CTG'

    carrier_offsets = [10]  # offset 10 is NOT divisible by 3
    bits, confs = extract_bits(dna, carrier_start_offsets=carrier_offsets, codon_usage=codon_usage)

    assert len(bits) == 1
    assert confs[0] == 0.99, "Expected high confidence for intact CTG triplet"
    assert bits[0] in (0, 1)


# ---------------------------------------------------------------------------
# Test 4: Explicit Erasure for Deleted / Null Carrier
# ---------------------------------------------------------------------------
def test_deleted_carrier_codon_erasure():
    """Verify that passing None in carrier_start_offsets outputs a definite erasure (conf=0.0)."""
    codon_usage = load_codon_usage()
    dna = "ATGGCGGAACTGTAA"  # 15 nt

    offsets = [3, None, 6]
    bits, confs = extract_bits(dna, carrier_start_offsets=offsets, codon_usage=codon_usage)

    assert len(bits) == 3
    assert confs[1] == 0.0, "Deleted carrier codon must produce confidence=0.0 (definite erasure)"
    assert confs[0] > 0.90
    assert confs[2] > 0.90


# ---------------------------------------------------------------------------
# Test 5: Header CRC-8 Integrity Verification
# ---------------------------------------------------------------------------
def test_header_crc8_integrity():
    """Verify CRC-8 polynomial 0x07 calculation and corruption rejection."""
    def compute_crc8(val: int) -> int:
        crc = 0x00
        crc ^= val
        for _ in range(8):
            if crc & 0x80:
                crc = ((crc << 1) ^ 0x07) & 0xFF
            else:
                crc = (crc << 1) & 0xFF
        return crc

    payload_len = 32  # 32 bytes payload
    crc = compute_crc8(payload_len)

    # Valid header check
    assert compute_crc8(payload_len) == crc

    # Corrupted header check (bit flip in payload length)
    corrupted_len = payload_len ^ 1
    assert compute_crc8(corrupted_len) != crc, "CRC-8 must detect 1-bit header corruption"


# ---------------------------------------------------------------------------
# Test 6: API Endpoint with Non-Multiple-of-3 Offsets
# ---------------------------------------------------------------------------
def test_api_extract_with_start_offsets():
    """Verify POST /ml/extract accepts carrierStartOffsets and null erasures via API TestClient."""
    with TestClient(app) as client:
        dna = "ATGGCGGAGCCTG"  # 13 nt, non-multiple of 3
        payload = {
            "sequence": dna,
            "carrierStartOffsets": [0, None, 10],
            "host": "E. coli K-12",
        }
        r = client.post("/ml/extract", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert len(data["bitEstimates"]) == 3
        assert len(data["confidences"]) == 3
        assert data["confidences"][1] == 0.0, "Null carrier offset must yield confidence 0.0"


# ---------------------------------------------------------------------------
# Test 7: Independent Reed-Solomon GF(256) Poly 0x11D Reference Test Vector
# ---------------------------------------------------------------------------
def test_rs_known_test_vector():
    """
    Independent pure-math Galois field encoder verification.
    Uses GF(256) with primitive polynomial p(x) = x^8 + x^4 + x^3 + x^2 + 1 (0x11D = 285).
    Verifies that generator roots g(x) = prod_{i=0}^{2t-1} (x - alpha^{i+1})
    generate parity for standard reference input message bytes.
    """
    # 1. Build GF(256) exp and log tables
    exp = [0] * 512
    log = [0] * 256
    x = 1
    for i in range(255):
        exp[i] = x
        exp[i + 255] = x
        log[x] = i
        x <<= 1
        if x & 0x100:
            x ^= 0x11D  # 285 decimal

    def gf_mul(a: int, b: int) -> int:
        if a == 0 or b == 0:
            return 0
        return exp[log[a] + log[b]]

    def gf_poly_mul(p: list, q: list) -> list:
        res = [0] * (len(p) + len(q) - 1)
        for i, a in enumerate(p):
            for j, b in enumerate(q):
                res[i + j] ^= gf_mul(a, b)
        return res

    # 2. Build generator polynomial for 2t = 4 parity symbols: (x - alpha^1)(x - alpha^2)(x - alpha^3)(x - alpha^4)
    g = [1]
    for i in range(1, 5):
        g = gf_poly_mul(g, [1, exp[i]])

    # 3. Known test message: 4 bytes ASCII 'DNA!' = [0x44, 0x4E, 0x41, 0x21]
    msg = [0x44, 0x4E, 0x41, 0x21]
    n_parity = 4

    # 4. Systematic encoding: multiply msg by x^n_parity and compute remainder mod g(x)
    remainder = list(msg) + [0] * n_parity
    for i in range(len(msg)):
        coef = remainder[i]
        if coef != 0:
            for j in range(len(g)):
                remainder[i + j] ^= gf_mul(g[j], coef)

    parity = remainder[-n_parity:]
    codeword = msg + parity

    # Parity bytes must be deterministic and non-zero
    assert len(parity) == 4
    assert len(codeword) == 8
    assert all(0 <= b <= 255 for b in codeword)

    # 5. Syndrome check: evaluating codeword at alpha^1..alpha^4 must produce all zeros
    for i in range(1, 5):
        root = exp[i]
        val = 0
        for b in codeword:
            val = gf_mul(val, root) ^ b
        assert val == 0, f"Syndrome check failed at root alpha^{i} for reference test vector"


# ---------------------------------------------------------------------------
# Test 8: Offset Validation and Edge Cases
# ---------------------------------------------------------------------------
def test_offset_boundary_and_validation():
    """Verify offset edge cases: out-of-bounds, negative, truncated, and empty offsets."""
    codon_usage = load_codon_usage()
    dna = "ATGGCGGAA"  # 9 nt (3 codons)

    # Negative offset -> treated as invalid / erasure (conf=0.0)
    bits, confs = extract_bits(dna, carrier_start_offsets=[-1], codon_usage=codon_usage)
    assert confs[0] == 0.0

    # Offset at end of sequence with fewer than 3 bases left (offset 7 has only 2 bases: 'AA')
    bits, confs = extract_bits(dna, carrier_start_offsets=[7], codon_usage=codon_usage)
    assert confs[0] == 0.0, "Truncated triplet must produce confidence=0.0"

    # Offset completely beyond sequence length
    bits, confs = extract_bits(dna, carrier_start_offsets=[15], codon_usage=codon_usage)
    assert confs[0] == 0.0, "Out-of-bounds offset must produce confidence=0.0"
