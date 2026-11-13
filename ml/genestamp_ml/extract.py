"""
extract.py — Synonymous codon bit extractor for HelixSign.

Extracts soft bit estimates and heuristic extraction confidence scores from observed DNA.
Supports two mutually exclusive addressing modes:
1. carrier_start_offsets: Explicit nucleotide start offsets (essential for post-indel recovery).
   - Offsets need NOT be multiples of 3.
   - None indicates an explicit erasure (yields confidence=0.0).
   - Strict validation: rejects non-integers, booleans, and overlapping carrier triplets.
2. carrier_positions: Legacy 0-indexed codon indices (nucleotide start = 3 * pos).
   - Strict validation: rejects non-integers, booleans, and negative indices.
"""
from typing import List, Tuple, Optional, Union, Dict, Any

from .bio import load_codon_usage
from .embed import get_synonymous_map


def extract_bits(
    dna: str,
    carrier_positions: Optional[List[int]] = None,
    codon_usage: Optional[dict] = None,
    carrier_start_offsets: Optional[List[Optional[int]]] = None,
) -> Tuple[List[int], List[float]]:
    """
    Extract bit estimates and confidence scores from stamped DNA.

    Args:
        dna: Observed DNA string (uppercase ACGT).
        carrier_positions: 0-indexed codon indices (legacy mode; nucleotide start = 3 * pos).
        codon_usage: Codon usage dict as returned by :func:`~bio.load_codon_usage`.
        carrier_start_offsets: Explicit 0-indexed nucleotide start offsets (or None for erasures).

    Returns:
        Tuple[List[int], List[float]]:
            - bit_estimates: Extracted bit (0 or 1) for each carrier.
            - confidences: Heuristic extraction reliability scores in [0.0, 1.0]:
                * 0.99: Codon matches top-2 synonymous ranking for the amino acid.
                * 0.50: Ambiguous (lower-ranked synonym or ineligible amino acid).
                * 0.00: Definite erasure (null offset, out-of-bounds, truncated triplet, invalid bases).

    Raises:
        ValueError: If mutual exclusivity is violated, if neither mode is provided,
                    if legacy positions are negative, or if offsets overlap.
        TypeError: If offset or position types are invalid (e.g. str, float, bool).
    """
    dna = dna.upper()
    codon_table: dict = codon_usage.get("codon_table", {}) if codon_usage else {}
    syn_map: dict = get_synonymous_map(codon_usage) if codon_usage else {}

    # 1. Enforce strict mutual exclusivity
    if carrier_start_offsets is not None and carrier_positions is not None:
        raise ValueError(
            "Mutual exclusivity violated: provide either carrier_start_offsets or "
            "carrier_positions, not both."
        )
    if carrier_start_offsets is None and carrier_positions is None:
        raise ValueError(
            "Either carrier_start_offsets or carrier_positions must be provided."
        )

    # 2. Process and validate addressing mode
    target_offsets: List[Optional[int]] = []

    if carrier_start_offsets is not None:
        if not isinstance(carrier_start_offsets, list):
            raise TypeError(
                f"carrier_start_offsets must be a list, got {type(carrier_start_offsets).__name__}"
            )
        for idx, start in enumerate(carrier_start_offsets):
            if start is None:
                target_offsets.append(None)
            elif isinstance(start, bool) or not isinstance(start, int):
                raise TypeError(
                    f"Invalid offset type '{type(start).__name__}' at index {idx}: "
                    "expected int or None"
                )
            else:
                target_offsets.append(start)

        # Enforce non-overlapping carrier policy on valid triplets within sequence bounds
        valid_triplets = [
            (idx, start)
            for idx, start in enumerate(target_offsets)
            if start is not None and 0 <= start <= len(dna) - 3
        ]
        sorted_triplets = sorted(valid_triplets, key=lambda x: x[1])
        for k in range(len(sorted_triplets) - 1):
            curr_idx, curr_start = sorted_triplets[k]
            next_idx, next_start = sorted_triplets[k + 1]
            if next_start < curr_start + 3:
                raise ValueError(
                    f"Overlapping carrier offsets detected between carrier {curr_idx} (offset {curr_start}) "
                    f"and carrier {next_idx} (offset {next_start}): "
                    "carrier codons must be non-overlapping (separated by >= 3 nucleotides)."
                )

    else:
        # carrier_positions is not None
        if not isinstance(carrier_positions, list):
            raise TypeError(
                f"carrier_positions must be a list, got {type(carrier_positions).__name__}"
            )
        for idx, pos in enumerate(carrier_positions):
            if isinstance(pos, bool) or not isinstance(pos, int):
                raise TypeError(
                    f"Invalid carrier codon index type '{type(pos).__name__}' at index {idx}: "
                    "expected non-negative int"
                )
            if pos < 0:
                raise ValueError(
                    f"Invalid carrier codon index {pos} at index {idx}: "
                    "codon indices must be non-negative integers"
                )
            target_offsets.append(pos * 3)

    # 3. Extract bit estimates and soft confidence scores
    bit_estimates: List[int] = []
    confidences: List[float] = []

    for start in target_offsets:
        if start is None:
            # Explicit erasure flag from frame alignment
            bit_estimates.append(0)
            confidences.append(0.0)
            continue

        if start < 0 or start + 3 > len(dna):
            # Truncated or out-of-bounds triplet -> definite erasure
            bit_estimates.append(0)
            confidences.append(0.0)
            continue

        codon = dna[start : start + 3]
        entry = codon_table.get(codon)

        if entry is None or len(codon) != 3:
            # Degenerate bases, unknown codon, or invalid format -> erasure
            bit_estimates.append(0)
            confidences.append(0.0)
            continue

        aa = entry.get("amino_acid", "?")
        syn_codons = syn_map.get(aa)

        if syn_codons is None or len(syn_codons) < 2:
            # Ineligible amino acid (Met, Trp, Stop, or single-codon amino acid)
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
            # Valid synonymous codon but not in top-2 (lower-ranked synonym)
            try:
                idx = syn_codons.index(codon)
            except ValueError:
                idx = 0
            bit_estimates.append(idx % 2)
            confidences.append(0.50)

    return bit_estimates, confidences
