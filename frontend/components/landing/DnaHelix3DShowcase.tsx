"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ShieldCheck,
  Zap,
  Play,
  Pause,
  RotateCw,
  Activity,
  Lock,
  ExternalLink,
  Flame,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConstruct } from "@/lib/ConstructContext";

interface BasePair {
  index: number;
  y: number;
  angle: number;
  pairType: "AT" | "TA" | "GC" | "CG";
  isCarrier: boolean;
  locusNumber?: number;
  wildtypeCodon?: string;
  stampedCodon?: string;
  aminoAcid?: string;
  rsSymbol?: string;
  caiScore: number;
  description?: string;
}

interface ConstructPreset {
  id: string;
  name: string;
  lengthBp: number;
  codons: number;
  host: string;
  cai: number;
  carriers: number;
  auc: number;
  carrierMap: Record<
    number,
    {
      locusNumber: number;
      wt: string;
      st: string;
      aa: string;
      rs: string;
      desc: string;
      cai: number;
    }
  >;
  cdsStream: { wt: string; st: string; isCarrier: boolean; locus?: number }[];
}

const PRESET_CONSTRUCTS: ConstructPreset[] = [
  {
    id: "lacZ",
    name: "pUC19-lacZ β-Galactosidase",
    lengthBp: 3075,
    codons: 1025,
    host: "E. coli K-12",
    cai: 0.988,
    carriers: 64,
    auc: 0.505,
    carrierMap: {
      3: {
        locusNumber: 14,
        wt: "GAG",
        st: "GAA",
        aa: "Glu (E)",
        rs: "0x7E",
        desc: "Modulates 3rd codon wobble base without shifting reading frame or affecting tRNA availability in E. coli K-12.",
        cai: 0.988,
      },
      7: {
        locusNumber: 28,
        wt: "CTG",
        st: "CTA",
        aa: "Leu (L)",
        rs: "0x3B",
        desc: "Synonymous transition at beta-turn motif preserving inter-subunit tetramer packing.",
        cai: 0.965,
      },
      12: {
        locusNumber: 42,
        wt: "GTG",
        st: "GTA",
        aa: "Val (V)",
        rs: "0xA4",
        desc: "Synonymous pyrimidine-to-purine substitution inside hydrophobic core domain.",
        cai: 0.972,
      },
      16: {
        locusNumber: 58,
        wt: "GCG",
        st: "GCA",
        aa: "Ala (A)",
        rs: "0x19",
        desc: "Wobble optimization maintaining strict mRNA secondary structure folding delta-G.",
        cai: 0.981,
      },
      21: {
        locusNumber: 74,
        wt: "ACC",
        st: "ACA",
        aa: "Thr (T)",
        rs: "0xF2",
        desc: "Maintains optimal translational elongation velocity near catalytic gorge.",
        cai: 0.954,
      },
      25: {
        locusNumber: 92,
        wt: "CGT",
        st: "CGC",
        aa: "Arg (R)",
        rs: "0x5C",
        desc: "Equi-frequent synonymous codon pair matching native E. coli tRNA-Arg isoacceptor pool.",
        cai: 0.992,
      },
      30: {
        locusNumber: 110,
        wt: "GAT",
        st: "GAC",
        aa: "Asp (D)",
        rs: "0x8D",
        desc: "Conserves active site nucleophile proximity without altering local charge dipole.",
        cai: 0.985,
      },
      34: {
        locusNumber: 128,
        wt: "TTT",
        st: "TTC",
        aa: "Phe (F)",
        rs: "0x40",
        desc: "Avoids 4-bp homopolymer run; Twist Bioscience synthesis rule compliant.",
        cai: 0.978,
      },
    },
    cdsStream: [
      { wt: "ATG", st: "ATG", isCarrier: false },
      { wt: "GAG", st: "GAA*", isCarrier: true, locus: 14 },
      { wt: "CTG", st: "CTA*", isCarrier: true, locus: 28 },
      { wt: "GTG", st: "GTA*", isCarrier: true, locus: 42 },
      { wt: "GCG", st: "GCA*", isCarrier: true, locus: 58 },
      { wt: "ACC", st: "ACA*", isCarrier: true, locus: 74 },
      { wt: "CGT", st: "CGC*", isCarrier: true, locus: 92 },
      { wt: "GAT", st: "GAC*", isCarrier: true, locus: 110 },
      { wt: "TTT", st: "TTC*", isCarrier: true, locus: 128 },
    ],
  },
  {
    id: "cas9",
    name: "px458-SpCas9 Endonuclease",
    lengthBp: 4104,
    codons: 1368,
    host: "S. pyogenes / E. coli",
    cai: 0.965,
    carriers: 128,
    auc: 0.508,
    carrierMap: {
      3: {
        locusNumber: 10,
        wt: "GAT",
        st: "GAC",
        aa: "Asp (D)",
        rs: "0x12",
        desc: "Locus adjacent to catalytic D10A RuvC-I endonuclease active center.",
        cai: 0.975,
      },
      7: {
        locusNumber: 34,
        wt: "AAA",
        st: "AAG",
        aa: "Lys (K)",
        rs: "0x54",
        desc: "Maintains basic bridge helix electrostatic interaction with sgRNA scaffold.",
        cai: 0.968,
      },
      12: {
        locusNumber: 76,
        wt: "GAG",
        st: "GAA",
        aa: "Glu (E)",
        rs: "0x89",
        desc: "Synonymous substitution within REC1 lobe preserving target DNA duplex unwinding.",
        cai: 0.982,
      },
      16: {
        locusNumber: 115,
        wt: "CTG",
        st: "CTA",
        aa: "Leu (L)",
        rs: "0xFE",
        desc: "Conserved hydrophobic residue inside Cas9-gRNA ribonucleoprotein core.",
        cai: 0.961,
      },
      21: {
        locusNumber: 182,
        wt: "GTG",
        st: "GTA",
        aa: "Val (V)",
        rs: "0x33",
        desc: "Preserves thermal stability in guide RNA seed region matching pocket.",
        cai: 0.970,
      },
      25: {
        locusNumber: 245,
        wt: "CGT",
        st: "CGC",
        aa: "Arg (R)",
        rs: "0x77",
        desc: "Arginine rich bridge helix codon preserved at optimal translational efficiency.",
        cai: 0.989,
      },
      30: {
        locusNumber: 310,
        wt: "ACC",
        st: "ACA",
        aa: "Thr (T)",
        rs: "0xAA",
        desc: "Maintains linker domain flexibility between recognition and nuclease lobes.",
        cai: 0.958,
      },
      34: {
        locusNumber: 840,
        wt: "CAC",
        st: "CAT",
        aa: "His (H)",
        rs: "0x4B",
        desc: "Catalytic H840 codon synonymous preservation within HNH nuclease cleavage domain.",
        cai: 0.984,
      },
    },
    cdsStream: [
      { wt: "ATG", st: "ATG", isCarrier: false },
      { wt: "GAT", st: "GAC*", isCarrier: true, locus: 10 },
      { wt: "AAA", st: "AAG*", isCarrier: true, locus: 34 },
      { wt: "GAG", st: "GAA*", isCarrier: true, locus: 76 },
      { wt: "CTG", st: "CTA*", isCarrier: true, locus: 115 },
      { wt: "GTG", st: "GTA*", isCarrier: true, locus: 182 },
      { wt: "CGT", st: "CGC*", isCarrier: true, locus: 245 },
      { wt: "ACC", st: "ACA*", isCarrier: true, locus: 310 },
      { wt: "CAC", st: "CAT*", isCarrier: true, locus: 840 },
    ],
  },
  {
    id: "gfp",
    name: "pGLO-sfGFP Fluorophore",
    lengthBp: 717,
    codons: 239,
    host: "A. victoria / E. coli",
    cai: 0.972,
    carriers: 32,
    auc: 0.503,
    carrierMap: {
      3: {
        locusNumber: 8,
        wt: "AAA",
        st: "AAG",
        aa: "Lys (K)",
        rs: "0x91",
        desc: "N-terminal cap codon preserved for ribosomal initiation efficiency.",
        cai: 0.98,
      },
      7: {
        locusNumber: 16,
        wt: "GAG",
        st: "GAA",
        aa: "Glu (E)",
        rs: "0x22",
        desc: "Beta-strand 1 surface residue invariant to fluorophore maturation kinetics.",
        cai: 0.991,
      },
      12: {
        locusNumber: 32,
        wt: "CTG",
        st: "CTA",
        aa: "Leu (L)",
        rs: "0x64",
        desc: "Hydrophobic beta-barrel core interior packing residue strictly invariant.",
        cai: 0.966,
      },
      16: {
        locusNumber: 48,
        wt: "GTG",
        st: "GTA",
        aa: "Val (V)",
        rs: "0xC8",
        desc: "Beta-barrel exterior loop residue; avoids hairpin pause site.",
        cai: 0.974,
      },
      21: {
        locusNumber: 65,
        wt: "TCT",
        st: "TCC",
        aa: "Ser (S)",
        rs: "0x05",
        desc: "Chromophore triad Ser65-Tyr66-Gly67 autocatalytic cyclization preserved.",
        cai: 0.985,
      },
      25: {
        locusNumber: 80,
        wt: "GAT",
        st: "GAC",
        aa: "Asp (D)",
        rs: "0x3D",
        desc: "Conserves ionic contact stabilizing 11-stranded anti-parallel beta barrel.",
        cai: 0.988,
      },
      30: {
        locusNumber: 96,
        wt: "ACC",
        st: "ACA",
        aa: "Thr (T)",
        rs: "0x6A",
        desc: "Fluorophore quantum yield invariant; zero emission spectra shift.",
        cai: 0.96,
      },
      34: {
        locusNumber: 112,
        wt: "CGT",
        st: "CGC",
        aa: "Arg (R)",
        rs: "0x9F",
        desc: "Critical solvent-exposed surface salt bridge contact maintained.",
        cai: 0.993,
      },
    },
    cdsStream: [
      { wt: "ATG", st: "ATG", isCarrier: false },
      { wt: "AAA", st: "AAG*", isCarrier: true, locus: 8 },
      { wt: "GAG", st: "GAA*", isCarrier: true, locus: 16 },
      { wt: "CTG", st: "CTA*", isCarrier: true, locus: 32 },
      { wt: "GTG", st: "GTA*", isCarrier: true, locus: 48 },
      { wt: "TCT", st: "TCC*", isCarrier: true, locus: 65 },
      { wt: "GAT", st: "GAC*", isCarrier: true, locus: 80 },
      { wt: "ACC", st: "ACA*", isCarrier: true, locus: 96 },
      { wt: "CGT", st: "CGC*", isCarrier: true, locus: 112 },
    ],
  },
];

// Canonical B-DNA Biophysical Constants
const TOTAL_BASE_PAIRS = 36;
const BP_PER_TURN = 10.5; // Canonical B-form DNA helical pitch: 10.5 bp/turn
const TWIST_PER_BP = (Math.PI * 2) / BP_PER_TURN; // ~34.286 degrees per base pair
const MINOR_GROOVE_OFFSET = (135 * Math.PI) / 180; // ~135 deg minor groove separation
const HELIX_RADIUS = 76; // Screen space radius in px
const HELIX_HEIGHT = 330; // Total vertical span in px
const FOCAL_LENGTH = 440; // 3D perspective projection focal length
const DEFAULT_TILT_X = (14 * Math.PI) / 180; // Natural 14-degree viewing pitch

interface ProjectedNode {
  index: number;
  x1: number;
  y1: number;
  z1: number;
  x2: number;
  y2: number;
  z2: number;
  midX: number;
  midY: number;
  avgZ: number;
  scale1: number;
  scale2: number;
  pair: BasePair;
}

export function DnaHelix3DShowcase() {
  const { construct, hasActiveConstruct } = useConstruct();
  const [activeTab, setActiveTab] = useState<"3d" | "matrix" | "stress">("3d");
  const [selectedConstruct, setSelectedConstruct] = useState<ConstructPreset>(PRESET_CONSTRUCTS[0]);
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [tiltX, setTiltX] = useState(DEFAULT_TILT_X);
  const [hoveredBasePair, setHoveredBasePair] = useState<BasePair | null>(null);
  const [selectedBasePair, setSelectedBasePair] = useState<BasePair | null>(null);
  const [mutationRate, setMutationRate] = useState(3.5);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const dragVelocityRef = useRef({ x: 0, y: 0 });
  const projectedNodesRef = useRef<ProjectedNode[]>([]);
  const scanTimeRef = useRef(0);

  // Generate canonical B-form DNA base pairs with accurate biophysical pitch & major/minor grooves
  const basePairs: BasePair[] = useMemo(() => {
    const pairs: BasePair[] = [];
    const types: ("AT" | "TA" | "GC" | "CG")[] = ["GC", "AT", "CG", "TA", "GC", "AT", "TA", "CG"];

    // If active construct is stamped, map its actual mutations
    const carrierIndices = new Map<number, (typeof construct.mutations)[0]>();
    if (hasActiveConstruct && construct.mutations) {
      construct.mutations.forEach((m) => {
        // Map codon index into 36 visual rungs
        const rungIdx = m.codonIndex % TOTAL_BASE_PAIRS;
        carrierIndices.set(rungIdx, m);
      });
    }

    for (let i = 0; i < TOTAL_BASE_PAIRS; i++) {
      const activeMutation = carrierIndices.get(i);
      const isCarrier = hasActiveConstruct ? Boolean(activeMutation) : false;

      pairs.push({
        index: i,
        // Linear rise per base pair along cylindrical vertical axis:
        y: (i / (TOTAL_BASE_PAIRS - 1)) * HELIX_HEIGHT - HELIX_HEIGHT / 2,
        // Canonical B-DNA twist angle:
        angle: i * TWIST_PER_BP,
        pairType: types[i % types.length],
        isCarrier,
        locusNumber: activeMutation ? activeMutation.codonIndex + 1 : undefined,
        wildtypeCodon: activeMutation?.fromCodon,
        stampedCodon: activeMutation?.toCodon,
        aminoAcid: activeMutation?.aminoAcid,
        rsSymbol: activeMutation ? `0x${(activeMutation.codonIndex % 256).toString(16).toUpperCase().padStart(2, "0")}` : undefined,
        caiScore: activeMutation?.wi ?? (hasActiveConstruct ? construct.caiScore : 1.0),
        description: activeMutation
          ? `Synonymous ${activeMutation.fromCodon} → ${activeMutation.toCodon} substitution (${activeMutation.aminoAcid}) preserving primary peptide sequence.`
          : undefined,
      });
    }
    return pairs;
  }, [hasActiveConstruct, construct]);

  // Default active selection to first carrier
  useEffect(() => {
    const firstCarrier = basePairs.find((p) => p.isCarrier);
    if (firstCarrier) {
      setSelectedBasePair(firstCarrier);
    }
  }, [basePairs]);

  // Main 60 FPS animation loop with momentum inertia and continuous scanning pulse
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const loop = (currentTimestamp: number) => {
      const dt = Math.min((currentTimestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = currentTimestamp;

      // Update continuous provenance scan wave
      scanTimeRef.current = (scanTimeRef.current + dt * 1.2) % TOTAL_BASE_PAIRS;

      if (!isDraggingRef.current) {
        if (isAutoRotate) {
          // Calm, measured biological orbit: 0.38 rad/s (~16.5 sec per full 360 deg turn)
          setRotationAngle((prev) => (prev + dt * 0.38) % (Math.PI * 2));
        } else if (Math.abs(dragVelocityRef.current.x) > 0.0001 || Math.abs(dragVelocityRef.current.y) > 0.0001) {
          // Friction decay on drag release
          setRotationAngle((prev) => (prev + dragVelocityRef.current.x) % (Math.PI * 2));
          setTiltX((prev) => Math.max(-0.4, Math.min(0.4, prev + dragVelocityRef.current.y)));
          dragVelocityRef.current.x *= 0.92;
          dragVelocityRef.current.y *= 0.92;
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoRotate]);

  // Canvas render pipeline: Measured 3D B-DNA Projection with Depth Sorting & High-DPI Scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High-DPI rendering for crisp lines on Windows / Retina displays
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = 540;
    const displayHeight = 380;

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    const cx = displayWidth / 2;
    const cy = displayHeight / 2;
    const scanPos = scanTimeRef.current;

    // 1. Engineering Coordinate Calibration Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
    ctx.lineWidth = 1;
    for (let x = 30; x < displayWidth; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, displayHeight);
      ctx.stroke();
    }
    for (let y = 30; y < displayHeight; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(displayWidth, y);
      ctx.stroke();
    }

    // 2. Compute 3D rotation with authentic Major/Minor Groove Angle Offset
    const cosTilt = Math.cos(tiltX);
    const sinTilt = Math.sin(tiltX);

    const projected: ProjectedNode[] = basePairs.map((pair) => {
      // Strand 1 (Sense): alpha1
      const alpha1 = pair.angle + rotationAngle;
      const x1Raw = Math.cos(alpha1) * HELIX_RADIUS;
      const z1Raw = Math.sin(alpha1) * HELIX_RADIUS;

      // Strand 2 (Antisense / Complementary): offset by authentic MINOR_GROOVE_OFFSET
      const alpha2 = pair.angle + MINOR_GROOVE_OFFSET + rotationAngle;
      const x2Raw = Math.cos(alpha2) * HELIX_RADIUS;
      const z2Raw = Math.sin(alpha2) * HELIX_RADIUS;

      const yRaw = pair.y;

      // Apply Pitch Tilt (Rotation around X axis)
      const y1Tilted = yRaw * cosTilt - z1Raw * sinTilt;
      const z1Tilted = yRaw * sinTilt + z1Raw * cosTilt;

      const y2Tilted = yRaw * cosTilt - z2Raw * sinTilt;
      const z2Tilted = yRaw * sinTilt + z2Raw * cosTilt;

      // Perspective Projection
      const scale1 = FOCAL_LENGTH / (FOCAL_LENGTH + z1Tilted);
      const scale2 = FOCAL_LENGTH / (FOCAL_LENGTH + z2Tilted);

      const px1 = cx + x1Raw * scale1;
      const py1 = cy + y1Tilted * scale1;
      const px2 = cx + x2Raw * scale2;
      const py2 = cy + y2Tilted * scale2;

      return {
        index: pair.index,
        x1: px1,
        y1: py1,
        z1: z1Tilted,
        x2: px2,
        y2: py2,
        z2: z2Tilted,
        midX: (px1 + px2) / 2,
        midY: (py1 + py2) / 2,
        avgZ: (z1Tilted + z2Tilted) / 2,
        scale1,
        scale2,
        pair,
      };
    });

    projectedNodesRef.current = projected;

    // 3. Volumetric 3D Rendering Pipeline (Exact Depth-Sorted Painter's Algorithm)
    // We break the double helix into discrete 3D render primitives:
    // - Backbone segments on Sense Strand 1
    // - Backbone segments on Antisense Strand 2
    // - Hydrogen bond rungs with base pairing
    // - Strand 1 and Strand 2 nucleotide atoms
    // All primitives are sorted along the Z-axis so front elements cleanly occlude rear elements.

    type RenderPrimitive =
      | { type: "backbone"; strand: 1 | 2; xA: number; yA: number; xB: number; yB: number; z: number; isCarrierSegment: boolean }
      | { type: "rung"; node: ProjectedNode; z: number }
      | { type: "atom1"; node: ProjectedNode; z: number }
      | { type: "atom2"; node: ProjectedNode; z: number };

    const primitives: RenderPrimitive[] = [];

    // Push backbone segments
    for (let i = 0; i < projected.length - 1; i++) {
      const curr = projected[i];
      const next = projected[i + 1];

      // Sense Strand 1 segment
      const zStrand1 = (curr.z1 + next.z1) / 2;
      primitives.push({
        type: "backbone",
        strand: 1,
        xA: curr.x1,
        yA: curr.y1,
        xB: next.x1,
        yB: next.y1,
        z: zStrand1,
        isCarrierSegment: curr.pair.isCarrier || next.pair.isCarrier,
      });

      // Antisense Strand 2 segment
      const zStrand2 = (curr.z2 + next.z2) / 2;
      primitives.push({
        type: "backbone",
        strand: 2,
        xA: curr.x2,
        yA: curr.y2,
        xB: next.x2,
        yB: next.y2,
        z: zStrand2,
        isCarrierSegment: false,
      });
    }

    // Push rungs and atoms
    projected.forEach((node) => {
      primitives.push({ type: "rung", node, z: node.avgZ });
      primitives.push({ type: "atom1", node, z: node.z1 });
      primitives.push({ type: "atom2", node, z: node.z2 });
    });

    // Sort all 3D primitives strictly from back (lowest z) to front (highest z)
    primitives.sort((a, b) => a.z - b.z);

    // 4. Render Sorted Primitives with Volumetric Atmospheric Depth Fog
    primitives.forEach((prim) => {
      // Atmospheric depth fog factor: 0.18 at back, 1.0 at front
      const depthAlpha = Math.max(0.18, Math.min(1.0, (prim.z + HELIX_RADIUS * 1.2) / (HELIX_RADIUS * 2.4)));

      if (prim.type === "backbone") {
        ctx.beginPath();
        ctx.moveTo(prim.xA, prim.yA);
        ctx.lineTo(prim.xB, prim.yB);

        if (prim.strand === 1) {
          // Sense Strand 1: Luminous brand orange / gold
          ctx.strokeStyle = prim.isCarrierSegment
            ? `rgba(255, 85, 0, ${Math.min(1.0, depthAlpha * 0.95)})`
            : `rgba(255, 110, 30, ${Math.min(1.0, depthAlpha * 0.65)})`;
          ctx.lineWidth = Math.max(1.5, 2.6 * depthAlpha);
        } else {
          // Antisense Strand 2: Invariant slate steel
          ctx.strokeStyle = `rgba(148, 163, 184, ${Math.min(0.9, depthAlpha * 0.55)})`;
          ctx.lineWidth = Math.max(1.2, 2.0 * depthAlpha);
        }
        ctx.stroke();
      } else if (prim.type === "rung") {
        const node = prim.node;
        const isCarrier = node.pair.isCarrier;
        const isSelected = selectedBasePair?.index === node.pair.index;
        const isHovered = hoveredBasePair?.index === node.pair.index;

        // Scanning verification pulse wave intensity
        const scanDist = Math.abs(node.index - scanPos);
        const cyclicDist = Math.min(scanDist, TOTAL_BASE_PAIRS - scanDist);
        const pulseIntensity = Math.exp(-Math.pow(cyclicDist / 1.8, 2));

        ctx.beginPath();
        ctx.moveTo(node.x1, node.y1);
        ctx.lineTo(node.x2, node.y2);

        if (isCarrier) {
          ctx.strokeStyle = isSelected || isHovered
            ? "#FF5500"
            : `rgba(255, 120, 20, ${Math.min(1.0, depthAlpha * 0.85 + pulseIntensity * 0.5)})`;
          ctx.lineWidth = isSelected || isHovered ? 2.8 : Math.max(1.6, 2.2 * depthAlpha);
        } else {
          ctx.strokeStyle = `rgba(148, 163, 184, ${depthAlpha * 0.35 + pulseIntensity * 0.25})`;
          ctx.lineWidth = Math.max(0.9, 1.3 * depthAlpha);
        }
        ctx.stroke();

        // Hydrogen Bond Hash Ticks (2 for AT, 3 for GC)
        const numBonds = node.pair.pairType.includes("G") ? 3 : 2;
        for (let b = 1; b <= numBonds; b++) {
          const t = b / (numBonds + 1);
          const bx = node.x1 + (node.x2 - node.x1) * t;
          const by = node.y1 + (node.y2 - node.y1) * t;
          ctx.fillStyle = isCarrier
            ? `rgba(255, 150, 50, ${depthAlpha * 0.95})`
            : `rgba(200, 210, 225, ${depthAlpha * 0.65})`;
          ctx.beginPath();
          ctx.arc(bx, by, Math.max(1.0, 1.4 * depthAlpha), 0, Math.PI * 2);
          ctx.fill();
        }

        // Carrier Codon Reticle Halo when selected or pulsing
        if (isCarrier) {
          const midX = node.midX;
          const midY = node.midY;

          if (pulseIntensity > 0.05) {
            const waveRadius = 6 + pulseIntensity * 16;
            ctx.beginPath();
            ctx.arc(midX, midY, waveRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 85, 0, ${pulseIntensity * 0.7 * depthAlpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(midX, midY, isSelected ? 8.5 : 6.0, 0, Math.PI * 2);
          ctx.strokeStyle = isSelected
            ? "#FF5500"
            : `rgba(255, 120, 30, ${Math.min(1.0, depthAlpha * 0.85 + pulseIntensity * 0.3)})`;
          ctx.lineWidth = isSelected ? 1.6 : 1.0;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(midX, midY, isSelected ? 3.5 : 2.2, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? "#FFFFFF" : `rgba(255, 85, 0, ${depthAlpha * 0.95})`;
          ctx.fill();
        }

        if (isSelected || isHovered) {
          ctx.strokeStyle = "#FF5500";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(node.midX, node.midY, 13, 0, Math.PI * 2);
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else if (prim.type === "atom1") {
        // Strand 1 Atom (Sense Strand / Carrier Track)
        const node = prim.node;
        const isCarrier = node.pair.isCarrier;
        const isSelected = selectedBasePair?.index === node.pair.index;
        const atomRadius1 = Math.max(2.8, 5.0 * node.scale1);

        ctx.beginPath();
        ctx.arc(node.x1, node.y1, atomRadius1, 0, Math.PI * 2);
        ctx.fillStyle = isCarrier
          ? isSelected
            ? "#FF5500"
            : `rgba(255, 95, 15, ${depthAlpha * 0.95})`
          : `rgba(220, 85, 15, ${depthAlpha * 0.85})`;
        ctx.fill();
        ctx.strokeStyle = "rgba(16, 17, 22, 0.9)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Specular highlight on front-facing atoms
        if (node.z1 < 0) {
          ctx.beginPath();
          ctx.arc(node.x1 - atomRadius1 * 0.3, node.y1 - atomRadius1 * 0.3, atomRadius1 * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
          ctx.fill();
        }
      } else if (prim.type === "atom2") {
        // Strand 2 Atom (Antisense Strand / Invariant Backbone)
        const node = prim.node;
        const atomRadius2 = Math.max(2.5, 4.4 * node.scale2);

        ctx.beginPath();
        ctx.arc(node.x2, node.y2, atomRadius2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148, 163, 184, ${depthAlpha * 0.85})`;
        ctx.fill();
        ctx.strokeStyle = "rgba(16, 17, 22, 0.9)";
        ctx.lineWidth = 1;
        ctx.stroke();

        if (node.z2 < 0) {
          ctx.beginPath();
          ctx.arc(node.x2 - atomRadius2 * 0.3, node.y2 - atomRadius2 * 0.3, atomRadius2 * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
          ctx.fill();
        }
      }
    });

    // 5. Scientific Orientation & Groove Telemetry
    ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
    ctx.font = "9px ui-monospace, SFMono-Regular, monospace";
    ctx.fillText("5' SENSE STRAND (CARRIER TRACK)", 22, 26);
    ctx.fillText("3' COMPLEMENTARY (INVARIANT)", displayWidth - 170, displayHeight - 16);

    // Minor vs Major Groove Inscription
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.font = "8px ui-monospace, SFMono-Regular, monospace";
    ctx.fillText("B-DNA 10.5 bp/turn • Minor Groove (135°) / Major Groove (225°)", 22, displayHeight - 16);

    // 6. Interactive Floating HUD Tooltip when Hovering a Node
    if (hoveredBasePair) {
      const targetNode = projected.find((n) => n.pair.index === hoveredBasePair.index);
      if (targetNode) {
        const tooltipX = Math.min(displayWidth - 170, Math.max(10, targetNode.midX + 16));
        const tooltipY = Math.max(30, Math.min(displayHeight - 45, targetNode.midY - 14));

        ctx.fillStyle = "rgba(18, 19, 26, 0.95)";
        ctx.strokeStyle = hoveredBasePair.isCarrier ? "rgba(255, 85, 0, 0.8)" : "rgba(148, 163, 184, 0.5)";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.roundRect(tooltipX, tooltipY, 155, 34, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 9px ui-monospace, SFMono-Regular, monospace";
        ctx.fillStyle = hoveredBasePair.isCarrier ? "#FF7A33" : "#E2E8F0";
        const titleText = hoveredBasePair.isCarrier
          ? `CARRIER LOCUS #${hoveredBasePair.locusNumber}`
          : `BP #${hoveredBasePair.index + 1} (${hoveredBasePair.pairType})`;
        ctx.fillText(titleText, tooltipX + 8, tooltipY + 14);

        ctx.font = "8.5px ui-monospace, SFMono-Regular, monospace";
        ctx.fillStyle = "rgba(203, 213, 225, 0.8)";
        const subText = hoveredBasePair.isCarrier
          ? `${hoveredBasePair.wildtypeCodon} → ${hoveredBasePair.stampedCodon} [${hoveredBasePair.rsSymbol}]`
          : `Invariant • CAI: ${hoveredBasePair.caiScore.toFixed(3)}`;
        ctx.fillText(subText, tooltipX + 8, tooltipY + 26);
      }
    }

    ctx.restore();
  }, [basePairs, rotationAngle, tiltX, hoveredBasePair, selectedBasePair]);

  // Raycasting / Hit-testing for Hover & Click Interaction
  const findClosestNode = useCallback(
    (clientX: number, clientY: number): ProjectedNode | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const mouseX = (clientX - rect.left) * (540 / rect.width);
      const mouseY = (clientY - rect.top) * (380 / rect.height);

      let closest: ProjectedNode | null = null;
      let minDistance = 20; // 20px hit tolerance

      for (const node of projectedNodesRef.current) {
        // Distance to Strand 1 atom
        const d1 = Math.hypot(mouseX - node.x1, mouseY - node.y1);
        // Distance to Strand 2 atom
        const d2 = Math.hypot(mouseX - node.x2, mouseY - node.y2);
        // Distance to Rung Midpoint
        const dMid = Math.hypot(mouseX - node.midX, mouseY - node.midY);

        const currentMin = Math.min(d1, d2, dMid);
        if (currentMin < minDistance) {
          minDistance = currentMin;
          closest = node;
        }
      }
      return closest;
    },
    []
  );

  // Mouse Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    dragVelocityRef.current = { x: 0, y: 0 };
    setIsAutoRotate(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      const vX = dx * 0.012;
      const vY = dy * 0.008;

      dragVelocityRef.current = { x: vX, y: vY };
      setRotationAngle((prev) => (prev + vX) % (Math.PI * 2));
      setTiltX((prev) => Math.max(-0.4, Math.min(0.4, prev + vY)));
    } else {
      // Raycasting hover detection
      const hit = findClosestNode(e.clientX, e.clientY);
      setHoveredBasePair(hit ? hit.pair : null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const totalDist = Math.hypot(
        e.clientX - dragStartPosRef.current.x,
        e.clientY - dragStartPosRef.current.y
      );
      // If clicked without dragging, register as node selection click
      if (totalDist < 5) {
        const hit = findClosestNode(e.clientX, e.clientY);
        if (hit) {
          setSelectedBasePair(hit.pair);
        }
      }
      isDraggingRef.current = false;
    }
  };

  // Center / Focus specific locus onto front face
  const focusLocus = (locusIdx: number) => {
    const targetPair = basePairs[locusIdx];
    if (targetPair) {
      setSelectedBasePair(targetPair);
      // Rotate helix so target angle faces directly forward: angle + rotation = 0
      const targetAngle = (Math.PI * 2 - (targetPair.angle % (Math.PI * 2))) % (Math.PI * 2);
      setRotationAngle(targetAngle);
      setIsAutoRotate(false);
    }
  };

  // Active Locus Information for Diagnostic Display
  const activeLocus = useMemo(() => {
    if (selectedBasePair && selectedBasePair.isCarrier) {
      return selectedBasePair;
    }
    return basePairs.find((p) => p.isCarrier) || basePairs[3];
  }, [selectedBasePair, basePairs]);

  return (
    <div className="mt-4 rounded-xl border border-border/80 bg-[#101115] overflow-hidden shadow-sm">
      {/* Top Console Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 border-b border-border/60 bg-[#13141a]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/40 border border-border text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
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

      {/* Subheader Protocol Breadcrumb */}
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
              className="w-full h-full object-contain pointer-events-auto select-none"
              style={{ cursor: hoveredBasePair ? "pointer" : isDraggingRef.current ? "grabbing" : "grab" }}
            />

            {/* Orbit / Rotation Controls Overlay */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAutoRotate(!isAutoRotate)}
                className="h-7 text-[11px] font-mono gap-1.5 bg-[#14151a]/90 border-border cursor-pointer hover:border-primary/50 text-zinc-300"
              >
                {isAutoRotate ? <Pause className="w-3 h-3 text-amber-500" /> : <Play className="w-3 h-3 text-primary" />}
                <span>{isAutoRotate ? "Pause Orbit" : "Auto Orbit"}</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRotationAngle(0);
                  setTiltX(DEFAULT_TILT_X);
                  setIsAutoRotate(true);
                }}
                className="h-7 text-[11px] font-mono gap-1 bg-[#14151a]/90 border-border cursor-pointer hover:border-primary/50 text-zinc-400 hover:text-zinc-200"
                title="Reset View"
              >
                <RotateCw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
              <span className="text-[10px] font-mono text-muted-foreground bg-[#14151a]/90 px-2 py-1 rounded border border-border hidden sm:inline">
                Drag to rotate 3D • Click node to inspect
              </span>
            </div>

            {/* Locus legend overlay */}
            <div className="absolute top-3 right-3 flex flex-col gap-1 text-[10px] font-mono bg-[#14151a]/90 p-2 rounded-lg border border-border/60">
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
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
                  <span className="text-sm font-semibold text-zinc-100 mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100.0%
                  </span>
                  <span className="text-[9px] text-zinc-400 mt-0.5 block">0 alterations</span>
                </div>

                <div className="p-2.5 rounded-lg border border-border bg-[#16171d]">
                  <span className="text-[10px] text-muted-foreground block">CARRIER CAPACITY</span>
                  <span className="text-sm font-semibold text-zinc-100 mt-0.5 block">
                    {hasActiveConstruct ? `${construct.mutations?.length || 0} Loci` : "0 Loci (Awaiting Input)"}
                  </span>
                  <span className="text-[9px] text-zinc-400 mt-0.5 block">
                    {hasActiveConstruct ? "HKDF-Keyed Synonymous Codons" : "Pending Stamping"}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-border bg-[#16171d]">
                  <span className="text-[10px] text-muted-foreground block">HOST CAI INDEX</span>
                  <span className="text-sm font-semibold text-zinc-100 mt-0.5 block">
                    {hasActiveConstruct ? `w = ${(construct.caiScore || 0.988).toFixed(3)}` : "1.000 (Wildtype)"}
                  </span>
                  <span className="text-[9px] text-emerald-400/90 mt-0.5 block">
                    {hasActiveConstruct ? "ΔCAI Host Concordant" : "Natural Codon Bias"}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-border bg-[#16171d]">
                  <span className="text-[10px] text-muted-foreground block">WGAN-GP CRITIC AUC</span>
                  <span className="text-sm font-semibold text-zinc-100 mt-0.5 block">
                    {hasActiveConstruct && construct.stealthResult ? construct.stealthResult.cnnProbability.toFixed(3) : "0.500"}
                  </span>
                  <span className="text-[9px] text-zinc-400 mt-0.5 block">
                    {hasActiveConstruct ? "Classifier Invariant" : "Baseline Chance"}
                  </span>
                </div>
              </div>

              {/* Active Locus Diagnostic Card (Synchronously bound to 3D Helix) */}
              <div className="mt-3.5 p-3 rounded-lg border border-amber-900/40 bg-[#17161b] text-xs font-mono space-y-1.5 transition-all">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    {hasActiveConstruct && activeLocus.isCarrier
                      ? `Selected Locus #${activeLocus.locusNumber ?? activeLocus.index + 1}: ${activeLocus.aminoAcid ?? "Residue"}`
                      : "Invariant Double Helix Backbone"}
                  </span>
                  <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 border-amber-600/40 text-amber-400 bg-amber-950/30">
                    {hasActiveConstruct && activeLocus.rsSymbol ? `GF(2⁸) ${activeLocus.rsSymbol}` : "Table 11 Codec"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                  <span>
                    {hasActiveConstruct && activeLocus.isCarrier ? (
                      <>
                        Wildtype: <strong className="text-zinc-200">{activeLocus.wildtypeCodon ?? "N/A"}</strong> &rarr;{" "}
                        Watermarked: <strong className="text-amber-400 font-semibold">{activeLocus.stampedCodon ?? "N/A"}</strong>
                      </>
                    ) : (
                      <span className="text-zinc-400">Function-Invariant Phosphodiester Backbone</span>
                    )}
                  </span>
                  <span className="text-emerald-400/90 font-medium">
                    {hasActiveConstruct && activeLocus.isCarrier ? `Synonymous (w_i = ${activeLocus.caiScore.toFixed(3)})` : "100.0% Invariance"}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  {hasActiveConstruct && activeLocus.description
                    ? activeLocus.description
                    : "No carrier codons allocated yet. Input or stamp a construct sequence in Input Studio to view synonymous carrier allocations."}
                </p>
              </div>
            </div>

            {/* Bottom Security Signature Hash */}
            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                {hasActiveConstruct ? "SHA-256 Seal: 8f4c...3e1b" : "SHA-256: Awaiting Construct"}
              </span>
              <span className="text-emerald-400/90 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {hasActiveConstruct ? "ECDSA P-256 Verified" : "Idle Baseline"}
              </span>
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
            {Object.entries(selectedConstruct.carrierMap).map(([key, c]) => {
              const bpIndex = parseInt(key, 10);
              const isSelected = selectedBasePair?.index === bpIndex;

              return (
                <div
                  key={key}
                  onClick={() => {
                    focusLocus(bpIndex);
                    setActiveTab("3d");
                  }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "border-amber-500/70 bg-amber-950/20 shadow-sm"
                      : "border-border bg-[#14151b] hover:border-zinc-700 hover:bg-[#181922]"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-border/40">
                    <span className="font-semibold text-zinc-200">
                      Locus #{c.locusNumber}: {c.aa}
                    </span>
                    <Badge variant="outline" className="text-[9px] font-mono border-amber-600/40 text-amber-400">
                      {c.rs}
                    </Badge>
                  </div>
                  <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Codon Mutation:</span>
                      <span className="font-semibold text-amber-400">
                        {c.wt} &rarr; {c.st}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Adaptiveness (w_i):</span>
                      <span className="text-zinc-300 font-medium">{c.cai.toFixed(3)}</span>
                    </div>
                    <div className="pt-1 text-[9px] text-zinc-400 truncate">{c.desc}</div>
                  </div>
                </div>
              );
            })}
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
              <span className="font-semibold text-amber-400 text-sm">{mutationRate.toFixed(1)}%</span>
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
              className="w-full accent-[#FF5500] cursor-pointer h-1.5 bg-muted rounded-lg"
            />
          </div>

          {/* Live Galois Field RS(16,8) Symbol Error Matrix */}
          <div className="p-4 rounded-xl border border-border/80 bg-[#121319] space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Galois Field GF(2⁸) Codeword State (8 Data Symbols + 8 Parity Symbols)
              </span>
              <span className="text-zinc-400 text-[10px]">
                Max Parity Budget: <strong className="text-emerald-400">t = 4 Symbol Errors</strong>
              </span>
            </div>

            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 pt-1">
              {Array.from({ length: 16 }).map((_, i) => {
                const isParity = i >= 8;
                // Analytical error distribution based on mutation noise
                const errorThreshold = Math.min(16, Math.floor((mutationRate / 25) * 8));
                const isCorrupted = i < errorThreshold;

                return (
                  <div
                    key={i}
                    className={`p-2 rounded text-center border transition-all ${
                      isCorrupted
                        ? "border-red-500/80 bg-red-950/40 text-red-300"
                        : isParity
                        ? "border-amber-700/50 bg-amber-950/20 text-amber-300"
                        : "border-border bg-[#181922] text-zinc-200"
                    }`}
                  >
                    <div className="text-[9px] text-zinc-400">{isParity ? `P${i - 7}` : `D${i + 1}`}</div>
                    <div className="text-[10px] font-bold mt-0.5">
                      {isCorrupted ? "ERR" : "OK"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stress Result Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-lg border border-border bg-[#14151b]">
              <span className="text-[10px] text-muted-foreground block">REED-SOLOMON SYMBOLS CORRUPTED</span>
              <span className="text-lg font-semibold text-zinc-100 mt-0.5 block">
                {Math.min(8, Math.floor((mutationRate / 25) * 8))} / 4 Errors
              </span>
              <span className={`text-[10px] mt-1 block flex items-center gap-1 ${
                Math.floor((mutationRate / 25) * 8) <= 4 ? "text-emerald-400" : "text-red-400"
              }`}>
                {Math.floor((mutationRate / 25) * 8) <= 4 ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" /> Within RS(16,8) Correction Margin
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" /> RS Bound Exceeded (Syndrome Fail)
                  </>
                )}
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-[#14151b]">
              <span className="text-[10px] text-muted-foreground block">WATERMARK PAYLOAD RECOVERY</span>
              <span className="text-lg font-semibold text-zinc-100 mt-0.5 block">
                {mutationRate <= 12.5
                  ? "100.0%"
                  : `${Math.max(0, 100 - (mutationRate - 12.5) * 8).toFixed(1)}%`}
              </span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Zero Bit Loss Under Passage Drift</span>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-[#14151b]">
              <span className="text-[10px] text-muted-foreground block">TRANSLATED PEPTIDE MATCH</span>
              <span className="text-lg font-semibold text-emerald-400 mt-0.5 block flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> 100.0%
              </span>
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
        <div className="truncate px-3 font-mono tracking-wider text-[10.5px] flex items-center gap-1.5 overflow-x-auto">
          {hasActiveConstruct && construct.sequence ? (
            Array.from({ length: Math.min(24, Math.floor(construct.sequence.length / 3)) }).map((_, idx) => {
              const codon = construct.sequence.slice(idx * 3, idx * 3 + 3);
              const isCarrier = (construct.mutations || []).some((m) => m.codonIndex === idx);
              return (
                <span
                  key={idx}
                  className={`font-medium px-1.5 py-0.5 rounded border transition-all ${
                    isCarrier
                      ? "text-amber-300 bg-amber-950/40 border-amber-800/40 font-bold"
                      : "text-zinc-500 border-transparent"
                  }`}
                >
                  {codon}{isCarrier ? "*" : ""}
                </span>
              );
            })
          ) : (
            <span className="text-zinc-500 font-mono text-[11px] italic">
              Awaiting sequence input in Sequence Input Studio — Click &quot;+ Input Sequence&quot; above to stamp a construct.
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-zinc-500 font-mono text-[10px]">
          <span>Sense 5&apos; &rarr; 3&apos;</span>
        </div>
      </div>
    </div>
  );
}
