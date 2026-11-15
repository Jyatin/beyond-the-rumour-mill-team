"use client";

import Image from "next/image";
import Link from "next/link";
import { Users2, ArrowUpRight, Award, ShieldCheck, Video, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MockInterviewStudio() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#D9D6CE] bg-[#FAF8F5] p-6 sm:p-8 md:p-10 shadow-xs">
      {/* Subtle organic warmth backdrop */}
      <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-[#E5ECE9]/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -bottom-20 size-72 rounded-full bg-[#E8E1D5]/40 blur-2xl" />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Illustration Framing (User Asset: prep-mock-rehearsal.jpg) */}
        <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
          <div className="relative group max-w-[380px] w-full">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#1B635C]/15 to-[#D9D6CE]/40 blur-lg opacity-80 group-hover:opacity-100 transition duration-500" />
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#1B635C]/20 bg-white p-3 shadow-sm">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#F0EBE1]">
                <Image
                  src="/assets/prep-mock-rehearsal.jpg"
                  alt="Candidate and senior alumni conducting live technical mock interview rehearsal"
                  fill
                  sizes="(max-width: 768px) 100vw, 380px"
                  className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>

              {/* Rubric feedback banner */}
              <div className="mt-3 p-3 rounded-xl bg-[#FAF9F5] border border-[#ECEAE5] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-[#1B635C]" />
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#63606B] font-bold">
                    Alumni Feedback Rubric:
                  </span>
                </div>
                <span className="font-semibold text-[#17563F] bg-[#EAF5EF] px-2 py-0.5 rounded text-[10px]">
                  4-Dimensional Score
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Studio Rehearsal Content */}
        <div className="lg:col-span-7 space-y-5 order-1 lg:order-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.12em] font-bold text-[#17563F] bg-[#EAF5EF] px-3 py-1 rounded-full border border-[#D4E8DC]">
              <Users2 className="size-3 text-[#1B635C]" />
              LIVE ALUMNI REHEARSAL STUDIO
            </span>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#F4F1EA] text-[#4A4752] border border-[#E3DDD1]">
              20% Readiness Weight
            </span>
          </div>

          <div>
            <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#111111] leading-tight">
              Rehearse Under Real Interview Pressure Before Day One
            </h3>
            <p className="text-xs sm:text-sm text-[#4A4752] mt-2 leading-relaxed">
              Nothing eliminates technical anxiety faster than simulated peer pressure. Schedule a 45-minute live mock with placed seniors who cleared the exact company loop you are targeting.
            </p>
          </div>

          {/* 3 Formats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-white border border-[#ECEAE5] space-y-1.5">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#1B635C]">
                <Video className="size-3.5" />
                <span>DSA Coding</span>
              </div>
              <p className="text-[11px] text-[#63606B] leading-snug">
                Live algorithmic coding on a shared whiteboard with edge-case grilling.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-[#ECEAE5] space-y-1.5">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#1B635C]">
                <CalendarCheck className="size-3.5" />
                <span>System Design</span>
              </div>
              <p className="text-[11px] text-[#63606B] leading-snug">
                Architecting scalable backends, database sharding, and latency defense.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-[#ECEAE5] space-y-1.5">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#1B635C]">
                <Award className="size-3.5" />
                <span>STAR Behavioral</span>
              </div>
              <p className="text-[11px] text-[#63606B] leading-snug">
                Transforming college projects and internships into high-impact narratives.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link href="/alumni">
              <Button className="bg-[#1B635C] hover:bg-[#154D48] text-white rounded-full px-5 py-2.5 text-xs font-semibold shadow-xs gap-2">
                <Users2 className="size-3.5" />
                <span>Browse Alumni Mentors by Company</span>
                <ArrowUpRight className="size-3.5" />
              </Button>
            </Link>
            <Link href="/experiences">
              <Button variant="outline" className="rounded-full px-4 py-2.5 text-xs font-semibold bg-white hover:bg-[#FAF7F2] border-[#ECEAE5] gap-2">
                <span>View Mock Rubrics</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

