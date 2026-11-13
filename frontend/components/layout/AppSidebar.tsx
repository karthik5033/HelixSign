"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Waves,
  Activity,
  Crosshair,
  Cpu,
  GitCompare,
  Radio,
  Database,
  FileText,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  FileKey,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppLogo } from "@/components/ui/AppLogo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/AuthContext";

export const NAV_ITEMS = [
  { label: "Input Sequence", href: "/input", icon: Sparkles },
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Construct Ingestion", href: "/upload", icon: Waves },
  { label: "Universal File Stego", href: "/file-stego", icon: FileKey },
  { label: "Genomic CDS Datasets", href: "/datasets", icon: Database },
  { label: "Provenance Reports", href: "/reports", icon: FileText },
  { label: "Settings", href: "/settings", icon: Sliders },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, role } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isStale =
    !user.firstName ||
    user.firstName.toLowerCase().includes("operations") ||
    user.lastName.toLowerCase().includes("lead") ||
    user.firstName.toLowerCase().includes("karthik") ||
    user.lastName.toLowerCase().includes("k p") ||
    user.lastName.toLowerCase().includes("rai") ||
    user.firstName.toLowerCase().includes("gagan") ||
    user.email?.toLowerCase().includes("rvu") ||
    user.email?.toLowerCase().includes("echosense");
  const displayName = isStale ? "Principal Investigator" : `${user.firstName} ${user.lastName}`;
  const displayRole = isStale ? "DIRECTOR" : (role || "DIRECTOR");
  const initials = isStale ? "PI" : `${user.firstName[0] || ""}${user.lastName[0] || ""}`.toUpperCase();

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border bg-card shadow-sm transition-all duration-300 relative select-none",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Section */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-border/60 transition-all",
          isCollapsed ? "justify-center px-0" : "justify-between px-4"
        )}
      >
        <Link href="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
          <AppLogo size="md" showText={!isCollapsed} />
        </Link>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {isCollapsed && (
        <div className="flex justify-center py-2 border-b border-border/40">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            title="Expand Sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Navigation
          </div>
        )}

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group relative cursor-pointer",
                isActive
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {!isCollapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Role & User Footer */}
      <div className="border-t border-border/60 p-3 bg-muted/20">
        <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "px-1")}>
          <Avatar size="sm" className="bg-primary/10 text-primary border-primary/20">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold leading-tight text-foreground truncate">
                {displayName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border">
                  {displayRole}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
