import Link from "next/link";
import { db } from "@/server/db";
import { questions, companies, roleTitles } from "@/server/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { QuestionSlotDialog } from "@/components/questions/question-slot-dialog";
import { getCompanies } from "@/server/queries/companies";
import {
  TexturedWashBanner,
  FloatingTopicStrip,
  EditorialCenterpieceEmblem,
} from "@/components/ui/editorial-visuals";
import { EmptyStateEditorial } from "@/components/ui/editorial-illustrations";
import { CompanyLogo } from "@/components/ui/company-logo";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Student Questions & Placement Inquiries | Beyond the Rumour Mill",
  description: "Unified public question slots answered by verified alumni across top engineering employers.",
};

export const dynamic = "force-dynamic";

export default async function QuestionsIndexPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const selectedIntent = resolvedParams?.intent || "All";

  const [allQuestions, companyList] = await Promise.all([
    db
      .select({
        id: questions.id,
        title: questions.title,
        intent: questions.intent,
        status: questions.status,
        askCount: questions.askCount,
        answerCount: questions.answerCount,
        eligibleAnswerCount: questions.eligibleAnswerCount,
        createdAt: questions.createdAt,
        companyId: questions.companyId,
        companyName: companies.name,
        roleTitle: roleTitles.title,
      })
      .from(questions)
      .innerJoin(companies, eq(questions.companyId, companies.id))
      .leftJoin(roleTitles, eq(questions.roleFamilyId, roleTitles.id))
      .where(
        and(
          isNull(questions.deletedAt),
          eq(questions.moderationState, "visible")
        )
      )
      .orderBy(desc(questions.askCount), desc(questions.answerCount))
      .limit(40)
      .catch((err) => {
        console.error("Failed to query questions:", err);
        return [];
      }),
    getCompanies().catch(() => []),
  ]);

  const defaultCompany = companyList[0] || { id: "general", name: "General" };

  // Intent filter
  const filteredQuestions =
    selectedIntent === "All"
      ? allQuestions
      : allQuestions.filter((q) => q.intent === selectedIntent);

  const questionCategories = [
    { id: "oa_questions", title: "Online Assessments", icon: "laptop", badge: "OA Rounds", description: "Coding platform questions, test patterns" },
    { id: "tech_round", title: "Technical Rounds", icon: "code", badge: "System & DSA", description: "Live whiteboard, architecture, code reviews" },
    { id: "dsa", title: "DSA & Problem Solving", icon: "network", badge: "Trees & Graphs", description: "Algorithmic questions and time complexity" },
    { id: "culture_hr", title: "Behavioral & HR", icon: "users", badge: "Values", description: "Company fit, leadership principles" },
    { id: "resume_projects", title: "Resume & Projects", icon: "file", badge: "Shortlisting", description: "Project deep dives and tech stack defense" },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* 1. HERO SECTION: Full-Width Textured Wash (inspired by Reference 2) */}
      <TexturedWashBanner variant="mint">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4 mb-10">
          <EditorialCenterpieceEmblem
            icon="help"
            variant="mint"
            alt="Candidate inquiry archive"
          />

          <div className="inline-flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] font-bold text-[#17563F] bg-white/80 px-3 py-1 rounded-full border border-[#D4E8DC] shadow-2xs">
              ● PLACEMENT INQUIRY ARCHIVE
            </span>
          </div>

          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#111111] leading-[1.08]">
            What Students Are Asking
          </h1>

          <p className="text-sm sm:text-base text-[#4A4752] max-w-xl leading-relaxed">
            Unified question slots aggregated across candidates and answered with structured first-hand evidence by verified alumni.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <QuestionSlotDialog
              companyId={defaultCompany.id}
              companyName={defaultCompany.name}
              roles={defaultCompany.roles?.map((r) => ({ id: r, name: r })) || []}
            />
          </div>
        </div>

        {/* Floating Category Strip */}
        <FloatingTopicStrip
          title="Browse by Inquiry Category"
          items={questionCategories}
          activeId={selectedIntent}
        />
      </TexturedWashBanner>

      {/* 2. MAIN CONTENT AREA */}
      <div className="mx-auto max-w-[1360px] py-12 px-4 sm:px-6 md:px-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Sidebar Filters */}
          <aside className="lg:col-span-4 space-y-6 p-6 rounded-3xl bg-[#FAF7F3] border border-[#EBE4D8] shadow-2xs">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#63606B] font-bold block mb-2">
                Inquiry Topic Categories
              </span>
              <nav className="space-y-1">
                <Link
                  href="/questions"
                  className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    selectedIntent === "All"
                      ? "bg-[#1B635C] text-white font-semibold shadow-xs"
                      : "text-[#4A4752] hover:bg-white hover:text-[#111111]"
                  }`}
                >
                  <span>All Inquiries</span>
                  <span className="font-mono text-[10.5px] opacity-75">{allQuestions.length}</span>
                </Link>
                {questionCategories.map((cat) => {
                  const isActive = selectedIntent === cat.id;
                  const count = allQuestions.filter((q) => q.intent === cat.id).length;
                  return (
                    <Link
                      key={cat.id}
                      href={`/questions?intent=${encodeURIComponent(cat.id)}`}
                      className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "bg-[#1B635C] text-white font-semibold shadow-xs"
                          : "text-[#4A4752] hover:bg-white hover:text-[#111111]"
                      }`}
                    >
                      <span>{cat.title}</span>
                      <span className="font-mono text-[10.5px] opacity-75">{count}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-[#EBE4D8] space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#63606B] font-bold block">
                Top Hiring Companies
              </span>
              <div className="flex flex-wrap gap-1.5">
                {companyList.slice(0, 8).map((c) => (
                  <Link
                    key={c.id}
                    href={`/companies/${c.id}`}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[#ECEAE5] text-[#111111] hover:border-[#1B635C] hover:text-[#1B635C] transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Main Stream: Question Cards */}
          <main className="lg:col-span-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECEAE5] pb-4">
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#111111]">
                  Active Discussion Threads
                </h2>
                <p className="text-xs text-[#63606B] mt-0.5">
                  Showing {filteredQuestions.length} questions answered by verified alumni.
                </p>
              </div>

              {selectedIntent !== "All" && (
                <Link
                  href="/questions"
                  className="text-xs font-semibold text-[#1B635C] hover:underline"
                >
                  Clear filter (Show All)
                </Link>
              )}
            </div>

            {filteredQuestions.length === 0 ? (
              <EmptyStateEditorial
                title="No inquiries in this category yet"
                description="Click 'Ask a Question Slot' above to create the first shared inquiry for verified alumni."
                actionLabel="Show All Inquiries"
                actionHref="/questions"
              />
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q) => (
                  <Link
                    key={q.id}
                    href={`/questions/${q.id}`}
                    className="group block border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] p-6 rounded-3xl shadow-2xs hover:shadow-md hover:border-[#1B635C]/50 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECEAE5] pb-3.5 mb-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <CompanyLogo name={q.companyName} size="xs" />
                        <span className="font-editorial text-lg font-bold text-[#111111] dark:text-foreground">
                          {q.companyName}
                        </span>
                        {q.roleTitle && (
                          <>
                            <span className="text-[#63606B]">·</span>
                            <span className="text-xs font-mono font-medium text-[#1B635C]">
                              {q.roleTitle}
                            </span>
                          </>
                        )}
                        <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-[#FAF7F3] border border-[#EBE4D8] text-[#1A191D] font-semibold">
                          {q.intent.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono text-[#63606B]">
                        <span>{q.askCount} ask{q.askCount !== 1 && "s"}</span>
                        <span>·</span>
                        <span className="text-[#111111] font-semibold">{q.answerCount} answer{q.answerCount !== 1 && "s"}</span>
                        {q.status === "well_covered" && (
                          <span className="text-[#17563F] font-bold flex items-center gap-1 bg-[#D4E8DC] px-2 py-0.5 rounded-md text-[10.5px]">
                            <CheckCircle2 className="size-3" /> Well Covered
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-editorial text-xl sm:text-2xl font-semibold text-[#111111] dark:text-foreground group-hover:text-[#1B635C] transition-colors leading-snug">
                        {q.title}
                      </h3>
                      <ArrowRight className="size-4 shrink-0 text-[#63606B] group-hover:translate-x-1 group-hover:text-[#1B635C] transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
