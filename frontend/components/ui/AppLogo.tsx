import React from "react";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  name?: string;
}

export function AppLogo({
  className,
  size = "md",
  showText = true,
  name = "HelixSign",
}: AppLogoProps) {
  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div className={cn("relative flex items-center justify-center shrink-0", iconSizes[size])}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-hidden="true"
        >
          <circle cx="16" cy="16" r="13" stroke="#34343B" strokeWidth="1.5" />
          <path
            d="M8.5 5.5C20.8 8.3 20.8 23.7 8.5 26.5M23.5 5.5C11.2 8.3 11.2 23.7 23.5 26.5"
            stroke="#C87746"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M11.5 8.5h9M10.5 12.5h11M10.5 16h11M10.5 19.5h11M11.5 23.5h9"
            stroke="#A8B1AE"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="8.5" cy="5.5" r="1.7" fill="#C87746" />
          <circle cx="23.5" cy="26.5" r="1.7" fill="#C87746" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col text-left">
          <span className={cn("font-bold text-foreground tracking-tight leading-none", textSizes[size])}>
            {name}
          </span>
          <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase mt-0.5">
            DNA PROVENANCE
          </span>
        </div>
      )}
    </div>
  );
}
