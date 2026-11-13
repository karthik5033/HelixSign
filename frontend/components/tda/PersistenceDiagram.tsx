"use client";

import React, { useState } from "react";
import { MOCK_PERSISTENCE_DIAGRAM, PersistencePoint } from "@/lib/echosenseData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layers, BarChart2 } from "lucide-react";

interface PersistenceDiagramProps {
  points?: PersistencePoint[];
  className?: string;
  showBarcodeToggle?: boolean;
}

export function PersistenceDiagram({
  points = MOCK_PERSISTENCE_DIAGRAM,
  className = "",
  showBarcodeToggle = true,
}: PersistenceDiagramProps) {
  const [viewMode, setViewMode] = useState<"diagram" | "barcode">("diagram");
  const [activeDim, setActiveDim] = useState<"ALL" | "H0" | "H1">("ALL");
  const [hoveredPoint, setHoveredPoint] = useState<PersistencePoint | null>(null);

  const filteredPoints = points.filter((p) => {
    if (activeDim === "H0") return p.dimension === 0;
    if (activeDim === "H1") return p.dimension === 1;
    return true;
  });

  // Diagram bounds: 0 to 1
  const viewBoxSize = 340;
  const padding = 35;
  const plotSize = viewBoxSize - 2 * padding;

  const toSvgCoord = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    return padding + clamped * plotSize;
  };

  const toSvgY = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    return viewBoxSize - padding - clamped * plotSize;
  };

  return (
    <div className={`rounded-xl border border-border bg-card p-4 flex flex-col ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {viewMode === "diagram" ? "Codon Persistence Diagram" : "Synonymous Codon Barcode"}
            </h3>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/10">
              Codon Manifold
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Synonymous codon choice stability and k-mer entropy across reading frame coordinates
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Dimension filter pills */}
          <div className="flex items-center rounded-lg bg-muted/60 p-0.5 border border-border text-xs">
            <button
              onClick={() => setActiveDim("ALL")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                activeDim === "ALL" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveDim("H0")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                activeDim === "H0" ? "bg-muted text-foreground font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              H₀
            </button>
            <button
              onClick={() => setActiveDim("H1")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                activeDim === "H1" ? "bg-primary/10 text-primary font-semibold shadow-sm" : "text-muted-foreground hover:text-primary"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />
              H₁
            </button>
          </div>

          {showBarcodeToggle && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "diagram" ? "barcode" : "diagram")}
              className="h-7 text-[11px] gap-1 px-2.5"
            >
              {viewMode === "diagram" ? <BarChart2 className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
              {viewMode === "diagram" ? "Barcode" : "Diagram"}
            </Button>
          )}
        </div>
      </div>

      {/* Main Viewport */}
      {viewMode === "diagram" ? (
        <div className="relative flex-1 flex flex-col items-center justify-center pt-3 select-none">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full max-w-[340px] aspect-square">
            {/* Grid & Axis Lines */}
            <defs>
              <radialGradient id="h1Glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FF5500" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FF5500" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background Grid */}
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((tick) => (
              <g key={tick}>
                <line
                  x1={toSvgCoord(tick)}
                  y1={toSvgY(0)}
                  x2={toSvgCoord(tick)}
                  y2={toSvgY(1)}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="2,2"
                />
                <line
                  x1={toSvgCoord(0)}
                  y1={toSvgY(tick)}
                  x2={toSvgCoord(1)}
                  y2={toSvgY(tick)}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="2,2"
                />
                <text
                  x={toSvgCoord(tick)}
                  y={toSvgY(0) + 14}
                  fontSize="8"
                  fill="currentColor"
                  opacity="0.5"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {tick.toFixed(1)}
                </text>
                <text
                  x={toSvgCoord(0) - 8}
                  y={toSvgY(tick) + 3}
                  fontSize="8"
                  fill="currentColor"
                  opacity="0.5"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {tick.toFixed(1)}
                </text>
              </g>
            ))}

            {/* Axes */}
            <line
              x1={toSvgCoord(0)}
              y1={toSvgY(0)}
              x2={toSvgCoord(1)}
              y2={toSvgY(0)}
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="1.2"
            />
            <line
              x1={toSvgCoord(0)}
              y1={toSvgY(0)}
              x2={toSvgCoord(0)}
              y2={toSvgY(1)}
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="1.2"
            />

            {/* Diagonal Reference Line (Birth = Death) */}
            <line
              x1={toSvgCoord(0)}
              y1={toSvgY(0)}
              x2={toSvgCoord(1)}
              y2={toSvgY(1)}
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeDasharray="4,4"
              strokeWidth="1.2"
            />
            <text
              x={toSvgCoord(0.7)}
              y={toSvgY(0.7) - 6}
              fontSize="7"
              fill="currentColor"
              opacity="0.4"
              transform={`rotate(-45, ${toSvgCoord(0.7)}, ${toSvgY(0.7) - 6})`}
              fontFamily="monospace"
            >
              Diagonal (y = x)
            </text>

            {/* Axis Labels */}
            <text
              x={padding + plotSize / 2}
              y={viewBoxSize - 5}
              fontSize="10"
              fill="currentColor"
              opacity="0.75"
              textAnchor="middle"
              fontWeight="500"
            >
              Birth Time (ε_birth)
            </text>
            <text
              x={12}
              y={padding + plotSize / 2}
              fontSize="10"
              fill="currentColor"
              opacity="0.75"
              textAnchor="middle"
              fontWeight="500"
              transform={`rotate(-90, 12, ${padding + plotSize / 2})`}
            >
              Death Time (ε_death)
            </text>

            {/* Points */}
            {filteredPoints.map((pt) => {
              const cx = toSvgCoord(pt.birth);
              const cy = toSvgY(pt.death);
              const isH1 = pt.dimension === 1;
              const isHovered = hoveredPoint?.id === pt.id;

              return (
                <g
                  key={pt.id}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {isH1 && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 14 : 8}
                      fill="url(#h1Glow)"
                      className="transition-all duration-200"
                    >
                      {pt.persistence > 0.4 && (
                        <>
                          <animate
                            attributeName="r"
                            values="7;11;7"
                            dur="2.8s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.6;0.2;0.6"
                            dur="2.8s"
                            repeatCount="indefinite"
                          />
                        </>
                      )}
                    </circle>
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5.5 : 3.8}
                    fill={isH1 ? "#FF5500" : "#94a3b8"}
                    stroke="#ffffff"
                    strokeWidth={isHovered ? 1.5 : 0.8}
                    className="transition-all duration-150"
                  />
                </g>
              );
            })}
          </svg>

          {/* Interactive Hover Tooltip */}
          {hoveredPoint && (
            <div className="absolute bottom-2 left-4 right-4 bg-background/95 border border-border backdrop-blur-md rounded-lg p-2 text-xs shadow-lg animate-in fade-in flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    hoveredPoint.dimension === 1 ? "bg-[#FF5500]" : "bg-zinc-400"
                  }`}
                />
                <span className="font-semibold text-foreground">
                  {hoveredPoint.dimension === 1 ? "H₁ 1D Loop" : "H₀ Component"}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
                <span>Birth: <strong className="text-foreground">{hoveredPoint.birth.toFixed(3)}</strong></span>
                <span>Death: <strong className="text-foreground">{hoveredPoint.death.toFixed(3)}</strong></span>
                <span>Lifetime: <strong className="text-primary">{hoveredPoint.persistence.toFixed(3)}</strong></span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Barcode View */
        <div className="flex-1 overflow-y-auto space-y-1.5 pt-3 pr-1 max-h-[340px]">
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground border-b border-border/40 pb-1">
            <span>Feature ID</span>
            <span>Filtration Lifetime [Birth ➔ Death]</span>
            <span>Persistence</span>
          </div>
          {filteredPoints.map((pt) => {
            const isH1 = pt.dimension === 1;
            const leftPct = pt.birth * 100;
            const widthPct = Math.max(2, (pt.death - pt.birth) * 100);

            return (
              <div
                key={pt.id}
                className="flex items-center gap-2 text-xs py-1 px-1.5 rounded hover:bg-muted/50 transition-colors group"
              >
                <div className="w-16 flex items-center gap-1 shrink-0 font-mono text-[10px]">
                  <span className={`w-1.5 h-1.5 rounded-full ${isH1 ? "bg-[#FF5500]" : "bg-zinc-400"}`} />
                  <span className="text-muted-foreground">{isH1 ? "H₁" : "H₀"}-{pt.id.split("-")[1]}</span>
                </div>

                {/* Horizontal Barcode Track */}
                <div className="flex-1 h-3 rounded bg-muted/40 relative overflow-hidden">
                  <div
                    className={`absolute top-0 bottom-0 rounded transition-all group-hover:brightness-125 ${
                      isH1 ? "bg-[#FF5500]" : "bg-zinc-500"
                    }`}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  />
                </div>

                <span className="w-12 text-right font-mono text-[10px] text-muted-foreground shrink-0">
                  {pt.persistence.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Insight */}
      <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-400" />
            <span>H₀ ({points.filter((p) => p.dimension === 0).length})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
            <span>H₁ Synonymous Loops ({points.filter((p) => p.dimension === 1).length})</span>
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          Max Persistence: 0.880
        </span>
      </div>
    </div>
  );
}

