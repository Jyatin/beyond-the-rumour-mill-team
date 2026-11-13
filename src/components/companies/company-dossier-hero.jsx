"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles, Briefcase, Users, Calendar } from "lucide-react";
import { CompanyLogo } from "@/components/ui/company-logo";

export function CompanyDossierHero({
  companyName,
  industry = "Technology",
  experienceCount = 0,
  drivesCount = 0,
  alumniCount = 0,
  action,
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#D4E8DC] bg-gradient-to-b from-[#FAFDFB] via-[#F2F9F5] to-[#E9F5EF] p-6 sm:p-10 lg:p-12 mb-10 shadow-xs">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -left-28 -top-28 size-96 rounded-full bg-[#1B635C]/8 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 -bottom-28 size-96 rounded-full bg-[#3B82F6]/5 blur-3xl" />

      {/* Subtle background SVG pattern */}
      <svg className="pointer-events-none absolute inset-0 size-full stroke-[#1B635C]/5 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]" aria-hidden="true">
        <defs>
          <pattern id="dossier-hero-pattern" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M0 32V.5H32" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth="0" fill="url(#dossier-hero-pattern)" />
      </svg>

      <div className="relative space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/companies"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#1B635C] hover:text-[#154D48] transition-colors bg-white/80 px-3 py-1 rounded-full border border-[#D4E8DC] shadow-2xs"
          >
            <ArrowLeft className="size-3.5" />
            <span>← Back to Employer Directory</span>
          </Link>
          {action}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Side: Editorial Typography & Telemetry */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] font-bold text-[#17563F] bg-white/95 px-3.5 py-1 rounded-full border border-[#D4E8DC] shadow-2xs flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#17563F] animate-pulse" />
                VERIFIED COMPANY DOSSIER · {industry.toUpperCase()}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-center lg:justify-start">
              <CompanyLogo name={companyName} size="lg" className="mx-auto sm:mx-0 shadow-sm" />
              <div className="space-y-1">
                <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#111111] leading-[1.05]">
                  {companyName}
                </h1>
                <p className="text-xs font-mono uppercase tracking-wider text-[#63606B]">
                  {industry} • Verified Campus Hiring Record
                </p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-[#4A4752] max-w-xl leading-relaxed mx-auto lg:mx-0">
              Verified interview experiences, drive eligibility criteria, compensation packages, and multi-candidate consensus.
            </p>

            {/* Supporting Telemetry Strip */}
            <div className="pt-3 border-t border-[#D4E8DC]/80 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-[#55515D] font-mono">
              <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl border border-[#ECEAE5]">
                <Briefcase className="size-3.5 text-[#1B635C]" />
                <span><strong className="text-[#111111] font-sans">{experienceCount}</strong> Experiences</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl border border-[#ECEAE5]">
                <Calendar className="size-3.5 text-[#1B635C]" />
                <span><strong className="text-[#111111] font-sans">{drivesCount}</strong> Placement Drives</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl border border-[#ECEAE5]">
                <Users className="size-3.5 text-[#1B635C]" />
                <span><strong className="text-[#111111] font-sans">{alumniCount}</strong> Placed Alumni</span>
              </div>
            </div>
          </div>

          {/* Right Side: Editorial Illustration Composition (Asset: company-dossier-study.jpg) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[420px]">
              {/* Layered Organic Backdrop Glows */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#1B635C]/20 via-[#BEE3D3]/40 to-transparent blur-xl" />

              {/* Hand-Crafted Frame with Navy Linework Accent */}
              <div className="relative overflow-hidden rounded-3xl border-2 border-[#1B635C]/25 bg-white p-3 shadow-md">
                <div className="relative aspect-[16/11] w-full overflow-hidden rounded-2xl bg-[#E8F5EF] flex items-center justify-center">
                  <Image
                    src="/assets/company-dossier-study.jpg"
                    alt={`Student analyzing ${companyName} placement dossier and technical round archives`}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 420px"
                    className="object-cover object-center hover:scale-[1.02] transition-transform duration-500"
                  />

                  {/* Floating Micro Badges */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full border border-[#D4E8DC] shadow-xs flex items-center gap-1.5">
                    <ShieldCheck className="size-3 text-[#1B635C]" />
                    <span className="font-mono text-[10px] font-bold text-[#17563F]">
                      Consensus Validated
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full border border-[#D4E8DC] shadow-xs flex items-center gap-1.5">
                    <Sparkles className="size-3 text-[#B57324]" />
                    <span className="font-mono text-[10px] font-bold text-[#7A4B13]">
                      OA Coding Round
                    </span>
                  </div>
                </div>

                {/* Bottom Quote Ribbon */}
                <div className="mt-2.5 p-3 rounded-xl bg-[#FAF9F5] border border-[#ECEAE5] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-7 rounded-full bg-[#EAF5EF] border border-[#D4E8DC] flex items-center justify-center shrink-0">
                      <ShieldCheck className="size-3.5 text-[#1B635C]" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#63606B] font-bold block">
                        Verified Signal
                      </span>
                      <p className="font-editorial font-bold text-[#111111] text-xs truncate">
                        &ldquo;Multi-candidate consensus on questions &amp; difficulty.&rdquo;
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#1B635C] text-white shrink-0 ml-2">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
