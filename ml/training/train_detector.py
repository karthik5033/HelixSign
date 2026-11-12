"""
train_detector.py — Train k-mer XGBoost and 1D CNN detectors for HelixSign stealth evaluation.

Usage:
    cd ml
    python training/train_detector.py

Outputs (to ml/artifacts/):
    - eval_results.json  (AUC metrics for both detectors, naive vs helixsign)
    - kmer_detector.pkl  (DO NOT COMMIT)
    - cnn_detector.pt    (DO NOT COMMIT)
"""
import sys
import json
import random
import csv
from pathlib import Path
from typing import List, Optional

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
# Seed used for reproducible sequence selection & bit generation.
_SEED = 42


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def _try_load_fasta(path: Path, max_seqs: int) -> List[str]:
    """Attempt to parse a FASTA file; return list of sequence strings."""
    try:
        from Bio import SeqIO
        seqs = []
        for record in SeqIO.parse(str(path), "fasta"):
            s = str(record.seq).upper()
            if len(s) >= MIN_SEQ_LEN and set(s) <= {"A", "C", "G", "T"}:
                seqs.append(s)
                if len(seqs) >= max_seqs:
                    break
        return seqs
    except Exception as exc:
        print(f"  [warn] Could not parse FASTA {path}: {exc}")
        return []


def _try_load_csv(path: Path, max_seqs: int) -> List[str]:
    """
    Attempt to load CDS sequences from a CSV.

    Expected column names (case-insensitive): 'sequence', 'cds', 'dna', or 'seq'.
    """
    try:
        seqs = []
        with open(path, newline="") as fh:
            reader = csv.DictReader(fh)
            if reader.fieldnames is None:
                return []
            col = None
            for candidate in ("sequence", "cds", "dna", "seq"):
                if any(candidate == f.lower() for f in reader.fieldnames):
                    col = next(f for f in reader.fieldnames if f.lower() == candidate)
                    break
            if col is None:
                return []
            for row in reader:
                s = row[col].strip().upper()
                if len(s) >= MIN_SEQ_LEN and set(s) <= {"A", "C", "G", "T"}:
                    seqs.append(s)
                    if len(seqs) >= max_seqs:
                        break
        return seqs
    except Exception as exc:
        print(f"  [warn] Could not parse CSV {path}: {exc}")
        return []


def load_cds_sequences(max_seqs: int = 500) -> List[str]:
    """
    Load CDS sequences from processed CSV or FASTA files in ml/data/.
    Falls back to data/test_genes.fasta if nothing else is found.

    Priority order:
        1. ml/data/*.csv (processed table)
        2. ml/data/raw/*.fasta  or  ml/data/*.fasta
        3. ml/data/test_genes.fasta
    """
    seqs: List[str] = []

    # 1. Try CSV files
    for csv_path in sorted(DATA_DIR.glob("*.csv")):
        seqs.extend(_try_load_csv(csv_path, max_seqs - len(seqs)))
        if len(seqs) >= max_seqs:
            break

    # 2. Try FASTA files in data/ and data/raw/
    if len(seqs) < max_seqs:
        fasta_candidates = list(DATA_DIR.glob("*.fasta")) + list(DATA_DIR.glob("raw/*.fasta"))
        # Exclude test_genes.fasta from priority search (used as fallback)
        fasta_candidates = [p for p in fasta_candidates if p.name != "test_genes.fasta"]
        for fasta_path in sorted(fasta_candidates):
            seqs.extend(_try_load_fasta(fasta_path, max_seqs - len(seqs)))
            if len(seqs) >= max_seqs:
                break

    # 3. Fall back to test_genes.fasta
    if len(seqs) < max_seqs:
        fallback = DATA_DIR / "test_genes.fasta"
        if fallback.exists():
            seqs.extend(_try_load_fasta(fallback, max_seqs - len(seqs)))

    if not seqs:
        raise FileNotFoundError(
            "No CDS sequences found under ml/data/. "
            "Run data/download_ecoli.py first, or place a FASTA/CSV there."
        )

    return seqs[:max_seqs]


# ---------------------------------------------------------------------------
# Watermark generation
# ---------------------------------------------------------------------------

def _random_bits(n: int, seed: int) -> List[int]:
    rng = random.Random(seed)
    return [rng.randint(0, 1) for _ in range(n)]


def generate_naive_watermarked(native_seqs: List[str], codon_usage: dict) -> List[str]:
    """
    Generate naively watermarked versions of native sequences via ``naive_encode``.

    Each sequence is watermarked independently with a fresh random bit payload.
    Sequences for which naive_encode raises or returns None are silently skipped
    and replaced with the original sequence to keep list lengths equal.
    """
    watermarked: List[str] = []
    rng = random.Random(_SEED)

    for i, seq in enumerate(native_seqs):
        try:
            bits = [rng.randint(0, 1) for _ in range(64)]
            result = naive_encode(seq, bits, codon_usage)
            # naive_encode may return a string or (string, metadata) tuple
            if isinstance(result, tuple):
                watermarked.append(result[0])
            else:
                watermarked.append(result)
        except Exception as exc:
            print(f"  [warn] naive_encode failed for seq #{i}: {exc}; using original.")
            watermarked.append(seq)

    return watermarked


def generate_helixsign_watermarked(native_seqs: List[str], codon_usage: dict) -> List[str]:
    """
    Generate HelixSign (stealth) watermarked sequences with random bits via ``embed_bits``.

    Uses ``find_eligible_positions`` to locate synonym-carrier codons, then
    ``embed_bits`` to encode random payload bits.  Sequences with fewer than
    8 eligible positions are kept as-is (effectively un-watermarked).
    """
    watermarked: List[str] = []
    rng = random.Random(_SEED + 1)

    for i, seq in enumerate(native_seqs):
        try:
            eligible = find_eligible_positions(seq, codon_usage)
            if len(eligible) < 8:
                watermarked.append(seq)
                continue

            n_bits = min(64, len(eligible))
            carrier_positions = eligible[:n_bits]
            bits = [rng.randint(0, 1) for _ in range(n_bits)]

            result = embed_bits(seq, bits, carrier_positions, codon_usage)
            if isinstance(result, tuple):
                watermarked.append(result[0])
            else:
                watermarked.append(result)
        except Exception as exc:
            print(f"  [warn] embed_bits failed for seq #{i}: {exc}; using original.")
            watermarked.append(seq)

    return watermarked


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print("=== HelixSign Detector Training ===")

    codon_usage = load_codon_usage()
    native_seqs = load_cds_sequences(max_seqs=400)

    print(f"Loaded {len(native_seqs)} native sequences")

    # Generate watermarked sequences
    naive_seqs = generate_naive_watermarked(native_seqs, codon_usage)
    helix_seqs = generate_helixsign_watermarked(native_seqs, codon_usage)

    print(f"Generated {len(naive_seqs)} naive-watermarked sequences")
    print(f"Generated {len(helix_seqs)} HelixSign-watermarked sequences")

    # Split: 80% train, 20% test (deterministic)
    split = int(0.8 * len(native_seqs))

    native_train, native_test = native_seqs[:split], native_seqs[split:]
    naive_train, naive_test = naive_seqs[:split], naive_seqs[split:]
    helix_test = helix_seqs[split:]

    results: dict = {}

    # ------------------------------------------------------------------
    # k-mer XGBoost Detector
    # ------------------------------------------------------------------
    print("\n[1/2] Training k-mer XGBoost detector...")
    kmer_det = KmerXGBoostDetector()
    train_info = kmer_det.fit(native_train, naive_train)
    print(f"  Trained on {train_info['n_native']} native + {train_info['n_watermarked']} watermarked "
          f"(feature_dim={train_info['feature_dim']})")

    kmer_naive_eval = kmer_det.evaluate(native_test, naive_test)
    kmer_helix_eval = kmer_det.evaluate(native_test, helix_test)

    results["kmer_detector"] = {
        "naive_baseline": kmer_naive_eval,
        "helixsign_stealth": kmer_helix_eval,
    }
    print(f"  Naive AUC:     {kmer_naive_eval['auc']:.4f}  (target: ~0.99)")
    print(f"  HelixSign AUC: {kmer_helix_eval['auc']:.4f}  (target: ~0.50)")

    # ------------------------------------------------------------------
    # 1D CNN Detector
    # ------------------------------------------------------------------
    print("\n[2/2] Training 1D CNN detector (held-out)...")
    cnn_det = CNNDetector()
    cnn_det.fit(native_train, naive_train, epochs=15)

    cnn_naive_eval = cnn_det.evaluate(native_test, naive_test)
    cnn_helix_eval = cnn_det.evaluate(native_test, helix_test)

    results["cnn_detector"] = {
        "naive_baseline": cnn_naive_eval,
        "helixsign_stealth": cnn_helix_eval,
    }
    print(f"  Naive AUC:     {cnn_naive_eval['auc']:.4f}  (target: ~0.99)")
    print(f"  HelixSign AUC: {cnn_helix_eval['auc']:.4f}  (target: ~0.50)")

    # ------------------------------------------------------------------
    # Persist results
    # ------------------------------------------------------------------
    ARTIFACTS_DIR.mkdir(exist_ok=True)
    results_path = ARTIFACTS_DIR / "eval_results.json"
    with open(results_path, "w") as fh:
        json.dump(results, fh, indent=2)
    print(f"\nResults saved to {results_path}")

    kmer_det.save(str(ARTIFACTS_DIR / "kmer_detector.pkl"))
    cnn_det.save(str(ARTIFACTS_DIR / "cnn_detector.pt"))
    print("Model weights saved to artifacts/ (not committed to git)")

    print("\n=== Training Complete ===")


if __name__ == "__main__":
    main()
