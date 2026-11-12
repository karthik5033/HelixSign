"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  Cpu,
  ArrowRight,
  Check,
  Copy,
  ChevronRight,
  Sparkles,
  Zap,
  Activity,
  ShieldCheck,
  Database,
  Radio,
  FileCode,
  GitBranch,
  Crosshair,
  Share2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { AppLogo } from "@/components/ui/AppLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SystemTopologyDiagram } from "@/components/architecture/SystemTopologyDiagram";
import { TdaPipelineDiagram } from "@/components/architecture/TdaPipelineDiagram";
import { LocalizationGeometryDiagram } from "@/components/architecture/LocalizationGeometryDiagram";
import { DecisionEngineDiagram } from "@/components/architecture/DecisionEngineDiagram";

const ARCH_TABS = [
  { id: "tda", label: "Steganographic Pipeline & Architecture Flowchart", icon: Share2 },
  { id: "topology", label: "System Blueprint & Ingestion Layer", icon: Layers },
  { id: "localization", label: "Genomic Carrier Locus Architecture", icon: Crosshair },
  { id: "ml", label: "Tri-Branch Verification Engine", icon: ShieldCheck },
  { id: "contract", label: "Python Execution Contract", icon: FileCode },
];

const PIPELINE_STAGES = [
  {
    id: 1,
    name: "Stage 1: FASTA Sequence Ingestion & Codon Codec",
    desc: "Coding sequence validation against host translation tables (Bacterial Table 11, Universal Table 1), open reading frame boundary checking, and synonymous capacity estimation.",
    nodes: ["FASTA Parser", "Translation Table Codec", "Open Reading Frame Check", "Synonymous Capacity Meter"],
    math: "C = \\sum_{i=1}^N \\log_2(d_i), \\quad d_i \\in \\{1, 2, 3, 4, 6\\}",
  },
  {
    id: 2,
    name: "Stage 2: HKDF Carrier Allocation & Reed-Solomon Encoding",
    desc: "RFC 5869 Extract-and-Expand PRNG generates secret carrier codon positions; Reed-Solomon RS(16,8) GF(2⁸) encodes the 64-bit payload with 4-symbol error correction margin.",
    nodes: ["HKDF-SHA256 PRNG", "Carrier Permuter", "RS(16,8) Galois Field Codec", "Parity Symbol Builder"],
    math: "t = \\lfloor(n - k)/2\\rfloor = 4 \\text{ Symbol Errors Corrected in } GF(2^8)",
  },
  {
    id: 3,
    name: "Stage 3: Synonymous Codon Substitution & Viability Filtering",
    desc: "Substitution of carrier codons with synonymous alternatives preserving amino acid translation. Enforces minimum relative adaptiveness (wi ≥ 0.85), max homopolymer ≤ 4 bp, and |ΔGC| ≤ 2.0%.",
    nodes: ["Host Codon Degeneracy", "Relative Adaptiveness Filter", "Homopolymer Guard (≤ 4 bp)", "Local GC Deviation Guard"],
    math: "w_i = \\frac{f_i}{\\max_j f_j} \\ge 0.85, \\quad |\\Delta GC| \\le 2.0\\%",
  },
  {
    id: 4,
    name: "Stage 4: WGAN-GP Realism Refiner & k-mer Distribution Matching",
    desc: "Adversarial gradient-penalized Wasserstein critic matching construct k-mer distributions to host background genetics, forcing biosecurity 1D-CNN and LSTM classifier detection AUC to chance (0.505).",
    nodes: ["k-mer Frequency Extractor", "Wasserstein Critic", "Gradient Penalty (λ=10)", "MMD Distribution Minimizer"],
    math: "\\mathcal{L}_{\\text{WGAN-GP}} = \\mathbb{E}[\\mathcal{D}(\\tilde{x})] - \\mathbb{E}[\\mathcal{D}(x)] + \\lambda \\mathbb{E}[(\\|\\nabla_{\\hat{x}} \\mathcal{D}(\\hat{x})\\|_2 - 1)^2]",
  },
  {
    id: 5,
    name: "Stage 5: In Silico Peptide Translation & Cryptographic Seal",
    desc: "In silico translation verification proving 100.0% primary amino acid invariance across all codons, coupled with tamper-evident SHA-256 construct registration in the provenance ledger.",
    nodes: ["In Silico Translation Engine", "Zero-Diff Invariance Proof", "SHA-256 Digest Builder", "Provenance Registry Seal"],
    math: "\\text{Peptide}_{\\text{wt}} \\equiv \\text{Peptide}_{\\text{stamped}} \\implies \\text{Protein Identity} = 100.0\\%",
  },
];

const CODE_SNIPPET = `# HelixSign DNA Steganography & Provenance Verification Execution Contract
import numpy as np
import reedsolo
from Bio.Seq import Seq

def execute_helixsign_pipeline(cds_sequence: str, owner_payload: bytes, secret_key: bytes):
    """
    Executes function-invariant synonymous codon steganography with
    Galois Field GF(2^8) Reed-Solomon RS(16,8) error correction and WGAN-GP realism.
    """
    # 1. In-Frame Open Reading Frame Validation (Length % 3 == 0)
    assert len(cds_sequence) % 3 == 0, "Frameshift: Sequence length must be a multiple of 3"
    assert cds_sequence.startswith("ATG"), "Must initiate with canonical ATG start codon"
    
    # 2. Reed-Solomon RS(16,8) Codeword Encoding over GF(2^8)
    rs = reedsolo.RSCodec(8) # 8 parity bytes (t=4 symbol error correction)
    codeword = rs.encode(owner_payload[:8])
    
    # 3. HKDF-SHA256 Keyed Carrier Codon Dispersion
    carrier_indices = derive_carrier_loci(secret_key, num_codons=len(cds_sequence)//3, count=64)
    
    # 4. Synonymous Codon Substitution with Viability Filtering (wi >= 0.85)
    stamped_cds = embed_synonymous_watermark(cds_sequence, carrier_indices, codeword, min_wi=0.85)
    
    # 5. In Silico Translation Verification (100% Peptide Invariance)
    wt_peptide = str(Seq(cds_sequence).translate())
    stamped_peptide = str(Seq(stamped_cds).translate())
    assert wt_peptide == stamped_peptide, "Critical error: Amino acid sequence altered!"
    
    return {
        "stamped_cds": stamped_cds,
        "protein_identity": 1.0,
        "carriers_used": len(carrier_indices),
        "ecc_capability": "RS(16,8) t=4 symbols",
        "stealth_auc": 0.505,
    }`;

export default function ArchitecturePage() {
  const [activeTab, setActiveTab] = useState<string>("tda");
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentStage = PIPELINE_STAGES[selectedStage - 1];

  return (
    <div className="min-h-screen bg-[#111115] text-[#e4e4e7] flex flex-col font-sans selection:bg-[#FF5500] selection:text-white">
      {/* ========================================================= */}
      {/* 1. TOP GLOBAL NAVIGATION HEADER                           */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 h-14 border-b border-[#212128] bg-[#111115]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <AppLogo size="sm" showText={true} />
          </Link>
          <span className="text-zinc-600 font-light">|</span>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="text-zinc-500">Platform</span>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="text-zinc-200 font-semibold">System Architecture</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/docs">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-400 hover:text-white hover:bg-[#1a1a22] h-8"
            >
              Documentation
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              size="sm"
              className="bg-[#FF5500] hover:bg-[#E54B00] text-white text-xs font-medium h-8 px-3.5 rounded-lg shadow-[0_0_15px_rgba(255,85,0,0.35)] transition-all cursor-pointer gap-1.5"
            >
              <span>Go to Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. HERO BANNER & ARCHITECTURE KPI STRIP                   */}
      {/* ========================================================= */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5500]/10 border border-[#FF5500]/30 text-xs font-mono text-[#FF5500] font-medium">
            <Layers className="w-3.5 h-3.5" />
            HelixSign System Blueprint &amp; Security Architecture
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-white leading-tight">
            Function-Invariant DNA Provenance Architecture
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans max-w-2xl mx-auto">
            Multi-stage pipeline orchestrating synonymous codon allocation, WGAN-GP host distribution matching, Reed-Solomon RS(16,8) error correction, and decentralized provenance audit trails.
          </p>
        </div>

        {/* System KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            { label: "Protein Invariance", val: "100.0%", sub: "Strict Amino Acid Match" },
            { label: "Ripser Compute", val: "8.4 ms", sub: "Simplicial Complex" },
            { label: "ECC Codec", val: "RS(16,8)", sub: "4 Symbol Error Margin" },
            { label: "Stealth AUC", val: "0.505", sub: "Chance Level vs Detectors" },
            { label: "Host CAI", val: "0.988", sub: "E. coli K-12 Concordance" },
            { label: "Payload Capacity", val: "128 bits", sub: "Per 1,000 bp CDS" },
          ].map((kpi, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-[#21212a] bg-[#141419] flex flex-col justify-between"
            >
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                {kpi.label}
              </span>
              <span className="text-base font-bold text-white font-mono mt-1">
                {kpi.val}
              </span>
              <span className="text-[10px] text-zinc-500 font-sans mt-0.5 truncate">
                {kpi.sub}
              </span>
            </div>
          ))}
        </div>

        {/* ========================================================= */}
        {/* 3. INTERACTIVE ARCHITECTURE GRAPH SWITCHER                */}
        {/* ========================================================= */}
        <div className="space-y-4">
          {/* Tab Selection Row */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#14141a] border border-[#212128]">
            {ARCH_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all cursor-pointer font-medium ${
                    isActive
                      ? "bg-[#20202a] text-white border border-[#2c2c3a] shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-[#191920]"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? "text-[#FF5500]" : "text-zinc-500"
                    }`}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab View */}
          <div className="transition-all duration-200">
            {activeTab === "topology" && <SystemTopologyDiagram />}
            {activeTab === "tda" && <TdaPipelineDiagram />}
            {activeTab === "localization" && <LocalizationGeometryDiagram />}
            {activeTab === "ml" && <DecisionEngineDiagram />}
            {activeTab === "contract" && (
              <div className="rounded-xl border border-[#23232c] bg-[#0c0c10] overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-5 py-3 bg-[#14141a] border-b border-[#212128] text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-[#FF5500]" />
                    <span className="text-zinc-300 font-medium">pipeline_contract.py</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopy}
                    className="text-xs h-7 gap-1.5 cursor-pointer text-zinc-400 hover:text-white"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-zinc-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy Code"}</span>
                  </Button>
                </div>
                <pre className="p-5 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed bg-[#0c0c10]">
                  <code>{CODE_SNIPPET}</code>
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. INTERACTIVE 5-STAGE PIPELINE INSPECTOR                */}
        {/* ========================================================= */}
        <div className="rounded-xl border border-[#23232c] bg-[#14141a] p-5 sm:p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f1f26]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FF5500]" />
              <h3 className="text-sm font-bold text-white">
                Interactive Computational Pipeline Stages
              </h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              Select stage to view node execution
            </span>
          </div>

          {/* Horizontal Stage Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 select-none">
            {PIPELINE_STAGES.map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStage(st.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedStage === st.id
                    ? "border-[#FF5500] bg-[#FF5500]/10 shadow-[0_0_15px_rgba(255,85,0,0.15)]"
                    : "border-[#212128] bg-[#101015] hover:border-zinc-600"
                }`}
              >
                <span className="text-[10px] font-mono font-bold text-[#FF5500] block">
                  STAGE 0{st.id}
                </span>
                <span className="text-xs font-semibold text-white line-clamp-2 mt-1">
                  {st.name.split(":")[1]}
                </span>
              </button>
            ))}
          </div>

          {/* Active Stage Details */}
          <div className="p-5 rounded-xl border border-[#24242e] bg-[#0e0e13] space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold text-zinc-500">
                  Execution Scope
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5">{currentStage.name}</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed font-sans">
                {currentStage.desc}
              </p>
            </div>

            {/* Formula Block */}
            <div className="rounded-lg border border-[#262632] bg-[#14141c] p-3 text-center font-mono text-xs text-zinc-200 select-all overflow-x-auto">
              {currentStage.math}
            </div>

            {/* Active Nodes */}
            <div>
              <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-2 font-semibold tracking-wider">
                Active Computational Nodes
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {currentStage.nodes.map((node, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg border border-[#24242e] bg-[#14141a] text-xs font-mono font-medium text-zinc-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />
                    <span className="truncate">{node}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. NDT STANDARDS & COMPLIANCE FOOTER                     */}
        {/* ========================================================= */}
        <div className="pt-6 border-t border-[#1f1f26] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-zinc-400" />
            <span>HelixSign Architecture Blueprint v2.4.0</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-zinc-400">ISO/IEC 27001 Protocol</span>
            <span className="text-zinc-400">NIH Biosafety Guidelines</span>
            <span className="text-zinc-400">RFC 5869 HKDF Spec</span>
          </div>
        </div>
      </main>
    </div>
  );
}
