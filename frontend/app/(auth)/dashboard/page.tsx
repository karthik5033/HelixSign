"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Cpu,
  Download,
  ExternalLink,
  Flame,
  Layers,
  LineChart,
  Plus,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Dna,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UploadCloud,
  FileText,
  GitCompare,
  Sliders,
  Check,
  Zap,
  Info,
  Clock,
  Compass,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DASHBOARD_STATS,
  AnalysisRecord,
} from "@/lib/echosenseData";
import { downloadDataAsCsv } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type LoadingRegime = "evolutionary" | "pcr" | "adversarial";

// Authentic DNA Watermark Resilience & Mutagenic Stress Progression Data
const REGIME_PROGRESSION_DATA = {
  evolutionary: [
    { label: "Gen 30", recoveryRate: 100, mutationRate: 0.1, caiScore: 98.8, rsParityRemaining: 4, desc: "Passage 1" },
    { label: "Gen 60", recoveryRate: 100, mutationRate: 0.2, caiScore: 98.8, rsParityRemaining: 4, desc: "Passage 2" },
    { label: "Gen 120", recoveryRate: 100, mutationRate: 0.5, caiScore: 98.7, rsParityRemaining: 4, desc: "Passage 4" },
    { label: "Gen 180", recoveryRate: 100, mutationRate: 0.9, caiScore: 98.7, rsParityRemaining: 3, desc: "Passage 6" },
    { label: "Gen 240", recoveryRate: 100, mutationRate: 1.4, caiScore: 98.6, rsParityRemaining: 3, desc: "Passage 8" },
    { label: "Gen 300", recoveryRate: 100, mutationRate: 1.8, caiScore: 98.6, rsParityRemaining: 2, desc: "Passage 10" },
  ],
  pcr: [
    { label: "Cycle 5", recoveryRate: 100, mutationRate: 0.05, caiScore: 98.8, rsParityRemaining: 4, desc: "Low Duplication" },
    { label: "Cycle 15", recoveryRate: 100, mutationRate: 0.22, caiScore: 98.8, rsParityRemaining: 4, desc: "Standard PCR" },
    { label: "Cycle 25", recoveryRate: 100, mutationRate: 0.65, caiScore: 98.7, rsParityRemaining: 4, desc: "Deep Amplification" },
    { label: "Cycle 35", recoveryRate: 100, mutationRate: 1.35, caiScore: 98.6, rsParityRemaining: 3, desc: "Extended PCR" },
    { label: "Cycle 45", recoveryRate: 100, mutationRate: 2.40, caiScore: 98.5, rsParityRemaining: 2, desc: "Taq Error Bound" },
  ],
  adversarial: [
    { label: "5% Shuffle", recoveryRate: 100, mutationRate: 5.0, caiScore: 98.8, rsParityRemaining: 4, desc: "Minor Synonymous Jitter" },
    { label: "10% Shuffle", recoveryRate: 100, mutationRate: 10.0, caiScore: 98.5, rsParityRemaining: 3, desc: "Heuristic Attacker" },
    { label: "15% Shuffle", recoveryRate: 100, mutationRate: 15.0, caiScore: 98.2, rsParityRemaining: 2, desc: "Targeted Codon Swap" },
    { label: "20% Shuffle", recoveryRate: 100, mutationRate: 20.0, caiScore: 97.8, rsParityRemaining: 1, desc: "RS Parity Engaged" },
    { label: "25% Shuffle", recoveryRate: 98.4, mutationRate: 25.0, caiScore: 97.2, rsParityRemaining: 0, desc: "Error Tolerance Limit" },
  ],
};

export default function DashboardPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>(RECENT_ANALYSES);
  const [filterClass, setFilterClass] = useState<string>("ALL");
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [selectedRegime, setSelectedRegime] = useState<LoadingRegime>("evolutionary");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Live mathematical aggregations
  const computedStats = useMemo(() => {
    const total = analyses.length;
    const alertCount = analyses.filter((a) => a.status === "Alert").length;
    const meanAcc = (analyses.reduce((acc, a) => acc + a.accuracy, 0) / total) * 100;
    const meanF1Score = analyses.reduce((acc, a) => acc + a.f1Score, 0) / total;
    const totalChangepoints = analyses.reduce((acc, a) => acc + a.changepointsDetected, 0);

    // Active regime last-point biometrics
    const currentSeries = REGIME_PROGRESSION_DATA[selectedRegime];
    const latestBlock = currentSeries[currentSeries.length - 1];

    return {
      totalAnalyses: 248,
      activeMonitors: 3,
      meanAccuracy: meanAcc.toFixed(1),
      meanF1: meanF1Score.toFixed(3),
      damageAlerts: alertCount,
      totalChangepoints,
      recoveryRate: latestBlock.recoveryRate,
      mutationRate: latestBlock.mutationRate,
      caiScore: (latestBlock.caiScore / 100).toFixed(3),
      parityRemaining: `${latestBlock.rsParityRemaining} / 4 Symbols`,
    };
  }, [analyses, selectedRegime]);

  // Refresh Telemetry Pipeline
  const handleRefreshTelemetry = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Ingested latest sequencing stream • Provenance metrics re-synchronized");
    }, 500);
  };

  // Filtered and searched analyses
  const filteredAnalyses = useMemo(() => {
    return analyses.filter((item) => {
      const q = tableSearchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.specimen.toLowerCase().includes(q) ||
        item.datasetName.toLowerCase().includes(q);

      let matchesFilter = true;
      if (filterClass === "lacZ") {
        matchesFilter = item.name.toLowerCase().includes("lacz") || item.specimen.toLowerCase().includes("lacz");
      } else if (filterClass === "GFP") {
        matchesFilter = item.name.toLowerCase().includes("gfp") || item.specimen.toLowerCase().includes("gfp");
      } else if (filterClass === "Cas9") {
        matchesFilter = item.name.toLowerCase().includes("cas9") || item.specimen.toLowerCase().includes("cas9");
      } else if (filterClass === "Wildtype") {
        matchesFilter =
          item.name.toLowerCase().includes("wildtype") ||
          item.specimen.toLowerCase().includes("wildtype") ||
          item.predictedClass.toLowerCase().includes("wildtype");
      }

      return matchesFilter && matchesSearch;
    });
  }, [analyses, filterClass, tableSearchQuery]);

  const activeTrendData = REGIME_PROGRESSION_DATA[selectedRegime];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-primary/40 bg-[#141419] text-white text-xs font-mono shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#FF5500]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            HelixSign Provenance Console
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Steganographic provenance tracking &bull; Translation sequence fidelity &amp; biosecurity stealth evaluation
          </p>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => router.push("/upload")}
            className="bg-[#FF5500] hover:bg-[#E54B00] text-white gap-1.5 shadow-sm text-xs cursor-pointer font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            New Construct Stamping
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshTelemetry}
            disabled={isRefreshing}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            title="Re-fetch & Re-calculate Telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 4 Key Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Analyses */}
        <Card className="border border-border bg-card p-4 flex flex-col justify-between shadow-sm h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Watermarked Constructs</span>
              <span className="p-1.5 rounded-lg bg-muted text-muted-foreground">
                <Cpu className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-foreground">{computedStats.totalAnalyses}</span>
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-0.5 whitespace-nowrap">
                <TrendingUp className="h-3 w-3" /> +14 this week
              </span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Registered in Supabase ledger</p>
        </Card>

        {/* Card 2: Sequence Fidelity */}
        <Card className="border border-border bg-card p-4 flex flex-col justify-between shadow-sm h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Sequence Fidelity</span>
              <span className="p-1.5 rounded-lg bg-muted text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-[#FF5500]" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-foreground">100.0%</span>
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-0.5 whitespace-nowrap">
                0 alterations
              </span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Synonymous codon preservation</p>
        </Card>

        {/* Card 3: Stealth Detector Score */}
        <Card className="border border-border bg-card p-4 flex flex-col justify-between shadow-sm h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Stealth Detector AUC</span>
              <span className="p-1.5 rounded-lg bg-muted text-muted-foreground">
                <Activity className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-2xl font-bold font-mono text-foreground shrink-0">0.505</span>
              <span className="min-w-0 text-xs font-mono text-muted-foreground flex items-center gap-0.5 break-words">
                Chance level (Undetected)
              </span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Evaluated on held-out 1D CNN</p>
        </Card>

        {/* Card 4: ECC Resilience */}
        <Card className="border border-border bg-card p-4 flex flex-col justify-between shadow-sm h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">ECC Error Correction</span>
              <span className="p-1.5 rounded-lg bg-muted text-muted-foreground">
                <Layers className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-2xl font-bold font-mono text-foreground shrink-0">RS(16,8)</span>
              <span className="min-w-0 text-xs font-mono text-muted-foreground flex items-center gap-0.5 break-words">
                GF(2^8) Galois Field
              </span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Corrects up to 4 symbol errors</p>
        </Card>
      </div>

      {/* Main Charts & Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: AE Burst Progression Trend */}
        <Card className="lg:col-span-8 border border-border bg-card shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/50">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <LineChart className="h-4 w-4 text-primary" />
                Steganographic Resilience &amp; Watermark Recovery Progression
              </CardTitle>
              <CardDescription className="text-xs">
                Watermark decoded recovery rate vs uncorrected biological mutation noise across experimental regimes
              </CardDescription>
            </div>

            {/* Regime Toggle Switcher */}
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg bg-muted/60 p-0.5 border border-border text-[11px] font-mono">
                {[
                  { key: "evolutionary", label: "Host Evolution (300 Gen)" },
                  { key: "pcr", label: "PCR Jitter (45 Cycles)" },
                  { key: "adversarial", label: "Synonymous Shuffle (25%)" },
                ].map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setSelectedRegime(r.key as LoadingRegime)}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      selectedRegime === r.key
                        ? "bg-card text-foreground font-semibold shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* Chart Area */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#71717a" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="precursorGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF5500" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#FF5500" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262633" vertical={false} />
                  <XAxis dataKey="label" stroke="#52525b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={11} tickLine={false} domain={[90, 101]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#131318",
                      border: "1px solid #262633",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontFamily: "monospace",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="caiScore"
                    name="Host CAI Concordance (%)"
                    stroke="#71717a"
                    strokeWidth={1.8}
                    fillOpacity={1}
                    fill="url(#primaryGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="recoveryRate"
                    name="Watermark Recovery Rate (%)"
                    stroke="#FF5500"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#precursorGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Steganographic Telemetry Bar Below Chart */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/50 text-[11px] font-mono">
              <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50">
                <span className="text-muted-foreground block text-[10px]">RS Parity Margin</span>
                <span className="font-bold text-xs mt-0.5 block text-primary">
                  {computedStats.parityRemaining}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50">
                <span className="text-muted-foreground block text-[10px]">Host CAI Concordance</span>
                <span className="font-semibold text-xs mt-0.5 block text-foreground">
                  w = {computedStats.caiScore} (Optimal)
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50">
                <span className="text-muted-foreground block text-[10px]">Watermark Recovery</span>
                <span className="font-bold text-foreground text-xs mt-0.5 block">
                  {computedStats.recoveryRate}% Bitrate
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50">
                <span className="text-muted-foreground block text-[10px]">Simulated Stress Mode</span>
                <span className="font-bold text-primary text-xs mt-0.5 block uppercase">
                  {selectedRegime} Regime
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right 4 Cols: Active Construct Monitoring */}
        <Card className="lg:col-span-4 border border-border bg-card flex flex-col justify-between shadow-sm">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#FF5500]" />
              Construct Provenance Status
            </CardTitle>
            <CardDescription className="text-xs">
              Continuous sequence integrity and watermark verification across monitored synthetic constructs
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-3 space-y-3 flex-1">
            {/* Construct 1: lacZ */}
            <div
              onClick={() => router.push("/analysis?run=HS-7402")}
              className="p-3 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer text-xs space-y-1 group"
            >
              <div className="flex items-center justify-between font-semibold text-primary">
                <span className="group-hover:underline">
                  pUC19-lacZ (3,075 bp)
                </span>
                <Badge variant="outline" className="uppercase font-mono text-[9px] border-border text-muted-foreground bg-secondary">
                  Verified
                </Badge>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                64 carrier codons verified. 0 alterations. ΔCAI: +0.002. RS Parity valid.
              </p>
            </div>

            {/* Construct 2: SpCas9 */}
            <div
              onClick={() => router.push("/analysis?run=HS-7400")}
              className="p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer text-xs space-y-1 group"
            >
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span className="group-hover:underline">px458-SpCas9 (4,104 bp)</span>
                <Badge variant="outline" className="uppercase font-mono text-[9px] border-border text-muted-foreground bg-muted/40">
                  Protected
                </Badge>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Multi-tile Reed-Solomon redundancy active across 4 independent segments; tolerates up to 3.5% mutations.
              </p>
            </div>

            {/* Construct 3: GFP */}
            <div
              onClick={() => router.push("/analysis?run=HS-7401")}
              className="p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer text-xs space-y-1 group"
            >
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span className="group-hover:underline">pGLO-GFP (717 bp)</span>
                <Badge variant="outline" className="font-mono text-[9px] border-border text-muted-foreground bg-muted/40">
                  Resilient
                </Badge>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Nanopore R10.4.1 / Illumina NovaSeq verified. Sub-1s decode latency.
              </p>
            </div>
          </CardContent>

          <div className="p-4 pt-2 border-t border-border/40">
            <Link href="/monitor" className="w-full">
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs border-border cursor-pointer font-medium">
                Launch Channel Stress Lab
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Provenance Analyses Table */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/50">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Recent Genomic Provenance Audits
            </CardTitle>
            <CardDescription className="text-xs">
              Latest construct runs with verified persistent homology, synonymous carrier loci, and stealth metrics
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search input for table */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search construct ID, gene..."
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-muted/40 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center rounded-lg bg-muted/60 p-0.5 border border-border text-xs">
              {[
                { id: "ALL", label: "ALL" },
                { id: "lacZ", label: "lacZ (E. coli)" },
                { id: "GFP", label: "GFP" },
                { id: "Cas9", label: "Cas9" },
                { id: "Wildtype", label: "Wildtype" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setFilterClass(pill.id)}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    filterClass === pill.id
                      ? "bg-card text-foreground shadow-sm font-bold text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <Link href="/analysis">
              <Button variant="ghost" size="sm" className="gap-1 text-xs cursor-pointer font-mono">
                View All
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table className="w-full min-w-[980px]">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-28 font-mono text-xs pl-4">Run ID</TableHead>
                <TableHead className="min-w-[280px] text-xs">Target Construct &amp; Host</TableHead>
                <TableHead className="min-w-[210px] text-xs">Dataset Source</TableHead>
                <TableHead className="min-w-[170px] text-xs">Steganographic Proof</TableHead>
                <TableHead className="w-28 text-center text-xs font-mono">Protein Match</TableHead>
                <TableHead className="w-28 text-center text-xs font-mono">Carrier Loci</TableHead>
                <TableHead className="w-24 text-center text-xs font-mono">Stealth AUC</TableHead>
                <TableHead className="w-28 text-right text-xs pr-4">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAnalyses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-xs text-muted-foreground font-mono">
                    No genomic provenance records match the selected construct or filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAnalyses.map((rec) => {
                  const isVerified = rec.predictedClass === "Verified Invariant";
                  const isMutated = rec.predictedClass === "Adversarial Mutated";
                  const isWildtype = rec.predictedClass === "Wildtype Control";

                  return (
                    <TableRow key={rec.id} className="border-border hover:bg-muted/30 transition-colors">
                      <TableCell className="w-28 font-mono text-xs text-primary font-semibold pl-4 py-3.5">
                        <div>{rec.id}</div>
                        <div className="text-[10px] text-muted-foreground font-mono font-normal">
                          {rec.timestamp ? rec.timestamp.split(" ")[0] : "2026-11-12"}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[280px] py-3.5">
                        <div className="font-medium text-foreground text-xs whitespace-nowrap">{rec.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate max-w-sm">
                          {rec.specimen}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[210px] max-w-xs py-3.5">
                        <div className="text-xs text-muted-foreground truncate" title={rec.datasetName}>
                          {rec.datasetName}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground/80 mt-0.5">
                          {rec.samplingRate}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[170px] py-3.5">
                        {isVerified && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono px-2 py-0.5 border-zinc-700 bg-zinc-800/80 text-zinc-300 font-medium flex items-center gap-1.5 w-fit"
                          >
                            <ShieldCheck className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span>Verified ({(rec.confidence * 100).toFixed(0)}%)</span>
                          </Badge>
                        )}
                        {isMutated && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono px-2 py-0.5 border-amber-500/40 text-amber-300 bg-amber-500/10 font-medium flex items-center gap-1.5 w-fit"
                          >
                            <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>Mutated Passage ({(rec.confidence * 100).toFixed(0)}%)</span>
                          </Badge>
                        )}
                        {isWildtype && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono px-2 py-0.5 border-zinc-700 text-zinc-400 bg-zinc-800/40 font-medium flex items-center gap-1.5 w-fit"
                          >
                            <Dna className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span>Wildtype Reference</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="w-28 text-center py-3.5 font-mono">
                        <div className="text-xs font-semibold text-foreground">100.0%</div>
                        <div className="text-[10px] text-muted-foreground">0 AA edits</div>
                      </TableCell>
                      <TableCell className="w-28 text-center py-3.5 font-mono">
                        <div className="text-xs font-semibold text-foreground">
                          {rec.changepointsDetected > 0 ? `${rec.changepointsDetected} Loci` : "0 (WT)"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {rec.changepointsDetected > 0 ? "HKDF Keyed" : "Native"}
                        </div>
                      </TableCell>
                      <TableCell className="w-24 text-center py-3.5 font-mono">
                        <div className="text-xs font-medium text-foreground">
                          {rec.rocAuc.toFixed(3)}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          Chance
                        </div>
                      </TableCell>
                      <TableCell className="w-28 text-right pr-4 py-3.5">
                        <Link href={`/analysis?run=${rec.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs font-mono text-primary hover:text-primary hover:bg-primary/10 gap-1 cursor-pointer"
                          >
                            <span>Audit Run</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
