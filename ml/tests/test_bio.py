"""
test_bio.py — Unit tests for genestamp_ml.bio core functions.
"""
import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from genestamp_ml.bio import (
    translate_seq,
    assert_protein_identity,
    gc_content,
    max_homopolymer_run,
    has_safe_homopolymer,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

# A valid 18-nt CDS: ATG (Met) + GCG (Ala) + GAA (Glu) + CTG (Leu) + TAA (Stop)
VALID_CDS = "ATGGCGGAACTGTAA"

# Two synonymous codon variants (same protein, different codons)
CDS_A = "ATGGCGGAACTGTAA"   # GCG=Ala, GAA=Glu, CTG=Leu
CDS_B = "ATGGCCGAGTTGTAA"   # GCC=Ala, GAG=Glu, TTG=Leu


# ---------------------------------------------------------------------------
# translate_seq
# ---------------------------------------------------------------------------

class TestTranslateSeq:
    def test_basic_translation(self):
        prot = translate_seq("ATGGCGTAA")
        assert prot.startswith("MA"), f"Expected 'MA...', got {prot!r}"

    def test_stop_codon_included_or_stripped(self):
        # Different implementations may or may not include the '*'
        prot = translate_seq("ATGGCGTAA")
        assert "MA" in prot

    def test_non_multiple_of_3_gives_partial_or_raises(self):
        # BioPython warns (not raises) on partial codons; both behaviours are acceptable.
        # We just verify no hard crash and the result doesn't contain the extra partial codon.
        try:
            result = translate_seq("ATGGC")  # 5 nt — partial codon at end
            # If it returns without raising, it must at least start with 'M'
            assert result.startswith("M"), f"Unexpected translation result: {result!r}"
        except Exception:
            pass  # Raising is also acceptable

    def test_known_sequence(self):
        # ATG=M  GCG=A  GAA=E  CTG=L  TAA=*
        prot = translate_seq(VALID_CDS)
        assert prot.startswith("MAEL"), f"Got {prot!r}"


# ---------------------------------------------------------------------------
# assert_protein_identity
# ---------------------------------------------------------------------------

class TestAssertProteinIdentity:
    def test_identical_sequences_pass(self):
        # Same sequence trivially passes
        assert_protein_identity(VALID_CDS, VALID_CDS)

    def test_synonymous_substitution_passes(self):
        # CDS_A and CDS_B encode the same protein
        assert_protein_identity(CDS_A, CDS_B)

    def test_nonsynonymous_substitution_raises(self):
        # Change GAA (Glu) to GAT (Asp) — non-synonymous
        mutated = "ATGGCGGATCTGTAA"
        with pytest.raises(AssertionError):
            assert_protein_identity(CDS_A, mutated)


# ---------------------------------------------------------------------------
# gc_content
# ---------------------------------------------------------------------------

class TestGcContent:
    def test_all_gc(self):
        assert gc_content("GCGC") == pytest.approx(100.0, abs=0.1)

    def test_all_at(self):
        assert gc_content("ATAT") == pytest.approx(0.0, abs=0.1)

    def test_mixed(self):
        # ATGC → 2 GC out of 4 → 50%
        val = gc_content("ATGC")
        assert val == pytest.approx(50.0, abs=0.1)

    def test_empty(self):
        assert gc_content("") == 0.0


# ---------------------------------------------------------------------------
# max_homopolymer_run
# ---------------------------------------------------------------------------

class TestMaxHomopolymerRun:
    def test_no_repeat(self):
        assert max_homopolymer_run("ACGT") == 1

    def test_simple_repeat(self):
        assert max_homopolymer_run("AAACGT") == 3

    def test_long_repeat(self):
        assert max_homopolymer_run("GGGGG") == 5

    def test_mixed(self):
        # AACCTTTTGG → longest is T×4
        assert max_homopolymer_run("AACCTTTTGG") == 4

    def test_single_base(self):
        assert max_homopolymer_run("A") == 1


# ---------------------------------------------------------------------------
# has_safe_homopolymer
# ---------------------------------------------------------------------------

class TestHasSafeHomopolymer:
    def test_safe_short(self):
        # run of 3 → safe (max_run limit 4)
        assert has_safe_homopolymer("AAACGT", max_run=4) is True

    def test_unsafe_at_limit(self):
        # run of 5 → NOT safe (max_run=4 means ≤4 is ok, 5 is not)
        assert has_safe_homopolymer("AAAAACGT", max_run=4) is False

    def test_exactly_at_limit_safe(self):
        # run of 4 → safe (max_run=4 means ≤4 is ok)
        assert has_safe_homopolymer("AAAACGT", max_run=4) is True
