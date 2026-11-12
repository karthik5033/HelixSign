"""
channel.py — Biological channel noise simulator for HelixSign.

Simulates evolutionary drift and sequencing artifacts:
- Substitution noise: transitions (A<->G, C<->T) more frequent than transversions
- Indel noise: random single-base insertions or deletions
"""
import random
from typing import Optional, Tuple

# Transition pairs (purines A<->G, pyrimidines C<->T)
TRANSITION_PAIRS = {
    "A": "G", "G": "A",
    "C": "T", "T": "C",
}

# Transversion targets for each base
TRANSVERSION_MAP = {
    "A": ["C", "T"], "G": ["C", "T"],
    "C": ["A", "G"], "T": ["A", "G"],
}

# All valid bases
BASES = ["A", "C", "G", "T"]


def apply_substitutions(seq: str, rate: float, rng: random.Random) -> Tuple[str, int]:
    """Apply random substitutions to *seq* at the given per-base *rate*.

    Transitions (A↔G, C↔T) occur at **2×** the rate of transversions
    (A/G ↔ C/T).  Specifically, for each base that undergoes mutation:

    - probability 2/3 → transition
    - probability 1/3 → transversion (one of the two transversion targets
      chosen with equal probability)

    Args:
        seq: DNA string (uppercase ACGT).
        rate: Per-base substitution probability in [0, 1].
        rng: Seeded :class:`random.Random` instance for reproducibility.

    Returns:
        Tuple[str, int]:
            - Mutated sequence string.
            - Number of substitutions applied.
    """
    if rate <= 0.0:
        return seq, 0

    bases = list(seq.upper())
    num_mutations = 0

    for i, base in enumerate(bases):
        if base not in BASES:
            continue
        if rng.random() < rate:
            # Decide transition vs transversion: ratio 2:1
            roll = rng.random()
            if roll < 2.0 / 3.0:
                # Transition
                new_base = TRANSITION_PAIRS.get(base, base)
            else:
                # Transversion — pick one of the two transversion targets
                tv_targets = TRANSVERSION_MAP.get(base, BASES)
                new_base = rng.choice(tv_targets)

            if new_base != base:
                bases[i] = new_base
                num_mutations += 1

    return "".join(bases), num_mutations


def apply_indels(seq: str, rate: float, rng: random.Random) -> Tuple[str, int]:
    """Apply random single-base insertions or deletions to *seq*.

    Each base position is independently considered for an indel event at the
    given *rate*.  Insertions and deletions are equally likely (50/50).
    Inserted bases are chosen uniformly from {A, C, G, T}.

    Args:
        seq: DNA string (uppercase ACGT).
        rate: Per-base indel probability in [0, 1].
        rng: Seeded :class:`random.Random` instance for reproducibility.

    Returns:
        Tuple[str, int]:
            - Mutated sequence string (length may differ from input).
            - Number of indel events applied.
    """
    if rate <= 0.0:
        return seq, 0

    bases = list(seq.upper())
    result: list = []
    num_indels = 0
    i = 0

    while i < len(bases):
        base = bases[i]
        if rng.random() < rate:
            # Decide insertion or deletion with equal probability
            if rng.random() < 0.5:
                # Insertion: insert a random base before the current base
                result.append(rng.choice(BASES))
                result.append(base)
                num_indels += 1
            else:
                # Deletion: skip current base
                num_indels += 1
        else:
            result.append(base)
        i += 1

    return "".join(result), num_indels


def simulate_channel(
    seq: str,
    substitution_rate: float = 0.01,
    indel_rate: float = 0.005,
    seed: Optional[int] = None,
) -> dict:
    """Apply full biological channel noise to a DNA sequence.

    Applies substitutions first, then indels, using a single seeded RNG for
    full reproducibility.

    Args:
        seq: Input DNA string (uppercase ACGT).
        substitution_rate: Per-base substitution probability (default 0.01).
        indel_rate: Per-base indel probability (default 0.005).
        seed: Optional integer seed for the RNG.  Pass a fixed value for
            reproducible results.

    Returns:
        dict with keys:

        - ``"noisySequence"`` (str): Mutated DNA sequence.
        - ``"mutationsApplied"`` (int): Total mutation events (substitutions + indels).
        - ``"substitutions"`` (int): Number of substitution events applied.
        - ``"indels"`` (int): Number of indel events applied.
    """
    rng = random.Random(seed)

    # Apply substitutions first
    after_subs, num_subs = apply_substitutions(seq, substitution_rate, rng)

    # Apply indels to the already-substituted sequence
    noisy_seq, num_indels = apply_indels(after_subs, indel_rate, rng)

    return {
        "noisySequence": noisy_seq,
        "mutationsApplied": num_subs + num_indels,
        "substitutions": num_subs,
        "indels": num_indels,
    }
