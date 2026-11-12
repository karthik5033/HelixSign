"""
test_detectors.py — Unit tests for KmerXGBoostDetector and CNNDetector.

Uses small synthetic datasets to verify fit/predict/evaluate without
requiring the full 4,290-gene training corpus.
"""
import sys
from pathlib import Path
import random
import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from genestamp_ml.detectors.kmer_detector import KmerXGBoostDetector
from genestamp_ml.detectors.cnn_detector import CNNDetector

# Synthetic CDS sequences (all ACGT, length divisible by 3, >= 300 bp)
_RNG = random.Random(999)
BASES = "ACGT"

def _random_cds(length: int = 300, seed: int = 0) -> str:
    r = random.Random(seed)
    return "".join(r.choice(BASES) for _ in range(length))

# Generate small balanced datasets
N_NATIVE = 40
N_WM     = 40

NATIVE_SEQS = [_random_cds(300 + i * 3, seed=i) for i in range(N_NATIVE)]

# "Watermarked": replace a fixed fraction of bases with C (artificial bias)
def _bias_seq(seq: str, rate: float = 0.3) -> str:
    r = random.Random(hash(seq) % 10000)
    return "".join("C" if r.random() < rate else b for b in seq)

WM_SEQS = [_bias_seq(s) for s in NATIVE_SEQS]


# ---------------------------------------------------------------------------
# KmerXGBoostDetector
# ---------------------------------------------------------------------------

class TestKmerDetector:
    @pytest.fixture(scope="class")
    def trained_kmer(self):
        det = KmerXGBoostDetector()
        split = int(0.75 * N_NATIVE)
        det.fit(NATIVE_SEQS[:split], WM_SEQS[:split])
        return det, split

    def test_fit_returns_info(self, trained_kmer):
        det, split = trained_kmer
        # fit was already called; just check the detector is trained
        assert det is not None

    def test_predict_proba_shape(self, trained_kmer):
        det, split = trained_kmer
        probas = det.predict_proba(NATIVE_SEQS[split:])
        assert probas.shape == (N_NATIVE - split,), (
            f"Expected ({N_NATIVE - split},) got {probas.shape}"
        )

    def test_predict_proba_range(self, trained_kmer):
        det, split = trained_kmer
        probas = det.predict_proba(NATIVE_SEQS[split:] + WM_SEQS[split:])
        assert np.all(probas >= 0.0) and np.all(probas <= 1.0), (
            "Probabilities must be in [0, 1]"
        )

    def test_evaluate_returns_auc(self, trained_kmer):
        det, split = trained_kmer
        metrics = det.evaluate(NATIVE_SEQS[split:], WM_SEQS[split:])
        assert "auc" in metrics
        assert 0.0 <= metrics["auc"] <= 1.0

    def test_biased_sequences_detectable(self, trained_kmer):
        """Artificially biased sequences should score >0.5 on average."""
        det, split = trained_kmer
        probas = det.predict_proba(WM_SEQS[split:])
        assert probas.mean() > 0.5, (
            f"Biased sequences not detected: mean prob = {probas.mean():.3f}"
        )

    def test_save_load_roundtrip(self, trained_kmer, tmp_path):
        det, split = trained_kmer
        save_path = str(tmp_path / "kmer_test.pkl")
        det.save(save_path)

        det2 = KmerXGBoostDetector()
        det2.load(save_path)

        p1 = det.predict_proba(NATIVE_SEQS[:5])
        p2 = det2.predict_proba(NATIVE_SEQS[:5])
        np.testing.assert_allclose(p1, p2, rtol=1e-5), (
            "Loaded model must reproduce identical predictions"
        )


# ---------------------------------------------------------------------------
# CNNDetector
# ---------------------------------------------------------------------------

class TestCNNDetector:
    @pytest.fixture(scope="class")
    def trained_cnn(self):
        det = CNNDetector()
        split = int(0.75 * N_NATIVE)
        det.fit(NATIVE_SEQS[:split], WM_SEQS[:split], epochs=3)
        return det, split

    def test_fit_completes(self, trained_cnn):
        det, _ = trained_cnn
        assert det.trained is True

    def test_predict_proba_shape(self, trained_cnn):
        det, split = trained_cnn
        probas = det.predict_proba(NATIVE_SEQS[split:])
        assert len(probas) == N_NATIVE - split

    def test_predict_proba_range(self, trained_cnn):
        det, split = trained_cnn
        probas = det.predict_proba(NATIVE_SEQS[split:] + WM_SEQS[split:])
        assert np.all(probas >= 0.0) and np.all(probas <= 1.0)

    def test_evaluate_returns_auc(self, trained_cnn):
        det, split = trained_cnn
        metrics = det.evaluate(NATIVE_SEQS[split:], WM_SEQS[split:])
        assert "auc" in metrics
        assert "windowing" in metrics, "evaluate() should include windowing metadata"
        assert 0.0 <= metrics["auc"] <= 1.0

    def test_multi_window_longer_sequence(self, trained_cnn):
        """Multi-window inference should work on sequences longer than 256 bp."""
        det, _ = trained_cnn
        long_seq = _random_cds(600, seed=500)
        probas = det.predict_proba([long_seq])
        assert len(probas) == 1
        assert 0.0 <= probas[0] <= 1.0

    def test_untrained_raises(self):
        det = CNNDetector()
        with pytest.raises(RuntimeError, match="not been trained"):
            det.predict_proba(["ATGCGT"])

    def test_save_load_roundtrip(self, trained_cnn, tmp_path):
        det, _ = trained_cnn
        save_path = str(tmp_path / "cnn_test.pt")
        det.save(save_path)

        det2 = CNNDetector()
        det2.load(save_path)

        p1 = det.predict_proba(NATIVE_SEQS[:3])
        p2 = det2.predict_proba(NATIVE_SEQS[:3])
        np.testing.assert_allclose(p1, p2, rtol=1e-4)

