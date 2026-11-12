import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

function Avatar({ className, size = "md", children, ...props }: AvatarProps) {
  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full border border-border bg-muted font-medium items-center justify-center text-foreground",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function AvatarImage({ src, alt, className }: React.ImgHTMLAttributes<HTMLImageElement>) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt || "Avatar"}
      className={cn("aspect-square h-full w-full object-cover", className)}
    />
  );
}

function AvatarFallback({ children, className }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}>
      {children}
    </span>
  );
}

export { Avatar, AvatarImage, AvatarFallback };

