"""
train_detector.py — Train k-mer XGBoost and 1D CNN detectors for HelixSign stealth evaluation.

Usage:
    cd ml
    python training/train_detector.py [--seeds 42 100 2026]

Outputs (to ml/artifacts/):
    - eval_results.json        (AUC metrics for both detectors, naive vs helixsign, mean±std over seeds)
    - kmer_detector.pkl        (DO NOT COMMIT)
    - cnn_detector.pt          (DO NOT COMMIT)
    - audit/split_integrity.json

IMPORTANT: This script respects the predefined train/validation/test gene-level splits
recorded in the processed CSV.  The 5 test genes (b3920, b1703, b2022, b0930, b0568)
are strictly excluded from training and validation.
"""
import sys
import json
import random
import csv
import argparse
import statistics
from pathlib import Path
from typing import List, Optional, Dict

# Add ml/ to path so genestamp_ml is importable
sys.path.insert(0, str(Path(__file__).parent.parent))

from genestamp_ml.bio import load_codon_usage, translate_seq
from genestamp_ml.embed import find_eligible_positions, embed_bits
from genestamp_ml.naive import naive_encode
from genestamp_ml.detectors.kmer_detector import KmerXGBoostDetector
from genestamp_ml.detectors.cnn_detector import CNNDetector

ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"
DATA_DIR = Path(__file__).parent.parent / "data"

# Minimum CDS length in bp to include in the dataset.
MIN_SEQ_LEN = 300

# Test gene IDs that must NEVER appear in train or validation sets.
_TEST_GENE_IDS = {"b3920", "b1703", "b2022", "b0930", "b0568"}


# ---------------------------------------------------------------------------
# Data loading — split-aware
# ---------------------------------------------------------------------------

def load_split_sequences(
    split: str,
    max_seqs: Optional[int] = None,
) -> List[str]:
    """
    Load CDS sequences for a given split ('train', 'validation', or 'test')
    from the processed CSV, respecting the predefined gene-level partitioning.

    Parameters
    ----------
    split    : One of 'train', 'validation', 'test'.
    max_seqs : Maximum number of sequences to return (None = no limit).

    Returns
    -------
    List of uppercase ACGT CDS strings.
    """
    csv_candidates = sorted(
        list(DATA_DIR.glob("*.csv")) + list(DATA_DIR.glob("processed/*.csv"))
    )
    csv_candidates = [p for p in csv_candidates if "exclusion" not in p.name.lower()]

    seqs: List[str] = []
    gene_ids: List[str] = []

    for csv_path in csv_candidates:
        try:
            with open(csv_path, newline="") as fh:
                reader = csv.DictReader(fh)
                if reader.fieldnames is None:
                    continue

                fields_lower = {f.lower(): f for f in reader.fieldnames}
                seq_col  = fields_lower.get("dna_sequence") or fields_lower.get("sequence")
                split_col = fields_lower.get("split")
                id_col   = fields_lower.get("gene_id") or fields_lower.get("gene")

                if seq_col is None:
                    continue

                for row in reader:
                    # Filter by split if the column exists
                    if split_col and row.get(split_col, "").strip().lower() != split.lower():
                        continue

                    # Exclude held-out test genes regardless of their CSV split label
                    gid = row.get(id_col or "", "").strip() if id_col else ""
                    if gid in _TEST_GENE_IDS and split != "test":
                        continue

                    s = row[seq_col].strip().upper()
                    if len(s) >= MIN_SEQ_LEN and set(s) <= {"A", "C", "G", "T"}:
                        seqs.append(s)
                        gene_ids.append(gid)
                        if max_seqs and len(seqs) >= max_seqs:
                            break

            if seqs:
                break  # Found data in first valid CSV
        except Exception as exc:
            print(f"  [warn] Could not parse {csv_path}: {exc}")

    if not seqs:
        raise FileNotFoundError(
            f"No '{split}' sequences found in {DATA_DIR}. "
            "Run data/download_ecoli.py first."
        )

    return seqs, gene_ids


def save_split_integrity(
    train_ids: List[str],
    val_ids: List[str],
    test_ids: List[str],
) -> None:
    """Write split_integrity.json to artifacts/audit/."""
    audit_dir = ARTIFACTS_DIR / "audit"
    audit_dir.mkdir(parents=True, exist_ok=True)

    # Verify no overlap
    train_set = set(train_ids)
    val_set   = set(val_ids)
    test_set  = set(test_ids)

    tv_overlap  = sorted(train_set & val_set)
    tt_overlap  = sorted(train_set & test_set)
    vt_overlap  = sorted(val_set & test_set)

    test_genes_in_train = sorted(_TEST_GENE_IDS & train_set)
    test_genes_in_val   = sorted(_TEST_GENE_IDS & val_set)

    integrity = {
        "train_count": len(train_ids),
        "validation_count": len(val_ids),
        "test_count": len(test_ids),
        "five_test_genes": sorted(_TEST_GENE_IDS),
        "five_test_genes_in_train": test_genes_in_train,
        "five_test_genes_in_val": test_genes_in_val,
        "train_val_overlap": tv_overlap,
        "train_test_overlap": tt_overlap,
        "val_test_overlap": vt_overlap,
        "overlaps_found": bool(tv_overlap or tt_overlap or vt_overlap),
        "verdict": (
            "PASS — no cross-partition leakage detected"
            if not (tv_overlap or tt_overlap or vt_overlap
                    or test_genes_in_train or test_genes_in_val)
            else "FAIL — overlap detected, see fields above"
        ),
    }

    out = audit_dir / "split_integrity.json"
    with open(out, "w") as fh:
        json.dump(integrity, fh, indent=2)
    print(f"  Split integrity audit saved to {out}")
    print(f"  Verdict: {integrity['verdict']}")


# ---------------------------------------------------------------------------
# Watermark generation
# ---------------------------------------------------------------------------

def _random_bits(n: int, seed: int) -> List[int]:
    rng = random.Random(seed)
    return [rng.randint(0, 1) for _ in range(n)]


def generate_naive_watermarked(native_seqs: List[str], codon_usage: dict, seed: int = 42) -> List[str]:
    """
    Generate naively watermarked sequences via ``naive_encode``.

    Watermark positions are drawn uniformly across the entire gene (not just
    the 5-prime end).  Bit values are random but deterministic via *seed*.

    Sequences for which encoding raises are silently kept as the original
    to maintain 1-to-1 pairing with native_seqs.
    """
    watermarked: List[str] = []
    rng = random.Random(seed)

    for i, seq in enumerate(native_seqs):
        try:
            bits = [rng.randint(0, 1) for _ in range(64)]
            # naive_encode uses all eligible positions; ensure it can fit 64 bits
            from genestamp_ml.embed import find_eligible_positions
            eligible = find_eligible_positions(seq, codon_usage)
            n_bits = min(64, len(eligible))
            if n_bits == 0:
                watermarked.append(seq)
                continue
            bits_trimmed = bits[:n_bits]
            result = naive_encode(seq, bits_trimmed, codon_usage)
            watermarked.append(result if isinstance(result, str) else result[0])
        except Exception as exc:
            print(f"  [warn] naive_encode failed for seq #{i}: {exc}; using original.")
            watermarked.append(seq)

    return watermarked


def generate_helixsign_watermarked(native_seqs: List[str], codon_usage: dict, seed: int = 43) -> List[str]:
    """
    Generate HelixSign-watermarked sequences with random bits via ``embed_bits``.

    Carrier positions are drawn UNIFORMLY across the gene (not just 5' end) to
    avoid positional bias that the CNN center-window would detect trivially.
    Sequences with fewer than 8 eligible positions are kept as-is.
    """
    watermarked: List[str] = []
    rng = random.Random(seed)

    for i, seq in enumerate(native_seqs):
        try:
            eligible = find_eligible_positions(seq, codon_usage)
            if len(eligible) < 8:
                watermarked.append(seq)
                continue

            n_bits = min(64, len(eligible))
            # Uniform random sample of positions (without replacement, sorted)
            carrier_positions = sorted(rng.sample(eligible, n_bits))
            bits = [rng.randint(0, 1) for _ in range(n_bits)]

            result = embed_bits(seq, bits, carrier_positions, codon_usage)
            watermarked.append(result[0] if isinstance(result, tuple) else result)
        except Exception as exc:
            print(f"  [warn] embed_bits failed for seq #{i}: {exc}; using original.")
            watermarked.append(seq)

    return watermarked


# ---------------------------------------------------------------------------
# Single-seed training + evaluation
# ---------------------------------------------------------------------------

def run_one_seed(
    seed: int,
    train_seqs: List[str],
    val_seqs: List[str],
    test_seqs: List[str],
    codon_usage: dict,
    save_models: bool = False,
) -> dict:
    """Train detectors for one random seed; return AUC metrics."""
    print(f"\n  --- Seed {seed} ---")

    # Generate watermarked counterparts for each split
    naive_train  = generate_naive_watermarked(train_seqs, codon_usage, seed=seed)
    helix_train  = generate_helixsign_watermarked(train_seqs, codon_usage, seed=seed + 1)

    naive_val    = generate_naive_watermarked(val_seqs, codon_usage, seed=seed + 10)
    helix_val    = generate_helixsign_watermarked(val_seqs, codon_usage, seed=seed + 11)

    naive_test   = generate_naive_watermarked(test_seqs, codon_usage, seed=seed + 20)
    helix_test   = generate_helixsign_watermarked(test_seqs, codon_usage, seed=seed + 21)

    print(f"    Train : {len(train_seqs)} native, {len(naive_train)} naive-wm, {len(helix_train)} helix-wm")
    print(f"    Val   : {len(val_seqs)} native")
    print(f"    Test  : {len(test_seqs)} native")

    seed_results = {}

    # ------------------------------------------------------------------
    # k-mer XGBoost Detector
    # ------------------------------------------------------------------
    print("    [1/2] Training k-mer XGBoost detector...")
    kmer_det = KmerXGBoostDetector()
    train_info = kmer_det.fit(train_seqs, naive_train)
    print(f"      Trained on {train_info['n_native']} native + {train_info['n_watermarked']} "
          f"watermarked (feature_dim={train_info['feature_dim']})")

    # Evaluate on held-out TEST partition
    kmer_naive_eval = kmer_det.evaluate(test_seqs, naive_test)
    kmer_helix_eval = kmer_det.evaluate(test_seqs, helix_test)

    seed_results["kmer_detector"] = {
        "naive_baseline": kmer_naive_eval,
        "helixsign_stealth": kmer_helix_eval,
        "train_partition": "train",
        "eval_partition": "test",
        "note": "raw extraction without ECC",
    }
    print(f"      Naive AUC:     {kmer_naive_eval['auc']:.4f}  (target: >0.95)")
    print(f"      HelixSign AUC: {kmer_helix_eval['auc']:.4f}  (target: 0.48-0.52)")

    if save_models:
        kmer_det.save(str(ARTIFACTS_DIR / "kmer_detector.pkl"))
        print(f"      Saved to artifacts/kmer_detector.pkl")

    # ------------------------------------------------------------------
    # 1D CNN Detector
    # ------------------------------------------------------------------
    print("    [2/2] Training 1D CNN detector...")
    cnn_det = CNNDetector()
    cnn_det.fit(train_seqs, naive_train, epochs=15)

    cnn_naive_eval = cnn_det.evaluate(test_seqs, naive_test)
    cnn_helix_eval = cnn_det.evaluate(test_seqs, helix_test)

    seed_results["cnn_detector"] = {
        "naive_baseline": cnn_naive_eval,
        "helixsign_stealth": cnn_helix_eval,
        "train_partition": "train",
        "eval_partition": "test",
        "note": "raw extraction without ECC",
    }
    print(f"      Naive AUC:     {cnn_naive_eval['auc']:.4f}  (target: >0.80)")
    print(f"      HelixSign AUC: {cnn_helix_eval['auc']:.4f}  (target: 0.48-0.52)")

    if save_models:
        cnn_det.save(str(ARTIFACTS_DIR / "cnn_detector.pt"))
        print(f"      Saved to artifacts/cnn_detector.pt")

    return seed_results


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Train HelixSign detectors.")
    parser.add_argument(
        "--seeds", nargs="+", type=int, default=[42],
        help="Random seeds for multi-seed evaluation (default: [42]).",
    )
    parser.add_argument(
        "--max-train", type=int, default=2400,
        help="Maximum number of training sequences to use (default: 2400).",
    )
    parser.add_argument(
        "--max-val", type=int, default=None,
        help="Maximum validation sequences (default: all).",
    )
    args = parser.parse_args()

    print("=== HelixSign Detector Training ===")
    print(f"Seeds: {args.seeds}")

    codon_usage = load_codon_usage()

    # Load split-aware sequences
    print("\nLoading split-aware gene partitions...")
    train_seqs, train_ids = load_split_sequences("train", max_seqs=args.max_train)
    val_seqs,   val_ids   = load_split_sequences("validation", max_seqs=args.max_val)
    test_seqs,  test_ids  = load_split_sequences("test")

    print(f"  Train   : {len(train_seqs)} sequences")
    print(f"  Val     : {len(val_seqs)} sequences")
    print(f"  Test    : {len(test_seqs)} sequences")

    # Audit and save split integrity
    save_split_integrity(train_ids, val_ids, test_ids)

    # Run across seeds
    all_seed_results = []
    for i, seed in enumerate(args.seeds):
        save_models = (i == 0)  # Save model files from first seed only
        result = run_one_seed(
            seed, train_seqs, val_seqs, test_seqs, codon_usage,
            save_models=save_models,
        )
        all_seed_results.append({"seed": seed, **result})

    # Aggregate across seeds
    def _mean_std(values: List[float]) -> dict:
        if len(values) == 1:
            return {"mean": values[0], "std": None, "n_seeds": 1}
        return {
            "mean": statistics.mean(values),
            "std": statistics.stdev(values),
            "n_seeds": len(values),
        }

    summary = {
        "seeds": args.seeds,
        "train_count": len(train_seqs),
        "val_count": len(val_seqs),
        "test_count": len(test_seqs),
        "partitioning": "gene-level (split column from processed CSV)",
        "evaluation_note": (
            "All AUC values are computed on the held-out TEST partition. "
            "Results are raw extraction without ECC. "
            "ECC (Reed-Solomon) is implemented in the backend layer (Person 2)."
        ),
        "per_seed": all_seed_results,
        "aggregate": {
            "kmer_naive_auc":     _mean_std([r["kmer_detector"]["naive_baseline"]["auc"] for r in all_seed_results]),
            "kmer_helixsign_auc": _mean_std([r["kmer_detector"]["helixsign_stealth"]["auc"] for r in all_seed_results]),
            "cnn_naive_auc":      _mean_std([r["cnn_detector"]["naive_baseline"]["auc"] for r in all_seed_results]),
            "cnn_helixsign_auc":  _mean_std([r["cnn_detector"]["helixsign_stealth"]["auc"] for r in all_seed_results]),
        },
    }

    # Print summary
    print("\n=== Aggregate Results ===")
    for key, val in summary["aggregate"].items():
        if val["std"] is not None:
            print(f"  {key:<25}: {val['mean']:.4f} ± {val['std']:.4f}  (n={val['n_seeds']})")
        else:
            print(f"  {key:<25}: {val['mean']:.4f}  (single seed)")

    # Persist
    ARTIFACTS_DIR.mkdir(exist_ok=True)
    results_path = ARTIFACTS_DIR / "eval_results.json"
    with open(results_path, "w") as fh:
        json.dump(summary, fh, indent=2)
    print(f"\nResults saved to {results_path}")
    print("Model weights saved to artifacts/ (not committed to git)")
    print("\n=== Training Complete ===")


if __name__ == "__main__":
    main()
