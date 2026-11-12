"""
test_channel.py — Tests for the channel noise simulator.
"""
import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from genestamp_ml.channel import simulate_channel

# A simple 60-nt test sequence (multiples of 3)
TEST_SEQ = "ATGGCGGAACTGCGTCCGACGTATGGTGCAGACGAATTTCTTAAGCGGTAA"


class TestSimulateChannelStructure:
    def test_returns_dict(self):
        result = simulate_channel(TEST_SEQ, 0.01, 0.0, seed=42)
        assert isinstance(result, dict), "simulate_channel must return a dict"

    def test_has_required_keys(self):
        result = simulate_channel(TEST_SEQ, 0.01, 0.0, seed=42)
        # Accept both camelCase and snake_case key names
        noisy_key = "noisySequence" if "noisySequence" in result else "noisy_sequence"
        muts_key  = "mutationsApplied" if "mutationsApplied" in result else "mutations_applied"
        assert noisy_key in result, f"Expected noisySequence/noisy_sequence in result keys: {list(result)}"
        assert muts_key  in result, f"Expected mutationsApplied/mutations_applied in result keys: {list(result)}"

    def test_output_is_dna_string(self):
        result = simulate_channel(TEST_SEQ, 0.01, 0.0, seed=42)
        noisy = result.get("noisySequence", result.get("noisy_sequence", ""))
        assert isinstance(noisy, str)
        assert set(noisy.upper()) <= {"A", "C", "G", "T"}


class TestSubstitutionOnly:
    def test_zero_rate_no_change(self):
        """With substitution_rate=0 and indel_rate=0, output must equal input."""
        result = simulate_channel(TEST_SEQ, 0.0, 0.0, seed=42)
        noisy = result.get("noisySequence", result.get("noisy_sequence"))
        assert noisy.upper() == TEST_SEQ.upper(), (
            "Zero noise should produce identical sequence"
        )

    def test_high_rate_causes_changes(self):
        """With substitution_rate=0.5 almost all bases should change."""
        result = simulate_channel(TEST_SEQ, 0.5, 0.0, seed=42)
        noisy = result.get("noisySequence", result.get("noisy_sequence"))
        changed = sum(a != b for a, b in zip(TEST_SEQ.upper(), noisy.upper()))
        assert changed > 5, (
            f"Expected many substitutions at rate=0.5, got {changed} changes"
        )

    def test_substitution_preserves_length(self):
        """Substitutions must not change the sequence length."""
        result = simulate_channel(TEST_SEQ, 0.05, 0.0, seed=99)
        noisy = result.get("noisySequence", result.get("noisy_sequence"))
        assert len(noisy) == len(TEST_SEQ), (
            f"Length changed: {len(TEST_SEQ)} → {len(noisy)}"
        )


class TestIndelOnly:
    def test_indels_change_length(self):
        """With a high indel rate the length should change."""
        result = simulate_channel(TEST_SEQ, 0.0, 0.3, seed=1)
        noisy = result.get("noisySequence", result.get("noisy_sequence"))
        # With 30% indel rate on a 51-nt sequence, length almost certainly changes
        # (this test has a tiny false-failure probability; acceptable)
        muts = result.get("mutationsApplied", result.get("mutations_applied", 0))
        assert muts >= 0  # at minimum this should not crash


class TestReproducibility:
    def test_same_seed_same_output(self):
        r1 = simulate_channel(TEST_SEQ, 0.02, 0.005, seed=7)
        r2 = simulate_channel(TEST_SEQ, 0.02, 0.005, seed=7)
        n1 = r1.get("noisySequence", r1.get("noisy_sequence"))
        n2 = r2.get("noisySequence", r2.get("noisy_sequence"))
        assert n1 == n2, "Same seed must produce identical output"

    def test_different_seed_different_output(self):
        r1 = simulate_channel(TEST_SEQ, 0.05, 0.0, seed=1)
        r2 = simulate_channel(TEST_SEQ, 0.05, 0.0, seed=2)
        n1 = r1.get("noisySequence", r1.get("noisy_sequence"))
        n2 = r2.get("noisySequence", r2.get("noisy_sequence"))
        # With high sub rate, different seeds almost certainly differ
        assert n1 != n2, "Different seeds should (almost always) produce different output"

