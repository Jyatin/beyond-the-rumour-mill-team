"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DoodleSparkle, DoodleStar, DoodleUnderline } from "@/components/marketing/doodles";
import { Reveal } from "@/components/marketing/reveal";
import { PassingTheTorchScene } from "@/components/marketing/illustrations";
export function ConnectFinalCta() {
  return <section className="relative overflow-hidden bg-[#68163E] text-white selection:bg-[#E5C85C] selection:text-[#111016] transition-colors duration-700">
      {/* Background hand-drawn accents */}
      <DoodleStar className="absolute top-12 right-[10%] size-8 text-[#E5C85C] opacity-75 hidden md:block" />
      <DoodleSparkle className="absolute bottom-16 left-[6%] size-7 text-[#E5C85C] opacity-80 hidden md:block" />

      <div className="mx-auto max-w-[1360px] px-5 py-20 md:px-8 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="relative z-10 max-w-[680px]">
            <Reveal>
              <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#E5C85C] mb-4">
                <span className="size-2 rounded-full bg-[#E5C85C] animate-ping" />
                <span>PASSING IT FORWARD / 05 · ALUMNI NETWORK</span>
              </div>
            </Reveal>

            <Reveal delay={1}>
              <h2 className="type-display text-[40px] sm:text-[54px] lg:text-[64px] leading-[1.0] text-white">
                Someone has already walked the path you&apos;re{" "}
                <span className="relative inline-block text-[#E9B9B7] italic pb-2">
                  about to take.
                  <DoodleUnderline className="absolute -bottom-1 left-0 w-full text-[#E5C85C] pointer-events-none" />
                </span>
              </h2>
            </Reveal>

            <Reveal delay={2}>
              <p className="type-body-lg mt-8 max-w-[44ch] text-[17px] md:text-[18px] leading-relaxed text-white/80">
                Connect with placed alumni. Learn from their experience. Help make the next person&apos;s journey clearer.
              </p>
            </Reveal>

            <Reveal delay={3}>
              <div className="mt-10 flex flex-wrap items-center gap-5">
                <Button size="lg" className="rounded-full bg-white text-[#68163E] hover:bg-[#FAFAFA] px-7 py-3.5 h-auto font-medium shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]" asChild>
                  <a href="#alumni-directory" className="inline-flex items-center gap-2">
                    Find an alumni <ArrowRight className="size-4" />
                  </a>
                </Button>
                <Link href="/experiences/new" className="type-body text-[14.5px] font-medium text-white/90 hover:text-[#E9B9B7] transition-colors border-b border-white/40 pb-0.5 hover:border-[#E9B9B7]">
                  Share your experience
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Third Original Hand-Drawn Illustration: Passing The Torch Scene */}
          <Reveal delay={2} className="relative flex justify-center">
            <div className="w-full max-w-[480px] p-4 bg-white/5 border border-white/20 rounded-sm backdrop-blur-xs rotate-[1deg] hover:rotate-0 transition-transform duration-500 animate-paper-float shadow-xl">
              <PassingTheTorchScene className="w-full h-auto drop-shadow-lg" />
              <p className="type-caption mt-2 text-center text-[11.5px] text-white/70 font-mono">
                FIG 05. EXPERIENCE PASSED FORWARD TO TOMORROW&apos;S CANDIDATES
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>;
}