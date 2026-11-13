"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Cpu,
  Download,
  Dna,
  FileCode,
  FileText,
  Filter,
  Layers,
  LineChart,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MlPipelineStatusBadge } from "@/components/shared/MlPipelineStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RECENT_ANALYSES,
  AnalysisRecord,
} from "@/lib/echosenseData";
import { downloadDataAsCsv } from "@/lib/utils";

type TabKey =
  | "overview"
  | "preprocessing"
  | "carrier_permutation"
  | "rs_coding"
  | "synonymous_embed"
  | "wgan_refiner"
  | "invariant_proof";

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord>(RECENT_ANALYSES[0]);

  // Handle URL query parameters for direct dataset linking
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ds = params.get("dataset");
      if (ds) {
        if (ds === "ds-ecoli-k12") {
          const match = RECENT_ANALYSES.find((r) => r.id === "HS-7402") || RECENT_ANALYSES[0];
          setSelectedRecord(match);
        } else if (ds === "ds-biobrick-registry" || ds === "ds-synthetic-biobricks") {
          const match = RECENT_ANALYSES.find((r) => r.id === "HS-7401");
          if (match) setSelectedRecord(match);
        } else if (ds === "ds-crispr-vectors") {
          const match = RECENT_ANALYSES.find((r) => r.id === "HS-7400");
          if (match) setSelectedRecord(match);
        }
      }
      const run = params.get("run");
      if (run) {
        const foundRun = RECENT_ANALYSES.find((r) => r.id.toLowerCase() === run.toLowerCase());
        if (foundRun) setSelectedRecord(foundRun);
      }
    }
  }, []);

  // 120-point Codon Relative Adaptiveness (w_i) data along the gene (1,025 codons)
  const codonProfileData = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 120; i++) {
      const baseW = 0.94 + 0.05 * Math.sin(i * 0.16) + (Math.cos(i * 0.32) * 0.02);
      const wi = Math.max(0.78, Math.min(1.0, baseW));
      const isCarrier = i % 4 === 2;
      pts.push({
        codonIdx: Math.floor((i / 119) * 1025),
        wi,
        isCarrier,
        gc: 50.8 + 2.5 * Math.sin(i * 0.22),
      });
    }
    return pts;
  }, []);

  const handleExportCodonLedger = () => {
    const exportData = [
      { locus: "LOC-01", codonIdx: 14, bp: 42, aa: "Glu (E)", wtCodon: "GAG", stampCodon: "GAA", wi: 0.988, status: "Invariant" },
      { locus: "LOC-02", codonIdx: 28, bp: 84, aa: "Leu (L)", wtCodon: "CTG", stampCodon: "CTA", wi: 0.965, status: "Invariant" },
      { locus: "LOC-03", codonIdx: 42, bp: 126, aa: "Val (V)", wtCodon: "GTG", stampCodon: "GTA", wi: 0.972, status: "Invariant" },
      { locus: "LOC-04", codonIdx: 58, bp: 174, aa: "Ala (A)", wtCodon: "GCG", stampCodon: "GCA", wi: 0.981, status: "Invariant" },
      { locus: "LOC-05", codonIdx: 74, bp: 222, aa: "Thr (T)", wtCodon: "ACC", stampCodon: "ACA", wi: 0.954, status: "Invariant" },
      { locus: "LOC-06", codonIdx: 92, bp: 276, aa: "Arg (R)", wtCodon: "CGT", stampCodon: "CGC", wi: 0.992, status: "Invariant" },
      { locus: "LOC-07", codonIdx: 110, bp: 330, aa: "Asp (D)", wtCodon: "GAT", stampCodon: "GAC", wi: 0.985, status: "Invariant" },
      { locus: "LOC-08", codonIdx: 128, bp: 384, aa: "Phe (F)", wtCodon: "TTT", stampCodon: "TTC", wi: 0.978, status: "Invariant" },
    ];
    downloadDataAsCsv("helixsign_carrier_codon_ledger.csv", exportData);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full select-none">
      {/* Header with Run Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Activity className="h-6 w-6 text-[#FF5500]" />
              Steganographic Pipeline Explorer
            </h1>
            <MlPipelineStatusBadge />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stage-by-stage cryptographic steganography, host codon adaptation, and function-invariant verification
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Construct Run Selector */}
          <select
            value={selectedRecord.id}
            onChange={(e) => {
              const found = RECENT_ANALYSES.find((r) => r.id === e.target.value);
              if (found) setSelectedRecord(found);
            }}
            className="text-xs bg-muted/60 border border-border rounded-lg px-3 py-1.5 font-mono text-foreground focus:outline-none cursor-pointer"
          >
            {RECENT_ANALYSES.map((rec) => (
              <option key={rec.id} value={rec.id}>
                {rec.id}: {rec.name}
              </option>
            ))}
          </select>

          <Link href="/reports">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs border-border">
              <FileText className="h-3.5 w-3.5" />
              Provenance Certificate
            </Button>
          </Link>
        </div>
      </div>

      {/* 7-Stage Pipeline Navigation Stepper */}
      <div className="rounded-xl border border-border bg-card p-2.5 overflow-x-auto select-none">
        <div className="flex items-center justify-between min-w-[760px] gap-2 text-xs">
          {[
            { key: "overview", label: "1. Overview", sub: "Status & Invariant Proof" },
            { key: "preprocessing", label: "2. Preprocessing", sub: "Reading Frame & Bias" },
            { key: "carrier_permutation", label: "3. Carrier Permutation", sub: "HKDF Keyed PRNG" },
            { key: "rs_coding", label: "4. RS Coding", sub: "GF(2⁸) Reed-Solomon" },
            { key: "synonymous_embed", label: "5. Synonymous Embed", sub: "Degeneracy Modulation" },
            { key: "wgan_refiner", label: "6. WGAN Refiner", sub: "k-mer MMD Realism" },
            { key: "invariant_proof", label: "7. Invariant Proof", sub: "Peptide Alignment" },
          ].map((stage) => {
            const isActive = activeTab === stage.key;
            return (
              <button
                key={stage.key}
                onClick={() => setActiveTab(stage.key as TabKey)}
                className={`flex-1 p-2 rounded-lg text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#FF5500]/15 border border-[#FF5500]/50 shadow-sm"
                    : "hover:bg-muted/40 border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${isActive ? "text-[#FF5500]" : "text-foreground"}`}>
                    {stage.label}
                  </span>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? "text-[#FF5500]" : "text-muted-foreground/30"}`} />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                  {stage.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* STAGE 1: OVERVIEW (STATUS & INVARIANT VERIFICATION)       */}
      {/* ========================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Status Hero Card */}
          <Card className="border border-border bg-card p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded border border-border text-muted-foreground bg-secondary">
                    Watermark Verified
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    Target: {selectedRecord.specimen} (3,075 bp)
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  Construct Verification &amp; Provenance Analysis
                </h2>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Function-invariant synonymous codon modulation complete across 64 carrier positions. In silico translation against bacterial Genetic Code Table 11 confirms zero amino acid alterations with negligible host translation perturbation (ΔCAI = -0.002).
                </p>
              </div>

              {/* 4 Primary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 shrink-0">
                <div className="p-3 rounded-xl border border-border bg-card/80 min-w-[125px]">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">Peptide Match</span>
                  <span className="text-xl font-bold font-mono text-foreground">100.0%</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card/80 min-w-[125px]">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">Stealth AUC</span>
                  <span className="text-xl font-bold font-mono text-foreground">{selectedRecord.rocAuc.toFixed(3)}</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card/80 min-w-[125px]">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">Carrier Loci</span>
                  <span className="text-xl font-bold font-mono text-foreground">{selectedRecord.changepointsDetected} Loci</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card/80 min-w-[125px]">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">Host Delta CAI</span>
                  <span className="text-xl font-bold font-mono text-[#FF5500]">-0.002</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Dual Visualizers: Codon Relative Adaptiveness & Biophysical Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Codon Relative Adaptiveness (w_i) Trajectory */}
            <Card className="lg:col-span-8 border border-border bg-card p-5">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <LineChart className="h-4 w-4 text-[#FF5500]" />
                    Codon Relative Adaptiveness (w_i) &amp; Carrier Loci Profile
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Trajectory of codon translation efficiencies across 1,025 codons with safety threshold (w_min = 0.85)
                  </p>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">E. coli K-12</span>
              </div>

              <div className="relative h-56 w-full flex items-center justify-center my-3 select-none">
                <svg viewBox="0 0 700 200" className="w-full h-full">
                  {/* Grid Lines */}
                  <line x1="45" y1="25" x2="680" y2="25" stroke="#222230" strokeWidth="0.8" strokeDasharray="3,3" />
                  <line x1="45" y1="85" x2="680" y2="85" stroke="#1c1c28" strokeWidth="0.8" strokeDasharray="2,2" />
                  <line x1="45" y1="145" x2="680" y2="145" stroke="#222230" strokeWidth="0.8" strokeDasharray="3,3" />

                  <text x="12" y="28" fill="#71717a" fontSize="9" fontFamily="monospace">w = 1.00</text>
                  <text x="12" y="88" fill="#71717a" fontSize="9" fontFamily="monospace">w = 0.85</text>
                  <text x="12" y="148" fill="#71717a" fontSize="9" fontFamily="monospace">w = 0.70</text>

                  {/* Safety Threshold (w_min = 0.85) */}
                  <line x1="45" y1="85" x2="680" y2="85" stroke="#FF5500" strokeWidth="1" strokeDasharray="3,3" opacity="0.7" />
                  <text x="590" y="78" fill="#FF5500" fontSize="8" fontFamily="monospace">w_min = 0.85 (Safe)</text>

                  {/* Area fill */}
                  <path
                    d={(() => {
                      let p = "M 45 145";
                      codonProfileData.forEach((d, i) => {
                        const x = 45 + (i / 119) * 635;
                        const y = 145 - ((d.wi - 0.70) / 0.30) * 120;
                        p += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
                      });
                      p += " L 680 145 Z";
                      return p;
                    })()}
                    fill="#FF5500"
                    opacity="0.08"
                  />

                  {/* wi Trajectory Curve */}
                  <path
                    d={codonProfileData.reduce((acc, d, i) => {
                      const x = 45 + (i / 119) * 635;
                      const y = 145 - ((d.wi - 0.70) / 0.30) * 120;
                      return i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
                    }, "")}
                    fill="none"
                    stroke="#FF5500"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Carrier Locus Markers */}
                  {codonProfileData.filter((d) => d.isCarrier).map((d, idx) => {
                    const x = 45 + ((idx * 4 + 2) / 119) * 635;
                    const y = 145 - ((d.wi - 0.70) / 0.30) * 120;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="3"
                        fill="#FF5500"
                        stroke="#ffffff"
                        strokeWidth="0.8"
                      />
                    );
                  })}

                  {/* X-Axis Labels */}
                  <text x="45" y="175" fill="#71717a" fontSize="9" fontFamily="monospace">Codon 1 (ATG)</text>
                  <text x="250" y="175" fill="#71717a" fontSize="9" fontFamily="monospace">Codon 350</text>
                  <text x="460" y="175" fill="#71717a" fontSize="9" fontFamily="monospace">Codon 700</text>
                  <text x="680" y="175" fill="#71717a" fontSize="9" fontFamily="monospace" textAnchor="end">1,025 (TAA)</text>
                </svg>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs font-mono text-muted-foreground">
                <span>Codon Adaptation Envelope: Compliant (w_i ≥ 0.85)</span>
                <span className="text-foreground font-semibold">Mean CAI: 0.988</span>
              </div>
            </Card>

            {/* Right 4 Cols: Biophysical Health Ledger */}
            <Card className="lg:col-span-4 border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 pb-2 border-b border-border/50">
                <ShieldCheck className="h-4 w-4 text-zinc-400" />
                Biophysical Health Matrix
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Comparative metrics proving zero disruption to host replication or protein folding kinetics:
              </p>

              <div className="space-y-2 text-xs font-mono pt-1">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40">
                  <span className="text-muted-foreground">Host Organism:</span>
                  <span className="text-foreground font-bold">E. coli K-12</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40">
                  <span className="text-muted-foreground">Wildtype CAI:</span>
                  <span className="text-foreground font-bold">0.988</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40">
                  <span className="text-muted-foreground">Stamped CAI:</span>
                  <span className="text-foreground font-bold">0.986 (Δ -0.002)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40">
                  <span className="text-muted-foreground">GC Content:</span>
                  <span className="text-foreground font-bold">50.8% → 51.1%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40">
                  <span className="text-muted-foreground">Max Homopolymer:</span>
                  <span className="text-foreground font-semibold">4 bp (≤ 4 bp Limit)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40">
                  <span className="text-muted-foreground">Amino Acid Delta:</span>
                  <span className="text-foreground font-semibold">0 Mutations (Exact)</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 2: PREPROCESSING (CDS & CODON DEGENERACY ANALYSIS)  */}
      {/* ========================================================= */}
      {activeTab === "preprocessing" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="border border-border bg-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border/50">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-primary" />
                  Target Coding Sequence (CDS) &amp; Open Reading Frame Validation
                </CardTitle>
                <CardDescription className="text-xs">
                  Modulo-3 in-frame alignment and host codon degeneracy mapping (Standard Bacterial Table 11)
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono text-zinc-300 border-zinc-700 bg-zinc-800/80">
                Reading Frame: Locked (Sense 5&apos; → 3&apos;)
              </Badge>
            </div>

            {/* Sequence Frame Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <span className="text-[10px] text-muted-foreground block">Start Codon Guard</span>
                <span className="text-foreground font-bold mt-0.5 block">ATG (Methionine #1)</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <span className="text-[10px] text-muted-foreground block">Stop Codon Guard</span>
                <span className="text-foreground font-bold mt-0.5 block">TAA (Ochre Guard)</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <span className="text-[10px] text-muted-foreground block">Frame Check</span>
                <span className="text-foreground font-semibold mt-0.5 block">Length % 3 == 0 (Valid)</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <span className="text-[10px] text-muted-foreground block">Total Codons</span>
                <span className="text-foreground font-bold mt-0.5 block">1,025 Codons</span>
              </div>
            </div>

            {/* Synonymous Codon Degeneracy Table */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                Host Synonymous Codon Degeneracy &amp; Translation Efficiency Table
              </h4>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-xs">Amino Acid</TableHead>
                      <TableHead className="text-xs">Degeneracy</TableHead>
                      <TableHead className="text-xs font-mono">Synonymous Family</TableHead>
                      <TableHead className="text-xs">Host Fraction</TableHead>
                      <TableHead className="text-xs">Adaptiveness (w_i)</TableHead>
                      <TableHead className="text-xs text-right pr-4">Viability Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { aa: "Leucine (Leu / L)", deg: "6-fold", codons: "TTA, TTG, CTT, CTC, CTA, CTG", freq: "10.7%", wi: "0.965 - 1.000", status: "Optimal Carrier" },
                      { aa: "Arginine (Arg / R)", deg: "6-fold", codons: "CGT, CGC, CGA, CGG, AGA, AGG", freq: "5.5%", wi: "0.940 - 0.992", status: "Optimal Carrier" },
                      { aa: "Serine (Ser / S)", deg: "6-fold", codons: "TCT, TCC, TCA, TCG, AGT, AGC", freq: "5.8%", wi: "0.920 - 0.985", status: "Optimal Carrier" },
                      { aa: "Valine (Val / V)", deg: "4-fold", codons: "GTT, GTC, GTA, GTG", freq: "7.1%", wi: "0.935 - 0.972", status: "High Capacity" },
                      { aa: "Alanine (Ala / A)", deg: "4-fold", codons: "GCT, GCC, GCA, GCG", freq: "9.5%", wi: "0.950 - 0.981", status: "High Capacity" },
                      { aa: "Threonine (Thr / T)", deg: "4-fold", codons: "ACT, ACC, ACA, ACG", freq: "5.4%", wi: "0.925 - 0.954", status: "High Capacity" },
                      { aa: "Glutamic Acid (Glu / E)", deg: "2-fold", codons: "GAA, GAG", freq: "5.8%", wi: "0.980 - 0.988", status: "Safe Binary" },
                      { aa: "Aspartic Acid (Asp / D)", deg: "2-fold", codons: "GAT, GAC", freq: "5.1%", wi: "0.970 - 0.985", status: "Safe Binary" },
                    ].map((row, idx) => (
                      <TableRow key={idx} className="border-border hover:bg-muted/40">
                        <TableCell className="text-xs font-semibold text-foreground">{row.aa}</TableCell>
                        <TableCell className="text-xs font-mono text-primary font-bold">{row.deg}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{row.codons}</TableCell>
                        <TableCell className="text-xs font-mono text-foreground">{row.freq}</TableCell>
                        <TableCell className="text-xs font-mono text-zinc-300">{row.wi}</TableCell>
                        <TableCell className="text-xs font-mono text-right pr-4 text-foreground/90">{row.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 3: CARRIER PERMUTATION (HKDF-KEYED PRNG LOCI)       */}
      {/* ========================================================= */}
      {activeTab === "carrier_permutation" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="border border-border bg-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border/50">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  HKDF-SHA256 Cryptographic Carrier Dispersion
                </CardTitle>
                <CardDescription className="text-xs">
                  Keyed pseudo-random permutation over synonymous codons preventing adversarial watermark discovery
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono text-primary border-primary/40 bg-primary/10">
                Key Derivation: RFC 5869
              </Badge>
            </div>

            {/* Dispersion Visualizer: 1D Ruler showing the 64 carrier locations */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span>Spatial Distribution of 64 Carrier Loci (0 bp ➔ 3,075 bp)</span>
                <span className="text-foreground font-medium">Uniform Dispersion (p = 0.94)</span>
              </div>

              {/* Graphical Ruler */}
              <div className="relative h-14 w-full bg-[#111116] rounded-lg border border-border/60 flex items-center px-4 overflow-hidden">
                <div className="w-full h-1 bg-border/60 relative">
                  {[...Array(64)].map((_, i) => {
                    const pct = ((i * 13 + 7) % 64) / 64;
                    return (
                      <div
                        key={i}
                        className="absolute -top-2 w-1.5 h-5 bg-[#FF5500] rounded-sm transition-all hover:scale-125 hover:bg-white cursor-pointer"
                        style={{ left: `${pct * 98}%` }}
                        title={`Carrier Locus #${i + 1}: Codon #${Math.floor(pct * 1025)}`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>5&apos; Leader Domain</span>
                <span>Mid-Sequence Catalytic Core</span>
                <span>3&apos; Terminal Domain</span>
              </div>
            </div>

            {/* Cryptographic Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <span className="text-[10px] text-muted-foreground block">PRNG Uniformity Entropy</span>
                <span className="text-foreground font-bold mt-0.5 block">7.994 Bits / Byte</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <span className="text-[10px] text-muted-foreground block">Minimum Spacing</span>
                <span className="text-foreground font-bold mt-0.5 block">≥ 4 Codons Separation</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <span className="text-[10px] text-muted-foreground block">Key Security</span>
                <span className="text-foreground font-semibold mt-0.5 block">HMAC-SHA256 (256-bit)</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 4: RS CODING (GF(2⁸) REED-SOLOMON CODEC)            */}
      {/* ========================================================= */}
      {activeTab === "rs_coding" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="border border-border bg-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border/50">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Reed-Solomon RS(16,8) over Galois Field GF(2⁸)
                </CardTitle>
                <CardDescription className="text-xs">
                  8 Data bytes encoded into 16-symbol codeword with 8 parity bytes for up to 4 symbol error correction
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono text-zinc-300 border-zinc-700 bg-zinc-800/80">
                Capacity: 25% Symbol Error Tolerance
              </Badge>
            </div>

            {/* 16 Codeword Symbol Blocks (8 Data + 8 Parity) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span className="text-foreground font-semibold">Codeword Architecture (16 Bytes / Codeword Tile)</span>
                <span>Generator: g(x) = ∏(x - αⁱ)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {[
                  { hex: "0x48", label: "Data #1 (Lab)", isParity: false },
                  { hex: "0x45", label: "Data #2 (Lab)", isParity: false },
                  { hex: "0x4C", label: "Data #3 (Proj)", isParity: false },
                  { hex: "0x49", label: "Data #4 (Proj)", isParity: false },
                  { hex: "0x58", label: "Data #5 (Batch)", isParity: false },
                  { hex: "0x32", label: "Data #6 (Batch)", isParity: false },
                  { hex: "0x36", label: "Data #7 (Time)", isParity: false },
                  { hex: "0x01", label: "Data #8 (MAC)", isParity: false },
                  { hex: "0x7E", label: "Parity P1", isParity: true },
                  { hex: "0x3B", label: "Parity P2", isParity: true },
                  { hex: "0xA9", label: "Parity P3", isParity: true },
                  { hex: "0xF4", label: "Parity P4", isParity: true },
                  { hex: "0x1C", label: "Parity P5", isParity: true },
                  { hex: "0x8D", label: "Parity P6", isParity: true },
                  { hex: "0x52", label: "Parity P7", isParity: true },
                  { hex: "0xE0", label: "Parity P8", isParity: true },
                ].map((sym, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-center font-mono ${
                      sym.isParity
                        ? "border-[#FF5500]/40 bg-[#FF5500]/10"
                        : "border-border bg-muted/30"
                    }`}
                  >
                    <span className="text-[10px] text-muted-foreground block">{sym.label}</span>
                    <span className={`text-base font-bold mt-1 block ${sym.isParity ? "text-[#FF5500]" : "text-foreground"}`}>
                      {sym.hex}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Resilience Gauge */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-foreground font-semibold block">Berlekamp-Massey Decoder Resilience</span>
                <span className="text-muted-foreground block text-[11px]">
                  Guarantees 100% bit recovery even if up to 4 symbols (32 bits) are corrupted by point substitutions or PCR jitter.
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-foreground font-semibold text-sm">4 / 4 Symbols Margin</span>
                <span className="text-muted-foreground block text-[10px]">Active Channel Errors: 0</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 5: SYNONYMOUS EMBED (DEGENERACY MODULATION)         */}
      {/* ========================================================= */}
      {activeTab === "synonymous_embed" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="border border-border bg-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border/50">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Synonymous Codon Substitution Diff Ledger
                </CardTitle>
                <CardDescription className="text-xs">
                  Modulation of synonymous codon choices at the 64 carrier loci preserving 100% primary amino acids
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={handleExportCodonLedger} className="text-xs gap-1.5 border-border">
                <Download className="w-3.5 h-3.5" />
                Export Codon Ledger
              </Button>
            </div>

            {/* Codon Mutations Table */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-xs">Locus ID</TableHead>
                    <TableHead className="text-xs">Position (bp)</TableHead>
                    <TableHead className="text-xs">Amino Acid</TableHead>
                    <TableHead className="text-xs">Codon Mutation (Wildtype → Stamped)</TableHead>
                    <TableHead className="text-xs">Bit Val</TableHead>
                    <TableHead className="text-xs">Adaptiveness (w_i)</TableHead>
                    <TableHead className="text-xs text-right pr-4">Identity Verification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { id: "LOC-01", pos: "Codon #14 (42 bp)", aa: "Glu (E)", mut: "GAG → GAA", bit: "0b1", wi: "0.988", status: "Synonymous" },
                    { id: "LOC-02", pos: "Codon #28 (84 bp)", aa: "Leu (L)", mut: "CTG → CTA", bit: "0b0", wi: "0.965", status: "Synonymous" },
                    { id: "LOC-03", pos: "Codon #42 (126 bp)", aa: "Val (V)", mut: "GTG → GTA", bit: "0b1", wi: "0.972", status: "Synonymous" },
                    { id: "LOC-04", pos: "Codon #58 (174 bp)", aa: "Ala (A)", mut: "GCG → GCA", bit: "0b0", wi: "0.981", status: "Synonymous" },
                    { id: "LOC-05", pos: "Codon #74 (222 bp)", aa: "Thr (T)", mut: "ACC → ACA", bit: "0b1", wi: "0.954", status: "Synonymous" },
                    { id: "LOC-06", pos: "Codon #92 (276 bp)", aa: "Arg (R)", mut: "CGT → CGC", bit: "0b1", wi: "0.992", status: "Synonymous" },
                    { id: "LOC-07", pos: "Codon #110 (330 bp)", aa: "Asp (D)", mut: "GAT → GAC", bit: "0b0", wi: "0.985", status: "Synonymous" },
                    { id: "LOC-08", pos: "Codon #128 (384 bp)", aa: "Phe (F)", mut: "TTT → TTC", bit: "0b1", wi: "0.978", status: "Synonymous" },
                  ].map((row, idx) => (
                    <TableRow key={idx} className="border-border hover:bg-muted/40">
                      <TableCell className="text-xs font-mono font-semibold text-primary">{row.id}</TableCell>
                      <TableCell className="text-xs font-mono text-foreground">{row.pos}</TableCell>
                      <TableCell className="text-xs font-mono text-foreground font-semibold">{row.aa}</TableCell>
                      <TableCell className="text-xs font-mono text-primary font-bold">{row.mut}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{row.bit}</TableCell>
                      <TableCell className="text-xs font-mono text-zinc-300">{row.wi}</TableCell>
                      <TableCell className="text-xs font-mono text-foreground font-semibold text-right pr-4">{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 6: WGAN REFINER (ADVERSARIAL REALISM TUNING)         */}
      {/* ========================================================= */}
      {activeTab === "wgan_refiner" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="border border-border bg-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border/50">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  Wasserstein GAN Realism Refiner (λ = 10 Gradient Penalty)
                </CardTitle>
                <CardDescription className="text-xs">
                  Adversarial discriminator tuning non-carrier codons to eliminate k-mer distribution discrepancies
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono text-zinc-300 border-zinc-700 bg-zinc-800/80">
                Stealth Metric: AUC 0.505 (Chance)
              </Badge>
            </div>

            {/* k-mer Frequency Divergence Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl border border-border bg-muted/20 text-center">
                <span className="text-[10px] text-muted-foreground block uppercase">Wildtype Host Benchmark</span>
                <div className="text-2xl font-bold text-foreground mt-1">0.000</div>
                <span className="text-[11px] text-muted-foreground mt-1 block">MMD Divergence Baseline</span>
              </div>
              <div className="p-4 rounded-xl border border-border bg-[#FF5500]/10 border-[#FF5500]/40 text-center">
                <span className="text-[10px] text-[#FF5500] block uppercase font-bold">HelixSign (WGAN Refined)</span>
                <div className="text-2xl font-bold text-[#FF5500] mt-1">0.012</div>
                <span className="text-[11px] text-zinc-300 mt-1 block">Indistinguishable from Host</span>
              </div>
              <div className="p-4 rounded-xl border border-border bg-muted/20 text-center">
                <span className="text-[10px] text-muted-foreground block uppercase">Naive Tagging Scheme</span>
                <div className="text-2xl font-bold text-rose-400 mt-1">0.185</div>
                <span className="text-[11px] text-rose-400 mt-1 block">Flagged by Biosecurity Classifiers</span>
              </div>
            </div>

            {/* Explanatory text */}
            <div className="p-4 rounded-xl border border-border bg-muted/10 text-xs text-muted-foreground leading-relaxed">
              The Wasserstein critic penalizes non-native k-mer combinations (k = 3, 4, 5). By performing gradient-guided minor adjustments on non-watermarked synonymous codons, the overall k-mer frequency divergence is suppressed below the detection threshold of both 1D-CNN and gradient-boosted biosecurity classifiers.
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 7: INVARIANT PROOF (PEPTIDE ALIGNMENT & CERTIFICATE)*/}
      {/* ========================================================= */}
      {activeTab === "invariant_proof" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="border border-border bg-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border/50">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Dna className="h-4 w-4 text-primary" />
                  In Silico Translation &amp; Peptide Alignment Proof
                </CardTitle>
                <CardDescription className="text-xs">
                  Full side-by-side peptide translation comparison proving 0 amino acid substitutions
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono text-zinc-300 border-zinc-700 bg-zinc-800/80">
                0 Mismatches Across 1,025 Residues
              </Badge>
            </div>

            {/* Peptide Alignment Track Display */}
            <div className="space-y-2 p-4 rounded-xl border border-border bg-[#0d0d12] font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/40 text-muted-foreground text-[11px]">
                <span>Peptide Translation (Codon 1 to 60)</span>
                <span className="text-foreground font-semibold">100.0% Identity Verified</span>
              </div>

              <div className="space-y-1.5 pt-2 text-[11px] leading-relaxed">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground w-20 shrink-0">WILDTYPE:</span>
                  <span className="text-foreground tracking-widest break-all">
                    MTMITDSLAVVLQRRDWENPGVTQLNRLAAHPPFASWRNSEEARTDRPSQQLRSLNGEWR
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground w-20 shrink-0">STAMPED:</span>
                  <span className="text-foreground font-mono tracking-widest break-all">
                    MTMITDSLAVVLQRRDWENPGVTQLNRLAAHPPFASWRNSEEARTDRPSQQLRSLNGEWR
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground w-20 shrink-0">MATCH:</span>
                  <span className="text-muted-foreground/60 tracking-widest break-all">
                    ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
                  </span>
                </div>
              </div>
            </div>

            {/* Cryptographic Provenance Ledger Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono pt-2">
              <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
                <span className="text-muted-foreground text-[10px] uppercase font-bold block">Cryptographic Construct Signature</span>
                <span className="text-foreground font-mono text-[11px] break-all block">
                  SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
                <span className="text-muted-foreground text-[10px] uppercase font-bold block">Provenance Registry Seal</span>
                <span className="text-zinc-300 font-mono text-[11px] block">
                  Registered in Supabase Ledger &bull; Immutable Timestamp: 2026-11-13 00:58 UTC
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
