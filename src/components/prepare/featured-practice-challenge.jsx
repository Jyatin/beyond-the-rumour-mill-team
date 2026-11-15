"use client";

import Image from "next/image";
import Link from "next/link";
import { Code2, ArrowUpRight, CheckCircle2, Clock, Sparkles, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeaturedPracticeChallenge() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#D8E6DE] bg-gradient-to-br from-[#FAFBF9] via-[#FFFFFF] to-[#F1F8F4] p-6 sm:p-8 md:p-10 shadow-xs">
      {/* Decorative background grid and organic wash */}
      <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-[#1B635C]/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 size-72 rounded-full bg-[#EAF5EF] blur-2xl" />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Challenge Context and Details */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.12em] font-bold text-[#17563F] bg-[#EAF5EF] px-3 py-1 rounded-full border border-[#D4E8DC]">
              <Sparkles className="size-3 text-[#1B635C]" />
              PRACTICE OF THE DAY · CORE ALGORITHMS
            </span>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
              Hard
            </span>
            <span className="text-[11px] font-mono text-[#63606B] flex items-center gap-1">
              <Clock className="size-3" /> 45 min target
            </span>
          </div>

          <div>
            <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#111111] leading-tight">
              Design an In-Memory Distributed Cache with LRU Eviction &amp; TTL
            </h3>
            <p className="text-xs sm:text-sm text-[#4A4752] mt-2 leading-relaxed">
              Asked in recent senior engineering and fresher rounds at <span className="font-semibold text-[#111111]">Google, Uber, and Atlassian</span>. Test your command over composite data structures, concurrency, and time complexity.
            </p>
          </div>

          {/* Key Evaluation Criteria */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#63606B] font-bold block">
              Interview Rubric Focus:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2A2830]">
              <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-[#ECEAE5]">
                <CheckCircle2 className="size-4 text-[#1B635C] shrink-0 mt-0.5" />
                <span><strong className="text-[#111111]">O(1) Time:</strong> Doubly Linked List + Hash Map synchronization.</span>
              </div>
              <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-[#ECEAE5]">
                <CheckCircle2 className="size-4 text-[#1B635C] shrink-0 mt-0.5" />
                <span><strong className="text-[#111111]">Concurrency:</strong> Fine-grained read-write mutex locks.</span>
              </div>
              <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-[#ECEAE5]">
                <CheckCircle2 className="size-4 text-[#1B635C] shrink-0 mt-0.5" />
                <span><strong className="text-[#111111]">TTL Worker:</strong> Lazy expiration vs periodic sweep amortized cost.</span>
              </div>
              <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-[#ECEAE5]">
                <CheckCircle2 className="size-4 text-[#1B635C] shrink-0 mt-0.5" />
                <span><strong className="text-[#111111]">STAR Defense:</strong> Clear trade-off analysis during technical questioning.</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link href="/questions?search=cache">
              <Button className="bg-[#1B635C] hover:bg-[#154D48] text-white rounded-full px-5 py-2.5 text-xs font-semibold shadow-xs gap-2">
                <Terminal className="size-3.5" />
                <span>Solve Problem in Questions Hub</span>
                <ArrowUpRight className="size-3.5" />
              </Button>
            </Link>
            <Link href="/experiences">
              <Button variant="outline" className="rounded-full px-4 py-2.5 text-xs font-semibold bg-white hover:bg-[#FAF7F2] border-[#ECEAE5] gap-2">
                <Code2 className="size-3.5 text-[#1B635C]" />
                <span>Read Candidate Debriefs</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Right: Editorial Illustration Framing (User Asset: prep-code-checklist.jpg) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative group max-w-[360px] w-full">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#1B635C]/15 to-[#BFE3D5]/25 blur-lg opacity-80 group-hover:opacity-100 transition duration-500" />
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#1B635C]/20 bg-white p-2.5 shadow-sm">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#EBF7F2]">
                <Image
                  src="/assets/prep-code-checklist.jpg"
                  alt="Software engineer ticking off technical interview preparation checklist"
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>

              {/* Floating Quote Ribbon */}
              <div className="mt-2.5 p-3 rounded-xl bg-[#FAF9F5] border border-[#ECEAE5] flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#63606B] font-bold block">
                    Preparation Focus
                  </span>
                  <span className="font-editorial font-bold text-[#111111] text-xs">
                    &ldquo;Write clean code before optimizing complexity.&rdquo;
                  </span>
                </div>
                <div className="size-7 rounded-full bg-[#1B635C] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 ml-2">
                  ✓
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
