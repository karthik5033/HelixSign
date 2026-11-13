"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Database,
  Download,
  ExternalLink,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  FileCode,
  HardDrive,
  Info,
  Search,
  Plus,
  Play,
  Pause,
  Copy,
  Check,
  X,
  Radio,
  Activity,
  FileText,
  UploadCloud,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MlPipelineStatusBadge } from "@/components/shared/MlPipelineStatusBadge";
import { DATASETS_LIBRARY, AeDatasetItem } from "@/lib/echosenseData";
import { downloadDataAsCsv } from "@/lib/utils";

interface SampleEvent {
  id: string;
  datasetId: string;
  mode: string;
  caiScore: number;    // Codon Adaptation Index (e.g. 0.988)
  gcContent: number;   // GC Content % (e.g. 52.4%)
  lengthBp: number;    // Length in bp (e.g. 3075 bp)
  carrierCount: number;// Synonymous carrier loci count
  stealthAuc: number;  // Deep learning discriminator AUC (0.505 = Chance)
  timestamp: string;   // Biological reference
}

const SAMPLE_EVENTS: Record<string, SampleEvent[]> = {
  "ds-ecoli-k12": [
    {
      id: "GENE-lacZ",
      datasetId: "ds-ecoli-k12",
      mode: "Metabolic Enzymes",
      caiScore: 0.988,
      gcContent: 52.4,
      lengthBp: 3075,
      carrierCount: 64,
      stealthAuc: 0.505,
      timestamp: "E. coli K-12 MG1655 / lac operon (3,075 bp)",
    },
    {
      id: "GENE-recA",
      datasetId: "ds-ecoli-k12",
      mode: "Transcription Factors",
      caiScore: 0.992,
      gcContent: 51.2,
      lengthBp: 1062,
      carrierCount: 32,
      stealthAuc: 0.498,
      timestamp: "E. coli K-12 MG1655 / SOS response (1,062 bp)",
    },
    {
      id: "GENE-rpoB",
      datasetId: "ds-ecoli-k12",
      mode: "Structural Ribosomal",
      caiScore: 0.985,
      gcContent: 53.1,
      lengthBp: 4029,
      carrierCount: 128,
      stealthAuc: 0.502,
      timestamp: "E. coli K-12 MG1655 / RNA Pol β (4,029 bp)",
    },
    {
      id: "GENE-dnaA",
      datasetId: "ds-ecoli-k12",
      mode: "Membrane Transporters",
      caiScore: 0.976,
      gcContent: 50.8,
      lengthBp: 1404,
      carrierCount: 48,
      stealthAuc: 0.510,
      timestamp: "E. coli K-12 MG1655 / Replication Initiator (1,404 bp)",
    },
  ],
  "ds-synthetic-biobricks": [
    {
      id: "GENE-sfGFP",
      datasetId: "ds-synthetic-biobricks",
      mode: "Reporter Constructs (GFP/RFP)",
      caiScore: 0.994,
      gcContent: 49.5,
      lengthBp: 717,
      carrierCount: 24,
      stealthAuc: 0.503,
      timestamp: "iGEM BioBrick BBa_E0040 / sfGFP (717 bp)",
    },
    {
      id: "GENE-spCas9",
      datasetId: "ds-synthetic-biobricks",
      mode: "CRISPR-Cas Endonucleases",
      caiScore: 0.981,
      gcContent: 48.2,
      lengthBp: 4104,
      carrierCount: 128,
      stealthAuc: 0.507,
      timestamp: "S. pyogenes / Cas9 Vector (4,104 bp)",
    },
    {
      id: "GENE-mCherry",
      datasetId: "ds-synthetic-biobricks",
      mode: "Reporter Constructs (GFP/RFP)",
      caiScore: 0.989,
      gcContent: 51.0,
      lengthBp: 711,
      carrierCount: 24,
      stealthAuc: 0.501,
      timestamp: "pET-28a Expression Plasmid / mCherry (711 bp)",
    },
  ],
  "ds-yeast-s288c": [
    {
      id: "GENE-ura3",
      datasetId: "ds-yeast-s288c",
      mode: "Eukaryotic Model Coding Regions",
      caiScore: 0.982,
      gcContent: 40.1,
      lengthBp: 804,
      carrierCount: 28,
      stealthAuc: 0.504,
      timestamp: "S. cerevisiae S288C / URA3 (804 bp)",
    },
    {
      id: "GENE-act1",
      datasetId: "ds-yeast-s288c",
      mode: "Eukaryotic Model Coding Regions",
      caiScore: 0.995,
      gcContent: 44.6,
      lengthBp: 1128,
      carrierCount: 36,
      stealthAuc: 0.499,
      timestamp: "S. cerevisiae S288C / ACT1 Actin (1,128 bp)",
    },
  ],
};

export default function DatasetsPage() {
  const router = useRouter();
  const [datasets, setDatasets] = useState<AeDatasetItem[]>(DATASETS_LIBRARY);
  const [selectedDataset, setSelectedDataset] = useState<AeDatasetItem>(DATASETS_LIBRARY[0]);
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Partitioning state
  const [trainSplit, setTrainSplit] = useState(70);
  const [valSplit, setValSplit] = useState(15);
  const testSplit = Math.max(5, 100 - trainSplit - valSplit);
  const [holdoutSpecimen, setHoldoutSpecimen] = useState("E. coli K-12 (MG1655 Essential Genes Holdout)");

  // Interactive sample event
  const availableEvents = useMemo(() => {
    const list = SAMPLE_EVENTS[selectedDataset.id] || SAMPLE_EVENTS["ds-ecoli-k12"];
    if (selectedModeFilter === "ALL") return list;
    return list.filter((e) => e.mode.toLowerCase().includes(selectedModeFilter.toLowerCase()));
  }, [selectedDataset.id, selectedModeFilter]);

  const [activeEvent, setActiveEvent] = useState<SampleEvent>(
    SAMPLE_EVENTS["ds-ecoli-k12"][0]
  );

  // Synchronize active event when dataset changes
  const handleSelectDataset = (ds: AeDatasetItem) => {
    setSelectedDataset(ds);
    setSelectedModeFilter("ALL");
    const events = SAMPLE_EVENTS[ds.id] || SAMPLE_EVENTS["ds-ecoli-k12"];
    if (events && events.length > 0) {
      setActiveEvent(events[0]);
    }
  };

  // Waveform playback animation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);

  React.useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPlayProgress((prev) => (prev >= 1 ? 0 : prev + 0.05));
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Copy citation state
  const [hasCopiedCitation, setHasCopiedCitation] = useState(false);
  const handleCopyCitation = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${selectedDataset.source} — ${selectedDataset.citation}`);
      setHasCopiedCitation(true);
      showToast("Citation copied to clipboard");
      setTimeout(() => setHasCopiedCitation(false), 2000);
    }
  };

  // Pipeline execution transition
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const handleRunPipeline = () => {
    setIsRunningPipeline(true);
    showToast(`Initializing HelixSign steganographic pipeline on ${selectedDataset.name}...`);
    setTimeout(() => {
      router.push(`/analysis?dataset=${selectedDataset.id}`);
    }, 600);
  };

  // Export Manifest
  const handleExportManifest = () => {
    downloadDataAsCsv("helixsign_genomic_datasets_manifest.csv", datasets);
    showToast("Exported manifest: helixsign_genomic_datasets_manifest.csv");
  };

  // Download Dataset Metadata
  const handleDownloadDataset = (ds: AeDatasetItem) => {
    const jsonStr = `data:text/json;charset=utf-8,` + encodeURIComponent(JSON.stringify(ds, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonStr);
    downloadAnchor.setAttribute("download", `${ds.id}_descriptor.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Downloaded ${ds.id}_descriptor.json`);
  };

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState("");
  const [newDatasetSource, setNewDatasetSource] = useState("");
  const [newDatasetFormat, setNewDatasetFormat] = useState("FASTA / GenBank Flatfile");
  const [newDatasetFreq, setNewDatasetFreq] = useState("Standard Bacterial Genetic Code");
  const [newDatasetEvents, setNewDatasetEvents] = useState("4312");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleRegisterDataset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDatasetName) return;

    const newId = `ds-custom-${Date.now().toString().slice(-4)}`;
    const created: AeDatasetItem = {
      id: newId,
      name: newDatasetName,
      source: newDatasetSource || "User Local Genomic Ingestion",
      citation: `HelixSign Custom Ingestion Protocol (Registered ${new Date().toLocaleDateString()})`,
      format: newDatasetFormat,
      size: uploadedFileName ? "45 MB" : "12 MB",
      eventsCount: parseInt(newDatasetEvents) || 4000,
      classes: ["Metabolic Enzymes", "Transcription Factors", "Membrane Transporters"],
      samplingFrequency: newDatasetFreq,
      description: `User-imported benchmark genomic corpus: ${newDatasetName}. Calibrated for synonymous codon steganography and WGAN-GP refinement.`,
      preloaded: false,
      status: "Ready",
    };

    setDatasets((prev) => [created, ...prev]);
    setSelectedDataset(created);
    setIsUploadModalOpen(false);
    setNewDatasetName("");
    setNewDatasetSource("");
    setUploadedFileName(null);
    showToast(`Successfully registered new corpus: ${created.name}`);
  };

  // Filtered dataset library
  const filteredDatasets = useMemo(() => {
    return datasets.filter((ds) => {
      const q = searchQuery.toLowerCase();
      return (
        ds.name.toLowerCase().includes(q) ||
        ds.source.toLowerCase().includes(q) ||
        ds.format.toLowerCase().includes(q) ||
        ds.samplingFrequency.toLowerCase().includes(q)
      );
    });
  }, [datasets, searchQuery]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full select-none">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-primary/40 bg-[#141419] text-white text-xs font-mono shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#FF5500]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              Genomic CDS Datasets Library
            </h1>
            <MlPipelineStatusBadge />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Annotated bacterial reference strains, synthetic BioBrick expression cassettes, and eukaryotic model open reading frames
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs border-border text-muted-foreground bg-muted/30">
            {datasets.length} Verified Genomes
          </Badge>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search corpora by name, frequency, citation, or format..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-muted/30 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span>Active Selection:</span>
          <span className="font-bold text-foreground truncate max-w-[220px]">
            {selectedDataset.name}
          </span>
        </div>
      </div>

      {/* Dataset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filteredDatasets.map((ds) => {
          const isSelected = selectedDataset.id === ds.id;
          return (
            <Card
              key={ds.id}
              onClick={() => handleSelectDataset(ds)}
              className={`p-5 cursor-pointer transition-all flex flex-col justify-between relative group ${
                isSelected
                  ? "border-2 border-[#FF5500] bg-card shadow-lg ring-1 ring-[#FF5500]/20"
                  : "border-border hover:border-primary/40 bg-card hover:bg-muted/30"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/10">
                    {ds.format}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground font-medium">{ds.size}</span>
                </div>

                <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                  {ds.name}
                </h3>
                <p className="text-[11px] text-muted-foreground font-mono mt-1">{ds.source}</p>

                <p className="mt-3 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {ds.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-foreground font-semibold">
                    {ds.eventsCount.toLocaleString()} Events
                  </span>
                  <span className="text-muted-foreground">{ds.samplingFrequency}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono uppercase text-primary font-bold">
                    {isSelected ? "● Selected Corpus" : "Click to Inspect"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadDataset(ds);
                    }}
                    className="text-[11px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                    title="Download Dataset Descriptor JSON"
                  >
                    <Download className="w-3 h-3" />
                    <span>Descriptor</span>
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected Dataset Detail Inspection Panel */}
      <Card className="border border-border bg-card p-6 shadow-xl space-y-6">
        {/* Panel Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-4 border-b border-border/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">{selectedDataset.name}</h2>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {selectedDataset.status}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Source: {selectedDataset.source}</span>
              <span>&bull;</span>
              <span className="font-mono text-primary flex items-center gap-1">
                Citation: {selectedDataset.citation}
                <button
                  onClick={handleCopyCitation}
                  className="hover:text-foreground transition-colors p-1 cursor-pointer"
                  title="Copy Citation & DOI"
                >
                  {hasCopiedCitation ? <Check className="w-3 h-3 text-[#FF5500]" /> : <Copy className="w-3 h-3" />}
                </button>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleRunPipeline}
              disabled={isRunningPipeline}
              className="bg-[#FF5500] hover:bg-[#E54B00] text-white text-xs gap-1.5 cursor-pointer shadow-md"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isRunningPipeline ? "Launching Pipeline..." : "Run Pipeline on this Dataset"}
            </Button>
          </div>
        </div>

        {/* 2-Column Main Inspector: Left Signal Preview, Right Partitioning & Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (7 cols): Classified CDS & Codon Relative Adaptiveness Canvas */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Functional Classes Filter Pill Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-foreground font-semibold uppercase tracking-wider text-[11px]">
                  Annotated Functional CDS Classes
                </span>
                <span className="text-muted-foreground text-[11px]">
                  Click class to filter sample constructs
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedModeFilter("ALL")}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                    selectedModeFilter === "ALL"
                      ? "bg-[#FF5500] text-white font-bold"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border"
                  }`}
                >
                  ALL CLASSES
                </button>
                {selectedDataset.classes.map((cls) => {
                  const isFiltered = selectedModeFilter === cls;
                  return (
                    <button
                      key={cls}
                      onClick={() => {
                        setSelectedModeFilter(cls);
                        const match = (SAMPLE_EVENTS[selectedDataset.id] || []).find((e) =>
                          e.mode.toLowerCase().includes(cls.toLowerCase())
                        );
                        if (match) setActiveEvent(match);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isFiltered
                          ? "bg-[#FF5500] text-white font-bold"
                          : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isFiltered ? "bg-white" : "bg-primary"}`} />
                      <span>{cls}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Benchmark Waveform Oscilloscope Preview */}
            <div className="rounded-xl border border-border bg-[#0a0a0f] p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/40 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#FF5500]" />
                  <span className="font-bold text-foreground">{activeEvent.id}</span>
                  <span className="text-muted-foreground">({activeEvent.mode})</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="h-6 px-2 text-[11px] font-mono text-muted-foreground hover:text-foreground cursor-pointer gap-1"
                  >
                    {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    <span>{isPlaying ? "Pause" : "Simulate Codon Scan"}</span>
                  </Button>
                </div>
              </div>

              {/* Codon Relative Adaptiveness & Carrier Trajectory SVG */}
              <div className="relative h-44 w-full flex items-center justify-center">
                <svg viewBox="0 0 600 180" className="w-full h-full select-none">
                  {/* Grid Lines */}
                  <line x1="45" y1="30" x2="585" y2="30" stroke="#222230" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="45" y1="85" x2="585" y2="85" stroke="#181824" strokeWidth="0.8" strokeDasharray="2,2" />
                  <line x1="45" y1="140" x2="585" y2="140" stroke="#222230" strokeWidth="1" strokeDasharray="3,3" />

                  <text x="8" y="34" fill="#71717a" fontSize="8" fontFamily="monospace">w = 1.00</text>
                  <text x="8" y="89" fill="#71717a" fontSize="8" fontFamily="monospace">w = 0.85</text>
                  <text x="8" y="144" fill="#71717a" fontSize="8" fontFamily="monospace">w = 0.70</text>

                  {/* Safe Host Adaptiveness Threshold Line (w_min = 0.85) */}
                  <line x1="45" y1="85" x2="585" y2="85" stroke="#FF5500" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
                  <text x="490" y="78" fill="#FF5500" fontSize="8" fontFamily="monospace">w_min = 0.85 (Safe)</text>

                  {/* Biological Codon Relative Adaptiveness wi Curve */}
                  <path
                    d={(() => {
                      const points = 120;
                      let d = "";
                      for (let i = 0; i < points; i++) {
                        const x = 45 + (i / (points - 1)) * 540;
                        // Realistic biological codon adaptiveness based on actual CAI
                        const baseW = activeEvent.caiScore - 0.04 + 0.035 * Math.sin(i * 0.18) + (Math.cos(i * 0.35) * 0.02);
                        const wi = Math.max(0.72, Math.min(1.0, baseW));
                        // Map wi [0.70, 1.00] to Y [140, 30]
                        const y = 140 - ((wi - 0.70) / 0.30) * 110;
                        d += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
                      }
                      return d;
                    })()}
                    fill="none"
                    stroke="#FF5500"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />

                  {/* Synonymous Carrier Codon Markers */}
                  {[...Array(12)].map((_, cIdx) => {
                    const cI = cIdx * 9 + 8;
                    const x = 45 + (cI / 119) * 540;
                    const baseW = activeEvent.caiScore - 0.04 + 0.035 * Math.sin(cI * 0.18) + (Math.cos(cI * 0.35) * 0.02);
                    const wi = Math.max(0.72, Math.min(1.0, baseW));
                    const y = 140 - ((wi - 0.70) / 0.30) * 110;
                    return (
                      <circle
                        key={`carrier-dot-${cIdx}`}
                        cx={x}
                        cy={y}
                        r="3"
                        fill="#FF5500"
                        stroke="#ffffff"
                        strokeWidth="0.8"
                      />
                    );
                  })}

                  {/* Playhead indicator */}
                  {isPlaying && (
                    <line
                      x1={45 + playProgress * 540}
                      y1="20"
                      x2={45 + playProgress * 540}
                      y2="155"
                      stroke="#ffffff"
                      strokeWidth="1.2"
                      opacity="0.8"
                    />
                  )}
                </svg>
              </div>

              {/* Event Parameter Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/40 text-[11px] font-mono">
                <div className="p-2 rounded bg-muted/30">
                  <span className="text-[10px] text-muted-foreground block">Codon Adaptation (CAI)</span>
                  <span className="text-foreground font-bold">{activeEvent.caiScore}</span>
                </div>
                <div className="p-2 rounded bg-muted/30">
                  <span className="text-[10px] text-muted-foreground block">GC Content</span>
                  <span className="text-foreground font-bold">{activeEvent.gcContent}%</span>
                </div>
                <div className="p-2 rounded bg-muted/30">
                  <span className="text-[10px] text-muted-foreground block">CDS Length</span>
                  <span className="text-foreground font-bold">{activeEvent.lengthBp} bp</span>
                </div>
                <div className="p-2 rounded bg-muted/30">
                  <span className="text-[10px] text-muted-foreground block">Stealth AUC</span>
                  <span className="text-primary font-bold">{activeEvent.stealthAuc}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Event List Selector & Interactive Split Slider */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Event List Browser Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-foreground font-semibold uppercase tracking-wider text-[11px]">
                  Sample CDS Construct Index ({availableEvents.length})
                </span>
                <span className="text-muted-foreground text-[10px]">Select construct to inspect</span>
              </div>

              <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                {availableEvents.map((ev) => {
                  const isActive = activeEvent.id === ev.id;
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setActiveEvent(ev)}
                      className={`p-2.5 rounded-lg border text-xs font-mono cursor-pointer transition-all flex items-center justify-between ${
                        isActive
                          ? "border-[#FF5500] bg-[#FF5500]/10"
                          : "border-border hover:border-primary/40 bg-muted/20"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-foreground">{ev.id}</span>
                          <span className="text-[10px] text-primary">({ev.mode})</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">{ev.timestamp}</div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-foreground block">CAI {ev.caiScore}</span>
                        <span className="text-[10px] text-muted-foreground block">{ev.gcContent}% GC</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Data Partitioning & Leakage Prevention Card */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="font-semibold text-foreground uppercase tracking-wider font-mono text-[11px]">
                  Genomic Partitioning &amp; Cross-Validation
                </span>
                <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border">
                  Zero-Leakage
                </Badge>
              </div>

              {/* Holdout Specimen Dropdown */}
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-mono block">
                  Isolated Holdout Genome / Strain:
                </label>
                <select
                  value={holdoutSpecimen}
                  onChange={(e) => {
                    setHoldoutSpecimen(e.target.value);
                    showToast(`Holdout set to: ${e.target.value}`);
                  }}
                  className="w-full text-xs bg-muted/40 border border-border rounded-lg px-3 py-1.5 font-mono text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="E. coli K-12 (MG1655 Essential Genes Holdout)">E. coli K-12 (MG1655 Essential Genes Holdout)</option>
                  <option value="iGEM Synthetic BioBrick (Expression Cassettes Holdout)">iGEM Synthetic BioBrick (Expression Cassettes Holdout)</option>
                  <option value="S. cerevisiae S288C (Eukaryotic Model Holdout)">S. cerevisiae S288C (Eukaryotic Model Holdout)</option>
                  <option value="pUC19 / pBR322 Plasmid Backbones Holdout">pUC19 / pBR322 Plasmid Backbones Holdout</option>
                </select>
              </div>

              {/* Train Split Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-muted-foreground">Train Proportion:</span>
                  <span className="text-foreground font-bold">{trainSplit}% ({Math.round((selectedDataset.eventsCount * trainSplit) / 100).toLocaleString()} CDS)</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="80"
                  step="5"
                  value={trainSplit}
                  onChange={(e) => setTrainSplit(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer h-1.5"
                />
              </div>

              {/* Val Split Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-muted-foreground">Validation Proportion:</span>
                  <span className="text-zinc-300 font-bold">{valSplit}% ({Math.round((selectedDataset.eventsCount * valSplit) / 100).toLocaleString()} CDS)</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="25"
                  step="5"
                  value={valSplit}
                  onChange={(e) => setValSplit(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer h-1.5"
                />
              </div>

              {/* Visual Split Distribution Bar */}
              <div>
                <div className="flex items-center justify-between mb-1 font-mono text-[10px] text-muted-foreground">
                  <span>Train: {trainSplit}%</span>
                  <span>Val: {valSplit}%</span>
                  <span className="text-primary font-bold">Test: {testSplit}% ({Math.round((selectedDataset.eventsCount * testSplit) / 100).toLocaleString()})</span>
                </div>
                <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-muted/60 border border-border/50">
                  <div className="bg-zinc-500 h-full transition-all" style={{ width: `${trainSplit}%` }} />
                  <div className="bg-zinc-700 h-full transition-all" style={{ width: `${valSplit}%` }} />
                  <div className="bg-[#FF5500] h-full transition-all" style={{ width: `${testSplit}%` }} />
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => showToast(`Partition saved: ${trainSplit}% Train / ${valSplit}% Val / ${testSplit}% Test on ${holdoutSpecimen}`)}
                className="w-full text-xs font-semibold gap-1.5 border-border cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5500]" />
                Lock Partition Configuration
              </Button>
            </div>

          </div>

        </div>
      </Card>

      {/* Upload New Dataset Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-[#141419] p-6 shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Register New Genomic CDS Corpus</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterDataset} className="space-y-4">
              <div className="space-y-1">
                <label className="font-mono text-muted-foreground block text-[11px]">Corpus Name / CDS Description:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. E. coli K-12 MG1655 Complete CDS Library (RefSeq NC_000913.3)"
                  value={newDatasetName}
                  onChange={(e) => setNewDatasetName(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-muted-foreground block text-[11px]">Research Source / Author / DOI:</label>
                <input
                  type="text"
                  placeholder="e.g. Riley et al. • doi: 10.1093/nar/gkj089"
                  value={newDatasetSource}
                  onChange={(e) => setNewDatasetSource(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-muted-foreground block text-[11px]">File Format:</label>
                  <select
                    value={newDatasetFormat}
                    onChange={(e) => setNewDatasetFormat(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg text-xs text-foreground font-mono focus:outline-none cursor-pointer"
                  >
                    <option value="FASTA (.fasta, .fa)">FASTA (.fasta, .fa)</option>
                    <option value="GenBank (.gbk, .gb)">GenBank (.gbk, .gb)</option>
                    <option value="GFF3 Annotation (.gff)">GFF3 Annotation (.gff)</option>
                    <option value="Codon CSV (.csv)">Codon CSV (.csv)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-muted-foreground block text-[11px]">Translation Codec:</label>
                  <select
                    value={newDatasetFreq}
                    onChange={(e) => setNewDatasetFreq(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg text-xs text-foreground font-mono focus:outline-none cursor-pointer"
                  >
                    <option value="Table 11: Bacterial">Table 11: Bacterial (E. coli)</option>
                    <option value="Table 1: Universal">Table 1: Standard Genetic Code</option>
                    <option value="Table 4: Yeast">Table 4: Mold &amp; Yeast</option>
                  </select>
                </div>
              </div>

              {/* Drag and drop simulator */}
              <div
                onClick={() => setUploadedFileName("ecoli_k12_cds_library.fasta")}
                className="p-5 rounded-xl border border-dashed border-border hover:border-primary/60 bg-muted/20 text-center cursor-pointer transition-colors space-y-1"
              >
                <UploadCloud className="w-6 h-6 mx-auto text-primary" />
                <span className="font-mono text-xs text-foreground block">
                  {uploadedFileName ? uploadedFileName : "Click or drag genomic sequence file (.fasta, .gbk, .csv)"}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {uploadedFileName ? "Sequence verified • Ready to index" : "Supports standard FASTA sequences or annotated GenBank flatfiles"}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-xs border-border cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#FF5500] hover:bg-[#E54B00] text-white text-xs font-semibold cursor-pointer"
                >
                  Register Corpus
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
