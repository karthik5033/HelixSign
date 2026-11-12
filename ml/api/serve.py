"""
serve.py — HelixSign ML Inference Microservice (FastAPI)

Exposes 6 ML endpoints consumed by Person 2's Node.js / Next.js backend
at http://127.0.0.1:8000.

Run:
    cd ml
    uvicorn api.serve:app --host 127.0.0.1 --port 8000 --reload

Interactive docs: http://127.0.0.1:8000/docs
"""

import sys
import re
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Ensure the ml/ directory is on sys.path so genestamp_ml is importable when
# running with:  cd ml && uvicorn api.serve:app ...
# ---------------------------------------------------------------------------
_ML_ROOT = Path(__file__).resolve().parent.parent
if str(_ML_ROOT) not in sys.path:
    sys.path.insert(0, str(_ML_ROOT))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# ---------------------------------------------------------------------------
# Logger
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("helixsign.api")

# ---------------------------------------------------------------------------
# Lazy / graceful imports from genestamp_ml
# The package is built in parallel; if modules are absent we fall back to
# stubs so the API still starts and returns meaningful stub responses.
# ---------------------------------------------------------------------------

def _try_import(module_path: str, attr: Optional[str] = None):
    """Return the requested attr from module_path, or None on ImportError."""
    try:
        import importlib
        mod = importlib.import_module(module_path)
        return getattr(mod, attr) if attr else mod
    except Exception as exc:  # ImportError, ModuleNotFoundError, AttributeError
        logger.warning("Optional import failed (%s.%s): %s", module_path, attr, exc)
        return None


# bio helpers
load_codon_usage    = _try_import("genestamp_ml.bio", "load_codon_usage")
translate_seq       = _try_import("genestamp_ml.bio", "translate_seq")
sequence_stats      = _try_import("genestamp_ml.bio", "sequence_stats")
assert_protein_identity = _try_import("genestamp_ml.bio", "assert_protein_identity")

# core ML helpers
embed_bits          = _try_import("genestamp_ml.embed", "embed_bits")
find_eligible_positions = _try_import("genestamp_ml.embed", "find_eligible_positions")
extract_bits        = _try_import("genestamp_ml.extract", "extract_bits")
naive_encode        = _try_import("genestamp_ml.naive", "naive_encode")
simulate_channel    = _try_import("genestamp_ml.channel", "simulate_channel")

# detector classes
KmerXGBoostDetector = _try_import("genestamp_ml.detectors.kmer_detector", "KmerXGBoostDetector")
CNNDetector         = _try_import("genestamp_ml.detectors.cnn_detector", "CNNDetector")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_ARTIFACTS_DIR  = _ML_ROOT / "artifacts"
_DATA_DIR       = _ML_ROOT / "data"
_CODON_USAGE_FILE = _DATA_DIR / "codon_usage_ecoli.json"

# ---------------------------------------------------------------------------
# Application state (populated in lifespan)
# ---------------------------------------------------------------------------

class _AppState:
    codon_usage: Optional[Dict[str, Any]] = None
    kmer_detector: Optional[Any] = None
    cnn_detector: Optional[Any] = None
    ml_ready: bool = False


_state = _AppState()


def _load_detectors() -> None:
    """
    Attempt to load pre-trained detector weights from artifacts/.
    Logs a warning and sets detectors to None if weights are absent —
    /ml/detect will then return stub probabilities near 0.50.
    """
    kmer_path = _ARTIFACTS_DIR / "kmer_detector.pkl"
    cnn_path  = _ARTIFACTS_DIR / "cnn_detector.pt"

    if KmerXGBoostDetector is not None and kmer_path.exists():
        try:
            detector = KmerXGBoostDetector()
            detector.load(str(kmer_path))
            _state.kmer_detector = detector
            logger.info("Loaded k-mer XGBoost detector from %s", kmer_path)
        except Exception as exc:
            logger.warning("Could not load k-mer detector: %s — using stub", exc)
    else:
        logger.warning(
            "k-mer detector weights not found at %s or class unavailable — "
            "/ml/detect will return stub probabilities near 0.50.",
            kmer_path,
        )

    if CNNDetector is not None and cnn_path.exists():
        try:
            detector = CNNDetector()
            detector.load(str(cnn_path))
            _state.cnn_detector = detector
            logger.info("Loaded CNN detector from %s", cnn_path)
        except Exception as exc:
            logger.warning("Could not load CNN detector: %s — using stub", exc)
    else:
        logger.warning(
            "CNN detector weights not found at %s or class unavailable — "
            "/ml/detect will return stub probabilities near 0.50.",
            cnn_path,
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI 0.110+ lifespan context manager.

    Startup:
      - Load codon usage table once (expensive I/O, avoid per-request)
      - Attempt to load pre-trained detector weights from artifacts/

    Shutdown:
      - Nothing critical; log and exit cleanly.
    """
    # ---- STARTUP ----
    logger.info("HelixSign ML service starting up …")

    # Codon usage table
    if load_codon_usage is not None and _CODON_USAGE_FILE.exists():
        try:
            _state.codon_usage = load_codon_usage(str(_CODON_USAGE_FILE))
            logger.info("Codon usage table loaded from %s", _CODON_USAGE_FILE)
        except Exception as exc:
            logger.warning("Failed to load codon usage table: %s", exc)
    else:
        if not _CODON_USAGE_FILE.exists():
            logger.warning(
                "Codon usage file not found at %s — biological stats may be limited.",
                _CODON_USAGE_FILE,
            )
        else:
            logger.warning("load_codon_usage not available — biological stats may be limited.")

    _load_detectors()

    # Mark service ready
    _state.ml_ready = (
        load_codon_usage is not None
        and embed_bits is not None
        and extract_bits is not None
    )
    logger.info("ML ready = %s", _state.ml_ready)

    yield  # <-- app runs here

    # ---- SHUTDOWN ----
    logger.info("HelixSign ML service shutting down.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="HelixSign ML Inference API",
    description=(
        "Lightweight FastAPI microservice exposing HelixSign's DNA watermarking "
        "ML engine. Consumed by Person 2's Next.js backend at "
        "http://127.0.0.1:8000."
    ),
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Allow all origins for local development with Next.js on port 3000 / 3001
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Shared validation helpers
# ---------------------------------------------------------------------------

_VALID_DNA_RE = re.compile(r"^[ACGT]+$")


def _validate_sequence(seq: str, require_codon_multiple: bool = True) -> None:
    """
    Validate a raw DNA sequence string.

    Raises HTTP 400 if:
      - Sequence is empty
      - Contains characters other than A, C, G, T (uppercase)
      - Length is not divisible by 3 (when require_codon_multiple=True)
    """
    if not seq:
        raise HTTPException(status_code=400, detail="Sequence must be non-empty.")
    if not _VALID_DNA_RE.match(seq):
        raise HTTPException(
            status_code=400,
            detail=(
                "Sequence contains invalid characters. "
                "Only uppercase A, C, G, T are permitted."
            ),
        )
    if require_codon_multiple and len(seq) % 3 != 0:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Sequence length ({len(seq)} nt) is not divisible by 3. "
                "An open reading frame must be a multiple of 3 nucleotides."
            ),
        )


# ---------------------------------------------------------------------------
# Pydantic request / response models
# ---------------------------------------------------------------------------

# ----- /health -----

class HealthResponse(BaseModel):
    status: str = Field(..., description="Always 'ok' when the service is running.")
    version: str = Field(..., description="API version string.")
    mlReady: bool = Field(
        ...,
        description=(
            "True when all core genestamp_ml modules loaded successfully. "
            "False in stub/degraded mode."
        ),
    )


# ----- /ml/embed -----

class EmbedRequest(BaseModel):
    sequence: str = Field(
        ...,
        description="Uppercase ACGT coding sequence (length divisible by 3).",
        examples=["ATGGCCAAGCTGAAATAA"],
    )
    codewordBits: List[int] = Field(
        ...,
        description="Error-corrected codeword bits to embed. Each element must be 0 or 1.",
        examples=[[1, 0, 1, 1, 0]],
    )
    carrierPositions: List[int] = Field(
        ...,
        description=(
            "Zero-indexed codon positions designated as carriers. "
            "Must have len(carrierPositions) >= len(codewordBits)."
        ),
        examples=[[14, 28, 45, 62]],
    )
    host: str = Field(
        default="E. coli K-12",
        description="Host organism identifier used to select the codon usage table.",
        examples=["E. coli K-12"],
    )


class MutationRecord(BaseModel):
    codonIndex: int   = Field(..., description="Zero-indexed codon position that was mutated.")
    fromCodon:  str   = Field(..., description="Original codon triplet (e.g. 'GAA').")
    toCodon:    str   = Field(..., description="Replacement synonymous codon (e.g. 'GAG').")
    aminoAcid:  str   = Field(..., description="Amino acid encoded by both codons (e.g. 'E').")


class BioStats(BaseModel):
    gcBefore:          float = Field(..., description="GC content of original sequence (%).")
    gcAfter:           float = Field(..., description="GC content of stamped sequence (%).")
    gcDelta:           float = Field(..., description="abs(gcAfter - gcBefore).")
    caiSimilarity:     float = Field(..., description="Codon Adaptation Index similarity score [0–1].")
    longestHomopolymer: int  = Field(..., description="Longest homopolymer run in stamped sequence.")


class EmbedResponse(BaseModel):
    stampedSequence:    str               = Field(..., description="Watermarked DNA sequence.")
    proteinTranslation: str               = Field(..., description="Protein translation of the stamped sequence.")
    proteinIdentical:   bool              = Field(..., description="True if protein identity is maintained (always true for valid output).")
    mutations:          List[MutationRecord] = Field(..., description="List of synonymous codon substitutions applied.")
    bioStats:           BioStats          = Field(..., description="Biological quality metrics.")


# ----- /ml/extract -----

class ExtractRequest(BaseModel):
    sequence: str = Field(
        ...,
        description="Uppercase ACGT sequence to extract watermark from.",
    )
    carrierPositions: List[int] = Field(
        ...,
        description="Zero-indexed codon positions to inspect for watermark bits.",
        examples=[[14, 28, 45, 62]],
    )
    host: str = Field(
        default="E. coli K-12",
        description="Host organism identifier (must match the one used during embedding).",
    )


class ExtractResponse(BaseModel):
    bitEstimates: List[int] = Field(
        ...,
        description="Hard-decision bit estimates extracted from carrier codons (0 or 1).",
    )
    confidences: List[float] = Field(
        ...,
        description="Soft confidence scores for each bit estimate in [0, 1].",
    )


# ----- /ml/detect -----

class DetectRequest(BaseModel):
    sequence: str = Field(
        ...,
        description="Uppercase ACGT DNA sequence to test for synthetic watermarks.",
    )


class DetectResponse(BaseModel):
    kmerProbability: float = Field(
        ...,
        description=(
            "Probability that the sequence is synthetic according to the k-mer "
            "XGBoost classifier. Values near 0.50 indicate chance level (stealth)."
        ),
    )
    cnnProbability: float = Field(
        ...,
        description=(
            "Probability that the sequence is synthetic according to the 1D CNN "
            "detector. Values near 0.50 indicate chance level (stealth)."
        ),
    )


# ----- /ml/naive-encode -----

class NaiveEncodeRequest(BaseModel):
    sequence: str = Field(
        ...,
        description="Original uppercase ACGT coding sequence.",
    )
    payloadBits: List[int] = Field(
        ...,
        description="Raw payload bits to encode naively (0 or 1 each).",
        examples=[[1, 0, 1]],
    )


class NaiveEncodeResponse(BaseModel):
    naiveSequence: str = Field(
        ...,
        description=(
            "Naively watermarked DNA sequence. This baseline is intentionally "
            "detectable (AUC ~ 0.99–1.00) and used only for stealth benchmarking."
        ),
    )


# ----- /ml/channel -----

class ChannelRequest(BaseModel):
    sequence: str = Field(
        ...,
        description="Uppercase ACGT DNA sequence to corrupt with channel noise.",
    )
    substitutionRate: float = Field(
        default=0.02,
        ge=0.0,
        le=0.2,
        description="Per-base substitution probability (transitions preferred over transversions).",
    )
    indelRate: float = Field(
        default=0.005,
        ge=0.0,
        le=0.05,
        description="Per-base insertion or deletion probability.",
    )
    seed: Optional[int] = Field(
        default=None,
        description="Random seed for reproducible noise simulation.",
    )


class ChannelResponse(BaseModel):
    noisySequence:    str = Field(..., description="Sequence after simulated channel noise is applied.")
    mutationsApplied: int = Field(..., description="Total number of substitutions and indels introduced.")


# ----- /ml/codon-usage -----

class CodonUsageResponse(BaseModel):
    host: str = Field(..., description="Host organism the table belongs to.")
    totalCodons: int = Field(..., description="Total number of codons in the table.")
    topCodonsPerAA: Dict[str, Any] = Field(
        ...,
        description=(
            "Mapping from amino acid single-letter code to its top synonymous codons "
            "with relative frequency, e.g. {'E': [{'codon': 'GAA', 'freq': 0.68}, ...]}."
        ),
    )


# ---------------------------------------------------------------------------
# Internal helper: compute bio stats
# ---------------------------------------------------------------------------

def _gc_content(seq: str) -> float:
    """Return GC content as a percentage rounded to 1 decimal place."""
    if not seq:
        return 0.0
    gc = sum(1 for b in seq if b in "GC")
    return round(gc / len(seq) * 100, 1)


def _longest_homopolymer(seq: str) -> int:
    """Return the length of the longest homopolymer run in *seq*."""
    if not seq:
        return 0
    max_run = current_run = 1
    for i in range(1, len(seq)):
        if seq[i] == seq[i - 1]:
            current_run += 1
            if current_run > max_run:
                max_run = current_run
        else:
            current_run = 1
    return max_run


def _stub_cai_similarity(original: str, stamped: str) -> float:
    """
    Approximate CAI similarity when the full genestamp_ml.bio module is not
    yet available.  Defined as 1 - (number of differing codons / total codons).
    """
    if len(original) != len(stamped) or len(original) % 3 != 0:
        return 0.0
    n_codons = len(original) // 3
    if n_codons == 0:
        return 1.0
    diffs = sum(
        1
        for i in range(n_codons)
        if original[i * 3: i * 3 + 3] != stamped[i * 3: i * 3 + 3]
    )
    return round(1.0 - diffs / n_codons, 4)


def _compute_bio_stats(original: str, stamped: str) -> BioStats:
    """
    Compute biological quality statistics.

    Prefers calling genestamp_ml.bio.sequence_stats() when available;
    falls back to pure-Python implementations.
    """
    gc_before = _gc_content(original)
    gc_after  = _gc_content(stamped)
    gc_delta  = round(abs(gc_after - gc_before), 2)
    longest_hp = _longest_homopolymer(stamped)

    if sequence_stats is not None:
        try:
            stats = sequence_stats(original, stamped, _state.codon_usage)
            return BioStats(
                gcBefore=stats.get("gc_before", gc_before),
                gcAfter=stats.get("gc_after", gc_after),
                gcDelta=round(abs(stats.get("gc_after", gc_after) - stats.get("gc_before", gc_before)), 2),
                caiSimilarity=stats.get("cai_similarity", _stub_cai_similarity(original, stamped)),
                longestHomopolymer=stats.get("longest_homopolymer", longest_hp),
            )
        except Exception as exc:
            logger.warning("sequence_stats() raised an error (%s); using fallback stats.", exc)

    cai_sim = _stub_cai_similarity(original, stamped)
    return BioStats(
        gcBefore=gc_before,
        gcAfter=gc_after,
        gcDelta=gc_delta,
        caiSimilarity=cai_sim,
        longestHomopolymer=longest_hp,
    )


def _translate_stub(seq: str) -> str:
    """
    Fallback codon table translation (NCBI Translation Table 11 — standard bacterial).
    Returns a string ending with '*' for stop codons.
    """
    CODON_TABLE: Dict[str, str] = {
        "TTT": "F", "TTC": "F", "TTA": "L", "TTG": "L",
        "CTT": "L", "CTC": "L", "CTA": "L", "CTG": "L",
        "ATT": "I", "ATC": "I", "ATA": "I", "ATG": "M",
        "GTT": "V", "GTC": "V", "GTA": "V", "GTG": "V",
        "TCT": "S", "TCC": "S", "TCA": "S", "TCG": "S",
        "CCT": "P", "CCC": "P", "CCA": "P", "CCG": "P",
        "ACT": "T", "ACC": "T", "ACA": "T", "ACG": "T",
        "GCT": "A", "GCC": "A", "GCA": "A", "GCG": "A",
        "TAT": "Y", "TAC": "Y", "TAA": "*", "TAG": "*",
        "CAT": "H", "CAC": "H", "CAA": "Q", "CAG": "Q",
        "AAT": "N", "AAC": "N", "AAA": "K", "AAG": "K",
        "GAT": "D", "GAC": "D", "GAA": "E", "GAG": "E",
        "TGT": "C", "TGC": "C", "TGA": "*", "TGG": "W",
        "CGT": "R", "CGC": "R", "CGA": "R", "CGG": "R",
        "AGT": "S", "AGC": "S", "AGA": "R", "AGG": "R",
        "GGT": "G", "GGC": "G", "GGA": "G", "GGG": "G",
    }
    protein = []
    for i in range(0, len(seq) - 2, 3):
        codon = seq[i: i + 3]
        aa = CODON_TABLE.get(codon, "X")
        protein.append(aa)
        if aa == "*":
            break
    return "".join(protein)


def _do_translate(seq: str) -> str:
    """Translate *seq* using genestamp_ml.bio.translate_seq or the stub."""
    if translate_seq is not None:
        try:
            return translate_seq(seq)
        except Exception as exc:
            logger.warning("translate_seq() raised %s — using built-in fallback.", exc)
    return _translate_stub(seq)


# ---------------------------------------------------------------------------
# Stub embedder — used when genestamp_ml.embed is not yet available
# ---------------------------------------------------------------------------

def _stub_embed(
    sequence: str,
    codeword_bits: List[int],
    carrier_positions: List[int],
) -> Tuple[str, List[MutationRecord]]:
    """
    Minimal rule-based synonymous embedder used when genestamp_ml is absent.

    Bit 0 → keep highest-frequency synonym (identity — no change needed here
    since we have no codon table, we keep the codon as-is).
    Bit 1 → rotate to the next synonymous codon alphabetically within a fixed
    per-amino-acid synonym set derived from NCBI Table 11.

    Returns (stamped_sequence, list_of_mutation_records).
    """
    # Minimal synonym groups (amino acid → sorted list of synonymous codons)
    SYNONYMS: Dict[str, List[str]] = {
        "F": ["TTC", "TTT"],
        "L": ["CTA", "CTC", "CTG", "CTT", "TTA", "TTG"],
        "I": ["ATA", "ATC", "ATT"],
        "V": ["GTA", "GTC", "GTG", "GTT"],
        "S": ["AGC", "AGT", "TCA", "TCC", "TCG", "TCT"],
        "P": ["CCA", "CCC", "CCG", "CCT"],
        "T": ["ACA", "ACC", "ACG", "ACT"],
        "A": ["GCA", "GCC", "GCG", "GCT"],
        "Y": ["TAC", "TAT"],
        "H": ["CAC", "CAT"],
        "Q": ["CAA", "CAG"],
        "N": ["AAC", "AAT"],
        "K": ["AAA", "AAG"],
        "D": ["GAC", "GAT"],
        "E": ["GAA", "GAG"],
        "C": ["TGC", "TGT"],
        "R": ["AGA", "AGG", "CGA", "CGC", "CGG", "CGT"],
        "G": ["GGA", "GGC", "GGG", "GGT"],
        # Single-codon AAs — cannot carry bits
        "M": ["ATG"],
        "W": ["TGG"],
        "*": ["TAA", "TAG", "TGA"],
    }
    # Reverse lookup: codon → amino acid
    CODON_TO_AA: Dict[str, str] = {
        c: aa for aa, codons in SYNONYMS.items() for c in codons
    }

    seq_list = list(sequence)
    mutations: List[MutationRecord] = []

    for bit_idx, (bit, pos) in enumerate(zip(codeword_bits, carrier_positions)):
        start = pos * 3
        if start + 3 > len(seq_list):
            logger.warning("Carrier position %d is out of range; skipping.", pos)
            continue
        from_codon = "".join(seq_list[start: start + 3])
        aa = CODON_TO_AA.get(from_codon, "X")
        synonyms = SYNONYMS.get(aa, [])

        if len(synonyms) < 2:
            # Met, Trp, unknown — cannot embed bit here
            continue

        # Sort synonyms for determinism; index 0 = bit-0, index 1 = bit-1
        synonyms_sorted = sorted(synonyms)
        to_codon = synonyms_sorted[bit % len(synonyms_sorted)]

        if to_codon != from_codon:
            seq_list[start: start + 3] = list(to_codon)
            mutations.append(
                MutationRecord(
                    codonIndex=pos,
                    fromCodon=from_codon,
                    toCodon=to_codon,
                    aminoAcid=aa,
                )
            )

    return "".join(seq_list), mutations


def _stub_extract(
    sequence: str,
    carrier_positions: List[int],
) -> Tuple[List[int], List[float]]:
    """
    Minimal extractor stub: reads codon at each carrier position and maps it
    to bit 0 (index 0 in sorted synonym list) or bit 1 (index 1+).
    """
    SYNONYMS: Dict[str, List[str]] = {
        "F": ["TTC", "TTT"], "L": ["CTA", "CTC", "CTG", "CTT", "TTA", "TTG"],
        "I": ["ATA", "ATC", "ATT"], "V": ["GTA", "GTC", "GTG", "GTT"],
        "S": ["AGC", "AGT", "TCA", "TCC", "TCG", "TCT"],
        "P": ["CCA", "CCC", "CCG", "CCT"], "T": ["ACA", "ACC", "ACG", "ACT"],
        "A": ["GCA", "GCC", "GCG", "GCT"], "Y": ["TAC", "TAT"],
        "H": ["CAC", "CAT"], "Q": ["CAA", "CAG"], "N": ["AAC", "AAT"],
        "K": ["AAA", "AAG"], "D": ["GAC", "GAT"], "E": ["GAA", "GAG"],
        "C": ["TGC", "TGT"], "R": ["AGA", "AGG", "CGA", "CGC", "CGG", "CGT"],
        "G": ["GGA", "GGC", "GGG", "GGT"],
        "M": ["ATG"], "W": ["TGG"], "*": ["TAA", "TAG", "TGA"],
    }
    CODON_TO_AA: Dict[str, str] = {
        c: aa for aa, codons in SYNONYMS.items() for c in codons
    }

    bit_estimates: List[int]   = []
    confidences:   List[float] = []

    for pos in carrier_positions:
        start = pos * 3
        if start + 3 > len(sequence):
            bit_estimates.append(0)
            confidences.append(0.5)
            continue
        codon = sequence[start: start + 3]
        aa = CODON_TO_AA.get(codon, "X")
        synonyms_sorted = sorted(SYNONYMS.get(aa, [codon]))
        try:
            idx = synonyms_sorted.index(codon)
        except ValueError:
            idx = 0
        bit = 0 if idx == 0 else 1
        bit_estimates.append(bit)
        confidences.append(0.99 if len(synonyms_sorted) >= 2 else 0.5)

    return bit_estimates, confidences


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check() -> HealthResponse:
    """
    Liveness / readiness probe.

    Returns `mlReady: true` when all core genestamp_ml modules are importable
    and the codon usage table was loaded successfully.
    """
    return HealthResponse(
        status="ok",
        version=app.version,
        mlReady=_state.ml_ready,
    )


@app.post(
    "/ml/embed",
    response_model=EmbedResponse,
    tags=["Watermarking"],
    summary="Embed watermark bits into a coding sequence via synonymous codon substitution.",
)
async def embed_endpoint(req: EmbedRequest) -> EmbedResponse:
    """
    Embed `codewordBits` into `sequence` at the specified `carrierPositions`
    using synonymous codon substitution.

    **Guarantees:**
    - The translated amino acid sequence is identical before and after embedding.
    - Returned `bioStats.gcDelta` is `abs(gcAfter - gcBefore)`.

    **Errors:**
    - `400` — Sequence is invalid (non-ACGT chars, not divisible by 3, empty).
    - `422` — Protein identity could not be maintained after embedding.
    """
    seq = req.sequence.strip().upper()
    _validate_sequence(seq, require_codon_multiple=True)

    if not req.codewordBits:
        raise HTTPException(status_code=400, detail="codewordBits must be non-empty.")
    if not req.carrierPositions:
        raise HTTPException(status_code=400, detail="carrierPositions must be non-empty.")
    if any(b not in (0, 1) for b in req.codewordBits):
        raise HTTPException(status_code=400, detail="All codewordBits must be 0 or 1.")
    if len(req.carrierPositions) < len(req.codewordBits):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Need at least {len(req.codewordBits)} carrier positions "
                f"for {len(req.codewordBits)} bits; got {len(req.carrierPositions)}."
            ),
        )

    # ----- Embed -----
    if embed_bits is not None:
        try:
            result = embed_bits(
                dna=seq,
                bits=req.codewordBits,
                carrier_positions=req.carrierPositions,
                codon_usage=_state.codon_usage,
            )
            # Expect result to be (stamped_seq, mutations_list) or a dict
            if isinstance(result, tuple):
                stamped_seq, raw_mutations = result
            elif isinstance(result, dict):
                stamped_seq    = result["stamped_sequence"]
                raw_mutations  = result.get("mutations", [])
            else:
                raise ValueError(f"Unexpected return type from embed_bits: {type(result)}")

            # Normalise mutations to MutationRecord
            mutations: List[MutationRecord] = []
            for m in raw_mutations:
                if isinstance(m, dict):
                    mutations.append(MutationRecord(**m))
                elif hasattr(m, "__dict__"):
                    mutations.append(MutationRecord(**m.__dict__))
                else:
                    mutations.append(m)

        except AssertionError as exc:
            # Protein identity violated — surfaces as HTTP 422
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Protein identity violated during embedding: {exc}. "
                    "The embedded sequence does not translate to the same amino acid sequence."
                ),
            )
        except Exception as exc:
            logger.error("embed_bits() error: %s", exc, exc_info=True)
            raise HTTPException(status_code=500, detail=f"Embedding failed: {exc}")
    else:
        # Fallback stub embedder
        logger.info("genestamp_ml.embed not available — using stub embedder.")
        try:
            stamped_seq, mutations = _stub_embed(seq, req.codewordBits, req.carrierPositions)
        except AssertionError as exc:
            raise HTTPException(
                status_code=422,
                detail=f"Protein identity violated during stub embedding: {exc}",
            )

    stamped_seq = stamped_seq.upper()

    # ----- Protein identity check -----
    orig_protein    = _do_translate(seq)
    stamped_protein = _do_translate(stamped_seq)

    if assert_protein_identity is not None:
        try:
            assert_protein_identity(seq, stamped_seq)
            protein_identical = True
        except AssertionError as exc:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Protein identity assertion failed after embedding: {exc}"
                ),
            )
    else:
        protein_identical = orig_protein == stamped_protein
        if not protein_identical:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Protein identity violated: original and stamped sequences "
                    "translate to different amino acid sequences."
                ),
            )

    # ----- Bio stats -----
    bio_stats = _compute_bio_stats(seq, stamped_seq)

    return EmbedResponse(
        stampedSequence=stamped_seq,
        proteinTranslation=stamped_protein,
        proteinIdentical=protein_identical,
        mutations=mutations,
        bioStats=bio_stats,
    )


@app.post(
    "/ml/extract",
    response_model=ExtractResponse,
    tags=["Watermarking"],
    summary="Extract watermark bits from a previously stamped sequence.",
)
async def extract_endpoint(req: ExtractRequest) -> ExtractResponse:
    """
    Extract soft bit estimates from a watermarked sequence at `carrierPositions`.

    Returns:
    - `bitEstimates`: Hard-decision bits (0 or 1).
    - `confidences`:  Soft confidence scores in [0, 1].
    """
    seq = req.sequence.strip().upper()
    _validate_sequence(seq, require_codon_multiple=True)

    if not req.carrierPositions:
        raise HTTPException(status_code=400, detail="carrierPositions must be non-empty.")

    if extract_bits is not None:
        try:
            result = extract_bits(
                dna=seq,
                carrier_positions=req.carrierPositions,
                codon_usage=_state.codon_usage,
            )
            if isinstance(result, tuple):
                bit_estimates, confidences = result
            elif isinstance(result, dict):
                bit_estimates = result["bit_estimates"]
                confidences   = result["confidences"]
            else:
                raise ValueError(f"Unexpected return type from extract_bits: {type(result)}")
        except Exception as exc:
            logger.error("extract_bits() error: %s", exc, exc_info=True)
            raise HTTPException(status_code=500, detail=f"Extraction failed: {exc}")
    else:
        logger.info("genestamp_ml.extract not available — using stub extractor.")
        bit_estimates, confidences = _stub_extract(seq, req.carrierPositions)

    return ExtractResponse(bitEstimates=bit_estimates, confidences=confidences)


@app.post(
    "/ml/detect",
    response_model=DetectResponse,
    tags=["Detection"],
    summary="Score a sequence for synthetic watermark presence using k-mer and CNN detectors.",
)
async def detect_endpoint(req: DetectRequest) -> DetectResponse:
    """
    Run both trained detectors on the input sequence.

    - `kmerProbability`: k-mer XGBoost classifier score.
    - `cnnProbability`:  1D CNN detector score.

    Values near **0.50** indicate the sequence is indistinguishable from native
    *E. coli* CDS (stealth success).  Values near **1.0** indicate a detectable
    synthetic watermark.

    If pre-trained model weights are absent, stub probabilities near 0.50 are
    returned with a warning log — the service does **not** crash.
    """
    seq = req.sequence.strip().upper()
    # Sequence doesn't have to be codon-aligned for detection
    _validate_sequence(seq, require_codon_multiple=False)

    kmer_prob = 0.50
    cnn_prob  = 0.50

    if _state.kmer_detector is not None:
        try:
            preds = _state.kmer_detector.predict_proba([seq])
            kmer_prob = float(preds[0])
        except Exception as exc:
            logger.warning("k-mer detector inference failed (%s) — returning stub 0.50.", exc)
            kmer_prob = 0.50
    else:
        logger.debug("k-mer detector not loaded; returning stub probability 0.50.")

    if _state.cnn_detector is not None:
        try:
            preds = _state.cnn_detector.predict_proba([seq])
            cnn_prob = float(preds[0])
        except Exception as exc:
            logger.warning("CNN detector inference failed (%s) — returning stub 0.50.", exc)
            cnn_prob = 0.50
    else:
        logger.debug("CNN detector not loaded; returning stub probability 0.50.")

    return DetectResponse(kmerProbability=round(kmer_prob, 4), cnnProbability=round(cnn_prob, 4))


@app.post(
    "/ml/naive-encode",
    response_model=NaiveEncodeResponse,
    tags=["Watermarking"],
    summary="Naively encode a payload into a sequence (detectable baseline for stealth benchmarking).",
)
async def naive_encode_endpoint(req: NaiveEncodeRequest) -> NaiveEncodeResponse:
    """
    Apply a naive (non-stealth) watermark encoding to the input sequence.

    This baseline is intentionally **easy to detect** (detector AUC ~ 0.99–1.00)
    and is provided only as a reference point for stealth evaluation.
    """
    seq = req.sequence.strip().upper()
    _validate_sequence(seq, require_codon_multiple=True)

    if not req.payloadBits:
        raise HTTPException(status_code=400, detail="payloadBits must be non-empty.")
    if any(b not in (0, 1) for b in req.payloadBits):
        raise HTTPException(status_code=400, detail="All payloadBits must be 0 or 1.")

    if naive_encode is not None:
        try:
            result = naive_encode(dna=seq, payload_bits=req.payloadBits, codon_usage=_state.codon_usage)
            naive_seq = result if isinstance(result, str) else result.get("naive_sequence", result)
        except Exception as exc:
            logger.error("naive_encode() error: %s", exc, exc_info=True)
            raise HTTPException(status_code=500, detail=f"Naive encoding failed: {exc}")
    else:
        # Minimal stub: flip the base at every bit-1 position from the 5' end.
        logger.info("genestamp_ml.naive not available — using stub naive encoder.")
        FLIP: Dict[str, str] = {"A": "T", "T": "A", "G": "C", "C": "G"}
        seq_list = list(seq)
        for i, bit in enumerate(req.payloadBits):
            if bit == 1 and i < len(seq_list):
                seq_list[i] = FLIP.get(seq_list[i], seq_list[i])
        naive_seq = "".join(seq_list)

    return NaiveEncodeResponse(naiveSequence=naive_seq.upper())


@app.post(
    "/ml/channel",
    response_model=ChannelResponse,
    tags=["Simulation"],
    summary="Simulate biological channel noise (substitutions and indels) on a DNA sequence.",
)
async def channel_endpoint(req: ChannelRequest) -> ChannelResponse:
    """
    Apply simulated sequencing / evolutionary noise to `sequence`.

    - **Substitutions:** Transitions (A↔G, C↔T) are preferred over transversions.
    - **Indels:** Random single-base insertions or deletions.
    - Accepts an optional `seed` for reproducibility.
    """
    seq = req.sequence.strip().upper()
    _validate_sequence(seq, require_codon_multiple=False)

    if simulate_channel is not None:
        try:
            result = simulate_channel(
                seq=seq,
                substitution_rate=req.substitutionRate,
                indel_rate=req.indelRate,
                seed=req.seed,
            )
            if isinstance(result, tuple):
                noisy_seq, n_mutations = result
            elif isinstance(result, dict):
                noisy_seq   = result.get("noisySequence", result.get("noisy_sequence"))
                n_mutations = result.get("mutationsApplied", result.get("mutations_applied", 0))
            else:
                raise ValueError(f"Unexpected return type from simulate_channel: {type(result)}")
        except Exception as exc:
            logger.error("simulate_channel() error: %s", exc, exc_info=True)
            raise HTTPException(status_code=500, detail=f"Channel simulation failed: {exc}")
    else:
        # Pure-Python stub channel simulator
        logger.info("genestamp_ml.channel not available — using stub channel simulator.")
        import random
        rng = random.Random(req.seed)

        TRANSITIONS: Dict[str, str] = {"A": "G", "G": "A", "C": "T", "T": "C"}
        TRANSVERSIONS: Dict[str, List[str]] = {
            "A": ["C", "T"], "G": ["C", "T"], "C": ["A", "G"], "T": ["A", "G"]
        }

        seq_list    = list(seq)
        n_mutations = 0

        # Substitutions (apply before indels to keep indices stable)
        for i in range(len(seq_list)):
            if rng.random() < req.substitutionRate:
                base = seq_list[i]
                # 2/3 chance of transition, 1/3 transversion
                if rng.random() < 2 / 3:
                    seq_list[i] = TRANSITIONS.get(base, base)
                else:
                    choices = TRANSVERSIONS.get(base, [base])
                    seq_list[i] = rng.choice(choices)
                n_mutations += 1

        # Indels (process in reverse to keep index math simple)
        indel_indices = [
            i for i in range(len(seq_list)) if rng.random() < req.indelRate
        ]
        for i in reversed(indel_indices):
            if rng.random() < 0.5:
                # Insertion
                seq_list.insert(i, rng.choice(["A", "C", "G", "T"]))
            else:
                # Deletion
                if seq_list:
                    seq_list.pop(i)
            n_mutations += 1

        noisy_seq = "".join(seq_list).upper()

    return ChannelResponse(noisySequence=noisy_seq, mutationsApplied=n_mutations)


@app.get(
    "/ml/codon-usage",
    response_model=CodonUsageResponse,
    tags=["Utilities"],
    summary="Return a summary of the loaded codon usage table (top codons per amino acid).",
)
async def codon_usage_endpoint() -> CodonUsageResponse:
    """
    Returns a human-readable summary of the codon usage table loaded at startup.

    Useful for debugging host selection and verifying the loaded frequencies
    match the target organism (*E. coli* K-12 MG1655).
    """
    if _state.codon_usage is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Codon usage table is not loaded. "
                "Ensure data/codon_usage_ecoli.json exists and was loaded at startup."
            ),
        )

    table = _state.codon_usage

    # Build top codons per amino acid (up to 3 entries each, sorted by frequency desc)
    # Supports two common codon table formats:
    #   Format A: { codon: {"aa": "E", "freq": 0.68, ...}, ... }
    #   Format B: { aa: { codon: freq, ... }, ... }

    top_per_aa: Dict[str, List[Dict[str, Any]]] = {}
    total_codons = 0

    # Detect format
    sample_val = next(iter(table.values())) if table else None

    if isinstance(sample_val, dict) and ("aa" in sample_val or "amino_acid" in sample_val):
        # Format A: codon → {amino_acid/aa, freq/frequency, ...}
        from collections import defaultdict
        grouped: Dict[str, List[Tuple[str, float]]] = defaultdict(list)
        for codon, info in table.items():
            aa   = info.get("amino_acid", info.get("aa", "?"))
            freq = float(info.get("rscu", info.get("frequency", info.get("freq", 0.0))))
            grouped[aa].append((codon, freq))
            total_codons += 1
        for aa, entries in grouped.items():
            entries_sorted = sorted(entries, key=lambda x: x[1], reverse=True)
            top_per_aa[aa] = [
                {"codon": c, "freq": round(f, 4)} for c, f in entries_sorted[:3]
            ]
    elif isinstance(sample_val, dict):
        # Format B: aa → { codon: freq, ... }
        for aa, codon_map in table.items():
            if isinstance(codon_map, dict):
                entries_sorted = sorted(codon_map.items(), key=lambda x: float(x[1]) if isinstance(x[1], (int, float, str)) and str(x[1]).replace('.', '', 1).isdigit() else 0.0, reverse=True)
                top_per_aa[aa] = [
                    {"codon": c, "freq": round(float(f), 4) if isinstance(f, (int, float)) else 0.0}
                    for c, f in entries_sorted[:3]
                ]
                total_codons += len(codon_map)
    else:
        # Unknown format — return raw summary
        total_codons = len(table)
        top_per_aa   = {"raw": [{"note": "Unrecognised codon table format."}]}

    return CodonUsageResponse(
        host="E. coli K-12",
        totalCodons=total_codons,
        topCodonsPerAA=top_per_aa,
    )


# ---------------------------------------------------------------------------
# Entry point (direct execution)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(
        "api.serve:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info",
    )
