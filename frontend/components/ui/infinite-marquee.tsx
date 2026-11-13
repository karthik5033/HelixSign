import React from "react";
import { cn } from "@/lib/utils";

interface InfiniteMarqueeProps {
  children: React.ReactNode;
  direction?: "left" | "right";
  speed?: "slow" | "normal" | "fast";
  className?: string;
}

export function InfiniteMarquee({
  children,
  direction = "left",
  speed = "normal",
  className,
}: InfiniteMarqueeProps) {
  return (
    <div className={cn("overflow-hidden whitespace-nowrap flex w-full", className)}>
      <div className="flex animate-marquee shrink-0 items-center gap-8">
        {children}
      </div>
      <div className="flex animate-marquee shrink-0 items-center gap-8" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

