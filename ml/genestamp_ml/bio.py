"""
bio.py — Biological sequence utilities for HelixSign.
Handles translation verification, GC content, homopolymer checks, CAI computation.
"""
import json
import math
import re
from pathlib import Path
from typing import Optional

from Bio.Seq import Seq

# Standard genetic code table 11 (bacterial)
CODON_TABLE_ID = 11

CODON_USAGE_PATH = Path(__file__).parent.parent / "data" / "codon_usage_ecoli.json"


def load_codon_usage(path: Optional[str] = None) -> dict:
    """Load precomputed E. coli K-12 codon usage table.

    Args:
        path: Optional path to JSON file. Defaults to CODON_USAGE_PATH.

    Returns:
        dict: Full codon usage JSON as parsed from the file.

    Raises:
        FileNotFoundError: If the codon usage JSON has not been generated yet.
            Run ``ml/data/download_ecoli.py`` first.
    """
    target_path = Path(path) if path else CODON_USAGE_PATH
    if not target_path.exists():
        raise FileNotFoundError(
            f"Codon usage file not found: {target_path}. "
            "Run ml/data/download_ecoli.py to generate it."
        )
    with target_path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def translate_seq(dna: str) -> str:
    """Translate DNA using bacterial genetic code (table 11).

    Args:
        dna: DNA string (uppercase ACGT, length divisible by 3).

    Returns:
        Protein string including the terminal stop character ``*``.
    """
    return str(Seq(dna.upper()).translate(table=CODON_TABLE_ID))


def assert_protein_identity(original_dna: str, stamped_dna: str) -> bool:
    """Assert that original and stamped sequences translate identically.

    Uses BioPython's Seq.translate with bacterial table 11.

    Args:
        original_dna: Original CDS DNA string.
        stamped_dna:  Watermarked CDS DNA string.

    Returns:
        True if translations are identical.

    Raises:
        AssertionError: If the two translations differ.
    """
    orig_prot = str(Seq(original_dna.upper()).translate(table=CODON_TABLE_ID))
    stamp_prot = str(Seq(stamped_dna.upper()).translate(table=CODON_TABLE_ID))
    assert orig_prot == stamp_prot, (
        "Protein identity violated!\n"
        f"  original  : {orig_prot[:60]}...\n"
        f"  stamped   : {stamp_prot[:60]}..."
    )
    return True


def gc_content(seq: str) -> float:
    """Return GC percentage on the 0–100 scale.

    Args:
        seq: DNA string (any case).

    Returns:
        float: GC% in range [0, 100].  Returns 0.0 for empty sequences.
    """
    seq = seq.upper()
    if not seq:
        return 0.0
    gc = sum(1 for base in seq if base in ("G", "C"))
    return 100.0 * gc / len(seq)


def max_homopolymer_run(seq: str) -> int:
    """Return the length of the longest homopolymer run.

    Example: ``AAAAA`` → 5, ``ACGT`` → 1.

    Args:
        seq: DNA string (any case).

    Returns:
        int: Length of the longest homopolymer run.  Returns 0 for empty sequences.
    """
    seq = seq.upper()
    if not seq:
        return 0
    max_run = 1
    current_run = 1
    for i in range(1, len(seq)):
        if seq[i] == seq[i - 1]:
            current_run += 1
            if current_run > max_run:
                max_run = current_run
        else:
            current_run = 1
    return max_run


def has_safe_homopolymer(seq: str, max_run: int = 4) -> bool:
    """Return True if no homopolymer run exceeds *max_run*.

    HelixSign's sequencing-safety requirement is ``max_run=4``.

    Args:
        seq: DNA string.
        max_run: Maximum allowed homopolymer run length (inclusive). Default 4.

    Returns:
        bool: True if the sequence passes the homopolymer check.
    """
    return max_homopolymer_run(seq) <= max_run


def compute_cai(dna: str, codon_usage: dict) -> float:
    """Compute the Codon Adaptation Index (CAI) relative to E. coli K-12.

    CAI is defined as the geometric mean of ``w_i`` for each sense codon,
    where ``w_i = RSCU(codon_i) / max_RSCU(synonymous_group_i)``.

    Missing codons (not in the usage table) are assigned a default RSCU of 0.5.

    Args:
        dna: CDS DNA string (uppercase, length divisible by 3).
        codon_usage: Codon usage dict as returned by :func:`load_codon_usage`.

    Returns:
        float: CAI value in [0, 1].  Returns 0.0 if no sense codons are found.
    """
    codon_table: dict = codon_usage.get("codon_table", {})
    synonymous_groups: dict = codon_usage.get("synonymous_groups", {})

    # Build max RSCU per amino acid for normalization
    max_rscu_per_aa: dict = {}
    for aa, codons in synonymous_groups.items():
        rscu_vals = [
            codon_table[c]["rscu"] if c in codon_table else 0.5
            for c in codons
        ]
        max_rscu_per_aa[aa] = max(rscu_vals) if rscu_vals else 1.0

    dna = dna.upper()
    log_w_sum = 0.0
    n = 0

    for i in range(0, len(dna) - 2, 3):
        codon = dna[i:i + 3]
        if len(codon) < 3:
            continue
        entry = codon_table.get(codon)
        if entry is None:
            # Unknown codon: skip
            continue
        aa = entry.get("amino_acid", "?")
        if aa == "*":
            # Stop codon — not included in CAI
            continue

        rscu_val = entry.get("rscu", 0.5)
        if rscu_val <= 0:
            rscu_val = 0.5  # guard against zero/negative RSCU

        max_rscu = max_rscu_per_aa.get(aa, 1.0)
        if max_rscu <= 0:
            max_rscu = 1.0

        w_i = rscu_val / max_rscu
        if w_i <= 0:
            w_i = 1e-9  # numerical guard

        log_w_sum += math.log(w_i)
        n += 1

    if n == 0:
        return 0.0

    return math.exp(log_w_sum / n)


def sequence_stats(original_dna: str, stamped_dna: str, codon_usage: dict) -> dict:
    """Compute comparative statistics between original and stamped sequences.

    Args:
        original_dna: Original CDS DNA string.
        stamped_dna:  Watermarked CDS DNA string.
        codon_usage:  Codon usage dict as returned by :func:`load_codon_usage`.

    Returns:
        dict with keys:

        - ``gcBefore`` (float): GC% of original sequence.
        - ``gcAfter``  (float): GC% of stamped sequence.
        - ``gcDelta``  (float): gcAfter − gcBefore.
        - ``caiSimilarity`` (float): CAI of stamped / CAI of original (clamped to [0, 1]).
        - ``longestHomopolymer`` (int): Longest homopolymer in the stamped sequence.
    """
    gc_before = gc_content(original_dna)
    gc_after = gc_content(stamped_dna)
    gc_delta = gc_after - gc_before

    cai_orig = compute_cai(original_dna, codon_usage)
    cai_stamp = compute_cai(stamped_dna, codon_usage)

    if cai_orig > 0:
        cai_similarity = min(cai_stamp / cai_orig, 1.0)
    else:
        cai_similarity = 1.0 if cai_stamp >= 0 else 0.0

    longest_hp = max_homopolymer_run(stamped_dna)

    return {
        "gcBefore": round(gc_before, 4),
        "gcAfter": round(gc_after, 4),
        "gcDelta": round(gc_delta, 4),
        "caiSimilarity": round(cai_similarity, 6),
        "longestHomopolymer": longest_hp,
    }
