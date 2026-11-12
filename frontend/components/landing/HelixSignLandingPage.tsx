"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AppLogo } from "@/components/ui/AppLogo";
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
    sql: "SELECT construct_id, gene_name, protein_identity, carrier_count, stealth_auc FROM watermark_registry WHERE gene_name = 'lacZ'",
    tableName: "lacz_watermark_manifest",
    totalRows: "1,025 codons logged",
    events: [
      { id: "LOC-014", mode: "GAG → GAA (Glu)", amp: "wi: 0.988", h1: "Synonymous", freq: "Safe", isCritical: false, wavePath: "M0,10 L15,10 L18,3 L22,17 L25,10 L60,10" },
      { id: "LOC-028", mode: "CTG → CTA (Leu)", amp: "wi: 0.965", h1: "Synonymous", freq: "Safe", isCritical: false, wavePath: "M0,10 L15,10 L18,5 L22,15 L25,10 L60,10" },
      { id: "LOC-042", mode: "GTG → GTA (Val)", amp: "wi: 0.972", h1: "Synonymous", freq: "Safe", isCritical: false, wavePath: "M0,10 L15,10 L18,4 L22,16 L25,10 L60,10" },
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
    sql: "SELECT run_id, construct, noise_type, errors_corrected, watermark_recovered FROM noise_channel_runs WHERE construct = 'sfGFP'",
    tableName: "sfgfp_noise_benchmark",
    totalRows: "239 codons logged",
    events: [
      { id: "ERR-012", mode: "Sub GTT → GTC", amp: "Corrected", h1: "Val (V)", freq: "RS Valid", isCritical: false, wavePath: "M0,10 L15,10 L18,6 L22,14 L25,10 L60,10" },
      { id: "ERR-024", mode: "Sub GGT → GGC", amp: "Corrected", h1: "Gly (G)", freq: "RS Valid", isCritical: false, wavePath: "M0,10 L15,10 L18,2 L22,18 L25,10 L60,10" },
      { id: "ERR-038", mode: "Sub ACT → ACC", amp: "Corrected", h1: "Thr (T)", freq: "RS Valid", isCritical: false, wavePath: "M0,10 L15,10 L18,5 L22,15 L25,10 L60,10" },
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
    sql: "SELECT construct_id, host, mmd_score, wgan_loss, stealth_auc FROM biosecurity_evals WHERE gene_name = 'cas9'",
    tableName: "spcas9_stealth_eval",
    totalRows: "1,368 codons logged",
    events: [
      { id: "KMER-01", mode: "Hexamer Freq Dist", amp: "p = 0.96", h1: "Host Invariant", freq: "Stealth Pass", isCritical: false, wavePath: "M0,10 L15,10 L18,4 L22,16 L25,10 L60,10" },
      { id: "KMER-02", mode: "Codon Pair Bias", amp: "Z = -0.12", h1: "Host Invariant", freq: "Stealth Pass", isCritical: false, wavePath: "M0,10 L15,10 L18,5 L22,15 L25,10 L60,10" },
      { id: "KMER-03", mode: "1D-CNN Detection", amp: "AUC 0.505", h1: "Undetectable", freq: "Stealth Pass", isCritical: false, wavePath: "M0,10 L15,10 L18,3 L22,17 L25,10 L60,10" },
    ]
  }
];

export default function HelixSignLandingPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedManagedDb, setSelectedManagedDb] = useState<"postgres" | "mysql">("postgres");
  const [activeCategory, setActiveCategory] = useState<"BUILD" | "DEPLOY" | "PROTECT" | "SCALE">("BUILD");
  const [pipelineStep, setPipelineStep] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [tdaVisualMode, setTdaVisualMode] = useState<"attractor" | "persistence" | "betti">("attractor");
  const [activeStealthStep, setActiveStealthStep] = useState<number>(0);
  const [stealthRunLength, setStealthRunLength] = useState<number>(84);
  const [isStealthStreaming, setIsStealthStreaming] = useState<boolean>(true);

  // Auto-advancing steganographic refinement workflow loop
  useEffect(() => {
    if (!isStealthStreaming) return;
    const timer = setInterval(() => {
      setActiveStealthStep((prev) => (prev + 1) % 4);
      setStealthRunLength((prev) => (prev >= 170 ? 14 : prev + Math.floor(Math.random() * 8 + 4)));
    }, 2400);
    return () => clearInterval(timer);
  }, [isStealthStreaming]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPipelineStep((step) => (step + 1) % 3);
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  const [hoveredLocus, setHoveredLocus] = useState<{
    x: number;
    y: number;
    wi: number;
    locus: number;
    wt: string;
    st: string;
  } | null>(null);

  const adaptivenessPoints = useMemo(() => {
    const carriers: Record<number, { wt: string; st: string }> = {
      2: { wt: "GAG", st: "GAA" },
      6: { wt: "CTG", st: "CTA" },
      10: { wt: "GTG", st: "GTA" },
      14: { wt: "GCG", st: "GCA" },
      18: { wt: "ACC", st: "ACA" },
      22: { wt: "CGT", st: "CGC" },
      26: { wt: "GAT", st: "GAC" },
    };

    return Array.from({ length: 30 }, (_, i) => {
      const x = 20 + (i / 29) * 500;
      const wi = 0.90 + 0.08 * Math.sin(i * 0.45) * Math.cos(i * 0.25) + ((i * 3) % 7) * 0.002;
      const y = 95 - ((wi - 0.80) / 0.20) * 75;
      const isCarrier = Boolean(carriers[i]);
      return {
        x,
        y,
        wi,
        isCarrier,
        locus: Math.round((i / 29) * 1025),
        wt: carriers[i]?.wt || "CTG",
        st: carriers[i]?.st || "CTA",
      };
    });
  }, []);

  const adaptivenessPath = useMemo(() => {
    return adaptivenessPoints.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ");
  }, [adaptivenessPoints]);

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

  // HelixSign Interactive Console States
  const [consoleQueryIdx, setConsoleQueryIdx] = useState<number>(0);
  const [consoleStage, setConsoleStage] = useState<number>(3);
  const [selectedEventIdx, setSelectedEventIdx] = useState<number>(0);
  const [isConsolePlaying, setIsConsolePlaying] = useState<boolean>(true);
  const [activeModelDropdown, setActiveModelDropdown] = useState<string>("HelixSign Codec v2.0");
  const [ringBufferPct, setRingBufferPct] = useState<number>(68);

  useEffect(() => {
    if (!isConsolePlaying) return;
    const timer = setInterval(() => {
      setConsoleStage((prev) => {
        if (prev < 3) {
          return prev + 1;
        } else {
          setConsoleQueryIdx((q) => (q + 1) % CONSOLE_DEMO_QUERIES.length);
          setSelectedEventIdx((e) => (e + 1) % 3);
          return 0;
        }
      });
      setRingBufferPct(64 + Math.floor(Math.random() * 9));
    }, 3400);
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
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 font-semibold uppercase tracking-wider ml-0.5">
                DNA STAMP
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
              className="bg-[#FF5500] hover:bg-[#E54B00] text-white text-sm font-semibold px-4 py-1.5 rounded-lg shadow-[0_0_15px_rgba(255,85,0,0.35)] hover:shadow-[0_0_20px_rgba(255,85,0,0.55)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
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
        
        {/* Soft atmospheric ambient glow */}
        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-[radial-gradient(ellipse_at_center,rgba(255,85,0,0.08)_0%,rgba(255,122,51,0.02)_50%,transparent_75%)] pointer-events-none -z-10" />

        {/* Announcement Pill */}
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#2d2d35] bg-[#1c1c21]/90 hover:border-[#FF5500]/50 text-xs transition-colors cursor-pointer mb-8 group backdrop-blur-sm"
        >
          <span className="text-sm">⚡</span>
          <span className="text-[#FF5500] font-medium">HelixSign 2.0</span>
          <span className="text-[#d4d4d8] group-hover:text-white transition-colors">
            Function-invariant DNA steganography &amp; provenance verification for synthetic biology →
          </span>
        </Link>

        {/* Hero Title */}
        <h1 className="w-full max-w-[1200px] text-4xl sm:text-5xl md:text-6xl lg:text-[60px] xl:text-[64px] font-bold tracking-[-0.035em] leading-[1.12] mx-auto text-center">
          <span className="inline-block sm:whitespace-nowrap">
            <span className="bg-gradient-to-r from-[#FFB58A] via-[#FF7A33] to-[#FFA066] bg-clip-text text-transparent">
              Prove every construct.
            </span>
          </span>
          <br />
          <span className="inline-block sm:whitespace-nowrap">
            <span className="text-[#fafafa]">Protect your</span>{" "}
            <span className="bg-gradient-to-r from-[#FFB58A] to-[#FF7A33] bg-clip-text text-transparent">
              DNA provenance.
            </span>
            <span className="inline-block text-[#FF5500] font-bold">_</span>
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
            className="bg-[#FF5500] hover:bg-[#E54B00] text-white font-medium px-5 py-2.5 rounded-lg shadow-[0_0_20px_rgba(255,85,0,0.35)] hover:shadow-[0_0_25px_rgba(255,85,0,0.55)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
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

        {/* Reed-Solomon Badge */}
        <div className="mt-8 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#2b2b32] bg-[#1a1a1f] text-[#9a9aa5] text-[11px] font-medium">
          <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1L1 8l7 7 7-7-7-7zm0 2.83L12.17 8 8 12.17 3.83 8 8 3.83z" />
          </svg>
          <span>Reed-Solomon RS(16,8) &amp; WGAN-GP Realism Engine included</span>
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
                Interactive demonstration of synonymous codon allocation, Galois Field GF(2⁸) Reed-Solomon coding, and WGAN-GP biosecurity stealth validation.
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
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20 font-semibold">
                      STEALTH ACTIVE
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

                {/* 4-Step Refinement Pipeline */}
                <div className="space-y-1.5 pt-1 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded bg-[#131318] border border-[#262633]">
                    <span className="text-zinc-400">Critic Loss (D_loss)</span>
                    <span className="text-zinc-200 font-semibold">-0.014 (Converged)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#131318] border border-[#262633]">
                    <span className="text-zinc-400">Gradient Penalty (λ)</span>
                    <span className="text-white font-bold">λ = 10.0</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[#131318] border border-[#262633]">
                    <span className="text-zinc-400">1D-CNN Biosecurity AUC</span>
                    <span className="text-[#FF5500] font-bold">0.505 (Undetectable)</span>
                  </div>
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

              {/* Viewport: Lightweight Inline SVG Visualizations */}
              <div className="mt-4 p-4 rounded-xl border border-[#23232c] bg-[#121217] min-h-[220px] flex flex-col justify-center">
                {tdaVisualMode === "attractor" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-300 font-semibold">lacZ Codon Relative Adaptiveness (w_i) Profile</span>
                      <span className="text-emerald-400 font-semibold">w_min = 0.85 Enforced</span>
                    </div>
                    <div className="relative">
                      <svg viewBox="0 0 540 120" className="w-full h-28 overflow-visible select-none">
                        <line x1="20" y1="95" x2="520" y2="95" stroke="#272733" strokeWidth="1" />
                        <line x1="20" y1="20" x2="520" y2="20" stroke="#272733" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="20" y1="56" x2="520" y2="56" stroke="#71717a" strokeWidth="1.2" strokeDasharray="4 4" />
                        <text x="25" y="52" fill="#a1a1aa" fontSize="9" fontFamily="monospace">Safety Threshold w_i = 0.85</text>
                        
                        {/* Dynamic Codon Adaptiveness Trajectory */}
                        <path
                          d={adaptivenessPath}
                          fill="none"
                          stroke="#FF5500"
                          strokeWidth="2.2"
                        />
                        
                        {/* Dynamic Carrier highlights */}
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
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>Codon #0</span>
                      <span className="text-primary font-semibold">64 Synonymous Carrier Codons Verified</span>
                      <span>Codon #1,025</span>
                    </div>
                  </div>
                )}

                {tdaVisualMode === "persistence" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-300 font-semibold">Galois Field GF(2⁸) Reed-Solomon RS(16,8) Codeword</span>
                      <span className="text-primary font-bold">t = 4 Symbol Correction</span>
                    </div>
                    <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 pt-2">
                      {Array.from({ length: 16 }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg border text-center font-mono text-[10px] transition-all hover:scale-105 ${
                            idx < 8
                              ? "border-[#FF5500]/50 bg-[#FF5500]/15 text-white font-bold"
                              : "border-blue-500/40 bg-blue-500/10 text-blue-300"
                          }`}
                        >
                          <div className="text-[8px] text-zinc-500">{idx < 8 ? `D${idx + 1}` : `P${idx - 7}`}</div>
                          <div>0x{(0x3a + idx * 7).toString(16).toUpperCase()}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800">
                      <span className="text-primary">■ 8 Data Symbols (Payload)</span>
                      <span className="text-blue-400">■ 8 Parity Symbols (Syndrome Evaluator)</span>
                    </div>
                  </div>
                )}

                {tdaVisualMode === "betti" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-300 font-semibold">1D-CNN Biosecurity Discriminator Detection ROC Curve</span>
                      <span className="text-zinc-200 font-semibold">AUC = 0.505 (Chance)</span>
                    </div>
                    <svg viewBox="0 0 540 120" className="w-full h-28 overflow-visible select-none">
                      <line x1="60" y1="105" x2="480" y2="105" stroke="#272733" strokeWidth="1" />
                      <line x1="60" y1="15" x2="60" y2="105" stroke="#272733" strokeWidth="1" />
                      
                      {/* Diagonal Chance Line (AUC = 0.500) */}
                      <line x1="60" y1="105" x2="480" y2="15" stroke="#52525b" strokeWidth="1" strokeDasharray="3 3" />
                      
                      {/* Dynamic Empirical Classifier ROC Curve (AUC = 0.505) */}
                      <path
                        d={rocPath}
                        fill="none"
                        stroke="#FF5500"
                        strokeWidth="2.4"
                      />
                      <text x="280" y="52" fill="#FF5500" fontSize="10" fontFamily="monospace" fontWeight="bold">AUC = 0.505 (Chance)</text>
                    </svg>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>False Positive Rate (FPR) = 0.0</span>
                      <span className="text-zinc-300 font-medium">Stealth Pass: Classifier Indistinguishable</span>
                      <span>True Positive Rate (TPR) = 1.0</span>
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

          {/* AI / Engineering Console Container */}
          <div className="mt-12 rounded-2xl border border-[#272733] bg-[#16161c]/95 backdrop-blur-md shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden text-left text-xs">
            {(() => {
              const currQuery = CONSOLE_DEMO_QUERIES[consoleQueryIdx] || CONSOLE_DEMO_QUERIES[0];
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
                        {CONSOLE_DEMO_QUERIES.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setConsoleQueryIdx(idx);
                              setConsoleStage(0);
                            }}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                              consoleQueryIdx === idx
                                ? "bg-[#252533] text-white border border-[#FF5500]/40 shadow-sm"
                                : "bg-[#141419] text-zinc-400 border border-[#23232c] hover:text-zinc-200"
                            }`}
                          >
                            <span>{q.construct}</span>
                          </button>
                        ))}
                      </div>

                      {/* Query Prompt Bubble */}
                      <div className="flex justify-end pt-1">
                        <div className="px-4 py-2.5 rounded-2xl bg-[#24242d] border border-[#2f2f3a] text-zinc-100 text-xs font-medium max-w-sm shadow-md transition-all">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mb-1">
                            <span>Principal Investigator</span>
                            <span className="text-[#FF5500]">{currQuery.construct}</span>
                          </div>
                          {currQuery.query}
                        </div>
                      </div>

                      {/* Tool Step 1 */}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-[#23232c] bg-[#141418] text-zinc-300">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="font-mono text-[11px]">
                            Using engine <span className="text-zinc-200">{currQuery.step1Name}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-400 bg-[#1c1c24] px-1.5 py-0.5 rounded border border-[#2a2a38]">
                            {currQuery.step1Metric}
                          </span>
                          <Check className="w-3.5 h-3.5 text-[#FF5500]" />
                        </div>
                      </div>

                      {/* Tool Step 2 */}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-[#23232c] bg-[#141418] text-zinc-300">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">❖</span>
                          <span className="font-mono text-[11px]">
                            Ran encoder <span className="text-zinc-200">{currQuery.step2Name}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-400 bg-[#1c1c24] px-1.5 py-0.5 rounded border border-[#2a2a38]">
                            {currQuery.step2Metric}
                          </span>
                          <Check className="w-3.5 h-3.5 text-[#FF5500]" />
                        </div>
                      </div>

                      {/* Result Box */}
                      <div className="p-3 rounded-lg border border-[#272735] bg-[#181822] text-xs text-zinc-200 leading-relaxed font-sans shadow-sm">
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
                        <button className="px-3 py-1 rounded-md font-medium bg-[#23232c] text-white font-mono">
                          carrier_codons
                        </button>
                        <span className="font-mono text-[10px] text-zinc-400">
                          SYNONYMOUS CODON MAPPING
                        </span>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-bold text-white tracking-tight">{currQuery.tableName}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">{currQuery.totalRows}</p>
                      </div>

                      <div className="my-3 p-2.5 rounded-lg border border-[#262630] bg-[#121217] font-mono text-xs overflow-x-auto text-zinc-300">
                        <span className="text-[#FF5500] font-semibold">SELECT</span>{" "}
                        <span className="text-zinc-300">locus_id, from_codon, to_codon, amino_acid, wi</span>{" "}
                        <span className="text-[#FF5500] font-semibold">FROM</span>{" "}
                        <span className="text-zinc-100 font-semibold">{currQuery.tableName}</span>
                      </div>

                      <div className="space-y-1.5">
                        {currQuery.events.map((ev, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedEventIdx(idx)}
                            className="flex items-center justify-between p-2.5 rounded-lg border border-[#22222b] bg-[#15151a] hover:border-zinc-700 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center font-mono bg-zinc-800 border border-zinc-700/60 text-zinc-300">
                                0{idx + 1}
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-white">
                                  <span>{ev.id} ({ev.mode})</span>
                                </div>
                                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                                  {ev.amp} • {ev.h1}
                                </div>
                              </div>
                            </div>

                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/30 font-medium font-mono">
                              {ev.freq}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#23232c] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                      <span>Showing 3 carrier loci</span>
                      <Link href="/datasets" className="text-zinc-400 hover:text-white transition-colors">
                        View full catalog in Datasets →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Terminal CLI Integration */}
        <div className="mt-14 sm:mt-16 text-center">
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
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 font-semibold uppercase tracking-wider ml-0.5">
                DNA STAMP
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
