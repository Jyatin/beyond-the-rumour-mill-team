import { notFound } from "next/navigation";
import { getExperienceById } from "@/server/queries/experiences";
import { getCurrentUser } from "@/server/auth-helpers";
import Link from "next/link";
import { getExperienceWithRounds } from "@/server/queries/rounds";
import { ReportExperienceDialog } from "@/components/experiences/report-experience-dialog";
import { CompanyLogo } from "@/components/ui/company-logo";
import { ArrowLeft, CheckCircle2, FileText, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExperienceDetailPage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  if (!id) return notFound();

  const [experience, user, rounds] = await Promise.all([
    getExperienceById(id),
    getCurrentUser().catch(() => null),
    getExperienceWithRounds(id).catch(() => []),
  ]);

  if (!experience) return notFound();

  // Protect non-published experiences from unauthorized viewers
  if (experience.status !== "published" && experience.authorId !== user?.id && user?.role !== "admin") {
    return notFound();
  }

  const isOwner = user?.id === experience.authorId;

  // Check verification & CV for non-anonymous experiences only
  let isAuthorVerified = false;
  let authorCvShared = false;
  if (!experience.isAnonymous && experience.authorId) {
    const { isAuthorVerifiedAtCompany } = await import('@/server/queries/verification');
    isAuthorVerified = await isAuthorVerifiedAtCompany(experience.authorId, experience.companyId);

    if (user) {
      const { getAlumniCvAccess } = await import('@/server/queries/cv');
      const cvAccess = await getAlumniCvAccess(experience.authorId);
      authorCvShared = cvAccess.allowed;
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-10 md:py-16">
      <div className="mx-auto max-w-[1000px] px-4 sm:px-6 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/experiences"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B635C] hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Experience Repository</span>
          </Link>

          <div className="flex items-center gap-3">
            {isOwner ? (
              <Link
                href={`/experiences/${experience.id}/edit`}
                className="text-xs font-semibold text-[#1B635C] border border-[#1B635C]/30 px-3 py-1 rounded-full hover:bg-[#1B635C]/10 transition-colors"
              >
                Edit Experience
              </Link>
            ) : user ? (
              <ReportExperienceDialog experienceId={experience.id} />
            ) : null}
          </div>
        </div>

        {/* Master Experience Card */}
        <div className="rounded-2xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] overflow-hidden shadow-2xs">
          {/* Header Banner */}
          <div className="p-6 sm:p-10 border-b border-[#ECEAE5] bg-[#FAF7F3] space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-white border border-[#1A191D]/20 text-[#111111]">
                {experience.type || "Interview Report"}
              </span>
              {experience.outcome && (
                <span
                  className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
                    experience.outcome === "Offer"
                      ? "bg-[#D4E8DC] text-[#17563F] border-[#17563F]/20"
                      : experience.outcome === "Rejected"
                        ? "bg-[#FAECE8] text-[#9E372E] border-[#9E372E]/20"
                        : "bg-white text-[#1A191D] border-[#EBE4D8]"
                  }`}
                >
                  {experience.outcome === "Offer" ? "🎉 Verified Offer" : experience.outcome}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <CompanyLogo name={experience.companyName} size="lg" className="shadow-xs" />
              <div className="space-y-1">
                <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111111] dark:text-foreground tracking-tight">
                  {experience.companyName}
                </h1>
                <p className="text-base sm:text-lg font-medium text-[#4A4752]">
                  {experience.role} {experience.year ? `• Batch ${experience.year}` : ""}
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#63606B] pt-2">
              {experience.rounds && (
                <span className="px-3 py-1 rounded-lg bg-white border border-[#ECEAE5] text-[#111111]">
                  <strong>{experience.rounds}</strong> Rounds
                </span>
              )}
              {experience.difficulty && (
                <span className="px-3 py-1 rounded-lg bg-white border border-[#ECEAE5] text-[#111111]">
                  Difficulty: <strong>{experience.difficulty}</strong>
                </span>
              )}
              {experience.timeline && (
                <span className="px-3 py-1 rounded-lg bg-white border border-[#ECEAE5] text-[#111111] flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-[#1B635C]" />
                  <span>{experience.timeline}</span>
                </span>
              )}
            </div>
          </div>

          {/* Candidate Attribution Bar */}
          <div className="p-6 sm:p-8 border-b border-[#ECEAE5] bg-white flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-[#1B635C] text-white flex items-center justify-center font-bold text-xs">
                {experience.isAnonymous ? "?" : (experience.studentName?.charAt(0) || "C")}
              </div>
              <div>
                <span className="font-semibold text-sm text-[#111111] block">
                  {experience.isAnonymous ? "Shared anonymously" : (experience.studentName || "Candidate")}
                </span>
                <span className="text-[#63606B]">
                  {experience.isAnonymous ? "Identity protected by moderation shield" : "Verified placement record"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthorVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-[#D4E8DC] text-[#17563F]">
                  <CheckCircle2 className="size-3" />
                  <span>Verified Employment</span>
                </span>
              )}
              {!experience.isAnonymous && authorCvShared && experience.authorId && (
                <a
                  href={`/api/cv/${experience.authorId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1B635C]/10 text-[#1B635C] px-3 py-1 text-xs font-semibold hover:bg-[#1B635C]/20 transition-colors"
                >
                  <FileText className="size-3.5" />
                  <span>View Verified CV</span>
                </a>
              )}
            </div>
          </div>

          {/* Detailed Content & Rounds */}
          <div className="p-6 sm:p-10 space-y-10">
            {/* Executive Summary */}
            {experience.summary && (
              <section className="space-y-3">
                <h3 className="font-editorial text-2xl font-bold text-[#111111]">
                  Executive Summary
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-[#4A4752] whitespace-pre-wrap">
                  {experience.summary}
                </p>
              </section>
            )}

            {/* Structured Rounds */}
            {rounds.length > 0 ? (
              <section className="space-y-6">
                <h3 className="font-editorial text-2xl font-bold text-[#111111]">
                  Round-by-Round Breakdown ({rounds.length} Rounds)
                </h3>
                <div className="space-y-6">
                  {rounds.map((round, idx) => (
                    <div
                      key={round.id || idx}
                      className="border border-[#ECEAE5] rounded-xl p-6 space-y-4 bg-[#FAF7F3]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EBE4D8] pb-3">
                        <div className="flex items-center gap-2">
                          <span className="size-6 rounded-full bg-[#1B635C] text-white flex items-center justify-center font-mono font-bold text-xs">
                            {idx + 1}
                          </span>
                          <h4 className="font-editorial text-xl font-bold text-[#111111]">
                            {round.roundTypeName || `Round ${idx + 1}`}
                          </h4>
                        </div>
                        {round.difficulty && (
                          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-white border border-[#EBE4D8] text-[#111111]">
                            {round.difficulty}
                          </span>
                        )}
                      </div>

                      {round.title && (
                        <p className="font-semibold text-sm text-[#111111]">
                          {round.title}
                        </p>
                      )}

                      {round.summary && (
                        <p className="text-xs sm:text-sm text-[#4A4752] leading-relaxed">
                          {round.summary}
                        </p>
                      )}

                      {round.topics && round.topics.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#63606B] font-semibold block">
                            Key Round Topics
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {round.topics.map((t) => (
                              <span
                                key={t}
                                className="text-[11px] px-2.5 py-0.5 rounded-md bg-white border border-[#ECEAE5] text-[#111111] font-medium"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {round.questions && round.questions.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-[#EBE4D8]">
                          <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#63606B] font-semibold block">
                            Specific Questions Asked
                          </span>
                          <ul className="space-y-2 text-xs text-[#111111]">
                            {round.questions.map((q) => (
                              <li
                                key={q.id}
                                className="p-2.5 rounded-lg bg-white border border-[#ECEAE5] flex items-start gap-2"
                              >
                                <span className="text-[#1B635C] font-bold">•</span>
                                <div className="space-y-0.5 flex-1">
                                  <p className="font-medium">{q.text}</p>
                                  {(q.difficulty || q.topic) && (
                                    <span className="text-[10px] font-mono text-[#63606B]">
                                      {[q.topic, q.difficulty].filter(Boolean).join(" · ")}
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ) : experience.content ? (
              <section className="space-y-3">
                <h3 className="font-editorial text-2xl font-bold text-[#111111]">
                  Interview Details
                </h3>
                <div className="p-6 rounded-xl bg-[#FAF9F6] border border-[#ECEAE5] text-sm text-[#4A4752] leading-relaxed whitespace-pre-wrap">
                  {experience.content}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
