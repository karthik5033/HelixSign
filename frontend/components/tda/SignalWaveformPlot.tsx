"use client";

import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dna, ShieldCheck, ZoomIn, ZoomOut, Info } from "lucide-react";

interface SignalWaveformPlotProps {
  className?: string;
  isAnomalous?: boolean;
  title?: string;
  samplingRate?: string;
}

export function SignalWaveformPlot({
  className = "",
  isAnomalous = false,
  title = "Codon Relative Adaptiveness (w_i) & Carrier Locus Trajectory",
  samplingRate = "1,025 Codons (3,075 nt)",
}: SignalWaveformPlotProps) {
  const [showThreshold, setShowThreshold] = useState(true);
  const [showCarriers, setShowCarriers] = useState(true);

  // Generate realistic biological codon relative adaptiveness trajectory (w_i in [0.75, 1.0])
  const pointsCount = 140;
  const codonData = useMemo(() => {
    const pts = [];
    for (let i = 0; i < pointsCount; i++) {
      // Base adaptiveness in E. coli K-12: mean ~0.94, with small biological fluctuations
      const baseW = 0.92 + 0.06 * Math.sin(i * 0.15) + (Math.sin(i * 0.43) * 0.02);
      // Local GC skew fluctuations around 50.8%
      const gcSkew = 0.508 + 0.015 * Math.cos(i * 0.22);
      // Carrier locus flag every ~4-5 points
      const isCarrier = i % 4 === 2;
      pts.push({
        codonIndex: Math.floor((i / (pointsCount - 1)) * 1025),
        wi: Math.min(1.0, Math.max(0.78, baseW + (isCarrier ? 0.03 : 0.0))),
        gcSkew,
        isCarrier,
      });
    }
    return pts;
  }, [pointsCount]);

  const width = 960;
  const height = 165;
  const padLeft = 44;
  const padBottom = 26;
  const padTop = 16;
  const padRight = 20;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const minW = 0.70;
  const maxW = 1.05;

  const getX = (idx: number) => padLeft + (idx / (pointsCount - 1)) * plotW;
  const getY = (w: number) => padTop + plotH - ((w - minW) / (maxW - minW)) * plotH;

  // Path for wi trajectory
  const wiPath = codonData.reduce(
    (acc, d, i) =>
      i === 0
        ? `M ${getX(i).toFixed(1)} ${getY(d.wi).toFixed(1)}`
        : `${acc} L ${getX(i).toFixed(1)} ${getY(d.wi).toFixed(1)}`,
    ""
  );

  return (
    <div className={`rounded-xl border border-border bg-card p-4 flex flex-col select-none ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Dna className="w-4 h-4 text-primary" />
              {title}
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border">
              {samplingRate}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Host translation viability trajectory with synonymous carrier codon allocations (Bacterial Table 11)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-muted/60 p-0.5 border border-border text-xs">
            <button
              onClick={() => setShowCarriers(!showCarriers)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                showCarriers ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground"
              }`}
            >
              Carrier Loci
            </button>
            <button
              onClick={() => setShowThreshold(!showThreshold)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                showThreshold ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground"
              }`}
            >
              w_min = 0.85
            </button>
          </div>
        </div>
      </div>

      {/* Trajectory SVG */}
      <div className="pt-2 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <defs>
            <clipPath id="plotInnerClipBio">
              <rect x={padLeft} y={padTop} width={plotW} height={plotH} />
            </clipPath>
            <linearGradient id="caiAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF5500" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FF5500" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.80, 0.90, 1.00].map((val) => (
            <g key={val}>
              <line
                x1={padLeft}
                y1={getY(val)}
                x2={width - padRight}
                y2={getY(val)}
                stroke="currentColor"
                strokeOpacity="0.12"
                strokeDasharray="2,2"
              />
              <text
                x={padLeft - 6}
                y={getY(val) + 3}
                fontSize="8"
                fill="currentColor"
                opacity="0.45"
                textAnchor="end"
                fontFamily="monospace"
              >
                {val.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Minimum viability threshold line (w_min = 0.85) */}
          {showThreshold && (
            <g>
              <line
                x1={padLeft}
                y1={getY(0.85)}
                x2={width - padRight}
                y2={getY(0.85)}
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeDasharray="4,3"
                opacity="0.8"
              />
              <text
                x={width - padRight - 4}
                y={getY(0.85) - 4}
                fontSize="8"
                fill="#f59e0b"
                textAnchor="end"
                fontFamily="monospace"
                fontWeight="bold"
              >
                w_min = 0.85 (Viability Threshold)
              </text>
            </g>
          )}

          {/* Area fill under curve */}
          <path
            d={`${wiPath} L ${getX(pointsCount - 1)} ${getY(minW)} L ${getX(0)} ${getY(minW)} Z`}
            fill="url(#caiAreaGrad)"
            clipPath="url(#plotInnerClipBio)"
          />

          {/* Adaptiveness Trajectory Line */}
          <path
            d={wiPath}
            fill="none"
            stroke="#FF5500"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Carrier Codon Loci Points */}
          {showCarriers &&
            codonData
              .filter((d) => d.isCarrier)
              .map((d, idx) => (
                <g key={idx}>
                  <line
                    x1={getX(idx * 4 + 2)}
                    y1={getY(minW)}
                    x2={getX(idx * 4 + 2)}
                    y2={getY(d.wi)}
                    stroke="#FF5500"
                    strokeWidth="0.8"
                    strokeDasharray="2,2"
                    opacity="0.6"
                  />
                  <circle
                    cx={getX(idx * 4 + 2)}
                    cy={getY(d.wi)}
                    r="3"
                    fill="#FF5500"
                    stroke="#111116"
                    strokeWidth="1"
                  />
                </g>
              ))}

          {/* X-Axis Codon Coordinates */}
          {[0, 250, 500, 750, 1025].map((codon) => {
            const idx = Math.floor((codon / 1025) * (pointsCount - 1));
            return (
              <g key={codon}>
                <text
                  x={getX(idx)}
                  y={height - 6}
                  fontSize="8"
                  fill="currentColor"
                  opacity="0.45"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {codon === 0 ? "Codon 1 (ATG)" : codon === 1025 ? "1025 (TAA)" : `${codon}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Biophysical Stats Footer */}
      <div className="mt-2 pt-2.5 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-mono block">Host Mean CAI</span>
          <span className="font-semibold text-foreground font-mono">0.988 (Optimal)</span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-mono block">Local GC Skew</span>
          <span className="font-semibold text-foreground font-mono">+0.14%</span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-mono block">Steganographic Capacity</span>
          <span className="font-semibold text-foreground/90 font-mono">248 Bits Avail</span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-mono block">Translation</span>
          <span className="font-semibold text-foreground font-mono">Function Invariant</span>
        </div>
      </div>
    </div>
  );
}
