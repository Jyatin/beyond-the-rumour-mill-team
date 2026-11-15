"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Clock, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

const ROADMAP_MILESTONES = [
  {
    step: "01",
    id: "foundations",
    title: "DSA Foundations",
    badge: "Milestone 1",
    status: "completed", // completed | active | upcoming
    description: "Array transformations, two-pointer sweeps, sliding windows, and hash tables.",
    estimatedHours: "20-25 hrs",
    topics: ["Two Pointers", "Sliding Window", "Hash Maps", "Binary Search"],
    deliverable: "Solve 40 essential medium patterns",
    actionHref: "/questions?intent=dsa",
  },
  {
    step: "02",
    id: "advanced_dsa",
    title: "Advanced Data Structures & DP",
    badge: "Milestone 2",
    status: "active",
    description: "Binary search trees, graph BFS/DFS, topological sort, memoization, and interval scheduling.",
    estimatedHours: "35-40 hrs",
    topics: ["Tree Traversals", "Graph BFS/DFS", "Dynamic Programming", "Trie"],
    deliverable: "Solve 50 hard/medium pattern variations",
    actionHref: "/questions?intent=dsa",
  },
  {
    step: "03",
    id: "cs_core",
    title: "Core Computer Science",
    badge: "Milestone 3",
    status: "upcoming",
    description: "OS multi-threading, concurrency locks, DBMS indexing, normalization, and TCP socket lifecycle.",
    estimatedHours: "15-20 hrs",
    topics: ["Threads vs Processes", "B-Tree Indexes", "ACID Transactions", "TCP/IP"],
    deliverable: "Complete technical theory quiz & synthesis",
    actionHref: "/questions?intent=tech_round",
  },
  {
    step: "04",
    id: "system_design",
    title: "System Design & Scalability",
    badge: "Milestone 4",
    status: "upcoming",
    description: "High-level architecture, distributed caching with Redis, load balancers, rate limiters, and sharding.",
    estimatedHours: "25-30 hrs",
    topics: ["Rate Limiter", "Cache Invalidation", "Kafka Streaming", "Sharding"],
    deliverable: "Draft 3 architectural block diagrams",
    actionHref: "/questions?intent=tech_round",
  },
  {
    step: "05",
    id: "company_dossiers",
    title: "Target Company Dossiers",
    badge: "Milestone 5",
    status: "upcoming",
    description: "Sync with active on-campus placement drives. Review verified OA coding problem sets and cutoffs.",
    estimatedHours: "10-15 hrs",
    topics: ["Online Assessment", "Drive Cutoffs", "Previous Year Qs", "CGPA Eligibility"],
    deliverable: "Generate targeted company study checklist",
    actionHref: "/companies",
  },
  {
    step: "06",
    id: "alumni_mocks",
    title: "Alumni Mock Rehearsals",
    badge: "Milestone 6",
    status: "upcoming",
    description: "Simulated 1-on-1 whiteboard interview with placed graduates. Receive live coding critique and STAR tips.",
    estimatedHours: "5-10 hrs",
    topics: ["Live Coding Pair", "STAR Behavioral", "Resume Defense", "Feedback Score"],
    deliverable: "Pass 2 mock interview simulations",
    actionHref: "/alumni",
  },
  {
    step: "07",
    id: "offer_negotiation",
    title: "Offer & Transition",
    badge: "Final Stage",
    status: "upcoming",
    description: "Compensation package breakdown, base vs stock, joining bonus clauses, and transition preparation.",
    estimatedHours: "Completed",
    topics: ["CTC Breakdown", "Stock Units", "Joining Verification", "Give-to-Get"],
    deliverable: "Publish experience dossier to help juniors",
    actionHref: "/experiences/new",
  },
];

export function PreparationRoadmap({ userProgressPct = 40 }) {
  const [selectedMilestone, setSelectedMilestone] = React.useState(ROADMAP_MILESTONES[1]);

  return (
    <section className="space-y-8 rounded-3xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] p-6 sm:p-10 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#ECEAE5] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] font-bold text-[#1B635C] bg-[#EAF5EF] px-3 py-0.5 rounded-full border border-[#D4E8DC]">
              ● INTERACTIVE PREPARATION ROADMAP
            </span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#111111] dark:text-foreground tracking-tight">
            Your Technical Interview Journey
          </h2>
          <p className="text-xs sm:text-sm text-[#55515D] max-w-2xl mt-1 leading-relaxed">
            Follow this chronological milestone path to ensure complete preparation across DSA, low-level concepts, system design, and alumni rehearsal.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#FAF7F2] dark:bg-[var(--surface-elevated)] px-4 py-2 rounded-2xl border border-[#ECEAE5]">
          <Compass className="size-4 text-[#1B635C]" />
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-[#111111] dark:text-foreground block">
              Phase 2 of 7 Active
            </span>
            <span className="text-[10px] text-[#55515D] block">
              Pacing for Fall 2026 Season
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Milestone Timeline Track */}
      <div className="relative overflow-x-auto pb-4 pt-2 -mx-2 px-2">
        <div className="min-w-[840px] flex items-center justify-between relative">
          {/* Connecting line */}
          <div className="absolute top-6 left-8 right-8 h-1 bg-[#ECEAE5] dark:bg-[var(--border)] -z-0" />
          <div
            className="absolute top-6 left-8 h-1 bg-[#1B635C] transition-all duration-700 -z-0"
            style={{ width: `${userProgressPct}%` }}
          />

          {ROADMAP_MILESTONES.map((m) => {
            const isSelected = selectedMilestone.id === m.id;
            const isCompleted = m.status === "completed";
            const isActive = m.status === "active";

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMilestone(m)}
                className="group relative flex flex-col items-center text-center focus:outline-none cursor-pointer z-10 w-28"
              >
                {/* Node Circle */}
                <div
                  className={cn(
                    "size-12 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 shadow-2xs border-2",
                    isCompleted && "bg-[#1B635C] text-white border-[#1B635C]",
                    isActive && "bg-white text-[#1B635C] border-[#1B635C] ring-4 ring-[#1B635C]/20 scale-110",
                    !isCompleted && !isActive && "bg-white text-[#55515D] border-[#ECEAE5] hover:border-[#1B635C]/50"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    <span>{m.step}</span>
                  )}
                </div>

                {/* Milestone Title */}
                <span
                  className={cn(
                    "text-xs font-bold mt-2.5 line-clamp-1 transition-colors",
                    isSelected ? "text-[#1B635C]" : "text-[#111111] dark:text-foreground group-hover:text-[#1B635C]"
                  )}
                >
                  {m.title}
                </span>

                {/* Status Indicator */}
                <span
                  className={cn(
                    "text-[10px] font-mono uppercase mt-0.5 px-2 py-0.5 rounded-full font-semibold",
                    isCompleted && "bg-[#EAF5EF] text-[#17563F]",
                    isActive && "bg-[#DCEEEF] text-[#1B635C]",
                    !isCompleted && !isActive && "text-[#888590]"
                  )}
                >
                  {m.status}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Milestone Detail Drawer / Card */}
      <div className="rounded-2xl border border-[#DCEEEF] bg-[#F7FAF9] dark:bg-[var(--surface-elevated)] p-6 sm:p-8 space-y-4 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCEEEF] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full bg-[#1B635C] text-white">
                {selectedMilestone.badge}
              </span>
              <span className="text-xs font-mono text-[#55515D] flex items-center gap-1">
                <Clock className="size-3 text-[#1B635C]" /> Est: {selectedMilestone.estimatedHours}
              </span>
            </div>
            <h3 className="font-editorial text-2xl font-bold text-[#111111] dark:text-foreground">
              {selectedMilestone.title}
            </h3>
          </div>

          <Link
            href={selectedMilestone.actionHref}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#1B635C] hover:bg-[#154D48] text-white text-xs font-semibold shadow-xs transition-all hover:scale-102 self-start sm:self-auto"
          >
            <span>Start Practice Modules</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <p className="text-sm text-[#4A4752] dark:text-[#C5C0CF] leading-relaxed max-w-3xl">
          {selectedMilestone.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Key Topics */}
          <div className="p-4 rounded-xl bg-white dark:bg-[var(--surface)] border border-[#ECEAE5] space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#55515D] font-bold block">
              Core Technical Competencies:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedMilestone.topics.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2.5 py-1 rounded-md bg-[#FAF7F2] dark:bg-[var(--surface-elevated)] border border-[#ECEAE5] text-[#111111] dark:text-foreground font-medium"
                >
                  ✓ {t}
                </span>
              ))}
            </div>
          </div>

          {/* Goal & Deliverable */}
          <div className="p-4 rounded-xl bg-white dark:bg-[var(--surface)] border border-[#ECEAE5] space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#55515D] font-bold block">
              Milestone Pass Criteria:
            </span>
            <p className="text-xs text-[#111111] dark:text-foreground font-semibold flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#1B635C]" />
              {selectedMilestone.deliverable}
            </p>
            <p className="text-[11px] text-[#55515D] leading-relaxed">
              Progress updates automatically synchronize with your active readiness score.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
