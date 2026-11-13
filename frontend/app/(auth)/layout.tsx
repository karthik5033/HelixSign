"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopHeader } from "@/components/layout/TopHeader";

const routeTitles: Record<string, string> = {
  "/input": "Sequence & Construct Input Studio",
  "/dashboard": "Construct Overview & Provenance",
  "/upload": "Construct Ingestion & Stamp Studio",
  "/analysis": "Steganographic Pipeline Explorer",
  "/localization": "Carrier Locus & Codon Mapping",
  "/topology-engine": "Codon Manifold & Realism Engine",
  "/compare": "Stealth Detector Benchmarking",
  "/monitor": "Channel Stress Lab & Monitor",
  "/datasets": "Genomic CDS Datasets",
  "/reports": "Provenance & Audit Reports",
  "/settings": "Cryptographic & Bio Settings",
  "/architecture": "System Architecture",
  "/docs": "Documentation",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    const pageTitle = routeTitles[pathname] || "Diagnostics Console";
    document.title = `${pageTitle} | HelixSign`;
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 350);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="h-full flex z-30 relative shrink-0">
        <AppSidebar />
      </div>

      {/* Main Container */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
        <TopHeader />
        <main
          ref={mainRef}
          className="flex-1 flex flex-col relative overflow-y-auto bg-slate-50/40 dark:bg-background/95"
        >
          {isNavigating && (
            <div className="absolute top-0 left-0 right-0 z-40 h-[2px] bg-[#FF5500]" />
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

