"""GeneStamp ML — HelixSign core ML package."""
__version__ = "0.1.0"

from .codec import (
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
