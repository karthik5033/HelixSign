"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Search,
  Sun,
  Moon,
  Layers,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/ThemeContext";
import dynamic from "next/dynamic";

const NotificationCenter = dynamic(
  () => import("./NotificationCenter").then((mod) => mod.NotificationCenter),
  { ssr: false }
);
const CommandPalette = dynamic(
  () => import("./CommandPalette").then((mod) => mod.CommandPalette),
  { ssr: false }
);

export function TopHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const getPageTitle = () => {
    if (pathname.includes("/input")) return "Sequence & Construct Input Studio";
    if (pathname.includes("/dashboard")) return "Construct Overview & Provenance";
    if (pathname.includes("/upload")) return "Construct Ingestion & Stamp Studio";
    if (pathname.includes("/analysis")) return "Steganographic Pipeline Explorer";
    if (pathname.includes("/localization")) return "Carrier Locus & Codon Mapping";
    if (pathname.includes("/topology-engine")) return "Codon Manifold & Realism Engine";
    if (pathname.includes("/compare")) return "Stealth Detector Benchmarking";
    if (pathname.includes("/monitor")) return "Channel Stress Lab & Monitor";
    if (pathname.includes("/datasets")) return "Genomic CDS Datasets Library";
    if (pathname.includes("/reports")) return "Provenance & Audit Reports";
    if (pathname.includes("/settings")) return "Cryptographic & Bio Settings";
    if (pathname.includes("/architecture")) return "Architecture";
    if (pathname.includes("/docs")) return "Documentation";
    return "Overview & Status";
  };

  return (
    <>
      <header className="flex h-14 w-full items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur-md sticky top-0 z-20">
        {/* Left: Clean Single-Line Breadcrumb */}
        <div className="flex items-center gap-2 text-sm min-w-0">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground transition-colors font-medium shrink-0"
          >
            Console
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          <h1 className="text-sm font-semibold text-foreground tracking-tight truncate">
            {getPageTitle()}
          </h1>
        </div>

        {/* Center: Search / Command Trigger */}
        <div className="hidden md:flex items-center max-w-sm w-full mx-6">
          <button
            onClick={() => setIsCommandOpen(true)}
            className="flex h-8 w-full items-center justify-between rounded-lg border border-border/80 bg-muted/40 px-3 text-xs text-muted-foreground hover:bg-muted/70 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span>Search</span>
            </div>
            <kbd className="pointer-events-none hidden sm:inline-flex h-4 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Quick Links, Theme Toggle, Notifications */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <Link href="/input">
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5 h-8 px-3 rounded-lg cursor-pointer"
            >
              <span>Input Sequence</span>
            </Button>
          </Link>
          <Link
            href="/architecture"
            className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors flex items-center gap-1.5 font-medium"
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Architecture</span>
          </Link>
          <Link
            href="/docs"
            className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors flex items-center gap-1.5 font-medium"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Docs</span>
          </Link>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Notification Button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Button>
            {isNotificationsOpen && (
              <NotificationCenter onClose={() => setIsNotificationsOpen(false)} />
            )}
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
}
