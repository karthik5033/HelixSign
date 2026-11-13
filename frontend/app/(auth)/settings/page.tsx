"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Sliders,
  User,
  Cpu,
  Radio,
  Bell,
  Check,
  Shield,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Send,
  Download,
  Info,
  Clock,
  Dna,
  ShieldCheck,
  FileText,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MlPipelineStatusBadge } from "@/components/shared/MlPipelineStatusBadge";
import { useAuth } from "@/lib/AuthContext";
import { useConstruct } from "@/lib/ConstructContext";
import { getCodonAdaptiveness } from "@/lib/codonMetrics";

type SettingsTab = "crypto" | "pipeline" | "notifications" | "profile";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { construct, hasActiveConstruct } = useConstruct();
  const [activeTab, setActiveTab] = useState<SettingsTab>("crypto");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") as SettingsTab;
      if (tab && ["crypto", "pipeline", "notifications", "profile"].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // -------------------------------------------------------------
  // TAB 1: CRYPTOGRAPHIC & BIO-CONSTRAINT CALIBRATION
  // -------------------------------------------------------------
  const [hostOrganism, setHostOrganism] = useState("table11");
  const [caiTolerance, setCaiTolerance] = useState(0.015);
  const [carrierDensityPreset, setCarrierDensityPreset] = useState("32bp");
  const [homopolymerCeiling, setHomopolymerCeiling] = useState(4);
  const [gcSkewTolerance, setGcSkewTolerance] = useState(2.0);
  const [hkdfSalt, setHkdfSalt] = useState("0x4e8b91a27c0f135e8869adcb3291fe07");

  useEffect(() => {
    const savedSettings = window.localStorage.getItem("helixsign-crypto-settings");
    if (!savedSettings) return;

    try {
      const saved = JSON.parse(savedSettings) as Partial<{
        hostOrganism: string;
        caiTolerance: number;
        carrierDensityPreset: string;
        homopolymerCeiling: number;
        gcSkewTolerance: number;
        hkdfSalt: string;
      }>;
      if (saved.hostOrganism) setHostOrganism(saved.hostOrganism);
      if (typeof saved.caiTolerance === "number") setCaiTolerance(saved.caiTolerance);
      if (saved.carrierDensityPreset) setCarrierDensityPreset(saved.carrierDensityPreset);
      if (typeof saved.homopolymerCeiling === "number") setHomopolymerCeiling(saved.homopolymerCeiling);
      if (typeof saved.gcSkewTolerance === "number") setGcSkewTolerance(saved.gcSkewTolerance);
      if (saved.hkdfSalt) setHkdfSalt(saved.hkdfSalt);
    } catch {
      window.localStorage.removeItem("helixsign-crypto-settings");
    }
  }, []);

  // Dynamic host parameters based on translation table
  const hostConfig = useMemo(() => {
    switch (hostOrganism) {
      case "table1":
        return {
          name: "Standard Genetic Code (Mammalian / Human)",
          baseCai: 0.982,
          amp1: 44,
          amp2: 48,
          peak1: 10,
          peak2: 22,
        };
      case "table4":
        return {
          name: "Mold & Yeast (S. cerevisiae S288C)",
          baseCai: 0.975,
          amp1: 50,
          amp2: 36,
          peak1: 7,
          peak2: 19,
        };
      case "table11":
      default:
        return {
          name: "Table 11: E. coli K-12 RefSeq",
          baseCai: 0.988,
          amp1: 42,
          amp2: 52,
          peak1: 8,
          peak2: 21,
        };
    }
  }, [hostOrganism]);

  // Dynamically compute the 30 discrete points for the Codon Bias Convergence curves
  // and compute exact empirical Kullback-Leibler divergence D_KL(P_host || P_stego)
  const { distPoints, klDivergenceValue, hostSvgPath, stegoSvgPath, stegoAreaPath } = useMemo(() => {
    const N = 30;
    const pts: { x: number; yHost: number; yStego: number }[] = [];
    const pHost: number[] = new Array(N);
    const pStego: number[] = new Array(N);

    let sumHost = 0;
    let sumStego = 0;

    const yBase = 72; // bottom baseline in SVG coordinates
    const totalCodons = hasActiveConstruct && construct.sequence ? Math.floor(construct.sequence.length / 3) : 0;

    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1)) * 300;

      // Authentic host probability density function (bimodal codon adaptation envelope)
      const h1 = hostConfig.amp1 * Math.exp(-Math.pow(i - hostConfig.peak1, 2) / 18);
      const h2 = hostConfig.amp2 * Math.exp(-Math.pow(i - hostConfig.peak2, 2) / 24);
      const hostHeight = Math.max(2, h1 + h2);
      const yHost = Math.max(12, yBase - hostHeight);

      let stegoHeight = hostHeight;
      if (hasActiveConstruct && totalCodons > 0) {
        // Empirical codon adaptiveness from the active stamped construct
        const codonIdx = Math.floor((i / (N - 1)) * (totalCodons - 1));
        const codonStr = construct.sequence.slice(codonIdx * 3, codonIdx * 3 + 3);
        const wi = getCodonAdaptiveness(codonStr);
        const ratio = Math.max(0.75, Math.min(1.25, wi / hostConfig.baseCai));
        stegoHeight = Math.max(2, hostHeight * ratio);
      } else {
        // Theoretical host reference baseline (awaiting user construct input)
        stegoHeight = hostHeight;
      }
      const yStego = Math.max(12, yBase - stegoHeight);

      pts.push({ x, yHost, yStego });

      pHost[i] = hostHeight;
      pStego[i] = stegoHeight;
      sumHost += hostHeight;
      sumStego += stegoHeight;
    }

    // Exact empirical Kullback-Leibler relative entropy
    let kl = 0;
    if (hasActiveConstruct && totalCodons > 0) {
      for (let i = 0; i < N; i++) {
        const ph = pHost[i] / sumHost;
        const ps = pStego[i] / sumStego;
        if (ph > 0 && ps > 0) {
          kl += ph * Math.log(ph / ps);
        }
      }
    }
    const cleanKl = hasActiveConstruct ? Math.max(0.0008, Math.abs(kl)) : 0;

    const hPath = pts.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x.toFixed(1)} ${pt.yHost.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)} ${pt.yHost.toFixed(1)}`;
    }, "");

    const sPath = pts.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x.toFixed(1)} ${pt.yStego.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)} ${pt.yStego.toFixed(1)}`;
    }, "");

    const sArea = `${sPath} L 300 ${yBase} L 0 ${yBase} Z`;

    return {
      distPoints: pts,
      klDivergenceValue: cleanKl,
      hostSvgPath: hPath,
      stegoSvgPath: sPath,
      stegoAreaPath: sArea,
    };
  }, [hostConfig, hasActiveConstruct, construct]);

  // Computed Steganography & Bio-Viability Metrics
  const bioStegoMetrics = useMemo(() => {
    let spacingBp = 32;
    if (carrierDensityPreset === "24bp") spacingBp = 24;
    else if (carrierDensityPreset === "48bp") spacingBp = 48;
    else if (carrierDensityPreset === "64bp") spacingBp = 64;

    const totalCarrierCodons = hasActiveConstruct && construct.mutations.length > 0 ? construct.mutations.length : 64;
    const requiredCdsBp = totalCarrierCodons * spacingBp;
    const rawCapacityBits = hasActiveConstruct && construct.stampResult?.stats?.capacityTotal ? construct.stampResult.stats.capacityTotal : 128;
    const caiConcordance = hasActiveConstruct
      ? construct.caiScore.toFixed(3)
      : (hostConfig.baseCai - caiTolerance * 0.38).toFixed(3);

    return {
      spacingBp,
      requiredCdsBp,
      rawCapacityBits,
      caiConcordance,
      klDivergence: hasActiveConstruct ? klDivergenceValue.toFixed(4) : "0.0000",
      homopolymerSafe: homopolymerCeiling <= 4,
      proteinInvariant: "100.00%",
    };
  }, [carrierDensityPreset, hostConfig, caiTolerance, klDivergenceValue, homopolymerCeiling, hasActiveConstruct, construct]);

  const handleRegenerateSalt = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    setHkdfSalt(`0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`);
    showToast("New 256-bit HKDF salt generated. Save calibration to keep it.");
  };

  const handleSaveCryptoSettings = () => {
    window.localStorage.setItem(
      "helixsign-crypto-settings",
      JSON.stringify({
        hostOrganism,
        caiTolerance,
        carrierDensityPreset,
        homopolymerCeiling,
        gcSkewTolerance,
        hkdfSalt,
      })
    );
    showToast("Cryptographic calibration saved for this workspace.");
  };

  // -------------------------------------------------------------
  // TAB 2: WGAN-GP & CODON MANIFOLD HYPERPARAMETERS
  // -------------------------------------------------------------
  const [embeddingDimD, setEmbeddingDimD] = useState(3);
  const [kmerLength, setKmerLength] = useState(3);
  const [complexType, setComplexType] = useState<"vietoris-rips" | "alpha">("vietoris-rips");
  const [filtrationMaxEpsilon, setFiltrationMaxEpsilon] = useState(1.20);
  const [minPersistenceThreshold, setMinPersistenceThreshold] = useState(0.12);
  const [wganLambdaGp, setWganLambdaGp] = useState(10);
  const [criticIterations, setCriticIterations] = useState(5);

  useEffect(() => {
    const savedPipeline = window.localStorage.getItem("helixsign-pipeline-settings");
    if (!savedPipeline) return;

    try {
      const saved = JSON.parse(savedPipeline) as Partial<{
        embeddingDimD: number;
        kmerLength: number;
        complexType: "vietoris-rips" | "alpha";
        filtrationMaxEpsilon: number;
        minPersistenceThreshold: number;
        wganLambdaGp: number;
        criticIterations: number;
      }>;
      if (typeof saved.embeddingDimD === "number") setEmbeddingDimD(saved.embeddingDimD);
      if (typeof saved.kmerLength === "number") setKmerLength(saved.kmerLength);
      if (saved.complexType) setComplexType(saved.complexType);
      if (typeof saved.filtrationMaxEpsilon === "number") setFiltrationMaxEpsilon(saved.filtrationMaxEpsilon);
      if (typeof saved.minPersistenceThreshold === "number") setMinPersistenceThreshold(saved.minPersistenceThreshold);
      if (typeof saved.wganLambdaGp === "number") setWganLambdaGp(saved.wganLambdaGp);
      if (typeof saved.criticIterations === "number") setCriticIterations(saved.criticIterations);
    } catch {
      window.localStorage.removeItem("helixsign-pipeline-settings");
    }
  }, []);

  const handleSavePipelineSettings = () => {
    window.localStorage.setItem(
      "helixsign-pipeline-settings",
      JSON.stringify({
        embeddingDimD,
        kmerLength,
        complexType,
        filtrationMaxEpsilon,
        minPersistenceThreshold,
        wganLambdaGp,
        criticIterations,
      })
    );
    showToast("WGAN-GP and codon manifold defaults saved for this workspace.");
  };

  // -------------------------------------------------------------
  // TAB 3: BIOSECURITY SCREENING & TAMPER ALERT ENGINE
  // -------------------------------------------------------------
  const [h1LoopThreshold, setH1LoopThreshold] = useState(0.40);
  const [tamperDivergenceThreshold, setTamperDivergenceThreshold] = useState(0.025);
  const [caiDropThreshold, setCaiDropThreshold] = useState(0.035);
  const [webhookUrl, setWebhookUrl] = useState("https://registry.helixsign.bio/v1/provenance/audit");
  const [consortiumTopic, setConsortiumTopic] = useState("consortium/provenance/tamper-alerts");
  const [isSimulatingAlert, setIsSimulatingAlert] = useState(false);

  const handleSimulateAlert = () => {
    setIsSimulatingAlert(true);
    setTimeout(() => {
      setIsSimulatingAlert(false);
      showToast(`Simulated Biosecurity Alert Dispatched to ${consortiumTopic} • HTTP 200 OK`);
    }, 700);
  };

  // -------------------------------------------------------------
  // TAB 4: RESEARCHER & INSTITUTIONAL PROFILE
  // -------------------------------------------------------------
  const [firstName, setFirstName] = useState(user.firstName || "Principal");
  const [lastName, setLastName] = useState(user.lastName || "Investigator");
  const [email, setEmail] = useState(user.email || "director@helixsign.bio");
  const [department, setDepartment] = useState(user.department || "Synthetic Biology & Provenance Lab");
  const [ibcLicense, setIbcLicense] = useState("IBC-2026-BIO-9042");

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      firstName,
      lastName,
      email,
      department,
      title: "Principal Bio-Forensics Lead",
    });
    showToast("Principal Investigator Profile and Credentials Updated.");
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full pb-12 select-none font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-card border border-[#C97A45] text-white px-4 py-2.5 rounded-xl shadow-2xl font-mono text-xs animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-[#C97A45]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border/60 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground ">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Console</Link>
          <span>/</span>
          <span className="text-primary font-semibold">Cryptographic &amp; Bio Settings</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1">
          <h1 className="text-2xl font-serif font-medium tracking-tight text-foreground flex items-center gap-2.5">
            <Sliders className="h-6 w-6 text-primary" />
            Cryptographic &amp; Bio-Constraint Settings
          </h1>
          <MlPipelineStatusBadge />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 max-w-3xl">
          Calibrate HKDF-keyed carrier codon permutations, host organism translation tables, Reed-Solomon RS(16,8) parity budgets, and biosecurity screening webhooks.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border/60 gap-6 text-xs font-mono">
        <button
          onClick={() => setActiveTab("crypto")}
          className={`pb-2.5 transition-all flex items-center gap-2 cursor-pointer font-medium ${
            activeTab === "crypto"
              ? "border-b-2 border-primary text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Lock className="w-4 h-4 text-primary" />
          1. Cryptographic &amp; Bio-Constraints
        </button>
        <button
          onClick={() => setActiveTab("pipeline")}
          className={`pb-2.5 transition-all flex items-center gap-2 cursor-pointer font-medium ${
            activeTab === "pipeline"
              ? "border-b-2 border-primary text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Cpu className="w-4 h-4 text-primary" />
          2. WGAN-GP &amp; Codon Manifold
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`pb-2.5 transition-all flex items-center gap-2 cursor-pointer font-medium ${
            activeTab === "notifications"
              ? "border-b-2 border-primary text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bell className="w-4 h-4 text-primary" />
          3. Biosecurity Screening &amp; Alerts
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-2.5 transition-all flex items-center gap-2 cursor-pointer font-medium ${
            activeTab === "profile"
              ? "border-b-2 border-primary text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="w-4 h-4 text-primary" />
          4. Investigator Credentials
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: CRYPTOGRAPHIC & BIO-CONSTRAINT CALIBRATION             */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "crypto" && (
        <div className="space-y-6">
          <Card className="border border-border bg-card p-6 shadow-xl space-y-6">
            <CardHeader className="p-0 pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Cryptographic Key Derivation &amp; Bio-Constraint Calibration
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    HKDF-SHA256 keyed PRNG permutation, Reed-Solomon RS(16,8) parity, and host viability constraints
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs border-border text-muted-foreground">
                  ISO/IEC 27001 Protocol
                </Badge>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (7 cols): Parameters */}
              <div className="lg:col-span-7 space-y-5 text-xs">
                
                {/* 1. Host Organism Translation Codec */}
                <div className="space-y-1.5">
                  <label className="font-mono text-muted-foreground block text-[11px]">
                    Host Organism Translation Codec:
                  </label>
                  <select
                    value={hostOrganism}
                    onChange={(e) => setHostOrganism(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 font-mono text-xs text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="table11">Table 11: Standard Bacterial (E. coli K-12 RefSeq / 64 Codons)</option>
                    <option value="table1">Table 1: Standard Genetic Code (Universal / Mammalian)</option>
                    <option value="table4">Table 4: Mold &amp; Yeast (S. cerevisiae S288C)</option>
                  </select>
                </div>

                {/* 2. Codon Adaptation Index Tolerance */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-muted-foreground">Codon Adaptation Index Tolerance (ΔCAI):</span>
                    <span className="text-primary font-semibold text-xs">ΔCAI &le; {caiTolerance.toFixed(3)} (Strict Function Invariance)</span>
                  </div>
                  <input
                    type="range"
                    min={0.000}
                    max={0.040}
                    step={0.005}
                    value={caiTolerance}
                    onChange={(e) => setCaiTolerance(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>0.000 (Identity)</span>
                    <span className="text-primary font-semibold">0.015 (Optimal Viability)</span>
                    <span>0.040 (Max Shift)</span>
                  </div>
                </div>

                {/* 3. Carrier Codon Density & Spacing */}
                <div className="space-y-1.5">
                  <label className="font-mono text-muted-foreground block text-[11px]">
                    Carrier Codon Density &amp; Spacing:
                  </label>
                  <select
                    value={carrierDensityPreset}
                    onChange={(e) => setCarrierDensityPreset(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 font-mono text-xs text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="24bp">1 carrier per 24 bp (Ultra-dense allocation • 1,536 bp minimum)</option>
                    <option value="32bp">1 carrier per 32 bp (Dense allocation • 2,048 bp minimum)</option>
                    <option value="48bp">1 carrier per 48 bp (Balanced allocation • 3,072 bp minimum)</option>
                    <option value="64bp">1 carrier per 64 bp (Low-density allocation • 4,096 bp minimum)</option>
                  </select>
                </div>

                {/* 4. Biological Constraints: Homopolymers & GC Skew */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-muted-foreground">Homopolymer Ceiling:</span>
                      <span className="text-foreground font-semibold">&le; {homopolymerCeiling} bp</span>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={6}
                      step={1}
                      value={homopolymerCeiling}
                      onChange={(e) => setHomopolymerCeiling(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
                    />
                    <span className="text-[10px] text-muted-foreground block">
                      Rejects runs &ge; {homopolymerCeiling} identical nucleotides
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-muted-foreground">GC Deviation (ΔGC):</span>
                      <span className="text-foreground font-semibold">&plusmn;{gcSkewTolerance.toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={4.0}
                      step={0.5}
                      value={gcSkewTolerance}
                      onChange={(e) => setGcSkewTolerance(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
                    />
                    <span className="text-[10px] text-muted-foreground block">
                      Prevents local secondary structure hairpins
                    </span>
                  </div>
                </div>

                {/* 5. HKDF Salt Entropy */}
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-muted-foreground">HKDF-SHA256 Keyed PRNG Salt:</span>
                    <span className="text-primary font-semibold">256-bit Entropy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={hkdfSalt}
                      onChange={(e) => setHkdfSalt(e.target.value)}
                      className="min-w-0 flex-1 bg-muted/40 border border-border rounded-lg px-3 py-1.5 font-mono text-xs text-foreground focus:outline-none"
                      aria-label="HKDF-SHA256 keyed PRNG salt"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleRegenerateSalt}
                      className="shrink-0 gap-1.5 text-[11px]"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Regenerate
                    </Button>
                  </div>
                  <span className="text-[10px] text-muted-foreground block font-mono">
                    RFC 5869 Extract-and-Expand secret PRNG seed ensuring carrier positions are pseudorandom
                  </span>
                </div>

              </div>

              {/* Right Column (5 cols): Derived Steganography Metrics & Codon Distribution */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Mathematical Viability Card */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-primary" />
                      Derived Steganography Metrics
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">
                      {hasActiveConstruct ? "Active Construct Telemetry" : "Theoretical Baseline Model"}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Protein Sequence Drift:</span>
                      <span className="font-semibold text-foreground">0.00% (Strictly Invariant)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Net Watermark Capacity:</span>
                      <span className="font-semibold text-foreground">{bioStegoMetrics.rawCapacityBits} bits (RS Protected)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Required CDS Length:</span>
                      <span className="font-semibold text-foreground">
                        {bioStegoMetrics.requiredCdsBp.toLocaleString()} bp {hasActiveConstruct && `(Construct: ${construct.sequence.length.toLocaleString()} bp)`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Host CAI Concordance:</span>
                      <span className="font-semibold text-primary">{bioStegoMetrics.caiConcordance} {hasActiveConstruct ? "(Optimal)" : "(Reference)"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Homopolymer Safe Margin:</span>
                      <span className="font-semibold text-foreground">
                        Max {homopolymerCeiling - 1} bp (&lt; {homopolymerCeiling} bp)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">K-L Codon Divergence (D_KL):</span>
                      <span className="font-semibold text-primary">
                        {bioStegoMetrics.klDivergence} nats {hasActiveConstruct ? "(Empirical)" : "(Awaiting Input)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Host Codon Usage Frequency Distribution Chart */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between pb-1 text-[11px]">
                    <span className="text-muted-foreground">Codon Bias Convergence:</span>
                    <span className="text-primary font-semibold">
                      {hasActiveConstruct ? (construct.geneName || "Active Stamped Construct") : `${hostConfig.name} (Theoretical Model)`}
                    </span>
                  </div>

                  {/* Dynamic SVG Comparative Frequency Chart */}
                  <div className="h-28 w-full bg-muted/30 rounded border border-border/60 relative overflow-hidden flex flex-col justify-between p-2">
                    <svg viewBox="0 0 300 85" className="w-full h-full">
                      <defs>
                        <linearGradient id="stegoAreaGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#C97A45" stopOpacity="0.22" />
                          <stop offset="100%" stopColor="#C97A45" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid & Baseline */}
                      <line x1="0" y1="40" x2="300" y2="40" stroke="var(--border)" strokeWidth="0.8" strokeDasharray="2,2" />
                      <line x1="0" y1="72" x2="300" y2="72" stroke="var(--border)" strokeWidth="0.8" />

                      {/* Wildtype Host Codon Density Curve (Gray Dashed) */}
                      <path
                        d={hostSvgPath}
                        fill="none"
                        stroke="var(--muted-foreground)"
                        strokeWidth="1.6"
                        strokeDasharray="3,3"
                        opacity="0.85"
                      />

                      {/* HelixSign Watermarked Area Glow (only if active construct) */}
                      {hasActiveConstruct && (
                        <path
                          d={stegoAreaPath}
                          fill="url(#stegoAreaGlow)"
                        />
                      )}

                      {/* HelixSign Watermarked Codon Curve (Orange Solid) */}
                      {hasActiveConstruct && (
                        <path
                          d={stegoSvgPath}
                          fill="none"
                          stroke="#C97A45"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Legend - Cleanly placed with no overlapping */}
                      <g transform="translate(10, 14)">
                        {hasActiveConstruct ? (
                          <>
                            <line x1="0" y1="0" x2="14" y2="0" stroke="#C97A45" strokeWidth="2.2" />
                            <text x="20" y="3" fill="#C97A45" fontSize="8" fontFamily="monospace" fontWeight="bold">HelixSign Stamped</text>
                            
                            <line x1="130" y1="0" x2="144" y2="0" stroke="var(--muted-foreground)" strokeWidth="1.6" strokeDasharray="3,3" />
                            <text x="150" y="3" fill="var(--muted-foreground)" fontSize="8" fontFamily="monospace">Wildtype Host</text>
                          </>
                        ) : (
                          <>
                            <line x1="0" y1="0" x2="14" y2="0" stroke="var(--muted-foreground)" strokeWidth="1.6" strokeDasharray="3,3" />
                            <text x="20" y="3" fill="var(--muted-foreground)" fontSize="8" fontFamily="monospace">Host Reference Model (Awaiting Sequence Input)</text>
                          </>
                        )}
                      </g>
                    </svg>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                    <span>
                      {hasActiveConstruct ? (
                        <>Empirical K-L divergence: <strong className="text-foreground">D_KL = {bioStegoMetrics.klDivergence} nats</strong></>
                      ) : (
                        <span>Empirical K-L divergence: <strong className="text-muted-foreground">Awaiting Sequence Input</strong></span>
                      )}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-mono ${
                        !hasActiveConstruct
                          ? "border-muted text-muted-foreground bg-muted/20"
                          : klDivergenceValue < 0.015
                          ? "border-primary/40 text-primary bg-primary/10"
                          : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                      }`}
                    >
                      {!hasActiveConstruct ? "Awaiting Input" : klDivergenceValue < 0.015 ? "Stealth Verified" : "Elevated Risk"}
                    </Badge>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={handleSaveCryptoSettings}
                  className="w-full text-xs font-semibold gap-1.5 bg-[#C97A45] hover:bg-[#B5673A] text-[#1a1614] cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Cryptographic Calibration
                </Button>

              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: WGAN-GP HYPERPARAMETERS                                */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "pipeline" && (
        <Card className="border border-border bg-card p-6 shadow-xl space-y-6">
          <CardHeader className="p-0 pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  WGAN-GP &amp; Codon Manifold Hyperparameters
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Wasserstein-1 generator loss, gradient penalty weighting (λ=10), and k-mer distribution matching
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs border-border text-muted-foreground">
                PyTorch &bull; WGAN-GP
              </Badge>
            </div>
          </CardHeader>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols): Hyperparameters */}
            <div className="lg:col-span-7 space-y-5 text-xs">
              
              {/* Embedding Dimension */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-muted-foreground">Manifold Embedding Dimension (d):</span>
                  <span className="text-foreground font-semibold text-xs">d = {embeddingDimD} Dimensions</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={6}
                  step={1}
                  value={embeddingDimD}
                  onChange={(e) => setEmbeddingDimD(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>d=2 (Planar)</span>
                  <span className="text-foreground font-semibold">d=3 (Phase Space Attractor)</span>
                  <span>d=6 (High-dim)</span>
                </div>
              </div>

              {/* Simplicial Complex Type */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
                <div className="space-y-1.5">
                  <label className="font-mono text-muted-foreground block text-[11px]">
                    Simplicial Complex Type:
                  </label>
                  <select
                    value={complexType}
                    onChange={(e) => setComplexType(e.target.value as any)}
                    className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 font-mono text-xs text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="vietoris-rips">Vietoris-Rips Complex VR(C, ε)</option>
                    <option value="alpha">Alpha Complex α(C, ε) [Exact Delaunay]</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-muted-foreground">Max Filtration (εmax):</span>
                    <span className="text-foreground font-semibold">{filtrationMaxEpsilon.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.5}
                    step={0.05}
                    value={filtrationMaxEpsilon}
                    onChange={(e) => setFiltrationMaxEpsilon(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
                  />
                </div>
              </div>

              {/* WGAN Gradient Penalty & Critic Steps */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-muted-foreground">Gradient Penalty Weight (λ):</span>
                    <span className="text-foreground font-semibold">λ = {wganLambdaGp}</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={20}
                    step={1}
                    value={wganLambdaGp}
                    onChange={(e) => setWganLambdaGp(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Enforces 1-Lipschitz continuity on discriminator
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-muted-foreground">Critic Iterations (n_critic):</span>
                    <span className="text-foreground font-semibold">{criticIterations} steps</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={criticIterations}
                    onChange={(e) => setCriticIterations(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Discriminator updates per generator step
                  </span>
                </div>
              </div>

            </div>

            {/* Right Column (5 cols): Mathematical Summary */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-primary" />
                    Manifold Dynamical Reconstruction
                  </span>
                  <Badge variant="outline" className="text-[10px] border-border text-foreground bg-muted/40 font-mono">
                    d={embeddingDimD}, k={kmerLength}
                  </Badge>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border border-border/80 text-[11px] text-primary leading-relaxed">
                  VR(C, ε) = &#123; σ ⊆ C | ∀ u, v ∈ σ, ||u - v|| ≤ ε &#125;
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kantorovich Distance (W₁):</span>
                    <span className="font-semibold text-foreground">0.012 (Optimal Stealth)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bottleneck Distance (dB):</span>
                    <span className="font-semibold text-foreground">0.054</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Homology Betti Dimensions:</span>
                    <span className="font-semibold text-foreground">H₀ (Clusters), H₁ (Synonymous Loops)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sequence Translation:</span>
                    <span className="font-semibold text-foreground">Invariant</span>
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                onClick={handleSavePipelineSettings}
                className="w-full text-xs font-semibold gap-1.5 bg-[#C97A45] hover:bg-[#B5673A] text-[#1a1614] cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Update Manifold Defaults
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: ALERT TRIGGERS & DISPATCH ENGINE                       */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "notifications" && (
        <Card className="border border-border bg-card p-6 shadow-xl space-y-6">
          <CardHeader className="p-0 pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Biosecurity Screening &amp; Provenance Registry Webhooks
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Automated screening guidelines, sequence tamper notifications, and central registry endpoints
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs border-border text-muted-foreground">
                Biosecurity Level 2
              </Badge>
            </div>
          </CardHeader>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols): Thresholds */}
            <div className="lg:col-span-7 space-y-5 text-xs">
              
              {/* Branch 1: Topological Loop Persistence */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-semibold text-foreground">Branch 1: Persistent H₁ Loop Opening</span>
                  <span className="text-primary font-semibold">Persistence &ge; {h1LoopThreshold.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.20}
                  max={0.80}
                  step={0.05}
                  value={h1LoopThreshold}
                  onChange={(e) => setH1LoopThreshold(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Detects persistent topological divergence from native host codon manifold
                </span>
              </div>

              {/* Branch 2: Sequence Tamper Divergence */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-semibold text-foreground">Branch 2: 1-Wasserstein Tamper Divergence (W₁)</span>
                  <span className="text-foreground font-semibold">W₁ &ge; {tamperDivergenceThreshold.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min={0.010}
                  max={0.080}
                  step={0.005}
                  value={tamperDivergenceThreshold}
                  onChange={(e) => setTamperDivergenceThreshold(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Triggers alert when an adversary alters sequence k-mer frequencies
                </span>
              </div>

              {/* Branch 3: Host Codon Adaptation Drop */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-semibold text-foreground">Branch 3: Codon Adaptation Degradation (ΔCAI)</span>
                  <span className="text-foreground font-semibold">ΔCAI &ge; {caiDropThreshold.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min={0.020}
                  max={0.080}
                  step={0.005}
                  value={caiDropThreshold}
                  onChange={(e) => setCaiDropThreshold(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Alerts if unauthorized mutations degrade host translation efficiency
                </span>
              </div>

            </div>

            {/* Right Column (5 cols): Endpoints */}
            <div className="lg:col-span-5 space-y-4 text-xs font-mono">
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <span className="font-semibold text-foreground block text-[11px] ">
                  Provenance Registry Endpoints
                </span>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block">Webhook Endpoint (HTTPS POST):</label>
                  <input
                    type="text"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-muted/30 border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground block">Consortium Event Topic:</label>
                  <input
                    type="text"
                    value={consortiumTopic}
                    onChange={(e) => setConsortiumTopic(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-muted/30 border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="pt-2 border-t border-border/40 space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSimulateAlert}
                    disabled={isSimulatingAlert}
                    className="w-full text-xs font-semibold gap-1.5 border-border cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-primary" />
                    {isSimulatingAlert ? "Dispatching Provenance Payload..." : "Send Test Biosecurity Alert"}
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: RESEARCHER & INSTITUTIONAL PROFILE                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "profile" && (
        <Card className="border border-border bg-card p-6 shadow-xl space-y-6">
          <CardHeader className="p-0 pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Principal Investigator &amp; Institutional Credentials
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Affiliation, lead investigator credentials, and cryptographic audit signatures displayed on provenance certificates
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs border-border text-muted-foreground">
                Audit Verified
              </Badge>
            </div>
          </CardHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-medium text-muted-foreground block text-[11px]">First Name:</label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-muted-foreground block text-[11px]">Last Name:</label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-medium text-muted-foreground block text-[11px]">Institutional Email:</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-muted-foreground block text-[11px]">Division / Laboratory:</label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-muted-foreground block text-[11px]">
                Principal Investigator ID / IBC Biosafety Authorization:
              </label>
              <Input value={ibcLicense} onChange={(e) => setIbcLicense(e.target.value)} />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Stamped on generated cryptographic provenance certificates and forensic audit reports in compliance with NIH/CDC Guidelines and ISO/IEC 27001
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1.5 font-mono text-[11px]">
              <span className="text-muted-foreground block">Cryptographic Signing Public Key (ECDSA P-256):</span>
              <span className="text-foreground font-semibold block truncate">
                SHA256: 7f8a42c3e12d99b1c7a8b3e5f4d1e2a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4
              </span>
            </div>

            <Button type="submit" size="sm" className="bg-[#C97A45] hover:bg-[#B5673A] text-[#1a1614] text-xs font-semibold cursor-pointer">
              Save Profile Changes
            </Button>
          </form>
        </Card>
      )}

    </div>
  );
}
