"use client";

import React from "react";
import { ShieldCheck, Activity, BrainCircuit, ArrowDown, CheckCircle2 } from "lucide-react";

export function DecisionEngineDiagram() {
  return (
    <div className="space-y-6 select-none">
      <div className="rounded-xl border border-[#23232c] bg-[#0f0f14] p-5 sm:p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f1f26]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold">
              Tri-Branch ML Decision &amp; Provenance Verification Engine
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#FF5500]">
            Combined F1 Score: 1.000 (99.4% Accuracy)
          </span>
        </div>

        {/* 3 Branches Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Branch 1: Supervised Random Forest */}
          <div className="p-5 rounded-xl border border-[#24242e] bg-[#14141a] space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">
                  BRANCH A: SUPERVISED
                </span>
                <ShieldCheck className="w-4 h-4 text-[#FF5500]" />
              </div>
              <h4 className="text-sm font-bold text-white">Codon Manifold Classifier</h4>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed font-sans">
                250-tree ensemble trained on 128-dimensional topological vector embeddings (Betti curves, persistence entropy, and synonymous degeneracy landscape integrals).
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-[#1f1f26]">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">Test Accuracy</span>
                <span className="text-[#FF5500] font-bold">99.4%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">Invariant F1</span>
                <span className="text-white font-semibold">1.000</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">Output Classes</span>
                <span className="text-zinc-300">Verified Invariant, Adversarial, Control</span>
              </div>
            </div>
          </div>

          {/* Branch 2: Unsupervised Conv1D Autoencoder */}
          <div className="p-5 rounded-xl border border-[#24242e] bg-[#14141a] space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">
                  BRANCH B: ADVERSARIAL STEALTH
                </span>
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
              </div>
              <h4 className="text-sm font-bold text-white">WGAN-GP Discriminator</h4>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed font-sans">
                Critic network trained on wildtype host CDS distributions. Evaluates sequence naturalness via Wasserstein distance to enforce host k-mer indistinguishability.
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-[#1f1f26]">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">Gradient Penalty</span>
                <span className="text-cyan-400 font-bold">λ = 10</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">Stealth Metric</span>
                <span className="text-white font-semibold">AUC ≈ 0.505</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">Validation Mode</span>
                <span className="text-zinc-300">Zero-Shot Detection</span>
              </div>
            </div>
          </div>

          {/* Branch 3: WGAN-GP Realism & Distribution Matcher */}
          <div className="p-5 rounded-xl border border-[#24242e] bg-[#14141a] space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[10px] font-mono font-bold text-[#FF5500] uppercase">
                  BRANCH C: ECC RESILIENCE
                </span>
                <Activity className="w-4 h-4 text-[#FF5500]" />
              </div>
              <h4 className="text-sm font-bold text-white">Reed-Solomon RS(16,8) Codec</h4>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed font-sans">
                Galois Field GF(2^8) error correction decoder. Reconstructs ownership payload even after mutagenic point drift or adversarial synonymous shuffling.
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-[#1f1f26]">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">Decode Latency</span>
                <span className="text-[#FF5500] font-bold">&lt; 0.4 ms</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">ECC Redundancy</span>
                <span className="text-white font-semibold">t = 4 symbols / tile</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">Cryptographic Salt</span>
                <span className="text-zinc-300">256-bit HKDF</span>
              </div>
            </div>
          </div>
        </div>

        {/* Consensus Verification Banner */}
        <div className="p-4 rounded-xl border border-[#262634] bg-[#121218] flex items-center justify-between text-xs font-mono text-zinc-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#FF5500] shrink-0" />
            <span>Multi-Model Consensus: Both Branch A (Invariant Match) &amp; Branch C (RS ECC Payload) must validate before provenance certification.</span>
          </div>
          <span className="hidden sm:inline-block text-[11px] text-zinc-500 font-bold uppercase">
            False Positive Rate &lt; 0.1%
          </span>
        </div>
      </div>
    </div>
  );
}

