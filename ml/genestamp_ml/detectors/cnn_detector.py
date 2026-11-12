"""
cnn_detector.py — 1D CNN over one-hot encoded DNA for stealth detection.

Architecture:
  - Input: one-hot encoded DNA windows (4 channels, L=256 bp window)
  - Conv1D(32, kernel=7) -> BatchNorm -> ReLU -> MaxPool(2)
  - Conv1D(64, kernel=5) -> BatchNorm -> ReLU -> MaxPool(2)
  - Conv1D(128, kernel=3) -> BatchNorm -> ReLU -> GlobalAvgPool
  - Dense(64) -> ReLU -> Dropout(0.3) -> Dense(1) -> Sigmoid

Held-out from WGAN-GP refiner training (used only for final stealth eval).
"""
import numpy as np
import random
from typing import List, Optional

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from sklearn.metrics import roc_auc_score, accuracy_score

WINDOW_SIZE = 256
BASE_TO_IDX = {"A": 0, "C": 1, "G": 2, "T": 3}


# ---------------------------------------------------------------------------
# Encoding helpers
# ---------------------------------------------------------------------------

def one_hot_encode(
    seq: str,
    window_size: int = WINDOW_SIZE,
    center: bool = False,
    rng: Optional[random.Random] = None,
) -> np.ndarray:
    """
    One-hot encode a DNA sequence into a (4, window_size) array.

    Windowing strategy
    ------------------
    - If ``seq`` is shorter than ``window_size``: the sequence is left-aligned
      and the remainder is zero-padded.
    - If ``seq`` is longer than ``window_size``:
        - ``center=True``  → take the central ``window_size`` bases (inference).
        - ``center=False`` → take a random ``window_size``-length window (training).

    Parameters
    ----------
    seq         : DNA string (upper or lower-case; degenerate bases encoded as zeros).
    window_size : Target sequence length.
    center      : Use center window instead of a random window for long sequences.
    rng         : ``random.Random`` instance for reproducible random windowing.
                  If None, the global ``random`` module is used.

    Returns
    -------
    np.ndarray of shape (4, window_size), dtype float32.
    """
    seq = seq.upper()
    n = len(seq)

    # --- choose the window ---
    if n >= window_size:
        if center:
            start = (n - window_size) // 2
        else:
            max_start = n - window_size
            start = (rng or random).randint(0, max_start)
        seq = seq[start : start + window_size]
    # else: use full sequence; it will be padded below

    arr = np.zeros((4, window_size), dtype=np.float32)
    for i, base in enumerate(seq[:window_size]):
        idx = BASE_TO_IDX.get(base)
        if idx is not None:
            arr[idx, i] = 1.0

    return arr


def sequences_to_windows(
    sequences: List[str],
    window_size: int = WINDOW_SIZE,
    center: bool = False,
    seed: Optional[int] = None,
) -> np.ndarray:
    """
    Convert a list of DNA sequences to a (N, 4, window_size) float32 array.

    Parameters
    ----------
    sequences   : List of DNA strings.
    window_size : Window length passed to ``one_hot_encode``.
    center      : Use center windowing (for inference) vs random (for training).
    seed        : Optional seed for the random windowing RNG.

    Returns
    -------
    np.ndarray of shape (N, 4, window_size), dtype float32.
    """
    rng = random.Random(seed) if seed is not None else random.Random()
    arrays = [one_hot_encode(s, window_size=window_size, center=center, rng=rng) for s in sequences]
    return np.stack(arrays, axis=0)  # (N, 4, window_size)


# ---------------------------------------------------------------------------
# Network definition
# ---------------------------------------------------------------------------

class DNAConvNet(nn.Module):
    """3-layer 1D CNN for DNA watermark detection."""

    def __init__(self, window_size: int = WINDOW_SIZE):
        super().__init__()
        self.window_size = window_size

        self.conv1 = nn.Sequential(
            nn.Conv1d(4, 32, kernel_size=7, padding=3),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.MaxPool1d(2),
        )
        self.conv2 = nn.Sequential(
            nn.Conv1d(32, 64, kernel_size=5, padding=2),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.MaxPool1d(2),
        )
        self.conv3 = nn.Sequential(
            nn.Conv1d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm1d(128),
            nn.ReLU(),
        )
        self.global_pool = nn.AdaptiveAvgPool1d(1)
        self.classifier = nn.Sequential(
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 1),
            nn.Sigmoid(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Parameters
        ----------
        x : Tensor of shape (B, 4, L).

        Returns
        -------
        Tensor of shape (B,) with values in [0, 1].
        """
        x = self.conv1(x)
        x = self.conv2(x)
        x = self.conv3(x)
        x = self.global_pool(x).squeeze(-1)   # (B, 128)
        return self.classifier(x).squeeze(-1)  # (B,)


# ---------------------------------------------------------------------------
# Detector wrapper
# ---------------------------------------------------------------------------

class CNNDetector:
    """Wrapper for training, evaluating, and running inference with DNAConvNet."""

    def __init__(
        self,
        window_size: int = WINDOW_SIZE,
        device: Optional[str] = None,
    ):
        self.window_size = window_size
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        self.model = DNAConvNet(window_size).to(self.device)
        self.trained: bool = False

    # ------------------------------------------------------------------
    def _make_loader(
        self,
        native_seqs: List[str],
        watermarked_seqs: List[str],
        batch_size: int,
        shuffle: bool = True,
        center: bool = False,
        seed: Optional[int] = None,
    ) -> DataLoader:
        """Build a DataLoader from native + watermarked sequence lists."""
        X_native = sequences_to_windows(native_seqs, self.window_size, center=center, seed=seed)
        X_wm = sequences_to_windows(watermarked_seqs, self.window_size, center=center, seed=seed)

        X = np.vstack([X_native, X_wm])          # (N, 4, L)
        y = np.concatenate(
            [np.zeros(len(X_native), dtype=np.float32), np.ones(len(X_wm), dtype=np.float32)]
        )

        X_t = torch.from_numpy(X)
        y_t = torch.from_numpy(y)

        dataset = TensorDataset(X_t, y_t)
        return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle)

    # ------------------------------------------------------------------
    def fit(
        self,
        native_seqs: List[str],
        watermarked_seqs: List[str],
        epochs: int = 20,
        batch_size: int = 32,
        lr: float = 1e-3,
    ) -> dict:
        """
        Train on native (0) vs watermarked (1) sequences.

        Uses BCELoss + Adam optimizer with DataLoader batches.
        Returns a dict with per-epoch training history (loss, accuracy).
        """
        loader = self._make_loader(
            native_seqs, watermarked_seqs, batch_size=batch_size, shuffle=True, center=False
        )

        criterion = nn.BCELoss()
        optimizer = optim.Adam(self.model.parameters(), lr=lr)

        self.model.train()
        history: List[dict] = []

        for epoch in range(epochs):
            epoch_loss = 0.0
            correct = 0
            total = 0

            for X_batch, y_batch in loader:
                X_batch = X_batch.to(self.device)
                y_batch = y_batch.to(self.device)

                optimizer.zero_grad()
                preds = self.model(X_batch)             # (B,)
                loss = criterion(preds, y_batch)
                loss.backward()
                optimizer.step()

                epoch_loss += loss.item() * len(y_batch)
                correct += ((preds >= 0.5).float() == y_batch).sum().item()
                total += len(y_batch)

            avg_loss = epoch_loss / total
            acc = correct / total
            history.append({"epoch": epoch + 1, "loss": avg_loss, "accuracy": acc})
            print(f"    Epoch {epoch+1:>3}/{epochs}  loss={avg_loss:.4f}  acc={acc:.4f}")

        self.trained = True
        self.model.eval()
        return {"epochs": epochs, "history": history}

    # ------------------------------------------------------------------
    def predict_proba(self, sequences: List[str]) -> np.ndarray:
        """
        Return probability of class 1 (watermarked) for each sequence.

        Uses center windowing for deterministic inference.
        Returns array of shape (N,).
        """
        if not self.trained:
            raise RuntimeError("CNNDetector has not been trained yet. Call fit() first.")

        windows = sequences_to_windows(sequences, self.window_size, center=True)
        X_t = torch.from_numpy(windows).to(self.device)

        self.model.eval()
        with torch.no_grad():
            probas = self.model(X_t).cpu().numpy()  # (N,)

        return probas

    # ------------------------------------------------------------------
    def evaluate(
        self, native_seqs: List[str], watermarked_seqs: List[str]
    ) -> dict:
        """
        Evaluate on held-out native and watermarked sequences.

        Returns dict with keys: auc, accuracy.
        """
        all_seqs = native_seqs + watermarked_seqs
        y_true = np.concatenate(
            [np.zeros(len(native_seqs)), np.ones(len(watermarked_seqs))]
        )

        probas = self.predict_proba(all_seqs)
        auc = float(roc_auc_score(y_true, probas))
        preds = (probas >= 0.5).astype(int)
        acc = float(accuracy_score(y_true, preds))

        return {"auc": auc, "accuracy": acc}

    # ------------------------------------------------------------------
    def save(self, path: str) -> None:
        """Save model weights. NOT committed to git."""
        torch.save(self.model.state_dict(), path)

    def load(self, path: str) -> None:
        """Load model weights."""
        self.model.load_state_dict(torch.load(path, map_location=self.device))
        self.model.eval()
        self.trained = True
