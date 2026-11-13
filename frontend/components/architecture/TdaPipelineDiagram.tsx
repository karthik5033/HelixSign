"use client";

import React, { useState, useMemo } from "react";
import {
  Share2,
  Brain,
  Zap,
  ArrowRight,
  Layers,
  Crosshair,
  Check,
  Copy,
  ChevronRight,
  Sparkles,
  Sliders,
  Filter,
  Activity,
  ShieldCheck,
  Database,
  Radio,
  FileCode,
  CheckCircle2,
} from "lucide-react";

export interface PipelineNode {
  id: string;
  label: string;
  category: "ingestion" | "embedding" | "tda" | "vectorizer" | "ml" | "spatial";
  chip: string;
  subLabel: string;
  badge: string;
  math: string;
  desc: string;
  inbound: string[];
  outbound: string[];
  latency: string;
  tensorShape: string;
  codeSnippet: string;
  pipelineGroup: "tda" | "spatial" | "ingest" | "consensus";
}

export const NODES: Record<string, PipelineNode> = {
  ingest: {
    id: "ingest",
    label: "FASTA Sequence & CDS Parser",
    category: "ingestion",
    chip: "CDS",
    subLabel: "NCBI RefSeq & Table 11",
    badge: "50,000 bp • Modulo-3 In-Frame",
    math: "s \\in \\{A, C, G, T\\}^N, \\quad N \\equiv 0 \\pmod 3, \\quad s[0:3] = \\text{ATG}",
    desc: "Ingests raw coding sequences in FASTA/GenBank format, performs strict open reading frame (ORF) validation, and extracts codon reading frames under standard bacterial Translation Table 11.",
    inbound: [],
    outbound: ["dma"],
    latency: "1.2 ms",
    tensorShape: "(N/3, 3) codon tuples",
    codeSnippet: "codons, protein = parse_cds_fasta(sequence_str, table=11)",
    pipelineGroup: "ingest",
  },
  dma: {
    id: "dma",
    label: "Codon Adaptation Profiler",
    category: "ingestion",
    chip: "CAI",
    subLabel: "Host Relative Adaptiveness",
    badge: "w_i ≥ 0.85 • Zero Toxicity",
    math: "\\mathrm{CAI} = \\left( \\prod_{i=1}^L w_i \\right)^{1/L}, \\quad w_i = \\frac{f_i}{\\max f_j}",
    desc: "Calculates host codon adaptation index (CAI) baseline across E. coli K-12 genes. Enforces strict viability filter requiring all carrier substitution codons to maintain w_i ≥ 0.85 to avoid metabolic drag.",
    inbound: ["ingest"],
    outbound: ["bandpass", "onset"],
    latency: "0.4 ms",
    tensorShape: "(N/3,) adaptiveness float32",
    codeSnippet: "cai_profile = compute_cai_profile(codons, host_ref='NC_000913.3')",
    pipelineGroup: "ingest",
  },
  bandpass: {
    id: "bandpass",
    label: "Synonymous Capacity Meter",
    category: "ingestion",
    chip: "CAP",
    subLabel: "Degeneracy Entropy (d_i)",
    badge: "Capacity C ≥ 240 Bits",
    math: "C = \\sum_{i=1}^L \\log_2(d_i), \\quad d_i \\in \\{1, 2, 3, 4, 6\\}",
    desc: "Evaluates the theoretical Shannon steganographic capacity based on synonymous codon degeneracy. Filters out non-degenerate amino acids (Met, Trp) and flags carrier candidate positions.",
    inbound: ["dma"],
    outbound: ["ami_fnn"],
    latency: "0.8 ms",
    tensorShape: "(N/3,) degeneracy int8",
    codeSnippet: "capacity_bits = calculate_synonymous_capacity(codons)",
    pipelineGroup: "tda",
  },
  onset: {
    id: "onset",
    label: "RFC 5869 HKDF Key Derivation",
    category: "spatial",
    chip: "HKDF",
    subLabel: "SHA-256 Keyed PRNG",
    badge: "256-Bit Entropy • Salted",
    math: "\\mathrm{PRK} = \\mathrm{HMAC\\text{-}Hash}(\\mathrm{salt}, \\mathrm{IKM}), \\quad \\mathrm{OKM} = \\mathrm{Expand}(\\mathrm{PRK}, \\mathrm{info}, L)",
    desc: "Derives cryptographic pseudo-random carrier locus selection stream using HMAC-based Extract-and-Expand Key Derivation with biological salt, preventing unauthorized carrier detection.",
    inbound: ["dma"],
    outbound: ["solver"],
    latency: "1.4 ms",
    tensorShape: "32-byte derived key entropy",
    codeSnippet: "prng_seed = hkdf_sha256(secret_key, salt=b'helixsign', length=32)",
    pipelineGroup: "spatial",
  },
  ami_fnn: {
    id: "ami_fnn",
    label: "Carrier Locus Permuter",
    category: "embedding",
    chip: "π(k)",
    subLabel: "Anti-Clustering Distribution",
    badge: "Uniform Spread • Spacing ≥ 12 nt",
    math: "\\pi \\in \\mathcal{S}_M, \\quad |\\pi(i) - \\pi(j)| \\ge \\Delta_{\\min} \\; \\forall i \\neq j",
    desc: "Spreads carrier codon allocations uniformly across the entire open reading frame. Enforces minimum spatial spacing (≥ 12 nt) to prevent dense mutation clustering and avoid destabilizing RNA secondary structure.",
    inbound: ["bandpass"],
    outbound: ["takens"],
    latency: "1.6 ms",
    tensorShape: "(M,) carrier locus indices [int32]",
    codeSnippet: "carrier_loci = generate_dispersed_loci(prng_seed, capacity, min_spacing=4)",
    pipelineGroup: "tda",
  },
  solver: {
    id: "solver",
    label: "Biophysical Viability Filter",
    category: "spatial",
    chip: "BIO",
    subLabel: "Homopolymer & GC Bounds",
    badge: "Poly ≤ 4 bp • ΔGC ≤ ±2.0%",
    math: "\\mathrm{HP}_{\\max} \\le 4\\text{ bp}, \\quad |\\mathrm{GC}_{\\text{after}} - \\mathrm{GC}_{\\text{orig}}| \\le 2.0\\%",
    desc: "Screening gate verifying that synonymous substitutions do not introduce homopolymer runs (> 4 bp) or alter local GC skew, ensuring 100% synthesis viability on Twist / IDT platforms.",
    inbound: ["onset"],
    outbound: ["alert"],
    latency: "2.1 ms",
    tensorShape: "ViabilityMetrics (cai_delta, gc_delta, max_poly)",
    codeSnippet: "assert passes_biophysical_filters(stamped_codons, max_poly=4, max_dgc=0.02)",
    pipelineGroup: "spatial",
  },
  takens: {
    id: "takens",
    label: "Galois Field RS(16,8) Codec",
    category: "embedding",
    chip: "GF",
    subLabel: "Reed-Solomon ECC Tiles",
    badge: "t = 4 Symbol Errors Corrected",
    math: "\\mathrm{RS}(n=16, k=8), \\quad t = \\lfloor(n-k)/2\\rfloor = 4 \\text{ in } GF(2^8)",
    desc: "Encodes provenance payload into interleaved 16-symbol Galois Field codewords. Each tile corrects up to 4 symbol corruptions, guaranteeing error-free recovery after mutagenic drift or PCR amplification.",
    inbound: ["ami_fnn"],
    outbound: ["gudhi"],
    latency: "1.8 ms",
    tensorShape: "(T, 16) byte arrays [GF(2^8)]",
    codeSnippet: "rs = RSCodec(8); codeword_tiles = [rs.encode(tile) for tile in payload_tiles]",
    pipelineGroup: "tda",
  },
  gudhi: {
    id: "gudhi",
    label: "Ripser Codon Manifold Engine",
    category: "tda",
    chip: "VR",
    subLabel: "Simplicial Degeneracy Complex",
    badge: "Vietoris-Rips ε ≤ 0.85",
    math: "\\sigma \\in \\mathrm{VR}_\\epsilon(X) \\iff \\max_{i < j} \\|\\mathbf{v}_i - \\mathbf{v}_j\\| \\le \\epsilon",
    desc: "Constructs multi-scale simplicial complexes over synonymous codon space via Ripser edge reduction, capturing topological invariants between degenerate synonymous codon trajectories.",
    inbound: ["takens"],
    outbound: ["homology"],
    latency: "8.4 ms",
    tensorShape: "SimplexTree (synonymous codon coordinate cloud)",
    codeSnippet: "rips = gudhi.RipsComplex(points=codon_embeddings, max_edge_length=0.85)\nsimplex_tree = rips.create_simplex_tree(max_dimension=2)",
    pipelineGroup: "tda",
  },
  homology: {
    id: "homology",
    label: "Persistent Homology Pairs (H₀/H₁)",
    category: "tda",
    chip: "H₁",
    subLabel: "Birth-Death Codon Invariants",
    badge: "Persistent Degeneracy Loops (ℓ ≥ 0.82)",
    math: "H_0\\text{ (codon clusters)},\\; H_1\\text{ (synonymous loops)}, \\quad \\ell_i = d_i - b_i",
    desc: "Extracts scale-invariant 0D cluster components (H0) and 1D persistent circular tunnels (H1). Transient codon noise dies at ell < 0.25; true watermark-carrying synonymous manifolds maintain stable loops (ell > 0.80).",
    inbound: ["gudhi"],
    outbound: ["vectorizer"],
    latency: "1.5 ms",
    tensorShape: "H0: (64, 2), H1: (16, 2) [birth, death]",
    codeSnippet: "diag = simplex_tree.persistence()\nh1_loops = [p[1] for p in diag if p[0] == 1]",
    pipelineGroup: "tda",
  },
  vectorizer: {
    id: "vectorizer",
    label: "Topological Vectorizer (Φ ∈ ℝ¹²⁸)",
    category: "vectorizer",
    chip: "128D",
    subLabel: "Betti Curves & Manifolds",
    badge: "Betti Curves • Landscapes • Entropy",
    math: "\\beta_1(\\epsilon) = \\sum_{i=1}^{N_1} \\mathbb{I}(b_i \\le \\epsilon < d_i), \\quad E(D) = -\\sum p_i \\ln p_i",
    desc: "Transforms persistent homology diagrams into fixed-length 128-dimensional Euclidean feature vectors: 50-step Betti-0/1 functional curves, 5-layer persistence landscapes, and persistent entropy.",
    inbound: ["homology"],
    outbound: ["classifier", "bocd", "autoencoder"],
    latency: "1.2 ms",
    tensorShape: "(128,) float32 dense vector",
    codeSnippet: "phi = vectorize_persistence(diag, betti_steps=50, landscape_layers=5)",
    pipelineGroup: "tda",
  },
  classifier: {
    id: "classifier",
    label: "Invariant Translation Verifier",
    category: "ml",
    chip: "AA",
    subLabel: "Sequence Invariance Proof",
    badge: "0 Amino Acid Mutations",
    math: "\\mathrm{Translate}(S_{\\text{stamped}}) \\equiv \\mathrm{Translate}(S_{\\text{orig}})",
    desc: "Translates the stamped nucleotide sequence back into amino acids and executes in silico peptide alignment against the wildtype target. Strictly guarantees 0 amino acid substitutions (100.0% protein identity).",
    inbound: ["vectorizer"],
    outbound: ["alert"],
    latency: "0.6 ms",
    tensorShape: "IdentityProof (exact_match: bool, mutations: 0)",
    codeSnippet: "assert translate(stamped_seq) == translate(orig_seq), 'Identity mismatch'",
    pipelineGroup: "consensus",
  },
  bocd: {
    id: "bocd",
    label: "WGAN-GP Adversarial Refiner",
    category: "ml",
    chip: "WGAN",
    subLabel: "Gradient Penalty Critic (λ=10)",
    badge: "Stealth AUC ≈ 0.505 (Chance)",
    math: "\\min_G \\max_{D \\in \\mathcal{D}} \\mathbb{E}[D(x)] - \\mathbb{E}[D(G(z))] - \\lambda \\mathbb{E}[(\\|\\nabla_{\\hat{x}} D(\\hat{x})\\|_2 - 1)^2]",
    desc: "Adversarial critic network trained on native host genome CDS distributions. Optimizes synonymous choices to match host k-mer frequencies, forcing deep learning detector discrimination AUC to chance level (0.505).",
    inbound: ["vectorizer"],
    outbound: ["alert"],
    latency: "4.8 ms",
    tensorShape: "(128,) critic logits [float32]",
    codeSnippet: "discriminator_score = wgan_critic.evaluate(stamped_kmer_profile)",
    pipelineGroup: "consensus",
  },
  autoencoder: {
    id: "autoencoder",
    label: "Channel Noise Stress Simulator",
    category: "ml",
    chip: "MC",
    subLabel: "Monte Carlo Mutation Sweep",
    badge: "100% Recovery @ 2.0% Noise",
    math: "P_{\\mathrm{rec}}(\\mu) = \\frac{1}{N_{\\mathrm{trials}}} \\sum_{k=1}^{N_{\\mathrm{trials}}} \\mathbb{I}(\\mathrm{RS}_{\\mathrm{dec}}(\\tilde{c}_k) = c_0)",
    desc: "Simulates biological passage drift and PCR replication error (0.1% to 5.0% substitution noise). Demonstrates complete 100% payload recovery within the Reed-Solomon correction margin.",
    inbound: ["vectorizer"],
    outbound: ["alert"],
    latency: "3.2 ms",
    tensorShape: "(30,) trial recovery booleans",
    codeSnippet: "recovery_rate = simulate_channel_stress(stamped_seq, noise_rate=0.02, trials=30)",
    pipelineGroup: "consensus",
  },
  alert: {
    id: "alert",
    label: "Provenance Registry & Certificate Gateway",
    category: "ml",
    chip: "LEDGER",
    subLabel: "SHA-256 Audit Seal",
    badge: "ECDSA P-256 Signed Proof",
    math: "\\sigma_{\\text{cert}} = \\mathrm{ECDSA\\text{-}Sign}_{sk}(\\mathrm{SHA256}(S_{\\text{stamped}} \\parallel \\text{Payload}))",
    desc: "Consensus gate fusing translation invariance verification, WGAN stealth proof, and Reed-Solomon codeword integrity into an immutable cryptographic certificate deposited in the HelixSign provenance ledger.",
    inbound: ["classifier", "bocd", "autoencoder", "solver"],
    outbound: [],
    latency: "1.1 ms",
    tensorShape: "CertificatePayload (hash, owner, project, batch, signature)",
    codeSnippet: "cert = issue_provenance_certificate(stamped_seq, owner, signature)",
    pipelineGroup: "consensus",
  },
};

interface NodeLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

const LAYOUTS: Record<string, NodeLayout> = {
  ingest: { x: 40, y: 100, w: 140, h: 125 },
  dma: { x: 40, y: 300, w: 140, h: 125 },
  bandpass: { x: 220, y: 180, w: 140, h: 125 },
  onset: { x: 220, y: 500, w: 140, h: 125 },
  ami_fnn: { x: 400, y: 180, w: 140, h: 125 },
  solver: { x: 400, y: 500, w: 140, h: 125 },
  takens: { x: 580, y: 100, w: 140, h: 125 },
  gudhi: { x: 580, y: 280, w: 140, h: 125 },
  homology: { x: 760, y: 180, w: 140, h: 125 },
  vectorizer: { x: 760, y: 360, w: 140, h: 125 },
  classifier: { x: 940, y: 90, w: 140, h: 120 },
  bocd: { x: 940, y: 250, w: 140, h: 120 },
  autoencoder: { x: 940, y: 410, w: 140, h: 120 },
  alert: { x: 1120, y: 250, w: 145, h: 135 },
};

interface Wire {
  id: string;
  from: string;
  to: string;
  d: string;
  label?: string;
  labelPos?: { x: number; y: number };
}

const WIRES: Wire[] = [
  {
    id: "w_ingest_dma",
    from: "ingest",
    to: "dma",
    d: "M 110 225 V 300",
    label: "10 MS/s Stream",
    labelPos: { x: 115, y: 262 },
  },
  {
    id: "w_dma_bandpass",
    from: "dma",
    to: "bandpass",
    d: "M 180 340 H 200 V 242 H 220",
    label: "Codon Stream",
    labelPos: { x: 198, y: 280 },
  },
  {
    id: "w_dma_onset",
    from: "dma",
    to: "onset",
    d: "M 110 425 V 562 H 220",
    label: "Reading Frame Bases",
    labelPos: { x: 155, y: 550 },
  },
  {
    id: "w_bandpass_ami",
    from: "bandpass",
    to: "ami_fnn",
    d: "M 360 242 H 400",
    label: "Denoised x(t)",
    labelPos: { x: 380, y: 232 },
  },
  {
    id: "w_onset_solver",
    from: "onset",
    to: "solver",
    d: "M 360 562 H 400",
    label: "Onsets Δt_ij",
    labelPos: { x: 380, y: 552 },
  },
  {
    id: "w_ami_takens",
    from: "ami_fnn",
    to: "takens",
    d: "M 540 242 H 560 V 162 H 580",
    label: "τ=4, d=3",
    labelPos: { x: 555, y: 195 },
  },
  {
    id: "w_takens_gudhi",
    from: "takens",
    to: "gudhi",
    d: "M 650 225 V 280",
    label: "Attractor R³",
    labelPos: { x: 655, y: 252 },
  },
  {
    id: "w_gudhi_homology",
    from: "gudhi",
    to: "homology",
    d: "M 720 342 H 740 V 242 H 760",
    label: "Simplex Tree",
    labelPos: { x: 738, y: 290 },
  },
  {
    id: "w_homology_vectorizer",
    from: "homology",
    to: "vectorizer",
    d: "M 830 305 V 360",
    label: "H0/H1 Pairs",
    labelPos: { x: 835, y: 332 },
  },
  {
    id: "w_vec_classifier",
    from: "vectorizer",
    to: "classifier",
    d: "M 900 422 H 920 V 150 H 940",
    label: "Φ ∈ ℝ¹²⁸",
    labelPos: { x: 928, y: 220 },
  },
  {
    id: "w_vec_bocd",
    from: "vectorizer",
    to: "bocd",
    d: "M 900 422 H 920 V 310 H 940",
    label: "Φ Vector",
    labelPos: { x: 928, y: 340 },
  },
  {
    id: "w_vec_ae",
    from: "vectorizer",
    to: "autoencoder",
    d: "M 900 422 H 920 V 470 H 940",
    label: "Φ Embedding",
    labelPos: { x: 928, y: 450 },
  },
  {
    id: "w_classifier_alert",
    from: "classifier",
    to: "alert",
    d: "M 1080 150 H 1100 V 280 H 1120",
    label: "Fracture Mode",
    labelPos: { x: 1098, y: 210 },
  },
  {
    id: "w_bocd_alert",
    from: "bocd",
    to: "alert",
    d: "M 1080 310 H 1120",
    label: "Stealth Score P(real)",
    labelPos: { x: 1095, y: 300 },
  },
  {
    id: "w_ae_alert",
    from: "autoencoder",
    to: "alert",
    d: "M 1080 470 H 1100 V 350 H 1120",
    label: "Stress Recovery",
    labelPos: { x: 1098, y: 410 },
  },
  {
    id: "w_solver_alert",
    from: "solver",
    to: "alert",
    d: "M 540 562 H 1192 V 385",
    label: "3D Coordinates [x, y, z] (±30mm)",
    labelPos: { x: 865, y: 550 },
  },
];

export function TdaPipelineDiagram() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("takens");
  const [activeView, setActiveView] = useState<"flow" | "ml_analysis" | "latency">("flow");
  const [filterGroup, setFilterGroup] = useState<"all" | "tda" | "spatial" | "consensus">("all");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const activeNode = NODES[selectedNodeId] || NODES["takens"];

  const handleCopyCode = () => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(activeNode.codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const highlightedNodeIds = useMemo(() => {
    if (filterGroup === "all") return null;
    return new Set(
      Object.values(NODES)
        .filter((n) => n.pipelineGroup === filterGroup || (filterGroup === "consensus" && (n.category === "ml" || n.category === "spatial")))
        .map((n) => n.id)
    );
  }, [filterGroup]);

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Top Navigation Bar: Flow vs Benchmark vs Latency */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-xl bg-[#0d1219] border border-[#1b2535]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveView("flow")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeView === "flow"
                ? "bg-[#182333] text-white border border-[#26374d] shadow-sm text-[#FF5500]"
                : "text-zinc-400 hover:text-white hover:bg-[#121a24]"
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-[#FF5500]" />
            <span className={activeView === "flow" ? "text-white font-semibold" : ""}>
              Interactive Architecture Flowchart
            </span>
          </button>
          <button
            onClick={() => setActiveView("ml_analysis")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeView === "ml_analysis"
                ? "bg-[#182333] text-white border border-[#26374d] shadow-sm text-[#FF5500]"
                : "text-zinc-400 hover:text-white hover:bg-[#121a24]"
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-[#FF5500]" />
            <span className={activeView === "ml_analysis" ? "text-white font-semibold" : ""}>
              ML Analysis &amp; Benchmark Metrics
            </span>
          </button>
          <button
            onClick={() => setActiveView("latency")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeView === "latency"
                ? "bg-[#182333] text-white border border-[#26374d] shadow-sm text-[#FF5500]"
                : "text-zinc-400 hover:text-white hover:bg-[#121a24]"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#FF5500]" />
            <span className={activeView === "latency" ? "text-white font-semibold" : ""}>
              Real-Time Latency Allocation (35ms Budget)
            </span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
          {activeView === "flow" && "Click any node to inspect tensor shapes, math & code"}
          {activeView === "ml_analysis" && "Comparative validation on 42,800 AE events"}
          {activeView === "latency" && "Total Turnaround: 35.0ms << 340ms Lead"}
        </span>
      </div>

      {/* ========================================================= */}
      {/* 1. NODE-GRAPH ARCHITECTURAL CANVAS (REFERENCE UI PARADIGM) */}
      {/* ========================================================= */}
      {activeView === "flow" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#1b2636] bg-[#080d14] p-4 sm:p-6 shadow-2xl relative overflow-hidden">
            {/* Top Toolbar: Legend & Filter Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#141e2c]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500]" />
                  <span className="text-sm font-semibold text-zinc-100 tracking-wide">
                    HelixSign DNA Steganography &amp; Provenance Architecture
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500 hidden md:inline">
                  Table 11 Codec • Reed-Solomon GF(2⁸) • WGAN-GP • 100% Invariance
                </span>
              </div>

              {/* Pipeline Track Filters */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-zinc-500 text-[10px] uppercase font-bold mr-1">Filter:</span>
                <button
                  onClick={() => setFilterGroup("all")}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                    filterGroup === "all"
                      ? "bg-[#FF5500] text-white font-bold shadow-sm shadow-[#FF5500]/30"
                      : "bg-[#111924] text-zinc-400 hover:text-white"
                  }`}
                >
                  All (14)
                </button>
                <button
                  onClick={() => setFilterGroup("tda")}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                    filterGroup === "tda"
                      ? "bg-[#FF5500] text-white font-bold shadow-sm shadow-[#FF5500]/30"
                      : "bg-[#111924] text-zinc-400 hover:text-white"
                  }`}
                >
                  TDA Pipeline
                </button>
                <button
                  onClick={() => setFilterGroup("spatial")}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                    filterGroup === "spatial"
                      ? "bg-[#FF5500] text-white font-bold shadow-sm shadow-[#FF5500]/30"
                      : "bg-[#111924] text-zinc-400 hover:text-white"
                  }`}
                >
                  Spatial TDoA
                </button>
                <button
                  onClick={() => setFilterGroup("consensus")}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                    filterGroup === "consensus"
                      ? "bg-[#FF5500] text-white font-bold shadow-sm shadow-[#FF5500]/30"
                      : "bg-[#111924] text-zinc-400 hover:text-white"
                  }`}
                >
                  Consensus Gate
                </button>
              </div>
            </div>

            {/* Scrollable Canvas for Diagram */}
            <div className="my-3 overflow-x-auto">
              <div
                className="relative min-w-[1280px] h-[670px] select-none rounded-xl"
                style={{
                  background:
                    "radial-gradient(#15202e 1.2px, transparent 1.2px)",
                  backgroundSize: "22px 22px",
                }}
              >
                {/* SVG Connecting Circuit Traces */}
                <svg
                  className="absolute inset-0 pointer-events-none w-full h-full"
                  viewBox="0 0 1280 670"
                  fill="none"
                >
                  <defs>
                    <marker
                      id="arrow-default"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#33475f" />
                    </marker>
                    <marker
                      id="arrow-active"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#FF5500" />
                    </marker>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="glow" />
                      <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Render Wires */}
                  {WIRES.map((wire) => {
                    const isConnected =
                      wire.from === selectedNodeId || wire.to === selectedNodeId;
                    const isDimmed =
                      highlightedNodeIds &&
                      (!highlightedNodeIds.has(wire.from) ||
                        !highlightedNodeIds.has(wire.to));

                    return (
                      <g key={wire.id} opacity={isDimmed ? 0.25 : 1}>
                        {/* Base Wire Path */}
                        <path
                          d={wire.d}
                          stroke={isConnected ? "#FF5500" : "#223144"}
                          strokeWidth={isConnected ? 2.2 : 1.4}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          markerEnd={
                            isConnected ? "url(#arrow-active)" : "url(#arrow-default)"
                          }
                          filter={isConnected ? "url(#glow)" : undefined}
                        />

                        {/* Animated Dash Particle Flow */}
                        <path
                          d={wire.d}
                          stroke={isConnected ? "#FF5500" : "#405878"}
                          strokeWidth={isConnected ? 2 : 1.2}
                          strokeDasharray="4 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-70"
                          style={{
                            animation: "pulseDash 2.5s linear infinite",
                          }}
                        />

                        {/* Optional Wire Label */}
                        {wire.label && wire.labelPos && (
                          <text
                            x={wire.labelPos.x}
                            y={wire.labelPos.y}
                            fill={isConnected ? "#FF5500" : "#627d98"}
                            fontSize="9"
                            fontFamily="monospace"
                            textAnchor="middle"
                            className="select-none font-bold"
                          >
                            {wire.label}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Render Floating Node Cards */}
                {Object.values(NODES).map((node) => {
                  const layout = LAYOUTS[node.id];
                  if (!layout) return null;

                  const isSelected = selectedNodeId === node.id;
                  const isDimmed =
                    highlightedNodeIds && !highlightedNodeIds.has(node.id);

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      style={{
                        position: "absolute",
                        left: layout.x,
                        top: layout.y,
                        width: layout.w,
                        height: layout.h,
                      }}
                      className={`group rounded-xl border transition-all duration-200 cursor-pointer select-none flex flex-col items-center justify-between p-3 ${
                        isSelected
                          ? "bg-[#111926] border-[#FF5500] shadow-[0_0_24px_rgba(255,85,0,0.35)] ring-1 ring-[#FF5500] scale-[1.03] z-20"
                          : "bg-[#0b1018]/90 border-[#1c2738] hover:border-zinc-500 hover:bg-[#101722] hover:-translate-y-0.5 z-10"
                      } ${isDimmed ? "opacity-30" : "opacity-100"}`}
                    >
                      {/* Top-Right Circular Badge Chip */}
                      <div
                        className={`absolute -top-2.5 -right-2.5 px-1.5 h-5 min-w-[20px] rounded-full flex items-center justify-center text-[9px] font-mono font-bold tracking-tight shadow-md border ${
                          isSelected
                            ? "bg-[#FF5500] text-white border-white/30 shadow-[#FF5500]/40"
                            : "bg-[#FF5500] text-white border-[#FF5500]/50"
                        }`}
                      >
                        {node.chip}
                      </div>

                      {/* Centered Dual-Tone Vector Line-Art Icon */}
                      <div className="flex items-center justify-center mt-0.5 h-10 w-10">
                        <NodeIcon nodeId={node.id} isSelected={isSelected} />
                      </div>

                      {/* Node Text Content */}
                      <div className="w-full text-center flex flex-col items-center justify-center">
                        <h4
                          className={`text-[11px] font-bold tracking-tight leading-snug line-clamp-2 ${
                            isSelected ? "text-white" : "text-zinc-200 group-hover:text-white"
                          }`}
                        >
                          {node.label}
                        </h4>
                        <span className="text-[9px] font-mono text-zinc-400 truncate max-w-full mt-0.5">
                          {node.subLabel}
                        </span>
                      </div>

                      {/* Bottom Latency Pill */}
                      <div className="w-full flex items-center justify-between border-t border-white/5 pt-1 text-[8.5px] font-mono">
                        <span className="text-zinc-500 uppercase">{node.category}</span>
                        <span
                          className={`font-semibold ${
                            isSelected ? "text-[#FF5500]" : "text-zinc-400"
                          }`}
                        >
                          {node.latency}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Legend Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#141e2c] text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#FF5500] inline-flex items-center justify-center text-[7px] text-white font-bold">
                    R
                  </span>
                  <span>Parameter Chip</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-[#FF5500] inline-block" />
                  <span>Active Circuit Flow</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-[#223144] inline-block" />
                  <span>Zero-Copy Stream</span>
                </span>
              </div>
              <span className="text-zinc-500 text-[10px]">
                Active Node: <strong className="text-white">{activeNode.label}</strong> ({activeNode.latency})
              </span>
            </div>
          </div>

          {/* Detailed Node Inspector Drawer */}
          <div className="rounded-xl border border-[#1b2636] bg-[#0d121a] p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#16212e]">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#FF5500]">
                  Node Specification Inspector
                </span>
                <h3 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                  <span>{activeNode.label}</span>
                  <span className="text-xs font-mono font-normal text-zinc-300 px-2 py-0.5 rounded bg-[#16202c] border border-[#223144]">
                    {activeNode.badge}
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                <span>
                  Latency: <strong className="text-white">{activeNode.latency}</strong>
                </span>
                <span>•</span>
                <span>
                  Shape: <strong className="text-white">{activeNode.tensorShape}</strong>
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
              {activeNode.desc}
            </p>

            {/* Formula Block */}
            <div className="rounded-lg border border-[#1f2c3d] bg-[#080d14] p-3.5 text-center font-mono text-xs sm:text-sm text-zinc-200 select-all overflow-x-auto shadow-inner">
              {activeNode.math}
            </div>

            {/* Code Snippet & Copy Action */}
            <div className="rounded-lg border border-[#1a2533] bg-[#070b10] p-3 text-xs font-mono text-zinc-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-zinc-500 select-none whitespace-nowrap">Python / C++:</span>
                <code className="text-zinc-200 select-all font-mono">
                  {activeNode.codeSnippet}
                </code>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded bg-[#131b26] border border-[#213042] text-zinc-300 hover:text-white hover:bg-[#1a2636] transition-all cursor-pointer whitespace-nowrap self-end sm:self-auto"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-zinc-300" />
                    <span className="text-zinc-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>

            {/* Inbound / Outbound Traversal Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#16212e] text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-[10px] uppercase font-bold">Inbound:</span>
                {activeNode.inbound.length > 0 ? (
                  activeNode.inbound.map((inId) => (
                    <button
                      key={inId}
                      onClick={() => setSelectedNodeId(inId)}
                      className="px-2 py-0.5 rounded bg-[#131b26] border border-[#213042] text-zinc-300 hover:text-[#FF5500] hover:border-[#FF5500] transition-all cursor-pointer text-[10px]"
                    >
                      ← {NODES[inId]?.label || inId}
                    </button>
                  ))
                ) : (
                  <span className="text-zinc-500 text-[10px] italic">FASTA Sequence Root</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-[10px] uppercase font-bold">Outbound:</span>
                {activeNode.outbound.length > 0 ? (
                  activeNode.outbound.map((outId) => (
                    <button
                      key={outId}
                      onClick={() => setSelectedNodeId(outId)}
                      className="px-2 py-0.5 rounded bg-[#131b26] border border-[#213042] text-zinc-300 hover:text-[#FF5500] hover:border-[#FF5500] transition-all cursor-pointer text-[10px]"
                    >
                      {NODES[outId]?.label || outId} →
                    </button>
                  ))
                ) : (
                  <span className="text-zinc-400 text-[10px] font-mono">
                    0 Primary Sequence Mutations
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. ML ANALYSIS & COMPARATIVE BENCHMARK MATRIX             */}
      {/* ========================================================= */}
      {activeView === "ml_analysis" && (
        <div className="space-y-6">
          {/* Performance Comparison Table */}
          <div className="rounded-xl border border-[#1b2636] bg-[#0d121a] p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#16212e]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#FF5500]" />
                  <span>DNA Steganography &amp; Stealth Detection Benchmarks</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Evaluated across 42,800 synthetic gene constructs with held-out E. coli K-12 deep learning detectors
                </p>
              </div>
              <span className="text-[11px] font-mono text-zinc-300 font-semibold">
                Stealth Advantage: Chance AUC 0.505
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-[#090e15] text-zinc-400 border-b border-[#1a2534]">
                  <tr>
                    <th className="p-3">Watermark Architecture</th>
                    <th className="p-3">Protein Identity</th>
                    <th className="p-3">Stealth AUC (1D-CNN)</th>
                    <th className="p-3">Host CAI</th>
                    <th className="p-3">1.0% Noise Recovery</th>
                    <th className="p-3">15% Shuffle Recovery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151f2b] text-zinc-300">
                  <tr className="bg-[#FF5500]/10 border-l-2 border-[#FF5500]">
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
                      <span>HelixSign (WGAN-GP + RS ECC)</span>
                    </td>
                    <td className="p-3 text-zinc-100 font-bold">100.0%</td>
                    <td className="p-3 font-semibold text-white">0.505 (Chance)</td>
                    <td className="p-3 text-white">0.988</td>
                    <td className="p-3 text-zinc-200 font-semibold">99.4%</td>
                    <td className="p-3 text-zinc-200 font-semibold">94.2%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Naive Codebook Tagging</td>
                    <td className="p-3 text-amber-400">91.4% (Mutated)</td>
                    <td className="p-3 text-rose-400">0.998 (Flagged)</td>
                    <td className="p-3 text-zinc-400">0.812</td>
                    <td className="p-3 text-zinc-400">68.2%</td>
                    <td className="p-3 text-rose-400">12.0%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Exogenous Non-Coding Insert</td>
                    <td className="p-3 text-amber-400">88.2% (Disrupted)</td>
                    <td className="p-3 text-rose-400">0.985 (Flagged)</td>
                    <td className="p-3 text-zinc-400">0.745</td>
                    <td className="p-3 text-zinc-400">54.1%</td>
                    <td className="p-3 text-rose-400">0.0% (Excised)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-zinc-500">
                      Unprotected Synonymous Substitutions
                    </td>
                    <td className="p-3 text-white font-medium">100.0%</td>
                    <td className="p-3 text-amber-400">0.842 (Biased)</td>
                    <td className="p-3 text-zinc-500">0.860</td>
                    <td className="p-3 text-rose-400 font-bold">32.4% (No ECC)</td>
                    <td className="p-3 text-rose-400">0.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2-Column: Confusion Matrix + Feature Importance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Confusion Matrix (6 Cols) */}
            <div className="lg:col-span-6 rounded-xl border border-[#1b2636] bg-[#0d121a] p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#16212e]">
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Stealth Confusion Matrix (Held-out 1D-CNN)
                </h4>
                <span className="text-[10px] font-mono text-zinc-500">N = 1,500 sequences</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#191410] border border-[#FF5500]/30">
                  <span className="text-[10px] text-zinc-500 block">Wildtype Host</span>
                  <span className="text-base font-bold text-white mt-1 block">99.6%</span>
                  <span className="text-[10px] text-zinc-300">498 / 500</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#191410] border border-[#FF5500]/30">
                  <span className="text-[10px] text-zinc-500 block">HelixSign (Stealth)</span>
                  <span className="text-base font-bold text-primary mt-1 block">50.5%</span>
                  <span className="text-[10px] text-zinc-300">Indistinguishable</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#191410] border border-[#FF5500]/30">
                  <span className="text-[10px] text-zinc-500 block">Naive Tagged</span>
                  <span className="text-base font-bold text-white mt-1 block">99.6%</span>
                  <span className="text-[10px] text-rose-400">Flagged (AUC 0.998)</span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                Zero biological data leakage: validation evaluated strictly on held-out bacterial genes and synthetic cassettes not present during WGAN training.
              </p>
            </div>

            {/* Feature Importance (6 Cols) */}
            <div className="lg:col-span-6 rounded-xl border border-[#1b2636] bg-[#0d121a] p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#16212e]">
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Gini Feature Importance (Biophysical &amp; ECC Metrics)
                </h4>
                <span className="text-[10px] font-mono text-[#FF5500]">250 RF Trees</span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                {[
                  { name: "Host Codon Adaptation (ΔCAI)", pct: 28.4 },
                  { name: "k-mer MMD Discrepancy (k=3,4)", pct: 21.6 },
                  { name: "Reed-Solomon Parity Margin", pct: 16.8 },
                  { name: "Homopolymer Run Length Check", pct: 12.5 },
                  { name: "Local GC Skew Deviation", pct: 8.9 },
                ].map((feat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-300 truncate max-w-[280px]">{feat.name}</span>
                      <span className="text-white font-bold">{feat.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#16202c] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#FF5500] to-orange-400 rounded-full"
                        style={{ width: `${feat.pct * 3}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. REAL-TIME LATENCY ALLOCATION BUDGET                    */}
      {/* ========================================================= */}
      {activeView === "latency" && (
        <div className="rounded-xl border border-[#1b2636] bg-[#0d121a] p-5 sm:p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#16212e]">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FF5500]" />
                <span>Microsecond Pipeline Latency Allocation</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Total computational turnaround budget for end-to-end stamping &amp; verification
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-zinc-500">Pipeline Execution:</span>
              <span className="text-sm font-bold font-mono text-[#FF5500] ml-2">35.0 ms</span>
            </div>
          </div>

          {/* Waterfall Timing Bar */}
          <div className="space-y-2">
            <div className="h-7 w-full rounded-lg overflow-hidden flex text-[10px] font-mono text-white font-bold select-none">
              <div
                className="bg-zinc-700 flex items-center justify-center"
                style={{ width: "3.4%" }}
                title="FASTA Ingest: 1.2ms"
              >
                1.2m
              </div>
              <div
                className="bg-indigo-700 flex items-center justify-center"
                style={{ width: "8.0%" }}
                title="Codon Profiling: 2.8ms"
              >
                2.8m
              </div>
              <div
                className="bg-purple-700 flex items-center justify-center"
                style={{ width: "10.3%" }}
                title="HKDF Permutation: 3.6ms"
              >
                3.6m
              </div>
              <div
                className="bg-[#FF5500] flex items-center justify-center shadow-lg"
                style={{ width: "41.1%" }}
                title="RS(16,8) ECC Encoding: 14.4ms"
              >
                RS(16,8) ECC: 14.4 ms
              </div>
              <div
                className="bg-amber-700 flex items-center justify-center"
                style={{ width: "23.4%" }}
                title="WGAN Refiner: 8.2ms"
              >
                WGAN: 8.2m
              </div>
              <div
                className="bg-slate-700 flex items-center justify-center"
                style={{ width: "13.8%" }}
                title="Invariant Proof: 4.8ms"
              >
                Proof: 4.8m
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-zinc-500 pt-1">
              <span>● FASTA Ingest (1.2ms)</span>
              <span>● Codon Profiling (2.8ms)</span>
              <span>● HKDF Keyed PRNG (3.6ms)</span>
              <span className="text-[#FF5500] font-semibold">● RS(16,8) ECC (14.4ms)</span>
              <span>● WGAN Refiner (8.2ms)</span>
              <span className="text-zinc-300 font-semibold">● Invariant Proof (4.8ms)</span>
            </div>
          </div>

          {/* SLA Turnaround Margin Breakdown */}
          <div className="p-4 rounded-xl border border-[#1b2636] bg-[#080d14] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#141d28]">
              <span className="text-zinc-400">Total Computational Pipeline Turnaround:</span>
              <span className="text-white font-bold">35.0 ms</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-[#141d28]">
              <span className="text-zinc-400">Interactive Stamp Roundtrip SLA Target:</span>
              <span className="text-white font-bold">&lt; 3.0 s (PRD F1 Spec)</span>
            </div>
            <div className="flex items-center justify-between text-zinc-200 font-bold">
              <span>Performance Overhead Margin:</span>
              <span className="text-sm">85x Faster than SLA Budget</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

{/* ========================================================= */}
{/* DUAL-TONE VECTOR LINE-ART ICONS (MATCHING REFERENCE UI)   */}
{/* ========================================================= */}
function NodeIcon({ nodeId, isSelected }: { nodeId: string; isSelected: boolean }) {
  const accentColor = isSelected ? "#FF5500" : "#FF5500";
  const baseColor = isSelected ? "#ffffff" : "#cbd5e1";

  switch (nodeId) {
    case "ingest":
      return (
        <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
          <rect x="10" y="24" width="16" height="6" rx="2" stroke={baseColor} strokeWidth="1.6" />
          <path d="M14 30v3M22 30v3" stroke="#64748b" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="18" cy="20" r="4" stroke={baseColor} strokeWidth="1.6" />
          <path d="M12 14c3.5-3 8.5-3 12 0" stroke={accentColor} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 9c6-5 14-5 20 0" stroke={accentColor} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
          <path d="M5 4c8-6 18-6 26 0" stroke={accentColor} strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
        </svg>
      );

    case "dma":
      return (
        <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
          <circle cx="18" cy="18" r="13" stroke={baseColor} strokeWidth="1.6" strokeDasharray="6 3" />
          <circle cx="18" cy="18" r="7" stroke="#64748b" strokeWidth="1.4" />
          <path d="M18 18l5 -5" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
          <circle cx="23" cy="13" r="2" fill={accentColor} />
          <path d="M18 18l-4 6" stroke={baseColor} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="18" cy="18" r="2.5" fill={baseColor} />
        </svg>
      );

    case "bandpass":
      return (
        <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
          <path d="M4 27h6c3 0 5-18 8-18s5 18 8 18h6" stroke={baseColor} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M13 18c1-4 2 4 3-4s2 4 3-4 2 4 3 0" stroke={accentColor} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M4 31h28" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );

    case "onset":
      return (
        <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
          <path
            d="M3 20h7l2-2 2 4 2-5 3 14 3-18 2 12 2-7 3 2h5"
            stroke={baseColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M16 4v28" stroke={accentColor} strokeWidth="1.8" strokeDasharray="3 2" />
          <circle cx="16" cy="19" r="4" stroke={accentColor} strokeWidth="1.6" fill="rgba(255,85,0,0.15)" />
          <circle cx="16" cy="19" r="1.5" fill={baseColor} />
        </svg>
      );

    case "ami_fnn":
      return (
        <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
          <path d="M6 6v24h24" stroke={baseColor} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M6 10c4 0 6 14 11 14s7-6 13-6" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="17" cy="24" r="3" stroke={accentColor} strokeWidth="1.6" fill={accentColor} fillOpacity="0.3" />
          <path d="M17 24v5" stroke={accentColor} strokeWidth="1.5" strokeDasharray="2 2" />
          <path d="M6 8c5 1 8 18 16 18" stroke={accentColor} strokeWidth="1.6" strokeLinecap="round" strokeDasharray="3 2" />
        </svg>
      );

    case "solver":
      return (
        <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
          <circle cx="18" cy="18" r="12" stroke="#475569" strokeWidth="1.2" strokeDasharray="3 3" />
          <path d="M8 8c8 4 12 16 20 20" stroke={baseColor} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M28 8c-8 4-12 16-20 20" stroke={baseColor} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M18 11v14M11 18h14" stroke="#64748b" strokeWidth="1.2" />
          <circle cx="18" cy="18" r="4.5" stroke={accentColor} strokeWidth="1.8" fill="rgba(255,85,0,0.25)" />
          <circle cx="18" cy="18" r="1.5" fill={baseColor} />
        </svg>
      );

    case "takens":
      return (
        <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
          <path d="M6 12l10-6 14 6-10 6-14-6z" stroke="#64748b" strokeWidth="1.2" />
          <path d="M6 12v12l10 6v-12M30 12v12l-10 6" stroke="#64748b" strokeWidth="1.2" />
          <path
            d="M13 18c3-7 8-3 10 3s-4 7-9 3c-4-3 1-9 6-9s6 7 2 9"
            stroke={accentColor}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="15" cy="15" r="2" fill={baseColor} />
          <circle cx="21" cy="20" r="1.5" fill={accentColor} />
        </svg>
      );

    case "gudhi":
      return (
        <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
          <path d="M18 6L7 25h22L18 6z" stroke={baseColor} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M18 6l1 15-12 4M19 21l10 4" stroke="#64748b" strokeWidth="1.3" />
          <circle cx="18" cy="6" r="3" fill={accentColor} stroke={baseColor} strokeWidth="1.2" />
          <circle cx="7" cy="25" r="2.5" fill={baseColor} />
          <circle cx="29" cy="25" r="2.5" fill={baseColor} />
          <circle cx="19" cy="21" r="2.5" fill={accentColor} />
          <circle cx="19" cy="21" r="8" stroke={accentColor} strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
        </svg>
      );

    case "homology":
      return (
        <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
          <path d="M7 6v23h23" stroke={baseColor} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M7 29L29 7" stroke="#64748b" strokeWidth="1.3" strokeDasharray="3 2" />
          <circle cx="12" cy="22" r="1.5" fill="#64748b" />
          <circle cx="16" cy="18" r="1.5" fill="#64748b" />
          <circle cx="20" cy="14" r="1.5" fill="#64748b" />
          <circle cx="10" cy="11" r="3" fill={accentColor} stroke={baseColor} strokeWidth="1.2" />
          <circle cx="14" cy="9" r="2.5" fill={accentColor} stroke={baseColor} strokeWidth="1.2" />
          <path d="M10 11v14" stroke={accentColor} strokeWidth="1.4" strokeDasharray="2 1" />
        </svg>
      );

    case "vectorizer":
      return (
        <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
          <rect x="6" y="8" width="24" height="20" rx="3" stroke={baseColor} strokeWidth="1.5" />
          <path d="M12 8v20M18 8v20M24 8v20" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M6 14h24M6 22h24" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M8 24c3-2 5-11 8-11s5 7 8 7 3-3 4-3" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
          <circle cx="16" cy="13" r="2" fill={baseColor} />
        </svg>
      );

    case "classifier":
      return (
        <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
          <circle cx="18" cy="8" r="3" stroke={baseColor} strokeWidth="1.5" fill="#1e293b" />
          <path d="M18 11L11 19M18 11L25 19" stroke="#64748b" strokeWidth="1.5" />
          <circle cx="11" cy="19" r="2.5" stroke={baseColor} strokeWidth="1.4" />
          <circle cx="25" cy="19" r="2.5" stroke={baseColor} strokeWidth="1.4" />
          <path d="M11 21.5L7 28M11 21.5L14 28M25 21.5L22 28M25 21.5L29 28" stroke="#64748b" strokeWidth="1.3" />
          <circle cx="7" cy="28" r="2" fill={accentColor} />
          <circle cx="14" cy="28" r="2" fill={baseColor} />
          <circle cx="22" cy="28" r="2" fill={accentColor} />
          <circle cx="29" cy="28" r="2" fill={accentColor} />
        </svg>
      );

    case "bocd":
      return (
        <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
          <path d="M5 28L16 17" stroke={baseColor} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M16 17V28" stroke="#64748b" strokeWidth="1.2" strokeDasharray="2 2" />
          <path d="M16 28L29 15" stroke={baseColor} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M16 28V6" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
          <circle cx="16" cy="6" r="3" fill={accentColor} stroke={baseColor} strokeWidth="1.2" />
          <path d="M13 10l3-4 3 4" stroke={baseColor} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );

    case "autoencoder":
      return (
        <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
          <rect x="6" y="8" width="3" height="20" rx="1.5" fill={baseColor} />
          <rect x="12" y="12" width="3" height="12" rx="1.5" fill="#64748b" />
          <rect x="17" y="15" width="2" height="6" rx="1" fill={accentColor} />
          <circle cx="18" cy="18" r="4" stroke={accentColor} strokeWidth="1.2" strokeDasharray="2 2" />
          <rect x="21" y="12" width="3" height="12" rx="1.5" fill="#64748b" />
          <rect x="27" y="8" width="3" height="20" rx="1.5" fill={baseColor} />
          <path d="M9 18h2M15 18h2M20 18h1M24 18h2" stroke="#475569" strokeWidth="1" />
        </svg>
      );

    case "alert":
      return (
        <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
          <path
            d="M18 4L7 9v9c0 8 5 13 11 14 6-1 11-6 11-14V9L18 4z"
            stroke={baseColor}
            strokeWidth="1.8"
            strokeLinejoin="round"
            fill="rgba(255,85,0,0.12)"
          />
          <path d="M19 10l-4 7h5l-2 8 6-9h-5l2-6h-2z" fill={accentColor} stroke={baseColor} strokeWidth="0.8" />
          <circle cx="18" cy="18" r="14" stroke={accentColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
          <rect x="6" y="6" width="24" height="24" rx="4" stroke={baseColor} strokeWidth="1.5" />
          <circle cx="18" cy="18" r="4" fill={accentColor} />
        </svg>
      );
  }
}
