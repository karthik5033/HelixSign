"""
test_integration_contract.py — Comprehensive validation of Version 1.5.0 Integration Contract.

Validates the complete interoperability contract between ML (Person 3) and Backend (Person 2):
1. Synchronization word detection: sliding window correlator for 0xF9AE45 with bounded Hamming distance and ambiguity detection.
2. Reed-Solomon framing offset: soft-confidence bit-to-symbol erasure aggregation taking 40-bit prefix into account.
3. Header CRC-8 integrity and corruption rejection: generator polynomial 0x07 with length validation.
4. Independent Reed-Solomon reference vectors: hardcoded test vectors matching backend ecc.ts for RS(16,8) over GF(256) poly 0x11D.
5. Error and erasure correction: verified for 0 errors, 4 symbol errors, 8 symbol erasures, and simultaneous 2 errors + 4 erasures.
6. Addressing mode exclusivity: strict rejection if both or neither carrierPositions and carrierStartOffsets are supplied.
7. Strict offset validation: rejection of non-integers, booleans, negative legacy indices, and overlapping carrier triplets.
8. Non-multiple-of-3 carrier offset extraction: verified against loaded E. coli K-12 codon usage tables.
9. Out-of-bounds, truncated triplets, and explicit null erasures producing confidence=0.0.
10. FastAPI endpoint validation for /ml/extract under valid and invalid inputs.
"""
import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from api.serve import app
from genestamp_ml.bio import load_codon_usage
from genestamp_ml.embed import get_synonymous_map
from genestamp_ml.extract import extract_bits
from genestamp_ml.codec import (
    SYNC_WORD_HEX,
    SYNC_WORD_BITS,
    detect_sync_word,
    compute_crc8,
    parse_and_verify_header,
    aggregate_symbol_erasures,
    rs_encode,
    rs_decode,
    is_valid_codeword,
)

# ---------------------------------------------------------------------------
# Constants from Specification v1.5.0
# ---------------------------------------------------------------------------
L_PREAMBLE = 24
L_HEADER = 16
I_RS_OFFSET = L_PREAMBLE + L_HEADER  # 40 bits


# ---------------------------------------------------------------------------
# 1. 24-bit Synchronization Word Correlator
# ---------------------------------------------------------------------------
def test_sync_word_detection():
    """Verify that detect_sync_word detects 0xF9AE45 under clean, noisy, and offset conditions."""
    # 1. Exact match at offset 0
    res = detect_sync_word(SYNC_WORD_BITS, max_hamming_distance=2)
    assert res["synchronized"] is True
    assert res["offset"] == 0
    assert res["hamming_distance"] == 0
    assert res["ambiguous"] is False

    # 2. Embedded inside noisy bit stream at offset 15
    prefix = [0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1]  # 15 bits
    noisy_sync = list(SYNC_WORD_BITS)
    noisy_sync[3] ^= 1  # 1 bit flip
    noisy_sync[17] ^= 1  # 2nd bit flip (Hamming dist = 2)
    suffix = [1, 0, 1, 1, 0]

    bit_stream = prefix + noisy_sync + suffix
    res = detect_sync_word(bit_stream, max_hamming_distance=2)
    assert res["synchronized"] is True
    assert res["offset"] == 15
    assert res["hamming_distance"] == 2
    assert res["ambiguous"] is False

    # 3. Excessive noise (3 bit flips > threshold 2)
    noisy_sync_3 = list(SYNC_WORD_BITS)
    noisy_sync_3[0] ^= 1
    noisy_sync_3[1] ^= 1
    noisy_sync_3[2] ^= 1
    res_fail = detect_sync_word(noisy_sync_3, max_hamming_distance=2)
    assert res_fail["synchronized"] is False
    assert res_fail["hamming_distance"] == 3

    # 4. Ambiguous candidates (two identical sync words in stream)
    ambiguous_stream = SYNC_WORD_BITS + [0] * 5 + SYNC_WORD_BITS
    res_amb = detect_sync_word(ambiguous_stream, max_hamming_distance=2)
    assert res_amb["synchronized"] is True
    assert res_amb["ambiguous"] is True


# ---------------------------------------------------------------------------
# 2. RS Erasure Aggregation with Prefix Offset
# ---------------------------------------------------------------------------
def test_rs_symbol_erasure_offset():
    """Verify aggregate_symbol_erasures maps low confidence bits to RS symbols starting at bit 40."""
    total_bits = 40 + (8 * 4)  # 40 prefix bits + 4 RS symbols (32 bits)
    confidences = [0.99] * total_bits

    # Corrupt bit 10 (inside 24-bit preamble) — must NOT erase any RS symbol
    confidences[10] = 0.20

    # Corrupt bit 30 (inside 16-bit header) — must NOT erase any RS symbol
    confidences[30] = 0.30

    erased = aggregate_symbol_erasures(confidences, n_symbols=4, tau=0.60, rs_bit_offset=40)
    assert erased == [], f"Prefix corruption should not mark RS symbols erased: {erased}"

    # Corrupt bit 43 (inside RS symbol 0: bits 40..47)
    confidences[43] = 0.50

    # Corrupt bit 58 (inside RS symbol 2: bits 56..63)
    confidences[58] = 0.00

    erased = aggregate_symbol_erasures(confidences, n_symbols=4, tau=0.60, rs_bit_offset=40)
    assert erased == [0, 2], f"Expected symbols 0 and 2 erased, got {erased}"


# ---------------------------------------------------------------------------
# 3. Header CRC-8 Calculation & Parser Integrity
# ---------------------------------------------------------------------------
def test_header_crc8_integrity():
    """Verify CRC-8 polynomial 0x07 calculation and header parser rejection path."""
    for length in [1, 8, 32, 100, 223]:
        crc = compute_crc8(length)
        header = bytes([length, crc])
        valid, parsed_len = parse_and_verify_header(header)
        assert valid is True
        assert parsed_len == length

    # 1-bit corruption in payload length byte
    corrupted_header_1 = bytes([32 ^ 1, compute_crc8(32)])
    valid, _ = parse_and_verify_header(corrupted_header_1)
    assert valid is False, "CRC-8 parser must reject corrupted length byte"

    # Corruption in CRC byte
    corrupted_header_2 = bytes([32, compute_crc8(32) ^ 0x01])
    valid, _ = parse_and_verify_header(corrupted_header_2)
    assert valid is False, "CRC-8 parser must reject corrupted CRC byte"

    # Payload length out of bounds (0 or > 223)
    zero_header = bytes([0, compute_crc8(0)])
    valid, _ = parse_and_verify_header(zero_header)
    assert valid is False, "Parser must reject payload length 0"

    overflow_header = bytes([224, compute_crc8(224)])
    valid, _ = parse_and_verify_header(overflow_header)
    assert valid is False, "Parser must reject payload length > 223"


# ---------------------------------------------------------------------------
# 4. Independent Reed-Solomon Known Test Vector
# ---------------------------------------------------------------------------
def test_rs_known_test_vector():
    """
    Verify RS(16,8) encoding and decoding against independently precomputed reference test vectors.
    Uses GF(256) with primitive polynomial 0x11D, generator alpha = 2, first root alpha^0.
    """
    # Reference Vector 1: ASCII 'HELIXSGN' (8 bytes)
    # Parity precalculated independently via standard systematic generator prod_{i=0}^7 (x - 2^i)
    msg1 = b"HELIXSGN"
    expected_parity1 = bytes([210, 38, 24, 206, 247, 104, 155, 44])
    expected_cw1 = msg1 + expected_parity1
    expected_hex1 = "48454c495853474ed22618cef7689b2c"

    encoded1 = rs_encode(msg1, nsym=8)
    assert encoded1 == expected_cw1
    assert encoded1.hex() == expected_hex1
    assert is_valid_codeword(encoded1, nsym=8) is True

    # Reference Vector 2: Exact test payload from backend ecc.test.ts
    msg2 = bytes([0x00, 0x01, 0x7F, 0x80, 0xAB, 0xCD, 0xEF, 0xFF])
    expected_parity2 = bytes([72, 5, 68, 109, 13, 27, 115, 137])
    expected_cw2 = msg2 + expected_parity2
    expected_hex2 = "00017f80abcdefff4805446d0d1b7389"

    encoded2 = rs_encode(msg2, nsym=8)
    assert encoded2 == expected_cw2
    assert encoded2.hex() == expected_hex2
    assert is_valid_codeword(encoded2, nsym=8) is True


# ---------------------------------------------------------------------------
# 5. Reed-Solomon Errors-and-Erasures Decoder Recovery
# ---------------------------------------------------------------------------
def test_rs_errors_and_erasures_decoding():
    """
    Verify RS(16,8) decoder recovery under clean, errors-only, erasures-only,
    and simultaneous error-and-erasure conditions: 2t + e <= 8.
    """
    cw = bytes.fromhex("48454c495853474ed22618cef7689b2c")  # HELIXSGN

    # 1. Clean codeword
    dec, nerr = rs_decode(cw, nsym=8)
    assert dec == b"HELIXSGN"
    assert nerr == 0

    # 2. Maximum symbol errors (t = 4, e = 0 -> 2*4 + 0 = 8 <= 8)
    err_cw = bytearray(cw)
    err_cw[0] ^= 0x55
    err_cw[3] ^= 0xAA
    err_cw[8] ^= 0x12
    err_cw[15] ^= 0x99
    dec, nerr = rs_decode(err_cw, nsym=8)
    assert dec == b"HELIXSGN"
    assert nerr == 4

    # 3. Maximum symbol erasures (t = 0, e = 8 -> 0 + 8 = 8 <= 8)
    erase_cw = bytearray(cw)
    erasures = [0, 2, 4, 6, 8, 10, 12, 14]
    for p in erasures:
        erase_cw[p] = 0x00
    dec, nerr = rs_decode(erase_cw, nsym=8, erasures=erasures)
    assert dec == b"HELIXSGN"
    assert nerr == 8

    # 4. Simultaneous errors and erasures: 2 errors + 4 erasures (2*2 + 4 = 8 <= 8)
    combo_cw = bytearray(cw)
    # 2 unflagged symbol errors at positions 1 and 7
    combo_cw[1] ^= 0x33
    combo_cw[7] ^= 0x77
    # 4 flagged erasures at positions 3, 5, 9, 13
    combo_erasures = [3, 5, 9, 13]
    for p in combo_erasures:
        combo_cw[p] = 0xFF
    dec, nerr = rs_decode(combo_cw, nsym=8, erasures=combo_erasures)
    assert dec == b"HELIXSGN"
    assert nerr == 6

    # 5. Beyond correction capability (5 symbol errors > 4) -> must raise ValueError
    unrec_cw = bytearray(cw)
    for i in range(5):
        unrec_cw[i] ^= 0xFF
    with pytest.raises(ValueError, match="Too many errors"):
        rs_decode(unrec_cw, nsym=8)


# ---------------------------------------------------------------------------
# 6. Addressing Mode Exclusivity and Type Validation in extract_bits
# ---------------------------------------------------------------------------
def test_extract_addressing_mode_validation():
    """Verify that extract_bits strictly enforces mutual exclusivity and type checks."""
    dna = "ATGGCGGAGCCTG"  # 13 nt

    # 1. Both provided -> ValueError
    with pytest.raises(ValueError, match="Mutual exclusivity violated"):
        extract_bits(dna, carrier_positions=[0], carrier_start_offsets=[0])

    # 2. Neither provided -> ValueError
    with pytest.raises(ValueError, match="Either carrier_start_offsets or carrier_positions"):
        extract_bits(dna)

    # 3. Invalid offset types in carrier_start_offsets
    with pytest.raises(TypeError, match="carrier_start_offsets must be a list"):
        extract_bits(dna, carrier_start_offsets="not_a_list")  # type: ignore

    with pytest.raises(TypeError, match="Invalid offset type 'str'"):
        extract_bits(dna, carrier_start_offsets=["3"])  # type: ignore

    with pytest.raises(TypeError, match="Invalid offset type 'float'"):
        extract_bits(dna, carrier_start_offsets=[3.5])  # type: ignore

    with pytest.raises(TypeError, match="Invalid offset type 'bool'"):
        extract_bits(dna, carrier_start_offsets=[True])  # type: ignore

    # 4. Invalid position types and values in carrier_positions
    with pytest.raises(TypeError, match="carrier_positions must be a list"):
        extract_bits(dna, carrier_positions="not_a_list")  # type: ignore

    with pytest.raises(TypeError, match="Invalid carrier codon index type 'str'"):
        extract_bits(dna, carrier_positions=["0"])  # type: ignore

    with pytest.raises(TypeError, match="Invalid carrier codon index type 'bool'"):
        extract_bits(dna, carrier_positions=[False])  # type: ignore

    with pytest.raises(ValueError, match="codon indices must be non-negative"):
        extract_bits(dna, carrier_positions=[-1])


# ---------------------------------------------------------------------------
# 7. Overlapping Offset Policy Enforcement
# ---------------------------------------------------------------------------
def test_extract_overlapping_offset_policy():
    """Verify that overlapping carrier triplets in carrier_start_offsets are rejected."""
    dna = "ATGGCGGAGCCTGTAA"  # 16 nt

    # Triplet 0 at offset 3 spans [3, 4, 5]. Triplet 1 at offset 4 spans [4, 5, 6] -> overlap!
    with pytest.raises(ValueError, match="Overlapping carrier offsets detected"):
        extract_bits(dna, carrier_start_offsets=[3, 4])

    # Triplet at 3 and triplet at 5 -> overlap!
    with pytest.raises(ValueError, match="Overlapping carrier offsets detected"):
        extract_bits(dna, carrier_start_offsets=[3, 5])

    # Non-overlapping: triplet at 3 spans [3, 4, 5], triplet at 6 spans [6, 7, 8] -> valid!
    bits, confs = extract_bits(dna, carrier_start_offsets=[3, 6])
    assert len(bits) == 2
    assert len(confs) == 2


# ---------------------------------------------------------------------------
# 8. Non-Multiple-of-3 Carrier Offset Extraction with Codon Verification
# ---------------------------------------------------------------------------
def test_non_multiple_of_three_carrier_offset():
    """
    Verify that extract_bits can read a valid carrier codon starting at an arbitrary offset,
    and verify the expected bit and confidence against the loaded codon usage table.
    """
    codon_usage = load_codon_usage()
    syn_map = get_synonymous_map(codon_usage)

    # In E. coli K-12, check Leucine (L) top-2 ranked codons
    syn_leu = syn_map.get("L", [])
    assert len(syn_leu) >= 2, "Leucine must have >= 2 synonymous codons"

    # Construct sequence where offset 7 has the top-1 Leucine codon
    target_codon = syn_leu[0]
    dna = "AAAAAAA" + target_codon + "TT"  # offset 7 has target_codon (7 is not multiple of 3)

    carrier_offsets = [7]
    bits, confs = extract_bits(dna, carrier_start_offsets=carrier_offsets, codon_usage=codon_usage)

    assert len(bits) == 1
    assert bits[0] == 0, f"Top-1 ranked codon {target_codon} must decode to bit 0"
    assert confs[0] == 0.99, "Intact top-2 ranked synonymous codon must receive confidence 0.99"

    # Second ranked Leucine codon -> bit 1
    target_codon_1 = syn_leu[1]
    dna_1 = "AAAAAAA" + target_codon_1 + "TT"
    bits_1, confs_1 = extract_bits(dna_1, carrier_start_offsets=carrier_offsets, codon_usage=codon_usage)
    assert bits_1[0] == 1, f"Top-2 ranked codon {target_codon_1} must decode to bit 1"
    assert confs_1[0] == 0.99


# ---------------------------------------------------------------------------
# 9. Explicit Erasures, Out-of-Bounds, and Truncated Triplet Handling
# ---------------------------------------------------------------------------
def test_erasures_out_of_bounds_and_truncated():
    """Verify that None, negative, out-of-bounds, and truncated offsets produce confidence 0.0."""
    codon_usage = load_codon_usage()
    dna = "ATGGCGGAA"  # 9 nt (offsets 0..8)

    offsets = [
        None,  # Explicit frame erasure
        -5,    # Negative offset
        7,     # Truncated triplet (only 2 bases left: 'AA')
        12,    # Out of bounds
    ]
    bits, confs = extract_bits(dna, carrier_start_offsets=offsets, codon_usage=codon_usage)

    assert len(bits) == 4
    assert len(confs) == 4
    for idx, c in enumerate(confs):
        assert c == 0.0, f"Offset at index {idx} ({offsets[idx]}) must produce confidence 0.0"


# ---------------------------------------------------------------------------
# 10. API Endpoint Integration (/ml/extract)
# ---------------------------------------------------------------------------
def test_api_extract_endpoint_validation():
    """Verify /ml/extract endpoint behavior under valid and invalid inputs."""
    with TestClient(app) as client:
        # 1. Valid offset mode with explicit erasure
        r = client.post(
            "/ml/extract",
            json={
                "sequence": "ATGGCGGAGCCTG",  # 13 nt
                "carrierStartOffsets": [0, None, 10],
                "host": "E. coli K-12",
            },
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert len(data["bitEstimates"]) == 3
        assert data["confidences"][1] == 0.0

        # 2. Rejection when both addressing modes are provided
        r_both = client.post(
            "/ml/extract",
            json={
                "sequence": "ATGGCGGAGCCTG",
                "carrierPositions": [0],
                "carrierStartOffsets": [0],
                "host": "E. coli K-12",
            },
        )
        assert r_both.status_code in (400, 422), "Must reject request with both addressing modes"

        # 3. Rejection when neither addressing mode is provided
        r_neither = client.post(
            "/ml/extract",
            json={
                "sequence": "ATGGCGGAGCCTG",
                "host": "E. coli K-12",
            },
        )
        assert r_neither.status_code in (400, 422), "Must reject request with neither addressing mode"

        # 4. Rejection when boolean is passed in carrierStartOffsets
        r_bool = client.post(
            "/ml/extract",
            json={
                "sequence": "ATGGCGGAGCCTG",
                "carrierStartOffsets": [True, 6],
                "host": "E. coli K-12",
            },
        )
        assert r_bool.status_code in (400, 422), "Must reject boolean in offsets"

        # 5. Rejection of overlapping offsets
        r_overlap = client.post(
            "/ml/extract",
            json={
                "sequence": "ATGGCGGAGCCTG",
                "carrierStartOffsets": [3, 4],
                "host": "E. coli K-12",
            },
        )
        assert r_overlap.status_code == 400, "Must return HTTP 400 for overlapping carrier offsets"
