import React from "react";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  name?: string;
  showBadge?: boolean;
}

export function AppLogo({
  className,
  size = "md",
  showText = true,
  name = "HelixSign",
  showBadge = true,
}: AppLogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-7 h-7",
    lg: "w-9 h-9",
    xl: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div className={cn("relative flex items-center justify-center shrink-0 drop-shadow-sm", iconSizes[size])}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full select-none"
          aria-hidden="true"
        >
          <defs>
            {/* Obsidian Glass Gradient for Badge */}
            <linearGradient id="logoBadgeBg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1C1C26" />
              <stop offset="50%" stopColor="#121218" />
              <stop offset="100%" stopColor="#0B0B0F" />
            </linearGradient>

            {/* Glowing Border: Burnt Orange to Dark Slate */}
            <linearGradient id="logoBadgeBorder" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF5500" stopOpacity="0.8" />
              <stop offset="35%" stopColor="#FF5500" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#2E2E3E" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#1A1A24" stopOpacity="0.9" />
            </linearGradient>

            {/* Front Strand: Vibrant Helix Ember */}
            <linearGradient id="logoFrontStrand" x1="8" y1="5" x2="24" y2="27" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFA266" />
              <stop offset="30%" stopColor="#FF6A1A" />
              <stop offset="70%" stopColor="#FF5500" />
              <stop offset="100%" stopColor="#D43800" />
            </linearGradient>

            {/* Back Strand: Luminescent Titanium */}
            <linearGradient id="logoBackStrand" x1="24" y1="5" x2="8" y2="27" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="30%" stopColor="#E2E8F0" />
              <stop offset="70%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>

            {/* Ambient Bloom Glow */}
            <radialGradient id="logoCenterGlow" cx="16" cy="16" r="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF5500" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#FF5500" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#FF5500" stopOpacity="0" />
            </radialGradient>

            {/* Subtle Overpass Shadow */}
            <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000000" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Optional Obsidian Badge Background */}
          {showBadge && (
            <>
              <circle cx="16" cy="16" r="10" fill="url(#logoCenterGlow)" />
              <rect
                x="1.2"
                y="1.2"
                width="29.6"
                height="29.6"
                rx="7.5"
                fill="url(#logoBadgeBg)"
                stroke="url(#logoBadgeBorder)"
                strokeWidth="1.2"
              />
            </>
          )}

          {/* Subtle Carrier Base-Pair Rungs */}
          <line x1="10" y1="9" x2="22" y2="9" stroke="#3A3A4C" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="13" cy="9" r="0.9" fill="#94A3B8" />
          <circle cx="19" cy="9" r="0.9" fill="#FF7A33" />

          <line x1="12" y1="12.5" x2="20" y2="12.5" stroke="#48485E" strokeWidth="1.2" strokeLinecap="round" />

          {/* Cryptographic Locus Provenance Center Rung */}
          <line x1="12" y1="16" x2="20" y2="16" stroke="#FF5500" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="16" cy="16" r="2.2" fill="#FF5500" />
          <circle cx="16" cy="16" r="1" fill="#FFFFFF" />

          <line x1="12" y1="19.5" x2="20" y2="19.5" stroke="#48485E" strokeWidth="1.2" strokeLinecap="round" />

          <line x1="10" y1="23" x2="22" y2="23" stroke="#3A3A4C" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="13" cy="23" r="0.9" fill="#FF7A33" />
          <circle cx="19" cy="23" r="0.9" fill="#94A3B8" />

          {/* BACK STRAND (Titanium) */}
          <path
            d="M 22.5 5.5 C 23.5 10 19 13.5 16 16 C 13 18.5 8.5 22 9.5 26.5"
            stroke="url(#logoBackStrand)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* FRONT STRAND (Vibrant Flame) */}
          <path
            d="M 9.5 5.5 C 8.5 10 13 13.5 16 16 C 19 18.5 23.5 22 22.5 26.5"
            stroke="url(#logoFrontStrand)"
            strokeWidth="2.6"
            strokeLinecap="round"
            filter="url(#logoShadow)"
          />

          {/* Terminal 5' and 3' Nucleotide Caps */}
          <circle cx="9.5" cy="5.5" r="1.5" fill="#FFA266" />
          <circle cx="22.5" cy="5.5" r="1.5" fill="#FFFFFF" />
          <circle cx="9.5" cy="26.5" r="1.5" fill="#CBD5E1" />
          <circle cx="22.5" cy="26.5" r="1.5" fill="#FF5500" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-[650] text-white tracking-[-0.035em] leading-none font-sans",
                textSizes[size]
              )}
            >
              {name}
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 mt-0.5">
            DNA provenance
          </span>
        </div>
      )}
    </div>
  );
}
