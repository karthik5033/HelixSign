"use client";

import React, { useEffect, useState } from "react";

export default function LandingRuntime() {
  const [LandingPage, setLandingPage] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      import("@/components/landing/HelixSignLandingPage").then((module) => {
        setLandingPage(() => module.default);
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return LandingPage ? <LandingPage /> : null;
}
