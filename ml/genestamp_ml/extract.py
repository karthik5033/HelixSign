"""
extract.py — Synonymous codon bit extractor for HelixSign.
Reads carrier codons and returns soft bit estimates + confidence scores.
"""
from typing import List, Tuple

from .bio import load_codon_usage
from .embed import get_synonymous_map


def extract_bits(
    dna: str,
    carrier_positions: List[int],
    codon_usage: dict,
) -> Tuple[List[int], List[float]]:
    """Extract bit estimates from stamped DNA at carrier positions.

    For each carrier position the function:

    1. Reads the codon at that position.
    2. Looks up the synonymous group for the encoded amino acid.
    3. Assigns a bit and confidence:

       - codon == highest-RSCU codon  → bit ``0``, confidence ``0.99``
       - codon == second-RSCU codon   → bit ``1``, confidence ``0.99``
       - codon is any other synonymous codon → best-guess ``0`` or ``1``
         (whichever index is closer) with confidence ``0.50``
       - codon is unrecognised / ineligible → bit ``0``, confidence ``0.50``

    Args:
        dna: Stamped CDS DNA string (uppercase ACGT, length divisible by 3).
        carrier_positions: List of codon indices to inspect (same order as
            supplied to :func:`~embed.embed_bits`).
        codon_usage: Codon usage dict as returned by :func:`~bio.load_codon_usage`.

    Returns:
        Tuple[List[int], List[float]]:
            - ``bit_estimates``: Decoded bit for each carrier position.
            - ``confidences``: Confidence score (0–1) for each decoded bit.
    """
    dna = dna.upper()
    num_codons = len(dna) // 3
    codon_table: dict = codon_usage.get("codon_table", {})
    syn_map = get_synonymous_map(codon_usage)

    bit_estimates: List[int] = []
    confidences: List[float] = []

    for pos in carrier_positions:
        if pos < 0 or pos >= num_codons:
            # Out-of-range: return a default uncertain estimate
            bit_estimates.append(0)
            confidences.append(0.50)
            continue

        codon = dna[pos * 3:(pos + 1) * 3]
        entry = codon_table.get(codon)

        if entry is None:
            # Unknown codon
            bit_estimates.append(0)
            confidences.append(0.50)
            continue

        aa = entry.get("amino_acid", "?")
        syn_codons = syn_map.get(aa)

        if syn_codons is None or len(syn_codons) < 2:
            # Ineligible amino acid (Met, Trp, or unknown)
            bit_estimates.append(0)
            confidences.append(0.50)
            continue

        # Highest-RSCU codon → bit 0; second-highest → bit 1
        if codon == syn_codons[0]:
            bit_estimates.append(0)
            confidences.append(0.99)
        elif codon == syn_codons[1]:
            bit_estimates.append(1)
            confidences.append(0.99)
        else:
            # Codon is a valid synonymous codon but not one of the top two.
            # Assign a best-guess based on position in the sorted list.
            try:
                idx = syn_codons.index(codon)
            except ValueError:
                idx = 0  # shouldn't happen, but guard anyway
            # Even index → closer to bit 0; odd index → closer to bit 1
            bit_estimates.append(idx % 2)
            confidences.append(0.50)

    return bit_estimates, confidences
