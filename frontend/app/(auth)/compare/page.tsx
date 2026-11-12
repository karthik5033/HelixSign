"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GitCompare,
  Sparkles,
  Download,
  BarChart2,
  LineChart,
  CheckCircle2,
  Layers,
  FileText,
  Sliders,
  ShieldCheck,
  Cpu,
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
import { MODEL_COMPARISON_TABLE, ModelBenchmark } from "@/lib/echosenseData";
import { downloadDataAsCsv } from "@/lib/utils";

export default function ModelComparisonPage() {
  const [selectedModels, setSelectedModels] = useState({
    helixSign: true,
    directCodon: true,
    naiveBarcode: true,
  });

  const handleExport = () => {
    downloadDataAsCsv("helixsign_stealth_benchmark.csv", MODEL_COMPARISON_TABLE);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <GitCompare className="h-6 w-6 text-primary" />
            Stealth Detector &amp; Watermark Benchmarking
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Empirical evaluation: HelixSign Steganography vs. Naive Codebook Tagging vs. Exogenous Barcodes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/reports">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" />
              View Provenance Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Model Cards Triad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* HelixSign */}
        <Card className="border-2 border-[#FF5500] bg-card p-5 relative overflow-hidden shadow-lg h-full flex flex-col justify-between">
          <div>
            <div className="absolute top-0 right-0 bg-[#FF5500] text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
              Proposed (Optimal)
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#FF5500]/20 text-[#FF5500] flex items-center justify-center font-bold">
                H
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">HelixSign (WGAN-GP + RS ECC)</h3>
                <span className="text-[10px] font-mono text-muted-foreground">Keyed HKDF + WGAN Refiner + RS(16,8)</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-muted/30">
                <span className="text-[10px] text-muted-foreground block font-mono">Protein Match</span>
                <span className="text-lg font-bold font-mono text-foreground">100.0%</span>
              </div>
              <div className="p-2 rounded bg-muted/30">
                <span className="text-[10px] text-muted-foreground block font-mono">Stealth AUC</span>
                <span className="text-lg font-bold font-mono text-foreground">0.505</span>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
              Strictly function-preserving synonymous manifold embedding evades both k-mer frequency classifiers and deep 1D CNN detectors while maintaining host expression efficiency.
            </p>
          </div>
        </Card>

        {/* Naive Codebook Watermark */}
        <Card className="border border-border bg-card p-5 h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center font-bold">
                N
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Naive Codebook Tagging</h3>
                <span className="text-[10px] font-mono text-muted-foreground">Direct Bit-to-Base Mapping</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-muted/30">
                <span className="text-[10px] text-muted-foreground block font-mono">Protein Match</span>
                <span className="text-lg font-bold font-mono text-foreground">91.4%</span>
              </div>
              <div className="p-2 rounded bg-muted/30">
                <span className="text-[10px] text-muted-foreground block font-mono">Stealth AUC</span>
                <span className="text-lg font-bold font-mono text-primary font-semibold">0.998</span>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
              Naive bit substitution alters wildtype codon adaptation index (CAI) and introduces statistical k-mer anomalies that are easily identified by biosecurity screening models.
            </p>
          </div>
        </Card>

        {/* Exogenous Barcode */}
        <Card className="border border-border bg-card p-5 h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center font-bold">
                B
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Non-Coding Barcode Insertion</h3>
                <span className="text-[10px] font-mono text-muted-foreground">Synthetic Exogenous Insert</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-muted/30">
                <span className="text-[10px] text-muted-foreground block font-mono">Protein Match</span>
                <span className="text-lg font-bold font-mono text-foreground">88.2%</span>
              </div>
              <div className="p-2 rounded bg-muted/30">
                <span className="text-[10px] text-muted-foreground block font-mono">Stealth AUC</span>
                <span className="text-lg font-bold font-mono text-primary font-semibold">0.985</span>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
              Foreign sequence inserts are vulnerable to restriction/CRISPR excision and introduce metabolic load on host cell replication without cryptographic key protection.
            </p>
          </div>
        </Card>
      </div>

      {/* Comprehensive Benchmark Table */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            Quantitative Performance Benchmark Matrix
          </CardTitle>
          <CardDescription className="text-xs">
            Evaluated on cross-validation splits across E. coli K-12 MG1655 and synthetic BioBrick test suites
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-xs">Evaluation Metric</TableHead>
                <TableHead className="text-xs text-[#FF5500] font-bold">HelixSign (Proposed)</TableHead>
                <TableHead className="text-xs text-muted-foreground">Naive Codebook Tagging</TableHead>
                <TableHead className="text-xs text-muted-foreground">Exogenous Barcode</TableHead>
                <TableHead className="text-xs text-right pr-4">Advantage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MODEL_COMPARISON_TABLE.map((row) => (
                <TableRow key={row.metric} className="border-border hover:bg-muted/40">
                  <TableCell className="text-xs font-semibold text-foreground">
                    {row.metric}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-bold text-[#FF5500] bg-[#FF5500]/5">
                    {row.helixSign}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {row.directCodon}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-foreground/90">
                    {row.naiveBarcode}
                  </TableCell>
                  <TableCell className="text-xs text-right pr-4">
                    {row.bestModel === "helixSign" && (
                      <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5">
                        HelixSign Superior
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Noise Resilience & Ablation Insight */}
      <Card className="border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Ablation &amp; Channel Noise Resilience Analysis
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The core innovation of HelixSign is <strong>function-invariant synonymous manifold embedding</strong> backed by <strong>Reed-Solomon RS(16,8) ECC</strong> over Galois Field $GF(2^8)$. Conventional watermark schemes suffer complete message destruction when exposed to PCR synthesis error or biological point mutations (recovery drops to 12.0% under a 15% synonymous shuffle). In contrast, HelixSign achieves <strong>94.2% watermark recovery</strong> under adversarial synonym shuffling and <strong>99.4% recovery</strong> under 1.0% biological mutation noise, while holding a <strong>100.0% protein sequence match</strong> and remaining completely undetectable (Stealth AUC 0.505) to machine-learning biosecurity classifiers.
        </p>
      </Card>
    </div>
  );
}

