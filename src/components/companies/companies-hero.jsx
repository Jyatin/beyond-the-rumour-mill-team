"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, Calendar, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CompaniesHero({ companyCount = 0, driveCount = 0 }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#D4E8DC] bg-gradient-to-b from-[#FAFDFB] via-[#F2F9F5] to-[#E9F5EF] p-6 sm:p-10 lg:p-14 mb-10 shadow-xs">
      {/* Background ambient lighting and subtle organic textures */}
      <div className="pointer-events-none absolute -left-28 -top-28 size-96 rounded-full bg-[#1B635C]/8 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 -bottom-28 size-96 rounded-full bg-[#3B82F6]/5 blur-3xl" />

      {/* Subtle background SVG architectural pattern */}
      <svg className="pointer-events-none absolute inset-0 size-full stroke-[#1B635C]/5 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]" aria-hidden="true">
        <defs>
          <pattern id="companies-hero-pattern" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M0 32V.5H32" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth="0" fill="url(#companies-hero-pattern)" />
      </svg>

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Side: Editorial Typography & Actions */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] font-bold text-[#17563F] bg-white/95 px-3.5 py-1 rounded-full border border-[#D4E8DC] shadow-2xs flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#17563F] animate-pulse" />
              CAMPUS RECRUITMENT INTELLIGENCE ARCHIVE
            </span>
          </div>

          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#111111] leading-[1.06]">
            Explore Verified Employers &amp; Placement Drives.
          </h1>

          <p className="text-sm sm:text-base text-[#4A4752] max-w-xl leading-relaxed mx-auto lg:mx-0">
            Replace unverified placement rumors with official drive criteria, candidate interview debriefs, compensation packages, and consensus-backed question archives.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <Link href="#employers-directory">
              <Button className="bg-[#1B635C] hover:bg-[#154D48] text-white rounded-full px-6 py-2.5 text-xs font-semibold shadow-xs gap-2">
                <Building2 className="size-3.5" />
                <span>Browse Employer Directory</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
            <Link href="/prepare">
              <Button variant="outline" className="rounded-full px-6 py-2.5 text-xs font-semibold bg-white hover:bg-[#FAF7F2] border-[#ECEAE5] gap-2">
                <Sparkles className="size-3.5 text-[#1B635C]" />
                <span>Preparation Command Center</span>
              </Button>
            </Link>
          </div>

          {/* Supporting Telemetry Strip */}
          <div className="pt-4 border-t border-[#D4E8DC]/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#55515D] font-mono">
            <div className="flex items-center gap-1.5">
              <Building2 className="size-3.5 text-[#1B635C]" />
              <span><strong className="text-[#111111] font-sans">{companyCount || 24}</strong> Indexed Employers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-[#1B635C]" />
              <span><strong className="text-[#111111] font-sans">{driveCount || 8}</strong> Active Campus Drives</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-[#1B635C]" />
              <span><strong className="text-[#111111] font-sans">100%</strong> Consensus Verified</span>
            </div>
          </div>
        </div>

        {/* Right Side: Editorial Illustration Composition (Asset: company-recruitment-team.png) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-[460px]">
            {/* Layered Organic Backdrop Glows */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#1B635C]/20 via-[#BEE3D3]/40 to-transparent blur-xl" />

            {/* Hand-Crafted Frame with Navy Linework Accent */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-[#1B635C]/25 bg-white p-3.5 shadow-md">
              <div className="relative aspect-[16/11] w-full overflow-hidden rounded-2xl bg-[#E8F5EF] flex items-center justify-center">
                <Image
                  src="/assets/company-recruitment-team.png"
                  alt="Students and placement committee analyzing company hiring criteria and technical interview roadmaps"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 460px"
                  className="object-cover object-center hover:scale-[1.02] transition-transform duration-500"
                />

                {/* Floating Top-Left Micro Badge */}
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full border border-[#D4E8DC] shadow-xs flex items-center gap-1.5">
                  <ShieldCheck className="size-3 text-[#1B635C]" />
                  <span className="font-mono text-[10px] font-bold text-[#17563F]">
                    Verified Round Data
                  </span>
                </div>

                {/* Floating Top-Right Micro Badge */}
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full border border-[#D4E8DC] shadow-xs flex items-center gap-1.5">
                  <Sparkles className="size-3 text-[#B57324]" />
                  <span className="font-mono text-[10px] font-bold text-[#7A4B13]">
                    CTC &amp; Cutoffs
                  </span>
                </div>
              </div>

              {/* Bottom Quote & Defense Ribbon */}
              <div className="mt-3 p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#ECEAE5] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-full bg-[#EAF5EF] border border-[#D4E8DC] flex items-center justify-center shrink-0">
                    <Building2 className="size-4 text-[#1B635C]" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#63606B] font-bold block">
                      Placement Consensus
                    </span>
                    <p className="font-editorial font-bold text-[#111111] text-xs truncate">
                      &ldquo;Clear cutoffs and round breakdowns before day one.&rdquo;
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#1B635C] text-white shrink-0 ml-2">
                  Official
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
