"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 4 Redesigned Technical Interview Pillars
 * Each has an original hand-crafted SVG illustration, coordinated pastel card,
 * weightage badge, technical topics list, and interactive action.
 */

// 1. Core DSA & Code Mini-Illustration (Binary Tree & Matrix Graph)
function DsaIllustration() {
  return (
    <svg viewBox="0 0 160 100" fill="none" className="w-full h-24" aria-hidden="true">
      {/* Background soft grid */}
      <circle cx="80" cy="22" r="14" fill="#FFFFFF" stroke="#17563F" strokeWidth="2" />
      <text x="80" y="26" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#17563F" fontFamily="monospace">root</text>

      {/* Branch Lines */}
      <line x1="70" y1="32" x2="45" y2="52" stroke="#17563F" strokeWidth="1.8" />
      <line x1="90" y1="32" x2="115" y2="52" stroke="#17563F" strokeWidth="1.8" />

      {/* Left Child */}
      <circle cx="45" cy="58" r="12" fill="#D4E8DC" stroke="#17563F" strokeWidth="1.8" />
      <text x="45" y="62" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#17563F" fontFamily="monospace">L</text>

      {/* Right Child */}
      <circle cx="115" cy="58" r="12" fill="#FFFFFF" stroke="#17563F" strokeWidth="1.8" />
      <text x="115" y="62" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#17563F" fontFamily="monospace">R</text>

      {/* Sub-children */}
      <line x1="38" y1="68" x2="25" y2="82" stroke="#17563F" strokeWidth="1.5" strokeDasharray="2 2" />
      <line x1="52" y1="68" x2="62" y2="82" stroke="#17563F" strokeWidth="1.5" strokeDasharray="2 2" />
      <circle cx="25" cy="86" r="6" fill="#17563F" />
      <circle cx="62" cy="86" r="6" fill="#17563F" />

      <line x1="122" y1="68" x2="135" y2="82" stroke="#17563F" strokeWidth="1.5" strokeDasharray="2 2" />
      <circle cx="135" cy="86" r="6" fill="#17563F" />

      {/* Active Path Glow */}
      <circle cx="80" cy="22" r="18" stroke="#17563F" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 3" />
    </svg>
  );
}

// 2. System Design Mini-Illustration (Distributed Nodes & Cache)
function SystemDesignIllustration() {
  return (
    <svg viewBox="0 0 160 100" fill="none" className="w-full h-24" aria-hidden="true">
      {/* Client Node */}
      <rect x="10" y="36" width="28" height="26" rx="4" fill="#FFFFFF" stroke="#1B2540" strokeWidth="1.8" />
      <text x="24" y="52" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1B2540" fontFamily="sans-serif">API</text>

      {/* Load Balancer */}
      <line x1="38" y1="49" x2="56" y2="49" stroke="#1B2540" strokeWidth="1.6" />
      <circle cx="68" cy="49" r="12" fill="#D8E2F2" stroke="#1B2540" strokeWidth="1.8" />
      <text x="68" y="52" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#1B2540">LB</text>

      {/* Connecting buses */}
      <line x1="80" y1="42" x2="102" y2="28" stroke="#1B2540" strokeWidth="1.5" />
      <line x1="80" y1="56" x2="102" y2="70" stroke="#1B2540" strokeWidth="1.5" />

      {/* App Server 1 */}
      <rect x="102" y="16" width="46" height="22" rx="4" fill="#FFFFFF" stroke="#1B2540" strokeWidth="1.8" />
      <text x="125" y="30" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#1B2540">Service-A</text>

      {/* Redis Cache Pill */}
      <rect x="102" y="60" width="46" height="22" rx="11" fill="#FFEFEA" stroke="#C84B31" strokeWidth="1.8" />
      <text x="125" y="74" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#C84B31">Redis DB</text>
    </svg>
  );
}

// 3. CS Fundamentals Mini-Illustration (OS Scheduler & Memory B-Tree)
function CsFundamentalsIllustration() {
  return (
    <svg viewBox="0 0 160 100" fill="none" className="w-full h-24" aria-hidden="true">
      {/* CPU Chip */}
      <rect x="20" y="24" width="48" height="48" rx="6" fill="#FFFFFF" stroke="#7B4D1B" strokeWidth="2" />
      <rect x="30" y="34" width="28" height="28" rx="3" fill="#FDF3E3" stroke="#7B4D1B" strokeWidth="1.5" />
      <text x="44" y="52" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#7B4D1B" fontFamily="monospace">CPU</text>

      {/* CPU pins */}
      <line x1="26" y1="16" x2="26" y2="24" stroke="#7B4D1B" strokeWidth="2" />
      <line x1="38" y1="16" x2="38" y2="24" stroke="#7B4D1B" strokeWidth="2" />
      <line x1="50" y1="16" x2="50" y2="24" stroke="#7B4D1B" strokeWidth="2" />
      <line x1="62" y1="16" x2="62" y2="24" stroke="#7B4D1B" strokeWidth="2" />

      {/* Memory Stack Block */}
      <g transform="translate(85, 20)">
        <rect x="0" y="0" width="55" height="15" rx="3" fill="#FFFFFF" stroke="#7B4D1B" strokeWidth="1.5" />
        <text x="27" y="11" textAnchor="middle" fontSize="7" fill="#7B4D1B" fontFamily="monospace">STACK</text>

        <rect x="0" y="19" width="55" height="15" rx="3" fill="#FDF3E3" stroke="#7B4D1B" strokeWidth="1.5" />
        <text x="27" y="30" textAnchor="middle" fontSize="7" fill="#7B4D1B" fontFamily="monospace">HEAP</text>

        <rect x="0" y="38" width="55" height="15" rx="3" fill="#FFFFFF" stroke="#7B4D1B" strokeWidth="1.5" />
        <text x="27" y="49" textAnchor="middle" fontSize="7" fill="#7B4D1B" fontFamily="monospace">DBMS IDX</text>
      </g>
    </svg>
  );
}

// 4. Alumni Mocks Mini-Illustration (Candidate & Senior Pair Rehearsal)
function AlumniMocksIllustration() {
  return (
    <svg viewBox="0 0 160 100" fill="none" className="w-full h-24" aria-hidden="true">
      {/* Desk surface line */}
      <line x1="15" y1="78" x2="145" y2="78" stroke="#4A3469" strokeWidth="2" />

      {/* Senior Interviewer (Left) */}
      <circle cx="45" cy="38" r="14" fill="#FFFFFF" stroke="#4A3469" strokeWidth="2" />
      <path d="M31 78 C31 60, 59 60, 59 78" fill="#EAE2F8" stroke="#4A3469" strokeWidth="1.8" />
      <circle cx="41" cy="36" r="2" fill="#4A3469" />
      <circle cx="49" cy="36" r="2" fill="#4A3469" />

      {/* Speech Question Bubble */}
      <rect x="58" y="18" width="36" height="20" rx="6" fill="#FFFFFF" stroke="#4A3469" strokeWidth="1.6" />
      <text x="76" y="32" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6B46C1">STAR ?</text>

      {/* Candidate (Right) */}
      <circle cx="115" cy="38" r="14" fill="#FFFFFF" stroke="#4A3469" strokeWidth="2" />
      <path d="M101 78 C101 60, 129 60, 129 78" fill="#F3EEFA" stroke="#4A3469" strokeWidth="1.8" />
      <circle cx="111" cy="36" r="2" fill="#4A3469" />
      <circle cx="119" cy="36" r="2" fill="#4A3469" />

      {/* Checked Star Badge */}
      <circle cx="138" cy="24" r="9" fill="#17563F" />
      <path d="M134 24 l3 3 l6 -6" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const PILLARS_CONFIG = [
  {
    id: "dsa",
    title: "Core DSA & Problem Solving",
    weight: "35% Weight",
    badge: "High Impact",
    description: "Trees, Graphs, DP matrices, Two-Pointers, and complexity optimization required in Round 1 & 2.",
    topics: ["Binary Trees", "Dynamic Programming", "Graph Traversals", "Sliding Window"],
    colorScheme: {
      cardBg: "bg-[#F3FAF6] dark:bg-[var(--surface)]",
      borderColor: "border-[#C5E4D4] dark:border-[#335544]",
      accentText: "text-[#17563F] dark:text-[#8CD1AD]",
      badgeBg: "bg-[#D4E8DC] text-[#17563F] dark:bg-[#1E3B2E] dark:text-[#8CD1AD]",
      actionBorder: "border-[#17563F]/30 hover:bg-[#17563F] hover:text-white",
    },
    illustration: DsaIllustration,
    actionHref: "/questions?intent=dsa",
    actionLabel: "Explore DSA Problems",
  },
  {
    id: "design",
    title: "System Design & Scalability",
    weight: "25% Weight",
    badge: "Architecture",
    description: "Distributed caching, database indexing, sharding, message queues, and low-latency microservices.",
    topics: ["Distributed Caching", "Rate Limiting", "SQL vs NoSQL", "Event-Driven Queues"],
    colorScheme: {
      cardBg: "bg-[#EEF4FB] dark:bg-[var(--surface)]",
      borderColor: "border-[#C8DAEF] dark:border-[#2C405A]",
      accentText: "text-[#1B2540] dark:text-[#9FBBE0]",
      badgeBg: "bg-[#D8E2F2] text-[#1B2540] dark:bg-[#1B283E] dark:text-[#9FBBE0]",
      actionBorder: "border-[#1B2540]/30 hover:bg-[#1B2540] hover:text-white",
    },
    illustration: SystemDesignIllustration,
    actionHref: "/questions?intent=tech_round",
    actionLabel: "Study Architecture",
  },
  {
    id: "cs_fundamentals",
    title: "CS Fundamentals & OS",
    weight: "20% Weight",
    badge: "Core Theory",
    description: "Process scheduling, thread deadlocks, memory virtualisation, ACID transactions, and TCP protocols.",
    topics: ["Process vs Thread", "DBMS Normalization", "B-Tree Indexing", "TCP 3-Way Handshake"],
    colorScheme: {
      cardBg: "bg-[#FDF7EE] dark:bg-[var(--surface)]",
      borderColor: "border-[#EFE0C7] dark:border-[#524128]",
      accentText: "text-[#7B4D1B] dark:text-[#E8BD80]",
      badgeBg: "bg-[#F7E5C7] text-[#7B4D1B] dark:bg-[#3D2C12] dark:text-[#E8BD80]",
      actionBorder: "border-[#7B4D1B]/30 hover:bg-[#7B4D1B] hover:text-white",
    },
    illustration: CsFundamentalsIllustration,
    actionHref: "/questions?intent=tech_round",
    actionLabel: "Review Core Topics",
  },
  {
    id: "mocks",
    title: "Alumni Mock Interviews",
    weight: "20% Weight",
    badge: "Live Rehearsal",
    description: "One-on-one simulated interviews with placed alumni. Receive scoring, body language feedback, and tips.",
    topics: ["Whiteboard Rehearsal", "STAR Behavioral", "Resume Defense", "Offer Advice"],
    colorScheme: {
      cardBg: "bg-[#F6F2FB] dark:bg-[var(--surface)]",
      borderColor: "border-[#DFD2F3] dark:border-[#4B3B63]",
      accentText: "text-[#4A3469] dark:text-[#C5AEE3]",
      badgeBg: "bg-[#EAE2F8] text-[#4A3469] dark:bg-[#2C1D42] dark:text-[#C5AEE3]",
      actionBorder: "border-[#4A3469]/30 hover:bg-[#4A3469] hover:text-white",
    },
    illustration: AlumniMocksIllustration,
    actionHref: "/alumni",
    actionLabel: "Book Alumni Mock Slot",
  },
];

export function PreparationPillars({ activePillarId, onSelectPillar }) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] font-bold text-[#1B635C] bg-[#EAF5EF] px-3 py-0.5 rounded-full border border-[#D4E8DC]">
              ● INTERVIEW CURRICULUM WEIGHTS
            </span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#111111] dark:text-foreground tracking-tight">
            The Four Pillars of Interview Readiness
          </h2>
          <p className="text-xs sm:text-sm text-[#55515D] max-w-2xl mt-1 leading-relaxed">
            Derived deterministically from hundreds of verified candidate dossiers. Each pillar corresponds directly to weighted criteria in your readiness score.
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-[#55515D]">
          <span className="size-2 rounded-full bg-[#1B635C] animate-pulse" />
          <span>Synchronized with 2026/27 hiring bars</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
        {PILLARS_CONFIG.map((pillar) => {
          const Illus = pillar.illustration;
          const { cardBg, borderColor, accentText, badgeBg, actionBorder } = pillar.colorScheme;
          const isSelected = activePillarId === pillar.id;

          return (
            <div
              key={pillar.id}
              onClick={() => onSelectPillar && onSelectPillar(pillar.id)}
              className={cn(
                "group relative rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 shadow-xs hover:shadow-lg hover:-translate-y-1 cursor-pointer",
                cardBg,
                borderColor,
                isSelected && "ring-2 ring-[#1B635C] shadow-md"
              )}
            >
              {/* Top Header Row */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={cn("text-[10.5px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full tracking-wider", badgeBg)}>
                    {pillar.weight}
                  </span>
                  <span className="text-[10px] font-mono font-medium text-[#55515D] dark:text-[#A09CA8] uppercase">
                    {pillar.badge}
                  </span>
                </div>

                {/* Handcrafted Vector Illustration */}
                <div className="my-2 py-1 flex items-center justify-center rounded-2xl bg-white/70 dark:bg-black/10 border border-black/5 shadow-2xs group-hover:scale-102 transition-transform duration-300">
                  <Illus />
                </div>

                {/* Title & Description */}
                <h3 className={cn("font-editorial text-lg font-bold leading-snug mt-3", accentText)}>
                  {pillar.title}
                </h3>
                <p className="text-xs text-[#4A4752] dark:text-[#B5B0BF] mt-1.5 leading-relaxed line-clamp-3">
                  {pillar.description}
                </p>

                {/* Technical Topic Pills */}
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                  {pillar.topics.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-mono bg-white/80 dark:bg-black/20 text-[#111111] dark:text-foreground px-2 py-0.5 rounded-md border border-black/5"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Interactive Trigger */}
              <div className="mt-5 pt-3 border-t border-black/5 flex items-center justify-between">
                <Link
                  href={pillar.actionHref}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border bg-white dark:bg-[var(--surface-elevated)] transition-all",
                    actionBorder
                  )}
                >
                  <span>{pillar.actionLabel}</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
