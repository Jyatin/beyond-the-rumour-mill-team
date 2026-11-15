"use client";

import Image from "next/image";
import Link from "next/link";
import { DollarSign, CheckCircle2, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfferNegotiationGuide() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#E8DCC8] bg-gradient-to-br from-[#FFFDF9] via-[#FAF7F2] to-[#F5EFE6] p-6 sm:p-8 md:p-10 shadow-xs">
      {/* Decorative backdrop wash */}
      <div className="pointer-events-none absolute -right-20 -bottom-20 size-80 rounded-full bg-[#E5D7BF]/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-[#F2EDE4]/60 blur-2xl" />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Content & Checkpoints */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.12em] font-bold text-[#7A4B13] bg-[#FDF3E3] px-3 py-1 rounded-full border border-[#F5DCB7]">
              <Sparkles className="size-3 text-[#B57324]" />
              FINAL MILESTONE · OFFERS &amp; COMPENSATION
            </span>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-white text-[#55515D] border border-[#ECEAE5]">
              Milestone 07
            </span>
          </div>

          <div>
            <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#111111] leading-tight">
              Evaluate Offers, RSUs &amp; Career Trajectory with Confidence
            </h3>
            <p className="text-xs sm:text-sm text-[#4A4752] mt-2 leading-relaxed">
              Clearing the final technical loop is a major milestone. Compare base pay, equity vesting schedules, performance bonuses, and long-term career growth before putting pen to paper.
            </p>
          </div>

          {/* 4 Checkpoint items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs text-[#2A2830]">
            <div className="p-3 rounded-2xl bg-white/90 border border-[#ECEAE5] space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[#111111]">
                <CheckCircle2 className="size-4 text-[#1B635C] shrink-0" />
                <span>Base vs Variable</span>
              </div>
              <p className="text-[11px] text-[#63606B] leading-snug">
                Separate guaranteed monthly in-hand compensation from performance bonus metrics.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/90 border border-[#ECEAE5] space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[#111111]">
                <CheckCircle2 className="size-4 text-[#1B635C] shrink-0" />
                <span>RSUs &amp; Vesting Cliffs</span>
              </div>
              <p className="text-[11px] text-[#63606B] leading-snug">
                Analyze 4-year equity vesting schedules, 1-year cliffs, and tax withholdings.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/90 border border-[#ECEAE5] space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[#111111]">
                <CheckCircle2 className="size-4 text-[#1B635C] shrink-0" />
                <span>Competing Offers</span>
              </div>
              <p className="text-[11px] text-[#63606B] leading-snug">
                Professional campus protocol for respectfully presenting competing company selections.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/90 border border-[#ECEAE5] space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[#111111]">
                <CheckCircle2 className="size-4 text-[#1B635C] shrink-0" />
                <span>Joining &amp; Relocation</span>
              </div>
              <p className="text-[11px] text-[#63606B] leading-snug">
                Clawback clauses, relocation allowances, learning stipends, and hardware options.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link href="/experiences?intent=offers">
              <Button className="bg-[#1B635C] hover:bg-[#154D48] text-white rounded-full px-5 py-2.5 text-xs font-semibold shadow-xs gap-2">
                <DollarSign className="size-3.5" />
                <span>Browse Verified Offer Debriefs</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
            <Link href="/alumni">
              <Button variant="outline" className="rounded-full px-4 py-2.5 text-xs font-semibold bg-white hover:bg-[#FAF7F2] border-[#ECEAE5] gap-2">
                <TrendingUp className="size-3.5 text-[#1B635C]" />
                <span>Talk to Placed Alumni</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Right: Illustration Framing (User Asset: offer-negotiation-guide.png) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative group max-w-[340px] w-full">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#E8DCC8] to-[#F5EFE6] blur-lg opacity-80 group-hover:opacity-100 transition duration-500" />
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#D8C9B0] bg-white p-3 shadow-sm">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#FAF6EE] flex items-center justify-center">
                <Image
                  src="/assets/offer-negotiation-guide.png"
                  alt="Candidate receiving verified placement offer, compensation package, and benefits"
                  fill
                  sizes="(max-width: 768px) 100vw, 340px"
                  className="object-contain p-3 group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>

              {/* Quote ribbon */}
              <div className="mt-2.5 p-3 rounded-xl bg-[#FAF9F5] border border-[#ECEAE5] flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#63606B] font-bold block">
                    Campus Success Story
                  </span>
                  <span className="font-editorial font-bold text-[#111111] text-xs">
                    &ldquo;Negotiated 15% higher base + signing bonus.&rdquo;
                  </span>
                </div>
                <div className="size-7 rounded-full bg-[#1B635C] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 ml-2">
                  $
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
