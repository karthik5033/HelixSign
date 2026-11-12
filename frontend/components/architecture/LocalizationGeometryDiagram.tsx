"use client";

import React, { useState } from "react";
import { Dna, ShieldCheck, Check, Sparkles } from "lucide-react";

export function LocalizationGeometryDiagram() {
  const [selectedLocus, setSelectedLocus] = useState<string>("SEG-01");

  const segmentDetails: Record<string, { name: string; range: string; role: string; codons: string }> = {
    "SEG-01": {
      name: "SEG-01: 5' Regulatory & Initiator Domain",
      range: "0 - 750 bp (Codons 1 - 250)",
      role: "Promoter coupling and ribosomal binding initiation stability (ΔCAI = +0.002)",
      codons: "16 Synonymous Carrier Loci Active",
    },
    "SEG-02": {
      name: "SEG-02: Catalytic Active Site Core",
      range: "750 - 1500 bp (Codons 251 - 500)",
      role: "Critical enzymatic domain; 100% strict primary amino acid identity preservation",
      codons: "16 Synonymous Carrier Loci Active",
    },
    "SEG-03": {
      name: "SEG-03: Variable Structural Scaffold",
      range: "1500 - 2250 bp (Codons 501 - 750)",
      role: "WGAN-GP k-mer distribution matching against host organism genome (W₁ = 0.012)",
      codons: "16 Synonymous Carrier Loci Active",
    },
    "SEG-04": {
      name: "SEG-04: 3' C-Terminal & Termination Domain",
      range: "2250 - 3075 bp (Codons 751 - 1025)",
      role: "Reed-Solomon RS(16,8) parity symbol embedding and amber stop codon preservation",
      codons: "16 Synonymous Carrier Loci Active",
    },
  };

  const active = segmentDetails[selectedLocus] || segmentDetails["SEG-01"];

  return (
    <div className="space-y-6 select-none">
      <div className="rounded-xl border border-[#23232c] bg-[#0f0f14] p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f1f26]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold">
              Genomic Open Reading Frame Carrier Codon Topology (3,075 bp Construct)
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 font-medium">
            Primary Sequence: Invariant
          </span>
        </div>

        {/* 2D Genomic Architecture SVG Visualization */}
        <div className="rounded-xl border border-[#22222b] bg-[#0c0c10] p-4 relative overflow-hidden">
          <svg viewBox="0 0 1000 280" className="w-full h-auto">
            {/* Background Grid Lines */}
            <defs>
              <pattern id="archGrid" width="50" height="25" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 25" fill="none" stroke="#181822" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="1000" height="280" fill="url(#archGrid)" />

            {/* Scale Ruler Along Top */}
            <line x1="50" y1="40" x2="950" y2="40" stroke="#2e2e3c" strokeWidth="1" />
            {[
              { pos: 50, label: "5' (0 bp)" },
              { pos: 275, label: "750 bp" },
              { pos: 500, label: "1,500 bp (Mid-CDS)" },
              { pos: 725, label: "2,250 bp" },
              { pos: 950, label: "3' (3,075 bp)" },
            ].map((tick, i) => (
              <g key={`tick-${i}`}>
                <line x1={tick.pos} y1="35" x2={tick.pos} y2="40" stroke="#4a4a5e" strokeWidth="1" />
                <text x={tick.pos} y="28" fill="#8e8ea0" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  {tick.label}
                </text>
              </g>
            ))}

            {/* CDS Coding Frame Body */}
            <rect
              x="50"
              y="60"
              width="900"
              height="140"
              rx="6"
              fill="#14141c"
              stroke="#2e2e3c"
              strokeWidth="2"
            />

            {/* Double Helix Track Guides */}
            <line x1="60" y1="95" x2="940" y2="95" stroke="#252535" strokeWidth="1.5" strokeDasharray="4 4" />
            <text x="65" y="90" fill="#71717a" fontSize="8" fontFamily="monospace">5&apos; SENSE STRAND</text>
            <line x1="60" y1="165" x2="940" y2="165" stroke="#252535" strokeWidth="1.5" strokeDasharray="4 4" />
            <text x="65" y="178" fill="#71717a" fontSize="8" fontFamily="monospace">3&apos; ANTISENSE STRAND</text>

            {/* Four Functional Genomic Segment Blocks */}
            {[
              { id: "SEG-01", name: "SEG-01: Promoter / RBS", x: 50, width: 225, color: "#FF5500" },
              { id: "SEG-02", name: "SEG-02: Catalytic Core", x: 275, width: 225, color: "#06b6d4" },
              { id: "SEG-03", name: "SEG-03: Variable Domain", x: 500, width: 225, color: "#a855f7" },
              { id: "SEG-04", name: "SEG-04: 3' Terminator", x: 725, width: 225, color: "#10b981" },
            ].map((seg) => (
              <g
                key={seg.id}
                onClick={() => setSelectedLocus(seg.id)}
                className="cursor-pointer group"
              >
                <rect
                  x={seg.x}
                  y="60"
                  width={seg.width}
                  height="140"
                  fill="transparent"
                  stroke={selectedLocus === seg.id ? seg.color : "#282836"}
                  strokeWidth={selectedLocus === seg.id ? "2" : "1"}
                  className="transition-colors group-hover:stroke-primary"
                />
                <circle cx={seg.x + seg.width / 2} cy="60" r="6" fill={seg.color} />
                <text
                  x={seg.x + seg.width / 2}
                  y="52"
                  fill={seg.color}
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {seg.id}
                </text>
              </g>
            ))}

            {/* Carrier Codon Loci Markers */}
            {[...Array(32)].map((_, idx) => {
              const xPos = 80 + idx * 27;
              return (
                <line
                  key={`carrier-${idx}`}
                  x1={xPos}
                  y1="105"
                  x2={xPos}
                  y2="155"
                  stroke="#FF5500"
                  strokeWidth="1.5"
                  opacity="0.6"
                />
              );
            })}

            {/* Highlighted Carrier Callout */}
            <circle cx="500" cy="130" r="6" fill="#FF5500" />
            <circle cx="500" cy="130" r="14" fill="none" stroke="#FF5500" strokeWidth="1" opacity="0.4" strokeDasharray="3,3" />
            
            <g transform="translate(500, 220)">
              <rect x="-130" y="0" width="260" height="38" rx="6" fill="#181822" stroke="#FF5500" strokeWidth="1.2" />
              <text x="0" y="16" fill="#ffffff" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                Carrier Codon #508 (Glu: GAG &rarr; GAA)
              </text>
              <text x="0" y="30" fill="#a1a1aa" fontSize="9" fontFamily="monospace" textAnchor="middle">
                Synonymous Carrier &bull; RS Symbol: 0x7E &bull; CAI: 0.988
              </text>
            </g>
          </svg>
        </div>

        {/* Selected Segment Quick Info Box */}
        <div className="p-4 rounded-xl border border-[#24242e] bg-[#14141a] flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#FF5500] uppercase font-bold">
              Genomic Domain Inspection
            </span>
            <h4 className="text-sm font-bold text-white">{active.name}</h4>
            <p className="text-xs text-zinc-400 font-sans">{active.role}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-300 bg-[#1c1c24] border border-[#2b2b36] px-3 py-1.5 rounded-lg">
              Coordinates: {active.range}
            </span>
            <span className="text-xs font-mono text-[#FF5500] bg-[#FF5500]/10 border border-[#FF5500]/30 px-3 py-1.5 rounded-lg">
              {active.codons}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
