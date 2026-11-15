"use client";

import { Reveal } from "@/components/marketing/reveal";
import { DoodleSparkle, DoodleStar, DoodleUnderline } from "@/components/marketing/doodles";
import { AlumniConversationGroupScene } from "@/components/marketing/illustrations";
export function ConversationShowcase() {
  return <section className="relative border-b border-[var(--hairline-soft)] bg-[var(--paper-blue)] py-20 md:py-28 overflow-hidden transition-colors duration-700">
      <DoodleStar className="absolute top-10 right-14 size-6 text-[var(--brand)] opacity-60 hidden md:block" />
      <div className="mx-auto max-w-[1360px] px-5 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 items-center">
          <Reveal>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <DoodleSparkle className="size-5 text-[var(--brand)]" />
                <p className="type-data text-[12px] uppercase tracking-[0.16em] text-[var(--brand)] font-semibold">
                  Conversation & Intel / 03 · Q&A Exchange
                </p>
              </div>
              <h2 className="type-display text-[38px] sm:text-[48px] lg:text-[56px] leading-[1.02] text-[var(--ink)]">
                The questions you wish you could ask{" "}
                <span className="relative inline-block text-[var(--brand)] italic">
                  before the room.
                  <DoodleUnderline className="absolute -bottom-2.5 left-0 w-full text-[var(--brand)] pointer-events-none" />
                </span>
              </h2>
              <p className="type-body-lg text-[16px] md:text-[17px] leading-relaxed text-[var(--ink-muted)] max-w-[42ch]">
                General placement tips online don&apos;t tell you which interviewer pressed on concurrency locks or how the OA test cases were weighted. Placed alumni give you the exact nuance.
              </p>

              {/* Sticky handwritten note */}
              <div className="mt-6 inline-block border border-[var(--hairline-strong)] bg-[#FFFFFF] dark:bg-[var(--surface-elevated)] p-4.5 rounded-xs shadow-card rotate-[-2deg] animate-paper-float">
                <p className="type-display text-[14.5px] italic text-[var(--ink)]">
                  “Ask about the specific follow-up questions they received in technical round 2.”
                </p>
                <span className="type-data text-[10px] uppercase text-[var(--brand)] font-mono block mt-2">
                  PRO-TIP FROM AMAZON ALUMNI
                </span>
              </div>
            </div>
          </Reveal>

          {/* Second Original Hand-Drawn Illustration: Discussion Group Scene */}
          <Reveal delay={2} className="relative flex justify-center">
            <div className="w-full max-w-[660px] border border-[var(--hairline-strong)] bg-[#FFFFFF] dark:bg-[var(--surface)] p-6 rounded-sm shadow-card rotate-[0.5deg] hover:rotate-0 transition-transform duration-500 animate-paper-float">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
                <span className="type-data text-[11px] font-mono uppercase text-[var(--brand-bright)] font-semibold">
                  FIG 03. AUTHENTIC ALUMNI ↔ STUDENT DIALOGUE
                </span>
                <span className="type-data text-[10.5px] font-mono text-[#557D70]">
                  ● LIVE KNOWLEDGE EXCHANGE
                </span>
              </div>
              <AlumniConversationGroupScene className="w-full h-auto" />
              <p className="type-caption mt-3 text-center text-[12px] text-[var(--ink-muted)] font-mono">
                REAL QUESTIONS • VERIFIED ANSWERS • DIRECT KNOWLEDGE PASSING
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>;
}