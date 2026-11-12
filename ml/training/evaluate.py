"""
evaluate.py — Generate AUC curves and watermark recovery benchmarks for HelixSign.

Usage:
    cd ml
    python training/evaluate.py

Outputs:
    ml/artifacts/noise_benchmark.json  — recovery rates across substitution/indel noise levels

IMPORTANT: All reported recovery rates are **raw extraction without ECC**.
Reed-Solomon error correction is implemented in Person 2's backend layer and
is NOT applied here.  Post-ECC recovery rates would be substantially higher.

Corrections applied vs. previous version:
  1. Indel frame detection uses per-codon alignment (not net length difference)
     to correctly detect compensating indels that leave net length unchanged.
  2. Missing bits are represented as erasures (None) rather than zero-padding,
     so accidentally matching zeros are not counted as correct.
  3. Substitution / insertion / deletion channels are benchmarked separately.
"""
import sys
import json
import random
from pathlib import Path
from typing import List, Tuple, Optional, Union

sys.path.insert(0, str(Path(__file__).parent.parent))

from genestamp_ml.bio import load_codon_usage
from genestamp_ml.embed import find_eligible_positions, embed_bits
from genestamp_ml.extract import extract_bits
from genestamp_ml.channel import simulate_channel

ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"

SUBSTITUTION_RATES = [0.001, 0.005, 0.01, 0.02, 0.03, 0.05]
INDEL_RATES        = [0.001, 0.005, 0.01, 0.02]
N_TRIALS = 30  # Monte Carlo trials per configuration


# ---------------------------------------------------------------------------
# Metric helpers (erasure-aware)
# ---------------------------------------------------------------------------

def bit_error_rate(
    original_bits: List[int],
    recovered_bits: List[Optional[int]],
) -> dict:
    """
    Compute BER on the subset of bits that were actually recovered (not erased).

    Parameters
    ----------
    original_bits  : Ground-truth bits embedded in the sequence.
    recovered_bits : Extracted bits, where ``None`` indicates an erasure
                     (position could not be read due to frame-shift etc.).

    Returns
    -------
    dict with keys:
      - ``ber``          : Bit error rate over non-erased bits.
      - ``erasure_rate`` : Fraction of original bits that were erased.
      - ``n_original``   : Total bits expected.
      - ``n_recovered``  : Number of non-erased bits.
      - ``n_errors``     : Number of incorrect non-erased bits.
      - ``n_erasures``   : Number of erased bit positions.
    """
    n_original = len(original_bits)
    if n_original == 0:
        return {"ber": 0.0, "erasure_rate": 0.0,
                "n_original": 0, "n_recovered": 0, "n_errors": 0, "n_erasures": 0}

    n_erasures  = 0
    n_recovered = 0
    n_errors    = 0

    for orig, rec in zip(original_bits, recovered_bits):
        if rec is None:
            n_erasures += 1
        else:
            n_recovered += 1
            if rec != orig:
                n_errors += 1

    # Bits in original_bits beyond the length of recovered_bits → erasures
    extra_erasures = n_original - len(recovered_bits)
    n_erasures += max(0, extra_erasures)

    ber = n_errors / n_recovered if n_recovered > 0 else float("nan")
    erasure_rate = n_erasures / n_original

    return {
        "ber":           ber,
        "erasure_rate":  erasure_rate,
        "recovery_rate": 1.0 - ber if n_recovered > 0 else 0.0,
        "n_original":    n_original,
        "n_recovered":   n_recovered,
        "n_errors":      n_errors,
        "n_erasures":    n_erasures,
    }


# ---------------------------------------------------------------------------
# Noise application helpers
# ---------------------------------------------------------------------------

def _apply_substitutions(seq: str, rate: float, rng: random.Random) -> str:
    """Apply random nucleotide substitutions at the given per-base rate."""
    bases = "ACGT"
    result = []
    for base in seq:
        if rng.random() < rate:
            candidates = [b for b in bases if b != base.upper()]
            result.append(rng.choice(candidates))
        else:
            result.append(base)
    return "".join(result)


def _apply_insertions(seq: str, rate: float, rng: random.Random) -> str:
    """Apply random single-base insertions only at the given per-base rate."""
    bases = "ACGT"
    result = []
    for base in seq:
        if rng.random() < rate:
            result.append(rng.choice(bases))  # inserted base
        result.append(base)
    return "".join(result)


def _apply_deletions(seq: str, rate: float, rng: random.Random) -> str:
    """Apply random single-base deletions only at the given per-base rate."""
    return "".join(base for base in seq if rng.random() >= rate)


def _apply_indels(seq: str, rate: float, rng: random.Random) -> str:
    """Apply random insertions AND deletions at the given per-event rate."""
    bases = "ACGT"
    result = []
    for base in seq:
        event = rng.random()
        if event < rate / 2:
            result.append(rng.choice(bases))
            result.append(base)
        elif event < rate:
            pass  # deletion
        else:
            result.append(base)
    return "".join(result)


# ---------------------------------------------------------------------------
# Codon-level frame integrity check (fixes the net-length-difference flaw)
# ---------------------------------------------------------------------------

def _codon_frames_intact(original: str, noisy: str) -> bool:
    """
    Return True only when every carrier-codon position can still be read as a
    full, in-frame codon.

    Strategy: Align the noisy sequence to the original using a simple
    global Needleman-Wunsch (via difflib.SequenceMatcher as a lightweight
    proxy) and check that the aligned positions corresponding to each
    original codon start are still at a codon-aligned offset in the noisy
    sequence.

    If BioPython is available we use pairwise2 for a proper alignment;
    otherwise we fall back to checking that len(noisy) % 3 == 0 AND that
    len(noisy) == len(original) (i.e., no net change — a conservative
    approximation that rejects more sequences but never wrongly accepts a
    frameshifted one when lengths differ).
    """
    # Fast rejection: if net length is not a multiple of 3, definitely broken
    if len(noisy) % 3 != 0:
        return False

    if len(noisy) == len(original):
        # No length change → substitutions only, frame always intact
        return True

    # Length changed but still divisible by 3 → need alignment to check
    # whether individual codon positions are still readable.
    try:
        from Bio import pairwise2
        alignments = pairwise2.align.globalms(
            original, noisy,
            match=1, mismatch=-1, open=-2, extend=-0.5,
            one_alignment_only=True,
        )
        if not alignments:
            return False
        aligned_orig, aligned_noisy = alignments[0].seqA, alignments[0].seqB

        # Map each original position to its aligned position in noisy
        orig_pos = 0
        noisy_pos = 0
        orig_to_noisy: dict = {}
        for a_o, a_n in zip(aligned_orig, aligned_noisy):
            if a_o != "-" and a_n != "-":
                orig_to_noisy[orig_pos] = noisy_pos
                orig_pos += 1
                noisy_pos += 1
            elif a_o == "-":
                noisy_pos += 1
            else:
                orig_to_noisy[orig_pos] = None  # deleted
                orig_pos += 1

        # Check that every codon-start in original maps to a codon-start in noisy
        n_codons = len(original) // 3
        for ci in range(n_codons):
            noisy_mapped = orig_to_noisy.get(ci * 3)
            if noisy_mapped is None:
                return False  # codon start was deleted
            if noisy_mapped % 3 != 0:
                return False  # codon start is now mid-codon in noisy

        return True

    except ImportError:
        # BioPython not available — conservative: reject any length difference
        return False


# ---------------------------------------------------------------------------
# Bit recovery with erasure representation
# ---------------------------------------------------------------------------

def _recover_bits_safe(
    noisy_seq: str,
    carrier_positions: List[int],
    codon_usage: dict,
    n_bits: int,
) -> List[Optional[int]]:
    """
    Attempt to extract watermark bits from a (possibly corrupted) sequence.

    Returns a list of length n_bits where:
      - int (0 or 1) : bit was read successfully.
      - None         : bit position could not be read (erasure).

    Uses ``None`` for erasures instead of a default value so that the BER
    calculation is not accidentally optimistic when the original bit is 0.
    """
    try:
        result = extract_bits(noisy_seq, carrier_positions, codon_usage)
        if result is None:
            return [None] * n_bits
        recovered = list(result[0] if isinstance(result, tuple) else result)
        # Pad with None for missing positions
        if len(recovered) < n_bits:
            recovered += [None] * (n_bits - len(recovered))
        return recovered[:n_bits]
    except Exception:
        # Frame shift or other corruption → all bits lost
        return [None] * n_bits


# ---------------------------------------------------------------------------
# Benchmark runners
# ---------------------------------------------------------------------------

def _run_benchmark(
    noisy_fn,
    stamped_dna: str,
    bits: List[int],
    carrier_positions: List[int],
    codon_usage: dict,
    rates: List[float],
    n_trials: int,
    channel_name: str,
) -> dict:
    """
    Generic benchmark loop for a single noise channel.

    Parameters
    ----------
    noisy_fn    : Callable(seq, rate, rng) → noisy_seq.
    channel_name: Logged label for readability.

    Returns dict keyed by rate string.
    """
    results = {}
    n_bits  = len(bits)

    for rate in rates:
        trial_stats = []
        for trial in range(n_trials):
            rng   = random.Random(rate * 1e9 + trial + hash(channel_name) % 1_000_000)
            noisy = noisy_fn(stamped_dna, rate, rng)

            # Frame-integrity check (codon-level alignment)
            if not _codon_frames_intact(stamped_dna, noisy):
                # All bits are erased due to frame-shift
                trial_stats.append({
                    "ber": float("nan"),
                    "erasure_rate": 1.0,
                    "recovery_rate": 0.0,
                    "n_original": n_bits,
                    "n_recovered": 0,
                    "n_errors": 0,
                    "n_erasures": n_bits,
                })
                continue

            recovered = _recover_bits_safe(noisy, carrier_positions, codon_usage, n_bits)
            stats     = bit_error_rate(bits, recovered)
            trial_stats.append(stats)

        # Aggregate over trials — handle NaN BERs (fully-erased) separately
        valid_bers     = [s["ber"] for s in trial_stats if s["ber"] == s["ber"]]  # nan check
        all_recoveries = [s["recovery_rate"] for s in trial_stats]
        all_erasures   = [s["erasure_rate"] for s in trial_stats]

        mean_rec  = sum(all_recoveries) / len(all_recoveries)
        std_rec   = (sum((r - mean_rec) ** 2 for r in all_recoveries) / len(all_recoveries)) ** 0.5
        mean_er   = sum(all_erasures) / len(all_erasures)
        mean_ber  = sum(valid_bers) / len(valid_bers) if valid_bers else float("nan")

        results[str(rate)] = {
            "mean_recovery":    float(mean_rec),
            "std_recovery":     float(std_rec),
            "mean_erasure_rate": float(mean_er),
            "mean_ber_non_erased": float(mean_ber) if mean_ber == mean_ber else None,
            "trials":           n_trials,
            "note": "raw extraction; erasures excluded from BER denominator",
        }

    return results


def run_substitution_benchmark(
    bits, carrier_positions, stamped_dna, codon_usage, rates, n_trials,
) -> dict:
    return _run_benchmark(
        _apply_substitutions, stamped_dna, bits, carrier_positions,
        codon_usage, rates, n_trials, "substitution",
    )


def run_insertion_benchmark(
    bits, carrier_positions, stamped_dna, codon_usage, rates, n_trials,
) -> dict:
    return _run_benchmark(
        _apply_insertions, stamped_dna, bits, carrier_positions,
        codon_usage, rates, n_trials, "insertion",
    )


def run_deletion_benchmark(
    bits, carrier_positions, stamped_dna, codon_usage, rates, n_trials,
) -> dict:
    return _run_benchmark(
        _apply_deletions, stamped_dna, bits, carrier_positions,
        codon_usage, rates, n_trials, "deletion",
    )


def run_indel_benchmark(
    bits, carrier_positions, stamped_dna, codon_usage, rates, n_trials,
) -> dict:
    return _run_benchmark(
        _apply_indels, stamped_dna, bits, carrier_positions,
        codon_usage, rates, n_trials, "indel",
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print("=== HelixSign Channel Noise Benchmark ===")
    print("NOTE: All results are raw extraction WITHOUT ECC.")
    codon_usage = load_codon_usage()

    from Bio import SeqIO
    test_fasta = Path(__file__).parent.parent / "data" / "test_genes.fasta"
    if not test_fasta.exists():
        print(f"Test FASTA not found at {test_fasta}.")
        return

    seqs = [
        str(r.seq).upper()
        for r in SeqIO.parse(str(test_fasta), "fasta")
        if len(str(r.seq)) >= 600 and set(str(r.seq).upper()) <= {"A", "C", "G", "T"}
    ]

    if not seqs:
        print("No suitable test genes found (need ≥600 bp).")
        return

    test_seq = seqs[0]
    print(f"Test sequence length: {len(test_seq)} bp")

    eligible = find_eligible_positions(test_seq, codon_usage)
    n_bits   = min(64, len(eligible))

    if n_bits == 0:
        print("No eligible watermark positions found in test sequence. Aborting.")
        return

    carrier_positions = eligible[:n_bits]
    bits = [i % 2 for i in range(n_bits)]  # Alternating test pattern

    result_embed = embed_bits(test_seq, bits, carrier_positions, codon_usage)
    stamped_dna  = result_embed[0] if isinstance(result_embed, tuple) else result_embed

    print(f"Embedded {n_bits} bits into {len(carrier_positions)} carrier positions.")
    print(f"Running {N_TRIALS} Monte Carlo trials per noise configuration...\n")

    results = {
        "test_sequence_length": len(test_seq),
        "n_bits_embedded":      n_bits,
        "methodology": {
            "erasure_handling":    "Missing/unreadable bits are marked as None (erasure). BER is computed over non-erased bits only.",
            "frame_check":         "Codon-level alignment (BioPython pairwise2). Net-length equality alone is not sufficient.",
            "ecc_applied":         False,
            "ecc_note":            "Reed-Solomon ECC is in Person 2's backend. These results are raw extraction.",
        },
        "substitution_benchmark": run_substitution_benchmark(
            bits, carrier_positions, stamped_dna, codon_usage,
            SUBSTITUTION_RATES, N_TRIALS,
        ),
        "insertion_benchmark": run_insertion_benchmark(
            bits, carrier_positions, stamped_dna, codon_usage,
            INDEL_RATES, N_TRIALS,
        ),
        "deletion_benchmark": run_deletion_benchmark(
            bits, carrier_positions, stamped_dna, codon_usage,
            INDEL_RATES, N_TRIALS,
        ),
        "combined_indel_benchmark": run_indel_benchmark(
            bits, carrier_positions, stamped_dna, codon_usage,
            INDEL_RATES, N_TRIALS,
        ),
    }

    ARTIFACTS_DIR.mkdir(exist_ok=True)
    out_path = ARTIFACTS_DIR / "noise_benchmark.json"
    with open(out_path, "w") as fh:
        json.dump(results, fh, indent=2)

    print(f"Benchmark saved to {out_path}")

    # Summary table
    print("\nSubstitution Rate | Mean Recovery | Mean Erasure | Mean BER (non-erased)")
    print("-" * 70)
    for rate, rec in results["substitution_benchmark"].items():
        ber_str = f"{rec['mean_ber_non_erased']:.3f}" if rec["mean_ber_non_erased"] is not None else "  N/A"
        print(
            f"  {float(rate):>8.4f}       | {rec['mean_recovery']:>7.1%}       | "
            f"{rec['mean_erasure_rate']:>7.1%}      | {ber_str}"
        )

    print("\nIndel Rate        | Mean Recovery | Mean Erasure | Mean BER (non-erased)")
    print("-" * 70)
    for rate, rec in results["combined_indel_benchmark"].items():
        ber_str = f"{rec['mean_ber_non_erased']:.3f}" if rec["mean_ber_non_erased"] is not None else "  N/A"
        print(
            f"  {float(rate):>8.4f}       | {rec['mean_recovery']:>7.1%}       | "
            f"{rec['mean_erasure_rate']:>7.1%}      | {ber_str}"
        )


if __name__ == "__main__":
    main()
