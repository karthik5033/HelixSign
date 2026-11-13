"use client";

import React, { useState } from "react";
import {
  Radio,
  Cpu,
  Layers,
  Database,
  Terminal,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
} from "lucide-react";

interface SubsystemInfo {
  id: string;
  name: string;
  layer: string;
  throughput: string;
  latency: string;
  specs: string[];
  description: string;
}

const SUBSYSTEM_SPECS: Record<string, SubsystemInfo> = {
  ingest: {
    id: "ingest",
    name: "Construct Ingestion & Bio-Validator",
    layer: "Layer 1: Ingestion & Validation",
    throughput: "Up to 50,000 bp / construct",
    latency: "< 25 ms parse time",
    specs: [
      "FASTA / GenBank multi-format sequence parser",
      "Strict Open Reading Frame (ORF) modulo-3 validation",
      "E. coli K-12 RefSeq codon bias table baseline profiling",
      "Dynamic capacity meter calculating available carrier positions",
    ],
    description:
      "Validates host coding sequences, verifies in-frame start/stop codons, and computes baseline Codon Adaptation Index (CAI) and GC content profiles.",
  },
  crypto: {
    id: "crypto",
    name: "HKDF Keyed PRNG & Carrier Permuter",
    layer: "Layer 2: Key Derivation & Permutation",
    throughput: "256-bit entropy keyspace",
    latency: "< 1.2 ms derivation",
    specs: [
      "RFC 5869 HKDF-SHA256 key derivation with biological salt",
      "Cryptographically secure pseudo-random carrier locus shuffling",
      "Eliminates spatial locus clustering across variable exons",
      "Prevents watermark localized stripping attacks",
    ],
    description:
      "Spreads ownership watermark payloads uniformly across candidate synonymous codons using secret-keyed cryptographic permutations.",
  },
  rs_codec: {
    id: "rs_codec",
    name: "Galois Field RS(16,8) Codec",
    layer: "Layer 3: Error Correction Coding",
    throughput: "16-byte codewords (8 data + 8 parity)",
    latency: "< 0.4 ms Berlekamp-Massey",
    specs: [
      "Reed-Solomon RS(16,8) over Galois Field GF(2^8)",
      "Corrects up to 4 symbol corruptions per 16-symbol tile",
      "Multi-tile interleaving for insertion/deletion resilience",
      "Tolerates up to 3.5% random point mutations with 100% recovery",
    ],
    description:
      "Encodes provenance metadata (owner, project, batch, ECDSA signature) into redundant Galois Field codewords to guarantee survival through biological noise.",
  },
  wgan: {
    id: "wgan",
    name: "WGAN-GP Codon Manifold Refiner",
    layer: "Layer 4: Adversarial Stealth Refiner",
    throughput: "128-dim k-mer embedding space",
    latency: "< 8.4 ms GPU inference",
    specs: [
      "Wasserstein GAN with gradient penalty (λ = 10)",
      "Minimizes Maximum Mean Discrepancy (MMD) across 3-mer / 4-mer spectra",
      "Maintains strict protein invariance (0 amino acid mutations)",
      "Forces detector classification AUC to chance level (AUC ≈ 0.505)",
    ],
    description:
      "Adversarially tunes synonymous codon choices so the engineered construct matches host genome statistical distributions, defeating deep learning detectors.",
  },
  registry: {
    id: "registry",
    name: "Provenance Registry & REST Gateway",
    layer: "Layer 5: Enterprise Provenance Ledger",
    throughput: "1,500 verifications / sec",
    latency: "< 12 ms ledger query",
    specs: [
      "Async FastAPI endpoints with OpenAPI 3.1 schemas",
      "SHA-256 sequence integrity fingerprinting and audit trail",
      "ECDSA P-256 cryptographic authorship verification",
      "One-click GenBank / FASTA export and PDF compliance certification",
    ],
    description:
      "Provides verifiable, immutable proof of biological IP ownership, automated forensic strain comparison, and biosecurity screening integration.",
  },
};

export function SystemTopologyDiagram() {
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>("wgan");
  const active = SUBSYSTEM_SPECS[selectedSubsystem] || SUBSYSTEM_SPECS.wgan;

  return (
    <div className="space-y-6">
      {/* Interactive Topology Visual Canvas */}
      <div className="rounded-xl border border-[#23232c] bg-[#0f0f14] p-5 sm:p-6 shadow-2xl overflow-hidden relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#1f1f26]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold">
              End-to-End Steganographic DNA Provenance Architecture
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            Click any block to inspect specifications
          </span>
        </div>

        {/* Multi-Layer Flow Architecture */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3 relative select-none">
          {/* Layer 1: Ingestion */}
          <div
            onClick={() => setSelectedSubsystem("ingest")}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedSubsystem === "ingest"
                ? "border-[#FF5500] bg-[#FF5500]/10 shadow-[0_0_20px_rgba(255,85,0,0.15)]"
                : "border-[#24242e] bg-[#14141a] hover:border-zinc-600"
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[10px] font-mono font-semibold text-zinc-500 uppercase">
                  LAYER 01
                </span>
                <Radio className="w-4 h-4 text-zinc-400" />
              </div>
              <h4 className="text-xs font-bold text-white">Construct Ingest</h4>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                FASTA/GenBank parser &amp; ORF validation.
              </p>
            </div>
            <div className="pt-3 border-t border-[#1f1f26] mt-3 flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>50,000 bp</span>
              <span className="text-zinc-400">&lt; 25 ms</span>
            </div>
          </div>

          {/* Layer 2: Key Derivation */}
          <div
            onClick={() => setSelectedSubsystem("crypto")}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedSubsystem === "crypto"
                ? "border-[#FF5500] bg-[#FF5500]/10 shadow-[0_0_20px_rgba(255,85,0,0.15)]"
                : "border-[#24242e] bg-[#14141a] hover:border-zinc-600"
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[10px] font-mono font-semibold text-zinc-500 uppercase">
                  LAYER 02
                </span>
                <Cpu className="w-4 h-4 text-zinc-400" />
              </div>
              <h4 className="text-xs font-bold text-white">HKDF Keyed PRNG</h4>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                256-bit carrier locus permutation.
              </p>
            </div>
            <div className="pt-3 border-t border-[#1f1f26] mt-3 flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>SHA-256</span>
              <span className="text-zinc-400">&lt; 1.2 ms</span>
            </div>
          </div>

          {/* Layer 3: Reed-Solomon Codec */}
          <div
            onClick={() => setSelectedSubsystem("rs_codec")}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedSubsystem === "rs_codec"
                ? "border-[#FF5500] bg-[#FF5500]/10 shadow-[0_0_20px_rgba(255,85,0,0.15)]"
                : "border-[#24242e] bg-[#14141a] hover:border-zinc-600"
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[10px] font-mono font-semibold text-[#FF5500] uppercase">
                  LAYER 03
                </span>
                <Layers className="w-4 h-4 text-[#FF5500]" />
              </div>
              <h4 className="text-xs font-bold text-white">RS(16,8) GF(2^8)</h4>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                Galois Field ECC error correction tiles.
              </p>
            </div>
            <div className="pt-3 border-t border-[#1f1f26] mt-3 flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>t = 4 symbols</span>
              <span className="text-[#FF5500] font-bold">&lt; 0.4 ms</span>
            </div>
          </div>

          {/* Layer 4: WGAN-GP Refiner */}
          <div
            onClick={() => setSelectedSubsystem("wgan")}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedSubsystem === "wgan"
                ? "border-[#FF5500] bg-[#FF5500]/10 shadow-[0_0_20px_rgba(255,85,0,0.15)]"
                : "border-[#24242e] bg-[#14141a] hover:border-zinc-600"
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[10px] font-mono font-semibold text-zinc-500 uppercase">
                  LAYER 04
                </span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <h4 className="text-xs font-bold text-white">WGAN-GP Refiner</h4>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                Codon manifold tuning (AUC ≈ 0.505).
              </p>
            </div>
            <div className="pt-3 border-t border-[#1f1f26] mt-3 flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>Stealth MMD</span>
              <span className="text-cyan-400 font-bold">&lt; 8.4 ms</span>
            </div>
          </div>

          {/* Layer 5: Provenance Registry */}
          <div
            onClick={() => setSelectedSubsystem("registry")}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedSubsystem === "registry"
                ? "border-[#FF5500] bg-[#FF5500]/10 shadow-[0_0_20px_rgba(255,85,0,0.15)]"
                : "border-[#24242e] bg-[#14141a] hover:border-zinc-600"
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[10px] font-mono font-semibold text-zinc-500 uppercase">
                  LAYER 05
                </span>
                <Database className="w-4 h-4 text-zinc-400" />
              </div>
              <h4 className="text-xs font-bold text-white">Provenance Ledger</h4>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                SHA-256 audit trail &amp; FastAPI gateway.
              </p>
            </div>
            <div className="pt-3 border-t border-[#1f1f26] mt-3 flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>ECDSA P-256</span>
              <span className="text-zinc-400">&lt; 12 ms</span>
            </div>
          </div>
        </div>

        {/* Dataflow Connection Arrow Line */}
        <div className="hidden md:flex items-center justify-between px-10 py-3 text-zinc-600 text-xs font-mono">
          <span>Raw Coding Sequence (CDS)</span>
          <ArrowRight className="w-3.5 h-3.5" />
          <span>Keyed Carrier Permutations</span>
          <ArrowRight className="w-3.5 h-3.5" />
          <span>Reed-Solomon Redundancy</span>
          <ArrowRight className="w-3.5 h-3.5" />
          <span>WGAN-GP Codon Manifold</span>
          <ArrowRight className="w-3.5 h-3.5" />
          <span>Verified Provenance Ledger</span>
        </div>
      </div>

      {/* Selected Subsystem Detail Card */}
      <div className="p-5 sm:p-6 rounded-xl border border-[#23232c] bg-[#141419] shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#202028]">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF5500]">
              {active.layer}
            </span>
            <h3 className="text-base font-bold text-white">{active.name}</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400 bg-[#1c1c24] border border-[#282834] px-2.5 py-1 rounded-md">
              Throughput: {active.throughput}
            </span>
            <span className="text-xs font-mono text-zinc-300 bg-[#1c1c24] border border-[#282834] px-2.5 py-1 rounded-md">
              Latency: {active.latency}
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
          {active.description}
        </p>

        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500 block mb-2">
            Technical Specifications &amp; Guarantees
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {active.specs.map((spec, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-[#24242e] bg-[#0f0f14] flex items-center gap-2.5 text-xs text-zinc-300 font-sans"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                <span>{spec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

