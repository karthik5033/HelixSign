"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Search,
  Hash,
  Database,
  Sliders,
  Check,
  Activity,
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
import { ASSESSMENT_REPORTS, AssessmentReport } from "@/lib/echosenseData";
import { downloadDataAsCsv } from "@/lib/utils";

// Genomic carrier locus telemetry for the active report
const PROVENANCE_CHANNELS = [
  { id: "LOC-01", name: "Locus 0-750 bp (lacZ Leader)", deltaT: "+0 bp", amp: "1.00 Match", energy: "16 Codons", status: "Verified Invariant" },
  { id: "LOC-02", name: "Locus 751-1500 bp (Catalytic Core)", deltaT: "+24 Codons", amp: "1.00 Match", energy: "18 Codons", status: "Verified Invariant" },
  { id: "LOC-03", name: "Locus 1501-2250 bp (Subunit Interface)", deltaT: "+48 Codons", amp: "1.00 Match", energy: "14 Codons", status: "Verified Invariant" },
  { id: "LOC-04", name: "Locus 2251-3075 bp (C-Terminal Domain)", deltaT: "+64 Codons", amp: "1.00 Match", energy: "16 Codons", status: "RS Parity Verified" },
];

export default function AssessmentReportsPage() {
  const [reports] = useState<AssessmentReport[]>(ASSESSMENT_REPORTS);
  const [activeReport, setActiveReport] = useState<AssessmentReport>(ASSESSMENT_REPORTS[0] || ASSESSMENT_REPORTS[1]);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"ALL" | "Critical" | "Moderate" | "Low">("ALL");

  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      const matchesSearch =
        rep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.analysisRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.primaryDamageMode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRisk = riskFilter === "ALL" || rep.precursorRisk === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [reports, searchQuery, riskFilter]);

  const handleDownloadPdf = (rep: AssessmentReport) => {
    alert(`Downloading ${rep.title} (${rep.fileSize})... Generated from HelixSign provenance pipeline.`);
  };

  const handleExportCsv = () => {
    downloadDataAsCsv("helixsign_provenance_manifest.csv", reports);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Provenance Certificates &amp; Forensic Audit Reports
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cryptographic ownership attestations, Reed-Solomon verification logs, and sequence integrity signatures
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleDownloadPdf(activeReport)}
            className="bg-[#FF5500] hover:bg-[#E54B00] text-white gap-1.5 text-xs shadow-sm cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols): Archive Navigation & Audit Card */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          {/* Card 1: Assessment Archive */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Assessment Archive
                </CardTitle>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {filteredReports.length} of {reports.length}
                </span>
              </div>
              <CardDescription className="text-xs mt-1">
                Select an assessment to review executive findings &amp; engineering recommendations
              </CardDescription>

              {/* Search Bar */}
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter by report ID, gene, construct..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-muted/40 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Risk Filter Tabs */}
              <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-border/40 text-[11px]">
                {(["ALL", "Critical", "Moderate", "Low"] as const).map((risk) => (
                  <button
                    key={risk}
                    onClick={() => setRiskFilter(risk)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      riskFilter === risk
                        ? "bg-secondary text-foreground font-semibold border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {risk === "ALL" ? "All" : risk}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="pt-3 space-y-2 max-h-[460px] overflow-y-auto">
              {filteredReports.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No assessment reports match your search query.
                </div>
              ) : (
                filteredReports.map((rep) => {
                  const isSelected = activeReport.id === rep.id;
                  const isCritical = rep.precursorRisk === "Critical";
                  const isModerate = rep.precursorRisk === "Moderate";

                  return (
                    <div
                      key={rep.id}
                      onClick={() => setActiveReport(rep)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#FF5500] bg-[#FF5500]/10 shadow-sm"
                          : "border-border hover:border-primary/40 bg-card/60 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-primary font-bold">
                          {rep.id}
                        </span>
                        <Badge
                          variant={isCritical ? "destructive" : isModerate ? "secondary" : "outline"}
                          className={`text-[10px] uppercase font-bold ${
                            !isCritical && !isModerate ? "border-border text-muted-foreground bg-muted/20" : ""
                          }`}
                        >
                          {rep.precursorRisk} Risk
                        </Badge>
                      </div>

                      <h4 className="text-xs font-bold text-foreground mt-1.5 leading-snug">
                        {rep.title}
                      </h4>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                        <span>Ref: {rep.analysisRef}</span>
                        <span>{rep.fileSize}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Card 2: Digital Audit Verification & Calibration Seal */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Digital Biosecurity &amp; Provenance Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-[11px] text-muted-foreground">Standard</span>
                <span className="text-[11px] font-bold text-foreground">ISO/IEC 27001 &bull; NIST Bio-ECC</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-[11px] text-muted-foreground">Audit Signature</span>
                <span className="text-[11px] text-foreground font-mono font-bold">{activeReport.auditHash || "SHA-256: 4e91b0c9a41e8f23"}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-[11px] text-muted-foreground">Model Engine</span>
                <span className="text-[11px] font-semibold text-foreground">HelixSign WGAN-GP + RS(16,8)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-[11px] text-muted-foreground">Peptide Sequence</span>
                <span className="text-[11px] font-semibold text-foreground">Invariant (0 alterations)</span>
              </div>

              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportCsv}
                  className="w-full text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Complete Audit Manifest
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (8 cols): Formal In-App Document Preview */}
        <div className="lg:col-span-7 xl:col-span-8">
          <Card className="border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
            {/* Watermark accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_center,rgba(255,85,0,0.06)_0%,transparent_70%)] pointer-events-none" />

            {/* Document Header (Full Width - Zero Squishing) */}
            <div className="pb-5 border-b border-border/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono tracking-wider text-primary uppercase font-bold">
                      HelixSign Forensic Biosecurity Lab
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">
                      OFFICIAL PROVENANCE CERTIFICATE
                    </Badge>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {activeReport.title}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    DNA Steganographic Watermark &amp; Protein Invariant Protocol &bull; Reference {activeReport.analysisRef}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleDownloadPdf(activeReport)}
                    className="bg-[#FF5500] hover:bg-[#E54B00] text-white gap-1.5 text-xs h-8 shadow-sm cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                    className="gap-1.5 text-xs h-8 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print
                  </Button>
                </div>
              </div>

              {/* Key Technical Metadata Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-muted/30 border border-border/60 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Certificate ID</span>
                  <span className="font-bold text-foreground text-xs mt-0.5 block">{activeReport.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Generated (UTC)</span>
                  <span className="font-medium text-foreground text-xs mt-0.5 block">{activeReport.dateGenerated}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Lead Investigator</span>
                  <span className="font-medium text-foreground text-xs mt-0.5 block truncate" title={activeReport.author}>
                    {activeReport.author}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Compliance Standard</span>
                  <span className="font-medium text-foreground text-xs mt-0.5 block">ISO/IEC 27001 &bull; NIST</span>
                </div>
              </div>
            </div>

            {/* Executive Risk Determination Card */}
            <div
              className={`p-4 rounded-xl border ${
                activeReport.precursorRisk === "Critical"
                  ? "border-[#FF5500]/40 bg-[#FF5500]/10"
                  : "border-border bg-muted/20"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-foreground">
                  Executive Provenance Determination
                </span>
                <Badge
                  variant={activeReport.precursorRisk === "Critical" ? "destructive" : "outline"}
                  className="text-xs font-bold font-mono"
                >
                  {activeReport.precursorRisk === "Low" ? "Verified Invariant" : `${activeReport.precursorRisk} Status`}
                </Badge>
              </div>
              <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                {activeReport.overallCondition}
              </p>
            </div>

            {/* Quantitative Pipeline Stage Verifications (4 Equal-Height Cards) */}
            <div className="space-y-3 text-xs">
              <h3 className="font-semibold text-foreground uppercase tracking-wider font-mono text-[11px] pb-1 border-b border-border/50">
                Quantitative Pipeline Stage Verifications
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg border border-border bg-muted/20 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground block uppercase font-semibold">
                    Primary Verification Status
                  </span>
                  <span className="text-xs font-bold text-foreground block mt-1">
                    {activeReport.primaryDamageMode}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-muted/20 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground block uppercase font-semibold">
                    Codon Manifold Cycles
                  </span>
                  <span className="text-xs font-bold text-foreground block mt-1">
                    {activeReport.h1Loops || 16} Synonymous Equivalence Loops (Stealth AUC {activeReport.maxPersistence || 0.505})
                  </span>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-muted/20 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground block uppercase font-semibold">
                    Carrier Codon Loci
                  </span>
                  <span className="text-xs font-bold text-foreground block mt-1">
                    {activeReport.changepoints || 64} Carrier Loci (RS(16,8) GF(2⁸) Margin Intact)
                  </span>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-muted/20 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground block uppercase font-semibold">
                    Sequence Translation Verification
                  </span>
                  <span className="text-xs font-bold text-foreground block mt-1">
                    Identity: {((activeReport.f1Score || 1.0) * 100).toFixed(1)}% (0 alterations)
                  </span>
                </div>
              </div>
            </div>

            {/* Carrier Loci Telemetry Table */}
            <div className="space-y-3 text-xs">
              <h3 className="font-semibold text-foreground uppercase tracking-wider font-mono text-[11px] pb-1 border-b border-border/50">
                4-Segment Carrier Locus Mapping &amp; Parity Verification
              </h3>

              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-[11px]">
                      <TableHead className="font-mono">Locus ID</TableHead>
                      <TableHead>Genomic Segment</TableHead>
                      <TableHead className="font-mono">Offset</TableHead>
                      <TableHead className="font-mono">Codon Match</TableHead>
                      <TableHead className="font-mono">Codewords</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PROVENANCE_CHANNELS.map((ch) => (
                      <TableRow key={ch.id} className="text-xs font-mono">
                        <TableCell className="font-bold text-primary">{ch.id}</TableCell>
                        <TableCell className="font-sans font-medium text-foreground">{ch.name}</TableCell>
                        <TableCell className="text-muted-foreground">{ch.deltaT}</TableCell>
                        <TableCell className="text-foreground">{ch.amp}</TableCell>
                        <TableCell className="text-muted-foreground">{ch.energy}</TableCell>
                        <TableCell className="text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            ch.status === "Primary Trigger" || ch.status === "RS Parity Verified"
                              ? "bg-primary/10 text-primary border border-primary/30"
                              : "bg-muted text-muted-foreground border border-border"
                          }`}>
                            {ch.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Actionable Forensic Recommendations */}
            <div className="space-y-2 text-xs">
              <h3 className="font-semibold text-foreground uppercase tracking-wider font-mono text-[11px] pb-1 border-b border-border/50">
                Actionable Forensic Recommendations
              </h3>
              <ul className="space-y-2 text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Deposit this cryptographic certificate hash in the immutable HelixSign Provenance Registry for undisputed IP ownership defense.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Confirm that biosecurity screening models (NCBI BLAST &amp; Screening Guidelines) classify this construct as indistinguishable from host wildtype.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Archive the watermarked FASTA sequence and cryptographic salt with 64-bit HKDF derivation parameters prior to DNA synthesis.
                  </span>
                </li>
              </ul>
            </div>

            {/* Document Sign-off Footer */}
            <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px] text-muted-foreground font-mono">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Sign-off: Principal Investigator &bull; Molecular Biosecurity Officer</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-zinc-500">Hash: {activeReport.auditHash || "SHA-256: 4e91b0c9a41e8f23"}</span>
                <span className="text-foreground font-semibold">HelixSign Verified Invariant</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
