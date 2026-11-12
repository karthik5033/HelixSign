export interface DocArticle {
  id: string;
  category: string;
  categoryTitle: string;
  subcategory: string;
  title: string;
  readingTime: string;
  lead: string;
  badges: string[];
  content: {
    overviewText: string;
    keyPoints?: { title: string; description: string }[];
    mathFormula?: {
      title: string;
      formula: string;
      explanation: string;
    };
    codeSnippets?: {
      python?: string;
      curl?: string;
      typescript?: string;
      cpp?: string;
    };
    schemaJson?: string;
    callout?: {
      type: "note" | "tip" | "caution";
      title: string;
      text: string;
    };
    tableData?: {
      headers: string[];
      rows: string[][];
    };
    relatedTopics?: {
      title: string;
      desc: string;
      id: string;
    }[];
  };
}

export interface NavGroup {
  name: string;
  items: {
    id: string;
    label: string;
    iconName: string;
    isExternal?: boolean;
    href?: string;
  }[];
}

export const DOCS_NAV_GROUPS: NavGroup[] = [
  {
    name: "PLATFORM",
    items: [
      { id: "overview", label: "Documentation Home", iconName: "Home" },
      { id: "quickstart", label: "Quick Start Guide", iconName: "PlayCircle" },
      { id: "architecture", label: "System Architecture", iconName: "Layers" },
      { id: "sdk-cli", label: "Python SDK & CLI", iconName: "Terminal" },
    ],
  },
  {
    name: "PIPELINE CORE",
    items: [
      { id: "takens-embedding", label: "Codon Manifold Embedding", iconName: "GitBranch" },
      { id: "vietoris-rips", label: "Vietoris-Rips Homology", iconName: "Share2" },
      { id: "betti-curves", label: "Betti Invariants & Barcodes", iconName: "BarChart3" },
      { id: "wave-localization", label: "Carrier Locus Mapping", iconName: "Crosshair" },
      { id: "wgan-stealth", label: "Adversarial Stealth (WGAN)", iconName: "Activity" },
      { id: "model-benchmarks", label: "Stealth Benchmark Matrix", iconName: "ShieldCheck" },
    ],
  },
  {
    name: "INTERFACES & SPECIFICATIONS",
    items: [
      { id: "api-reference", label: "REST & Streaming API", iconName: "Code2" },
      { id: "data-contracts", label: "Provenance Data Schemas", iconName: "FileCode" },
      { id: "sensor-hardware", label: "Host Biosecurity & Codecs", iconName: "Radio" },
      { id: "ndt-compliance", label: "IBC & ISO/IEC Standards", iconName: "CheckCircle2" },
    ],
  },
];

export const DOC_ARTICLES: Record<string, DocArticle> = {
  overview: {
    id: "overview",
    category: "PLATFORM",
    categoryTitle: "DOCUMENTATION HOME",
    subcategory: "GETTING STARTED",
    title: "HelixSign Platform Documentation",
    readingTime: "2 min read",
    lead: "HelixSign is a production-grade, function-invariant DNA steganography and provenance verification platform for synthetic biology. It embeds tamper-evident cryptographic ownership watermarks inside synonymous codon choices of engineered genes with zero amino acid displacement.",
    badges: ["v2.6.0", "FastAPI v0.110", "WGAN-GP Critic", "Reed-Solomon RS(16,8)"],
    content: {
      overviewText: "Traditional genetic watermarking inserts non-coding barcodes or naive bit substitutions that either disrupt open reading frames, alter translated proteins, or introduce high-frequency k-mer anomalies easily flagged by biosecurity screening classifiers. HelixSign solves this by embedding cryptographic provenance payloads across the degenerate synonymous codon manifold, strictly guaranteeing 0 amino acid substitutions while maintaining undetectable host codon adaptation profiles (Stealth AUC ≈ 0.505).",
      keyPoints: [
        {
          title: "Primary Sequence Preservation",
          description: "All modifications occur exclusively within synonymous codon degeneracies. The translated peptide sequence is mathematically identical to wildtype target.",
        },
        {
          title: "Reed-Solomon RS(16,8) Error Correction",
          description: "Encodes payloads over Galois Field GF(2⁸) with t=4 symbol error correction, tolerating up to 3.5% mutagenic point drift and PCR synthesis errors.",
        },
        {
          title: "WGAN-GP Adversarial Stealth",
          description: "Trained against 1D CNN and XGBoost k-mer biosecurity detectors, driving classification discrimination Area Under Curve (AUC) to chance level (~0.50).",
        },
        {
          title: "Cryptographic HKDF Keyed Allocation",
          description: "Carrier loci are pseudorandomly distributed using RFC 5869 HKDF-SHA256, preventing unauthorized reverse-engineering or localized excision.",
        },
      ],
      callout: {
        type: "note",
        title: "Looking for Live Interactive Verification?",
        text: "You can explore real-time codon diff highlights, Monte Carlo mutation stress sweeps, and the Attacker Arena directly inside the HelixSign Console.",
      },
      codeSnippets: {
        python: `import helixsign as hs

# 1. Ingest wildtype CDS sequence
cds = hs.load_fasta("pUC19_lacZ.fasta")

# 2. Configure provenance watermark payload
payload = {
    "owner": "ApexBio Lab",
    "project": "Project Helios",
    "batch": "B-2026-X1"
}

# 3. Stamp sequence with function invariance
stamped = hs.stamp(
    cds_sequence=cds,
    payload=payload,
    secret_key=b"master-biosecurity-key-256",
    host="ecoli_k12"
)

# 4. Verify identity proof and stealth
assert stamped.protein_identity == 1.000, "Protein violated!"
print(f"Stamped {len(stamped.mutations)} synonymous codons | Stealth AUC: {stamped.stealth_auc:.3f}")`,
        curl: `# Stamp CDS sequence via REST API
curl -X POST https://api.helixsign.bio/v1/stamp \\
  -H "Authorization: Bearer hs_live_sec_9941a82" \\
  -H "Content-Type: application/json" \\
  -d '{
    "cds_sequence": "ATGGCCAAG...TAA",
    "owner": "ApexBio Lab",
    "project": "Project Helios",
    "batch": "B-2026-X1",
    "host_organism": "E. coli K-12"
  }'`,
        typescript: `import { HelixSignClient } from "@helixsign/sdk";

const client = new HelixSignClient({
  apiKey: process.env.HELIXSIGN_API_KEY,
  endpoint: "https://api.helixsign.bio",
});

// Authenticate suspect sequence against provenance registry
const result = await client.verify({
  sequence: suspectFastaString,
  secretKey: process.env.WATERMARK_KEY,
});

if (result.status === "VERIFIED") {
  console.log(\`Verified Owner: \${result.owner} (Batch: \${result.batch})\`);
  console.log(\`ECC Errors Corrected: \${result.errorsCorrected} / 4\`);
}`,
      },
      relatedTopics: [
        { id: "quickstart", title: "Quick Start Guide", desc: "Get up and running in under 3 minutes with Python or cURL." },
        { id: "takens-embedding", title: "Codon Manifold Embedding", desc: "Mathematical formulation of degenerate synonymous codon spaces." },
        { id: "wgan-stealth", title: "Adversarial Stealth", desc: "WGAN-GP critic training and biosecurity detector evasion." },
      ],
    },
  },

  quickstart: {
    id: "quickstart",
    category: "PLATFORM",
    categoryTitle: "GETTING STARTED",
    subcategory: "QUICK START",
    title: "Quick Start Guide",
    readingTime: "3 min read",
    lead: "Install the HelixSign Python SDK, stamp an engineered open reading frame, and run forensic authentication with automated Reed-Solomon error correction.",
    badges: ["Python 3.10+", "Biopython 1.83+", "reedsolo GF(2^8)"],
    content: {
      overviewText: "This guide walks through installing the HelixSign Python package, ingesting your first CDS sequence (e.g., E. coli lacZ or GFP), configuring host codon adaptation constraints, and verifying 100% protein identity preservation.",
      keyPoints: [
        {
          title: "Step 1: Install Python SDK",
          description: "Install the official library including Biopython, reedsolo, and PyTorch WGAN-GP inference.",
        },
        {
          title: "Step 2: Ingest and Validate Open Reading Frame",
          description: "Validate length modulo-3 and in-frame start/stop codons under Translation Table 11.",
        },
        {
          title: "Step 3: Stamp & Export Provenance Certificate",
          description: "Generate synonymous codon substitutions and export verified FASTA with cryptographic audit hash.",
        },
      ],
      codeSnippets: {
        python: `# Step 1: Install
# pip install helixsign biopython reedsolo torch

import helixsign as hs

# Step 2: Load target CDS sequence
sequence = hs.load_fasta("ecoli_lacZ.fasta")

# Step 3: Execute Stamping Pipeline
result = hs.pipeline.stamp(
    sequence,
    owner="ApexBio Lab",
    project="Helios-1",
    batch="B-402",
    max_delta_cai=0.015,
    homopolymer_limit=4
)

print(f"Status:             {result.status}")
print(f"Protein Identity:   {result.protein_identity:.1%}")
print(f"Carriers Modified:  {len(result.synonymous_diffs)}")
print(f"Stealth Detector:   {result.stealth_auc:.3f} AUC (Chance)")`,
        curl: `# Health check
curl -s https://api.helixsign.bio/v1/health

# Trigger asynchronous stealth check
curl -X POST https://api.helixsign.bio/v1/stealth \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"sequence": "ATGGCCAAG...TAA", "detector": "1d_cnn"}'`,
      },
      callout: {
        type: "tip",
        title: "Host Organism Selection",
        text: "Always select the appropriate host organism codon table (default: E. coli K-12 RefSeq) to ensure that the ΔCAI threshold strictly preserves physiological expression rates.",
      },
    },
  },

  architecture: {
    id: "architecture",
    category: "PLATFORM",
    categoryTitle: "ARCHITECTURE",
    subcategory: "SYSTEM BLUEPRINT",
    title: "System Architecture",
    readingTime: "4 min read",
    lead: "Detailed blueprint of the 5-layer HelixSign architecture: Sequence Ingestion, Key Derivation, Galois Field RS Codec, WGAN-GP Codon Manifold Refiner, and Provenance Registry.",
    badges: ["Microservices", "FastAPI", "WGAN-GP", "PostgreSQL / Redis"],
    content: {
      overviewText: "HelixSign is structured as an end-to-end pipeline designed for high-throughput synthetic biology pipelines, DNA foundry synthesis workflows, and automated biosecurity audit logging.",
      keyPoints: [
        {
          title: "Layer 1: Ingestion & Biophysical Validation",
          description: "Validates ORF modularity, calculates baseline Codon Adaptation Index, and computes theoretical synonymous capacity.",
        },
        {
          title: "Layer 2: Keyed HKDF Allocation",
          description: "Cryptographically disperses carrier codons across reading frames to eliminate localized k-mer clustering.",
        },
        {
          title: "Layer 3: Reed-Solomon GF(2⁸) ECC",
          description: "Interleaves payload data with parity symbols, correcting up to 4 symbol corruptions per 16-symbol codeword tile.",
        },
        {
          title: "Layer 4: Adversarial Codon Manifold Refiner",
          description: "WGAN-GP critic minimizes sequence MMD against host distributions, achieving empirical detector evasion (AUC ≈ 0.505).",
        },
        {
          title: "Layer 5: Provenance Registry Ledger",
          description: "Issues ECDSA P-256 signed provenance certificates with SHA-256 sequence integrity hashes for immutable IP defense.",
        },
      ],
      tableData: {
        headers: ["Pipeline Layer", "Subsystem", "Throughput", "Latency", "Guarantee"],
        rows: [
          ["Layer 1", "FASTA/GenBank Parser", "50,000 bp / construct", "< 25 ms", "100% In-Frame Modulo-3"],
          ["Layer 2", "HKDF Carrier PRNG", "256-bit Key Entropy", "< 1.2 ms", "Anti-Clustering Spacing ≥ 12 nt"],
          ["Layer 3", "Reed-Solomon RS(16,8)", "16-byte Codewords", "< 0.4 ms", "Corrects 4 Corruptions / Tile"],
          ["Layer 4", "WGAN-GP Refiner", "128-dim k-mer space", "< 8.4 ms", "Stealth AUC ≈ 0.505"],
          ["Layer 5", "Provenance Ledger", "1,500 req / sec", "< 12 ms", "ECDSA Signed SHA-256 Seal"],
        ],
      },
    },
  },

  "sdk-cli": {
    id: "sdk-cli",
    category: "PLATFORM",
    categoryTitle: "DEVELOPER TOOLS",
    subcategory: "SDK & CLI",
    title: "Python SDK & CLI Reference",
    readingTime: "3 min read",
    lead: "Command-line and programmatic interface for batch DNA watermarking, reverse decoding, mutation stress testing, and registry ledger queries.",
    badges: ["CLI", "Python 3.10+", "POSIX & Windows"],
    content: {
      overviewText: "The `helixsign` CLI provides terminal utilities for bioinformaticians and synthesis pipeline engineers to stamp FASTA files, run the Attacker Arena, and verify suspect genomic strains.",
      keyPoints: [
        { title: "helixsign stamp", description: "Embeds encrypted ownership watermark into target FASTA file." },
        { title: "helixsign verify", description: "Authenticates suspect FASTA sequence against secret key and provenance ledger." },
        { title: "helixsign redteam", description: "Executes adversarial mutation suite (shuffling, trimming, point drift) to verify resilience." },
      ],
      codeSnippets: {
        python: `# Programmatic batch stamping
from helixsign import BatchStamper

stamper = BatchStamper(key=b"secret-seed-key", host="ecoli_k12")
results = stamper.stamp_directory("./constructs/", output_dir="./stamped/")

for res in results:
    print(f"Construct {res.name}: {res.protein_identity:.0%} match, {res.status}")`,
        curl: `# Install HelixSign CLI
pip install helixsign-cli

# Stamp an E. coli gene
helixsign stamp --input lacZ.fasta --owner "ApexBio Lab" --output lacZ_stamped.fasta

# Red-team verify under 15% synonymous shuffling
helixsign redteam --input lacZ_stamped.fasta --attack shuffle --intensity 0.15`,
      },
    },
  },

  "takens-embedding": {
    id: "takens-embedding",
    category: "PIPELINE CORE",
    categoryTitle: "THEORETICAL FOUNDATION",
    subcategory: "MATHEMATICAL FORMULATION",
    title: "Codon Degeneracy Manifolds",
    readingTime: "4 min read",
    lead: "Mathematical framing of the synonymous codon manifold as a discrete topological space where degenerate codons map to identical amino acid coordinates.",
    badges: ["Synonymous Degeneracy", "Table 11", "Information Theory"],
    content: {
      overviewText: "Because the standard genetic code maps 64 codons to only 20 amino acids and 3 stop signals, amino acids such as Leucine, Arginine, and Serine possess 6-fold codon degeneracy. HelixSign models this redundancy as a geometric manifold where transitions between degenerate states preserve 100% of the primary peptide chain.",
      mathFormula: {
        title: "Synonymous Shannon Capacity",
        formula: "C = \\sum_{i=1}^L \\log_2(d_i), \\quad d_i \\in \\{1, 2, 3, 4, 6\\}",
        explanation: "Where L is the codon length of the open reading frame and d_i represents the synonymous degeneracy of amino acid residue i.",
      },
    },
  },

  "vietoris-rips": {
    id: "vietoris-rips",
    category: "PIPELINE CORE",
    categoryTitle: "TOPOLOGY ENGINE",
    subcategory: "ALGORITHMIC CORE",
    title: "Vietoris-Rips Persistent Homology",
    readingTime: "4 min read",
    lead: "Multi-scale topological simplicial complex filtration over codon embeddings using Ripser to isolate persistent synonymous loops.",
    badges: ["Ripser C++", "Betti Invariants", "Persistence Diagrams"],
    content: {
      overviewText: "By constructing Vietoris-Rips simplicial complexes across codon frequency vectors, HelixSign monitors the persistence of 1D topological cycles (H₁). Watermarked constructs exhibit persistent 1D loops across filtration parameter ε ∈ [0.25, 0.80] that confirm watermark presence while wildtype control sequences lack persistent loop structures.",
      mathFormula: {
        title: "Vietoris-Rips Filtration Condition",
        formula: "\\sigma = [v_0, \\dots, v_k] \\in \\mathrm{VR}_\\epsilon(X) \\iff \\max_{0 \\le i < j \\le k} \\|v_i - v_j\\| \\le \\epsilon",
        explanation: "Simplex σ is formed whenever all pairwise distances between codon coordinate vectors do not exceed metric scale ε.",
      },
    },
  },

  "betti-curves": {
    id: "betti-curves",
    category: "PIPELINE CORE",
    categoryTitle: "TOPOLOGY ENGINE",
    subcategory: "FEATURE EXTRACTION",
    title: "Betti Invariants & Persistence Barcodes",
    readingTime: "3 min read",
    lead: "Summarizing multi-scale topological features into fixed-length 128-dimensional Betti curve representations and persistence entropy metrics.",
    badges: ["Betti Numbers", "Persistence Landscapes", "Entropy"],
    content: {
      overviewText: "Persistent homology outputs irregular point clouds of birth-death coordinates. HelixSign vectorizes these into fixed-dimension Betti curves β₀(ε) and β₁(ε) for downstream machine learning validation and biophysical stability checks.",
    },
  },

  "wave-localization": {
    id: "wave-localization",
    category: "PIPELINE CORE",
    categoryTitle: "CRYPTOGRAPHY",
    subcategory: "CARRIER MAPPING",
    title: "Genomic Carrier Locus Mapping",
    readingTime: "3 min read",
    lead: "RFC 5869 HKDF-SHA256 keyed pseudo-random carrier locus selection ensuring uniform sequence dispersion and anti-clustering guarantees.",
    badges: ["HKDF-SHA256", "Carrier Permuter", "Spacing ≥ 12 nt"],
    content: {
      overviewText: "To prevent localized sequence tampering and avoid altering secondary mRNA hairpins, HelixSign distributes watermark bits uniformly across open reading frames. Keyed PRNG selection ensures that adversaries without the secret key cannot identify which synonymous codons carry watermark data.",
    },
  },

  "wgan-stealth": {
    id: "wgan-stealth",
    category: "PIPELINE CORE",
    categoryTitle: "MACHINE LEARNING",
    subcategory: "ADVERSARIAL STEALTH",
    title: "WGAN-GP Adversarial Stealth Refiner",
    readingTime: "4 min read",
    lead: "Wasserstein GAN critic network with gradient penalty (λ = 10) optimizing synonymous codon choices to match host k-mer frequency distributions.",
    badges: ["WGAN-GP", "MMD Tuning", "Stealth AUC ≈ 0.505"],
    content: {
      overviewText: "Naive watermarks get caught by machine learning detectors with near 100% confidence. HelixSign trains a WGAN-GP critic network on E. coli K-12 RefSeq CDS libraries to adversarially minimize Maximum Mean Discrepancy (MMD) across 3-mer and 4-mer spectra, driving detector classification AUC to chance level (0.505).",
    },
  },

  "model-benchmarks": {
    id: "model-benchmarks",
    category: "PIPELINE CORE",
    categoryTitle: "BENCHMARKING",
    subcategory: "VALIDATION",
    title: "Stealth & Resilience Benchmark Matrix",
    readingTime: "3 min read",
    lead: "Comprehensive quantitative matrix comparing HelixSign against Naive Codebook Tagging and Exogenous Barcode insertions across protein identity, detector AUC, and noise resilience.",
    badges: ["Benchmarking", "Cross-Validation", "XGBoost & 1D CNN"],
    content: {
      overviewText: "Evaluated across 4,312 E. coli K-12 genes and synthetic BioBrick standards. HelixSign outperforms all existing techniques by providing simultaneous 100% protein invariance, chance-level detector stealth, and 99.4% recovery under biological mutation noise.",
    },
  },

  "api-reference": {
    id: "api-reference",
    category: "INTERFACES & SPECIFICATIONS",
    categoryTitle: "API REFERENCE",
    subcategory: "REST & WEBSOCKET",
    title: "REST & Streaming API Reference",
    readingTime: "4 min read",
    lead: "Complete OpenAPI 3.1 specification for HelixSign endpoints: /stamp, /verify, /stealth, /stress, and /registry.",
    badges: ["OpenAPI 3.1", "FastAPI", "JSON Schema"],
    content: {
      overviewText: "All endpoints accept JSON payloads and return ISO 8601 timestamps, SHA-256 integrity digests, and verified protein identity proofs.",
    },
  },

  "data-contracts": {
    id: "data-contracts",
    category: "INTERFACES & SPECIFICATIONS",
    categoryTitle: "DATA CONTRACTS",
    subcategory: "SCHEMAS",
    title: "Provenance Data Schemas",
    readingTime: "3 min read",
    lead: "JSON Schema definitions for StampedConstruct, ProvenanceCertificate, and CarrierLocus records.",
    badges: ["JSON Schema", "Pydantic v2", "TypeScript Types"],
    content: {
      overviewText: "Strict typing contracts shared between frontend, backend, and machine learning microservices.",
    },
  },

  "sensor-hardware": {
    id: "sensor-hardware",
    category: "INTERFACES & SPECIFICATIONS",
    categoryTitle: "BIO-SPECIFICATIONS",
    subcategory: "TRANSLATION CODECS",
    title: "Host Biosecurity & Translation Codecs",
    readingTime: "3 min read",
    lead: "NCBI Translation Table 11 (Bacterial/Archaeal), Table 1 (Standard Eukaryotic), and host organism codon adaptation tables.",
    badges: ["Table 11", "RefSeq NC_000913.3", "Codon Bias"],
    content: {
      overviewText: "Detailed reference of host organism codon usage frequencies, relative adaptiveness tables, and ribosomal translation rates.",
    },
  },

  "ndt-compliance": {
    id: "ndt-compliance",
    category: "INTERFACES & SPECIFICATIONS",
    categoryTitle: "GOVERNANCE",
    subcategory: "COMPLIANCE",
    title: "IBC & ISO/IEC 27001 Standards",
    readingTime: "3 min read",
    lead: "Institutional Biosafety Committee (IBC) screening protocols, biosecurity compliance, and ISO/IEC 27001 audit ledger standards.",
    badges: ["IBC Protocol", "ISO/IEC 27001", "Biosecurity"],
    content: {
      overviewText: "Guidelines for biosecurity compliance, screening against dual-use pathogen select agent databases, and generating legally defensible biological IP audit trails.",
    },
  },
};
