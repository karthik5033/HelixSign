"use client";

import React, { useState, useMemo } from "react";
import { generateTakensAttractor } from "@/lib/echosenseData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCw, Eye } from "lucide-react";

interface TakensPhaseSpaceProps {
  className?: string;
  initialDelay?: number;
  initialDim?: number;
}

export function TakensPhaseSpace({
  className = "",
  initialDelay = 4,
  initialDim = 3,
}: TakensPhaseSpaceProps) {
  const [delay, setDelay] = useState(initialDelay);
  const [dim, setDim] = useState(initialDim);
  const [angleX, setAngleX] = useState(25);
  const [angleY, setAngleY] = useState(45);
  const [isRotating, setIsRotating] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  // Smooth physical 3D attractor rotation loop
  React.useEffect(() => {
    if (!isAutoRotating) return;
    const interval = setInterval(() => {
      setAngleY((prev) => (prev + 0.4) % 360);
    }, 45);
    return () => clearInterval(interval);
  }, [isAutoRotating]);

  // Generate 3D point cloud
  const rawPoints = useMemo(() => generateTakensAttractor(220), []);

  // 3D Isometric projection to 2D screen
  const projectedPoints = useMemo(() => {
    const radX = (angleX * Math.PI) / 180;
    const radY = (angleY * Math.PI) / 180;
    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);
    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);

    const scale = 80;
    const centerX = 170;
    const centerY = 160;

    return rawPoints.map((pt, i) => {
      // Rotation around Y
      const x1 = pt.x * cosY + pt.z * sinY;
      const z1 = -pt.x * sinY + pt.z * cosY;

      // Rotation around X
      const y2 = pt.y * cosX - z1 * sinX;
      const z2 = pt.y * sinX + z1 * cosX;

      const px = centerX + x1 * scale;
      const py = centerY - y2 * scale;

      return {
        px,
        py,
        depth: z2,
        index: i,
        phase: (i / rawPoints.length) * 100,
      };
    });
  }, [rawPoints, angleX, angleY]);

  // Construct trajectory path
  const pathD = useMemo(() => {
    if (projectedPoints.length === 0) return "";
    return projectedPoints.reduce((acc, curr, idx) => {
      if (idx === 0) return `M ${curr.px.toFixed(1)} ${curr.py.toFixed(1)}`;
      return `${acc} L ${curr.px.toFixed(1)} ${curr.py.toFixed(1)}`;
    }, "");
  }, [projectedPoints]);

  return (
    <div className={`rounded-xl border border-border bg-card p-4 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Codon Manifold Phase Space Embedding
            </h3>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/10">
              k = {dim}, τ = {delay}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            High-dimensional k-mer frequency manifold reconstruction showing construct vs wildtype host convergence
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`h-7 text-[11px] gap-1 px-2.5 transition-all ${
              isAutoRotating 
                ? "border-[#FF5500]/40 text-[#FF5500] bg-[#FF5500]/10 hover:bg-[#FF5500]/20" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Toggle attractor auto-orbit"
          >
            <RotateCw className={`w-3 h-3 ${isAutoRotating ? "animate-spin text-[#FF5500]" : ""}`} style={{ animationDuration: '6s' }} />
            <span>{isAutoRotating ? "Auto-Orbit" : "Orbit"}</span>
          </Button>
        </div>
      </div>

      {/* 3D Attractor Canvas */}
      <div className="relative flex-1 flex flex-col items-center justify-center pt-2 select-none overflow-hidden min-h-[260px]">
        <svg viewBox="0 0 340 320" className="w-full max-w-[340px] aspect-square">
          <defs>
            <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFA066" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#FF5500" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#C2410C" stopOpacity="0.85" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Coordinate Bounding Frame - Minimal & Clean */}
          <g opacity="0.12" stroke="currentColor" strokeWidth="0.8">
            <rect x="70" y="60" width="200" height="200" rx="4" fill="none" strokeDasharray="3,3" />
            <line x1="70" y1="160" x2="270" y2="160" strokeDasharray="1,4" />
            <line x1="170" y1="60" x2="170" y2="260" strokeDasharray="1,4" />
          </g>

          {/* Trajectory Streamline */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#orbitGrad)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
            className="opacity-80"
          />

          {/* Phase Space Discrete Nodes */}
          {projectedPoints.map((pt, i) => {
            if (i % 3 !== 0) return null; // Sample points for clean visual
            const r = Math.max(1.8, Math.min(4.5, 3 + pt.depth * 1.5));
            return (
              <circle
                key={i}
                cx={pt.px}
                cy={pt.py}
                r={r}
                fill={i % 6 === 0 ? "#FF5500" : "#cbd5e1"}
                fillOpacity={0.85}
                stroke="#ffffff"
                strokeWidth="0.5"
                strokeOpacity={0.5}
              />
            );
          })}

          {/* Dimension Axes Indicators */}
          <text x="35" y="165" fontSize="8" fill="currentColor" opacity="0.5" fontFamily="monospace">
            x(t)
          </text>
          <text x="170" y="305" fontSize="8" fill="currentColor" opacity="0.5" fontFamily="monospace" textAnchor="middle">
            x(t + τ)
          </text>
          <text x="305" y="165" fontSize="8" fill="currentColor" opacity="0.5" fontFamily="monospace" textAnchor="end">
            x(t + 2τ)
          </text>
        </svg>

        {/* Live Parameter Pill Overlay */}
        <div className="absolute top-2 right-2 bg-background/80 border border-border/60 backdrop-blur-sm rounded-md px-2 py-1 text-[10px] font-mono text-muted-foreground flex items-center gap-2">
          <span>Mutual Info min: τ = 4</span>
          <span>•</span>
          <span>FNN &lt; 2%: d = 3</span>
        </div>
      </div>

      {/* Sliders for Interactive Parameter Tuning */}
      <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground font-medium">Time Delay (τ)</span>
            <span className="font-mono text-primary font-semibold">{delay} samples</span>
          </div>
          <input
            type="range"
            min={1}
            max={15}
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            className="w-full accent-[#FF5500] cursor-pointer h-1.5 bg-muted rounded-lg"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground font-medium">Embedding Dim (d)</span>
            <span className="font-mono text-primary font-semibold">d = {dim}</span>
          </div>
          <input
            type="range"
            min={2}
            max={6}
            value={dim}
            onChange={(e) => setDim(Number(e.target.value))}
            className="w-full accent-[#FF5500] cursor-pointer h-1.5 bg-muted rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
