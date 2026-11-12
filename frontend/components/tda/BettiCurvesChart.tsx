"use client";

import React from "react";
import { MOCK_BETTI_CURVES } from "@/lib/echosenseData";
import { Badge } from "@/components/ui/badge";

interface BettiCurvesChartProps {
  className?: string;
  data?: typeof MOCK_BETTI_CURVES;
}

export function BettiCurvesChart({
  className = "",
  data = MOCK_BETTI_CURVES,
}: BettiCurvesChartProps) {
  const width = 360;
  const height = 180;
  const paddingLeft = 32;
  const paddingBottom = 26;
  const paddingTop = 12;
  const paddingRight = 16;

  const plotW = width - paddingLeft - paddingRight;
  const plotH = height - paddingTop - paddingBottom;

  const maxBeta = 45;

  const getX = (epsilon: number) => paddingLeft + (epsilon / 0.9) * plotW;
  const getY = (val: number) => paddingTop + plotH - (val / maxBeta) * plotH;

  // Path for Beta 0 (components)
  const pathBeta0 = data.reduce((acc, curr, idx) => {
    const x = getX(curr.epsilon);
    const y = getY(curr.beta0);
    return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, "");

  // Path for Beta 1 (loops)
  const pathBeta1 = data.reduce((acc, curr, idx) => {
    const x = getX(curr.epsilon);
    const y = getY(curr.beta1);
    return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, "");

  return (
    <div className={`rounded-xl border border-border bg-card p-4 flex flex-col ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Betti Curves β₀(ε) & β₁(ε)</h3>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/10">
              Topological Invariants
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Betti numbers as continuous function of filtration parameter ε
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded-full bg-zinc-400" />
            <span className="text-[11px] font-mono text-muted-foreground">β₀(ε) [H₀]</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded-full bg-[#FF5500]" />
            <span className="text-[11px] font-mono text-muted-foreground">β₁(ε) [H₁]</span>
          </div>
        </div>
      </div>

      <div className="pt-2 select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Horizontal grid lines */}
          {[0, 15, 30, 45].map((val) => (
            <g key={val}>
              <line
                x1={paddingLeft}
                y1={getY(val)}
                x2={width - paddingRight}
                y2={getY(val)}
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeDasharray="2,2"
              />
              <text
                x={paddingLeft - 6}
                y={getY(val) + 3}
                fontSize="8"
                fill="currentColor"
                opacity="0.4"
                textAnchor="end"
                fontFamily="monospace"
              >
                {val}
              </text>
            </g>
          ))}

          {/* Epsilon ticks */}
          {[0.0, 0.2, 0.4, 0.6, 0.8].map((eps) => (
            <g key={eps}>
              <text
                x={getX(eps)}
                y={height - 8}
                fontSize="8"
                fill="currentColor"
                opacity="0.4"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {eps.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Beta 0 curve */}
          <path
            d={pathBeta0}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Beta 1 curve */}
          <path
            d={pathBeta1}
            fill="none"
            stroke="#FF5500"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={getX(d.epsilon)} cy={getY(d.beta0)} r="2.5" fill="#94a3b8" />
              <circle cx={getX(d.epsilon)} cy={getY(d.beta1)} r="2.5" fill="#FF5500" />
            </g>
          ))}

          {/* Peak H1 loop annotation */}
          <g transform={`translate(${getX(0.4) + 6}, ${getY(19) - 10})`}>
            <rect x="0" y="0" width="92" height="16" rx="3" fill="#181820" stroke="#FF5500" strokeWidth="0.8" />
            <text x="4" y="11" fontSize="8" fill="#FF5500" fontFamily="monospace" fontWeight="bold">
              Peak Invariant β₁ = 19
            </text>
          </g>
        </svg>
      </div>

      <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Filtration Scale: Codon Manifold Filtration ε ∈ [0.0, 0.9]</span>
        <span className="font-mono text-foreground font-semibold">β₁ AUC: 12.84</span>
      </div>
    </div>
  );
}

