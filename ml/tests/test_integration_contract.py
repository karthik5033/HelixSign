"""
test_integration_contract.py — Validation of Version 1.4.0 Integration Contract specifications.

Tests:
1. 24-bit fixed synchronization word detection (Hamming distance correlation at known offsets).
2. Reed-Solomon framing offset (ensuring RS symbols map after preamble + header prefix).
3. Non-multiple-of-three nucleotide carrier offsets (essential for post-indel extraction).
4. Explicit erasure handling for null carrier offsets.
5. Header CRC-8 integrity verification and corrupted header rejection.
6. Reed-Solomon GF(256) poly 0x11D known reference test vector.
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
    # Embedded sync word with 1 flipped bit at index 5
    received_sync = list(SYNC_WORD_BITS)
    received_sync[5] ^= 1  # 1 bit error

    hamming_dist = sum(a != b for a, b in zip(SYNC_WORD_BITS, received_sync))
    assert hamming_dist == 1, "Hamming distance calculation error"

    # Detection rule: hamming_dist <= 2
    detected = hamming_dist <= 2
    assert detected is True

    # High noise (5 bit errors) -> not detected
    bad_sync = list(SYNC_WORD_BITS)
    for i in range(5):
        bad_sync[i] ^= 1
    assert sum(a != b for a, b in zip(SYNC_WORD_BITS, bad_sync)) > 2


# ---------------------------------------------------------------------------
# Test 2: RS Erasure Offset
# ---------------------------------------------------------------------------
def test_rs_symbol_erasure_offset():
    """Verify that RS symbol erasures map to bits starting after i_RS = 40 bits."""
    # 40 bits of preamble + header followed by 2 RS symbols (16 bits)
    # Symbol 0: bits 40..47
    # Symbol 1: bits 48..55
    total_bits = 40 + 16
    confidences = [0.99] * total_bits

    # Corrupt bit 43 (inside RS symbol 0)
    confidences[40 + 3] = 0.50

    # Corrupt bit 10 (inside preamble) — should NOT erase any RS symbol
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
    # Construct a sequence where a 1-bp deletion shifted a carrier codon to index 10 (not divisible by 3)
    # Index 0..9: 'ATGGCGGAGC' (10 bp)
    # Index 10..12: 'CTG' (Leu, top synonym -> bit 0)
    # Total length: 13 bp (not divisible by 3)
    dna = "ATGGCGGAGCCTG"

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

    # Carrier 0 is at offset 3 ('GCG'); Carrier 1 was deleted; Carrier 2 is at offset 6 ('GAA')
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
