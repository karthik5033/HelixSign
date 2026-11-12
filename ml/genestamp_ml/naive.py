"""
naive.py — Naive (detectable) watermark generator for HelixSign detector baseline.

Naive strategy: for each carrier position, always use the LEAST frequent synonymous
codon regardless of the bit value.  This creates obvious codon bias anomalies that
detectors can catch easily, making it ideal for generating the "easy to detect"
baseline used to train and evaluate HelixSign's detector.
"""
from typing import List

from .bio import load_codon_usage, assert_protein_identity
from .embed import get_synonymous_map, find_eligible_positions


def naive_encode(dna: str, payload_bits: List[int], codon_usage: dict) -> str:
    """Naively encode *payload_bits* into *dna* using least-frequent codons.

    For each carrier position (taken in order from the eligible positions of
    *dna*), the codon is replaced with the **least**-RSCU synonymous codon for
    that amino acid, irrespective of the bit value.  This introduces a strong,
    detectable codon-bias signal.

    Args:
        dna: Original CDS DNA string (uppercase ACGT, length divisible by 3).
        payload_bits: List of bits (0 or 1) to encode.  Determines *how many*
            carrier positions are used (``len(payload_bits)`` positions are
            consumed from the eligible list in order).  The bit values themselves
            are ignored — the least-frequent codon is always chosen.
        codon_usage: Codon usage dict as returned by
            :func:`~bio.load_codon_usage`.

    Returns:
        str: Stamped DNA string with naive (least-frequent codon) substitutions.

    Raises:
        ValueError: If *payload_bits* requires more carrier positions than the
            sequence has eligible codons.
        AssertionError: If protein identity is violated after encoding.
    """
    dna = dna.upper()
    codon_table: dict = codon_usage.get("codon_table", {})
    syn_map = get_synonymous_map(codon_usage)

    # Find all eligible positions
    eligible_positions = find_eligible_positions(dna, codon_usage)

    if len(payload_bits) > len(eligible_positions):
        raise ValueError(
            f"payload_bits length ({len(payload_bits)}) exceeds the number of "
            f"eligible carrier positions ({len(eligible_positions)}) in the "
            f"provided sequence."
        )

    num_codons = len(dna) // 3
    codons: List[str] = [dna[i * 3:(i + 1) * 3] for i in range(num_codons)]

    # Use the first len(payload_bits) eligible positions
    for pos in eligible_positions[: len(payload_bits)]:
        original_codon = codons[pos]
        entry = codon_table.get(original_codon)
        if entry is None:
            continue

        aa = entry.get("amino_acid", "?")
        syn_codons = syn_map.get(aa)
        if syn_codons is None or len(syn_codons) < 2:
            continue

        # Always pick the least-frequent codon (last in RSCU-descending list)
        least_frequent_codon = syn_codons[-1]
        codons[pos] = least_frequent_codon

    stamped_dna = "".join(codons)

    # Verify protein identity is preserved
    assert_protein_identity(dna, stamped_dna)

    return stamped_dna
