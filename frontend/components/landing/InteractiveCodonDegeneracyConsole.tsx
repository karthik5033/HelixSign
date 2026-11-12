"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Dna,
  Database,
  Boxes,
  Activity,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Play,
  Pause,
  ShieldCheck,
  Zap,
  HardDrive,
  FileCode,
} from "lucide-react";

export interface OrganismProfile {
  name: string;
  label: string;
  table: string;
  bars: {
    sixFold: { bits: string; codons: string; width: string };
    fourFold: { bits: string; codons: string; width: string };
    twoFold: { bits: string; codons: string; width: string };
  };
  metrics: {
    elongation: string;
    elongationDelta: string;
    meanCai: string;
    caiThreshold: string;
    mrnaDeltaG: string;
    mrnaFoldNote: string;
  };
}

export const ORGANISM_PROFILES: Record<"ecoli" | "yeast" | "human", OrganismProfile> = {
  ecoli: {
    name: "E. coli K-12",
    label: "E. coli K-12 MG1655",
    table: "Table 11 Codec",
    bars: {
      sixFold: { bits: "2.58 bits/codon", codons: "18 Codons", width: "88%" },
      fourFold: { bits: "2.00 bits/codon", codons: "32 Codons", width: "68%" },
      twoFold: { bits: "1.00 bit/codon", codons: "14 Codons", width: "42%" },
    },
    metrics: {
      elongation: "18.4 cod/s",
      elongationDelta: "Δv = 0.0%",
      meanCai: "0.988",
      caiThreshold: "w_i ≥ 0.85 (Optimal)",
      mrnaDeltaG: "-18.4 kcal",
      mrnaFoldNote: "Hairpin Free",
    },
  },
  yeast: {
    name: "Yeast",
    label: "S. cerevisiae S288C",
    table: "Table 1 Standard",
    bars: {
      sixFold: { bits: "2.42 bits/codon", codons: "16 Codons", width: "78%" },
      fourFold: { bits: "2.00 bits/codon", codons: "30 Codons", width: "62%" },
      twoFold: { bits: "1.00 bit/codon", codons: "18 Codons", width: "48%" },
    },
    metrics: {
      elongation: "15.2 cod/s",
      elongationDelta: "Δv = -0.4%",
      meanCai: "0.965",
      caiThreshold: "w_i ≥ 0.82 (Concordant)",
      mrnaDeltaG: "-21.2 kcal",
      mrnaFoldNote: "Ribosome Unblocked",
    },
  },
  human: {
    name: "Human",
    label: "H. sapiens (HEK293)",
    table: "Table 1 Standard",
    bars: {
      sixFold: { bits: "2.35 bits/codon", codons: "18 Codons", width: "74%" },
      fourFold: { bits: "2.00 bits/codon", codons: "32 Codons", width: "70%" },
      twoFold: { bits: "1.00 bit/codon", codons: "14 Codons", width: "45%" },
    },
    metrics: {
      elongation: "5.6 cod/s",
      elongationDelta: "Δv = -0.1%",
      meanCai: "0.952",
      caiThreshold: "w_i ≥ 0.80 (Expressible)",
      mrnaDeltaG: "-24.8 kcal",
      mrnaFoldNote: "Secondary Structure Clean",
    },
  },
};

export interface CarrierLocus {
  id: string;
  gene: string;
  mutation: string;
  residue: string;
  pos: number;
  wi: number;
  deltaCai: string;
  rs: string;
  mechanism: string;
}

export const CARRIER_LOCI_SAMPLE: CarrierLocus[] = [
  {
    id: "LOC-014",
    gene: "lacZ #14 (42 bp)",
    mutation: "GAG → GAA",
    residue: "Glu (E)",
    pos: 14,
    wi: 0.988,
    deltaCai: "+0.002",
    rs: "0x7E",
    mechanism: "3rd wobble base A/G transition; preserves cognate tRNA(Glu) pool",
  },
  {
    id: "LOC-028",
    gene: "lacZ #28 (84 bp)",
    mutation: "CTG → CTA",
    residue: "Leu (L)",
    pos: 28,
    wi: 0.965,
    deltaCai: "-0.004",
    rs: "0x3B",
    mechanism: "6-fold degenerate Leucine synonymous wobble preserving open reading frame",
  },
  {
    id: "LOC-042",
    gene: "lacZ #42 (126 bp)",
    mutation: "GTG → GTA",
    residue: "Val (V)",
    pos: 42,
    wi: 0.972,
    deltaCai: "-0.001",
    rs: "0xA4",
    mechanism: "4-fold Valine synonymous modulation; neutral mRNA folding stability",
  },
  {
    id: "LOC-058",
    gene: "lacZ #58 (174 bp)",
    mutation: "GCG → GCA",
    residue: "Ala (A)",
    pos: 58,
    wi: 0.981,
    deltaCai: "+0.003",
    rs: "0x19",
    mechanism: "Alanine GC-neutral wobble adjustment for Twist/IDT synthesis balance",
  },
  {
    id: "LOC-074",
    gene: "lacZ #74 (222 bp)",
    mutation: "ACC → ACA",
    residue: "Thr (T)",
    pos: 74,
    wi: 0.954,
    deltaCai: "-0.005",
    rs: "0xF2",
    mechanism: "Threonine synonymous parity carrier symbol mapping under Table 11",
  },
  {
    id: "LOC-092",
    gene: "lacZ #92 (276 bp)",
    mutation: "CGT → CGC",
    residue: "Arg (R)",
    pos: 92,
    wi: 0.992,
    deltaCai: "+0.001",
    rs: "0x5C",
    mechanism: "Arginine optimal host translation codon preserving elongation speed",
  },
];

type TargetKey =
  | "yeast"
  | "ecoli"
  | "hkdf"
  | "rs"
  | "envelope"
  | "vectors"
  | "row_loc28"
  | "row_loc58"
  | "row_loc14";

interface DemoAction {
  target: TargetKey;
  label: string;
  narrative: string;
  execute: () => void;
  dwell: number;
}

export function InteractiveCodonDegeneracyConsole() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Target element refs for animated cursor targeting
  const targetRefs = useRef<Record<TargetKey, HTMLElement | null>>({
    yeast: null,
    ecoli: null,
    hkdf: null,
    rs: null,
    envelope: null,
    vectors: null,
    row_loc28: null,
    row_loc58: null,
    row_loc14: null,
  });

  // State
  const [selectedHostOrganism, setSelectedHostOrganism] = useState<"ecoli" | "yeast" | "human">("ecoli");
  const [activeEccEngine, setActiveEccEngine] = useState<"rs" | "hkdf">("rs");
  const [selectedDbTab, setSelectedDbTab] = useState<"tables" | "docs" | "vectors">("tables");
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [isAutoDemoRunning, setIsAutoDemoRunning] = useState<boolean>(true);
  const [isUserHovering, setIsUserHovering] = useState<boolean>(false);

  // Animated cursor visual state
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 320, y: 180 });
  const [cursorVisible, setCursorVisible] = useState<boolean>(false);
  const [isClicking, setIsClicking] = useState<boolean>(false);
  const [cursorLabel, setCursorLabel] = useState<string>("Analyzing codon space");
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  // Ref to track if user took over
  const userInteractedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentStepIndexRef = useRef<number>(0);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentOrganism = ORGANISM_PROFILES[selectedHostOrganism];
  const activeLocus = CARRIER_LOCI_SAMPLE[selectedRow] || CARRIER_LOCI_SAMPLE[0];

  // Helper to set element ref
  const registerTarget = (key: TargetKey) => (el: HTMLElement | null) => {
    targetRefs.current[key] = el;
  };

  // Trigger click ripple effect
  const triggerRippleAt = useCallback((x: number, y: number) => {
    setClickRipple({ x, y, id: Date.now() });
    setTimeout(() => {
      setClickRipple((prev) => (prev?.id === prev?.id ? null : prev));
    }, 600);
  }, []);

  // Logical guided actions sequence
  const actionsSequenceRef = useRef<DemoAction[]>([]);
  actionsSequenceRef.current = [
    {
      target: "yeast",
      label: "Evaluate Yeast S288C Codec",
      narrative: "Testing host adaptation envelope in S. cerevisiae (Table 1)",
      execute: () => setSelectedHostOrganism("yeast"),
      dwell: 2200,
    },
    {
      target: "ecoli",
      label: "Restore E. coli K-12 Optimization",
      narrative: "Enforcing strict translation kinetics (w_i ≥ 0.85, Table 11)",
      execute: () => setSelectedHostOrganism("ecoli"),
      dwell: 2200,
    },
    {
      target: "hkdf",
      label: "Engage HKDF PRNG Dispersion",
      narrative: "Permuting 64 carrier loci via RFC 5869 cryptographic salt",
      execute: () => setActiveEccEngine("hkdf"),
      dwell: 2000,
    },
    {
      target: "rs",
      label: "Switch to Reed-Solomon RS(16,8)",
      narrative: "Galois Field GF(2⁸) systematic parity protection (t = 4)",
      execute: () => setActiveEccEngine("rs"),
      dwell: 2000,
    },
    {
      target: "envelope",
      label: "Inspect Adaptiveness Trajectory",
      narrative: "Checking synonymous codon viability against the w_i = 0.85 threshold",
      execute: () => setSelectedDbTab("docs"),
      dwell: 2600,
    },
    {
      target: "vectors",
      label: "Return to Carrier Codon Ledger",
      narrative: "Opening synonymous substitution vectors table",
      execute: () => setSelectedDbTab("tables"),
      dwell: 1600,
    },
    {
      target: "row_loc28",
      label: "Verify Locus #28 (CTG → CTA, Leu)",
      narrative: "Inspecting 6-fold Leucine synonymous wobble at 84 bp",
      execute: () => setSelectedRow(1),
      dwell: 2400,
    },
    {
      target: "row_loc58",
      label: "Verify Locus #58 (GCG → GCA, Ala)",
      narrative: "Inspecting Alanine GC-neutral wobble transition at 174 bp",
      execute: () => setSelectedRow(3),
      dwell: 2400,
    },
    {
      target: "row_loc14",
      label: "Inspect Locus #14 (GAG → GAA, Glu)",
      narrative: "Verifying Glu (E) third wobble base synonymous invariance",
      execute: () => setSelectedRow(0),
      dwell: 2400,
    },
  ];

  // Move cursor to target and click
  const executeStep = useCallback((stepIdx: number) => {
    if (!containerRef.current) return;
    const action = actionsSequenceRef.current[stepIdx];
    if (!action) return;

    const targetEl = targetRefs.current[action.target];
    if (!targetEl) {
      // Element not rendered (e.g. inside hidden tab), advance to next step
      currentStepIndexRef.current = (stepIdx + 1) % actionsSequenceRef.current.length;
      animationTimerRef.current = setTimeout(() => {
        executeStep(currentStepIndexRef.current);
      }, 500);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    // Target center coordinates relative to container
    const x = targetRect.left - containerRect.left + targetRect.width / 2;
    const y = targetRect.top - containerRect.top + targetRect.height / 2;

    // Glide cursor to target
    setCursorPos({ x, y });
    setCursorLabel(action.label);
    setCursorVisible(true);

    // After glide finishes (600ms), perform the click gesture
    const clickTimer = setTimeout(() => {
      setIsClicking(true);
      triggerRippleAt(x, y);

      // Execute state change
      action.execute();

      // Release click
      const releaseTimer = setTimeout(() => {
        setIsClicking(false);
      }, 200);

      // Dwell on target so the user can inspect the resulting change
      const dwellTimer = setTimeout(() => {
        currentStepIndexRef.current = (stepIdx + 1) % actionsSequenceRef.current.length;
        executeStep(currentStepIndexRef.current);
      }, action.dwell);

      return () => {
        clearTimeout(releaseTimer);
        clearTimeout(dwellTimer);
      };
    }, 650);

    return () => clearTimeout(clickTimer);
  }, [triggerRippleAt]);

  // Main automated loop
  useEffect(() => {
    if (!isAutoDemoRunning || isUserHovering) {
      setCursorVisible(false);
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
      return;
    }

    // Start with a gentle 1.2s delay
    const initialDelay = setTimeout(() => {
      executeStep(currentStepIndexRef.current);
    }, 1200);

    return () => {
      clearTimeout(initialDelay);
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    };
  }, [isAutoDemoRunning, isUserHovering, executeStep]);

  // Handle user hover/interaction handover
  const handlePointerEnter = () => {
    setIsUserHovering(true);
    setCursorVisible(false);
    if (userInteractedTimeoutRef.current) clearTimeout(userInteractedTimeoutRef.current);
  };

  const handlePointerLeave = () => {
    // 3.5-second inactivity delay before resuming guided demonstration
    if (userInteractedTimeoutRef.current) clearTimeout(userInteractedTimeoutRef.current);
    userInteractedTimeoutRef.current = setTimeout(() => {
      setIsUserHovering(false);
    }, 3500);
  };

  return (
    <div
      ref={containerRef}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className="relative text-left"
    >
      {/* Animated Virtual Cursor */}
      <div
        className={`pointer-events-none absolute z-50 transition-opacity duration-300 ${
          cursorVisible && isAutoDemoRunning && !isUserHovering ? "opacity-100" : "opacity-0"
        }`}
        style={{
          transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`,
          transition: "transform 650ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease",
          left: 0,
          top: 0,
        }}
      >
        <div className="relative flex items-center">
          {/* OS Arrow Cursor */}
          <div
            className={`transition-transform duration-150 ${
              isClicking ? "scale-[0.80] translate-y-0.5" : "scale-100"
            }`}
          >
            <svg
              className="w-5 h-5 drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] filter"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M4 3L11 21L14 13L22 10L4 3Z"
                fill="#FFFFFF"
                stroke="#181822"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Action Context Tooltip Pill */}
          <div className="ml-2.5 px-2.5 py-1 rounded-full bg-[#161622]/95 border border-[#FF5500]/50 text-[10px] font-mono text-zinc-100 whitespace-nowrap shadow-[0_4px_20px_rgba(0,0,0,0.7)] flex items-center gap-1.5 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] animate-pulse" />
            <span className="font-semibold tracking-wide">{cursorLabel}</span>
          </div>
        </div>
      </div>

      {/* Click Ripple Indicator */}
      {clickRipple && (
        <span
          key={clickRipple.id}
          className="pointer-events-none absolute z-40 rounded-full border-2 border-[#FF5500] animate-ping"
          style={{
            left: clickRipple.x - 14,
            top: clickRipple.y - 14,
            width: 28,
            height: 28,
          }}
        />
      )}

      {/* Auto-Pilot Mode Ribbon Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/40 text-xs font-mono">
        <div className="flex items-center gap-2 text-zinc-400">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-zinc-200 font-semibold">Active Demonstration:</span>
          <span className="text-zinc-400 hidden sm:inline">
            Synonymous Codon Modulation &amp; Cryptographic Store
          </span>
        </div>

        <button
          onClick={() => setIsAutoDemoRunning((prev) => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all cursor-pointer ${
            isAutoDemoRunning
              ? "border-[#FF5500]/40 bg-[#FF5500]/10 text-primary hover:bg-[#FF5500]/20"
              : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground"
          }`}
          title={isAutoDemoRunning ? "Pause guided automation" : "Resume guided automation"}
        >
          {isAutoDemoRunning ? (
            <>
              <Pause className="w-3 h-3 text-[#FF5500]" />
              <span>Autopilot: Active</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              <span>Autopilot: Paused</span>
            </>
          )}
        </button>
      </div>

      {/* 2-Column Responsive Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ========================================================= */}
        {/* LEFT COLUMN (5 Cols): SYNONYMOUS CODON DEGENERACY         */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="p-5 rounded-xl border border-[#272733] bg-[#16161c] relative overflow-hidden flex flex-col justify-between h-full shadow-lg">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2 text-white font-bold text-lg">
                  <Dna className="w-5 h-5 text-primary" />
                  <span>Synonymous Codon Degeneracy</span>
                </div>

                {/* Host Organism Toggles */}
                <div className="flex items-center gap-1 bg-[#121218] p-0.5 rounded-lg border border-[#262633] text-[10px] font-mono">
                  <button
                    ref={registerTarget("ecoli")}
                    onClick={() => setSelectedHostOrganism("ecoli")}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer font-medium ${
                      selectedHostOrganism === "ecoli"
                        ? "bg-[#9A6849] text-white font-bold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    E. coli K-12
                  </button>

                  <button
                    ref={registerTarget("yeast")}
                    onClick={() => setSelectedHostOrganism("yeast")}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer font-medium ${
                      selectedHostOrganism === "yeast"
                        ? "bg-[#9A6849] text-white font-bold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Yeast
                  </button>

                  <button
                    onClick={() => setSelectedHostOrganism("human")}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer font-medium ${
                      selectedHostOrganism === "human"
                        ? "bg-[#9A6849] text-white font-bold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Human
                  </button>
                </div>
              </div>

              <p className="mt-2.5 text-xs text-zinc-400 leading-relaxed">
                Maps synonymous codon families while preserving host translation kinetics at {currentOrganism.metrics.caiThreshold}.
              </p>

              {/* Degenerate Families Distribution Display */}
              <div className="mt-4 p-4 rounded-xl border border-[#292936] bg-[#191921] space-y-3.5 shadow-inner">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-zinc-200">Host Codon Degeneracy Distribution</span>
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3 text-zinc-400" /> {currentOrganism.table}
                  </span>
                </div>

                {/* 6-fold, 4-fold, 2-fold Degeneracy Bars */}
                <div className="space-y-3 font-mono text-[11px]">
                  {/* 6-fold */}
                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#B96F43]" />
                        <span className="font-semibold text-white">6-fold Degenerate</span>
                        <span className="text-zinc-500">(Leu, Arg, Ser)</span>
                      </span>
                      <span className="text-[#C1845B] font-bold">
                        {currentOrganism.bars.sixFold.bits} • {currentOrganism.bars.sixFold.codons}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#121217] rounded-full overflow-hidden border border-[#262633]">
                      <div
                        className="h-full bg-[#B96F43] rounded-full transition-all duration-700 ease-out"
                        style={{ width: currentOrganism.bars.sixFold.width }}
                      />
                    </div>
                  </div>

                  {/* 4-fold */}
                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#83A8AA]" />
                        <span className="font-semibold text-white">4-fold Degenerate</span>
                        <span className="text-zinc-500">(Val, Ala, Thr, Pro, Gly)</span>
                      </span>
                      <span className="text-[#83A8AA] font-bold">
                        {currentOrganism.bars.fourFold.bits} • {currentOrganism.bars.fourFold.codons}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#121217] rounded-full overflow-hidden border border-[#262633]">
                      <div
                        className="h-full bg-[#66898B] rounded-full transition-all duration-700 ease-out"
                        style={{ width: currentOrganism.bars.fourFold.width }}
                      />
                    </div>
                  </div>

                  {/* 2-fold */}
                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#8FA59A]" />
                        <span className="font-semibold text-white">2-fold Degenerate</span>
                        <span className="text-zinc-500">(Glu, Asp, Lys, Gln, Asn)</span>
                      </span>
                      <span className="text-[#8FA59A] font-bold">
                        {currentOrganism.bars.twoFold.bits} • {currentOrganism.bars.twoFold.codons}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#121217] rounded-full overflow-hidden border border-[#262633]">
                      <div
                        className="h-full bg-[#668076] rounded-full transition-all duration-700 ease-out"
                        style={{ width: currentOrganism.bars.twoFold.width }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3 Real-time Statistics KPI Blocks */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#262633] text-center font-mono">
                  <div className="p-2 rounded bg-[#131318] border border-[#242430]">
                    <span className="text-[9px] text-zinc-500 block uppercase">Elongation Rate</span>
                    <span className="text-xs font-bold text-white mt-0.5 block transition-all">
                      {currentOrganism.metrics.elongation}
                    </span>
                    <span className="text-[9px] text-[#8FA59A]">{currentOrganism.metrics.elongationDelta}</span>
                  </div>
                  <div className="p-2 rounded bg-[#131318] border border-[#242430]">
                    <span className="text-[9px] text-zinc-500 block uppercase">Mean Host CAI</span>
                    <span className="text-xs font-bold text-primary mt-0.5 block transition-all">
                      {currentOrganism.metrics.meanCai}
                    </span>
                    <span className="text-[9px] text-[#8FA59A]">w_i ≥ 0.85</span>
                  </div>
                  <div className="p-2 rounded bg-[#131318] border border-[#242430]">
                    <span className="text-[9px] text-zinc-500 block uppercase">mRNA Fold ΔG</span>
                    <span className="text-xs font-bold text-white mt-0.5 block transition-all">
                      {currentOrganism.metrics.mrnaDeltaG}
                    </span>
                    <span className="text-[9px] text-[#8FA59A]">{currentOrganism.metrics.mrnaFoldNote}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invariance Footnote Banner */}
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                <span>Primary Amino Acid Preservation:</span>
              </span>
              <span className="text-foreground font-semibold">100% Invariant</span>
            </div>
          </div>

          {/* GENOMIC SEQUENCE VAULT CARD */}
          <div className="p-5 mt-6 rounded-xl border border-[#272733] bg-[#16161c] relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <HardDrive className="w-5 h-5 text-primary" />
                <span>Genomic Sequence Vault</span>
              </div>
              <span className="text-[10px] font-mono border border-primary/40 text-primary bg-primary/10 px-2 py-0.5 rounded">
                Biopython SeqIO
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Secure FASTA &amp; GenBank CDS ingestion with automated Open Reading Frame validation, in-frame guard checks, and Shannon steganographic capacity estimation.
            </p>

            <div className="mt-4 p-4 rounded-xl border border-[#292936] bg-[#191921] space-y-3.5 shadow-inner">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#252533] border border-[#333345] flex items-center justify-center text-zinc-400 relative overflow-hidden shrink-0">
                    <FileCode className="w-6 h-6 text-[#FF5500]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-zinc-200 block font-mono">pUC19_lacZ_CDS.fasta</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">3,075 bp • 1,025 Codons • Table 11</span>
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono text-zinc-400 bg-[#131318] border border-[#2a2a38] px-3 py-1.5 rounded-lg">
                  <span className="text-zinc-500 text-[9px] block">ORF Check</span>
                  <span className="text-[#8FA59A] text-xs font-bold">Length % 3 == 0</span>
                </div>
              </div>

              {/* Modulo-3 Open Reading Frame Track */}
              <div className="space-y-1.5 font-mono text-[10px]">
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-[#8FA59A] font-semibold">5&apos; ATG (Start #1)</span>
                  <span className="text-zinc-500">Reading Frame Modulo-3 Invariant</span>
                  <span className="text-primary font-semibold">3&apos; TAA (Stop #1,025)</span>
                </div>
                <div className="h-3 w-full bg-[#121218] rounded-md border border-[#292938] relative overflow-hidden flex items-center px-1">
                  <div className="h-1.5 w-full bg-[#657C72] rounded-sm opacity-80" />
                  <div className="absolute top-0 bottom-0 w-4 bg-white/40 blur-[1px] animate-[pulse_2s_infinite]" style={{ left: "45%" }} />
                </div>
              </div>

              {/* Capacity vs Payload Progress Meter */}
              <div className="pt-2 border-t border-[#262633] space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">Shannon Capacity Utilization:</span>
                  <span className="text-[#8FA59A] font-bold">128 / 246 Bits (52.0%)</span>
                </div>
                <div className="h-2 w-full bg-[#121217] rounded-full overflow-hidden border border-[#242430]">
                  <div className="h-full bg-[#B96F43] rounded-full" style={{ width: "52%" }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                  <span>Payload: 64b Nonce + 64b RS Parity</span>
                  <span className="text-[#8FA59A] font-semibold">118 Bits Headroom Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN (7 Cols): CRYPTOGRAPHIC CODEWORD STORE       */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="p-5 rounded-xl border border-[#272733] bg-[#16161c] flex flex-col justify-between h-full shadow-lg">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2 text-white font-bold text-lg">
                  <Database className="w-5 h-5 text-primary" />
                  <span>Cryptographic Codeword &amp; Provenance Store</span>
                </div>
                <Link href="/analysis" className="text-zinc-500 hover:text-primary transition-colors">
                  <ArrowRight className="w-4 h-4 -rotate-45" />
                </Link>
              </div>

              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Stores Galois Field GF(2⁸) Reed-Solomon RS(16,8) parity symbols, HKDF keyed carrier permutations, and immutable SHA-256 construct digests.
              </p>

              {/* Cryptographic Engine Switchers */}
              <div className="grid grid-cols-2 gap-3 mt-4 font-mono">
                <button
                  ref={registerTarget("rs")}
                  onClick={() => setActiveEccEngine("rs")}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    activeEccEngine === "rs"
                      ? "border-primary bg-[#1d1b1b] text-white shadow-[0_0_15px_rgba(255,85,0,0.15)]"
                      : "border-[#272733] bg-[#191922] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold text-[#FF5500]">RS</span>
                    <div>
                      <div className="text-xs font-semibold text-white">Reed-Solomon RS(16,8)</div>
                      <div className="text-[10px] text-zinc-400">8 Data + 8 Parity Bytes</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 font-bold">
                    t = 4
                  </span>
                </button>

                <button
                  ref={registerTarget("hkdf")}
                  onClick={() => setActiveEccEngine("hkdf")}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    activeEccEngine === "hkdf"
                      ? "border-primary bg-[#1d1b1b] text-white shadow-[0_0_15px_rgba(255,85,0,0.15)]"
                      : "border-[#272733] bg-[#191922] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold text-[#8FA59A]">HKDF</span>
                    <div>
                      <div className="text-xs font-semibold text-white">Keyed PRNG Dispersion</div>
                      <div className="text-[10px] text-zinc-400">RFC 5869 Cryptographic Salt</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#8FA59A]/10 text-[#8FA59A] border border-[#8FA59A]/30 font-bold">
                    64 Loci
                  </span>
                </button>
              </div>

              {/* Format Tabs Bar */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
                  ACTIVE RECOVERY TELEMETRY
                </span>

                <div className="inline-flex rounded-lg border border-[#2b2b38] bg-[#191922] p-1 font-mono">
                  <button
                    ref={registerTarget("vectors")}
                    onClick={() => setSelectedDbTab("tables")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      selectedDbTab === "tables"
                        ? "bg-[#272733] text-white font-semibold shadow-sm border border-zinc-600/50"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Carrier Codon Vectors</span>
                  </button>

                  <button
                    ref={registerTarget("envelope")}
                    onClick={() => setSelectedDbTab("docs")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      selectedDbTab === "docs"
                        ? "bg-[#272733] text-white font-semibold shadow-sm border border-zinc-600/50"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Adaptiveness Envelope</span>
                  </button>

                  <button
                    onClick={() => setSelectedDbTab("vectors")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      selectedDbTab === "vectors"
                        ? "bg-[#272733] text-white font-semibold shadow-sm border border-zinc-600/50"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Pairwise k-mer MMD</span>
                  </button>
                </div>
              </div>

              {/* Tab Content Box */}
              <div className="mt-3.5 rounded-xl border border-[#272735] bg-[#141419] overflow-hidden text-xs">
                {/* Query Header */}
                <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#23232d] bg-[#171720] font-mono text-[11px]">
                  <span className="text-zinc-300 font-semibold">lacZ_cds / synonymous_carrier_loci</span>
                  <span className="text-primary font-bold">64 active carrier loci</span>
                </div>

                <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-[#23232d] bg-[#15151c] font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-semibold">Query</span>
                    <span className="text-zinc-400">.</span>
                    <span className="text-[#8FA59A]">filter</span>
                    <span className="text-zinc-500">(</span>
                    <span className="text-[#A9B9AD]">&quot;wi&quot;</span>
                    <span className="text-zinc-500">,</span>
                    <span className="text-[#A9B9AD]">&quot;&gt;= 0.85&quot;</span>
                    <span className="text-zinc-500">)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                    <span>64 Active Carrier Loci</span>
                  </div>
                </div>

                {/* TAB 1: CARRIER CODON VECTORS TABLE */}
                {selectedDbTab === "tables" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead className="border-b border-[#23232d] text-zinc-500 bg-[#16161e]">
                        <tr>
                          <th className="p-2 w-8 text-center">
                            <span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" />
                          </th>
                          <th className="p-2 font-medium"># Locus</th>
                          <th className="p-2 font-medium">Gene Position</th>
                          <th className="p-2 font-medium">Codon Substitution</th>
                          <th className="p-2 font-medium">Residue</th>
                          <th className="p-2 font-medium text-center">GF(2⁸) Symbol</th>
                          <th className="p-2 font-medium text-right pr-3">Adaptiveness (w_i)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#23232d] text-zinc-300">
                        {CARRIER_LOCI_SAMPLE.map((row, idx) => {
                          const isCurrent = selectedRow === idx;
                          const targetKey: TargetKey | null =
                            idx === 0 ? "row_loc14" : idx === 1 ? "row_loc28" : idx === 3 ? "row_loc58" : null;

                          return (
                            <tr
                              key={row.id}
                              ref={targetKey ? registerTarget(targetKey) : undefined}
                              onClick={() => setSelectedRow(idx)}
                              className={`cursor-pointer transition-colors ${
                                isCurrent
                                  ? "bg-[#252535] text-white shadow-inner"
                                  : "hover:bg-[#1a1a23]"
                              }`}
                            >
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={isCurrent}
                                  onChange={() => setSelectedRow(idx)}
                                  className="rounded accent-[#FF5500] cursor-pointer"
                                />
                              </td>
                              <td className="p-2 text-zinc-400 font-mono">
                                <span className={isCurrent ? "text-primary font-bold" : ""}>{row.id}</span>
                              </td>
                              <td className="p-2 font-semibold text-white font-sans">{row.gene}</td>
                              <td className="p-2 text-primary font-bold flex items-center gap-1.5">
                                <span>{row.mutation}</span>
                                {isCurrent && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                                )}
                              </td>
                              <td className="p-2 text-zinc-400">{row.residue}</td>
                              <td className="p-2 text-center">
                                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 text-[10px] font-bold">
                                  {row.rs}
                                </span>
                              </td>
                              <td className="p-2 text-right pr-3 font-medium text-zinc-300">
                                {row.wi.toFixed(3)}{" "}
                                <span className="text-[10px] text-[#8FA59A]">({row.deltaCai})</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 2: ADAPTIVENESS ENVELOPE */}
                {selectedDbTab === "docs" && (
                  <div className="p-4 space-y-3 font-mono animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <span className="w-2.5 h-0.5 bg-zinc-400" />
                          <span>Wildtype Codon Profile</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-[#FF5500] font-semibold">
                          <span className="w-2.5 h-0.5 bg-[#FF5500]" />
                          <span>Watermarked Construct Profile</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-300 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                        Mean CAI = {currentOrganism.metrics.meanCai}
                      </span>
                    </div>

                    <div className="relative h-32 w-full overflow-hidden bg-[#0e0e13] rounded-lg border border-[#21212b] p-2">
                      <svg viewBox="0 0 500 100" preserveAspectRatio="none" className="w-full h-full select-none">
                        <line x1="0" y1="85" x2="500" y2="85" stroke="#262633" strokeWidth="1" />
                        <line x1="0" y1="20" x2="500" y2="20" stroke="#1d1d26" strokeWidth="0.8" strokeDasharray="2 2" />
                        <line x1="0" y1="50" x2="500" y2="50" stroke="#1d1d26" strokeWidth="0.8" strokeDasharray="2 2" />

                        {/* Safety Limit Threshold w_i = 0.85 */}
                        <line x1="0" y1="35" x2="500" y2="35" stroke="#71717a" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
                        <text x="10" y="32" fill="#a1a1aa" fontSize="9" fontFamily="monospace">
                          Safety Limit w_i = 0.85
                        </text>

                        {/* Watermarked Trajectory with animate pulse */}
                        <path
                          d="M 10 25 Q 70 20 130 28 T 250 22 T 370 26 T 490 24"
                          fill="none"
                          stroke="#FF5500"
                          strokeWidth="2.2"
                        />
                        <path
                          d="M 10 25 Q 70 20 130 28 T 250 22 T 370 26 T 490 24 L 490 85 L 10 85 Z"
                          fill="#FF5500"
                          fillOpacity="0.08"
                        />

                        {/* Wildtype Comparison Trajectory */}
                        <path
                          d="M 10 26 Q 70 24 130 25 T 250 24 T 370 23 T 490 25"
                          fill="none"
                          stroke="#a1a1aa"
                          strokeWidth="1.2"
                          strokeDasharray="3 3"
                          opacity="0.65"
                        />
                      </svg>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                      <span>Codon #1 (Start)</span>
                      <span className="text-[#FF5500] font-semibold">Min Observed w_i = 0.954 (Safe &gt; 0.85)</span>
                      <span>Codon #1,025 (Stop)</span>
                    </div>
                  </div>
                )}

                {/* TAB 3: PAIRWISE K-MER MMD */}
                {selectedDbTab === "vectors" && (
                  <div className="p-3.5 space-y-2.5 font-mono animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-300 font-semibold">Pairwise k-mer MMD Divergence Distance</span>
                      <span className="text-[10px] text-zinc-300 font-mono">p = 0.94 (Uniform)</span>
                    </div>

                    <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                      <div className="p-1.5 text-zinc-500 font-bold">Construct</div>
                      <div className="p-1.5 text-zinc-400 font-bold">Wildtype</div>
                      <div className="p-1.5 text-zinc-400 font-bold">Stamped</div>
                      <div className="p-1.5 text-zinc-400 font-bold">WGAN Ref</div>
                      <div className="p-1.5 text-zinc-400 font-bold">Naive Tag</div>

                      <div className="p-1.5 text-zinc-400 font-bold text-left">Wildtype</div>
                      <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500">0.000</div>
                      <div className="p-1.5 rounded bg-[#1c120c] text-orange-300">0.002</div>
                      <div className="p-1.5 rounded bg-[#291408] text-orange-200">0.001</div>
                      <div className="p-1.5 rounded bg-[#3d1805] text-[#FF5500] font-bold">0.820</div>

                      <div className="p-1.5 text-zinc-400 font-bold text-left">Stamped</div>
                      <div className="p-1.5 rounded bg-[#1c120c] text-orange-300">0.002</div>
                      <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500">0.000</div>
                      <div className="p-1.5 rounded bg-[#1c120c] text-orange-300">0.001</div>
                      <div className="p-1.5 rounded bg-[#3d1805] text-[#FF5500] font-bold">0.818</div>
                    </div>
                  </div>
                )}
              </div>

              {/* LIVE ACTIVE LOCUS DIAGNOSTIC CARD */}
              <div className="mt-3.5 p-3 rounded-lg border border-border/80 bg-[#121217] text-xs font-mono transition-all">
                <div className="flex items-center justify-between text-[11px] pb-1 border-b border-border/40">
                  <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    Inspected Carrier Codon: <strong className="text-white">{activeLocus.id}</strong> ({activeLocus.gene})
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 text-[10px] font-bold">
                    RS: {activeLocus.rs}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
                  <div>
                    <span>Substitution: </span>
                    <strong className="text-primary font-bold">{activeLocus.mutation}</strong>
                    <span className="text-zinc-400"> ({activeLocus.residue})</span>
                  </div>
                  <div>
                    <span>Adaptiveness: </span>
                    <strong className="text-zinc-200">{activeLocus.wi.toFixed(3)}</strong>
                    <span className="text-[#8FA59A]"> ({activeLocus.deltaCai})</span>
                  </div>
                  <div className="text-zinc-400">
                    <span>Biophysics: </span>
                    <span className="text-zinc-300">{activeLocus.mechanism}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Security Signature Hash */}
            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-zinc-400" />
                SHA-256 Digest: 8f4c92...3e1b7a
              </span>
              <span className="text-zinc-300 font-medium">ECDSA P-256 Provenance Ledger Valid</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
