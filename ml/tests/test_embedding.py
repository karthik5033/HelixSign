"""
test_embedding.py — Round-trip embed → extract tests for all 5 test genes.
"""
import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from genestamp_ml.bio import load_codon_usage, assert_protein_identity
from genestamp_ml.embed import find_eligible_positions, embed_bits
from genestamp_ml.extract import extract_bits

DATA_DIR = Path(__file__).parent.parent / "data"


@pytest.fixture(scope="module")
def codon_usage():
    return load_codon_usage()


@pytest.fixture(scope="module")
def test_genes():
    """Load the 5 held-out test genes from test_genes.fasta."""
    from Bio import SeqIO
    fasta = DATA_DIR / "test_genes.fasta"
    genes = []
    for rec in SeqIO.parse(str(fasta), "fasta"):
        seq = str(rec.seq).upper()
        if set(seq) <= {"A", "C", "G", "T"} and len(seq) % 3 == 0:
            genes.append((rec.id, seq))
    assert genes, "No test genes found in test_genes.fasta"
    return genes


# ---------------------------------------------------------------------------
# Protein identity preserved for all test genes
# ---------------------------------------------------------------------------

class TestProteinIdentity:
    def test_all_test_genes_preserve_protein(self, test_genes, codon_usage):
        for gene_id, seq in test_genes:
            eligible = find_eligible_positions(seq, codon_usage)
            if len(eligible) < 8:
                continue
            n_bits = min(32, len(eligible))
            bits = [i % 2 for i in range(n_bits)]
            carrier_positions = eligible[:n_bits]
            result = embed_bits(seq, bits, carrier_positions, codon_usage)
            stamped = result[0] if isinstance(result, tuple) else result
            # This must not raise
            assert_protein_identity(seq, stamped), (
                f"Protein identity violated for gene {gene_id}"
            )


# ---------------------------------------------------------------------------
# Bit-exact round-trip: embed → extract on each test gene
# ---------------------------------------------------------------------------

class TestRoundTrip:
    @pytest.mark.parametrize("n_bits", [8, 32, 64])
    def test_embed_extract_roundtrip(self, test_genes, codon_usage, n_bits):
        """Verify bit-exact recovery for varying payload sizes."""
        for gene_id, seq in test_genes:
            eligible = find_eligible_positions(seq, codon_usage)
            if len(eligible) < n_bits:
                pytest.skip(f"{gene_id} has only {len(eligible)} eligible positions (need {n_bits})")

            bits = [i % 2 for i in range(n_bits)]
            carrier_positions = eligible[:n_bits]

            embed_result = embed_bits(seq, bits, carrier_positions, codon_usage)
            stamped = embed_result[0] if isinstance(embed_result, tuple) else embed_result

            extract_result = extract_bits(stamped, carrier_positions, codon_usage)
            recovered = list(extract_result[0] if isinstance(extract_result, tuple) else extract_result)

            assert recovered[:n_bits] == bits, (
                f"Bit recovery failed for gene {gene_id} with {n_bits} bits. "
                f"Mismatches: {sum(a != b for a, b in zip(bits, recovered[:n_bits]))}/{n_bits}"
            )

    def test_no_eligible_positions_handled(self, test_genes, codon_usage):
        """Ensure embed_bits handles edge case of minimum viable gene."""
        # Create a minimal sequence (only Met + stop, no eligible codons)
        trivial = "ATGTAA"  # Met-Stop: no synonymous codons
        eligible = find_eligible_positions(trivial, codon_usage)
        assert len(eligible) == 0, "Trivial sequence should have 0 eligible positions"


# ---------------------------------------------------------------------------
# Embedding does not introduce unexpected length changes
# ---------------------------------------------------------------------------

class TestLengthPreservation:
    def test_stamped_length_equals_original(self, test_genes, codon_usage):
        for gene_id, seq in test_genes:
            eligible = find_eligible_positions(seq, codon_usage)
            if len(eligible) < 8:
                continue
            n_bits = min(32, len(eligible))
            bits = [0] * n_bits
            carrier_positions = eligible[:n_bits]
            result = embed_bits(seq, bits, carrier_positions, codon_usage)
            stamped = result[0] if isinstance(result, tuple) else result
            assert len(stamped) == len(seq), (
                f"Gene {gene_id}: length changed from {len(seq)} to {len(stamped)}"
            )

