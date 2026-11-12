"""
codec.py — Synchronization, Framing, CRC-8, and Reed-Solomon Error/Erasure Codec for HelixSign.

Provides the reference implementations matching the backend integration contract:
1. 24-bit fixed synchronization word detector (0xF9AE45) with Hamming distance thresholding.
2. Header CRC-8 integrity calculator & parser (polynomial 0x07).
3. Soft-confidence bit-to-RS-symbol erasure aggregator with offset awareness.
4. Systematic Reed-Solomon (RS) encoder & errors-and-erasures decoder over GF(256)
   with primitive polynomial 0x11D, generator alpha = 2, and roots alpha^0 .. alpha^{nsym-1}.
"""
from typing import List, Tuple, Dict, Any, Optional, Union

# ---------------------------------------------------------------------------
# Framing & Synchronization Constants
# ---------------------------------------------------------------------------
SYNC_WORD_HEX: int = 0xF9AE45
SYNC_WORD_LEN: int = 24
SYNC_WORD_BITS: List[int] = [
    (SYNC_WORD_HEX >> (23 - i)) & 1 for i in range(24)
]  # [1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1]

HEADER_LEN_BITS: int = 16
RS_BIT_OFFSET: int = SYNC_WORD_LEN + HEADER_LEN_BITS  # 40 bits
CRC8_POLYNOMIAL: int = 0x07  # x^8 + x^2 + x + 1


# ---------------------------------------------------------------------------
# 1. Synchronization Word Detector
# ---------------------------------------------------------------------------
def detect_sync_word(
    bit_stream: List[int],
    max_hamming_distance: int = 2,
    sync_pattern: Optional[List[int]] = None,
) -> Dict[str, Any]:
    """
    Search a bit stream for the 24-bit synchronization word.

    Sliding window correlator calculates Hamming distance against the sync pattern.
    If multiple candidate windows tie for minimum Hamming distance within threshold,
    ambiguous is set to True.

    Args:
        bit_stream: Sequence of received bits (0 or 1).
        max_hamming_distance: Maximum allowable bit flips (default: 2).
        sync_pattern: Optional custom pattern (default: SYNC_WORD_BITS).

    Returns:
        Dict with keys:
          - 'synchronized': bool
          - 'offset': int (starting index of best match in bit_stream, or -1)
          - 'hamming_distance': int
          - 'ambiguous': bool
    """
    pattern = sync_pattern or SYNC_WORD_BITS
    pat_len = len(pattern)

    if len(bit_stream) < pat_len:
        return {
            "synchronized": False,
            "offset": -1,
            "hamming_distance": pat_len,
            "ambiguous": False,
        }

    best_dist = pat_len + 1
    best_offset = -1
    candidates = []

    for i in range(len(bit_stream) - pat_len + 1):
        window = bit_stream[i : i + pat_len]
        dist = sum(a != b for a, b in zip(pattern, window))
        if dist < best_dist:
            best_dist = dist
            best_offset = i
            candidates = [i]
        elif dist == best_dist:
            candidates.append(i)

    if best_dist <= max_hamming_distance:
        return {
            "synchronized": True,
            "offset": best_offset,
            "hamming_distance": best_dist,
            "ambiguous": len(candidates) > 1,
        }

    return {
        "synchronized": False,
        "offset": best_offset if best_offset >= 0 else -1,
        "hamming_distance": best_dist,
        "ambiguous": False,
    }


# ---------------------------------------------------------------------------
# 2. Header CRC-8 Calculator & Verifier
# ---------------------------------------------------------------------------
def compute_crc8(data: Union[int, bytes, bytearray, List[int]]) -> int:
    """
    Compute CRC-8 checksum over bytes/integers using polynomial 0x07 (x^8 + x^2 + x + 1).
    Initial value = 0x00.
    """
    if isinstance(data, int):
        byte_seq = bytes([data & 0xFF])
    elif isinstance(data, (bytes, bytearray)):
        byte_seq = bytes(data)
    elif isinstance(data, list):
        byte_seq = bytes(b & 0xFF for b in data)
    else:
        raise TypeError(f"Unsupported data type for CRC-8: {type(data)}")

    crc = 0x00
    for b in byte_seq:
        crc ^= b
        for _ in range(8):
            if crc & 0x80:
                crc = ((crc << 1) ^ CRC8_POLYNOMIAL) & 0xFF
            else:
                crc = (crc << 1) & 0xFF
    return crc


def parse_and_verify_header(header_bytes: bytes) -> Tuple[bool, int]:
    """
    Parse a 2-byte header:
      Byte 0: payload_length (1 <= k <= 223)
      Byte 1: CRC-8 of Byte 0

    Returns:
        (valid: bool, payload_length: int)
    """
    if len(header_bytes) < 2:
        return False, 0

    payload_len = header_bytes[0]
    expected_crc = header_bytes[1]
    computed_crc = compute_crc8(payload_len)

    if expected_crc != computed_crc:
        return False, payload_len

    if payload_len < 1 or payload_len > 223:
        return False, payload_len

    return True, payload_len


# ---------------------------------------------------------------------------
# 3. RS Symbol Erasure Aggregator
# ---------------------------------------------------------------------------
def aggregate_symbol_erasures(
    confidences: List[float],
    n_symbols: int,
    tau: float = 0.60,
    rs_bit_offset: int = RS_BIT_OFFSET,
) -> List[int]:
    """
    Map bit-level confidences to Reed-Solomon symbol-level erasure indices.

    Equation:
      symbol_erased[j] = True  iff  exists k in [0, 7] such that
                                   confidence[rs_bit_offset + 8*j + k] < tau

    Args:
        confidences: List of soft confidence scores in [0.0, 1.0].
        n_symbols: Total number of RS symbols (data + parity).
        tau: Confidence threshold below which a bit is considered erased (default 0.60).
        rs_bit_offset: Starting bit offset of RS codeword (default: 40 = 24 preamble + 16 header).

    Returns:
        List of 0-indexed erased symbol positions within the RS codeword [0, n_symbols - 1].
    """
    erased_symbols: List[int] = []

    for j in range(n_symbols):
        symbol_start = rs_bit_offset + (j * 8)
        # Check if any of the 8 bits falls below threshold or is out-of-range
        is_erased = False
        for k in range(8):
            bit_idx = symbol_start + k
            if bit_idx >= len(confidences) or confidences[bit_idx] < tau:
                is_erased = True
                break

        if is_erased:
            erased_symbols.append(j)

    return erased_symbols


# ---------------------------------------------------------------------------
# 4. Reed-Solomon Codec over GF(256)
# ---------------------------------------------------------------------------
# Systematic RS construction identical to backend ecc.ts:
# Primitive polynomial 0x11D, generator alpha = 2, first consecutive root alpha^0.

PRIMITIVE_POLYNOMIAL: int = 0x11D
FIELD_SIZE: int = 255

GF_EXP: List[int] = [0] * 512
GF_LOG: List[int] = [0] * 256

_val = 1
for _i in range(FIELD_SIZE):
    GF_EXP[_i] = _val
    GF_LOG[_val] = _i
    _val <<= 1
    if _val & 0x100:
        _val ^= PRIMITIVE_POLYNOMIAL
for _i in range(FIELD_SIZE, 512):
    GF_EXP[_i] = GF_EXP[_i - FIELD_SIZE]


def gf_add(a: int, b: int) -> int:
    return a ^ b


def gf_mul(a: int, b: int) -> int:
    if a == 0 or b == 0:
        return 0
    return GF_EXP[GF_LOG[a] + GF_LOG[b]]


def gf_div(a: int, b: int) -> int:
    if b == 0:
        raise ZeroDivisionError("Division by zero in GF(2^8)")
    if a == 0:
        return 0
    return GF_EXP[GF_LOG[a] + FIELD_SIZE - GF_LOG[b]]


def gf_pow(base: int, exponent: int) -> int:
    if base == 0:
        return 0
    norm = ((exponent % FIELD_SIZE) + FIELD_SIZE) % FIELD_SIZE
    return GF_EXP[(GF_LOG[base] * norm) % FIELD_SIZE]


def gf_inv(val: int) -> int:
    if val == 0:
        raise ZeroDivisionError("0 has no multiplicative inverse")
    return GF_EXP[FIELD_SIZE - GF_LOG[val]]


def poly_scale(poly: List[int], scalar: int) -> List[int]:
    return [gf_mul(c, scalar) for c in poly]


def poly_add(a: List[int], b: List[int]) -> List[int]:
    length = max(len(a), len(b))
    result = [0] * length
    for i in range(length):
        ai = i - (length - len(a))
        bi = i - (length - len(b))
        result[i] = (a[ai] if ai >= 0 else 0) ^ (b[bi] if bi >= 0 else 0)
    return result


def poly_mul(a: List[int], b: List[int]) -> List[int]:
    result = [0] * (len(a) + len(b) - 1)
    for i in range(len(a)):
        for j in range(len(b)):
            result[i + j] ^= gf_mul(a[i], b[j])
    return result


def poly_eval(poly: List[int], x: int) -> int:
    result = 0
    for c in poly:
        result = gf_mul(result, x) ^ c
    return result


def poly_div(dividend: List[int], divisor: List[int]) -> Tuple[List[int], List[int]]:
    output = list(dividend)
    for i in range(len(dividend) - (len(divisor) - 1)):
        coef = output[i]
        if coef != 0:
            for j in range(1, len(divisor)):
                output[i + j] ^= gf_mul(divisor[j], coef)
    sep = len(divisor) - 1
    return output[:-sep], output[-sep:]


def rs_generator_poly(nsym: int) -> List[int]:
    """Generate RS generator polynomial prod_{i=0}^{nsym-1} (x - alpha^i)."""
    gen = [1]
    for i in range(nsym):
        gen = poly_mul(gen, [1, gf_pow(2, i)])
    return gen


def rs_encode(data: Union[bytes, bytearray, List[int]], nsym: int = 8) -> bytes:
    """
    Encode data bytes into a systematic Reed-Solomon codeword.
    Trailing parity bytes are appended: codeword = data + parity.
    """
    data_bytes = bytes(data)
    if len(data_bytes) + nsym > 255:
        raise ValueError("Codeword length exceeds GF(2^8) capacity of 255 symbols")

    gen = rs_generator_poly(nsym)
    msg = list(data_bytes) + [0] * nsym

    for i in range(len(data_bytes)):
        coef = msg[i]
        if coef != 0:
            for j in range(1, len(gen)):
                msg[i + j] ^= gf_mul(gen[j], coef)

    parity = bytes(msg[len(data_bytes):])
    return data_bytes + parity


def syndromes(message: List[int], nsym: int) -> List[int]:
    return [0] + [poly_eval(message, gf_pow(2, i)) for i in range(nsym)]


def forney_syndromes(synd: List[int], positions: List[int], nmess: int) -> List[int]:
    rev = [nmess - 1 - p for p in positions]
    fsynd = list(synd[1:])
    for pos in rev:
        x = gf_pow(2, pos)
        for j in range(len(fsynd) - 1):
            fsynd[j] = gf_mul(fsynd[j], x) ^ fsynd[j + 1]
    return fsynd


def find_error_locator(synd: List[int], nsym: int, erase_count: int = 0) -> List[int]:
    err_loc = [1]
    old_loc = [1]
    synd_shift = len(synd) - nsym if len(synd) > nsym else 0

    for i in range(nsym - erase_count):
        k = i + synd_shift
        delta = synd[k] if k < len(synd) else 0
        for j in range(1, len(err_loc)):
            idx = k - j
            delta ^= gf_mul(err_loc[len(err_loc) - (j + 1)], synd[idx] if 0 <= idx < len(synd) else 0)

        old_loc = old_loc + [0]
        if delta != 0:
            if len(old_loc) > len(err_loc):
                new_loc = poly_scale(old_loc, delta)
                old_loc = poly_scale(err_loc, gf_inv(delta))
                err_loc = new_loc
            err_loc = poly_add(err_loc, poly_scale(old_loc, delta))

    while len(err_loc) > 0 and err_loc[0] == 0:
        err_loc.pop(0)

    errors = len(err_loc) - 1
    if (errors - erase_count) * 2 + erase_count > nsym:
        raise ValueError("Too many errors to correct")
    return err_loc


def find_errors(err_loc: List[int], nmess: int) -> List[int]:
    errors = len(err_loc) - 1
    positions = []
    for i in range(nmess):
        if poly_eval(err_loc, gf_pow(2, i)) == 0:
            positions.append(nmess - 1 - i)
    if len(positions) != errors:
        raise ValueError("Could not locate all errors")
    return positions


def find_errata_locator(coef_pos: List[int]) -> List[int]:
    loc = [1]
    for p in coef_pos:
        loc = poly_mul(loc, poly_add([1], [gf_pow(2, p), 0]))
    return loc


def find_error_evaluator(synd: List[int], err_loc: List[int], nsym: int) -> List[int]:
    prod = poly_mul(synd, err_loc)
    divisor = [1] + [0] * (nsym + 1)
    _, rem = poly_div(prod, divisor)
    return rem


def correct_errata(msg: List[int], synd: List[int], err_pos: List[int]) -> bytes:
    out = bytearray(msg)
    coef_pos = [len(msg) - 1 - p for p in err_pos]
    err_loc = find_errata_locator(coef_pos)
    err_eval = find_error_evaluator(list(reversed(synd)), err_loc, len(err_loc) - 1)

    x_vals = [gf_pow(2, p) for p in coef_pos]
    err_mags = [0] * len(msg)

    for i, xi in enumerate(x_vals):
        xi_inv = gf_inv(xi)
        err_loc_prime = 1
        for j, xj in enumerate(x_vals):
            if j != i:
                err_loc_prime = gf_mul(err_loc_prime, 1 ^ gf_mul(xi_inv, xj))
        y = poly_eval(err_eval, xi_inv)
        y = gf_mul(gf_pow(xi, 1), y)
        err_mags[err_pos[i]] = gf_div(y, err_loc_prime)

    for i in range(len(out)):
        out[i] ^= err_mags[i]
    return bytes(out)


def is_valid_codeword(codeword: Union[bytes, bytearray, List[int]], nsym: int = 8) -> bool:
    """Check if all syndrome polynomial coefficients evaluate to 0."""
    return all(c == 0 for c in syndromes(list(codeword), nsym))


def rs_decode(
    codeword: Union[bytes, bytearray, List[int]],
    nsym: int = 8,
    erasures: Optional[List[int]] = None,
) -> Tuple[bytes, int]:
    """
    Decode a systematic Reed-Solomon codeword.
    Corrects simultaneous errors t and erasures e satisfying 2t + e <= nsym.

    Args:
        codeword: Received codeword bytes (length = k + nsym <= 255).
        nsym: Number of parity symbols (default 8).
        erasures: Known erased symbol positions within the codeword [0, len-1].

    Returns:
        (data: bytes, errors_corrected: int)
    """
    msg = bytearray(codeword)
    if len(msg) <= nsym:
        raise ValueError("Codeword shorter than parity length")
    if len(msg) > 255:
        raise ValueError("Codeword exceeds GF(2^8) field size")

    erase_pos = sorted(set(p for p in (erasures or []) if 0 <= p < len(msg)))
    if len(erase_pos) > nsym:
        raise ValueError("Too many erasures to correct")

    for p in erase_pos:
        msg[p] = 0

    synd = syndromes(list(msg), nsym)
    if all(c == 0 for c in synd):
        return bytes(msg[:-nsym]), 0

    fsynd = forney_syndromes(synd, erase_pos, len(msg))
    err_loc = find_error_locator(fsynd, nsym, len(erase_pos))
    err_pos = find_errors(list(reversed(err_loc)), len(msg))
    errata_positions = sorted(set(erase_pos + err_pos))

    corrected = correct_errata(list(msg), synd, errata_positions)
    verification = syndromes(list(corrected), nsym)
    if not all(c == 0 for c in verification):
        raise ValueError("Reed-Solomon decoding failed: residual syndromes")

    return corrected[:-nsym], len(errata_positions)

