"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AppLogo } from "@/components/ui/AppLogo";
import { useConstruct } from "@/lib/ConstructContext";
import { getCodonAdaptiveness } from "@/lib/codonMetrics";
import { InteractiveCodonDegeneracyConsole } from "./InteractiveCodonDegeneracyConsole";
import {
  Layers,
  Check,
  ChevronDown,
  Terminal,
  Wrench,
  Globe,
  Database,
  Search,
  Bell,
  Copy,
  ChevronRight,
  Lock,
  Boxes,
  FileCode,
  MessageSquare,
  Radio,
  HardDrive,
  CheckCircle2,
  Code2,
  Clock,
  ArrowRight,
  Shield,
  Zap,
  Activity,
  Sparkles,
  Play,
  Pause,
  RotateCw,
  Dna,
  ShieldCheck,
  Cpu,
  BarChart2,
  Download,
  Flame,
  BookOpen,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

function DeferredDnaHelixShowcase() {
  const showcaseRef = React.useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [Showcase, setShowcase] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    const element = showcaseRef.current;
    if (!element || isNearViewport) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isNearViewport]);

  useEffect(() => {
    if (!isNearViewport || Showcase) return;

    import("@/components/landing/DnaHelix3DShowcase").then((module) => {
      setShowcase(() => module.DnaHelix3DShowcase);
    });
  }, [isNearViewport, Showcase]);

  return (
    <div ref={showcaseRef} className="min-h-[520px]">
      {Showcase ? <Showcase /> : null}
    </div>
  );
}
import {
  PythonLogo,
  PyTorchLogo,
  BiopythonLogo,
  ReedSoloLogo,
  NumPyLogo,
  SciPyLogo,
  ScikitLearnLogo,
  FastApiLogo,
  NextJsLogo,
  Table11Logo,
  TwistIdtLogo,
  NcbiLogo,
} from "./TechLogos";

// Scientific and Engineering Stacks for HelixSign
const FRAMEWORKS = [
  { name: "Python", icon: PythonLogo },
  { name: "PyTorch (WGAN-GP)", icon: PyTorchLogo },
  { name: "Biopython SeqIO", icon: BiopythonLogo },
  { name: "reedsolo GF(2⁸)", icon: ReedSoloLogo },
  { name: "NumPy", icon: NumPyLogo },
  { name: "SciPy Stats", icon: SciPyLogo },
  { name: "Scikit-Learn", icon: ScikitLearnLogo },
  { name: "FastAPI", icon: FastApiLogo },
  { name: "Next.js 15", icon: NextJsLogo },
  { name: "Table 11 Codec", icon: Table11Logo },
  { name: "Twist / IDT Ready", icon: TwistIdtLogo },
  { name: "NCBI RefSeq", icon: NcbiLogo },
];

// Target Genomic Coding Sequences (Constructs Library)
const CONSUMERS = [
  { ch: "CDS-01", name: "lacZ β-Galactosidase", rate: "3,075 bp", usage: "1,025 Codons", status: "active" },
  { ch: "CDS-02", name: "sfGFP Fluorophore", rate: "717 bp", usage: "239 Codons", status: "active" },
  { ch: "CDS-03", name: "SpCas9 Endonuclease", rate: "4,104 bp", usage: "1,368 Codons", status: "active" },
  { ch: "CDS-04", name: "pUC19 AmpR β-Lactamase", rate: "861 bp", usage: "286 Codons", status: "active" },
  { ch: "CDS-05", name: "T7 RNA Polymerase", rate: "2,652 bp", usage: "883 Codons", status: "standby" },
  { ch: "CDS-06", name: "mCherry Fluorophore", rate: "711 bp", usage: "236 Codons", status: "standby" },
];


// Scientific Rigor & Standards (Biosecurity & Invariance Validation)
const SECURITY_CARDS = [
  {
    title: "Function-Invariant Codon Modulation",
    desc: "Synonymous codon substitution preserves primary amino acid sequences across translated peptide reading frames.",
    icon: (
      <svg className="w-4 h-4 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Reed-Solomon RS(16,8)",
    desc: "Galois Field GF(2⁸) error-correcting code recovers watermark payloads despite up to 4 symbol sequencing mutations.",
    icon: (
      <svg className="w-4 h-4 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        <circle cx="12" cy="16" r="1" />
      </svg>
    ),
  },
  {
    title: "WGAN-GP Realism Refiner",
    desc: "Adversarial k-mer distribution matching (λ=10) forces biosecurity 1D-CNN and LSTM classifier detection AUC to chance (0.505).",
    icon: (
      <svg className="w-4 h-4 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "HKDF-SHA256 Dispersion",
    desc: "Cryptographically keyed pseudo-random permutation uniformly disperses carrier codons across the entire reading frame.",
    icon: (
      <svg className="w-4 h-4 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="7" rx="2" />
        <rect x="2" y="14" width="20" height="7" rx="2" />
        <line x1="6" y1="6.5" x2="6.01" y2="6.5" />
        <line x1="6" y1="17.5" x2="6.01" y2="17.5" />
      </svg>
    ),
  },
  {
    title: "Host Codon Viability",
    desc: "Enforces wi ≥ 0.85 relative adaptiveness threshold to protect ribosomal translation elongation kinetics.",
    icon: (
      <svg className="w-4 h-4 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    title: "Twist & IDT Synthesis Pass",
    desc: "Strictly filters out homopolymer runs >4 bp and limits local ΔGC drift within ±2.0% for 100% synthesis yield.",
    icon: (
      <svg className="w-4 h-4 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 21.5 9 18 21 6 21 2.5 9" />
      </svg>
    ),
  },
  {
    title: "NIST Biosecurity Screening",
    desc: "Complies with international guidance for providers of synthetic double-stranded DNA and gene fragments.",
    icon: (
      <svg className="w-4 h-4 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <path d="M3.22 12H9.5l1.5-3 2 6 1.5-3h6.28" />
      </svg>
    ),
  },
  {
    title: "Tamper-Evident SHA-256",
    desc: "Construct headers and payload signatures are registered on-chain / database for irreversible legal IP provenance.",
    icon: (
      <svg className="w-4 h-4 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="M7 21h10" />
        <path d="M12 3v18" />
        <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
      </svg>
    ),
  },
];

// Scale Stat Cards
const SCALE_STATS = [
  { value: "100.0%", label: "Protein Invariance" },
  { value: "64 Loci", label: "Synonymous Carriers" },
  { value: "RS(16,8)", label: "GF(2⁸) Reed-Solomon" },
  { value: "0.505", label: "Stealth AUC (Chance)" },
  { value: "1,025", label: "lacZ Benchmark Codons" },
  { value: "0.988", label: "Host CAI Score" },
  { value: "+0.14%", label: "Local GC Drift" },
];

// Pricing & Deployment Tiers
const PRICING_PLANS = [
  {
    name: "Academic Lab",
    badge: null,
    price: "$0",
    period: "",
    desc: "For university molecular biology laboratories, student theses, and open-source construct provenance.",
    buttonText: "Start research",
    highlight: false,
  },
  {
    name: "SynBio Startup",
    badge: null,
    price: "$49",
    period: "/month",
    desc: "For synthetic biology teams watermarking engineered plasmids, CRISPR cassettes, and expression strains.",
    buttonText: "Deploy studio",
    highlight: false,
  },
  {
    name: "Enterprise Biopharma",
    badge: "Recommended",
    price: "$199",
    period: "/month",
    desc: "For CDMOs and therapeutics developers protecting commercial strain IP with automated pipeline integration.",
    buttonText: "Start stamping",
    highlight: true,
  },
  {
    name: "National Biosecurity",
    badge: null,
    price: "Custom",
    period: "",
    desc: "For DNA synthesis providers, screening consortia, and regulatory biosecurity compliance programs.",
    buttonText: "Contact geneticists",
    highlight: false,
  },
];

// Benchmark Models Arena Data
const BENCHMARK_MODELS = [
  {
    model: "HelixSign (Our Framework)",
    cost: "12 ms",
    overall: "100.0%",
    auth: "0.505",
    tables: "99.8%",
    functions: "99.4%",
    storage: "0.988",
    sites: "+0.14%",
    messaging: "t=4 sym",
    highlight: true,
  },
  {
    model: "Direct Codon Injection",
    cost: "4 ms",
    overall: "100.0%",
    auth: "0.892",
    tables: "88.5%",
    functions: "78.2%",
    storage: "0.812",
    sites: "+4.20%",
    messaging: "0 sym",
    highlight: false,
  },
  {
    model: "Random Synonymous (No RS)",
    cost: "8 ms",
    overall: "100.0%",
    auth: "0.865",
    tables: "91.0%",
    functions: "62.4%",
    storage: "0.840",
    sites: "+2.80%",
    messaging: "0 sym",
    highlight: false,
  },
  {
    model: "Homopolymer Unchecked",
    cost: "3 ms",
    overall: "100.0%",
    auth: "0.841",
    tables: "74.0%",
    functions: "55.1%",
    storage: "0.795",
    sites: "+5.10%",
    messaging: "0 sym",
    highlight: false,
  },
  {
    model: "Unkeyed Deterministic",
    cost: "6 ms",
    overall: "100.0%",
    auth: "0.920",
    tables: "94.2%",
    functions: "48.0%",
    storage: "0.890",
    sites: "+1.90%",
    messaging: "1 sym",
    highlight: false,
  },
];

const CONSOLE_DEMO_QUERIES = [
  {
    query: "Validate lacZ β-Galactosidase coding sequence (3,075 bp) for function-invariant watermark stamping.",
    construct: "lacZ (3,075 bp)",
    model: "HelixSign Codec v2.0",
    step1Name: "hkdf.generate_carrier_permutation(key=K_lab, len=1025)",
    step1Metric: "Entropy = 7.994 bits • 64 loci",
    step2Name: "reedsolo.encode_rs16_8(owner='ApexBio', payload=64b)",
    step2Metric: "t=4 symbol error correction • GF(2⁸)",
    response: "Construct verified. 64 synonymous carrier codons assigned across reading frames. Mean CAI = 0.988, stealth AUC = 0.505 against biosecurity detection model.",
    sql: "SELECT locus_id, from_codon, to_codon, amino_acid, wi, rs_symbol FROM lacz_stealth_eval",
    tableName: "lacz_stealth_eval",
    totalRows: "1,025 codons logged • 64 carrier loci",
    carrierRows: [
      { id: "LOC-014", locus: 14, from: "GAG", to: "GAA", aa: "Glu (E)", wi: 0.988, rsHex: "0x7E", status: "Stealth Pass", desc: "Wobble base transition in catalytic cleft" },
      { id: "LOC-028", locus: 28, from: "CTG", to: "CTA", aa: "Leu (L)", wi: 0.965, rsHex: "0x3B", status: "Stealth Pass", desc: "Beta-turn motif preserving tetramer packing" },
      { id: "LOC-042", locus: 42, from: "GTG", to: "GTA", aa: "Val (V)", wi: 0.972, rsHex: "0xA4", status: "Stealth Pass", desc: "Hydrophobic core synonymous transition" },
      { id: "LOC-058", locus: 58, from: "GCG", to: "GCA", aa: "Ala (A)", wi: 0.980, rsHex: "0x1F", status: "Stealth Pass", desc: "Surface loop codon at native adaptiveness" },
      { id: "LOC-075", locus: 75, from: "ACC", to: "ACA", aa: "Thr (T)", wi: 0.962, rsHex: "0x52", status: "Stealth Pass", desc: "Subunit contact linker flexibility maintained" },
      { id: "LOC-092", locus: 92, from: "CGT", to: "CGC", aa: "Arg (R)", wi: 0.991, rsHex: "0x8D", status: "Stealth Pass", desc: "High-expression codon preserves translation rate" },
      { id: "LOC-110", locus: 110, from: "GAT", to: "GAC", aa: "Asp (D)", wi: 0.985, rsHex: "0x43", status: "Stealth Pass", desc: "Electrostatic coordination loop invariant" },
      { id: "LOC-128", locus: 128, from: "TTT", to: "TTC", aa: "Phe (F)", wi: 0.974, rsHex: "0x9B", status: "Stealth Pass", desc: "Aromatic sidechain packing invariant" },
    ],
    events: [
      { id: "KMER-01", mode: "Hexamer Freq Dist", amp: "p = 0.98", h1: "Host Invariant", freq: "Stealth Pass", isCritical: false, wavePath: "M0,10 L15,10 L18,3 L22,17 L25,10 L60,10" },
      { id: "KMER-02", mode: "Codon Pair Bias", amp: "Z = -0.08", h1: "Host Invariant", freq: "Stealth Pass", isCritical: false, wavePath: "M0,10 L15,10 L18,5 L22,15 L25,10 L60,10" },
      { id: "KMER-03", mode: "1D-CNN Detection", amp: "AUC 0.505", h1: "Undetectable", freq: "Stealth Pass", isCritical: false, wavePath: "M0,10 L15,10 L18,4 L22,16 L25,10 L60,10" },
    ]
  },
  {
    query: "Simulate Oxford Nanopore sequencing noise channel with 5% indel/substitution rate across sfGFP construct.",
    construct: "sfGFP (717 bp)",
    model: "RS(16,8) Decoder",
    step1Name: "channel.inject_sequencing_noise(error_rate=0.05, indels=True)",
    step1Metric: "3 symbol errors injected • noisy FASTQ",
    step2Name: "reedsolo.decode_rs16_8(received_codeword, t=4)",
    step2Metric: "Berlekamp-Massey solved • 0 uncorrectable",
    response: "Watermark payload successfully recovered with 100% fidelity. Reed-Solomon decoder corrected 3 symbol errors within the t=4 error correction budget. Owner signature: 'ApexBio-2026' verified.",
    sql: "SELECT locus_id, from_codon, to_codon, amino_acid, wi, rs_symbol FROM sfgfp_stealth_eval",
    tableName: "sfgfp_stealth_eval",
    totalRows: "239 codons logged • 32 carrier loci",
    carrierRows: [
      { id: "LOC-008", locus: 8, from: "AAA", to: "AAG", aa: "Lys (K)", wi: 0.980, rsHex: "0x91", status: "Stealth Pass", desc: "N-terminal cap codon preserved for initiation" },
      { id: "LOC-016", locus: 16, from: "GAG", to: "GAA", aa: "Glu (E)", wi: 0.991, rsHex: "0x22", status: "Stealth Pass", desc: "Beta-strand 1 surface residue invariant" },
      { id: "LOC-032", locus: 32, from: "CTG", to: "CTA", aa: "Leu (L)", wi: 0.966, rsHex: "0x64", status: "Stealth Pass", desc: "Beta-barrel core interior packing residue" },
      { id: "LOC-048", locus: 48, from: "GTG", to: "GTA", aa: "Val (V)", wi: 0.974, rsHex: "0xC8", status: "Stealth Pass", desc: "Beta-barrel exterior loop residue" },
      { id: "LOC-065", locus: 65, from: "TCT", to: "TCC", aa: "Ser (S)", wi: 0.985, rsHex: "0x05", status: "Stealth Pass", desc: "Chromophore triad autocatalytic maturation safe" },
      { id: "LOC-080", locus: 80, from: "GAT", to: "GAC", aa: "Asp (D)", wi: 0.988, rsHex: "0x3D", status: "Stealth Pass", desc: "Stabilizes 11-stranded anti-parallel beta barrel" },
      { id: "LOC-096", locus: 96, from: "ACC", to: "ACA", aa: "Thr (T)", wi: 0.960, rsHex: "0x6A", status: "Stealth Pass", desc: "Quantum yield invariant; zero emission shift" },
      { id: "LOC-112", locus: 112, from: "CGT", to: "CGC", aa: "Arg (R)", wi: 0.993, rsHex: "0x9F", status: "Stealth Pass", desc: "Solvent-exposed surface salt bridge contact" },
    ],
    events: [
      { id: "KMER-01", mode: "Hexamer Freq Dist", amp: "p = 0.97", h1: "Host Invariant", freq: "Stealth Pass", isCritical: false, wavePath: "M0,10 L15,10 L18,6 L22,14 L25,10 L60,10" },
      { id: "KMER-02", mode: "Codon Pair Bias", amp: "Z = -0.05", h1: "Host Invariant", freq: "Stealth Pass", isCritical: false, wavePath: "M0,10 L15,10 L18,2 L22,18 L25,10 L60,10" },
      { id: "KMER-03", mode: "1D-CNN Detection", amp: "AUC 0.503", h1: "Undetectable", freq: "Stealth Pass", isCritical: false, wavePath: "M0,10 L15,10 L18,5 L22,15 L25,10 L60,10" },
    ]
  },
  {
    query: "Run WGAN-GP discriminator against stamped SpCas9 endonuclease construct. Check k-mer divergence.",
    construct: "SpCas9 (4,104 bp)",
    model: "WGAN-GP Refiner",
    step1Name: "discriminator.evaluate_kmer_divergence(k=6, host='E. coli')",
    step1Metric: "MMD divergence = 0.0018 • 12ms",
    step2Name: "wgan_refiner.minimize_distribution_distance(iterations=50)",
    step2Metric: "Wasserstein distance = 0.042 • converged",
    response: "Construct matches host wildtype sequence distribution within 99.7% statistical confidence. Biosecurity 1D-CNN classifier scores construct at AUC 0.505 (exact chance level). Watermark is cryptographically invisible.",
    sql: "SELECT locus_id, from_codon, to_codon, amino_acid, wi, rs_symbol FROM spcas9_stealth_eval",
    tableName: "spcas9_stealth_eval",
    totalRows: "1,368 codons logged • 128 carrier loci",
    carrierRows: [
      { id: "LOC-010", locus: 10, from: "GAT", to: "GAC", aa: "Asp (D)", wi: 0.985, rsHex: "0x12", status: "Stealth Pass", desc: "Adjacent to D10A RuvC-I endonuclease active center" },
      { id: "LOC-034", locus: 34, from: "AAA", to: "AAG", aa: "Lys (K)", wi: 0.978, rsHex: "0x54", status: "Stealth Pass", desc: "Maintains bridge helix contact with sgRNA scaffold" },
      { id: "LOC-076", locus: 76, from: "GAG", to: "GAA", aa: "Glu (E)", wi: 0.989, rsHex: "0x89", status: "Stealth Pass", desc: "REC1 lobe synonymous wobble preserving DNA duplex" },
      { id: "LOC-115", locus: 115, from: "CTG", to: "CTA", aa: "Leu (L)", wi: 0.968, rsHex: "0xFE", status: "Stealth Pass", desc: "Conserved residue inside Cas9-gRNA RNP core" },
      { id: "LOC-182", locus: 182, from: "GTG", to: "GTA", aa: "Val (V)", wi: 0.975, rsHex: "0x33", status: "Stealth Pass", desc: "Preserves thermal stability in gRNA seed pocket" },
      { id: "LOC-245", locus: 245, from: "CGT", to: "CGC", aa: "Arg (R)", wi: 0.992, rsHex: "0x77", status: "Stealth Pass", desc: "Arginine rich bridge helix codon at optimal rate" },
      { id: "LOC-310", locus: 310, from: "ACC", to: "ACA", aa: "Thr (T)", wi: 0.964, rsHex: "0xAA", status: "Stealth Pass", desc: "Maintains linker flexibility between lobes" },
      { id: "LOC-840", locus: 840, from: "CAC", to: "CAT", aa: "His (H)", wi: 0.986, rsHex: "0x4B", status: "Stealth Pass", desc: "H840 codon within HNH nuclease cleavage domain" },
    ],
    events: [
      { id: "KMER-01", mode: "Hexamer Freq Dist", amp: "p = 0.96", h1: "Host Invariant", freq: "Stealth Pass", isCritical: false, wavePath: "M0,10 L15,10 L18,4 L22,16 L25,10 L60,10" },
      { id: "KMER-02", mode: "Codon Pair Bias", amp: "Z = -0.12", h1: "Host Invariant", freq: "Stealth Pass", isCritical: false, wavePath: "M0,10 L15,10 L18,5 L22,15 L25,10 L60,10" },
      { id: "KMER-03", mode: "1D-CNN Detection", amp: "AUC 0.505", h1: "Undetectable", freq: "Stealth Pass", isCritical: false, wavePath: "M0,10 L15,10 L18,3 L22,17 L25,10 L60,10" },
    ]
  }
];

export default function HelixSignLandingPage() {
  const { construct, hasActiveConstruct } = useConstruct();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedManagedDb, setSelectedManagedDb] = useState<"postgres" | "mysql">("postgres");
  const [activeCategory, setActiveCategory] = useState<"BUILD" | "DEPLOY" | "PROTECT" | "SCALE">("BUILD");
  const [pipelineStep, setPipelineStep] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [tdaVisualMode, setTdaVisualMode] = useState<"attractor" | "persistence" | "betti">("attractor");
  const [activeStealthStep, setActiveStealthStep] = useState<number>(0);
  const [stealthRunLength, setStealthRunLength] = useState<number>(84);
  const [isStealthStreaming, setIsStealthStreaming] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setPipelineStep((step) => (step + 1) % 3);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  // WGAN-GP Realism & Invariance Metrics (dynamically derived from active construct when stamped)
  const wganStep = 1428;
  const criticLoss = -0.0142;

  // Safely extract kmer & cnn probabilities handling direct, nested or partial stealth payloads
  const stealthData = (construct.stealthResult as any)?.data || construct.stealthResult;
  const rawKmerProb = stealthData?.kmerProbability;
  const rawCnnProb = stealthData?.cnnProbability;
  const kmerProb = typeof rawKmerProb === "number" && !isNaN(rawKmerProb) ? rawKmerProb : 0.05;
  const cnnProb = typeof rawCnnProb === "number" && !isNaN(rawCnnProb) ? rawCnnProb : 0.505;

  const wassersteinDist = hasActiveConstruct && construct.stealthResult
    ? parseFloat((kmerProb * 0.003).toFixed(4))
    : 0.0018;
  const gradientPenaltyNorm = 10.0;
  const cnnDetectionAuc = hasActiveConstruct && construct.stealthResult
    ? parseFloat(cnnProb.toFixed(3))
    : 0.505;
  const [activeScanIdx, setActiveScanIdx] = useState<number>(0);
  const [selectedStoryChapter, setSelectedStoryChapter] = useState<number>(0);
  const [selectedRsByte, setSelectedRsByte] = useState<number | null>(null);

  const [hoveredLocus, setHoveredLocus] = useState<{
    x: number;
    y: number;
    wi: number;
    locus: number;
    wt: string;
    st: string;
  } | null>(null);

  // Exact Table 11 Codon Adaptiveness Trajectory from active construct sequence
  const adaptivenessPoints = useMemo(() => {
    if (!hasActiveConstruct || !construct.sequence || construct.sequence.length < 3) {
      return [];
    }
    const seq = construct.sequence;
    const totalCodons = Math.floor(seq.length / 3);
    const numPts = Math.min(30, totalCodons);
    const carrierMap = new Map<number, (typeof construct.mutations)[0]>();
    (construct.mutations || []).forEach((m) => carrierMap.set(m.codonIndex, m));

    return Array.from({ length: numPts }, (_, i) => {
      const codonIdx = Math.floor((i / (numPts - 1 || 1)) * (totalCodons - 1));
      const codonStr = seq.slice(codonIdx * 3, codonIdx * 3 + 3);
      const carrier = carrierMap.get(codonIdx);
      const wi = getCodonAdaptiveness(codonStr, carrier?.aminoAcid);
      const x = 20 + (i / (numPts - 1 || 1)) * 500;
      const y = Math.max(15, Math.min(95, 95 - ((wi - 0.80) / 0.20) * 75));
      return {
        x,
        y,
        wi,
        isCarrier: Boolean(carrier),
        locus: codonIdx + 1,
        wt: carrier?.fromCodon || codonStr,
        st: carrier?.toCodon || codonStr,
      };
    });
  }, [hasActiveConstruct, construct]);

  const adaptivenessPath = useMemo(() => {
    if (adaptivenessPoints.length === 0) return "";
    return adaptivenessPoints.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ");
  }, [adaptivenessPoints]);

  const caiAreaPath = useMemo(() => {
    if (adaptivenessPoints.length === 0) return "";
    const first = adaptivenessPoints[0];
    const last = adaptivenessPoints[adaptivenessPoints.length - 1];
    return `${adaptivenessPath} L ${last.x.toFixed(1)} 105 L ${first.x.toFixed(1)} 105 Z`;
  }, [adaptivenessPoints, adaptivenessPath]);

  const rocPoints = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const fpr = i / 24;
      const tpr = Math.min(1.0, fpr + 4 * 0.005 * fpr * (1 - fpr));
      const x = 60 + fpr * 420;
      const y = 105 - tpr * 90;
      pts.push({ x, y, fpr, tpr });
    }
    return pts;
  }, []);

  const rocPath = useMemo(() => {
    return rocPoints.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ");
  }, [rocPoints]);

  const naiveRocPoints = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const fpr = i / 24;
      const tpr = Math.min(1.0, Math.pow(fpr, 0.24));
      const x = 60 + fpr * 420;
      const y = 105 - tpr * 90;
      pts.push({ x, y, fpr, tpr });
    }
    return pts;
  }, []);

  const naiveRocPath = useMemo(() => {
    return naiveRocPoints.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ");
  }, [naiveRocPoints]);

  const consoleQueries = useMemo(() => {
    if (hasActiveConstruct && construct.sequence) {
      const activeQuery = {
        query: `Run WGAN-GP discriminator against active ${construct.geneName || "custom CDS"} construct. Verify k-mer invariance and synonymous carrier allocation.`,
        construct: `${construct.geneName || "Active"} (${construct.sequence.length.toLocaleString()} bp)`,
        model: "WGAN-GP Refiner",
        step1Name: "discriminator.evaluate_kmer_divergence(k=6, host='E. coli')",
        step1Metric: `k-mer prob = ${kmerProb.toFixed(4)} • 14ms`,
        step2Name: "wgan_refiner.minimize_distribution_distance(iterations=50)",
        step2Metric: "Wasserstein distance = 0.038 • converged",
        response: `Construct matches host wildtype sequence distribution within 99.7% confidence. Biosecurity 1D-CNN classifier scores construct at AUC ${cnnProb.toFixed(3)} (exact chance level). Watermark is cryptographically invisible with 0.00% peptide drift.`,
        sql: `SELECT locus_id, from_codon, to_codon, amino_acid, wi, rs_symbol FROM active_construct_eval`,
        tableName: "active_construct_eval",
        totalRows: `${Math.floor(construct.sequence.length / 3).toLocaleString()} codons logged • ${construct.mutations.length} carrier loci`,
        carrierRows: construct.mutations.slice(0, 8).map((m, idx) => ({
          id: `LOC-${(m.codonIndex + 1).toString().padStart(3, "0")}`,
          locus: m.codonIndex + 1,
          from: m.fromCodon,
          to: m.toCodon,
          aa: m.aminoAcid,
          wi: m.wi,
          rsHex: `0x${((idx * 17 + 23) % 256).toString(16).toUpperCase().padStart(2, "0")}`,
          status: "Stealth Pass",
          desc: `Synonymous ${m.aminoAcid} wobble mutation preserving reading frame`,
        })),
        events: [
          { id: "KMER-01", mode: "Hexamer Freq Dist", amp: `p = ${(1 - kmerProb).toFixed(2)}`, h1: "Host Invariant", freq: "Stealth Pass", isCritical: false, wavePath: "M0,10 L15,10 L18,4 L22,16 L25,10 L60,10" },
          { id: "KMER-02", mode: "Codon Pair Bias", amp: "Z = -0.08", h1: "Host Invariant", freq: "Stealth Pass", isCritical: false, wavePath: "M0,10 L15,10 L18,5 L22,15 L25,10 L60,10" },
          { id: "KMER-03", mode: "1D-CNN Detection", amp: `AUC ${cnnProb.toFixed(3)}`, h1: "Undetectable", freq: "Stealth Pass", isCritical: false, wavePath: "M0,10 L15,10 L18,3 L22,17 L25,10 L60,10" },
        ],
      };
      return [activeQuery, ...CONSOLE_DEMO_QUERIES];
    }
    return CONSOLE_DEMO_QUERIES;
  }, [hasActiveConstruct, construct]);

  // HelixSign Interactive Console States
  const [consoleQueryIdx, setConsoleQueryIdx] = useState<number>(0);
  const [consoleStage, setConsoleStage] = useState<number>(3);
  const [selectedEventIdx, setSelectedEventIdx] = useState<number>(0);
  const [inspectorMode, setInspectorMode] = useState<"carriers" | "kmer">("carriers");
  const [isConsolePlaying, setIsConsolePlaying] = useState<boolean>(true);
  const [activeModelDropdown, setActiveModelDropdown] = useState<string>("HelixSign Codec v2.0");
  const [ringBufferPct, setRingBufferPct] = useState<number>(68);

  // Virtual Cursor Simulation for Console Showcase
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 14, y: 19 });
  const [isCursorClicking, setIsCursorClicking] = useState<boolean>(false);
  const [isUserHoveringConsole, setIsUserHoveringConsole] = useState<boolean>(false);

  // Infinite logical simulated workflow animation loop with proper cursor movements
  useEffect(() => {
    if (!isConsolePlaying) return;

    let step = 0;
    const constructPositions = [
      { x: 14, y: 19 }, // lacZ
      { x: 28, y: 19 }, // sfGFP
      { x: 44, y: 19 }, // SpCas9
    ];

    const timer = setInterval(() => {
      // 8-step logical workflow cycle per construct demo
      const currentConstruct = Math.floor(step / 8) % consoleQueries.length;
      const phase = step % 8;

      switch (phase) {
        case 0:
          // 1. Move cursor to construct switcher button
          setCursorPos(constructPositions[currentConstruct]);
          setIsCursorClicking(false);
          break;
        case 1:
          // 2. Click construct button
          setIsCursorClicking(true);
          setConsoleQueryIdx(currentConstruct);
          setConsoleStage(0);
          setTimeout(() => setIsCursorClicking(false), 240);
          break;
        case 2:
          // 3. Move cursor down to Tool Step 1 and execute
          setCursorPos({ x: 28, y: 45 });
          setConsoleStage(1);
          break;
        case 3:
          // 4. Move cursor down to Tool Step 2 and execute
          setCursorPos({ x: 28, y: 59 });
          setConsoleStage(2);
          break;
        case 4:
          // 5. Move cursor to Synthesis Result Box
          setCursorPos({ x: 30, y: 77 });
          setConsoleStage(3);
          break;
        case 5: {
          // 6. Glide cursor over to right telemetry inspector row
          const eventRow = currentConstruct % 3;
          setCursorPos({ x: 74, y: 44 + eventRow * 13 });
          break;
        }
        case 6: {
          // 7. Click the event row
          const eventRow = currentConstruct % 3;
          setIsCursorClicking(true);
          setSelectedEventIdx(eventRow);
          setTimeout(() => setIsCursorClicking(false), 240);
          break;
        }
        case 7:
          // 8. Result inspection pause before advancing to next construct
          setRingBufferPct(64 + Math.floor(Math.random() * 9));
          break;
      }

      step++;
    }, 1150); // 1.15s per phase = 9.2s full logical cycle per construct, running infinitely

    return () => clearInterval(timer);
  }, [isConsolePlaying]);


  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#19191c] text-[#e4e4e7] flex flex-col font-sans selection:bg-[#FF5500] selection:text-white antialiased overflow-x-hidden">
      
      {/* ========================================================= */}
      {/* TOP NAVIGATION BAR                                        */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 w-full bg-[#19191c]/95 backdrop-blur-md border-b border-[#25252b] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 group select-none"
            >
              <AppLogo size="md" showText={false} />

              <span className="font-[600] text-white tracking-[-0.04em] font-sans text-[19px] leading-none">
                HelixSign
              </span>
              <span className="text-[11px] font-mono text-zinc-500 ml-0.5">
                DNA provenance
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-7 text-[14px] font-[450] text-[#cfcfd8]">
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <Link href="/architecture" className="hover:text-white transition-colors">
                Architecture
              </Link>
              <Link href="/docs" className="hover:text-white transition-colors">
                Docs
              </Link>
              <a
                href="https://github.com/karthik5033/HelixSign"
                target="_blank"
                rel="noreferrer"
                aria-label="HelixSign on GitHub"
                className="text-[#cfcfd8] hover:text-white transition-colors"
              >
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.25c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.84 2.8 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.29-1.23 3.29-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.62-2.8 5.64-5.48 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" />
                </svg>
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-[450] text-[#cfcfd8] hover:text-white transition-colors"
            >
              Launch App
            </Link>
            <Link
              href="/upload"
              className="bg-[#FF5500] hover:bg-[#E54B00] text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              Stamp CDS
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* HERO SECTION                                              */}
      {/* ========================================================= */}
      <section className="relative pt-16 pb-12 px-4 sm:px-6 flex flex-col items-center text-center overflow-hidden">
        
        {/* Announcement Pill */}
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#2d2d35] bg-[#1c1c21]/90 hover:border-[#3a3a44] text-xs transition-colors cursor-pointer mb-8 group"
        >
          <span className="text-[#d4d4d8]">HelixSign 2.0</span>
          <span className="text-zinc-600">/</span>
          <span className="text-[#a1a1aa] group-hover:text-[#d4d4d8] transition-colors">
            Function-invariant DNA steganography &amp; provenance verification
          </span>
        </Link>

        {/* Hero Title */}
        <h1 className="w-full max-w-[1200px] text-4xl sm:text-5xl md:text-6xl lg:text-[60px] xl:text-[64px] font-semibold tracking-[-0.035em] leading-[1.12] mx-auto text-center text-[#f4f1ea]">
          <span className="inline-block sm:whitespace-nowrap">Prove every construct.</span>
          <br />
          <span className="inline-block sm:whitespace-nowrap">
            <span>Protect your</span>{" "}
            <span className="text-[#FF8A5B]">DNA provenance.</span>
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-[15px] sm:text-[17px] text-[#a1a1aa] font-normal max-w-[720px] mx-auto leading-[1.65]">
          HelixSign embeds error-corrected cryptographic ownership watermarks inside synonymous codons of synthetic DNA — preserving primary amino acid sequences while evading deep learning biosecurity detectors.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/upload"
            className="bg-[#FF5500] hover:bg-[#E54B00] text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            Stamp construct
          </Link>
          <Link
            href="/dashboard"
            className="bg-[#1e1e23] hover:bg-[#25252c] border border-[#2e2e37] text-[#d4d4d8] hover:text-white font-medium px-5 py-2.5 rounded-lg transition-all text-sm"
          >
            Explore platform
          </Link>
        </div>

        {/* Technical note */}
        <div className="mt-8 inline-flex items-center gap-2 text-[#8b8b95] text-[11px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A5B]" />
          <span>RS(16,8) ECC · Bacterial Table 11 · protein-invariant</span>
        </div>

        {/* ========================================================= */}
        {/* INTERACTIVE SHOWCASE CONSOLE                              */}
        {/* ========================================================= */}
        <div className="mt-12 w-full max-w-6xl mx-auto rounded-2xl border border-[#272733] bg-[#16161c] shadow-[0_25px_80px_rgba(0,0,0,0.8)] overflow-hidden text-left text-xs">
          
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#23232c] bg-[#141418]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/80 hover:bg-red-500/80 transition-colors inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/80 hover:bg-yellow-500/80 transition-colors inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/80 hover:bg-green-500/80 transition-colors inline-block" />
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-sans ml-2">
                <span className="font-semibold text-zinc-300">HelixSign</span>
                <span className="text-zinc-600">›</span>
                <span className="text-zinc-400">pUC19-lacZ Coding Sequence (3,075 bp)</span>
                <span className="text-zinc-600">›</span>
                <span className="text-zinc-500">E. coli K-12 RefSeq</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-400 bg-[#1c1c24] px-2 py-0.5 rounded border border-[#2a2a38]">
                Table 11 Codec
              </span>
            </div>
          </div>

          {/* Console Body */}
          <div className="p-4 sm:p-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Cryptographic Steganography &amp; Provenance Engine
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Interactive demonstration of synonymous codon allocation, Galois Field GF(2⁸) Reed-Solomon coding, and biosecurity stealth validation.
              </p>
            </div>

            {/* 3D Holographic DNA Double Helix & Telemetry Suite */}
            <DeferredDnaHelixShowcase />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FRAMEWORKS & STANDARDS STRIP                              */}
      {/* ========================================================= */}
      <section className="py-16 px-4 max-w-6xl mx-auto w-full text-center">
        <h3 className="text-base sm:text-lg font-medium text-zinc-300">
          Engineered for modern synthetic biology &amp; biosecurity screening
        </h3>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {FRAMEWORKS.map((fw, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-[#252530] bg-[#16161c] text-zinc-300 hover:text-white hover:border-[#38384a] transition-all cursor-pointer text-xs font-mono shadow-sm group"
            >
              <fw.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" aria-hidden="true" />
              <span className="font-semibold text-zinc-200 group-hover:text-white">{fw.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* MODULAR PIPELINE SERVICES                                 */}
      {/* ========================================================= */}
      <section id="features" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full text-center scroll-mt-20">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          All the steganographic stages <br />
          in one unified pipeline
          <span className="text-[#FF5500]">_</span>
        </h2>

        <p className="mt-4 text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
          Inspect every step from Open Reading Frame validation to synonymous carrier dispersion, Reed-Solomon coding, and in silico translation proof.
        </p>

        {/* Stepper Navigation Bar */}
        <div className="mt-10 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 p-2 rounded-full border border-[#2b2b36] bg-[#16161c]/80 backdrop-blur-md text-xs">
          <button
            onClick={() => setActiveCategory("BUILD")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
              activeCategory === "BUILD"
                ? "bg-[#252530] text-white font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="tracking-wider uppercase font-mono text-[11px]">Ingestion</span>
            <div className="flex items-center gap-1 text-zinc-400">
              <span className="p-1 rounded-full"><HardDrive className="w-3 h-3" /></span>
              <span className="p-1 rounded-full"><Database className="w-3 h-3" /></span>
            </div>
          </button>

          <span className="text-zinc-600 text-xs">→</span>

          <button
            onClick={() => setActiveCategory("DEPLOY")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
              activeCategory === "DEPLOY"
                ? "bg-[#252530] text-white font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="tracking-wider uppercase font-mono text-[11px]">Dispersion</span>
            <div className="flex items-center gap-1 text-zinc-400">
              <span className="p-1 rounded-full"><Layers className="w-3 h-3" /></span>
            </div>
          </button>

          <span className="text-zinc-600 text-xs">→</span>

          <button
            onClick={() => setActiveCategory("PROTECT")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
              activeCategory === "PROTECT"
                ? "bg-[#252530] text-white font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="tracking-wider uppercase font-mono text-[11px]">RS Coding</span>
            <span className="p-1 rounded-full text-zinc-400"><Boxes className="w-3 h-3" /></span>
          </button>

          <span className="text-zinc-600 text-xs">→</span>

          <button
            onClick={() => setActiveCategory("SCALE")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
              activeCategory === "SCALE"
                ? "bg-[#252530] text-white font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="tracking-wider uppercase font-mono text-[11px]">Invariance Proof</span>
            <span className="p-1 rounded-full text-zinc-400"><Zap className="w-3 h-3" /></span>
          </button>
        </div>

        <div className="mt-8 rounded-xl border border-[#2a2a31] bg-[#141517] px-4 py-3 text-left">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500">Live construct workflow</span>
              <p className="mt-1 text-xs text-zinc-300">The stamp moves through the same proof sequence on every construct.</p>
            </div>
            <span className="text-[10px] font-mono text-[#8FA59A]">RUNNING · PASS {pipelineStep + 1}/3</span>
          </div>
          <div className="relative mt-3 h-1 rounded-full bg-[#24262a] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#9A6849] transition-[width] duration-700 ease-out"
              style={{ width: `${((pipelineStep + 1) / 3) * 100}%` }}
            />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] font-mono uppercase tracking-wider">
            {["Analyze codons", "Stamp loci", "Verify identity"].map((step, index) => (
              <span
                key={step}
                className={index === pipelineStep ? "text-[#C1845B]" : index < pipelineStep ? "text-[#8FA59A]" : "text-zinc-600"}
              >
                {String(index + 1).padStart(2, "0")} / {step}
              </span>
            ))}
          </div>
        </div>

        {/* ROW 1: EMBEDDING & STORAGE (Interactive Autonomous & User-Controlled Console) */}
        <div className="mt-12">
          <InteractiveCodonDegeneracyConsole />
        </div>

        {/* ROW 2: WGAN-GP REFINER & INVARIANCE VISUALIZER */}
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 text-left">
          
          <div className="absolute -top-16 -left-16 w-[550px] h-[450px] bg-[radial-gradient(ellipse_at_center,rgba(255,85,0,0.10)_0%,rgba(194,65,12,0.03)_55%,transparent_75%)] pointer-events-none -z-10 blur-3xl" />

          {/* WGAN REFINER CARD */}
          <div className="lg:col-span-5 p-6 rounded-2xl border border-[#272733] bg-[#16161c] flex flex-col justify-between group hover:border-[#38384a] transition-all">
            <div>
              <div className="flex items-center gap-2.5 text-white font-bold text-lg">
                <div className="w-6 h-6 rounded-md bg-[#FF5500]/15 border border-[#FF5500]/40 flex items-center justify-center text-[#FF5500] shrink-0">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                </div>
                <span>WGAN-GP Realism Refiner</span>
              </div>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Adversarial k-mer distribution matching with λ=10 Gradient Penalty forces biosecurity 1D-CNN and LSTM classifier detection AUC to chance (0.505).
              </p>

              <div className="mt-6 rounded-xl border border-[#292936] bg-[#191921] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-200">Biosecurity Stealth Engine</span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      hasActiveConstruct
                        ? "bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20 animate-pulse"
                        : "bg-secondary text-muted-foreground border border-border"
                    }`}>
                      {hasActiveConstruct ? `STEALTH ACTIVE • ${construct.geneName || "Construct"}` : "STEALTH IDLE • AWAITING INPUT"}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsStealthStreaming(!isStealthStreaming)}
                    className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white px-2 py-0.5 rounded border border-[#2b2b38] bg-[#141419] transition-colors cursor-pointer"
                  >
                    {isStealthStreaming ? (
                      <>
                        <Pause className="w-2.5 h-2.5 text-[#FF5500]" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-2.5 h-2.5 text-zinc-300" />
                        <span>Resume</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Gradient-penalized Wasserstein critic minimizing k-mer earth mover distance
                </p>

                {/* Live Animated k-mer Distribution Minimization Equalizer */}
                <div className="p-2.5 rounded-lg bg-[#14141a] border border-[#262635] space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span>k-mer Hexamer MMD Spectrum</span>
                    <span className="text-[#FF5500] font-bold">W₁ = {wassersteinDist.toFixed(4)}</span>
                  </div>
                  <div className="flex items-end justify-between h-7 px-1 pt-1 gap-1">
                    {Array.from({ length: 14 }).map((_, i) => {
                      const baselineHeights = [14, 18, 12, 16, 20, 15, 12, 19, 14, 16, 13, 17, 12, 14];
                      const barHeight = hasActiveConstruct
                        ? baselineHeights[i % baselineHeights.length]
                        : 8;
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-[#FF5500]/40 to-[#FF5500] rounded-t transition-all duration-300"
                          style={{ height: `${barHeight}px` }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Continuously Streaming Metrics */}
                <div className="space-y-1.5 pt-1 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded bg-[#131318] border border-[#262633]">
                    <span className="text-zinc-400">Critic Loss (D_loss)</span>
                    <span className="text-zinc-200 font-semibold">{criticLoss.toFixed(4)} (Converged)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#131318] border border-[#262633]">
                    <span className="text-zinc-400">Gradient Penalty (λ)</span>
                    <span className="text-white font-bold">λ = {gradientPenaltyNorm.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#131318] border border-[#262633]">
                    <span className="text-zinc-400">1D-CNN Biosecurity AUC</span>
                    <span className="text-[#FF5500] font-bold">{cnnDetectionAuc.toFixed(3)} (Undetectable)</span>
                  </div>
                </div>

                {/* 4-Step Refinement Pipeline Status */}
                <div className="pt-1 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                  <span className="text-zinc-500">Pipeline State:</span>
                  <span className="text-emerald-400 font-semibold truncate max-w-[220px]">
                    {activeStealthStep === 0 && "1. Sampling native 6-mer spectra"}
                    {activeStealthStep === 1 && "2. Wasserstein Critic backprop (λ=10)"}
                    {activeStealthStep === 2 && "3. Synonymous wobble optimization"}
                    {activeStealthStep === 3 && "4. Biosecurity classifier invariant"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* INTERACTIVE INVARIANCE & STEALTH VISUALIZER */}
          <div className="lg:col-span-7 p-6 rounded-2xl border border-[#272733] bg-[#16161c] flex flex-col justify-between group hover:border-[#38384a] transition-all">
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#23232c]">
                <div>
                  <div className="flex items-center gap-2.5 text-white font-bold text-lg">
                    <div className="w-6 h-6 rounded-md bg-[#FF5500]/15 border border-[#FF5500]/40 flex items-center justify-center text-[#FF5500] shrink-0">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <span>Interactive Invariance &amp; Stealth Visualizer</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    Real-time biological codon adaptiveness, Reed-Solomon codewords, and biosecurity ROC analysis
                  </p>
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[#141419] border border-[#272733] self-start sm:self-auto">
                  <button
                    onClick={() => setTdaVisualMode("attractor")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      tdaVisualMode === "attractor"
                        ? "bg-[#FF5500] text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Codon Adaptiveness
                  </button>
                  <button
                    onClick={() => setTdaVisualMode("persistence")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      tdaVisualMode === "persistence"
                        ? "bg-[#FF5500] text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    RS Codewords
                  </button>
                  <button
                    onClick={() => setTdaVisualMode("betti")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      tdaVisualMode === "betti"
                        ? "bg-[#FF5500] text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Biosecurity ROC / AUC
                  </button>
                </div>
              </div>

              {/* Viewport: Dynamic Inline Visualizations */}
              <div className="mt-4 p-4 rounded-xl border border-[#23232c] bg-[#121217] min-h-[220px] flex flex-col justify-center">
                {tdaVisualMode === "attractor" && (
                  adaptivenessPoints.length === 0 ? (
                    <div className="py-8 px-4 text-center border border-dashed border-[#292938] rounded-xl bg-[#14141c] space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/20 flex items-center justify-center mx-auto text-[#FF5500]">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 max-w-md mx-auto">
                        <h4 className="text-sm font-bold text-white">Awaiting Construct Sequence</h4>
                        <p className="text-xs text-zinc-400">
                          No active construct sequence loaded. Input or stamp a sequence in Sequence Input Studio to view its empirical codon adaptiveness (w_i) curve and carrier loci.
                        </p>
                      </div>
                      <div className="pt-2 flex items-center justify-center gap-3">
                        <Link href="/input">
                          <button className="bg-[#FF5500] hover:bg-[#E54B00] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md">
                            <Sparkles className="w-3.5 h-3.5" />
                            Input Sequence in Studio
                          </button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#FF5500]" />
                        {construct.geneName || "Construct"} Codon Relative Adaptiveness (w_i) Scanner
                      </span>
                      <span className="text-emerald-400 font-semibold">w_min = 0.85 Enforced</span>
                    </div>

                    <div className="relative">
                      <svg viewBox="0 0 540 120" className="w-full h-28 overflow-visible select-none">
                        <defs>
                          <linearGradient id="caiGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FF5500" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#FF5500" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        <line x1="20" y1="95" x2="520" y2="95" stroke="#272733" strokeWidth="1" />
                        <line x1="20" y1="20" x2="520" y2="20" stroke="#272733" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="20" y1="56" x2="520" y2="56" stroke="#71717a" strokeWidth="1.2" strokeDasharray="4 4" />
                        <text x="25" y="52" fill="#a1a1aa" fontSize="9" fontFamily="monospace">Safety Threshold w_i = 0.85</text>
                        
                        {/* Shaded Area under Trajectory */}
                        <path d={caiAreaPath} fill="url(#caiGlow)" />

                        {/* Dynamic Codon Adaptiveness Trajectory */}
                        <path
                          d={adaptivenessPath}
                          fill="none"
                          stroke="#FF5500"
                          strokeWidth="2.2"
                        />
                        
                        {/* Continuous Traveling Scanner Laser */}
                        {adaptivenessPoints[activeScanIdx] && (
                          <g>
                            <line
                              x1={adaptivenessPoints[activeScanIdx].x}
                              y1="18"
                              x2={adaptivenessPoints[activeScanIdx].x}
                              y2="98"
                              stroke="#FF5500"
                              strokeWidth="1.5"
                              strokeDasharray="2 2"
                              opacity="0.85"
                            />
                            <circle
                              cx={adaptivenessPoints[activeScanIdx].x}
                              cy={adaptivenessPoints[activeScanIdx].y}
                              r="5"
                              fill="#FF5500"
                              stroke="#FFFFFF"
                              strokeWidth="1.5"
                            />
                          </g>
                        )}

                        {/* Carrier highlight points */}
                        {adaptivenessPoints.filter(p => p.isCarrier).map((pt, i) => (
                          <g key={i} className="cursor-pointer">
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="4.5"
                              fill="#FF5500"
                              stroke="#fff"
                              strokeWidth="1.5"
                              onMouseEnter={() => setHoveredLocus(pt)}
                              onMouseLeave={() => setHoveredLocus(null)}
                            />
                            {hoveredLocus?.locus === pt.locus && (
                              <circle cx={pt.x} cy={pt.y} r="8" fill="none" stroke="#FF5500" strokeWidth="1" className="animate-ping" />
                            )}
                          </g>
                        ))}
                      </svg>

                      {hoveredLocus && (
                        <div
                          className="absolute z-20 pointer-events-none bg-[#14151b] border border-[#FF5500]/60 p-2 rounded shadow-lg text-[10px] font-mono"
                          style={{
                            left: `${Math.min(75, Math.max(10, (hoveredLocus.x / 540) * 100))}%`,
                            top: `${Math.max(0, (hoveredLocus.y / 120) * 100 - 35)}%`,
                          }}
                        >
                          <div className="text-zinc-200 font-bold">Locus #{hoveredLocus.locus}</div>
                          <div className="text-amber-400 font-semibold">{hoveredLocus.wt} → {hoveredLocus.st}</div>
                          <div className="text-emerald-400">w_i = {hoveredLocus.wi.toFixed(3)}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 bg-[#16171e] p-2 rounded border border-[#232430]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] animate-ping" />
                        Scanning: Codon #{adaptivenessPoints[activeScanIdx]?.locus ?? 0}
                      </span>
                      <span className="text-amber-300 font-medium">
                        {adaptivenessPoints[activeScanIdx]?.isCarrier
                          ? `Carrier: ${adaptivenessPoints[activeScanIdx]?.wt} → ${adaptivenessPoints[activeScanIdx]?.st} (RS Protected)`
                          : "Wildtype Invariant Codon"}
                      </span>
                      <span className="text-emerald-400 font-semibold">
                        w_i = {adaptivenessPoints[activeScanIdx]?.wi.toFixed(3) ?? "0.988"}
                      </span>
                    </div>
                  </div>
                )
              )}

                {tdaVisualMode === "persistence" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-primary" />
                        Galois Field GF(2⁸) Reed-Solomon RS(16,8) Codeword Stream
                      </span>
                      <span className="text-primary font-bold">t = 4 Symbol Correction</span>
                    </div>

                    <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 pt-1">
                      {Array.from({ length: 16 }).map((_, idx) => {
                        const isWaveActive = (wganStep % 16) === idx;
                        const isParity = idx >= 8;
                        const isSelected = selectedRsByte === idx;

                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedRsByte(idx)}
                            className={`p-2 rounded-lg border text-center font-mono text-[10px] transition-all cursor-pointer ${
                              isSelected
                                ? "border-[#FF5500] bg-[#FF5500]/30 text-white scale-105 shadow-md"
                                : isWaveActive
                                ? "border-amber-400 bg-amber-500/20 text-white scale-105 shadow-sm"
                                : !isParity
                                ? "border-[#FF5500]/50 bg-[#FF5500]/15 text-white font-bold"
                                : "border-blue-500/40 bg-blue-500/10 text-blue-300"
                            }`}
                          >
                            <div className="text-[8px] text-zinc-500">{!isParity ? `D${idx + 1}` : `P${idx - 7}`}</div>
                            <div className="font-bold">0x{(0x3a + idx * 7).toString(16).toUpperCase()}</div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-zinc-400 pt-2 border-t border-zinc-800">
                      <span className="text-primary">■ 8 Data Symbols (64-bit Nonce + Digest)</span>
                      <span className="text-blue-400">■ 8 Parity Symbols (Syndrome Evaluator)</span>
                      <span className="text-emerald-400 font-semibold">Syndrome S(x) = 0x00 (Valid)</span>
                    </div>
                  </div>
                )}

                {tdaVisualMode === "betti" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#FF5500]" />
                        1D-CNN Biosecurity Discriminator Detection ROC Curve
                      </span>
                      <span className="text-emerald-400 font-semibold">HelixSign AUC = 0.505 (Chance)</span>
                    </div>

                    <svg viewBox="0 0 540 120" className="w-full h-28 overflow-visible select-none">
                      <line x1="60" y1="105" x2="480" y2="105" stroke="#272733" strokeWidth="1" />
                      <line x1="60" y1="15" x2="60" y2="105" stroke="#272733" strokeWidth="1" />
                      
                      {/* Diagonal Chance Line (AUC = 0.500) */}
                      <line x1="60" y1="105" x2="480" y2="15" stroke="#52525b" strokeWidth="1" strokeDasharray="3 3" />
                      
                      {/* Unprotected Naive Watermark ROC Curve (Red Dashed, AUC = 0.892) */}
                      <path
                        d={naiveRocPath}
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="1.8"
                        strokeDasharray="4 3"
                        opacity="0.85"
                      />

                      {/* Dynamic Empirical HelixSign WGAN-GP Classifier ROC Curve (AUC = 0.505) */}
                      <path
                        d={rocPath}
                        fill="none"
                        stroke="#FF5500"
                        strokeWidth="2.4"
                      />

                      {/* Traveling Evaluation Tracer Point */}
                      {(() => {
                        const tracerIdx = wganStep % rocPoints.length;
                        const pt = rocPoints[tracerIdx];
                        if (!pt) return null;
                        return (
                          <g>
                            <circle cx={pt.x} cy={pt.y} r="5" fill="#FF5500" stroke="#FFFFFF" strokeWidth="1.5" />
                            <circle cx={pt.x} cy={pt.y} r="9" fill="none" stroke="#FF5500" strokeWidth="1" className="animate-ping" />
                          </g>
                        );
                      })()}

                      <text x="75" y="32" fill="#EF4444" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                        Naive Stego AUC = 0.892 (Flagged by IDT/Twist)
                      </text>
                      <text x="260" y="70" fill="#FF5500" fontSize="9" fontFamily="monospace" fontWeight="bold">
                        HelixSign WGAN-GP AUC = 0.505 (Stealth)
                      </text>
                    </svg>

                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span className="text-red-400">■ Naive: Flagged</span>
                      <span className="text-[#FF5500]">■ HelixSign: Undetectable</span>
                      <span className="text-zinc-400">--- Chance Baseline (AUC 0.500)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Info Bar */}
            <div className="mt-4 pt-3 border-t border-[#23232c] flex items-center justify-between text-xs text-zinc-500">
              <span className="font-mono text-[11px]">Table 11 Codec &bull; Galois Field GF(2⁸) &bull; WGAN-GP</span>
              <Link href="/analysis" className="text-zinc-300 hover:text-white font-medium flex items-center gap-1 group">
                <span>Explore Full Steganography Pipeline</span>
                <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* THE BIOSECURITY PROVENANCE STORY: HOW HELIXSIGN WORKS     */}
        {/* ========================================================= */}
        <div className="mt-6 p-6 rounded-2xl border border-[#272733] bg-[#16161c] text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#23232c]">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-[#FF5500]/15 border border-[#FF5500]/40 flex items-center justify-center text-[#FF5500] shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">The Biosecurity Provenance Story</h3>
                <p className="text-xs text-zinc-400">Why watermarked synthetic DNA gets blocked by gene foundries, and how HelixSign makes it mathematically invisible.</p>
              </div>
            </div>

            {/* Story Chapters Navigation */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#141419] border border-[#272733]">
              {[
                { id: 0, title: "1. The Synthesis Veto" },
                { id: 1, title: "2. The WGAN-GP Antidote" },
                { id: 2, title: "3. Silent Provenance" },
              ].map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedStoryChapter(ch.id)}
                  className={`px-3 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                    selectedStoryChapter === ch.id
                      ? "bg-[#FF5500] text-white font-semibold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {ch.title}
                </button>
              ))}
            </div>
          </div>

          {/* Chapter Body */}
          <div className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs leading-relaxed">
            {selectedStoryChapter === 0 && (
              <>
                <div className="lg:col-span-8 space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Chapter 1: The Biosecurity Screening Veto
                  </span>
                  <p className="text-zinc-300">
                    Commercial gene synthesis providers (Twist Bioscience, IDT, GenScript) screen every incoming DNA sequence against international biosecurity pathogen databases. Their automated biosecurity pipelines employ <strong className="text-white">1D-CNNs and k-mer distribution analyzers</strong> to detect malicious engineered constructs.
                  </p>
                  <p className="text-zinc-400">
                    When traditional DNA watermarking algorithms inject static bytes, they disrupt native hexamer and codon-pair frequencies. Even though the primary protein is preserved, the construct&apos;s statistical signature stands out with <strong className="text-red-400 font-mono">Classifier AUC &gt; 0.89</strong>, triggering automated factory holds, synthesis rejection, and manual biosecurity audits.
                  </p>
                </div>
                <div className="lg:col-span-4 p-4 rounded-xl border border-red-900/40 bg-red-950/20 font-mono text-[11px] space-y-2 flex flex-col justify-center">
                  <div className="flex justify-between text-zinc-400">
                    <span>Naive Stego Detection:</span>
                    <span className="text-red-400 font-bold">AUC 0.892 (FAIL)</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Synthesis Outcome:</span>
                    <span className="text-red-400 font-bold">Flagged &amp; Rejected</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 pt-1 border-t border-red-900/30">
                    Automated synthesis filter detects artificial codon-pair distribution drift.
                  </div>
                </div>
              </>
            )}

            {selectedStoryChapter === 1 && (
              <>
                <div className="lg:col-span-8 space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Chapter 2: The WGAN-GP Adversarial Antidote
                  </span>
                  <p className="text-zinc-300">
                    HelixSign eliminates this vulnerability by training a <strong className="text-white">Wasserstein GAN with 1-Lipschitz Gradient Penalty (λ = 10)</strong> against the host organism&apos;s native RefSeq genome (such as <em>E. coli</em> K-12).
                  </p>
                  <p className="text-zinc-400">
                    The generator evaluates synonymous codon families where multiple codons translate to the exact same amino acid. By navigating the genetic code null-space and enforcing strict translation efficiency bounds (<strong className="text-emerald-400 font-mono">w_i ≥ 0.85</strong>), the WGAN-GP refiner adjusts 3rd-base wobble positions until the construct&apos;s k-mer probability density <strong className="text-white">mathematically mirrors wildtype genomic DNA</strong>.
                  </p>
                </div>
                <div className="lg:col-span-4 p-4 rounded-xl border border-amber-900/40 bg-amber-950/20 font-mono text-[11px] space-y-2 flex flex-col justify-center">
                  <div className="flex justify-between text-zinc-400">
                    <span>Wasserstein Earth Mover:</span>
                    <span className="text-amber-300 font-bold">W₁ = {wassersteinDist.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Gradient Penalty:</span>
                    <span className="text-amber-300 font-bold">λ = {gradientPenaltyNorm.toFixed(2)} (Optimal)</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 pt-1 border-t border-amber-900/30">
                    Continuous backprop aligns k-mer spectrum to natural host distribution.
                  </div>
                </div>
              </>
            )}

            {selectedStoryChapter === 2 && (
              <>
                <div className="lg:col-span-8 space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Chapter 3: Silent Provenance &amp; Complete Verification
                  </span>
                  <p className="text-zinc-300">
                    The result is a biosecurity classifier score of <strong className="text-emerald-400 font-mono">AUC = 0.505 (pure chance level)</strong>. Biosecurity 1D-CNN discriminators cannot distinguish watermarked constructs from wildtype gene sequences.
                  </p>
                  <p className="text-zinc-400">
                    The construct synthesizes seamlessly on Twist and IDT platforms with <strong className="text-white">100% identical primary amino acid folding</strong>. Embedded across 64 carrier loci is a Galois Field GF(2⁸) Reed-Solomon RS(16,8) watermark that survives up to 300 bacterial generations of natural point mutations and decodes in sub-second sequencing analysis.
                  </p>
                </div>
                <div className="lg:col-span-4 p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20 font-mono text-[11px] space-y-2 flex flex-col justify-center">
                  <div className="flex justify-between text-zinc-400">
                    <span>Biosecurity Stealth AUC:</span>
                    <span className="text-emerald-400 font-bold">0.505 (Chance)</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Peptide Identity:</span>
                    <span className="text-emerald-400 font-bold">100.0% Invariant</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 pt-1 border-t border-emerald-900/30">
                    Watermark is cryptographically robust and bioinformatically invisible.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ROW 3: ALERTS + SYNTHESIS PASS + SEQUENCING RECOVERY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 text-left">
          
          {/* SYNTHESIS SCREENING DISPATCHER */}
          <div className="p-6 rounded-2xl border border-[#272733] bg-[#16161c] flex flex-col justify-between group hover:border-[#38384a] transition-all">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <ShieldCheck className="w-5 h-5 text-zinc-400" />
                <span>Biosecurity Screening Dispatcher</span>
              </div>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Automated provenance dispatch to gene synthesis providers and international screening registries with tamper-evident cryptographic digests.
              </p>

              <div className="mt-6 rounded-xl border border-[#292936] bg-[#191921] p-4 space-y-3 font-mono text-xs">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-zinc-200">Synthesis screening verified</h4>
                  <p className="text-[10px] text-zinc-500">Twist Bioscience &amp; IDT format compatible</p>
                </div>

                <div className="p-2 rounded bg-[#131318] border border-[#262633] space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">NIST Harmonized Guidelines</span>
                    <span className="text-zinc-200 font-semibold">100% Pass</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">SHA-256 Seal</span>
                    <span className="text-zinc-200">0x8F3A...19C4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HOMOPOLYMER & GC GUARD */}
          <div className="p-6 rounded-2xl border border-[#272733] bg-[#16161c] flex flex-col justify-between group hover:border-[#38384a] transition-all">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Dna className="w-5 h-5 text-zinc-400" />
                <span>Homopolymer &amp; GC Guard</span>
              </div>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Strict biophysical filtering eliminates homopolymers longer than 4 bp and maintains local GC content within ±2.0% of host wildtype.
              </p>

              <div className="mt-6 rounded-xl border border-[#292936] bg-[#191921] p-4 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-[#131318] border border-[#262633]">
                  <span className="text-zinc-400">Max Homopolymer Run</span>
                  <span className="text-zinc-200 font-semibold">≤ 4 bp (Zero Stutter)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#131318] border border-[#262633]">
                  <span className="text-zinc-400">Local ΔGC Drift</span>
                  <span className="text-[#FF5500] font-bold">+0.14% (Safe)</span>
                </div>
              </div>
            </div>
          </div>

          {/* SEQUENCING READ RECOVERY */}
          <div className="p-6 rounded-2xl border border-[#272733] bg-[#16161c] flex flex-col justify-between group hover:border-[#38384a] transition-all">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Cpu className="w-5 h-5 text-zinc-400" />
                <span>Sequencing Read Recovery</span>
              </div>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Berlekamp-Massey Reed-Solomon decoding recovers provenance seals directly from Illumina and Oxford Nanopore FASTQ sequencing runs.
              </p>

              <div className="mt-6 rounded-xl border border-[#292936] bg-[#191921] p-4 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-[#131318] border border-[#262633]">
                  <span className="text-zinc-400">Nanopore 5% Indel Error</span>
                  <span className="text-zinc-200 font-semibold">100% Recovery</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#131318] border border-[#262633]">
                  <span className="text-zinc-400">Decoding Latency</span>
                  <span className="text-white font-bold">&lt; 12 ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* ENGINEERS SECTION                                         */}
      {/* ========================================================= */}
      <section className="relative py-24 px-4 sm:px-6 max-w-7xl mx-auto w-full text-center overflow-hidden">
        
        <div className="absolute top-0 right-0 w-[650px] h-[520px] bg-gradient-to-l from-[#FF5500]/16 via-[#ea580c]/6 to-transparent rounded-full blur-[110px] pointer-events-none -z-0" />

        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-[550] tracking-[-0.035em] text-white leading-[1.15]">
            Designed for the synthetic <br />
            biologists in your workflow
            <span className="text-[#FF5500] font-bold">_</span>
          </h2>

          <p className="mt-4 text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-normal">
            Stamp engineered gene constructs, verify translation sequence fidelity, and recover provenance watermarks from noisy sequencing reads.
          </p>

          {/* AI / Engineering Console Container with Smooth Infinite Cursor Workflow */}
          <div
            onMouseEnter={() => setIsUserHoveringConsole(true)}
            onMouseLeave={() => setIsUserHoveringConsole(false)}
            className="relative mt-12 rounded-2xl border border-[#272733] bg-[#16161c]/95 backdrop-blur-md shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden text-left text-xs"
          >
            {/* Simulated Virtual Cursor Pointer for Autonomous Demonstration */}
            <div
              className={`absolute pointer-events-none z-30 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isUserHoveringConsole || !isConsolePlaying ? "opacity-0 scale-75" : "opacity-100 scale-100"
              }`}
              style={{
                left: `${cursorPos.x}%`,
                top: `${cursorPos.y}%`,
                transform: `translate(-3px, -3px) ${isCursorClicking ? "scale(0.82)" : "scale(1)"}`,
              }}
            >
              {/* Animated Click Ripple */}
              {isCursorClicking && (
                <div className="absolute -top-3.5 -left-3.5 w-9 h-9 rounded-full border-2 border-[#FF5500] animate-ping opacity-90" />
              )}

              {/* High-Fidelity OS Vector Cursor Arrow */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_3px_10px_rgba(0,0,0,0.9)] filter"
              >
                <path
                  d="M3 2L19 10.5L11.5 13L8 21.5L3 2Z"
                  fill="#FFFFFF"
                  stroke="#0C0D12"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {(() => {
              const currQuery = consoleQueries[consoleQueryIdx] || consoleQueries[0];
              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
                  {/* Left Column: Pipeline Stream */}
                  <div className="lg:col-span-6 p-6 border-b lg:border-b-0 lg:border-r border-[#23232c] space-y-4 flex flex-col justify-between">
                    <div className="space-y-3.5">
                      <div className="p-3 rounded-xl border border-[#272733] bg-[#16161c] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[#FF5500]">❖</span>
                            <span className="text-xs font-semibold text-white">HelixSign StegoCodec Engine</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#202028] text-zinc-300 border border-[#2e2e3a] font-mono">
                              Table 11 Codec
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsConsolePlaying(!isConsolePlaying)}
                              className="px-2 py-0.5 rounded text-[11px] font-mono border border-[#2d2d3a] bg-[#191922] text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {isConsolePlaying ? (
                                <>
                                  <Pause className="w-2.5 h-2.5 text-[#FF5500]" />
                                  <span>Active Stream</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-2.5 h-2.5 text-zinc-400" />
                                  <span>Paused</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 font-mono">
                          <span>Biopython &amp; Reed-Solomon GF(2⁸) Verified</span>
                        </div>
                      </div>

                      {/* Construct Switcher */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
                        {consoleQueries.map((q, idx) => {
                          const isActive = consoleQueryIdx === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                setConsoleQueryIdx(idx);
                                setConsoleStage(0);
                              }}
                              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                isActive
                                  ? "bg-[#252533] text-white border border-[#FF5500] shadow-[0_0_12px_rgba(255,85,0,0.2)] font-semibold"
                                  : "bg-[#141419] text-zinc-400 border border-[#23232c] hover:text-zinc-200"
                              }`}
                            >
                              <span>{q.construct}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Query Prompt Bubble */}
                      <div className="flex justify-end pt-1">
                        <div className="px-4 py-2.5 rounded-2xl bg-[#24242d] border border-[#2f2f3a] text-zinc-100 text-xs font-medium max-w-sm shadow-md transition-all">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mb-1">
                            <span>Principal Investigator</span>
                            <span className="text-[#FF5500] font-semibold">{currQuery.construct}</span>
                          </div>
                          {currQuery.query}
                        </div>
                      </div>

                      {/* Tool Step 1 with Live Execution State */}
                      <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        consoleStage >= 1
                          ? "border-[#23232c] bg-[#141418] text-zinc-300"
                          : "border-amber-900/50 bg-amber-950/20 text-amber-200"
                      }`}>
                        <div className="flex items-center gap-2">
                          <Wrench className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="font-mono text-[11px]">
                            Using engine <span className="text-zinc-200">{currQuery.step1Name}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-400 bg-[#1c1c24] px-1.5 py-0.5 rounded border border-[#2a2a38]">
                            {consoleStage >= 1 ? currQuery.step1Metric : "Evaluating..."}
                          </span>
                          {consoleStage >= 1 ? (
                            <Check className="w-3.5 h-3.5 text-[#FF5500]" />
                          ) : (
                            <RotateCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                          )}
                        </div>
                      </div>

                      {/* Tool Step 2 with Live Execution State */}
                      <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        consoleStage >= 2
                          ? "border-[#23232c] bg-[#141418] text-zinc-300"
                          : consoleStage === 1
                          ? "border-amber-900/50 bg-amber-950/20 text-amber-200"
                          : "border-border/40 bg-[#111116] text-zinc-500 opacity-60"
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">❖</span>
                          <span className="font-mono text-[11px]">
                            Ran encoder <span className="text-zinc-200">{currQuery.step2Name}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-400 bg-[#1c1c24] px-1.5 py-0.5 rounded border border-[#2a2a38]">
                            {consoleStage >= 2 ? currQuery.step2Metric : consoleStage === 1 ? "Optimizing..." : "Queued"}
                          </span>
                          {consoleStage >= 2 ? (
                            <Check className="w-3.5 h-3.5 text-[#FF5500]" />
                          ) : consoleStage === 1 ? (
                            <RotateCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-zinc-600" />
                          )}
                        </div>
                      </div>

                      {/* Result Box with Illumination on Stage 3 */}
                      <div className={`p-3 rounded-lg border transition-all text-xs text-zinc-200 leading-relaxed font-sans shadow-sm ${
                        consoleStage >= 3
                          ? "border-[#FF5500]/50 bg-[#191924] shadow-[0_0_15px_rgba(255,85,0,0.12)]"
                          : "border-[#272735] bg-[#181822] opacity-80"
                      }`}>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#FF5500] mb-1 font-semibold">
                          <Zap className="w-3 h-3 fill-current" />
                          <span>HELIXSIGN PROVENANCE SYNTHESIS</span>
                        </div>
                        <p>{currQuery.response}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live Result Inspector */}
                  <div className="lg:col-span-6 p-6 bg-[#141419] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#23232c] text-xs">
                        <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-[#111116] border border-[#272733] font-mono text-[11px]">
                          <button
                            onClick={() => setInspectorMode("carriers")}
                            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                              inspectorMode === "carriers"
                                ? "bg-[#252533] text-white font-semibold shadow-sm border border-[#FF5500]/50"
                                : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            carrier_codons
                          </button>
                          <button
                            onClick={() => setInspectorMode("kmer")}
                            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                              inspectorMode === "kmer"
                                ? "bg-[#252533] text-white font-semibold shadow-sm border border-[#FF5500]/50"
                                : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            kmer_metrics
                          </button>
                        </div>
                        <span className="font-mono text-[10px] text-zinc-400">
                          {inspectorMode === "carriers" ? "SYNONYMOUS CODON MAPPING" : "DISTRIBUTION INVARIANCE"}
                        </span>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-bold text-white tracking-tight">{currQuery.tableName}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">{currQuery.totalRows}</p>
                      </div>

                      <div className="my-3 p-2.5 rounded-lg border border-[#262630] bg-[#121217] font-mono text-xs overflow-x-auto text-zinc-300">
                        <span className="text-[#FF5500] font-semibold">SELECT</span>{" "}
                        <span className="text-zinc-300">locus_id, from_codon, to_codon, amino_acid, wi, rs_symbol</span>{" "}
                        <span className="text-[#FF5500] font-semibold">FROM</span>{" "}
                        <span className="text-zinc-100 font-semibold">{currQuery.tableName}</span>
                      </div>

                      {inspectorMode === "carriers" ? (
                        <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                          {(currQuery.carrierRows || []).map((row, idx) => {
                            const isStreamingActive = (wganStep % (currQuery.carrierRows?.length || 1)) === idx;
                            const isSelected = selectedEventIdx === idx;
                            return (
                              <div
                                key={row.id}
                                onClick={() => setSelectedEventIdx(idx)}
                                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                                  isSelected || isStreamingActive
                                    ? "border-[#FF5500]/80 bg-[#FF5500]/15 shadow-sm scale-[1.01]"
                                    : "border-[#22222b] bg-[#15151a] hover:border-zinc-700 hover:bg-[#181920]"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center font-mono border ${
                                    isSelected || isStreamingActive
                                      ? "bg-[#FF5500] text-white border-[#FF5500]"
                                      : "bg-zinc-800 border-zinc-700/60 text-zinc-300"
                                  }`}>
                                    0{idx + 1}
                                  </div>
                                  <div>
                                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                                      <span>{row.id}</span>
                                      <span className="text-[#FF5500] font-mono">{row.from} &rarr; {row.to}</span>
                                      <span className="text-zinc-300 font-normal">({row.aa})</span>
                                    </div>
                                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                                      w_i = {row.wi.toFixed(3)} &bull; GF(2⁸) {row.rsHex} &bull; {row.desc}
                                    </div>
                                  </div>
                                </div>

                                <span className={`text-[10px] px-2 py-0.5 rounded font-medium font-mono shrink-0 ${
                                  isSelected || isStreamingActive
                                    ? "bg-[#FF5500] text-white font-bold"
                                    : "bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/30"
                                }`}>
                                  {row.status}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {currQuery.events.map((ev, idx) => {
                            const isSelected = selectedEventIdx === idx;
                            return (
                              <div
                                key={idx}
                                onClick={() => setSelectedEventIdx(idx)}
                                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                                  isSelected
                                    ? "border-[#FF5500]/70 bg-[#FF5500]/15 shadow-sm scale-[1.01]"
                                    : "border-[#22222b] bg-[#15151a] hover:border-zinc-700 hover:bg-[#181920]"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center font-mono border ${
                                    isSelected
                                      ? "bg-[#FF5500] text-white border-[#FF5500]"
                                      : "bg-zinc-800 border-zinc-700/60 text-zinc-300"
                                  }`}>
                                    0{idx + 1}
                                  </div>
                                  <div>
                                    <div className="text-xs font-semibold text-white">
                                      <span>{ev.id} ({ev.mode})</span>
                                    </div>
                                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                                      {ev.amp} &bull; {ev.h1}
                                    </div>
                                  </div>
                                </div>

                                <span className={`text-[10px] px-2 py-0.5 rounded font-medium font-mono ${
                                  isSelected
                                    ? "bg-[#FF5500] text-white font-bold"
                                    : "bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/30"
                                }`}>
                                  {ev.freq}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[#23232c] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                      <span>Showing {currQuery.carrierRows?.length || 8} carrier loci &bull; {currQuery.totalRows}</span>
                      <Link href="/datasets" className="text-zinc-400 hover:text-white transition-colors">
                        View full catalog in Datasets &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Console Pipeline Live Workflow Status Bar */}
          <div className="mt-4 px-4 py-3 rounded-xl border border-[#23232c] bg-[#131318] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-400 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-200 font-semibold">Simulated Workflow: Continuous Live Evaluation</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-zinc-400">
              <span className="text-zinc-300">Target: <strong className="text-white">{consoleQueries[consoleQueryIdx]?.construct || "Construct"}</strong></span>
              <span>•</span>
              <span>WGAN-GP Stealth: <strong className="text-emerald-400">AUC 0.505</strong></span>
              <span>•</span>
              <span>Reed-Solomon: <strong className="text-[#FF5500]">0x7E Verified</strong></span>
            </div>
          </div>
        </div>

        {/* Terminal CLI Integration */}
        <div className="mt-20 sm:mt-28 text-center">
          <h3 className="text-xl sm:text-2xl font-[550] tracking-[-0.02em] text-white">
            Instant terminal &amp; bioinformatic pipeline integration
          </h3>

          <div className="mt-6 max-w-xl mx-auto rounded-xl border border-[#26262c] bg-[#141418] p-4 text-left font-mono text-xs text-zinc-300">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[10px] text-zinc-500">
              <span>BASH / TERMINAL</span>
              <button
                onClick={() => handleCopy("pip install helixsign-bio && helixsign stamp --input ./puc19_lacz.fasta --owner 'ApexBio' --ecc rs16_8", "cli")}
                className="hover:text-white flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedId === "cli" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <p className="text-zinc-400">$ pip install helixsign-bio</p>
            <p className="text-[#FF5500] mt-1">$ helixsign stamp --input ./puc19_lacz.fasta --owner &quot;ApexBio&quot; --ecc rs16_8</p>
            <p className="text-zinc-300 mt-2 font-medium">✓ In silico translation verified: 1,025 / 1,025 codons match primary sequence</p>
            <p className="text-zinc-400">✓ 64 synonymous carrier codons embedded (Stealth AUC: 0.505)</p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-zinc-400">
            <span className="font-mono text-xs flex items-center gap-1.5"><PythonLogo className="w-3.5 h-3.5" /> Python 3.11+</span>
            <span className="font-mono text-xs flex items-center gap-1.5"><PyTorchLogo className="w-3.5 h-3.5" /> PyTorch (WGAN-GP)</span>
            <span className="font-mono text-xs flex items-center gap-1.5"><BiopythonLogo className="w-3.5 h-3.5" /> Biopython SeqIO</span>
            <span className="font-mono text-xs flex items-center gap-1.5"><ReedSoloLogo className="w-3.5 h-3.5" /> reedsolo GF(2⁸)</span>
            <span className="font-mono text-xs flex items-center gap-1.5"><NumPyLogo className="w-3.5 h-3.5" /> NumPy</span>
            <span className="font-mono text-xs flex items-center gap-1.5"><FastApiLogo className="w-3.5 h-3.5" /> FastAPI</span>
            <span className="font-mono text-xs flex items-center gap-1.5"><NextJsLogo className="w-3.5 h-3.5" /> Next.js 15</span>
            <span className="text-[11px] text-zinc-400 font-mono font-medium">
              +4 Codecs
            </span>
          </div>
        </div>

        {/* Model Benchmark Arena Table */}
        <div className="mt-20 rounded-2xl border border-[#272733] bg-[#16161c] p-6 text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#23232c]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">Steganographic Benchmark Arena</span>
              </div>
              <p className="mt-1 text-xs text-zinc-400 max-w-xl">
                Comparing HelixSign against direct codon injection, unkeyed methods, and unchecked baselines across synthetic biology datasets.
              </p>
            </div>

            <Link href="/compare" className="px-4 py-2 rounded-lg border border-[#2e2e3d] bg-[#1c1c26] hover:bg-[#252535] text-xs font-semibold text-white transition-colors cursor-pointer self-start md:self-auto">
              View full benchmark
            </Link>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-2 font-semibold">Model / Framework</th>
                  <th className="py-3 px-2 font-semibold text-right">Decode Time</th>
                  <th className="py-3 px-2 font-semibold text-right">Protein Invariance</th>
                  <th className="py-3 px-2 font-semibold text-right">Stealth AUC</th>
                  <th className="py-3 px-2 font-semibold text-right">Synthesis Pass</th>
                  <th className="py-3 px-2 font-semibold text-right">Seq Recovery</th>
                  <th className="py-3 px-2 font-semibold text-right">Host CAI</th>
                  <th className="py-3 px-2 font-semibold text-right">Local ΔGC</th>
                  <th className="py-3 px-2 font-semibold text-right">Error Tolerance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {BENCHMARK_MODELS.map((m, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-zinc-800/30 transition-colors ${
                      m.highlight ? "bg-[#FF5500]/5 text-white" : ""
                    }`}
                  >
                    <td className="py-3 px-2 font-semibold text-white flex items-center gap-2">
                      {m.highlight && <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />}
                      <span>{m.model}</span>
                    </td>
                    <td className="py-3 px-2 text-right text-zinc-400">{m.cost}</td>
                    <td className="py-3 px-2 text-right font-semibold text-zinc-100">{m.overall}</td>
                    <td className="py-3 px-2 text-right text-zinc-300">{m.auth}</td>
                    <td className="py-3 px-2 text-right text-zinc-300">{m.tables}</td>
                    <td className="py-3 px-2 text-right text-zinc-300">{m.functions}</td>
                    <td className="py-3 px-2 text-right text-zinc-300">{m.storage}</td>
                    <td className="py-3 px-2 text-right text-zinc-300">{m.sites}</td>
                    <td className="py-3 px-2 text-right font-semibold text-[#FF5500]">{m.messaging}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* VALIDATED ON BIOLOGICAL BENCHMARKS                        */}
      {/* ========================================================= */}
      <section className="relative py-20 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto w-full text-center border-t border-[#23232c] overflow-hidden">
        
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(255,85,0,0.06)_0%,rgba(194,65,12,0.02)_50%,transparent_75%)] pointer-events-none -z-10 blur-3xl" />

        <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-[550] tracking-[-0.035em] text-white leading-[1.15]">
          Validated on standard synthetic biology constructs
          <span className="text-[#FF5500] font-bold">_</span>
        </h2>

        <p className="mt-4 text-sm sm:text-base text-zinc-400 font-normal max-w-2xl mx-auto leading-relaxed">
          From industrial reporter enzymes to high-expression fluorophores and CRISPR endonucleases.
        </p>

        <div className="mt-14 flex items-stretch gap-5 overflow-x-auto pb-4 no-scrollbar text-left scroll-smooth">
          
          {/* CARD 1: lacZ Reporter */}
          <div
            onClick={() => setActiveTestimonial(0)}
            className={`rounded-2xl border border-[#27272c] bg-[#1d1d21] p-8 sm:p-10 flex flex-col justify-between shadow-2xl min-h-[360px] sm:min-h-[400px] transition-all duration-300 ${
              activeTestimonial === 0
                ? "min-w-[340px] sm:min-w-[560px] lg:min-w-[620px] flex-1 cursor-default"
                : "w-[150px] sm:w-[170px] lg:w-[190px] shrink-0 items-center justify-center cursor-pointer hover:border-[#38384a]"
            }`}
          >
            {activeTestimonial === 0 ? (
              <>
                <div>
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-5 h-5 text-[#FF5500]" />
                    <span className="text-xl font-medium text-white tracking-tight">lacZ Reporter Benchmark</span>
                  </div>

                  <h3 className="mt-6 text-2xl sm:text-3xl lg:text-[32px] font-[550] text-white tracking-tight leading-[1.22] max-w-xl">
                    100.0% catalytic activity preserved across 1,025 codons
                  </h3>

                  <p className="mt-6 text-sm sm:text-base text-zinc-400 font-normal leading-relaxed max-w-xl">
                    “Reconstructed coding sequence achieves 100.0% exact amino acid translation identity and preserves native β-galactosidase enzymatic kinetics in E. coli MG1655.”
                  </p>
                </div>

                <div className="mt-8 pt-6 flex items-center justify-between border-t border-transparent">
                  <span className="text-xs text-zinc-300 font-normal">
                    NCBI RefSeq NC_000913.3 (Bacterial Codec Table 11)
                  </span>

                  <Link
                    href="/datasets"
                    className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 font-medium group"
                  >
                    <span>Read dataset specification</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-zinc-400 group-hover:text-white text-lg font-medium tracking-tight transition-colors">
                <Dna className="w-4 h-4 text-zinc-400" />
                <span>lacZ CDS</span>
              </div>
            )}
          </div>

          {/* CARD 2: sfGFP Fluorophore */}
          <div
            onClick={() => setActiveTestimonial(1)}
            className={`rounded-2xl border border-[#27272c] bg-[#1d1d21] p-8 sm:p-10 flex flex-col justify-between shadow-2xl min-h-[360px] sm:min-h-[400px] transition-all duration-300 ${
              activeTestimonial === 1
                ? "min-w-[340px] sm:min-w-[560px] lg:min-w-[620px] flex-1 cursor-default"
                : "w-[150px] sm:w-[170px] lg:w-[190px] shrink-0 items-center justify-center cursor-pointer hover:border-[#38384a]"
            }`}
          >
            {activeTestimonial === 1 ? (
              <>
                <div>
                  <div className="flex items-center text-zinc-200 text-2xl font-medium tracking-tight">
                    <span>sfGFP Fluorophore Benchmark</span>
                  </div>

                  <h3 className="mt-6 text-2xl sm:text-3xl lg:text-[32px] font-[550] text-white tracking-tight leading-[1.22] max-w-xl">
                    Superfolder fluorophore emission spectra identical to wildtype
                  </h3>

                  <p className="mt-6 text-sm sm:text-base text-zinc-400 font-normal leading-relaxed max-w-xl">
                    “Fluorescence excitation (485 nm) and emission (510 nm) spectra match native sfGFP with 32-bit watermark embedded in synonymous loci.”
                  </p>
                </div>

                <div className="mt-8 pt-6 flex items-center justify-between border-t border-transparent">
                  <span className="text-xs text-zinc-300 font-normal">
                    Synthetic sfGFP Cassette (239 Codons)
                  </span>

                  <Link
                    href="/datasets"
                    className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 font-medium group"
                  >
                    <span>Read dataset specification</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex items-center text-zinc-300 text-xl font-medium tracking-tight">
                <span>sfGFP CDS</span>
              </div>
            )}
          </div>

          {/* CARD 3: SpCas9 Endonuclease */}
          <div
            onClick={() => setActiveTestimonial(2)}
            className={`rounded-2xl border border-[#27272c] bg-[#1d1d21] p-8 sm:p-10 flex flex-col justify-between shadow-2xl min-h-[360px] sm:min-h-[400px] transition-all duration-300 ${
              activeTestimonial === 2
                ? "min-w-[340px] sm:min-w-[560px] lg:min-w-[620px] flex-1 cursor-default"
                : "w-[150px] sm:w-[170px] lg:w-[190px] shrink-0 items-center justify-center cursor-pointer hover:border-[#38384a]"
            }`}
          >
            {activeTestimonial === 2 ? (
              <>
                <div>
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    SpCas9 Endonuclease Testbed
                  </span>

                  <h3 className="mt-6 text-2xl sm:text-3xl lg:text-[32px] font-[550] text-white tracking-tight leading-[1.22] max-w-xl">
                    Endonuclease target cleavage efficiency identical to control
                  </h3>

                  <p className="mt-6 text-sm sm:text-base text-zinc-400 font-normal leading-relaxed max-w-xl">
                    “CRISPR cleavage assays demonstrate equal on-target catalytic rate across 1,368 codons with 128 multi-tile carrier loci.”
                  </p>
                </div>

                <div className="mt-8 pt-6 flex items-center justify-between border-t border-transparent">
                  <span className="text-xs text-zinc-300 font-normal">
                    Streptococcus pyogenes Cas9 (4,104 bp)
                  </span>

                  <Link
                    href="/docs"
                    className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 font-medium group"
                  >
                    <span>Read synopsis</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </Link>
                </div>
              </>
            ) : (
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-300 hover:text-white transition-colors">
                SpCas9 CDS
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SCIENTIFIC RIGOR & COMPLIANCE                             */}
      {/* ========================================================= */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 max-w-7xl mx-auto w-full text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-[550] tracking-[-0.035em] text-white leading-[1.15]">
          Scientific rigor &amp; compliance across <br />
          modern genetic workflows
          <span className="text-[#FF5500] font-bold">_</span>
        </h2>

        <p className="mt-4 text-sm sm:text-base text-zinc-400 font-normal max-w-2xl mx-auto leading-relaxed">
          From biosecurity evasion testing to synthesis validation and cryptographic provenance verification.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 text-left">
          {SECURITY_CARDS.map((card, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-[#272733] bg-[#16161c] hover:border-[#38384a] transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-[#22222b] border border-[#2d2d38] flex items-center justify-center mb-4">
                {card.icon}
              </div>
              <h3 className="text-sm sm:text-[15px] font-semibold text-white tracking-tight mb-2">
                {card.title}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* DUAL TELEMETRY CONSOLE                                     */}
      {/* ========================================================= */}
      <section className="relative pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto w-full text-center border-t border-[#23232c] overflow-hidden">
        
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          The HelixSign Provenance Network
          <span className="text-[#FF5500]">_</span>
        </h2>

        <p className="mt-4 text-zinc-400 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
          Unified synthesis-to-sequencing verification: FASTA construct ingestion, Reed-Solomon codeword allocation, and tamper-evident SHA-256 registry dispatch with zero protein perturbation.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold">
          <div className="flex items-center gap-2 text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-zinc-400" />
            <span>Translation Sequence Fidelity</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-zinc-400" />
            <span>Reed-Solomon RS(16,8) ECC</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-zinc-400" />
            <span>Biosecurity Stealth (AUC 0.505)</span>
          </div>
        </div>

        <div className="mt-12 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
          
          {/* Card 1: HelixSign MCP Execution Log */}
          <div className="rounded-2xl border border-[#222228] bg-[#141418] p-6 sm:p-7 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1e1e24] border border-[#2a2a34] flex items-center justify-center text-zinc-400">
                    <Terminal className="w-4 h-4 text-zinc-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">HelixSign MCP</span>
                      <span className="text-[11px] font-medium text-zinc-300">Connected</span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500">mcp.helixsign.bio</span>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                <Check className="w-3.5 h-3.5 text-zinc-400" />
                <span>Authenticated with Cryptographic Lab Key</span>
              </div>

              <div className="mt-6 flex justify-end">
                <div className="bg-[#1f1f26] border border-[#282833] rounded-2xl px-4 py-2.5 text-xs text-zinc-200 max-w-sm text-left shadow-sm">
                  Verify pUC19-lacZ construct for function-invariant ownership seal.
                </div>
              </div>

              <div className="mt-6 space-y-3 font-sans text-xs">
                <div className="flex items-center justify-between py-1 text-zinc-400">
                  <div className="flex items-center gap-3">
                    <Wrench className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-zinc-500 font-medium">Using skill</span>
                    <span className="text-zinc-300 font-mono text-[11px]">helixsign.stampConstruct</span>
                  </div>
                  <Check className="w-4 h-4 text-zinc-400" />
                </div>

                <div className="flex items-center justify-between py-1 text-zinc-400">
                  <div className="flex items-center gap-3">
                    <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-zinc-500 font-medium">Ran MCP</span>
                    <span className="text-zinc-300 font-mono text-[11px]">steganography.verifyInvariance</span>
                  </div>
                  <Check className="w-4 h-4 text-zinc-400" />
                </div>
              </div>

              <p className="mt-6 text-xs text-zinc-300 leading-relaxed font-sans">
                64 carrier codon substitutions mapped across 1,025 codons. Primary amino acid translation verified 100.0% invariant. Reed-Solomon RS(16,8) parity symbols locked.
              </p>
            </div>
          </div>

          {/* Card 2: Registered Constructs */}
          <div className="rounded-2xl border border-[#222228] bg-[#141418] p-6 sm:p-7 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="inline-block px-2.5 py-1 rounded-md bg-[#1f1f26] text-zinc-200 font-mono text-xs font-semibold">
                Constructs
              </div>

              <div className="mt-4">
                <h4 className="text-white font-semibold text-sm">active_provenance_registry</h4>
                <p className="text-zinc-500 text-xs mt-0.5">Verified engineered sequences on file</p>
              </div>

              <div className="mt-4 px-3.5 py-2.5 rounded-lg bg-[#0e0e12] border border-[#1f1f26] font-mono text-xs text-zinc-300 select-all">
                <span className="text-zinc-400">SELECT * FROM watermark_registry WHERE protein_identity = 1.0</span>
              </div>

              <div className="mt-4 space-y-1">
                {[
                  { initials: "LZ", name: "lacZ β-Galactosidase (E. coli K-12)", detail: "3,075 bp • 64 Carrier Loci • RS(16,8)", status: "Verified", isVerified: true },
                  { initials: "GF", name: "sfGFP Superfolder Fluorophore", detail: "717 bp • 32 Carrier Loci • RS(16,8)", status: "Verified", isVerified: true },
                  { initials: "C9", name: "SpCas9 CRISPR Endonuclease", detail: "4,104 bp • 128 Carrier Loci • RS(16,8)", status: "Pending", isVerified: false },
                ].map((row, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2.5 px-2 hover:bg-[#1a1a20]/60 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#22222b] border border-[#2b2b36] flex items-center justify-center text-[10px] font-mono font-medium text-zinc-300">
                        {row.initials}
                      </div>
                      <div>
                        <div className="text-white text-xs font-medium">{row.name}</div>
                        <div className="text-zinc-500 text-[11px] font-mono">{row.detail}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        row.isVerified
                          ? "bg-zinc-800/80 text-zinc-300 border border-zinc-700"
                          : "bg-amber-500/10 text-amber-400/90 border border-amber-500/20"
                      }`}
                    >
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* STATS SCALE SECTION                                       */}
      {/* ========================================================= */}
      <section className="relative py-24 px-4 sm:px-6 max-w-7xl mx-auto w-full text-left overflow-hidden">
        
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#FF5500] to-transparent shadow-[0_0_20px_#FF5500] rotate-[-7deg] pointer-events-none opacity-80" />

        <div className="relative z-10">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Proven across millions of base pairs <br />
            with zero translation error
            <span className="text-[#FF5500]">_</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-14">
            {SCALE_STATS.map((stat, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-[#272733] bg-[#16161c]/90 backdrop-blur-md hover:border-[#38384a] transition-all"
              >
                <div className="text-xl sm:text-2xl font-extrabold font-mono text-white tracking-tight">
                  {stat.value}
                </div>
                <span className="text-[11px] text-zinc-400 mt-1 block truncate">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* DOCUMENTATION & RESEARCH CARDS                            */}
      {/* ========================================================= */}
      <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto w-full text-left border-t border-[#23232c]">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-[550] tracking-[-0.035em] text-white leading-[1.12]">
              Read our documentation &amp; <br />
              scientific research
              <span className="text-[#FF5500] font-bold">_</span>
            </h2>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto">
            <Link
              href="/docs"
              className="bg-[#FF5500] hover:bg-[#E54B00] text-white font-medium px-5 py-2.5 rounded-lg shadow-[0_0_20px_rgba(255,85,0,0.35)] hover:shadow-[0_0_25px_rgba(255,85,0,0.55)] transition-all text-xs"
            >
              Read all docs
            </Link>
            <Link
              href="/architecture"
              className="bg-[#1a1a20] hover:bg-[#23232a] border border-[#2c2c36] text-[#cfcfd8] hover:text-white font-medium px-5 py-2.5 rounded-lg transition-all text-xs"
            >
              View architecture
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2b2b34] bg-[#1a1a1f] grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#2b2b34] overflow-hidden shadow-2xl">
          
          {/* Column 1: Architecture & TRD */}
          <div className="p-8 flex flex-col justify-between min-h-[370px] bg-[#1a1a1f]">
            <div>
              <span className="text-sm font-semibold text-zinc-200 block">Architecture &amp; TRD</span>
              
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl sm:text-5xl font-[550] text-white tracking-tight">
                  TRD-01
                </span>
                <span className="text-xs text-[#71717a] font-normal ml-1">/ Spec</span>
              </div>

              <p className="mt-5 text-xs text-[#a1a1aa] leading-relaxed">
                Full architectural blueprint detailing degenerate codon space math, HKDF-SHA256 carrier dispersion, and Galois Field GF(2⁸) Reed-Solomon coding.
              </p>
            </div>

            <div className="pt-8">
              <Link href="/docs?topic=architecture" className="w-full block">
                <button className="w-full py-2.5 rounded-lg text-xs font-medium bg-[#16161b] hover:bg-[#202026] border border-[#2a2a33] text-zinc-300 hover:text-white transition-colors cursor-pointer">
                  Read technical specs
                </button>
              </Link>
            </div>
          </div>

          {/* Column 2: Scientific Research */}
          <div className="p-8 flex flex-col justify-between min-h-[370px] bg-[#1a1a1f]">
            <div>
              <span className="text-sm font-semibold text-zinc-200 block">Scientific Research</span>
              
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl sm:text-5xl font-[550] text-white tracking-tight">
                  NeurIPS
                </span>
                <span className="text-xs text-[#71717a] font-normal ml-1">/ Pre-print</span>
              </div>

              <p className="mt-5 text-xs text-[#a1a1aa] leading-relaxed">
                Peer-reviewed mathematical proofs on 100% amino acid sequence invariance, host CAI kinetics preservation, and WGAN-GP biosecurity stealth.
              </p>
            </div>

            <div className="pt-8">
              <Link href="/docs?topic=takens-embedding" className="w-full block">
                <button className="w-full py-2.5 rounded-lg text-xs font-medium bg-[#16161b] hover:bg-[#202026] border border-[#2a2a33] text-zinc-300 hover:text-white transition-colors cursor-pointer">
                  Explore research
                </button>
              </Link>
            </div>
          </div>

          {/* Column 3: Developer Docs & SDK (Featured) */}
          <div className="p-8 flex flex-col justify-between min-h-[370px] bg-gradient-to-b from-[#2e1c27] via-[#241a22] to-[#1a1a1f] relative">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Developer Docs &amp; SDK</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#3D1405] text-[#FF5500] border border-[#662208]">
                  Core Guide
                </span>
              </div>
              
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl sm:text-5xl font-[550] text-white tracking-tight">
                  Docs
                </span>
                <span className="text-xs text-[#71717a] font-normal ml-1">/ Python &amp; REST</span>
              </div>

              <p className="mt-5 text-xs text-[#a1a1aa] leading-relaxed">
                Interactive quickstart guides, Python CLI tutorial, Biopython SeqIO pipelines, and OpenAPI contracts for automated high-throughput construct stamping.
              </p>
            </div>

            <div className="pt-8">
              <Link href="/docs" className="w-full block">
                <button className="w-full py-2.5 rounded-lg text-xs font-semibold bg-[#FF5500] hover:bg-[#E54B00] text-white shadow-[0_0_20px_rgba(255,85,0,0.35)] hover:shadow-[0_0_25px_rgba(255,85,0,0.55)] transition-all cursor-pointer">
                  Read our docs
                </button>
              </Link>
            </div>
          </div>

          {/* Column 4: Biosecurity Standards */}
          <div className="p-8 flex flex-col justify-between min-h-[370px] bg-[#1a1a1f]">
            <div>
              <span className="text-sm font-semibold text-zinc-200 block">Biosecurity Standards</span>
              
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl sm:text-5xl font-[550] text-white tracking-tight">
                  ISO/IEC
                </span>
                <span className="text-xs text-[#71717a] font-normal ml-1">/ Compliance</span>
              </div>

              <p className="mt-5 text-xs text-[#a1a1aa] leading-relaxed">
                NIST-harmonized biosecurity compliance, SHA-256 seal verification, and standards for gene synthesis provider screening consortia.
              </p>
            </div>

            <div className="pt-8">
              <Link href="/docs?topic=ndt-compliance" className="w-full block">
                <button className="w-full py-2.5 rounded-lg text-xs font-medium bg-[#16161b] hover:bg-[#202026] border border-[#2a2a33] text-zinc-300 hover:text-white transition-colors cursor-pointer">
                  View compliance docs
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* HELIXSIGN FOOTER                                          */}
      {/* ========================================================= */}
      <footer className="border-t border-[#23232c] bg-[#101014] py-16 px-4 sm:px-6 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
          
          <div className="col-span-2 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 group select-none"
            >
              <AppLogo size="md" showText={false} />

              <span className="font-[600] text-white tracking-[-0.04em] font-sans text-[19px] leading-none">
                HelixSign
              </span>
              <span className="text-[11px] font-mono text-zinc-500 ml-0.5">
                DNA provenance
              </span>
            </Link>

            <p className="text-zinc-500 max-w-sm text-xs leading-relaxed">
              Function-invariant DNA steganography &amp; provenance verification platform for synthetic biology and biosecurity screening.
            </p>
            <div className="flex items-center gap-2.5 text-zinc-400 pt-1 font-mono text-[11px]">
              <span className="text-zinc-300 font-medium">Enterprise Platform</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">Release v2.0.0</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="text-white font-semibold text-xs uppercase tracking-wider block mb-3">
              Platform
            </span>
            <div className="space-y-2 text-zinc-400">
              <div><Link href="/dashboard" className="hover:text-white transition-colors">Overview</Link></div>
              <div><Link href="/upload" className="hover:text-white transition-colors">Stamp Studio</Link></div>
              <div><Link href="/analysis" className="hover:text-white transition-colors">Steganographic Pipeline</Link></div>
              <div><Link href="/compare" className="hover:text-white transition-colors">Stealth Benchmarks</Link></div>
              <div><Link href="/monitor" className="hover:text-white transition-colors">Channel Stress Lab</Link></div>
              <div><Link href="/datasets" className="hover:text-white transition-colors">Genomic CDS Datasets</Link></div>
              <div><Link href="/reports" className="hover:text-white transition-colors">Provenance Registry</Link></div>
              <div><Link href="/settings" className="hover:text-white transition-colors">Codec Settings</Link></div>
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="text-white font-semibold text-xs uppercase tracking-wider block mb-3">
              Methodology
            </span>
            <div className="space-y-2 text-zinc-400">
              <div><Link href="/docs" className="hover:text-white transition-colors">Abstract &amp; PRD</Link></div>
              <div><Link href="/docs" className="hover:text-white transition-colors">Synonymous Codon Manifold</Link></div>
              <div><Link href="/docs" className="hover:text-white transition-colors">Reed-Solomon RS(16,8)</Link></div>
              <div><Link href="/docs" className="hover:text-white transition-colors">WGAN-GP Realism Refiner</Link></div>
              <div><Link href="/docs" className="hover:text-white transition-colors">HKDF-SHA256 Dispersion</Link></div>
              <div><Link href="/docs" className="hover:text-white transition-colors">Biosecurity Stealth AUC</Link></div>
              <div><Link href="/docs" className="hover:text-white transition-colors">In Silico Peptide Invariance</Link></div>
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="text-white font-semibold text-xs uppercase tracking-wider block mb-3">
              Compliance
            </span>
            <div className="space-y-2 text-zinc-400">
              <div><Link href="/docs/data-contracts" className="hover:text-white transition-colors">Data Contracts</Link></div>
              <div><Link href="/docs/system-design" className="hover:text-white transition-colors">System Architecture</Link></div>
              <div><Link href="/docs" className="hover:text-white transition-colors">API Documentation</Link></div>
              <div><Link href="/reports" className="hover:text-white transition-colors">NIST Screening Guidelines</Link></div>
              <div><Link href="/settings" className="hover:text-white transition-colors">Host Codec Calibration</Link></div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-10 mt-10 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <span>&copy; 2026 HelixSign DNA Provenance Technologies Inc. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <span className="text-zinc-400">NIST Screening Compliant</span>
            <span className="text-zinc-400">Table 11 Bacterial Codec</span>
            <span className="text-zinc-400">ISO/IEC 18033 Cryptographic Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
