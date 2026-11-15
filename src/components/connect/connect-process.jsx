"use client";

import * as React from "react";
import { Reveal } from "@/components/marketing/reveal";
import { DoodleSparkle, DoodleStamp, DoodleTape, DoodleUnderline } from "@/components/marketing/doodles";
import { Stage01Vignette, Stage02Vignette, Stage03Vignette } from "@/components/marketing/illustrations";
const steps = [{
  n: "01",
  eyebrow: "DISCOVERY",
  stage: "Find",
  title: "Find your match.",
  body: "Filter by company, target role, graduation year, or college. Find alumni who sat for the exact interviews you are facing.",
  tag: "Targeted search",
  rotation: "rotate-[-1deg]",
  paperBg: "bg-[#FFFFFF] dark:bg-[var(--surface)]",
  Vignette: Stage01Vignette
}, {
  n: "02",
  eyebrow: "OUTREACH",
  stage: "Connect",
  title: "Start a conversation.",
  body: "Send a direct connection request with your specific questions. No networking fluff — just candidate-to-alumni clarity.",
  tag: "Direct message",
  rotation: "rotate-[1.5deg]",
  paperBg: "bg-[#FAFAFA] dark:bg-[var(--surface-elevated)]",
  Vignette: Stage02Vignette
}, {
  n: "03",
  eyebrow: "PREPARATION",
  stage: "Learn",
  title: "Prepare with certainty.",
  body: "Get the exact breakdown of coding rounds, system questions, and behavioral bar raisers so you walk into the interview ready.",
  tag: "Actionable intel",
  rotation: "rotate-[-1deg]",
  paperBg: "bg-[#FFFFFF] dark:bg-[var(--surface)]",
  Vignette: Stage03Vignette
}];
export function ConnectProcess() {
  const [activeStep, setActiveStep] = React.useState(0);
  const [sectionInView, setSectionInView] = React.useState(false);
  const sectionRef = React.useRef(null);
  const cardRefs = React.useRef([]);
  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSectionInView(true);
      }
    }, {
      threshold: 0.15
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <section ref={sectionRef} className="relative border-b border-[var(--hairline-soft)] bg-[var(--background)] py-20 md:py-28 overflow-hidden transition-colors duration-700">
      <div className="mx-auto max-w-[1360px] px-5 md:px-8">
        <Reveal>
          <div className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DoodleSparkle className="size-5 text-[var(--brand)]" />
                <p className="type-data text-[12px] uppercase tracking-[0.16em] text-[var(--brand)] font-semibold">
                  How Connection Works / 04 · The Three Steps
                </p>
              </div>
              <h2 className="type-display max-w-[15ch] text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.02] text-[var(--ink)]">
                From finding to{" "}
                <span className="relative inline-block text-[var(--brand)] italic">
                  learning.
                  <DoodleUnderline className="absolute -bottom-2.5 left-0 w-full text-[var(--brand)] pointer-events-none" />
                </span>
              </h2>
            </div>
            <div className="max-w-[36ch]">
              <p className="type-body text-[16px] leading-relaxed text-[var(--ink-muted)]">
                Three clear stages turn alumni experiences into your competitive advantage for placement season.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Hand-Drawn Pathway Line across 01 -> 02 -> 03 (Desktop) */}
        <div className="relative mb-6 hidden lg:block" aria-hidden="true">
          <svg className="w-full h-10 overflow-visible" viewBox="0 0 1100 40" fill="none">
            <path d="M 180 20 C 320 10, 400 30, 550 20 C 700 10, 800 30, 920 20" stroke="#DED7E8" strokeWidth="2" strokeDasharray="6 6" strokeLinecap="round" />
            <path d="M 180 20 C 320 10, 400 30, 550 20 C 700 10, 800 30, 920 20" stroke="#8D6BB3" strokeWidth="2.8" strokeDasharray="800" strokeDashoffset={sectionInView ? activeStep === 0 ? 540 : activeStep === 1 ? 270 : 0 : 800} strokeLinecap="round" style={{
            transition: "stroke-dashoffset 900ms cubic-bezier(0.2, 0.8, 0.2, 1)"
          }} />
            <path d="M 910 12 L 925 20 L 910 28" stroke="#8D6BB3" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{
            opacity: sectionInView && activeStep >= 2 ? 1 : 0.3,
            transition: "opacity 400ms ease"
          }} />
          </svg>
        </div>

        {/* Connected 3-Card Editorial Pathway */}
        <div className="relative grid gap-8 lg:grid-cols-3 items-stretch">
          {steps.map((step, index) => {
          const VignetteComp = step.Vignette;
          const isActive = activeStep === index;
          return <Reveal key={step.n} delay={index % 3} className="h-full">
                <div ref={el => {
              cardRefs.current[index] = el;
            }} onMouseEnter={() => setActiveStep(index)} className={`group relative h-full border ${step.paperBg} p-7 md:p-8 rounded-sm shadow-card flex flex-col justify-between transition-all duration-500 cursor-pointer ${step.rotation} ${isActive ? "border-[var(--brand)] -translate-y-2 shadow-xl ring-2 ring-[var(--brand)]/30 scale-[1.01]" : "border-[var(--hairline-strong)] hover:border-[var(--brand)]/60 hover:-translate-y-1 hover:shadow-lg"}`}>
                  <DoodleTape className="absolute -top-2.5 left-8" />

                  <div>
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-5">
                      <div className="flex items-center gap-2">
                        <span className={`type-data text-[18px] font-bold font-mono transition-colors duration-300 ${isActive ? "text-[var(--brand-bright)]" : "text-[var(--ink-muted)]"}`}>
                          {step.n}
                        </span>
                        <span className="type-data text-[10px] font-mono text-[var(--brand)] uppercase tracking-wider bg-[var(--brand-soft)]/50 px-2 py-0.5 rounded-xs">
                          {step.stage}
                        </span>
                      </div>
                      <span className="type-data text-[10.5px] uppercase tracking-wider text-[var(--muted)]">
                        {step.eyebrow}
                      </span>
                    </div>

                    <div className="mb-4 flex justify-center py-2">
                      <div className={`transition-transform duration-500 ${isActive ? "scale-110 drop-shadow-md rotate-1" : "scale-95 opacity-85 group-hover:scale-100 group-hover:opacity-100"}`}>
                        <VignetteComp className="size-20 drop-shadow-xs" />
                      </div>
                    </div>

                    <h3 className={`type-display text-[24px] sm:text-[26px] leading-snug transition-colors duration-300 ${isActive ? "text-[var(--brand)] font-medium" : "text-[var(--ink)]"}`}>
                      {step.title}
                    </h3>

                    <p className="type-body mt-3 text-[14.5px] leading-relaxed text-[var(--ink-muted)]">
                      {step.body}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-[var(--border)] flex items-center justify-between">
                    <span className="type-data text-[11px] font-mono text-[var(--brand)] bg-[var(--brand-soft)]/50 px-2.5 py-0.5 rounded-xs">
                      {step.tag}
                    </span>
                    {index === 1 && <div className={`transition-all duration-500 ${isActive ? "scale-100 opacity-100" : "scale-90 opacity-70"}`}>
                        <DoodleStamp text="DIRECT CHAT" className="scale-85 origin-right" />
                      </div>}
                  </div>
                </div>
              </Reveal>;
        })}
        </div>
      </div>
    </section>;
}