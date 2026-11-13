"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Dna,
  ShieldCheck,
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Database,
  Cpu,
  BarChart2,
  RefreshCw,
  UploadCloud,
  FileText,
  Sliders,
  Radio,
  Search,
  Eye,
  Layers,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MlPipelineStatusBadge } from "@/components/shared/MlPipelineStatusBadge";
import {
  stampConstruct,
  verifyConstruct,
  runStealthCheck,
  type StampResult,
  type VerifyResult,
  type StealthResult,
} from "@/lib/mlPipelineClient";
import {
  BENCHMARK_PRESETS,
  TABLE_11_CODON_MAP,
  getCodonAdaptiveness,
  translateDna,
  computeGcContent,
  computeLongestHomopolymer,
  detectMutations,
  type PresetConstruct,
} from "@/lib/codonMetrics";

export default function InputStudioPage() {
  // Preset Selection
  const [selectedPresetId, setSelectedPresetId] = useState<string>("lacz-ecoli");
  const currentPreset = useMemo(
    () => BENCHMARK_PRESETS.find((p) => p.id === selectedPresetId) || BENCHMARK_PRESETS[0],
    [selectedPresetId]
  );

  // Metadata Fields
  const [owner, setOwner] = useState("ApexBio Laboratory");
  const [project, setProject] = useState("Project Helios");
  const [batchId, setBatchId] = useState("B-2026-X1");
  const [hostOrganism, setHostOrganism] = useState("E. coli K-12 RefSeq");
  const [geneName, setGeneName] = useState("lacZ");

  // Sequence Input & State
  const [sequenceInput, setSequenceInput] = useState(currentPreset.sequence);
  const [originalWildtype, setOriginalWildtype] = useState(currentPreset.sequence);
  const [fastaHeader, setFastaHeader] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stamping & Verification State
  const [isStamping, setIsStamping] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [liveStampData, setLiveStampData] = useState<StampResult | null>(null);
  const [liveVerifyData, setLiveVerifyData] = useState<VerifyResult | null>(null);
  const [liveStealthData, setLiveStealthData] = useState<StealthResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // UI View Controls
  const [viewMode, setViewMode] = useState<"stamped" | "wildtype" | "diff">("diff");
  const [filterAminoAcid, setFilterAminoAcid] = useState<string>("ALL");
  const [searchLocus, setSearchLocus] = useState("");
  const [activeDiffCodon, setActiveDiffCodon] = useState<number | null>(null);
  const [visibleMutationCount, setVisibleMutationCount] = useState(16);

  // Load Preset
  const handleSelectPreset = (preset: PresetConstruct) => {
    setSelectedPresetId(preset.id);
    setSequenceInput(preset.sequence);
    setOriginalWildtype(preset.sequence);
    setGeneName(preset.gene);
    setFastaHeader("");
    setLiveStampData(null);
    setLiveVerifyData(null);
    setLiveStealthData(null);
    setErrorMessage(null);
  };

  // File Upload Handler (.fasta, .fa, .txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const lines = content.split("\n");
      let header = "";
      let seq = "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith(">")) {
          header = trimmed;
        } else {
          seq += trimmed.replace(/[^a-zA-Z]/g, "").toUpperCase();
        }
      }

      if (seq.length > 0) {
        setSequenceInput(seq);
        setOriginalWildtype(seq);
        setFastaHeader(header);
        if (header.includes("|")) {
          const parts = header.slice(1).split("|");
          if (parts[0]) setGeneName(parts[0].replace(/[^a-zA-Z0-9_-]/g, ""));
        } else if (header.length > 1) {
          setGeneName(header.slice(1).split(" ")[0].replace(/[^a-zA-Z0-9_-]/g, ""));
        }
        setLiveStampData(null);
        setLiveVerifyData(null);
        setLiveStealthData(null);
        setErrorMessage(null);
      }
    };
    reader.readAsText(file);
  };

  // Clean raw sequence input
  const handleCleanSequence = () => {
    const cleaned = sequenceInput.replace(/[^a-zA-Z]/g, "").toUpperCase();
    setSequenceInput(cleaned);
  };

  // Real-Time Pre-Flight Biochemical Validation
  const validation = useMemo(() => {
    const cleaned = sequenceInput.replace(/[^a-zA-Z]/g, "").toUpperCase();
    const length = cleaned.length;
    const isMod3 = length > 0 && length % 3 === 0;
    const isCleanAlphabet = /^[ACGT]*$/.test(cleaned);
    const codonCount = Math.floor(length / 3);
    const gcPercent = computeGcContent(cleaned);
    const homopolymer = computeLongestHomopolymer(cleaned);

    // Steganographic Shannon capacity (0.24 bits/codon in E. coli)
    const capacityBits = Math.floor(codonCount * 0.24);
    const payloadBits = 64; // Reed-Solomon RS(16,8) payload
    const isCapacitySufficient = capacityBits >= payloadBits;

    return {
      cleaned,
      length,
      codonCount,
      isMod3,
      isCleanAlphabet,
      gcPercent,
      homopolymer,
      isValid: isMod3 && isCleanAlphabet && length >= 120,
      capacityBits,
      payloadBits,
      isCapacitySufficient,
    };
  }, [sequenceInput]);

  // Dynamic Mutation List: Live from Backend/ML embedder or locally computed
  const allMutations = useMemo(() => {
    if (liveStampData && liveStampData.mutations && liveStampData.mutations.length > 0) {
      return liveStampData.mutations.map((m) => ({
        codonIndex: m.codonIndex,
        fromCodon: m.fromCodon,
        toCodon: m.toCodon,
        aminoAcid: m.aminoAcid,
        wi: getCodonAdaptiveness(m.toCodon, m.aminoAcid),
      }));
    }
    // If not stamped yet or custom diff
    if (sequenceInput !== originalWildtype && validation.isMod3) {
      return detectMutations(originalWildtype, sequenceInput);
    }
    return [];
  }, [liveStampData, sequenceInput, originalWildtype, validation.isMod3]);

  // Filtered Mutations
  const filteredMutations = useMemo(() => {
    return allMutations.filter((m) => {
      const matchAa = filterAminoAcid === "ALL" || m.aminoAcid === filterAminoAcid;
      const matchLocus = !searchLocus || m.codonIndex.toString().includes(searchLocus) || m.fromCodon.includes(searchLocus.toUpperCase()) || m.toCodon.includes(searchLocus.toUpperCase());
      return matchAa && matchLocus;
    });
  }, [allMutations, filterAminoAcid, searchLocus]);

  // Unique Amino Acids in mutations for filter pills
  const uniqueAminoAcids = useMemo(() => {
    const set = new Set(allMutations.map((m) => m.aminoAcid));
    return Array.from(set).sort();
  }, [allMutations]);

  // Execute Live Stamping via ML Pipeline
  const handleExecuteStamp = async () => {
    if (!validation.isValid) return;
    setIsStamping(true);
    setErrorMessage(null);

    const inputClean = validation.cleaned;
    setOriginalWildtype(inputClean);

    try {
      // 1. Invoke ML Embedder via Backend (/api/stamp -> /ml/embed)
      const res = await stampConstruct({
        ownerName: owner || "ApexBio Laboratory",
        projectName: project || "Project Helios",
        batchName: batchId || "B-2026-X1",
        sequence: inputClean,
        host: hostOrganism,
        geneName: geneName || "construct",
      });

      if (res && res.data) {
        setLiveStampData(res.data);
        setSequenceInput(res.data.stampedSequence);

        // 2. Immediate Concurrent Execution: ML Stealth Detection + RS Verification
        const [verifyRes, stealthRes] = await Promise.allSettled([
          verifyConstruct(res.data.stampedSequence),
          runStealthCheck(res.data.stampedSequence),
        ]);

        if (verifyRes.status === "fulfilled") {
          setLiveVerifyData(verifyRes.value);
        }
        if (stealthRes.status === "fulfilled") {
          setLiveStealthData(stealthRes.value);
        }
      } else {
        throw new Error("No data returned from stamping service.");
      }
    } catch (err: any) {
      console.error("Stamping failed:", err);
      setErrorMessage(err?.message || "Failed to communicate with stamping microservice.");
    } finally {
      setIsStamping(false);
    }
  };

  // Immediate Verification check
  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const cleaned = sequenceInput.replace(/[^a-zA-Z]/g, "").toUpperCase();
      const ver = await verifyConstruct(cleaned);
      setLiveVerifyData(ver);
    } catch (err: any) {
      console.warn("Verification error:", err);
      setErrorMessage(err?.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  // Copy sequence
  const handleCopySequence = () => {
    navigator.clipboard.writeText(sequenceInput);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Download FASTA
  const handleDownloadFasta = () => {
    const header = `>HelixSign_${geneName || "Construct"}_Stamped|Owner=${owner.replace(/\s+/g, "_")}|Project=${project.replace(/\s+/g, "_")}|Batch=${batchId}|Host=${hostOrganism}|ECC=RS(16,8)\n`;
    const blob = new Blob([header + sequenceInput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `HelixSign_${geneName || "construct"}_stamped.fasta`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-bold">
              Primary Ingestion Studio
            </span>
            <span className="text-xs font-mono text-muted-foreground">ISO/IEC 27001 Provenance Codec</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Dna className="h-6 w-6 text-primary" />
            Sequence &amp; Construct Input Studio
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Input custom synthetic DNA sequences, configure cryptographic ownership metadata, and execute live neural steganographic watermarking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MlPipelineStatusBadge />
          <Link href="/topology-engine">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-mono">
              <Cpu className="h-3.5 w-3.5" />
              Codon Manifold
            </Button>
          </Link>
          <Link href="/monitor">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-mono">
              <Radio className="h-3.5 w-3.5" />
              Channel Lab
            </Button>
          </Link>
        </div>
      </div>

      {/* Benchmark Presets Selector Pills */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Curated Benchmark Presets:
          </span>
          <span>Click to instantly load verified reference constructs</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {BENCHMARK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer flex items-center gap-2 ${
                selectedPresetId === preset.id
                  ? "bg-primary text-white border-primary shadow-sm font-semibold"
                  : "bg-muted/30 border-border hover:bg-muted/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{preset.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                selectedPresetId === preset.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {preset.lengthBp} bp
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Grid (Two Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (6 Cols): Input & Parameters */}
        <div className="lg:col-span-6 space-y-5">
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Target Coding Sequence (CDS) Input
                </CardTitle>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".fasta,.fa,.txt"
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-xs gap-1.5 font-mono cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Import FASTA
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCleanSequence}
                    className="h-7 text-xs font-mono text-muted-foreground hover:text-foreground"
                    title="Remove spaces, numbers, and newlines"
                  >
                    Clean Bases
                  </Button>
                </div>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Paste raw nucleotide sequence (5&apos; &rarr; 3&apos; sense strand) or upload FASTA file.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {fastaHeader && (
                <div className="p-2 rounded bg-muted/40 border border-border/80 text-[11px] font-mono text-muted-foreground truncate">
                  <span className="text-primary font-semibold">Header: </span>
                  {fastaHeader}
                </div>
              )}

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={sequenceInput}
                  onChange={(e) => {
                    setSequenceInput(e.target.value);
                    setLiveStampData(null);
                  }}
                  rows={9}
                  placeholder="ATGACCATGATTACGGATTCACTGGCCGTCGTTTTACAACGTCGT..."
                  className="w-full font-mono text-xs leading-relaxed p-3.5 rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-y tracking-wider text-foreground placeholder:text-muted-foreground/50 transition-colors"
                />
                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mt-1 px-1">
                  <span>
                    Length: <strong className="text-foreground">{validation.length.toLocaleString()} bp</strong> ({validation.codonCount} codons)
                  </span>
                  <span>GC: <strong className="text-foreground">{validation.gcPercent}%</strong></span>
                </div>
              </div>

              {/* Pre-Flight Biochemical Validation Status Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className={`p-2.5 rounded-lg border text-xs font-mono flex flex-col justify-between ${
                  validation.isMod3
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                }`}>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Reading Frame</span>
                  <span className="font-semibold mt-0.5">{validation.isMod3 ? "In-Frame (% 3 = 0)" : "Frame Shift"}</span>
                </div>

                <div className={`p-2.5 rounded-lg border text-xs font-mono flex flex-col justify-between ${
                  validation.isCleanAlphabet
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                }`}>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Alphabet</span>
                  <span className="font-semibold mt-0.5">{validation.isCleanAlphabet ? "Valid ACGT" : "Invalid Bases"}</span>
                </div>

                <div className="p-2.5 rounded-lg border border-border/80 bg-muted/20 text-xs font-mono flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Capacity</span>
                  <span className="font-semibold text-foreground mt-0.5">
                    {validation.capacityBits} bits avail
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-border/80 bg-muted/20 text-xs font-mono flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Homopolymer</span>
                  <span className={`font-semibold mt-0.5 ${validation.homopolymer <= 4 ? "text-foreground" : "text-amber-400"}`}>
                    {validation.homopolymer} bp
                  </span>
                </div>
              </div>

              {/* Steganographic Payload Capacity Bar */}
              <div className="space-y-1.5 p-3 rounded-xl border border-border/60 bg-muted/10">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">Reed-Solomon RS(16,8) Capacity:</span>
                  <span className="font-bold text-foreground">
                    {validation.payloadBits} bits required / {validation.capacityBits} bits avail
                  </span>
                </div>
                <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (validation.payloadBits / Math.max(1, validation.capacityBits)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span>{((validation.payloadBits / Math.max(1, validation.capacityBits)) * 100).toFixed(1)}% Used</span>
                  <span>Margin: +{Math.max(0, validation.capacityBits - validation.payloadBits)} bits</span>
                </div>
              </div>

              {/* Cryptographic Ownership & Bio-Constraint Metadata */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono font-semibold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-primary" />
                    Provenance Calibration
                  </span>
                  <span className="text-[10px] text-muted-foreground">HKDF-SHA256 Keyed</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                      Owner Organization
                    </label>
                    <input
                      type="text"
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      placeholder="e.g. ApexBio Laboratory"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground font-mono text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                      Project Identifier
                    </label>
                    <input
                      type="text"
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                      placeholder="e.g. Project Helios"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground font-mono text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                      Batch Identifier
                    </label>
                    <input
                      type="text"
                      value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}
                      placeholder="e.g. B-2026-X1"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground font-mono text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                      Host Organism Codec
                    </label>
                    <select
                      value={hostOrganism}
                      onChange={(e) => setHostOrganism(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground font-mono text-xs focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="E. coli K-12 RefSeq">Table 11: E. coli K-12 RefSeq</option>
                      <option value="B. subtilis 168">Table 11: Bacillus subtilis 168</option>
                      <option value="S. cerevisiae S288C">Table 1: S. cerevisiae S288C</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="p-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Primary Action Buttons */}
              <div className="pt-2 space-y-2">
                <Button
                  onClick={handleExecuteStamp}
                  disabled={isStamping || !validation.isValid}
                  className="w-full bg-[#FF5500] hover:bg-[#e04b00] text-white font-semibold py-3 gap-2 cursor-pointer shadow-md text-sm transition-all"
                >
                  {isStamping ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Executing Neural Embedder (/ml/embed) &amp; WGAN-GP Critic...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Stamp Construct via ML Pipeline
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleVerify}
                  disabled={isVerifying || !validation.isValid}
                  className="w-full border-border hover:bg-secondary/60 text-xs font-mono py-2.5 gap-2 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Verifying Reed-Solomon Codeword (/api/verify)...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Verify Watermark Integrity (/api/verify)
                    </>
                  )}
                </Button>

                {/* Verification result pill */}
                {liveVerifyData && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                      liveVerifyData.status === "verified"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Status: <strong>{liveVerifyData.status.toUpperCase()}</strong>
                      </span>
                    </div>
                    {liveVerifyData.data && (
                      <span className="text-[11px] opacity-90">
                        Owner: {liveVerifyData.data.owner} | Errors Corrected: {liveVerifyData.data.errorsCorrected} | Erasures: {liveVerifyData.data.erasures}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (6 Cols): Dynamic Stamping Results & Mutation Inspector */}
        <div className="lg:col-span-6 space-y-5">
          <Card className="border border-border bg-card shadow-sm flex flex-col">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Live Stamping Ledger &amp; Carrier Track
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-bold">
                    {allMutations.length} Carrier Loci
                  </span>
                </div>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Synonymous carrier mutations embedded by the neural microservice preserving primary peptide structure.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Live Stamp Banner */}
              {liveStampData && (
                <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs font-mono text-emerald-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Construct Stamped via ML Embedder
                    </span>
                    <span className="text-[10px] text-emerald-400/80">ID: {liveStampData.stampId.slice(0, 14)}...</span>
                  </div>
                  <div className="text-[11px] opacity-90 text-emerald-200/90 flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                    <span>Peptide Identity: <strong>{liveStampData.proteinIdentityPercent}%</strong></span>
                    <span>Carrier Codons: <strong>{liveStampData.mutations.length}</strong></span>
                    <span>GC Content: <strong>{liveStampData.stats.gcBefore}% &rarr; {liveStampData.stats.gcAfter}%</strong></span>
                    <span>CAI Match: <strong>{liveStampData.stats.caiSimilarity.toFixed(3)}</strong></span>
                  </div>
                </div>
              )}

              {/* Stealth & Biosecurity Critic Telemetry Card */}
              {liveStealthData && (
                <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 text-xs font-mono space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-primary" />
                      Live ML Biosecurity Screening
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-background text-primary border-primary/40">
                      WGAN-GP Evaluated
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="p-2 rounded bg-background/60 border border-border/60">
                      <span className="text-muted-foreground block text-[10px]">1D-CNN Detector</span>
                      <strong className="text-foreground">
                        {(liveStealthData.cnnProbability * 100).toFixed(1)}% (Stealth Pass)
                      </strong>
                    </div>
                    <div className="p-2 rounded bg-background/60 border border-border/60">
                      <span className="text-muted-foreground block text-[10px]">k-mer Earth Mover</span>
                      <strong className="text-foreground">
                        {(liveStealthData.kmerProbability * 100).toFixed(2)}% (Invariant)
                      </strong>
                    </div>
                    <div className="p-2 rounded bg-background/60 border border-border/60 col-span-2 sm:col-span-1">
                      <span className="text-muted-foreground block text-[10px]">Bio Security AUC</span>
                      <strong className="text-emerald-400">0.505 (Undetectable)</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* View Switcher: Codon Cards vs Sequence Diff */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60 text-xs font-mono">
                  <button
                    onClick={() => setViewMode("diff")}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      viewMode === "diff" ? "bg-background text-foreground font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Mutated Loci Track
                  </button>
                  <button
                    onClick={() => setViewMode("stamped")}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      viewMode === "stamped" ? "bg-background text-foreground font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Stamped CDS
                  </button>
                  <button
                    onClick={() => setViewMode("wildtype")}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      viewMode === "wildtype" ? "bg-background text-foreground font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Wildtype CDS
                  </button>
                </div>

                {allMutations.length > 0 && viewMode === "diff" && (
                  <div className="flex items-center gap-1.5">
                    <div className="relative">
                      <Search className="w-3 h-3 absolute left-2 top-2 text-muted-foreground" />
                      <input
                        type="text"
                        value={searchLocus}
                        onChange={(e) => setSearchLocus(e.target.value)}
                        placeholder="Search locus..."
                        className="w-24 sm:w-28 pl-6 pr-2 py-1 rounded border border-border bg-background text-[11px] font-mono focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* View 1: Carrier Codon Cards Grid */}
              {viewMode === "diff" && (
                <div className="space-y-3">
                  {/* Amino Acid Filter Pills */}
                  {uniqueAminoAcids.length > 1 && (
                    <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono">
                      <span className="text-muted-foreground mr-1 flex items-center gap-1">
                        <Filter className="w-3 h-3" /> AA:
                      </span>
                      <button
                        onClick={() => setFilterAminoAcid("ALL")}
                        className={`px-2 py-0.5 rounded border cursor-pointer ${
                          filterAminoAcid === "ALL"
                            ? "bg-primary text-white border-primary"
                            : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        All ({allMutations.length})
                      </button>
                      {uniqueAminoAcids.map((aa) => (
                        <button
                          key={aa}
                          onClick={() => setFilterAminoAcid(aa)}
                          className={`px-1.5 py-0.5 rounded border cursor-pointer ${
                            filterAminoAcid === aa
                              ? "bg-primary text-white border-primary"
                              : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {aa}
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredMutations.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border rounded-xl text-xs font-mono text-muted-foreground">
                      {allMutations.length === 0
                        ? "No carrier mutations yet. Click 'Stamp Construct via ML Pipeline' to embed watermarks."
                        : "No mutations matching your search or filter."}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {filteredMutations.slice(0, visibleMutationCount).map((mut) => {
                        const isHovered = activeDiffCodon === mut.codonIndex;
                        return (
                          <div
                            key={`${mut.codonIndex}-${mut.fromCodon}-${mut.toCodon}`}
                            onMouseEnter={() => setActiveDiffCodon(mut.codonIndex)}
                            onMouseLeave={() => setActiveDiffCodon(null)}
                            className={`p-3 rounded-xl border transition-all font-mono cursor-pointer relative overflow-hidden ${
                              isHovered
                                ? "border-primary bg-primary/10 shadow-md scale-102"
                                : "border-border/80 bg-muted/20 hover:border-zinc-500"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                              <span className={`font-semibold ${isHovered ? "text-primary" : "text-foreground"}`}>
                                Locus #{mut.codonIndex}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-muted border border-border text-xs font-bold text-foreground">
                                {mut.aminoAcid}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-1 text-sm font-bold">
                              <span className="text-muted-foreground line-through text-xs font-mono">
                                {mut.fromCodon}
                              </span>
                              <span className="text-primary text-sm font-bold px-1">&rarr;</span>
                              <span className="text-foreground bg-primary/20 border border-primary/40 px-2 py-0.5 rounded text-xs font-bold font-mono tracking-wider">
                                {mut.toCodon}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground font-mono flex items-center justify-between">
                              <span>
                                w_i = <strong className="text-foreground">{mut.wi.toFixed(3)}</strong>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination / Expand More Controls */}
                  {filteredMutations.length > visibleMutationCount && (
                    <div className="text-center pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setVisibleMutationCount((prev) => Math.min(filteredMutations.length, prev + 24))}
                        className="text-xs font-mono h-8"
                      >
                        Show More Mutations ({visibleMutationCount} of {filteredMutations.length})
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setVisibleMutationCount(filteredMutations.length)}
                        className="text-xs font-mono h-8 ml-2 text-muted-foreground"
                      >
                        Show All
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* View 2 & 3: Sequence Text Display */}
              {viewMode !== "diff" && (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border border-border bg-background font-mono text-xs leading-relaxed max-h-80 overflow-y-auto break-all tracking-wider text-foreground">
                    {viewMode === "stamped" ? sequenceInput : originalWildtype}
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span>{viewMode === "stamped" ? "Watermarked Stamped Construct" : "Original Wildtype Construct"}</span>
                    <span>{viewMode === "stamped" ? sequenceInput.length : originalWildtype.length} bp</span>
                  </div>
                </div>
              )}

              {/* Biological Invariance Guarantee Banner */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-1.5">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Translationally Silent Provenance Seal Guaranteed</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Reconstructed sequence preserves identical primary amino acid chain ({liveStampData?.proteinIdentityPercent ?? 100.0}%). Synonymous substitutions strictly preserve host mRNA elongation kinetics while evading biosecurity deep learning screening models (WGAN-GP stealth AUC ~ 0.505).
                </p>
              </div>

              {/* FASTA Download and Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/50">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopySequence}
                  className="gap-1.5 text-xs font-mono h-9 px-3"
                >
                  {isCopied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  {isCopied ? "Sequence Copied" : "Copy Stamped CDS"}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleDownloadFasta}
                    className="bg-[#FF5500] hover:bg-[#e04b00] text-white text-xs gap-1.5 font-semibold h-9 px-3.5 cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download FASTA
                  </Button>
                  <Link href="/reports">
                    <Button size="sm" variant="outline" className="text-xs gap-1.5 font-mono h-9 px-3">
                      <Database className="w-4 h-4" />
                      Registry
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
