"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Dna,
  Sparkles,
  ArrowRight,
  Cpu,
  RefreshCw,
  Layers,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConstruct } from "@/lib/ConstructContext";
import { stampConstruct, verifyConstruct, runStealthCheck } from "@/lib/mlPipelineClient";
import { BENCHMARK_PRESETS } from "@/lib/codonMetrics";

interface EmptyConstructStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  suggestedAction?: string;
}

export function EmptyConstructState({
  title,
  description,
  icon: Icon = Dna,
  suggestedAction = "Input or stamp a synthetic CDS sequence to compute live metrics.",
}: EmptyConstructStateProps) {
  const { setStampedData } = useConstruct();
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // Quick load standard benchmark sample (lacZ)
  const handleQuickLoadSample = async () => {
    setIsLoadingSample(true);
    const preset = BENCHMARK_PRESETS[0]; // lacZ
    try {
      const res = await stampConstruct({
        ownerName: "ApexBio Laboratory",
        projectName: "Project Helios",
        batchName: "B-2026-X1",
        sequence: preset.sequence,
        host: "E. coli K-12 RefSeq",
        geneName: preset.gene,
      });

      if (res && res.data) {
        const [verRes, stealthRes] = await Promise.allSettled([
          verifyConstruct(res.data.stampedSequence),
          runStealthCheck(res.data.stampedSequence),
        ]);

        setStampedData({
          stamp: res.data,
          original: preset.sequence,
          gene: preset.gene,
          owner: "ApexBio Laboratory",
          project: "Project Helios",
          batch: "B-2026-X1",
          host: "E. coli K-12 RefSeq",
          verify: verRes.status === "fulfilled" ? verRes.value : null,
          stealth: stealthRes.status === "fulfilled" ? stealthRes.value : null,
        });
      }
    } catch (err) {
      console.error("Failed to load sample construct:", err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <Card className="border border-dashed border-border/80 bg-card/60 shadow-sm max-w-3xl mx-auto my-8">
      <CardContent className="pt-8 pb-8 px-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary shadow-sm">
          <Icon className="w-7 h-7 text-primary" />
        </div>

        <div className="space-y-1.5 max-w-lg mx-auto">
          <h2 className="text-lg font-bold text-foreground tracking-tight">{title}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
          <p className="text-xs font-mono text-primary font-medium pt-1">
            {suggestedAction}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <Link href="/input">
            <Button className="bg-[#FF5500] hover:bg-[#e04b00] text-white font-semibold text-xs gap-2 h-9 px-4 cursor-pointer shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Go to Input Studio
            </Button>
          </Link>

          <Button
            variant="outline"
            onClick={handleQuickLoadSample}
            disabled={isLoadingSample}
            className="text-xs font-mono gap-2 h-9 px-4 cursor-pointer border-border hover:bg-muted"
          >
            {isLoadingSample ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Stamping Reference Construct via ML...
              </>
            ) : (
              <>
                <Dna className="w-3.5 h-3.5 text-primary" />
                Quick-Load &amp; Stamp lacZ Benchmark
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
