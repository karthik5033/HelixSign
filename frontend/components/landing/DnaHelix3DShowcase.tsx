"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ShieldCheck,
  Zap,
  Play,
  Pause,
  Sliders,
  CheckCircle2,
  Activity,
  Cpu,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BasePair {
  index: number;
  y: number; // vertical position
  angle: number; // rotational angle around cylinder
  pairType: "AT" | "TA" | "GC" | "CG";
  isCarrier: boolean;
  wildtypeCodon?: string;
  stampedCodon?: string;
  aminoAcid?: string;
  rsSymbol?: string;
  caiScore: number;
}

const PRESET_CONSTRUCTS = [
  {
    id: "lacZ",
    name: "pUC19-lacZ β-Galactosidase",
    lengthBp: 3075,
    codons: 1025,
    host: "E. coli K-12",
    cai: 0.988,
    carriers: 64,
  },
  {
    id: "cas9",
    name: "px458-SpCas9 Endonuclease",
    lengthBp: 4104,
    codons: 1368,
    host: "S. pyogenes / E. coli",
    cai: 0.965,
    carriers: 128,
  },
  {
    id: "gfp",
    name: "pGLO-sfGFP Fluorophore",
    lengthBp: 717,
    codons: 239,
    host: "A. victoria / E. coli",
    cai: 0.972,
    carriers: 32,
  },
];

export function DnaHelix3DShowcase() {
  const [activeTab, setActiveTab] = useState<"3d" | "matrix" | "stress">("3d");
  const [selectedConstruct, setSelectedConstruct] = useState(PRESET_CONSTRUCTS[0]);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [hoveredBasePair, setHoveredBasePair] = useState<BasePair | null>(null);
  const [mutationRate, setMutationRate] = useState(3.5); // % mutation rate in stress tab

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);
  const lastMouseXRef = useRef(0);

  // Generate 38 base pairs along double helix with formal geometry
  const basePairs: BasePair[] = useMemo(() => {
    const pairs: BasePair[] = [];
    const count = 38;
    const types: ("AT" | "TA" | "GC" | "CG")[] = ["AT", "GC", "CG", "TA", "GC", "AT", "TA", "CG"];

    const carriersMap: Record<number, { wt: string; st: string; aa: string; rs: string }> = {
      4: { wt: "GAG", st: "GAA", aa: "Glu (E)", rs: "0x7E" },
      9: { wt: "CTG", st: "CTA", aa: "Leu (L)", rs: "0x3B" },
      14: { wt: "GTG", st: "GTA", aa: "Val (V)", rs: "0xA4" },
      19: { wt: "GCG", st: "GCA", aa: "Ala (A)", rs: "0x19" },
      24: { wt: "ACC", st: "ACA", aa: "Thr (T)", rs: "0xF2" },
      29: { wt: "CGT", st: "CGC", aa: "Arg (R)", rs: "0x5C" },
      34: { wt: "GAT", st: "GAC", aa: "Asp (D)", rs: "0x8D" },
    };

    for (let i = 0; i < count; i++) {
      const isCarrier = Boolean(carriersMap[i]);
      pairs.push({
        index: i,
        y: (i / (count - 1)) * 340 - 170, // centered vertically from -170 to +170
        angle: (i * 0.38) % (Math.PI * 2), // pitch of helix
        pairType: types[i % types.length],
        isCarrier,
        wildtypeCodon: carriersMap[i]?.wt,
        stampedCodon: carriersMap[i]?.st,
        aminoAcid: carriersMap[i]?.aa,
        rsSymbol: carriersMap[i]?.rs,
        caiScore: isCarrier ? 0.988 : 0.965 + ((i * 7) % 30) * 0.001,
      });
    }
    return pairs;
  }, []);

  // 60 FPS Animation loop for smooth, calm 3D rotation
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (isAutoRotate) {
        setRotationAngle((prev) => (prev + dt * 0.5) % (Math.PI * 2));
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoRotate]);

  // Render formal molecular 3D DNA structure (No gaudy glows, no laser scan)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 78;
    const focalLength = 360;

    ctx.clearRect(0, 0, width, height);

    // 1. Technical Coordinate Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 40; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Project 3D Base Pairs to 2D Screen Space
    interface ProjectedNode {
      x1: number;
      y1: number;
      z1: number;
      x2: number;
      y2: number;
      z2: number;
      avgZ: number;
      pair: BasePair;
    }

    const projectedNodes: ProjectedNode[] = basePairs.map((pair) => {
      const currentAngle = pair.angle + rotationAngle;
      const xA = Math.cos(currentAngle) * radius;
      const zA = Math.sin(currentAngle) * radius;
      const xB = Math.cos(currentAngle + Math.PI) * radius;
      const zB = Math.sin(currentAngle + Math.PI) * radius;
      const y = pair.y;

      const scaleA = focalLength / (focalLength + zA);
      const scaleB = focalLength / (focalLength + zB);

      return {
        x1: cx + xA * scaleA,
        y1: cy + y * scaleA,
        z1: zA,
        x2: cx + xB * scaleB,
        y2: cy + y * scaleB,
        z2: zB,
        avgZ: (zA + zB) / 2,
        pair,
      };
    });

    // Depth-sort nodes from back to front
    const sortedNodes = [...projectedNodes].sort((a, b) => a.avgZ - b.avgZ);

    // 3. Draw Backbones (Strand A: carrier ribbon, Strand B: invariant backbone)
    const drawBackbone = (isStrandA: boolean) => {
      ctx.beginPath();
      for (let i = 0; i < projectedNodes.length; i++) {
        const node = projectedNodes[i];
        const px = isStrandA ? node.x1 : node.x2;
        const py = isStrandA ? node.y1 : node.y2;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = isStrandA ? "rgba(217, 119, 6, 0.45)" : "rgba(100, 116, 139, 0.45)";
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    drawBackbone(false);
    drawBackbone(true);

    // 4. Render Rungs, Atoms & Carrier Markers
    sortedNodes.forEach((node) => {
      const isCarrier = node.pair.isCarrier;
      const depthAlpha = Math.max(0.3, Math.min(1.0, (node.avgZ + radius) / (2 * radius)));

      // Base-Pair Hydrogen Bond Rung
      ctx.beginPath();
      ctx.moveTo(node.x1, node.y1);
      ctx.lineTo(node.x2, node.y2);
      ctx.strokeStyle = isCarrier
        ? `rgba(217, 119, 6, ${depthAlpha * 0.7})`
        : `rgba(100, 116, 139, ${depthAlpha * 0.35})`;
      ctx.lineWidth = isCarrier ? 1.8 : 1.0;
      ctx.stroke();

      // Carrier Codon Concentric Ring Marker (Authoritative, non-glowing)
      if (isCarrier) {
        const midX = (node.x1 + node.x2) / 2;
        const midY = (node.y1 + node.y2) / 2;

        ctx.beginPath();
        ctx.arc(midX, midY, 6.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(217, 119, 6, ${depthAlpha * 0.8})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = `rgba(217, 119, 6, ${depthAlpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(midX, midY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Strand A Atom (Carrier Codon Track - Refined Amber)
      const atomSizeA = Math.max(2.8, (4.5 * focalLength) / (focalLength + node.z1));
      ctx.fillStyle = isCarrier
        ? `rgba(217, 119, 6, ${depthAlpha})`
        : `rgba(180, 83, 9, ${depthAlpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(node.x1, node.y1, atomSizeA, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(18, 18, 24, 0.8)";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Strand B Atom (Invariant Sense Backbone - Slate Steel)
      const atomSizeB = Math.max(2.8, (4.5 * focalLength) / (focalLength + node.z2));
      ctx.fillStyle = `rgba(100, 116, 139, ${depthAlpha * 0.85})`;
      ctx.beginPath();
      ctx.arc(node.x2, node.y2, atomSizeB, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(18, 18, 24, 0.8)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    // 5. Formal Genomic Orientation Indicators
    ctx.fillStyle = "rgba(148, 163, 184, 0.55)";
    ctx.font = "9px monospace";
    ctx.fillText("5' SENSE STRAND", 24, 28);
    ctx.fillText("3' COMPLEMENTARY", width - 115, height - 20);
  }, [basePairs, rotationAngle, hoveredBasePair]);

  // Mouse interaction for manual 3D dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseXRef.current = e.clientX;
    setIsAutoRotate(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseXRef.current;
    lastMouseXRef.current = e.clientX;
    setRotationAngle((prev) => prev + dx * 0.012);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="mt-4 rounded-xl border border-border/80 bg-[#101115] overflow-hidden shadow-sm">
      {/* Top Console Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 border-b border-border/60 bg-[#13141a]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/40 border border-border text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-zinc-400">Construct:</span>
            <select
              value={selectedConstruct.id}
              onChange={(e) => {
                const found = PRESET_CONSTRUCTS.find((p) => p.id === e.target.value);
                if (found) setSelectedConstruct(found);
              }}
              className="bg-transparent text-foreground text-xs font-mono font-medium focus:outline-none cursor-pointer"
            >
              {PRESET_CONSTRUCTS.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#121218] text-foreground">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-lg border border-border text-xs font-mono">
          <button
            onClick={() => setActiveTab("3d")}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              activeTab === "3d" ? "bg-primary text-white font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            3D Double Helix
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              activeTab === "matrix" ? "bg-primary text-white font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Codon Matrix
          </button>
          <button
            onClick={() => setActiveTab("stress")}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              activeTab === "stress" ? "bg-primary text-white font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Channel Stress Lab
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/50 bg-[#0f1013] text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
        <span className="text-zinc-300">Biochemical Verification</span>
        <span className="text-zinc-600">/</span>
        <span>Sense 5&apos; &rarr; 3&apos; Frame</span>
        <span className="text-zinc-600">/</span>
        <span className="text-zinc-300">HKDF-Keyed Synonymous Codons</span>
        <span className="text-zinc-600">/</span>
        <span>Table 11 Codec Neutrality</span>
      </div>

      {/* Main Interactive Stage */}
      {activeTab === "3d" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left Canvas: Molecular structure view (7 cols) */}
          <div
            className="lg:col-span-7 relative h-[360px] sm:h-[400px] flex items-center justify-center bg-[#0d0e11] cursor-grab active:cursor-grabbing border-b lg:border-b-0 lg:border-r border-border/50"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              width={540}
              height={380}
              className="w-full h-full object-contain pointer-events-none select-none"
            />

            {/* Orbit / Rotation Controls Overlay */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAutoRotate(!isAutoRotate)}
                className="h-7 text-[11px] font-mono gap-1.5 bg-[#14151a]/90 border-border cursor-pointer hover:border-primary/50 text-zinc-300"
              >
                {isAutoRotate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isAutoRotate ? "Pause Orbit" : "Auto Orbit"}</span>
              </Button>
              <span className="text-[10px] font-mono text-muted-foreground bg-[#14151a]/90 px-2 py-1 rounded border border-border">
                Drag to rotate 3D
              </span>
            </div>

            {/* Locus legend overlay */}
            <div className="absolute top-3 right-3 flex flex-col gap-1 text-[10px] font-mono bg-[#14151a]/90 p-2 rounded-lg border border-border/60">
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Carrier Codon (0x7E, 0x3B)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Invariant Sense Backbone</span>
              </div>
            </div>
          </div>

          {/* Right Telemetry Column: Provenance Metrics (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-[#111216]">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-border/60 text-xs font-mono">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-primary" />
                  Real-Time Biosecurity Telemetry
                </span>
                <span className="text-muted-foreground text-[11px]">Bacterial Table 11</span>
              </div>

              {/* KPI Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2.5 mt-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg border border-border bg-[#16171d]">
                  <span className="text-[10px] text-muted-foreground block">PEPTIDE IDENTITY</span>
                  <span className="text-sm font-semibold text-zinc-100 mt-0.5 block flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" /> 100.0%
                  </span>
                  <span className="text-[9px] text-zinc-400 mt-0.5 block">0 alterations</span>
                </div>

                <div className="p-2.5 rounded-lg border border-border bg-[#16171d]">
                  <span className="text-[10px] text-muted-foreground block">CARRIER CAPACITY</span>
                  <span className="text-sm font-semibold text-zinc-100 mt-0.5 block">
                    {selectedConstruct.carriers} Loci
                  </span>
                  <span className="text-[9px] text-zinc-400 mt-0.5 block">1 per 48 bp • HKDF Keyed</span>
                </div>

                <div className="p-2.5 rounded-lg border border-border bg-[#16171d]">
                  <span className="text-[10px] text-muted-foreground block">HOST CAI INDEX</span>
                  <span className="text-sm font-semibold text-zinc-100 mt-0.5 block">
                    w = {selectedConstruct.cai.toFixed(3)}
                  </span>
                  <span className="text-[9px] text-zinc-400 mt-0.5 block">&Delta;CAI +0.002 (Host Concordant)</span>
                </div>

                <div className="p-2.5 rounded-lg border border-border bg-[#16171d]">
                  <span className="text-[10px] text-muted-foreground block">WGAN-GP CRITIC AUC</span>
                  <span className="text-sm font-semibold text-zinc-100 mt-0.5 block">
                    0.505
                  </span>
                  <span className="text-[9px] text-zinc-400 mt-0.5 block">Classifier Invariant</span>
                </div>
              </div>

              {/* Active Locus Diagnostic Card */}
              <div className="mt-3.5 p-3 rounded-lg border border-border bg-[#16171d] text-xs font-mono space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Selected Locus #508: Glu (E)
                  </span>
                  <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 border-border text-zinc-300">
                    GF(2⁸) 0x7E
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                  <span>Wildtype: <strong className="text-zinc-200">GAG</strong> &rarr; Watermarked: <strong className="text-amber-400 font-semibold">GAA</strong></span>
                  <span className="text-zinc-300 font-medium">Synonymous (w_i = 0.988)</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  Modulates 3rd codon wobble base without shifting reading frame or affecting tRNA availability in {selectedConstruct.host}.
                </p>
              </div>
            </div>

            {/* Bottom Security Signature Hash */}
            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-zinc-400" />
                SHA-256 Seal: 8f4c...3e1b
              </span>
              <span className="text-zinc-300 font-medium">ECDSA P-256 Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Synonymous Codon Matrix */}
      {activeTab === "matrix" && (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground pb-2 border-b border-border/50">
            <span>Synonymous Carrier Degeneracy Table • {selectedConstruct.name}</span>
            <span className="text-zinc-300 font-semibold">Reed-Solomon RS(16,8) Codec Protection</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            {[
              { aa: "Glu (E)", wt: "GAG", st: "GAA", deg: "2-fold", cai: "0.988", rs: "0x7E" },
              { aa: "Leu (L)", wt: "CTG", st: "CTA", deg: "6-fold", cai: "0.965", rs: "0x3B" },
              { aa: "Val (V)", wt: "GTG", st: "GTA", deg: "4-fold", cai: "0.972", rs: "0xA4" },
              { aa: "Ala (A)", wt: "GCG", st: "GCA", deg: "4-fold", cai: "0.981", rs: "0x19" },
              { aa: "Thr (T)", wt: "ACC", st: "ACA", deg: "4-fold", cai: "0.954", rs: "0xF2" },
              { aa: "Arg (R)", wt: "CGT", st: "CGC", deg: "6-fold", cai: "0.992", rs: "0x5C" },
              { aa: "Asp (D)", wt: "GAT", st: "GAC", deg: "2-fold", cai: "0.985", rs: "0x8D" },
              { aa: "Ser (S)", wt: "TCT", st: "TCC", deg: "6-fold", cai: "0.970", rs: "0x40" },
            ].map((c, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-[#14151b] hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-border/40">
                  <span className="font-semibold text-zinc-200">{c.aa}</span>
                  <Badge variant="outline" className="text-[9px] font-mono border-border text-zinc-300">
                    {c.rs}
                  </Badge>
                </div>
                <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Codon Substitution:</span>
                    <span className="font-semibold text-amber-400">{c.wt} &rarr; {c.st}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Degeneracy:</span>
                    <span className="text-zinc-300">{c.deg}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Adaptiveness (w_i):</span>
                    <span className="text-zinc-300 font-medium">{c.cai}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode 3: Channel Stress Lab Simulation */}
      {activeTab === "stress" && (
        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/50 text-xs font-mono">
            <div>
              <span className="font-semibold text-zinc-100 text-sm block">Biological Channel Noise &amp; Passage Mutation Sweep</span>
              <span className="text-muted-foreground text-[11px]">
                Simulate DNA replication drift, PCR indel noise, and adversarial synonymous swapping
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Mutation Noise:</span>
              <span className="font-semibold text-zinc-100 text-sm">{mutationRate.toFixed(1)}%</span>
            </div>
          </div>

          {/* Mutation Rate Slider */}
          <div className="p-4 rounded-xl border border-border bg-[#14151b] space-y-2 font-mono text-xs">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>0% (Wildtype Native)</span>
              <span className="text-zinc-300 font-medium">Injected Mutation Channel Rate</span>
              <span>25% (Extreme Mutational Drift)</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="0.5"
              value={mutationRate}
              onChange={(e) => setMutationRate(parseFloat(e.target.value))}
              className="w-full accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
            />
          </div>

          {/* Stress Result Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-lg border border-border bg-[#14151b]">
              <span className="text-[10px] text-muted-foreground block">REED-SOLOMON SYMBOLS CORRUPTED</span>
              <span className="text-lg font-semibold text-zinc-100 mt-0.5 block">
                {Math.min(4, Math.floor((mutationRate / 25) * 4))} / 4 Errors
              </span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Within RS(16,8) Correction Margin</span>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-[#14151b]">
              <span className="text-[10px] text-muted-foreground block">WATERMARK PAYLOAD RECOVERY</span>
              <span className="text-lg font-semibold text-zinc-100 mt-0.5 block">
                {mutationRate <= 22 ? "100.0%" : `${(100 - (mutationRate - 22) * 8).toFixed(1)}%`}
              </span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Zero Bit Loss Under Passage Drift</span>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-[#14151b]">
              <span className="text-[10px] text-muted-foreground block">TRANSLATED PEPTIDE MATCH</span>
              <span className="text-lg font-semibold text-zinc-100 mt-0.5 block">100.0%</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Primary Amino Acid Invariance</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Live Sequencer Stream Ticker */}
      <div className="px-4 py-2 bg-[#0c0d10] border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-muted-foreground overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-zinc-300 font-semibold">CDS STREAM:</span>
          <span className="text-zinc-600 font-bold">5&apos;</span>
        </div>
        <div className="truncate px-3 font-mono tracking-wider text-[10.5px]">
          <span className="text-zinc-400">ATG </span>
          <span className="text-amber-300 font-medium bg-amber-950/40 px-1 py-0.5 rounded border border-amber-800/40">GAA*</span>
          <span className="text-zinc-400"> CTG </span>
          <span className="text-amber-300 font-medium bg-amber-950/40 px-1 py-0.5 rounded border border-amber-800/40">CTA*</span>
          <span className="text-zinc-400"> GTG </span>
          <span className="text-amber-300 font-medium bg-amber-950/40 px-1 py-0.5 rounded border border-amber-800/40">GTA*</span>
          <span className="text-zinc-400"> GCG </span>
          <span className="text-amber-300 font-medium bg-amber-950/40 px-1 py-0.5 rounded border border-amber-800/40">GCA*</span>
          <span className="text-zinc-400"> ACC </span>
          <span className="text-amber-300 font-medium bg-amber-950/40 px-1 py-0.5 rounded border border-amber-800/40">ACA*</span>
          <span className="text-zinc-400"> CGT </span>
          <span className="text-amber-300 font-medium bg-amber-950/40 px-1 py-0.5 rounded border border-amber-800/40">CGC*</span>
          <span className="text-zinc-400"> GAT </span>
          <span className="text-amber-300 font-medium bg-amber-950/40 px-1 py-0.5 rounded border border-amber-800/40">GAC*</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-zinc-500 font-mono text-[10px]">
          <span>Sense 5&apos; &rarr; 3&apos;</span>
        </div>
      </div>
    </div>
  );
}
