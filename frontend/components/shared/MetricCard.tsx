import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtext?: string;
  icon?: React.ReactNode;
  className?: string;
  showTrendIcon?: boolean;
}

export function MetricCard({
  title,
  value,
  change,
  isPositive = true,
  subtext,
  className,
  showTrendIcon,
}: MetricCardProps) {
  // Only show trend arrows if explicitly requested or if change starts with + or -
  const hasTrendPrefix = typeof change === "string" && (change.startsWith("+") || change.startsWith("-"));
  const shouldShowTrend = showTrendIcon ?? hasTrendPrefix;

  return (
    <Card className={cn("min-h-[170px] overflow-hidden border border-border bg-card transition-colors hover:border-border/80", className)}>
      <CardContent className="p-5 flex flex-col justify-between h-full">
        {/* Top Header: Title */}
        <div className="flex items-start justify-between gap-3 min-h-10">
          <span className="text-xs leading-5 font-medium text-muted-foreground" title={title}>
            {title}
          </span>
        </div>

        {/* Value and Change Badge - flex-wrap with gap so they NEVER overlap */}
        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0 text-2xl sm:text-[28px] font-semibold tracking-tight text-foreground font-mono leading-tight whitespace-nowrap">
            {value}
          </div>
          {change && (
            <div
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium font-mono px-2.5 py-1 rounded-md shrink-0 whitespace-nowrap",
                isPositive
                  ? "bg-muted text-foreground/80 border border-border"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              )}
            >
              {shouldShowTrend && (
                isPositive ? (
                  <TrendingUp className="h-3 w-3 shrink-0" />
                ) : (
                  <TrendingDown className="h-3 w-3 shrink-0" />
                )
              )}
              <span>{change}</span>
            </div>
          )}
        </div>

        {/* Subtext description */}
        {subtext && (
          <p className="mt-4 text-xs leading-5 text-muted-foreground/80 font-sans" title={subtext}>
            {subtext}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

