"use client";

import * as React from "react";
import { PlacedConnectingScene } from "@/components/marketing/illustrations";

/**
 * Editorial Hero Illustration for the /connect page
 * Layered collage with Placed Alumni (Left) ↔ Tomorrow's Talent (Right),
 * authentic interview papers, 1.2–1.8s staged reveal sequence, and gentle hanging float.
 */
export function ConnectHeroIllustration() {
  const [stage, setStage] = React.useState(0);
  React.useEffect(() => {
    // Staged editorial reveal sequence
    const t1 = setTimeout(() => setStage(1), 80);
    const t2 = setTimeout(() => setStage(2), 250);
    const t3 = setTimeout(() => setStage(3), 500);
    const t4 = setTimeout(() => setStage(4), 850);
    const t5 = setTimeout(() => setStage(5), 1100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);
  return <div className="relative w-full max-w-[540px] md:max-w-[580px] lg:max-w-[620px] xl:max-w-[670px] select-none">
      {/* 1. LAYER: Ambient Clean Background Glow */}
      <div className={`absolute -inset-4 bg-gradient-to-tr from-[#F0EAF7]/50 via-transparent to-[#F4F2F9]/50 rounded-3xl blur-2xl pointer-events-none transition-opacity duration-1000 ${stage >= 1 ? "opacity-100 animate-glow-drift" : "opacity-0"}`} />

      {/* 2. LAYER: Master Hanging Physical Editorial Artwork */}
      <div className={`relative transition-all duration-1000 ease-out ${stage >= 1 ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-[0.98]"}`}>
        <div className="animate-hero-hanging origin-top-center">
          {/* Main Hand-Drawn Placed ↔ Tomorrow's Talent Scene Canvas */}
          <div className="relative border border-[var(--border)] bg-[#FFFFFF] dark:bg-[var(--surface)] p-4 sm:p-6 rounded-sm shadow-card hover:shadow-xl transition-shadow duration-500">
            {/* Sheet Top Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5 mb-3">
              <span className="type-data text-[11px] font-mono text-[var(--brand-bright)] uppercase font-semibold">
                CONNECT DOSSIER / 01 · ALUMNI NETWORK
              </span>
              <span className="type-data text-[10px] font-mono text-[var(--muted)]">
                SEASON 2026
              </span>
            </div>

            {/* Hand-Drawn Master Illustration */}
            <PlacedConnectingScene className="w-full h-auto" />
          </div>
        </div>
      </div>
    </div>;
}