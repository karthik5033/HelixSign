"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Crosshair,
  Activity,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Download,
  Info,
  Radio,
  Clock,
  Compass,
  Cpu,
  Zap,
  Eye,
  EyeOff,
  Dna,
  ShieldCheck,
  Gauge,
  BarChart2,
  Database,
  FileText,
} from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Pre-defined carrier codon hotspot locations across synthetic biological constructs
interface CarrierPreset {
  id: string;
  name: string;
  gene: string;
  organism: string;
  totalLengthBp: number;
  selectedLocusBp: number;
  codonIndex: number;
  aminoAcid: string;
  wildtypeCodon: string;
  watermarkCodon: string;
  relativeAdaptiveness: number;
  caiDelta: string;
  rsSymbolHex: string;
  activeSegmentId: string;
}

const PRESET_CONSTRUCTS: CarrierPreset[] = [
  {
    id: "LOC-LACZ",
    name: "E. coli lacZ β-Galactosidase (Locus #508)",
    gene: "lacZ",
    organism: "E. coli K-12",
    totalLengthBp: 3075,
    selectedLocusBp: 1524,
    codonIndex: 508,
    aminoAcid: "Glu (E)",
    wildtypeCodon: "GAG",
    watermarkCodon: "GAA",
    relativeAdaptiveness: 0.988,
    caiDelta: "+0.002",
    rsSymbolHex: "0x7E",
    activeSegmentId: "SEG-02",
  },
  {
    id: "LOC-CAS9",
    name: "SpCas9 Endonuclease (Locus #715)",
    gene: "cas9",
    organism: "S. pyogenes / E. coli",
    totalLengthBp: 4104,
    selectedLocusBp: 2145,
    codonIndex: 715,
    aminoAcid: "Leu (L)",
    wildtypeCodon: "CTG",
    watermarkCodon: "CTA",
    relativeAdaptiveness: 0.965,
    caiDelta: "-0.004",
    rsSymbolHex: "0x3B",
    activeSegmentId: "SEG-03",
  },
  {
    id: "LOC-GFP",
    name: "sfGFP Superfolder Fluorophore (Locus #128)",
    gene: "sfgfp",
    organism: "A. victoria / E. coli",
    totalLengthBp: 717,
    selectedLocusBp: 384,
    codonIndex: 128,
    aminoAcid: "Val (V)",
    wildtypeCodon: "GTG",
    watermarkCodon: "GTA",
    relativeAdaptiveness: 0.972,
    caiDelta: "+0.001",
    rsSymbolHex: "0xA9",
    activeSegmentId: "SEG-02",
  },
  {
    id: "LOC-PUC19",
    name: "pUC19 AmpR β-Lactamase (Locus #204)",
    gene: "bla",
    organism: "Synthetic Cloning Vector",
    totalLengthBp: 861,
    selectedLocusBp: 612,
    codonIndex: 204,
    aminoAcid: "Ala (A)",
    wildtypeCodon: "GCG",
    watermarkCodon: "GCA",
    relativeAdaptiveness: 0.981,
    caiDelta: "+0.003",
    rsSymbolHex: "0xF4",
    activeSegmentId: "SEG-03",
  },
];

// 4 Functional Genomic Segments spanning the Open Reading Frame
const GENOMIC_SEGMENTS = [
  {
    id: "SEG-01",
    name: "5' Regulatory & Initiator Domain",
    region: "0 - 750 bp",
    bpStart: 0,
    bpEnd: 750,
    type: "Promoter & RBS Coupling",
    color: "#7A7F80",
    carrierCount: 16,
    caiDelta: "+0.002",
    gcSkew: "+0.05%",
    status: "Verified Invariant",
    profile: [0.94, 0.96, 0.98, 0.97, 0.99, 0.95, 0.98, 0.97],
  },
  {
    id: "SEG-02",
    name: "Catalytic Core Domain",
    region: "750 - 1500 bp",
    bpStart: 750,
    bpEnd: 1500,
    type: "Degenerate Synonymous Loci",
    color: "#7A7F80",
    carrierCount: 16,
    caiDelta: "-0.004",
    gcSkew: "+0.08%",
    status: "Verified Invariant",
    profile: [0.98, 0.99, 0.97, 0.96, 0.98, 0.99, 0.97, 0.98],
  },
  {
    id: "SEG-03",
    name: "Structural Scaffold Domain",
    region: "1500 - 2250 bp",
    bpStart: 1500,
    bpEnd: 2250,
    type: "WGAN Host Refiner Loci",
    color: "#7A7F80",
    carrierCount: 16,
    caiDelta: "+0.001",
    gcSkew: "-0.03%",
    status: "Verified Invariant",
    profile: [0.96, 0.97, 0.98, 0.95, 0.97, 0.98, 0.99, 0.97],
  },
  {
    id: "SEG-04",
    name: "3' C-Terminal & Termination Domain",
    region: "2250 - 3075 bp",
    bpStart: 2250,
    bpEnd: 3075,
    type: "Stop Codon & RS Parity Loci",
    color: "#7A7F80",
    carrierCount: 16,
    caiDelta: "0.000",
    gcSkew: "+0.02%",
    status: "Verified Invariant",
    profile: [0.95, 0.97, 0.96, 0.98, 0.97, 0.99, 0.96, 0.98],
  },
];

// Codon Degeneracy Class vs Theoretical Shannon and Net Redundant Capacity
const CAPACITY_CURVE = [
  { deg: "1-Fold (Met/Trp)", codons: 1, bitsPerCodon: 0.00, viableBits: 0.00, rsNetBits: 0.00 },
  { deg: "2-Fold (Glu/Asp/Phe)", codons: 2, bitsPerCodon: 1.00, viableBits: 0.72, rsNetBits: 0.36 },
  { deg: "3-Fold (Ile)", codons: 3, bitsPerCodon: 1.58, viableBits: 1.12, rsNetBits: 0.56 },
  { deg: "4-Fold (Ala/Gly/Val)", codons: 4, bitsPerCodon: 2.00, viableBits: 1.48, rsNetBits: 0.74 },
  { deg: "6-Fold (Leu/Arg/Ser)", codons: 6, bitsPerCodon: 2.58, viableBits: 1.94, rsNetBits: 0.97 },
];

export default function CarrierLocusMapping() {
  const [activeTab, setActiveTab] = useState<"architecture" | "heatmap" | "capacity">("architecture");
  const [selectedPresetId, setSelectedPresetId] = useState("LOC-LACZ");
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [selectedLocusBp, setSelectedLocusBp] = useState<number>(1524);
  const [isPlayingScan, setIsPlayingScan] = useState(true);
  const [scanTick, setScanTick] = useState(0);
  const [filterMode, setFilterMode] = useState<"all" | "carriers" | "high_cai">("all");

  const currentPreset = useMemo(() => {
    return PRESET_CONSTRUCTS.find((p) => p.id === selectedPresetId) || PRESET_CONSTRUCTS[0];
  }, [selectedPresetId]);

  // Synchronize locus when preset changes
  useEffect(() => {
    setSelectedLocusBp(currentPreset.selectedLocusBp);
  }, [currentPreset]);

  // Scanning animation loop
  useEffect(() => {
    if (!isPlayingScan) return;
    const interval = setInterval(() => {
      setScanTick((prev) => (prev + 1) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, [isPlayingScan]);

  // Map 0 - 3075 bp to SVG X coordinate (80 to 920 px)
  const toSvgX = (bp: number) => {
    const minBp = 0;
    const maxBp = currentPreset.totalLengthBp;
    const clamped = Math.max(minBp, Math.min(maxBp, bp));
    return 80 + ((clamped - minBp) / (maxBp - minBp)) * 840;
  };

  const selectedSvgX = toSvgX(selectedLocusBp);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Dna className="h-6 w-6 text-primary" />
            Carrier Locus &amp; Codon Mapping
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
            High-resolution genomic architecture track displaying HKDF-keyed synonymous carrier codons across open reading frames. Confirms primary amino acid invariance while preserving host codon adaptation.
          </p>
        </div>

        {/* Global Preset Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">Construct:</span>
            <select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              className="bg-card border border-border rounded-lg px-3 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {PRESET_CONSTRUCTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPlayingScan(!isPlayingScan)}
            className="text-xs font-mono gap-1.5 border-border cursor-pointer"
          >
            {isPlayingScan ? <Pause className="w-3.5 h-3.5 text-primary" /> : <Play className="w-3.5 h-3.5 text-primary" />}
            {isPlayingScan ? "Pause Scan" : "Live Scan"}
          </Button>

          <Link href="/analysis">
            <Button size="sm" variant="outline" className="text-xs font-mono gap-1.5 border-border cursor-pointer">
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
              Pipeline
            </Button>
          </Link>
        </div>
      </div>

      {/* TOP KPI STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Construct Length"
          value={`${currentPreset.totalLengthBp.toLocaleString()} bp`}
          subtext={`Open Reading Frame: ${Math.floor(currentPreset.totalLengthBp / 3)} Codons`}
          icon={<Database className="h-4 w-4 text-primary" />}
        />
        <MetricCard
          title="Peptide Sequence"
          value="100.0%"
          subtext="0 alterations across reading frame"
          change="INVARIANT"
          isPositive={true}
          icon={<ShieldCheck className="h-4 w-4 text-zinc-400" />}
        />
        <MetricCard
          title="Carrier Density"
          value="64 Synonymous Loci"
          subtext={`1 carrier / ${(currentPreset.totalLengthBp / 64).toFixed(0)} bp • HKDF Keyed`}
          icon={<Dna className="h-4 w-4 text-[#66898B]" />}
        />
        <MetricCard
          title="Host CAI Score"
          value="0.988"
          subtext={`Host Concordant (ΔCAI ${currentPreset.caiDelta})`}
          change="OPTIMAL"
          isPositive={true}
          icon={<Gauge className="h-4 w-4 text-primary" />}
        />
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex border-b border-border/60 gap-6 text-xs font-mono">
        <button
          onClick={() => setActiveTab("architecture")}
          className={cn(
            "pb-2.5 transition-all flex items-center gap-2 cursor-pointer font-medium",
            activeTab === "architecture"
              ? "border-b-2 border-primary text-foreground font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Dna className="w-4 h-4 text-primary" />
          1. Genomic Construct &amp; Carrier Architecture
        </button>
        <button
          onClick={() => setActiveTab("heatmap")}
          className={cn(
            "pb-2.5 transition-all flex items-center gap-2 cursor-pointer font-medium",
            activeTab === "heatmap"
              ? "border-b-2 border-primary text-foreground font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Activity className="w-4 h-4 text-primary" />
          2. Codon Adaptation &amp; GC Skew Distribution
        </button>
        <button
          onClick={() => setActiveTab("capacity")}
          className={cn(
            "pb-2.5 transition-all flex items-center gap-2 cursor-pointer font-medium",
            activeTab === "capacity"
              ? "border-b-2 border-primary text-foreground font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BarChart2 className="w-4 h-4 text-primary" />
          3. Synonymous Degeneracy &amp; Shannon Capacity
        </button>
      </div>

      {/* TAB 1: GENOMIC CONSTRUCT & CARRIER ARCHITECTURE */}
      {activeTab === "architecture" && (
        <div className="space-y-6">
          {/* CENTRAL INTERACTIVE DNA SCHEMATIC CANVAS */}
          <div className="rounded-2xl border border-border bg-[#111116] p-6 shadow-xl relative overflow-hidden">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/50">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-foreground font-bold">{currentPreset.name}</span>
                <span className="text-muted-foreground">• Host: {currentPreset.organism}</span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                <span>Selected Carrier Locus:</span>
                <span className="text-primary font-bold">{selectedLocusBp} bp (Codon #{Math.floor(selectedLocusBp / 3)})</span>
              </div>
            </div>

            {/* SVG SCHEMATIC VIEWPORT */}
            <div className="relative w-full h-[290px] sm:h-[320px] mt-2 flex items-center justify-center">
              <svg viewBox="0 0 1000 320" className="w-full h-full select-none">
                <defs>
                  {/* Subtle glow for the active carrier locus */}
                  <radialGradient id="locusGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FF5500" stopOpacity="0.8" />
                    <stop offset="60%" stopColor="#FF5500" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#FF5500" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="dnaStrandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#806353" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#657C72" stopOpacity="0.3" />
                  </linearGradient>
                </defs>

                {/* 1. Scale Ruler Along Top (0 bp to max bp) */}
                <line x1="80" y1="45" x2="920" y2="45" stroke="#2a2a38" strokeWidth="1" />
                {[
                  { bp: 0, label: "5' (0 bp)" },
                  { bp: Math.floor(currentPreset.totalLengthBp * 0.16), label: `${Math.floor(currentPreset.totalLengthBp * 0.16)} bp` },
                  { bp: Math.floor(currentPreset.totalLengthBp * 0.33), label: `${Math.floor(currentPreset.totalLengthBp * 0.33)} bp` },
                  { bp: Math.floor(currentPreset.totalLengthBp * 0.50), label: `${Math.floor(currentPreset.totalLengthBp * 0.50)} bp` },
                  { bp: Math.floor(currentPreset.totalLengthBp * 0.67), label: `${Math.floor(currentPreset.totalLengthBp * 0.67)} bp` },
                  { bp: Math.floor(currentPreset.totalLengthBp * 0.83), label: `${Math.floor(currentPreset.totalLengthBp * 0.83)} bp` },
                  { bp: currentPreset.totalLengthBp, label: `3' (${currentPreset.totalLengthBp} bp)` },
                ].map((tick, i) => {
                  const tickX = toSvgX(tick.bp);
                  return (
                    <g key={`ruler-${i}`}>
                      <line x1={tickX} y1="40" x2={tickX} y2="45" stroke="#4a4a5e" strokeWidth="1" />
                      <text x={tickX} y="34" fill="#8e8ea0" fontSize="9" fontFamily="monospace" textAnchor="middle">
                        {tick.label}
                      </text>
                    </g>
                  );
                })}

                {/* 2. Functional Genomic Domain Blocks (Upper Track) */}
                {GENOMIC_SEGMENTS.map((seg, i) => {
                  const x1 = toSvgX(seg.bpStart);
                  const x2 = toSvgX(seg.bpEnd);
                  const width = x2 - x1;
                  const isHovered = hoveredSegment === seg.id;

                  return (
                    <g
                      key={`seg-block-${seg.id}`}
                      onMouseEnter={() => setHoveredSegment(seg.id)}
                      onMouseLeave={() => setHoveredSegment(null)}
                      className="cursor-pointer transition-opacity"
                    >
                      <rect
                        x={x1}
                        y="62"
                        width={width - 2}
                        height="26"
                        rx="4"
                        fill="#15151e"
                        stroke={isHovered ? seg.color : "#282836"}
                        strokeWidth={isHovered ? "1.8" : "1"}
                      />
                      <rect
                        x={x1}
                        y="62"
                        width="3"
                        height="26"
                        rx="1"
                        fill={seg.color}
                      />
                      <text
                        x={x1 + 10}
                        y="78"
                        fill={isHovered ? "#ffffff" : "#a1a1aa"}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight={isHovered ? "bold" : "normal"}
                      >
                        {seg.name.split(" ")[0]} ({seg.carrierCount} Loci)
                      </text>
                    </g>
                  );
                })}

                {/* 3. Biological Open Reading Frame (ORF) Double Track Body */}
                <rect
                  x="80"
                  y="108"
                  width="840"
                  height="110"
                  rx="6"
                  fill="#121219"
                  stroke="#262634"
                  strokeWidth="1.2"
                />

                {/* DNA Sense Strand (5' -> 3') & Antisense Strand (3' -> 5') Guide Ribbons */}
                <line x1="85" y1="135" x2="915" y2="135" stroke="#252535" strokeWidth="2" strokeDasharray="4,4" />
                <text x="88" y="130" fill="#71717a" fontSize="8" fontFamily="monospace">5&apos; SENSE STRAND</text>
                
                <line x1="85" y1="190" x2="915" y2="190" stroke="#252535" strokeWidth="2" strokeDasharray="4,4" />
                <text x="88" y="202" fill="#71717a" fontSize="8" fontFamily="monospace">3&apos; ANTISENSE STRAND</text>

                {/* Hydrogen Bond Rungs connecting strands across reading frame */}
                {[...Array(42)].map((_, idx) => {
                  const rungX = 100 + idx * 19.5;
                  return (
                    <line
                      key={`rung-${idx}`}
                      x1={rungX}
                      y1="137"
                      x2={rungX}
                      y2="188"
                      stroke="#1a1a24"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* 64 HKDF-Keyed Synonymous Carrier Loci along the CDS */}
                {[...Array(64)].map((_, i) => {
                  // Deterministic pseudo-random carrier position along CDS
                  const locusFraction = (i * 13 + 7) % 64 / 64;
                  const cBp = Math.floor(locusFraction * (currentPreset.totalLengthBp - 60)) + 30;
                  const cX = toSvgX(cBp);
                  const isSelected = Math.abs(cBp - selectedLocusBp) < 40;

                  return (
                    <g
                      key={`carrier-tick-${i}`}
                      onClick={() => setSelectedLocusBp(cBp)}
                      className="cursor-pointer group"
                    >
                      <line
                        x1={cX}
                        y1="125"
                        x2={cX}
                        y2="200"
                        stroke={isSelected ? "#FF5500" : "#ff5500"}
                        strokeWidth={isSelected ? "2.5" : "1"}
                        opacity={isSelected ? 1.0 : 0.35}
                      />
                      <circle
                        cx={cX}
                        cy="162"
                        r={isSelected ? 5 : 2.5}
                        fill={isSelected ? "#FF5500" : "#ff5500"}
                        opacity={isSelected ? 1 : 0.6}
                      />
                    </g>
                  );
                })}

                {/* Live Scanning Pulse Line */}
                {isPlayingScan && (
                  <line
                    x1={80 + ((scanTick % 360) / 360) * 840}
                    y1="108"
                    x2={80 + ((scanTick % 360) / 360) * 840}
                    y2="218"
                    stroke="#FF5500"
                    strokeWidth="1.2"
                    strokeDasharray="2,2"
                    opacity="0.75"
                  />
                )}

                {/* Active Carrier Locus Highlight & Beacon */}
                <circle cx={selectedSvgX} cy="162" r="32" fill="url(#locusGlow)" />
                <circle cx={selectedSvgX} cy="162" r="6" fill="#FF5500" />
                <circle cx={selectedSvgX} cy="162" r="14" fill="none" stroke="#FF5500" strokeWidth="1.2" opacity="0.6" strokeDasharray="3,3" />

                {/* Floating Locus Information Badge */}
                <g transform={`translate(${Math.max(160, Math.min(840, selectedSvgX))}, 242)`}>
                  <rect
                    x="-180"
                    y="0"
                    width="360"
                    height="42"
                    rx="5"
                    fill="#15151f"
                    stroke="#FF5500"
                    strokeWidth="1.2"
                  />
                  <circle cx="-162" cy="21" r="4" fill="#FF5500" />
                  <text x="-148" y="18" fill="#ffffff" fontSize="10.5" fontFamily="monospace" fontWeight="bold">
                    Carrier Locus #{currentPreset.codonIndex}: {currentPreset.aminoAcid}
                  </text>
                  <text x="-148" y="32" fill="#a1a1aa" fontSize="9" fontFamily="monospace">
                    Wildtype: {currentPreset.wildtypeCodon} &rarr; Stamped: {currentPreset.watermarkCodon} (Synonymous) &bull; RS: {currentPreset.rsSymbolHex}
                  </text>
                </g>
              </svg>
            </div>

            {/* Bottom Invariant Guarantee Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5 mt-4 border-t border-border/50 text-xs font-mono">
              <div className="p-3 rounded-lg border border-border bg-[#15151d]">
                <span className="text-muted-foreground block text-[10px]">SELECTED CARRIER LOCUS</span>
                <span className="text-sm font-bold text-foreground mt-0.5 block">{currentPreset.selectedLocusBp} bp ({currentPreset.aminoAcid})</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-[#15151d]">
                <span className="text-muted-foreground block text-[10px]">CODON SUBSTITUTION</span>
                <span className="text-sm font-bold text-primary mt-0.5 block">{currentPreset.wildtypeCodon} &rarr; {currentPreset.watermarkCodon} (Synonymous)</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-[#15151d]">
                <span className="text-muted-foreground block text-[10px]">CODON ADAPTATION (CAI)</span>
                <span className="text-sm font-bold text-muted-foreground mt-0.5 block">w = {currentPreset.relativeAdaptiveness} ({currentPreset.caiDelta})</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-[#15151d]">
                <span className="text-muted-foreground block text-[10px]">REED-SOLOMON CODEWORD</span>
                <span className="text-sm font-bold text-foreground mt-0.5 block">GF(2⁸) Symbol: {currentPreset.rsSymbolHex}</span>
              </div>
            </div>
          </div>

          {/* 4-SEGMENT GENOMIC CARRIER DOMAIN TELEMETRY STRIP */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-1">
              <span className="font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-primary" />
                4-Segment Genomic Carrier Domain Telemetry (Codon Adaptation &amp; Parity)
              </span>
              <span className="text-muted-foreground">Standard Bacterial Table 11 Codec</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {GENOMIC_SEGMENTS.map((seg) => {
                const isHovered = hoveredSegment === seg.id;
                const isSelectedDomain = seg.id === currentPreset.activeSegmentId;

                return (
                  <div
                    key={`seg-card-${seg.id}`}
                    onMouseEnter={() => setHoveredSegment(seg.id)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    className={cn(
                      "rounded-xl border p-4 transition-all bg-[#12121a] relative overflow-hidden",
                      isSelectedDomain
                        ? "border-primary/80 ring-1 ring-primary/30"
                        : isHovered
                        ? "border-primary/50"
                        : "border-border/60"
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                        <span className="font-mono font-bold text-xs text-foreground">{seg.id}</span>
                        <span className="text-[10px] text-muted-foreground truncate">{seg.name.split(" ")[0]}</span>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 border-border text-foreground">
                        {seg.carrierCount} CARRIERS
                      </Badge>
                    </div>

                    {/* Region */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-2">
                      <span>{seg.type}</span>
                      <span>{seg.region}</span>
                    </div>

                    {/* Codon Relative Adaptiveness Profile Mini Chart */}
                    <div className="my-2.5 h-12 w-full bg-[#0d0d13] rounded border border-border/60 p-1 flex items-end justify-between gap-1">
                      {seg.profile.map((val, pIdx) => {
                        const barHeight = Math.floor((val - 0.90) * 800);
                        return (
                          <div
                            key={`bar-${pIdx}`}
                            className="flex-1 bg-muted/60 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"
                            style={{
                              height: `${Math.max(12, Math.min(38, barHeight))}px`,
                              backgroundColor: pIdx % 2 === 0 ? seg.color : undefined,
                            }}
                            title={`Codon #${pIdx * 12 + 1}: w_i = ${val}`}
                          />
                        );
                      })}
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-1 pt-1 font-mono text-[10px] text-muted-foreground">
                      <div>
                        <span className="text-[9px] text-muted-foreground block">ΔCAI</span>
                        <span className="text-foreground font-bold">{seg.caiDelta}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block">GC Skew</span>
                        <span className="text-foreground font-bold">{seg.gcSkew}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block">Translation</span>
                        <span className="text-foreground font-bold">Invariant</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CODON ADAPTATION & GC SKEW DISTRIBUTION */}
      {activeTab === "heatmap" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card/60 text-xs">
            <div>
              <h3 className="font-bold text-foreground text-sm">Codon Relative Adaptiveness &amp; GC Skew Distribution</h3>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                Spatial heatmap across 3,075 bp coding frame verifying that watermarked synonymous substitutions remain within the high-expression host boundary.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-mono text-xs">Codon Filter:</span>
              {(["all", "carriers", "high_cai"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setFilterMode(m)}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs font-mono uppercase transition-colors cursor-pointer",
                    filterMode === m ? "bg-primary text-white font-bold" : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m === "all" ? "All Codons" : m === "carriers" ? "Carrier Loci" : "High CAI (w ≥ 0.95)"}
                </button>
              ))}
            </div>
          </div>

          {/* 2D HEATMAP GRID */}
          <div className="rounded-2xl border border-border bg-[#111116] p-6 text-xs shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border/50 font-mono text-[11px] text-muted-foreground">
              <span>Reading Frame Bins (0 to 3,075 bp) vs Relative Adaptiveness (w = 0.5 to 1.0)</span>
              <span className="text-primary font-semibold">Mean Construct CAI: 0.988 (Optimal E. coli K-12 Concordance)</span>
            </div>

            <div className="relative mt-5 h-72 w-full flex flex-col justify-between">
              {/* Heatmap Grid Cells */}
              <div className="grid grid-rows-6 grid-cols-20 gap-1.5 w-full h-56">
                {[...Array(120)].map((_, i) => {
                  const row = Math.floor(i / 20);
                  const col = i % 20;
                  
                  // Top rows (0, 1, 2) represent optimal adaptiveness (w = 0.85 - 1.00)
                  const isOptimalAdaptiveness = row <= 2;
                  const isCarrierBin = (col * 3 + row) % 5 === 0;

                  let opacity = 0.08;
                  let bg = "bg-muted/40";
                  let count = ((col * 11 + row * 19) % 20) + 5;

                  if (isOptimalAdaptiveness) {
                    opacity = 0.90 - row * 0.18;
                    bg = isCarrierBin ? "bg-primary" : "bg-cyan-600";
                    count = ((col * 7 + row * 13) % 40) + 60;
                  } else if (row === 3) {
                    opacity = 0.35;
                    bg = "bg-zinc-600";
                    count = ((col * 5 + row * 7) % 15) + 5;
                  }

                  return (
                    <div
                      key={`heat-${i}`}
                      title={`Window [${col * 150} - ${(col + 1) * 150} bp]: ${count} Codons (Adaptiveness Tier ${6 - row}/6)`}
                      className={cn("rounded-sm transition-all hover:scale-110 hover:z-10 cursor-pointer", bg)}
                      style={{ opacity }}
                    />
                  );
                })}
              </div>

              {/* X-Axis Labels */}
              <div className="flex justify-between font-mono text-[10px] text-muted-foreground pt-2 border-t border-border/40">
                <span>5&apos; (0 bp)</span>
                <span>750 bp</span>
                <span className="text-primary font-bold">1,500 bp (Mid-CDS)</span>
                <span>2,250 bp</span>
                <span>3&apos; (3,075 bp)</span>
              </div>
            </div>

            {/* Heatmap Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 mt-4 border-t border-border/50 text-xs font-mono">
              <div className="p-3 rounded-lg border border-border bg-[#14141c]">
                <span className="text-muted-foreground block">Domain 1: 5&apos; Initiation Stability</span>
                <span className="text-lg font-bold text-foreground mt-1 block">16 Carrier Codons</span>
                <span className="text-[10px] text-primary">ΔG = -18.4 kcal/mol (Zero Hairpin Traps)</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-[#14141c]">
                <span className="text-muted-foreground block">Domain 2: Core Catalytic Fidelity</span>
                <span className="text-lg font-bold text-foreground mt-1 block">32 Carrier Codons</span>
                <span className="text-[10px] text-muted-foreground">100.0% Amino Acid Invariant Proof</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-[#14141c]">
                <span className="text-muted-foreground block">Domain 3: 3&apos; Termination Efficiency</span>
                <span className="text-lg font-bold text-foreground mt-1 block">16 Carrier Codons</span>
                <span className="text-[10px] text-muted-foreground">Amber Stop Preserved (Zero Readthrough)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYNONYMOUS DEGENERACY & SHANNON CAPACITY */}
      {activeTab === "capacity" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-border bg-card/60 text-xs">
            <h3 className="font-bold text-foreground text-sm">Synonymous Degeneracy Matrix &amp; Shannon Capacity Curves</h3>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Mathematical proof of usable steganographic bit capacity per codon family under host viability constraints and Reed-Solomon RS(16,8) parity budgets.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-[#111116] p-6 text-xs shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border/50 font-mono text-[11px] text-muted-foreground">
              <span>Information Capacity (Bits / Codon) vs Amino Acid Degeneracy Class</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-muted-foreground" /> Theoretical Max (log₂ d)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#66898B]" /> Host Viable Rate (ΔCAI ≤ 0.015)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Net Protected RS(16,8) Rate</span>
              </div>
            </div>

            <div className="relative h-72 w-full mt-4">
              <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between font-mono text-[9px] text-muted-foreground">
                <span>3.00 bits</span>
                <span>2.25 bits</span>
                <span>1.50 bits</span>
                <span>0.75 bits</span>
                <span>0.00 bits</span>
              </div>

              <div className="ml-14 h-60 border-l border-b border-border relative">
                <svg viewBox="0 0 600 240" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1="0" y1="60" x2="600" y2="60" stroke="#23232d" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="0" y1="120" x2="600" y2="120" stroke="#23232d" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="0" y1="180" x2="600" y2="180" stroke="#23232d" strokeWidth="1" strokeDasharray="3,3" />

                  {/* Theoretical Max Curve (Top Gray Dashed) */}
                  <path
                    d="M 50 240 L 175 160 L 300 113 L 425 80 L 550 33"
                    fill="none"
                    stroke="#71717a"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />
                  <text x="500" y="28" fill="#a1a1aa" fontSize="9" fontFamily="monospace">Theoretical (log₂ d)</text>

                  {/* Host Viable Rate Curve (Middle Cyan) */}
                  <path
                    d="M 50 240 L 175 182 L 300 150 L 425 121 L 550 84"
                    fill="none"
                    stroke="#66898B"
                    strokeWidth="2.5"
                  />
                  <text x="490" y="78" fill="#66898B" fontSize="9" fontFamily="monospace" fontWeight="bold">Viable Rate</text>

                  {/* Net Protected RS(16,8) Curve (Bottom Orange Accent) */}
                  <path
                    d="M 50 240 L 175 211 L 300 195 L 425 180 L 550 162"
                    fill="none"
                    stroke="#B96F43"
                    strokeWidth="3"
                  />
                  <text x="470" y="156" fill="#B96F43" fontSize="9" fontFamily="monospace" fontWeight="bold">RS(16,8) Net</text>

                  {/* Data Points */}
                  {CAPACITY_CURVE.map((pt, i) => {
                    const cx = 50 + i * 125;
                    const cyTheoretical = 240 - (pt.bitsPerCodon / 3.0) * 240;
                    const cyViable = 240 - (pt.viableBits / 3.0) * 240;
                    const cyRs = 240 - (pt.rsNetBits / 3.0) * 240;

                    return (
                      <g key={`pt-${i}`}>
                        <circle cx={cx} cy={cyTheoretical} r="3" fill="#71717a" />
                        <circle cx={cx} cy={cyViable} r="3.5" fill="#06b6d4" />
                        <circle cx={cx} cy={cyRs} r="4.5" fill="#FF5500" />
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* X-Axis Labels */}
              <div className="ml-14 flex justify-between font-mono text-[10px] text-muted-foreground pt-2">
                {CAPACITY_CURVE.map((pt, i) => (
                  <span key={`lbl-${i}`} className="text-center w-24">
                    {pt.deg.split(" ")[0]}
                  </span>
                ))}
              </div>
            </div>

            {/* Capacity Proof Footnote */}
            <div className="mt-6 p-4 rounded-xl border border-border/60 bg-[#14141c] text-xs font-mono text-muted-foreground leading-relaxed">
              <div className="text-foreground font-bold mb-1 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-primary" />
                Capacity Theorem Guarantee
              </div>
              For any coding sequence of length <span className="text-foreground font-bold">N codons</span> containing at least <span className="text-primary font-bold">64 degenerate carrier codons</span>, HelixSign embeds a <span className="text-foreground font-bold">64-bit cryptographic ownership payload</span> with <span className="text-foreground font-bold">64 bits of Reed-Solomon error correction parity</span> with <span className="text-foreground font-semibold">0.00% primary protein sequence alteration</span> and <span className="text-foreground font-bold">ΔCAI &le; 0.015</span>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
