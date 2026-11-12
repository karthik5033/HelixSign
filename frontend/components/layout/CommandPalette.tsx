"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Cpu,
  Layers,
  Activity,
  Sliders,
  Radio,
  FileText,
  Database,
  Crosshair,
  Sparkles,
  ShieldAlert,
  Clock,
  Compass,
  Zap,
  Terminal,
  BookOpen,
  ArrowRight,
  X,
  Hash,
  Waves,
  Shield,
  FileCode,
  GitCompare,
  Dna,
  ShieldCheck,
  Lock,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface DeepSearchItem {
  id: string;
  title: string;
  description: string;
  href: string;
  category: "Steganographic Pipeline" | "Codon Manifolds & AI" | "Cryptographic Codecs" | "Genomic Constructs" | "Datasets & Provenance" | "Forensics & Audit" | "Architecture & Docs";
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
}

export const DEEP_SEARCH_INDEX: DeepSearchItem[] = [
  // --------------------------------------------------------------------------
  // STEGANOGRAPHIC PIPELINE
  // --------------------------------------------------------------------------
  {
    id: "algo-takens",
    title: "Codon Delay-Coordinate Embedding (τ=4, d=3)",
    description: "Reconstructs codon state space attractor from synonymous sequence transitions across open reading frames",
    href: "/analysis?tab=takens",
    category: "Steganographic Pipeline",
    keywords: ["takens", "delay", "tau", "phase space", "embedding", "dimension", "codon", "attractor", "coordinates"],
    icon: Cpu,
    tag: "τ=4 codons",
  },
  {
    id: "algo-persistent-homology",
    title: "Persistent Homology & Vietoris-Rips Complex",
    description: "Multi-scale topological features and persistent H₁ loops capturing synonymous degeneracy manifolds via Ripser",
    href: "/analysis?tab=topology",
    category: "Steganographic Pipeline",
    keywords: ["betti", "homology", "persistent", "vietoris-rips", "ripser", "h0", "h1", "filtration", "barcode", "topological"],
    icon: Sparkles,
    tag: "Ripser VR",
  },
  {
    id: "algo-carrier-locus",
    title: "Carrier Locus & Codon Architecture Mapping",
    description: "High-resolution genomic architecture track displaying HKDF-keyed synonymous carrier codons across CDS",
    href: "/localization",
    category: "Steganographic Pipeline",
    keywords: ["carrier", "locus", "codon mapping", "genomic architecture", "open reading frame", "cai", "promoter"],
    icon: Dna,
    tag: "64 Loci",
  },
  {
    id: "algo-invariance-proof",
    title: "Primary Sequence Translation Verification",
    description: "Mathematical and biochemical verification confirming 0.00% amino acid alterations across stamped constructs",
    href: "/analysis?tab=overview",
    category: "Steganographic Pipeline",
    keywords: ["protein identity", "invariance", "amino acid", "zero drift", "translation", "synonymous proof"],
    icon: ShieldCheck,
    tag: "Verified",
  },

  // --------------------------------------------------------------------------
  // CODON MANIFOLDS & AI
  // --------------------------------------------------------------------------
  {
    id: "ai-wgan-gp",
    title: "WGAN-GP Realistic Sequence Synthesizer",
    description: "Wasserstein-1 generator matching host k-mer distribution with gradient penalty (λ=10) for detector stealth",
    href: "/topology-engine",
    category: "Codon Manifolds & AI",
    keywords: ["wgan", "wgan-gp", "wasserstein", "gradient penalty", "generator", "discriminator", "k-mer", "stealth"],
    icon: Zap,
    tag: "W₁ = 0.012",
  },
  {
    id: "ai-stealth-bench",
    title: "Stealth Benchmarking vs AI Detectors (AUC ~ 0.505)",
    description: "Empirical evaluation proving indistinguishability from wildtype host DNA against XGBoost, 1D CNN, and ESM-2",
    href: "/compare",
    category: "Codon Manifolds & AI",
    keywords: ["stealth", "ai detector", "auc", "roc", "xgboost", "cnn", "esm-2", "benchmarking", "classifier"],
    icon: GitCompare,
    tag: "AUC = 0.505",
  },
  {
    id: "ai-cai-engine",
    title: "Host Codon Adaptation Index (CAI) Optimizer",
    description: "Quantifies translational efficiency and ribosome pause avoidance (ΔCAI ≤ 0.015) in E. coli and yeast",
    href: "/settings?tab=crypto",
    category: "Codon Manifolds & AI",
    keywords: ["cai", "codon adaptation", "relative adaptiveness", "ribosome", "translation", "host efficiency"],
    icon: Sliders,
    tag: "CAI = 0.988",
  },
  {
    id: "ai-homopolymer-filter",
    title: "Homopolymer Run Length Ceiling Filter",
    description: "Rejects consecutive identical nucleotides ≥ 4 bp to prevent Nanopore and Illumina sequencing indels",
    href: "/settings?tab=crypto",
    category: "Codon Manifolds & AI",
    keywords: ["homopolymer", "run length", "nanopore", "illumina", "sequencing", "slippage", "filter"],
    icon: Shield,
    tag: "Max 3 bp",
  },

  // --------------------------------------------------------------------------
  // CRYPTOGRAPHIC CODECS
  // --------------------------------------------------------------------------
  {
    id: "crypto-rs-codec",
    title: "Reed-Solomon RS(16,8) GF(2⁸) Error Correction",
    description: "Corrects up to 4 symbol errors per 16-symbol codeword under simulated biological mutation channels",
    href: "/monitor",
    category: "Cryptographic Codecs",
    keywords: ["reed-solomon", "rs", "ecc", "gf(2^8)", "galois field", "berlekamp-massey", "error correction", "parity"],
    icon: Lock,
    tag: "RS(16,8) GF(2⁸)",
  },
  {
    id: "crypto-hkdf",
    title: "HKDF-SHA256 Keyed PRNG Carrier Allocation",
    description: "Cryptographic pseudorandom expansion ensuring carrier positions cannot be located without private secret key",
    href: "/settings?tab=crypto",
    category: "Cryptographic Codecs",
    keywords: ["hkdf", "sha256", "prng", "salt", "secret key", "permutation", "cryptographic stealth"],
    icon: Lock,
    tag: "RFC 5869",
  },
  {
    id: "crypto-ecdsa",
    title: "ECDSA P-256 Digital Provenance Signatures",
    description: "Cryptographic owner signatures guaranteeing non-repudiation and legal auditability of biological assets",
    href: "/settings?tab=profile",
    category: "Cryptographic Codecs",
    keywords: ["ecdsa", "p-256", "signature", "public key", "ownership", "non-repudiation", "audit"],
    icon: ShieldCheck,
    tag: "P-256 Signature",
  },

  // --------------------------------------------------------------------------
  // GENOMIC CONSTRUCTS
  // --------------------------------------------------------------------------
  {
    id: "gen-lacz",
    title: "Construct pUC19-lacZ β-Galactosidase (3,075 bp)",
    description: "High-expression bacterial benchmark construct with 64 verified synonymous carrier loci",
    href: "/analysis?run=HS-7402",
    category: "Genomic Constructs",
    keywords: ["lacz", "beta-galactosidase", "puc19", "3075 bp", "e. coli", "hs-7402", "benchmark"],
    icon: Dna,
    tag: "3,075 bp CDS",
  },
  {
    id: "gen-cas9",
    title: "Construct px458-SpCas9 Endonuclease (4,104 bp)",
    description: "Multi-tile protected CRISPR gene editing construct with 128 carrier loci and sequence fidelity",
    href: "/analysis?run=HS-7400",
    category: "Genomic Constructs",
    keywords: ["cas9", "spcas9", "crispr", "endonuclease", "px458", "4104 bp", "hs-7400"],
    icon: Dna,
    tag: "4,104 bp CDS",
  },
  {
    id: "gen-gfp",
    title: "Construct pGLO-GFP Reporter Cassette (717 bp)",
    description: "Superfolder fluorophore construct surviving 15% adversarial synonymous shuffling attacks",
    href: "/analysis?run=HS-7401",
    category: "Genomic Constructs",
    keywords: ["gfp", "sfgfp", "pglo", "reporter", "717 bp", "hs-7401", "fluorescence"],
    icon: Dna,
    tag: "717 bp CDS",
  },
  {
    id: "gen-puc19",
    title: "Construct pUC19 AmpR β-Lactamase (861 bp)",
    description: "Antibiotic resistance marker with 32 carrier loci and strict active-site catalytic preservation",
    href: "/upload",
    category: "Genomic Constructs",
    keywords: ["puc19", "ampr", "beta-lactamase", "bla", "861 bp", "cloning vector"],
    icon: Dna,
    tag: "861 bp CDS",
  },

  // --------------------------------------------------------------------------
  // DATASETS & PROVENANCE
  // --------------------------------------------------------------------------
  {
    id: "ds-ecoli",
    title: "E. coli K-12 MG1655 Annotated CDS Library",
    description: "4,312 annotated open reading frames from NCBI RefSeq reference genome (NC_000913.3)",
    href: "/datasets",
    category: "Datasets & Provenance",
    keywords: ["e. coli", "k-12", "mg1655", "refseq", "cds library", "fasta", "genbank", "ncbi"],
    icon: Database,
    tag: "4,312 Genes",
  },
  {
    id: "ds-biobrick",
    title: "Synthetic Biology BioBrick Standard Registry",
    description: "Standardized biological parts and genetic devices cataloged for steganographic capacity estimation",
    href: "/datasets",
    category: "Datasets & Provenance",
    keywords: ["biobrick", "registry", "standard parts", "synthetic biology", "parts catalog"],
    icon: Database,
    tag: "1,240 Parts",
  },
  {
    id: "ds-yeast",
    title: "S. cerevisiae S288C Eukaryotic Genome Library",
    description: "6,607 eukaryotic yeast protein-coding genes evaluated under Table 4 translation codec",
    href: "/datasets",
    category: "Datasets & Provenance",
    keywords: ["yeast", "saccharomyces", "s288c", "eukaryotic", "table 4", "6607 genes"],
    icon: Database,
    tag: "6,607 Genes",
  },

  // --------------------------------------------------------------------------
  // FORENSICS & AUDIT
  // --------------------------------------------------------------------------
  {
    id: "rep-002",
    title: "Provenance Certificate: pUC19-lacZ (HS-7402)",
    description: "Official provenance certificate documenting translation fidelity and 64-bit cryptographic ownership",
    href: "/reports",
    category: "Forensics & Audit",
    keywords: ["certificate", "provenance report", "hs-7402", "lacz", "pdf certificate", "sha256 hash"],
    icon: FileText,
    tag: "Verified",
  },
  {
    id: "rep-001",
    title: "Forensic Audit: Attacker Synonymous Shuffle Trace",
    description: "Forensic analysis tracing unauthorized sequence modification back to registered IP licensee",
    href: "/reports",
    category: "Forensics & Audit",
    keywords: ["forensic audit", "shuffle trace", "tamper detection", "ip infringement", "stolen sample"],
    icon: FileText,
    tag: "Forensic Trace",
  },

  // --------------------------------------------------------------------------
  // ARCHITECTURE & DEVELOPER DOCUMENTATION
  // --------------------------------------------------------------------------
  {
    id: "arch-topology",
    title: "System Topology & Security Architecture",
    description: "Construct Ingestion layer, WGAN-GP Refiner, Reed-Solomon Codec, and Provenance Registry",
    href: "/architecture",
    category: "Architecture & Docs",
    keywords: ["architecture", "topology", "system blueprint", "layers", "stego engine", "system design"],
    icon: Layers,
    tag: "Security Blueprint",
  },
  {
    id: "docs-api",
    title: "REST & Webhook API Reference",
    description: "Endpoints for sequence stamping, watermark decoding, and biosecurity screening webhooks",
    href: "/docs",
    category: "Architecture & Docs",
    keywords: ["api", "rest api", "webhook", "endpoints", "curl", "python client", "docs"],
    icon: Terminal,
    tag: "API Reference",
  },
];

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on Escape or ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search Filtering
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    return DEEP_SEARCH_INDEX.filter((item) => {
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      if (item.title.toLowerCase().includes(q)) return true;
      if (item.description.toLowerCase().includes(q)) return true;
      if (item.category.toLowerCase().includes(q)) return true;
      return item.keywords.some((kw) => kw.toLowerCase().includes(q));
    });
  }, [query, selectedCategory]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults.length, query, selectedCategory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === "Enter" && filteredResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredResults[selectedIndex].href);
    }
  };

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  if (!isOpen) return null;

  const categories = [
    "ALL",
    "Steganographic Pipeline",
    "Codon Manifolds & AI",
    "Cryptographic Codecs",
    "Genomic Constructs",
    "Datasets & Provenance",
    "Forensics & Audit",
    "Architecture & Docs",
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 bg-black/75 backdrop-blur-md px-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-border bg-[#141419] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/80 bg-muted/20">
          <Search className="h-4 w-4 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search constructs, carrier codons, Reed-Solomon, WGAN-GP, CAI, audit reports..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-border text-[10px] font-mono text-muted-foreground bg-muted/40">
            ESC
          </kbd>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border/40 overflow-x-auto text-[11px] font-mono bg-[#111116] shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#FF5500] text-white font-bold"
                  : "bg-muted/30 text-muted-foreground hover:text-foreground border border-border/50"
              }`}
            >
              {cat === "ALL" ? "All Results" : cat}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="overflow-y-auto p-2 space-y-1 flex-1">
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs font-mono">
              No matching biological constructs, codecs, or pipelines found for &quot;{query}&quot;.
            </div>
          ) : (
            filteredResults.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-transparent hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate">{item.title}</span>
                        {item.tag && (
                          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground border border-border/40 shrink-0">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
                      {item.category}
                    </span>
                    <ArrowRight
                      className={`h-3.5 w-3.5 transition-transform ${
                        isSelected ? "translate-x-0.5 text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/50 bg-[#111116] flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>&uarr;&darr; to navigate</span>
            <span>&crarr; to select</span>
            <span>ESC to close</span>
          </div>
          <span className="text-primary font-bold">HelixSign Deep Search</span>
        </div>
      </div>
    </div>
  );
}
