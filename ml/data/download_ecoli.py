"""
download_ecoli.py — Download E. coli K-12 MG1655 GenBank and compute codon usage.

Downloads NC_000913.3, extracts valid CDS features, computes codon usage
frequencies and RSCU values, saves JSON and test FASTA.
"""
import json
import math
import os
import re
import urllib.request
from pathlib import Path
from collections import defaultdict

from Bio import SeqIO
from Bio.Seq import Seq

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent
RAW_DIR = SCRIPT_DIR / "raw"
GB_PATH = RAW_DIR / "NC_000913.3.gb"
CODON_USAGE_PATH = SCRIPT_DIR / "codon_usage_ecoli.json"
TEST_FASTA_PATH = SCRIPT_DIR / "test_genes.fasta"

NCBI_URL = (
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
    "?db=nuccore&id=NC_000913.3&rettype=gbwithparts&retmode=text"
)

# Standard genetic code 11 (bacterial) codon table
STANDARD_TABLE_11 = {
    "TTT": "F", "TTC": "F",
    "TTA": "L", "TTG": "L", "CTT": "L", "CTC": "L", "CTA": "L", "CTG": "L",
    "ATT": "I", "ATC": "I", "ATA": "I",
    "ATG": "M",
    "GTT": "V", "GTC": "V", "GTA": "V", "GTG": "V",
    "TCT": "S", "TCC": "S", "TCA": "S", "TCG": "S",
    "CCT": "P", "CCC": "P", "CCA": "P", "CCG": "P",
    "ACT": "T", "ACC": "T", "ACA": "T", "ACG": "T",
    "GCT": "A", "GCC": "A", "GCA": "A", "GCG": "A",
    "TAT": "Y", "TAC": "Y",
    "TAA": "*", "TAG": "*", "TGA": "*",
    "CAT": "H", "CAC": "H",
    "CAA": "Q", "CAG": "Q",
    "AAT": "N", "AAC": "N",
    "AAA": "K", "AAG": "K",
    "GAT": "D", "GAC": "D",
    "GAA": "E", "GAG": "E",
    "TGT": "C", "TGC": "C",
    "TGG": "W",
    "CGT": "R", "CGC": "R", "CGA": "R", "CGG": "R", "AGA": "R", "AGG": "R",
    "AGT": "S", "AGC": "S",
    "GGT": "G", "GGC": "G", "GGA": "G", "GGG": "G",
}

# Build synonymous groups from table (excluding stop codons)
def _build_synonymous_groups() -> dict:
    groups: dict = defaultdict(list)
    for codon, aa in STANDARD_TABLE_11.items():
        if aa != "*":
            groups[aa].append(codon)
    return dict(groups)


SYNONYMOUS_GROUPS = _build_synonymous_groups()
ELIGIBLE_AAS = [aa for aa, codons in SYNONYMOUS_GROUPS.items() if len(codons) >= 2]
INELIGIBLE_AAS = [aa for aa, codons in SYNONYMOUS_GROUPS.items() if len(codons) < 2]

# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------

def download_genbank() -> None:
    """Download NC_000913.3 GenBank file from NCBI if not already present."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    if GB_PATH.exists() and GB_PATH.stat().st_size > 1_000_000:
        print(f"[skip] {GB_PATH} already exists ({GB_PATH.stat().st_size:,} bytes).")
        return

    print(f"[download] Fetching {NCBI_URL} ...")
    headers = {"User-Agent": "HelixSign/0.1 (contact@helixsign.dev)"}
    req = urllib.request.Request(NCBI_URL, headers=headers)
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = resp.read()
    GB_PATH.write_bytes(data)
    print(f"[download] Saved {len(data):,} bytes -> {GB_PATH}")


# ---------------------------------------------------------------------------
# CDS extraction & validation
# ---------------------------------------------------------------------------

def is_valid_cds(feature, record_seq: str) -> bool:
    """Return True if feature passes all validity filters."""
    # Must be CDS
    if feature.type != "CDS":
        return False
    # No pseudogenes
    if "pseudo" in feature.qualifiers or "pseudogene" in feature.qualifiers:
        return False
    try:
        seq = str(feature.extract(record_seq)).upper()
    except Exception:
        return False
    # Only ACGT
    if re.search(r"[^ACGT]", seq):
        return False
    # Divisible by 3
    if len(seq) % 3 != 0 or len(seq) < 3:
        return False
    return True


def extract_valid_cds(record) -> list:
    """Return list of (locus_tag, seq_str) for all valid CDS in record."""
    results = []
    for feat in record.features:
        if not is_valid_cds(feat, record.seq):
            continue
        seq = str(feat.extract(record.seq)).upper()
        locus = feat.qualifiers.get("locus_tag", ["unknown"])[0]
        gene = feat.qualifiers.get("gene", [locus])[0]
        product = feat.qualifiers.get("product", [""])[0]
        results.append({
            "locus_tag": locus,
            "gene": gene,
            "product": product,
            "seq": seq,
            "length": len(seq),
        })
    return results


# ---------------------------------------------------------------------------
# Codon usage computation
# ---------------------------------------------------------------------------

def count_codons(cds_list: list) -> dict:
    """Count raw codon occurrences across all CDS (excluding stop codon at end)."""
    counts: dict = defaultdict(int)
    for entry in cds_list:
        seq = entry["seq"]
        # Walk codons; skip the terminal stop
        codons = [seq[i:i+3] for i in range(0, len(seq) - 3, 3)]
        for codon in codons:
            if codon in STANDARD_TABLE_11:
                counts[codon] += 1
    return dict(counts)


def compute_rscu(counts: dict) -> dict:
    """
    Compute RSCU (Relative Synonymous Codon Usage) for each codon.

    RSCU(codon_i) = observed_count / (1/n_i * sum_j(count_j))
    where n_i = number of synonymous codons for that amino acid.
    """
    # Build per-amino-acid sums
    aa_total: dict = defaultdict(int)
    for codon, aa in STANDARD_TABLE_11.items():
        if aa == "*":
            continue
        aa_total[aa] += counts.get(codon, 0)

    rscu: dict = {}
    for codon, aa in STANDARD_TABLE_11.items():
        if aa == "*":
            rscu[codon] = 0.0
            continue
        n = len(SYNONYMOUS_GROUPS[aa])
        total = aa_total[aa]
        observed = counts.get(codon, 0)
        if total == 0:
            rscu[codon] = 1.0  # uniform fallback
        else:
            rscu[codon] = observed / (total / n) if total > 0 else 1.0
    return rscu


def build_codon_table(counts: dict, rscu: dict, total_codons: int) -> dict:
    """Build the codon_table dict for JSON output."""
    table = {}
    for codon, aa in STANDARD_TABLE_11.items():
        cnt = counts.get(codon, 0)
        freq = cnt / total_codons if total_codons > 0 else 0.0
        table[codon] = {
            "amino_acid": aa,
            "count": cnt,
            "frequency": round(freq, 8),
            "rscu": round(rscu.get(codon, 1.0), 6),
        }
    return table


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def select_test_genes(cds_list: list) -> list:
    """
    Select 5 representative genes with lengths in 600-3000nt and varied sizes.
    """
    eligible = [e for e in cds_list if 600 <= e["length"] <= 3000]
    if len(eligible) < 5:
        eligible = cds_list[:5]
    # Sort by length and pick 5 spread across the range
    eligible_sorted = sorted(eligible, key=lambda x: x["length"])
    n = len(eligible_sorted)
    indices = [0, n // 4, n // 2, 3 * n // 4, n - 1]
    return [eligible_sorted[i] for i in indices]


def main() -> None:
    print("=" * 60)
    print("HelixSign — E. coli K-12 MG1655 Data Pipeline")
    print("=" * 60)

    # Step 1: Download
    download_genbank()

    # Step 2: Parse
    print("[parse] Reading GenBank record ...")
    record = SeqIO.read(str(GB_PATH), "genbank")
    print(f"[parse] Record: {record.id}, length {len(record.seq):,} bp")

    # Step 3: Extract valid CDS
    print("[extract] Extracting valid CDS ...")
    cds_list = extract_valid_cds(record)
    total_cds = len(cds_list)
    print(f"[extract] Valid CDS found: {total_cds}")

    # Step 4: Count codons
    print("[codon] Counting codons ...")
    counts = count_codons(cds_list)
    total_codons = sum(counts.values())
    print(f"[codon] Total sense codons counted: {total_codons:,}")

    # Step 5: Compute RSCU
    print("[codon] Computing RSCU ...")
    rscu = compute_rscu(counts)

    # Step 6: Build codon table
    codon_table = build_codon_table(counts, rscu, total_codons)

    # Step 7: Assemble JSON
    output = {
        "metadata": {
            "organism": "E. coli K-12 MG1655",
            "accession": "NC_000913.3",
            "total_cds": total_cds,
            "total_sense_codons": total_codons,
        },
        "codon_table": codon_table,
        "synonymous_groups": {aa: sorted(codons) for aa, codons in SYNONYMOUS_GROUPS.items()},
        "eligible_amino_acids": sorted(ELIGIBLE_AAS),
        "ineligible": sorted(INELIGIBLE_AAS),
    }

    print(f"[save] Writing {CODON_USAGE_PATH} ...")
    CODON_USAGE_PATH.write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(f"[save] Codon usage JSON saved ({CODON_USAGE_PATH.stat().st_size:,} bytes).")

    # Step 8: Test FASTA
    print("[fasta] Selecting 5 representative test genes ...")
    test_genes = select_test_genes(cds_list)
    fasta_lines = []
    for gene in test_genes:
        header = (
            f">{gene['locus_tag']} gene={gene['gene']} "
            f"length={gene['length']} product={gene['product']}"
        )
        fasta_lines.append(header)
        fasta_lines.append(gene["seq"])
    TEST_FASTA_PATH.write_text("\n".join(fasta_lines) + "\n", encoding="utf-8")
    print(f"[fasta] Test genes saved -> {TEST_FASTA_PATH}")
    for g in test_genes:
        print(f"        {g['locus_tag']} ({g['gene']}): {g['length']} nt")

    # Summary
    print("\n[summary]")
    print(f"  Organism     : {output['metadata']['organism']}")
    print(f"  Accession    : {output['metadata']['accession']}")
    print(f"  Valid CDS    : {total_cds}")
    print(f"  Total codons : {total_codons:,}")
    print(f"  Eligible AAs : {sorted(ELIGIBLE_AAS)}")
    print(f"  Ineligible   : {sorted(INELIGIBLE_AAS)}")
    print("=" * 60)
    print("Done.")


if __name__ == "__main__":
    main()
