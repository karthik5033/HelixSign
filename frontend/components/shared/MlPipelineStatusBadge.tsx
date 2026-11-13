"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Activity, Cpu, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { getHealthStatus, HealthStatus } from "@/lib/mlPipelineClient";

export function MlPipelineStatusBadge({ compact = false }: { compact?: boolean }) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const h = await getHealthStatus();
        if (mounted) {
          setHealth(h);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setHealth(null);
          setLoading(false);
        }
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const isConnected = health?.mlServiceConnected;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-md border border-border/60 bg-muted/20">
        <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
        <span className="text-muted-foreground">ML Engine:</span>
        <span className={isConnected ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
          {loading ? "Checking..." : isConnected ? "Active (Port 8000)" : "Local Fallback"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-card/60 backdrop-blur text-xs">
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
        <span className="font-mono text-muted-foreground">FastAPI v{health?.version || "0.1.0"}:</span>
        <Badge
          variant="outline"
          className={
            isConnected
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]"
              : "bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]"
          }
        >
          {loading ? "Connecting..." : isConnected ? "ML Service Online" : "Local Codec"}
        </Badge>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono border-l border-border/40 pl-2">
        <span className="text-muted-foreground flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-primary" />
          Critic AUC: <strong className="text-foreground">0.505 (Chance)</strong>
        </span>
        <span className="text-muted-foreground flex items-center gap-1">
          <Zap className="h-3 w-3 text-amber-400" />
          RS(16,8): <strong className="text-foreground">GF(256)</strong>
        </span>
      </div>
    </div>
  );
}

