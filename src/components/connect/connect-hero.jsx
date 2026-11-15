"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DoodleUnderline } from "@/components/marketing/doodles";
import { Reveal } from "@/components/marketing/reveal";
import { ConnectHeroIllustration } from "./connect-hero-illustration";
export function ConnectHero() {
  return <section className="relative overflow-hidden hero-glow border-b border-[var(--border)] lg:min-h-[calc(100vh-70px)] flex items-center py-8 sm:py-10 lg:py-10 xl:py-12">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[44%_56%] xl:gap-12">
          <div className="relative z-10 max-w-[540px]">
            <Reveal>
              <div className="inline-flex items-center gap-2 mb-3.5 sm:mb-4">
                <span className="size-2 rounded-full bg-[var(--brand)] animate-ping" />
                <p className="type-data text-[11px] sm:text-[11.5px] uppercase tracking-[0.16em] text-[var(--brand)] font-semibold font-mono">
                  Alumni Network / 01 · 1-on-1 Placement Intel
                </p>
              </div>
            </Reveal>

            <Reveal delay={1}>
              <h1 className="type-display text-[36px] sm:text-[46px] md:text-[52px] lg:text-[54px] xl:text-[62px] leading-[0.98] tracking-tight text-[var(--ink)]">
                Connecting{" "}
                <span className="relative inline-block text-[var(--brand)] italic">
                  placed alumni
                  <DoodleUnderline className="absolute -bottom-1.5 left-0 w-full text-[var(--brand)] pointer-events-none" />
                </span>{" "}
                with{" "}
                <span className="relative inline-block text-[var(--brand-bright)] italic">
                  tomorrow&apos;s talent.
                  <DoodleUnderline className="absolute -bottom-2 left-0 w-full text-[var(--brand-bright)] pointer-events-none" />
                </span>
              </h1>
            </Reveal>

            <Reveal delay={2}>
              <p className="type-body mt-4 sm:mt-5 max-w-[42ch] text-[15px] sm:text-[15.5px] md:text-[16px] lg:text-[16.5px] leading-[1.55] text-[var(--ink-muted)]">
                Learn from people who have already walked the placement path. Ask what really happened, understand the process, and connect with the people who can help you prepare for what&apos;s next.
              </p>
            </Reveal>

            <Reveal delay={3}>
              <div className="mt-6 sm:mt-7 flex flex-wrap items-center gap-3 sm:gap-4">
                <Button size="default" className="rounded-full bg-[#111016] dark:bg-white text-white dark:text-[#111016] px-6 py-2.5 sm:py-3 h-auto text-[14px] font-semibold shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98] cursor-pointer" asChild>
                  <a href="#alumni-directory" className="inline-flex items-center gap-2">
                    <span>Connect with Alumni</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </Button>

                <Button variant="outline" size="default" className="rounded-full border-[#111016]/20 bg-[var(--surface-elevated)] hover:bg-[var(--paper-tint)] text-[var(--foreground)] px-5 py-2.5 sm:py-3 h-auto text-[13.5px] font-medium shadow-2xs transition-all hover:scale-[1.01]" asChild>
                  <Link href="/signup">
                    Join as Placed Mentor
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>

          <div className="relative w-full flex items-center justify-center lg:justify-end">
            <ConnectHeroIllustration />
          </div>
        </div>
      </div>
    </section>;
}