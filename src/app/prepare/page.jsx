import Link from "next/link";
import { getCurrentUser } from "@/server/auth-helpers";
import { getPreparationItems, getUserHasCompletedMock } from "@/server/queries/preparation";
import { getCompanies, getCompanyIntelligence } from "@/server/queries/companies";
import {
  getAllPlacementDrivesWithStats,
  getCompanyPlacementInformation,
} from "@/server/queries/placement";
import {
  calculateReadinessScore,
  extractDrivePreparationProfile,
} from "@/server/readiness/calculator";
import { PreparationChecklist } from "@/components/profile/preparation-checklist";
import { ReadinessScoreCard } from "@/components/companies/readiness-score-card";
import { GeneratePrepPlanButton } from "@/components/companies/generate-prep-plan-button";
import { Button } from "@/components/ui/button";
import { PreparationHero } from "@/components/prepare/preparation-hero";
import { PreparationPillars } from "@/components/prepare/preparation-pillars";
import { PreparationRoadmap } from "@/components/prepare/preparation-roadmap";
import { FeaturedPracticeChallenge } from "@/components/prepare/featured-practice-challenge";
import { MockInterviewStudio } from "@/components/prepare/mock-interview-studio";
import { OfferNegotiationGuide } from "@/components/prepare/offer-negotiation-guide";
import {
  Calendar,
  BookOpen,
  ExternalLink,
  HelpCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Student Preparation Hub — Beyond the Rumour Mill",
  description:
    "Personalized placement preparation checklist, company readiness index, and interview intelligence.",
};

export default async function PreparePage({ searchParams }) {
  const user = await getCurrentUser().catch(() => null);

  const resolvedSearchParams = await searchParams;
  const selectedCompanyId = resolvedSearchParams?.company || null;

  let allItems = [];
  let companiesList = [];
  let drives = [];
  let hasCompletedMock = false;

  try {
    if (user) {
      [allItems, companiesList, drives, hasCompletedMock] = await Promise.all([
        getPreparationItems(),
        getCompanies(),
        getAllPlacementDrivesWithStats(),
        getUserHasCompletedMock(user.id),
      ]);
    } else {
      [companiesList, drives] = await Promise.all([
        getCompanies(),
        getAllPlacementDrivesWithStats(),
      ]);
      allItems = [
        { id: "guest-1", title: "Review high-frequency LeetCode questions (Trees & Dynamic Programming)", category: "dsa", completedAt: null, source: "drive" },
        { id: "guest-2", title: "Practice distributed caching & microservice design on whiteboard", category: "design", completedAt: null, source: "drive" },
        { id: "guest-3", title: "Prepare 3-minute project defense using the STAR method", category: "resume", completedAt: null, source: "drive" },
        { id: "guest-4", title: "Rehearse Core CS Fundamentals (DBMS Normalization & OS Scheduling)", category: "cs_fundamentals", completedAt: null, source: "drive" },
        { id: "guest-5", title: "Book a 1-on-1 alumni technical mock interview", category: "mock", completedAt: null, source: "mock" },
      ];
    }
  } catch (err) {
    console.error("Failed to load prepare hub base data:", err);
  }

  const activeItems = selectedCompanyId
    ? allItems.filter((i) => i.companyId === selectedCompanyId)
    : allItems;

  const selectedCompany = selectedCompanyId
    ? companiesList.find((c) => c.id === selectedCompanyId)
    : null;

  let selectedCompanyDrives = [];
  let selectedCompanyIntel = null;

  if (selectedCompanyId) {
    try {
      [selectedCompanyDrives, selectedCompanyIntel] = await Promise.all([
        getCompanyPlacementInformation(selectedCompanyId),
        getCompanyIntelligence(selectedCompanyId),
      ]);
    } catch (err) {
      console.error("Failed to load target company intelligence:", err);
    }
  }

  const drivePrepProfile = extractDrivePreparationProfile(selectedCompanyDrives);
  const combinedTopics = selectedCompany
    ? Array.from(
        new Set([
          ...drivePrepProfile.suggestedTopics,
          ...(selectedCompany.topTopics?.map((t) => t.topic) || []),
        ])
      )
    : [];

  const readiness = calculateReadinessScore({
    items: activeItems,
    companyRequiredSkills:
      drivePrepProfile.requiredSkills.length > 0
        ? drivePrepProfile.requiredSkills
        : undefined,
    companyTopTopics: combinedTopics.length > 0 ? combinedTopics : undefined,
    hasCompletedMock,
  });

  const totalTasks = activeItems.length;
  const completedTasks = activeItems.filter((i) => i.completedAt !== null).length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const userTargetCompanyIds = Array.from(
    new Set(allItems.map((i) => i.companyId).filter(Boolean))
  );
  const targetCompanies = companiesList.filter((c) =>
    userTargetCompanyIds.includes(c.id)
  );
  if (
    selectedCompany &&
    !targetCompanies.some((c) => c.id === selectedCompany.id)
  ) {
    targetCompanies.unshift(selectedCompany);
  }

  const topQuestions = (selectedCompanyIntel?.questions || []).slice(0, 5);
  const upcomingDrives = drives.slice(0, 4);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Guest Mode Notification Banner */}
      {!user && (
        <div className="bg-[#FAF7F2] dark:bg-[var(--surface-elevated)] border-b border-[#ECEAE5] py-2.5 px-4 text-center text-xs font-mono text-[#55515D] flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <span>● Previewing Placement Preparation Command Center in guest mode.</span>
          <Link
            href="/signup?next=/prepare"
            className="font-bold text-[#1B635C] bg-[#1B635C]/10 hover:bg-[#1B635C]/20 px-3 py-1 rounded-full transition-colors inline-flex items-center gap-1"
          >
            <span>Sign Up to save tasks</span>
            <span>→</span>
          </Link>
          <span className="text-[#A09CA8]">or</span>
          <Link
            href="/login?next=/prepare"
            className="font-medium text-[#111111] underline underline-offset-2 hover:text-[#1B635C]"
          >
            Sign In
          </Link>
        </div>
      )}

      {/* Main Container */}
      <div className="mx-auto max-w-[1360px] py-8 sm:py-12 px-4 sm:px-6 md:px-8 space-y-12 sm:space-y-16">
        {/* 1. HERO SECTION: Two-Column Composition with prep-hero-engineer.jpg */}
        <PreparationHero />

        {/* 2. THE 4 CORE TECHNICAL INTERVIEW PILLARS */}
        <PreparationPillars activeCompanyId={selectedCompanyId} />

        {/* 3. PRACTICE OF THE DAY · FEATURED TECHNICAL CHALLENGE */}
        <FeaturedPracticeChallenge />

        {/* 4. TARGET COMPANIES QUICK FILTER CHIPS */}
        {targetCompanies.length > 0 && (
          <div className="space-y-3 p-6 sm:p-7 rounded-3xl bg-[#FAF7F3] border border-[#EBE4D8] shadow-2xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#63606B] font-bold block">
              Filter by Target Company Plan:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/prepare"
                className={`text-xs px-4 py-2 rounded-full font-medium transition-all ${
                  !selectedCompanyId
                    ? "bg-[#1B635C] text-white font-semibold shadow-xs"
                    : "bg-white text-[#4A4752] border border-[#ECEAE5] hover:border-[#1B635C]/40 hover:text-[#111111]"
                }`}
              >
                All Companies ({allItems.length})
              </Link>
              {targetCompanies.map((c) => (
                <Link
                  key={c.id}
                  href={`/prepare?company=${c.id}`}
                  className={`text-xs px-4 py-2 rounded-full font-medium transition-all ${
                    selectedCompanyId === c.id
                      ? "bg-[#1B635C] text-white font-semibold shadow-xs"
                      : "bg-white text-[#4A4752] border border-[#ECEAE5] hover:border-[#1B635C]/40 hover:text-[#111111]"
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 5. COMPANY-SPECIFIC DRIVE PLAN SYNC */}
        {selectedCompany && (
          <GeneratePrepPlanButton
            companyId={selectedCompany.id}
            companyName={selectedCompany.name}
            driveId={selectedCompanyDrives[0]?.id}
            hasTasks={activeItems.length > 0}
          />
        )}

        {/* 6. READINESS SCORE & VELOCITY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <ReadinessScoreCard
              readiness={readiness}
              companyName={selectedCompany?.name}
            />
          </div>

          <div className="lg:col-span-5 space-y-6">
            {/* Velocity Card */}
            <div className="p-6 sm:p-8 rounded-3xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] space-y-5 shadow-2xs">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#63606B] font-bold block">
                Preparation Velocity
              </span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-3xl sm:text-4xl font-bold font-editorial text-[#111111]">
                    {completedTasks} / {totalTasks}
                  </p>
                  <p className="text-xs text-[#63606B] mt-0.5">Tasks Completed</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-bold font-editorial text-[#1B635C]">{progressPct}%</p>
                  <p className="text-xs text-[#63606B] mt-0.5">Completion Rate</p>
                </div>
              </div>

              <div className="w-full h-2.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                <div
                  className="h-full bg-[#1B635C] rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {hasCompletedMock && (
                <p className="text-xs text-[#17563F] font-medium pt-1 flex items-center gap-1.5">
                  <span>✓</span>
                  <span>Verified: Mock interview rehearsal completed.</span>
                </p>
              )}
            </div>

            {/* Upcoming Drives Alert */}
            <div className="p-6 sm:p-8 rounded-3xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#63606B] font-bold flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-[#1B635C]" />
                  Active Drives ({upcomingDrives.length})
                </span>
                <Link href="/companies" className="text-xs text-[#1B635C] hover:underline font-bold">
                  View all →
                </Link>
              </div>

              {upcomingDrives.length === 0 ? (
                <p className="text-xs text-[#63606B]">
                  No drives scheduled yet. Browse company archives to start a study plan.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingDrives.map((d) => (
                    <div
                      key={d.id}
                      className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#ECEAE5] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-[#111111] block truncate">
                          {d.companyName}
                        </span>
                        <span className="text-[#63606B] block truncate text-[11px]">
                          {d.season} · {d.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link href={`/prepare?company=${d.companyId}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5 rounded-md hover:bg-white border border-[#ECEAE5]">
                            Focus
                          </Button>
                        </Link>
                        <Link href={`/companies/${d.companyId}`}>
                          <Button size="sm" className="h-7 text-xs text-[#1B635C] bg-[#1B635C]/10 hover:bg-[#1B635C]/20 px-2.5 rounded-md">
                            Dossier
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 7. PREPARATION ROADMAP: 7-STEP INTERVIEW JOURNEY */}
        <PreparationRoadmap activeCompanyId={selectedCompanyId} />

        {/* 8. ALUMNI MOCK INTERVIEW STUDIO */}
        <MockInterviewStudio />

        {/* 9. RECOMMENDED SKILLS & REPORTED QUESTIONS */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-[#ECEAE5] pt-8">
          <div className="p-6 sm:p-8 rounded-3xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h2 className="font-editorial text-xl font-bold flex items-center gap-2 text-[#111111]">
                <BookOpen className="size-4 text-[#1B635C]" />
                {selectedCompany
                  ? `${selectedCompany.name} Required Skills`
                  : "Target Drive Intelligence"}
              </h2>
              {selectedCompany && (
                <Link
                  href={`/companies/${selectedCompany.id}`}
                  className="text-xs text-[#1B635C] hover:underline font-bold"
                >
                  Full Dossier →
                </Link>
              )}
            </div>

            {selectedCompany ? (
              <div className="space-y-4">
                {drivePrepProfile.requiredSkills.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10.5px] font-mono uppercase tracking-wider text-[#63606B]">
                      Drive Required Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {drivePrepProfile.requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs px-2.5 py-0.5 rounded-lg bg-[#FAF7F3] border border-[#EBE4D8] text-[#1A191D] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {combinedTopics.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10.5px] font-mono uppercase tracking-wider text-[#63606B]">
                      High-Frequency Topics
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {combinedTopics.map((topic) => (
                        <span
                          key={topic}
                          className="text-xs px-2.5 py-0.5 rounded-lg border border-[#ECEAE5] bg-white text-[#111111]"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {drivePrepProfile.resources.length > 0 ? (
                  <div className="space-y-2 pt-2 border-t border-[#ECEAE5]">
                    <p className="text-[10.5px] font-mono uppercase tracking-wider text-[#63606B]">
                      Curated Prep Resources
                    </p>
                    <ul className="space-y-1.5">
                      {drivePrepProfile.resources.map((res, idx) => (
                        <li key={idx} className="text-xs flex items-center gap-1.5">
                          {res.url && /^https?:\/\//i.test(res.url) ? (
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#1B635C] hover:underline font-medium"
                            >
                              {res.title}
                              <ExternalLink className="size-3" />
                            </a>
                          ) : (
                            <span className="text-[#111111]">{res.title}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-[#63606B] pt-1">
                    Use the checklist below to cover each listed skill and book an alumni mock interview for live feedback.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-xs text-[#63606B] leading-relaxed">
                <p>
                  Select a target company from the chips above (or browse upcoming placement drives) to unlock drive-specific skills, prep links, and historical questions.
                </p>
                <Link href="/companies">
                  <Button variant="outline" size="sm" className="text-xs rounded-full">
                    Browse Company Intelligence
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8 rounded-3xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h2 className="font-editorial text-xl font-bold flex items-center gap-2 text-[#111111]">
                <HelpCircle className="size-4 text-[#1B635C]" />
                {selectedCompany
                  ? `Recent Questions Asked at ${selectedCompany.name}`
                  : "Practice Priority Playbook"}
              </h2>
              {selectedCompany && (
                <Link
                  href={`/questions?company=${selectedCompany.id}`}
                  className="text-xs text-[#1B635C] hover:underline font-bold"
                >
                  Q&amp;A Board →
                </Link>
              )}
            </div>

            {selectedCompany ? (
              topQuestions.length > 0 ? (
                <ul className="space-y-2.5">
                  {topQuestions.map((q, idx) => (
                    <li
                      key={q.id || idx}
                      className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#ECEAE5] text-xs space-y-1"
                    >
                      <p className="font-medium text-[#111111] leading-snug">{q.text}</p>
                      {q.topic && q.topic !== "Unknown" && (
                        <span className="inline-block font-mono text-[10px] px-2 py-0.5 rounded bg-[#FAF7F3] border border-[#EBE4D8] text-[#1A191D]">
                          {q.topic}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#63606B]">
                  No round problem statements recorded for {selectedCompany.name} yet. Check open alumni Q&amp;A threads or explore experiences.
                </p>
              )
            ) : (
              <ul className="space-y-2.5 text-xs text-[#4A4752] list-disc pl-4 leading-relaxed">
                <li>Pick an upcoming campus drive and generate a synchronized prep plan from its criteria.</li>
                <li>Close skill gaps under Core Technical Requirements (35% weight in Readiness Index).</li>
                <li>Complete at least one Alumni Mock Interview (20% weight in Readiness Index).</li>
              </ul>
            )}
          </div>
        </section>

        {/* 10. POST-OFFER SPRINT & COMPENSATION GUIDE */}
        <OfferNegotiationGuide />

        {/* 11. MAIN CHECKLIST SECTION */}
        <div className="border-t border-[#ECEAE5] pt-8 space-y-6">
          <div>
            <h2 className="font-editorial text-2xl font-bold text-[#111111] dark:text-foreground">
              {selectedCompany ? `${selectedCompany.name} Preparation Checklist` : "Complete Preparation Checklist"}
            </h2>
            <p className="text-xs text-[#63606B] mt-0.5">
              Check off tasks as you prepare. Progress is tracked against your campus readiness score.
            </p>
          </div>

          <PreparationChecklist
            key={selectedCompanyId || "all"}
            initialItems={activeItems}
            companyId={selectedCompanyId || undefined}
            companyName={selectedCompany?.name}
          />
        </div>
      </div>
    </div>
  );
}
