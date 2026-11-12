"""
extract.py — Synonymous codon bit extractor for HelixSign.
Reads carrier codons and returns soft bit estimates + confidence scores.
Supports both codon-aligned indices and arbitrary mapped nucleotide start offsets
(essential for post-indel alignment where intact codons begin at non-multiple-of-3 offsets).
"""
from typing import List, Tuple, Optional, Union

from .bio import load_codon_usage
from .embed import get_synonymous_map


def extract_bits(
    dna: str,
    carrier_positions: Optional[List[int]] = None,
    codon_usage: Optional[dict] = None,
    carrier_start_offsets: Optional[List[Optional[int]]] = None,
) -> Tuple[List[int], List[float]]:
    """Extract bit estimates from stamped DNA at carrier positions or nucleotide offsets.

    Supports two addressing modes:
    1. ``carrier_start_offsets``: List of 0-indexed nucleotide offsets where intact
       3-base carrier codons begin (e.g. ``[3, 6, 10, None, 13]``).
       - An offset of ``None`` indicates an erased/ruptured carrier position
         (overlapping an insertion or deletion). It directly produces
         ``bit_estimate = 0, confidence = 0.0`` (definite erasure).
       - Offsets need NOT be divisible by 3 (critical after upstream indels).
    2. ``carrier_positions``: Legacy mode. List of 0-indexed codon indices
       (nucleotide start = ``3 * pos``).

    Args:
        dna: Observed DNA string (uppercase ACGT).
        carrier_positions: Legacy 0-indexed codon indices (used if carrier_start_offsets is None).
        codon_usage: Codon usage dict as returned by :func:`~bio.load_codon_usage`.
        carrier_start_offsets: Explicit nucleotide start offsets or None for erasures.

    Returns:
        Tuple[List[int], List[float]]:
            - ``bit_estimates``: Decoded bit for each carrier position.
            - ``confidences``: Calibrated confidence score (0.0 to 1.0).
              ``0.0`` signifies a definite erasure / missing codon.
    """
    dna = dna.upper()
    codon_table: dict = codon_usage.get("codon_table", {}) if codon_usage else {}
    syn_map = get_synonymous_map(codon_usage) if codon_usage else {}

    # Determine offsets to inspect
    if carrier_start_offsets is not None:
        target_offsets: List[Optional[int]] = carrier_start_offsets
    elif carrier_positions is not None:
        target_offsets = [pos * 3 if pos >= 0 else None for pos in carrier_positions]
    else:
        raise ValueError("Either carrier_start_offsets or carrier_positions must be provided.")

    bit_estimates: List[int] = []
    confidences: List[float] = []

    for start in target_offsets:
        if start is None:
            # Explicit erasure flag from upstream frame alignment
            bit_estimates.append(0)
            confidences.append(0.0)
            continue

        if start < 0 or start + 3 > len(dna):
            # Truncated or out-of-bounds sequence -> definite erasure
            bit_estimates.append(0)
            confidences.append(0.0)
            continue

        codon = dna[start:start + 3]
        entry = codon_table.get(codon)

        if entry is None or len(codon) != 3:
            # Unknown codon or degenerate bases -> erasure
            bit_estimates.append(0)
            confidences.append(0.0)
            continue

        aa = entry.get("amino_acid", "?")
        syn_codons = syn_map.get(aa)

        if syn_codons is None or len(syn_codons) < 2:
            # Ineligible amino acid (Met, Trp, Stop, or single-codon)
            bit_estimates.append(0)
            confidences.append(0.50)
            continue

        # Highest-RSCU codon -> bit 0; second-highest -> bit 1
        if codon == syn_codons[0]:
            bit_estimates.append(0)
            confidences.append(0.99)
        elif codon == syn_codons[1]:
            bit_estimates.append(1)
            confidences.append(0.99)
        else:
            # Valid synonymous codon but not in top-2 (corrupted by channel noise)
            try:
                idx = syn_codons.index(codon)
            except ValueError:
                idx = 0
            bit_estimates.append(idx % 2)
            confidences.append(0.50)

    return bit_estimates, confidences
