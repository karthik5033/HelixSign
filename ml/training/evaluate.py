"""
evaluate.py — Generate AUC curves and watermark recovery benchmarks for HelixSign.

Usage:
    cd ml
    python training/evaluate.py

Outputs:
    ml/artifacts/noise_benchmark.json  — recovery rates across substitution/indel noise levels
"""
import sys
import json
import random
from pathlib import Path
from typing import List, Tuple, Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

from genestamp_ml.bio import load_codon_usage
from genestamp_ml.embed import find_eligible_positions, embed_bits
from genestamp_ml.extract import extract_bits
from genestamp_ml.channel import simulate_channel

ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"

SUBSTITUTION_RATES = [0.001, 0.005, 0.01, 0.02, 0.03, 0.05]
INDEL_RATES = [0.001, 0.005, 0.01, 0.02]
N_TRIALS = 30  # Monte Carlo trials per configuration


# ---------------------------------------------------------------------------
# Metric helpers
# ---------------------------------------------------------------------------

def bit_error_rate(original_bits: List[int], recovered_bits: List[int]) -> float:
    """
    Fraction of bits recovered incorrectly.

    When the two lists have different lengths (e.g. caused by indels changing
    the sequence length), comparison is performed only over the shorter length.
    Extra bits in the longer list are considered *errors*, so the denominator
    is always ``len(original_bits)``.
    """
    n_original = len(original_bits)
    if n_original == 0:
        return 0.0

    n_compare = min(n_original, len(recovered_bits))
    errors = sum(
        1 for a, b in zip(original_bits[:n_compare], recovered_bits[:n_compare]) if a != b
    )
    # Any bits in original_bits beyond what could be recovered count as errors
    errors += n_original - n_compare
    return errors / n_original


def watermark_recovery_rate(original_bits: List[int], recovered_bits: List[int]) -> float:
    """Return fraction correctly recovered (1 - BER)."""
    return 1.0 - bit_error_rate(original_bits, recovered_bits)


# ---------------------------------------------------------------------------
# Noise benchmarks
# ---------------------------------------------------------------------------

def _apply_substitutions(seq: str, rate: float, rng: random.Random) -> str:
    """Apply random nucleotide substitutions at the given per-base rate."""
    bases = "ACGT"
    result = []
    for base in seq:
        if rng.random() < rate:
            # Pick a different base uniformly at random
            candidates = [b for b in bases if b != base.upper()]
            result.append(rng.choice(candidates))
        else:
            result.append(base)
    return "".join(result)


def _apply_indels(seq: str, rate: float, rng: random.Random) -> str:
    """
    Apply random insertions and deletions at the given per-event rate.

    At each position:
      - With probability ``rate / 2``: insert a random base before this position.
      - With probability ``rate / 2``: delete this base.
    """
    bases = "ACGT"
    result = []
    for base in seq:
        event = rng.random()
        if event < rate / 2:
            # Insertion before this base
            result.append(rng.choice(bases))
            result.append(base)
        elif event < rate:
            # Deletion — skip this base
            pass
        else:
            result.append(base)
    return "".join(result)


def _recover_bits_safe(
    noisy_seq: str,
    carrier_positions: List[int],
    codon_usage: dict,
    n_bits: int,
) -> List[int]:
    """
    Attempt to extract watermark bits from a (possibly corrupted) sequence.

    ``extract_bits`` returns a ``(bit_estimates, confidences)`` tuple.
    If extraction raises (e.g. frame-shift from indels) or returns too few bits,
    missing/erroneous bits are filled with 0 (i.e., treated as wrong for BER).
    """
    try:
        result = extract_bits(noisy_seq, carrier_positions, codon_usage)
        if result is None:
            return [0] * n_bits
        # extract_bits returns (bit_estimates, confidences) — unpack accordingly
        if isinstance(result, tuple):
            recovered = list(result[0])
        else:
            recovered = list(result)
        # Pad or truncate to expected length
        if len(recovered) < n_bits:
            recovered += [0] * (n_bits - len(recovered))
        return recovered[:n_bits]
    except Exception:
        # Frame shift or other corruption → all bits lost
        return [0] * n_bits


def run_substitution_benchmark(
    seq: str,
    bits: List[int],
    carrier_positions: List[int],
    stamped_dna: str,
    codon_usage: dict,
    rates: List[float],
    n_trials: int,
) -> dict:
    """
    Run substitution noise benchmark across given per-base error rates.

    Returns a dict keyed by rate string, each value being:
        {"mean_recovery": float, "std_recovery": float, "trials": int}
    """
    results = {}
    n_bits = len(bits)

    for rate in rates:
        recoveries = []
        for trial in range(n_trials):
            rng = random.Random(rate * 1e6 + trial)
            noisy = _apply_substitutions(stamped_dna, rate, rng)
            recovered = _recover_bits_safe(noisy, carrier_positions, codon_usage, n_bits)
            recoveries.append(watermark_recovery_rate(bits, recovered))

        results[str(rate)] = {
            "mean_recovery": float(sum(recoveries) / len(recoveries)),
            "std_recovery": float(
                (sum((r - sum(recoveries) / len(recoveries)) ** 2 for r in recoveries) / len(recoveries)) ** 0.5
            ),
            "trials": n_trials,
        }

    return results


def run_indel_benchmark(
    seq: str,
    bits: List[int],
    carrier_positions: List[int],
    stamped_dna: str,
    codon_usage: dict,
    rates: List[float],
    n_trials: int,
) -> dict:
    """
    Run indel noise benchmark across given per-event rates.

    When indels shift the reading frame, all bits are treated as unrecoverable.

    Returns a dict keyed by rate string, each value being:
        {"mean_recovery": float, "std_recovery": float, "trials": int}
    """
    results = {}
    n_bits = len(bits)

    for rate in rates:
        recoveries = []
        for trial in range(n_trials):
            rng = random.Random(rate * 1e9 + trial + 500)
            noisy = _apply_indels(stamped_dna, rate, rng)

            # Frame-shift detection: if length difference is not divisible by 3,
            # codon positions are meaningless → treat all bits as lost.
            len_diff = len(noisy) - len(stamped_dna)
            if len_diff % 3 != 0:
                recoveries.append(0.0)
                continue

            recovered = _recover_bits_safe(noisy, carrier_positions, codon_usage, n_bits)
            recoveries.append(watermark_recovery_rate(bits, recovered))

        results[str(rate)] = {
            "mean_recovery": float(sum(recoveries) / len(recoveries)),
            "std_recovery": float(
                (sum((r - sum(recoveries) / len(recoveries)) ** 2 for r in recoveries) / len(recoveries)) ** 0.5
            ),
            "trials": n_trials,
        }

    return results


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print("=== HelixSign Channel Noise Benchmark ===")
    codon_usage = load_codon_usage()

    # Load test gene(s)
    from Bio import SeqIO

    test_fasta = Path(__file__).parent.parent / "data" / "test_genes.fasta"
    if not test_fasta.exists():
        print(f"Test FASTA not found at {test_fasta}. Run data/download_ecoli.py first.")
        return

    seqs = [
        str(r.seq).upper()
        for r in SeqIO.parse(str(test_fasta), "fasta")
        if len(str(r.seq)) >= 600 and set(str(r.seq).upper()) <= {"A", "C", "G", "T"}
    ]

    if not seqs:
        print("No suitable test genes found (need ≥600 bp). Run data/download_ecoli.py first.")
        return

    test_seq = seqs[0]
    print(f"Test sequence length: {len(test_seq)} bp")

    eligible = find_eligible_positions(test_seq, codon_usage)
    n_bits = min(64, len(eligible))

    if n_bits == 0:
        print("No eligible watermark positions found in test sequence. Aborting.")
        return

    carrier_positions = eligible[:n_bits]
    bits = [i % 2 for i in range(n_bits)]  # Alternating test pattern

    result_embed = embed_bits(test_seq, bits, carrier_positions, codon_usage)
    stamped_dna = result_embed[0] if isinstance(result_embed, tuple) else result_embed

    print(f"Embedded {n_bits} bits into {len(carrier_positions)} carrier positions.")
    print(f"Running {N_TRIALS} Monte Carlo trials per noise configuration...\n")

    results = {
        "test_sequence_length": len(test_seq),
        "n_bits_embedded": n_bits,
        "substitution_benchmark": run_substitution_benchmark(
            test_seq, bits, carrier_positions, stamped_dna, codon_usage,
            SUBSTITUTION_RATES, N_TRIALS,
        ),
        "indel_benchmark": run_indel_benchmark(
            test_seq, bits, carrier_positions, stamped_dna, codon_usage,
            INDEL_RATES, N_TRIALS,
        ),
    }

    ARTIFACTS_DIR.mkdir(exist_ok=True)
    out_path = ARTIFACTS_DIR / "noise_benchmark.json"
    with open(out_path, "w") as fh:
        json.dump(results, fh, indent=2)

    print(f"Benchmark saved to {out_path}")

    # Summary table
    print("\nSubstitution Rate | Mean Recovery Rate | Std")
    print("-" * 50)
    for rate, rec in results["substitution_benchmark"].items():
        print(
            f"  {float(rate):>8.4f}       |   {rec['mean_recovery']:>7.1%}          | "
            f"±{rec['std_recovery']:.1%}"
        )

    print("\nIndel Rate        | Mean Recovery Rate | Std")
    print("-" * 50)
    for rate, rec in results["indel_benchmark"].items():
        print(
            f"  {float(rate):>8.4f}       |   {rec['mean_recovery']:>7.1%}          | "
            f"±{rec['std_recovery']:.1%}"
        )


if __name__ == "__main__":
    main()
