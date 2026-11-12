"""
test_api.py — End-to-end tests for all 7 FastAPI endpoints.

Uses FastAPI's TestClient with the full lifespan context so the codon
table and detectors are loaded exactly as in production.
"""
import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from api.serve import app


@pytest.fixture(scope="module")
def client():
    """Module-scoped client that runs the full lifespan (startup + shutdown)."""
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


# ---------------------------------------------------------------------------
# Test sequences
# ---------------------------------------------------------------------------

# 51-nt valid CDS (17 codons incl. stop)
VALID_SEQ = "ATGGCGGAACTGCGTCCGACGTATGGTGCAGACGAATTTCTTAAGCGGTAA"
# Same length but invalid base (U not allowed)
INVALID_DNA = "AUGCAGCUGAAUGCAGCUGAAUGCAGCUGAAUGCAGCUGAAUGCAGCUGAA"
# Not divisible by 3 (5 nt)
WRONG_LENGTH = "ATGGC"
# Empty
EMPTY_SEQ = ""

# Two carrier positions within VALID_SEQ (codons 1 and 2: GCG, GAA)
CARRIERS = [1, 2]
BITS = [0, 1]


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

def test_health_status_ok(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_health_has_version(client):
    assert "version" in client.get("/health").json()


def test_health_has_mlReady(client):
    assert "mlReady" in client.get("/health").json()


def test_health_has_services(client):
    data = client.get("/health").json()
    assert "services" in data, "health must expose 'services' breakdown"
    for key in ("bioEngine", "kmerDetectorLoaded", "cnnDetectorLoaded", "codonUsageLoaded"):
        assert key in data["services"], f"Missing service key: {key}"


def test_health_mlReady_matches_services(client):
    data = client.get("/health").json()
    svc = data.get("services", {})
    all_up = all(svc.get(k) for k in
                 ("bioEngine", "kmerDetectorLoaded", "cnnDetectorLoaded", "codonUsageLoaded"))
    assert data["mlReady"] == all_up, (
        f"mlReady={data['mlReady']} but service states={svc}"
    )


# ---------------------------------------------------------------------------
# POST /ml/embed
# ---------------------------------------------------------------------------

def test_embed_valid(client):
    r = client.post("/ml/embed", json={
        "sequence": VALID_SEQ,
        "codewordBits": BITS,
        "carrierPositions": CARRIERS,
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert "stampedSequence" in data
    assert data["proteinIdentical"] is True
    assert len(data["stampedSequence"]) == len(VALID_SEQ)


def test_embed_empty_sequence_400(client):
    r = client.post("/ml/embed", json={
        "sequence": EMPTY_SEQ, "codewordBits": BITS, "carrierPositions": CARRIERS,
    })
    assert r.status_code == 400


def test_embed_invalid_dna_400(client):
    r = client.post("/ml/embed", json={
        "sequence": INVALID_DNA, "codewordBits": BITS, "carrierPositions": CARRIERS,
    })
    assert r.status_code == 400


def test_embed_not_multiple_of_3_400(client):
    r = client.post("/ml/embed", json={
        "sequence": WRONG_LENGTH, "codewordBits": [0], "carrierPositions": [0],
    })
    assert r.status_code == 400


def test_embed_too_few_carriers_400(client):
    r = client.post("/ml/embed", json={
        "sequence": VALID_SEQ,
        "codewordBits": [0, 1, 0],
        "carrierPositions": [0],  # only 1 carrier for 3 bits
    })
    assert r.status_code == 400


def test_embed_invalid_bit_values_400(client):
    r = client.post("/ml/embed", json={
        "sequence": VALID_SEQ, "codewordBits": [0, 2], "carrierPositions": CARRIERS,
    })
    assert r.status_code == 400


def test_embed_bio_stats_present(client):
    r = client.post("/ml/embed", json={
        "sequence": VALID_SEQ, "codewordBits": BITS, "carrierPositions": CARRIERS,
    })
    assert r.status_code == 200, r.text
    bio = r.json().get("bioStats", {})
    for field in ("gcBefore", "gcAfter", "gcDelta", "caiSimilarity", "longestHomopolymer"):
        assert field in bio, f"Missing bioStats field: {field}"


# ---------------------------------------------------------------------------
# POST /ml/extract
# ---------------------------------------------------------------------------

def test_extract_valid(client):
    embed_r = client.post("/ml/embed", json={
        "sequence": VALID_SEQ, "codewordBits": BITS, "carrierPositions": CARRIERS,
    })
    assert embed_r.status_code == 200, embed_r.text
    stamped = embed_r.json()["stampedSequence"]

    r = client.post("/ml/extract", json={
        "sequence": stamped, "carrierPositions": CARRIERS,
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert "bitEstimates" in data
    assert "confidences" in data
    assert len(data["bitEstimates"]) == len(CARRIERS)


def test_extract_empty_sequence_400(client):
    r = client.post("/ml/extract", json={
        "sequence": EMPTY_SEQ, "carrierPositions": CARRIERS,
    })
    assert r.status_code == 400


def test_extract_roundtrip_correctness(client):
    embed_r = client.post("/ml/embed", json={
        "sequence": VALID_SEQ, "codewordBits": BITS, "carrierPositions": CARRIERS,
    })
    assert embed_r.status_code == 200, embed_r.text
    stamped = embed_r.json()["stampedSequence"]

    extract_r = client.post("/ml/extract", json={
        "sequence": stamped, "carrierPositions": CARRIERS,
    })
    assert extract_r.status_code == 200, extract_r.text
    recovered = extract_r.json()["bitEstimates"]
    assert recovered == BITS, (
        f"Round-trip failed: embedded={BITS}, recovered={recovered}"
    )


# ---------------------------------------------------------------------------
# POST /ml/detect
# ---------------------------------------------------------------------------

def test_detect_valid(client):
    r = client.post("/ml/detect", json={"sequence": VALID_SEQ})
    assert r.status_code in (200, 503), r.text


def test_detect_200_has_probabilities(client):
    r = client.post("/ml/detect", json={"sequence": VALID_SEQ})
    if r.status_code == 200:
        data = r.json()
        assert "kmerProbability" in data
        assert "cnnProbability" in data
        assert 0.0 <= data["kmerProbability"] <= 1.0
        assert 0.0 <= data["cnnProbability"] <= 1.0
        assert "degraded" in data


def test_detect_503_has_detail(client):
    r = client.post("/ml/detect", json={"sequence": VALID_SEQ})
    if r.status_code == 503:
        assert "detail" in r.json()


def test_detect_empty_sequence_400(client):
    r = client.post("/ml/detect", json={"sequence": EMPTY_SEQ})
    assert r.status_code == 400


def test_detect_invalid_dna_400(client):
    r = client.post("/ml/detect", json={"sequence": INVALID_DNA})
    assert r.status_code == 400


def test_detect_no_silent_050_fallback(client):
    """
    When models are not loaded, /ml/detect must return 503, NOT 200 with 0.50.
    """
    health = client.get("/health").json()
    svc = health.get("services", {})
    models_loaded = svc.get("kmerDetectorLoaded") and svc.get("cnnDetectorLoaded")

    r = client.post("/ml/detect", json={"sequence": VALID_SEQ})
    if not models_loaded:
        assert r.status_code == 503, (
            f"When models are missing, /ml/detect must return 503, "
            f"not {r.status_code}: {r.text}"
        )


# ---------------------------------------------------------------------------
# POST /ml/naive-encode
# ---------------------------------------------------------------------------

def test_naive_encode_valid(client):
    r = client.post("/ml/naive-encode", json={
        "sequence": VALID_SEQ, "payloadBits": BITS,
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert "naiveSequence" in data
    assert len(data["naiveSequence"]) == len(VALID_SEQ)


def test_naive_encode_empty_payload_400(client):
    r = client.post("/ml/naive-encode", json={
        "sequence": VALID_SEQ, "payloadBits": [],
    })
    assert r.status_code == 400


def test_naive_encode_invalid_bit_400(client):
    r = client.post("/ml/naive-encode", json={
        "sequence": VALID_SEQ, "payloadBits": [0, 5],
    })
    assert r.status_code == 400


# ---------------------------------------------------------------------------
# POST /ml/channel
# ---------------------------------------------------------------------------

def test_channel_valid(client):
    r = client.post("/ml/channel", json={
        "sequence": VALID_SEQ,
        "substitutionRate": 0.01,
        "indelRate": 0.0,
        "seed": 42,
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert "noisySequence" in data
    assert "mutationsApplied" in data


def test_channel_zero_noise_unchanged(client):
    r = client.post("/ml/channel", json={
        "sequence": VALID_SEQ, "substitutionRate": 0.0, "indelRate": 0.0, "seed": 1,
    })
    assert r.status_code == 200
    assert r.json()["noisySequence"].upper() == VALID_SEQ.upper()


def test_channel_empty_sequence_400(client):
    r = client.post("/ml/channel", json={
        "sequence": EMPTY_SEQ, "substitutionRate": 0.01,
    })
    assert r.status_code == 400


def test_channel_rate_out_of_range_422(client):
    r = client.post("/ml/channel", json={
        "sequence": VALID_SEQ, "substitutionRate": 0.5,  # max is 0.2
    })
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# GET /ml/codon-usage
# ---------------------------------------------------------------------------

def test_codon_usage_valid(client):
    r = client.get("/ml/codon-usage")
    assert r.status_code in (200, 503)


def test_codon_usage_200_structure(client):
    r = client.get("/ml/codon-usage")
    if r.status_code == 200:
        data = r.json()
        assert "host" in data
        assert "totalCodons" in data
        assert "topCodonsPerAA" in data
        assert data["totalCodons"] > 0


# ---------------------------------------------------------------------------
# Root path
# ---------------------------------------------------------------------------

def test_root_returns_404(client):
    r = client.get("/")
    assert r.status_code == 404, (
        f"Root path should return 404 (Not Found), got {r.status_code}"
    )
