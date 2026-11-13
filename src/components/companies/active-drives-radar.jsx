"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar, ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/ui/company-logo";

export function ActiveDrivesRadar({ drives = [] }) {
  const activeDrives = drives.slice(0, 3);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#D8E6DE] bg-gradient-to-br from-[#FAFBF9] via-[#FFFFFF] to-[#F1F8F4] p-6 sm:p-8 md:p-10 shadow-xs">
      {/* Decorative backdrop wash */}
      <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-[#1B635C]/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 size-72 rounded-full bg-[#EAF5EF] blur-2xl" />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Illustration Framing (Asset: company-drive-analysis.jpg) */}
        <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
          <div className="relative group max-w-[380px] w-full">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#1B635C]/15 to-[#BFE3D5]/25 blur-lg opacity-80 group-hover:opacity-100 transition duration-500" />
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#1B635C]/20 bg-white p-2.5 shadow-sm">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#EBF7F2]">
                <Image
                  src="/assets/company-drive-analysis.jpg"
                  alt="Students reviewing company placement eligibility criteria and technical drive schedules"
                  fill
                  sizes="(max-width: 768px) 100vw, 380px"
                  className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>

              {/* Bottom Quote Ribbon */}
              <div className="mt-2.5 p-3 rounded-xl bg-[#FAF9F5] border border-[#ECEAE5] flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#63606B] font-bold block">
                    Campus Placement Season
                  </span>
                  <span className="font-editorial font-bold text-[#111111] text-xs">
                    &ldquo;Verify branch cutoffs &amp; CGPA before registering.&rdquo;
                  </span>
                </div>
                <div className="size-7 rounded-full bg-[#1B635C] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 ml-2">
                  ✓
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Active Drives Radar List */}
        <div className="lg:col-span-7 space-y-5 order-1 lg:order-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.12em] font-bold text-[#17563F] bg-[#EAF5EF] px-3 py-1 rounded-full border border-[#D4E8DC]">
              <Sparkles className="size-3 text-[#1B635C]" />
              CAMPUS PLACEMENT RADAR · LIVE DRIVES
            </span>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF4FE] text-[#1D4ED8] border border-[#BFDBFE]">
              Active Hiring Season
            </span>
          </div>

          <div>
            <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#111111] leading-tight">
              Active Campus Drives &amp; Placement Deadlines
            </h3>
            <p className="text-xs sm:text-sm text-[#4A4752] mt-2 leading-relaxed">
              Official registration windows scheduled with the Training &amp; Placement Office. Check exact branch eligibility, CGPA cutoffs, and CTC packages.
            </p>
          </div>

          {/* Drive Cards Stream */}
          <div className="space-y-3 pt-1">
            {activeDrives.length === 0 ? (
              <p className="text-xs text-[#63606B] italic">No active campus drives scheduled this week. Check back as company schedules are updated.</p>
            ) : (
              activeDrives.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-2xl bg-white/90 border border-[#ECEAE5] hover:border-[#1B635C]/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <CompanyLogo name={d.companyName} size="sm" className="mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-editorial text-base font-bold text-[#111111]">
                          {d.companyName}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#FAF7F3] border border-[#EBE4D8] text-[#1A191D] font-bold">
                          {d.season || "Placement Drive"}
                        </span>
                        {d.status && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#D4E8DC] text-[#17563F] border border-[#17563F]/20">
                            ● {d.status}
                          </span>
                        )}
                      </div>
                    <p className="text-xs text-[#63606B] flex items-center gap-2">
                      <Calendar className="size-3 text-[#1B635C]" />
                      <span>{d.date || "Date announced soon"}</span>
                      {d.location && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {d.location}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/prepare?company=${d.companyId}`}>
                      <Button variant="outline" size="sm" className="text-xs rounded-full h-8 px-3 border-[#ECEAE5]">
                        Study Plan
                      </Button>
                    </Link>
                    <Link href={`/companies/${d.companyId}`}>
                      <Button size="sm" className="bg-[#1B635C] hover:bg-[#154D48] text-white text-xs rounded-full h-8 px-3 gap-1 shadow-xs">
                        <span>Dossier</span>
                        <ArrowUpRight className="size-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
