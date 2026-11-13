"""
audit_protein_invariance.py — Exhaustive biological correctness audit.
Tests all 4,290 E. coli CDS sequences for 100% protein identity preservation.
"""
import json
import time
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
from Bio.Seq import Seq

from genestamp_ml.bio import load_codon_usage, assert_protein_identity, sequence_stats, max_homopolymer_run
from genestamp_ml.embed import find_eligible_positions, embed_bits

DATA_PATH = Path(__file__).parent.parent / "data" / "processed" / "ecoli_mg1655_cds_clean.csv"
OUTPUT_PATH = Path(__file__).parent.parent / "artifacts" / "audit" / "protein_invariance.json"

def main():
    print("=" * 60)
    print("EXHAUSTIVE PROTEIN INVARIANCE & BIOLOGICAL INTEGRITY AUDIT")
    print("=" * 60)
    
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Missing {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    total_cds = len(df)
    codon_usage = load_codon_usage()

    print(f"Loaded {total_cds} verified CDS from {DATA_PATH.name}")

    start_time = time.time()
    tested_count = 0
    skipped_count = 0
    violations = []
    homopolymers_created = 0
    total_mutations = 0

    for idx, row in df.iterrows():
        gene_id = row["gene_id"]
        dna = row["dna_sequence"]
        
        eligible = find_eligible_positions(dna, codon_usage)
        if not eligible:
            skipped_count += 1
            continue
            
        # Test full capacity embedding with alternating bits
        bits = [1 if (i % 2 == 0) else 0 for i in range(len(eligible))]
        
        hp_before = max_homopolymer_run(dna)
        stamped, muts = embed_bits(dna, bits, eligible, codon_usage)
        hp_after = max_homopolymer_run(stamped)
        
        # Verify 100% invariant
        original_aa = str(Seq(dna).translate(table=11))
        stamped_aa = str(Seq(stamped).translate(table=11))
        
        if original_aa != stamped_aa:
            violations.append({
                "gene_id": gene_id,
                "length_nt": len(dna),
                "original_aa": original_aa[:50] + "...",
                "stamped_aa": stamped_aa[:50] + "...",
                "error": "Protein translation divergence detected"
            })
            
        if hp_before <= 4 and hp_after > 4:
            homopolymers_created += 1

        total_mutations += len(muts)
        tested_count += 1

        if tested_count % 1000 == 0:
            print(f"  Audited {tested_count}/{total_cds} CDS ({time.time() - start_time:.1f}s)...")

    elapsed = time.time() - start_time

    audit_result = {
        "audit_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "dataset_file": str(DATA_PATH.name),
        "total_cds_in_dataset": total_cds,
        "tested_cds_count": tested_count,
        "skipped_cds_no_eligible_codons": skipped_count,
        "total_synonymous_mutations_evaluated": total_mutations,
        "protein_identity_violations_count": len(violations),
        "violations": violations,
        "new_homopolymers_exceeding_4_bp_created": homopolymers_created,
        "audit_passed": len(violations) == 0,
        "execution_seconds": round(elapsed, 2)
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as fh:
        json.dump(audit_result, fh, indent=2)

    print("-" * 60)
    print(f"Audit Complete in {elapsed:.2f}s")
    print(f"  Tested Genes: {tested_count}")
    print(f"  Invariant Violations: {len(violations)}")
    print(f"  New >4bp Homopolymers Created: {homopolymers_created}")
    print(f"  Audit Saved to: {OUTPUT_PATH}")
    print("=" * 60)

if __name__ == "__main__":
    main()
