import { getPublishedExperiences } from "@/server/queries/experiences";
import { ExperiencesBrowser } from "@/components/experiences/experiences-browser";
import {
  TexturedWashBanner,
  EditorialCharacterVignette,
  FeaturedSpotlightCard,
} from "@/components/ui/editorial-visuals";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Experience Repository — Beyond the Rumour Mill",
  description:
    "Verified interview experiences from candidates and alumni, organized to help students prepare.",
};

export default async function ExperiencesPage() {
  const experiences = await getPublishedExperiences();

  // Find premier offer for featured case study
  const premierExperience =
    experiences.find((e) => e.outcome === "Offer" && e.rounds && e.rounds >= 3) ||
    experiences[0];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* 1. HERO SECTION: Full-Width Textured Wash with Character Vignette (inspired by References 1 & 2) */}
      <TexturedWashBanner variant="purple">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] font-bold text-[#3D2C59] bg-white/90 px-3 py-1 rounded-full border border-[#D6C7EE] shadow-2xs">
                ● CANDIDATE CASE STUDIES &amp; TRANSCRIPTS
              </span>
            </div>

            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#111111] leading-[1.08]">
              Verified Interview Experiences
            </h1>

            <p className="text-sm sm:text-base text-[#4A4752] max-w-xl leading-relaxed mx-auto lg:mx-0">
              Real candidates break down their actual interview rounds, exact problem statements asked, online assessments, and offer decisions.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <Link
                href="/experiences/new"
                className="inline-flex items-center justify-center rounded-full bg-[#1B635C] hover:bg-[#154D48] text-white px-6 py-2.5 text-xs font-semibold shadow-xs transition-all hover:scale-102 gap-2"
              >
                <Plus className="size-3.5" />
                <span>Share Your Experience</span>
              </Link>
              <Link
                href="/prepare"
                className="inline-flex items-center justify-center rounded-full bg-white hover:bg-[#FAF7F2] text-[#111111] border border-[#ECEAE5] px-5 py-2.5 text-xs font-semibold shadow-2xs"
              >
                <span>Preparation Checklist</span>
              </Link>
            </div>
          </div>

          {/* Right Character Vignette Column (User Reference 1) */}
          <div className="lg:col-span-5 flex justify-center">
            <EditorialCharacterVignette
              imageSrc="/assets/editorial-character-quote.png"
              alt="Candidate sharing verified interview experience"
              quote="Round 2 focused on distributed cache invalidation and binary search variations."
              author="Placed Graduate"
              role="Google SDE"
              accentColor="purple"
            />
          </div>
        </div>
      </TexturedWashBanner>

      {/* 2. MAIN MAGAZINE CONTENT AREA */}
      <div className="mx-auto max-w-[1360px] py-12 px-4 sm:px-6 md:px-8 space-y-12">
        {/* Featured Case Study (inspired by Reference 3 "Featured Post") */}
        {premierExperience && (
          <FeaturedSpotlightCard
            eyebrow="FEATURED INTERVIEW CASE STUDY"
            bannerTitle={premierExperience.companyName}
            bannerSubtitle={`${premierExperience.role} • ${premierExperience.outcome === "Offer" ? "Verified Offer" : "Candidate Dossier"}`}
            bannerColor="purple"
            title={`${premierExperience.companyName} Full Interview Breakdown (${premierExperience.rounds || 4} Rounds)`}
            excerpt={premierExperience.summary || "Complete walk-through of the online assessment, coding rounds, and technical discussion."}
            href={`/experiences/${premierExperience.id}`}
            metaAuthor={premierExperience.isAnonymous ? "Anonymous Candidate" : premierExperience.studentName}
            metaRole={`Difficulty: ${premierExperience.difficulty || "Medium"} • Batch ${premierExperience.year || 2026}`}
            badges={[
              premierExperience.outcome === "Offer" ? "Offer Accepted" : premierExperience.outcome || "Completed",
              `${premierExperience.rounds || 4} Rounds`,
              "Verified Submission",
            ]}
          />
        )}

        {/* 3. EXPERIENCES BROWSER WITH MAGAZINE STREAM */}
        <ExperiencesBrowser experiences={experiences} />
      </div>
    </div>
  );
}
