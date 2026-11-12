"""
embed.py — Synonymous codon bit embedder for HelixSign.

Rule-based baseline:
  bit 0 -> highest-frequency synonymous codon for that amino acid in E. coli K-12
  bit 1 -> second most frequent synonymous codon

Amino acids with only 1 synonymous codon (Met=ATG, Trp=TGG) are NEVER modified.
"""
from pathlib import Path
from typing import List, Tuple

from .bio import load_codon_usage, assert_protein_identity, has_safe_homopolymer

# ---------------------------------------------------------------------------
# Synonymous map builder
# ---------------------------------------------------------------------------

def get_synonymous_map(codon_usage: dict) -> dict:
    """Build mapping: amino_acid -> list of codons sorted by RSCU descending.

    Only includes amino acids that have at least 2 synonymous codons (i.e.
    excludes Met and Trp which have a single codon each).

    Args:
        codon_usage: Codon usage dict as returned by :func:`~bio.load_codon_usage`.

    Returns:
        dict: ``{"F": ["TTC", "TTT"], "L": ["CTG", "CTC", ...], ...}``
              Codons are sorted by RSCU (highest first).
    """
    codon_table: dict = codon_usage.get("codon_table", {})
    synonymous_groups: dict = codon_usage.get("synonymous_groups", {})
    eligible_aas: list = codon_usage.get("eligible_amino_acids", [])

    syn_map: dict = {}
    for aa in eligible_aas:
        codons = synonymous_groups.get(aa, [])
        if len(codons) < 2:
            continue
        # Sort by RSCU descending; fall back to 0.0 if codon absent
        sorted_codons = sorted(
            codons,
            key=lambda c: codon_table.get(c, {}).get("rscu", 0.0),
            reverse=True,
        )
        syn_map[aa] = sorted_codons

    return syn_map


# ---------------------------------------------------------------------------
# Eligible position finder
# ---------------------------------------------------------------------------

def find_eligible_positions(dna: str, codon_usage: dict) -> List[int]:
    """Find codon indices eligible for bit embedding.

    A position is eligible if the amino acid encoded by that codon has at least
    2 synonymous codons (i.e. it appears in the synonymous map).  Stop codons
    and Met/Trp are excluded automatically.

    Args:
        dna: CDS DNA string (uppercase ACGT, length divisible by 3).
        codon_usage: Codon usage dict.

    Returns:
        List[int]: Sorted list of 0-based codon indices.
    """
    dna = dna.upper()
    codon_table: dict = codon_usage.get("codon_table", {})
    syn_map = get_synonymous_map(codon_usage)

    eligible: List[int] = []
    num_codons = len(dna) // 3

    for codon_idx in range(num_codons):
        start = codon_idx * 3
        codon = dna[start:start + 3]
        entry = codon_table.get(codon)
        if entry is None:
            continue
        aa = entry.get("amino_acid", "?")
        if aa in syn_map:
            eligible.append(codon_idx)

    return eligible


# ---------------------------------------------------------------------------
# Bit embedder
# ---------------------------------------------------------------------------

def embed_bits(
    dna: str,
    bits: List[int],
    carrier_positions: List[int],
    codon_usage: dict,
) -> Tuple[str, List[dict]]:
    """Embed a list of bits into carrier codon positions using synonymous substitution.

    Bit-to-codon mapping:
      - ``bit == 0`` → highest-RSCU synonymous codon for that amino acid
      - ``bit == 1`` → second-highest-RSCU synonymous codon for that amino acid

    If the amino acid has fewer synonymous alternatives than required by the bit
    value, the highest-available codon is used (graceful degradation).

    Args:
        dna: Original CDS DNA string (uppercase ACGT, length divisible by 3).
        bits: List of bits (0 or 1) to embed.  Must have the same length as
              *carrier_positions*.
        carrier_positions: List of codon indices selected by the backend
              (typically derived from an HKDF permutation).
        codon_usage: Codon usage dict as returned by :func:`~bio.load_codon_usage`.

    Returns:
        Tuple[str, List[dict]]:
            - ``stamped_dna``: Watermarked DNA string (same length as *dna*).
            - ``mutations``: List of mutation records::

                  [{"codonIndex": 14, "fromCodon": "GAA",
                    "toCodon": "GAG", "aminoAcid": "E"}, ...]

    Raises:
        ValueError: If *bits* and *carrier_positions* have different lengths,
                    or if a carrier position is out of range.
        AssertionError: If protein identity is violated after embedding
                        (via :func:`~bio.assert_protein_identity`).
    """
    if len(bits) != len(carrier_positions):
        raise ValueError(
            f"bits length ({len(bits)}) must equal carrier_positions length "
            f"({len(carrier_positions)})."
        )

    dna = dna.upper()
    num_codons = len(dna) // 3
    codon_table: dict = codon_usage.get("codon_table", {})
    syn_map = get_synonymous_map(codon_usage)

    # Work on a mutable list of codons
    codons: List[str] = [dna[i * 3:(i + 1) * 3] for i in range(num_codons)]
    mutations: List[dict] = []

    for bit, pos in zip(bits, carrier_positions):
        if pos < 0 or pos >= num_codons:
            raise ValueError(
                f"Carrier position {pos} is out of range for a sequence with "
                f"{num_codons} codons."
            )

        original_codon = codons[pos]
        entry = codon_table.get(original_codon)
        if entry is None:
            # Unknown codon — skip silently
            continue

        aa = entry.get("amino_acid", "?")
        syn_codons = syn_map.get(aa)
        if syn_codons is None or len(syn_codons) < 2:
            # Amino acid not eligible (single-codon) — skip
            continue

        # bit 0 -> index 0 (highest RSCU), bit 1 -> index 1 (second highest)
        target_idx = min(int(bit), len(syn_codons) - 1)
        target_codon = syn_codons[target_idx]

        if target_codon != original_codon:
            mutations.append({
                "codonIndex": pos,
                "fromCodon": original_codon,
                "toCodon": target_codon,
                "aminoAcid": aa,
            })
            codons[pos] = target_codon

    stamped_dna = "".join(codons)

    # Protein identity check (raises AssertionError on failure)
    assert_protein_identity(dna, stamped_dna)

    return stamped_dna, mutations
