"""
kmer_detector.py — k-mer frequency feature extraction + XGBoost classifier.

Extracts normalized k-mer frequency vectors (k in {3, 4, 6}) from DNA sequences
and trains an XGBoost binary classifier (Class 0: native, Class 1: watermarked).
"""
import numpy as np
import pickle
import json
from itertools import product
from pathlib import Path
from typing import List, Tuple, Optional

import xgboost as xgb
from sklearn.metrics import roc_auc_score, accuracy_score

BASES = "ACGT"
DEFAULT_K_VALUES = [3, 4, 6]


def _build_kmer_index(k: int) -> dict:
    """Build a mapping from k-mer string to integer index."""
    return {"".join(combo): i for i, combo in enumerate(product(BASES, repeat=k))}


# Pre-build indices for speed
_KMER_INDICES: dict[int, dict] = {}


def _get_kmer_index(k: int) -> dict:
    if k not in _KMER_INDICES:
        _KMER_INDICES[k] = _build_kmer_index(k)
    return _KMER_INDICES[k]


def extract_kmer_features(seq: str, k_values: List[int] = DEFAULT_K_VALUES) -> np.ndarray:
    """
    Extract normalized k-mer frequency vector for all k in k_values.

    For each k, counts all overlapping k-mers (sliding window) and normalises by
    the total number of valid k-mers found.  Only k-mers composed entirely of
    {A, C, G, T} are counted; degenerate bases are skipped.

    Returns concatenated feature vector of shape (sum(4^k for k in k_values),).
    """
    seq = seq.upper()
    parts: List[np.ndarray] = []

    for k in k_values:
        idx_map = _get_kmer_index(k)
        n_kmers = 4 ** k
        counts = np.zeros(n_kmers, dtype=np.float64)

        total = 0
        for i in range(len(seq) - k + 1):
            kmer = seq[i : i + k]
            if kmer in idx_map:
                counts[idx_map[kmer]] += 1
                total += 1

        # Normalise; guard against zero-length sequences
        if total > 0:
            counts /= total

        parts.append(counts)

    return np.concatenate(parts)


def build_feature_matrix(
    sequences: List[str], k_values: List[int] = DEFAULT_K_VALUES
) -> np.ndarray:
    """
    Extract features for a list of sequences.

    Returns array of shape (N, D) where D = sum(4^k for k in k_values).
    """
    if not sequences:
        d = sum(4 ** k for k in k_values)
        return np.empty((0, d), dtype=np.float64)

    rows = [extract_kmer_features(seq, k_values) for seq in sequences]
    return np.vstack(rows)


class KmerXGBoostDetector:
    """
    k-mer XGBoost detector.

    Trained on native vs naively watermarked E. coli CDS.
    Positive class (1) = watermarked, negative class (0) = native.
    """

    def __init__(self, k_values: List[int] = DEFAULT_K_VALUES, **xgb_kwargs):
        self.k_values = k_values
        self.model = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
            **xgb_kwargs,
        )
        self.trained: bool = False

    # ------------------------------------------------------------------
    def fit(self, native_seqs: List[str], watermarked_seqs: List[str]) -> dict:
        """
        Train on native (label=0) vs watermarked (label=1) sequences.

        Returns a dict with training summary (n_native, n_watermarked, feature_dim).
        """
        X_native = build_feature_matrix(native_seqs, self.k_values)
        X_wm = build_feature_matrix(watermarked_seqs, self.k_values)

        X = np.vstack([X_native, X_wm])
        y = np.concatenate(
            [np.zeros(len(X_native), dtype=np.int32), np.ones(len(X_wm), dtype=np.int32)]
        )

        self.model.fit(X, y)
        self.trained = True

        return {
            "n_native": len(X_native),
            "n_watermarked": len(X_wm),
            "feature_dim": X.shape[1],
        }

    # ------------------------------------------------------------------
    def predict_proba(self, sequences: List[str]) -> np.ndarray:
        """
        Return probability of class 1 (watermarked) for each sequence.

        Shape: (N,)
        """
        if not self.trained:
            raise RuntimeError("Detector has not been trained yet. Call fit() first.")

        X = build_feature_matrix(sequences, self.k_values)
        # XGBClassifier.predict_proba returns (N, 2); take column 1.
        return self.model.predict_proba(X)[:, 1]

    # ------------------------------------------------------------------
    def evaluate(
        self, native_seqs: List[str], watermarked_seqs: List[str]
    ) -> dict:
        """
        Evaluate on held-out native and watermarked sequences.

        Returns dict with keys: auc, accuracy, threshold (0.5 hard threshold).
        """
        all_seqs = native_seqs + watermarked_seqs
        y_true = np.concatenate(
            [np.zeros(len(native_seqs)), np.ones(len(watermarked_seqs))]
        )

        probas = self.predict_proba(all_seqs)
        auc = float(roc_auc_score(y_true, probas))
        preds = (probas >= 0.5).astype(int)
        acc = float(accuracy_score(y_true, preds))

        return {"auc": auc, "accuracy": acc, "threshold": 0.5}

    # ------------------------------------------------------------------
    def save(self, path: str) -> None:
        """Save model to pickle. Should NOT be committed to git."""
        with open(path, "wb") as fh:
            pickle.dump(
                {"k_values": self.k_values, "model": self.model, "trained": self.trained},
                fh,
            )

    def load(self, path: str) -> None:
        """Load model from pickle."""
        with open(path, "rb") as fh:
            state = pickle.load(fh)
        self.k_values = state["k_values"]
        self.model = state["model"]
        self.trained = state["trained"]
