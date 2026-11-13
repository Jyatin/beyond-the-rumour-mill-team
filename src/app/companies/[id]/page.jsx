import { notFound } from "next/navigation";
import Link from "next/link";
import { getCompanyIntelligence } from "@/server/queries/companies";
import { getCompanyPlacementInformation, getStudentApplicationForDrive } from "@/server/queries/placement";
import { getCurrentUser } from "@/server/auth-helpers";
import { getPreparationItems, getUserHasCompletedMock } from "@/server/queries/preparation";
import { PreparationChecklist } from "@/components/profile/preparation-checklist";
import { getLatestConsensusForCompany } from "@/server/consensus/queries";
import { InterviewIntelligence } from "@/components/companies/interview-intelligence";
import { listQuestionsForCompany } from "@/server/queries/questions";
import { QuestionSlotDialog } from "@/components/questions/question-slot-dialog";
import { GeneratePrepPlanButton } from "@/components/companies/generate-prep-plan-button";
import { DriveApplyButton } from "@/components/companies/drive-apply-button";
import { calculateReadinessScore, extractDrivePreparationProfile } from "@/server/readiness/calculator";
import { ReadinessScoreCard } from "@/components/companies/readiness-score-card";
import { CompanyDossierHero } from "@/components/companies/company-dossier-hero";
import { EmptyStateEditorial } from "@/components/ui/editorial-illustrations";
import Image from "next/image";
import { MapPin, Sparkles, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CompanyPage({ params }) {
  const resolvedParams = await params;
  const companyId = resolvedParams.id;

  const [data, placementDrives, user, consensusData, companyQuestionSlots] = await Promise.all([
    getCompanyIntelligence(companyId),
    getCompanyPlacementInformation(companyId),
    getCurrentUser().catch(() => null),
    getLatestConsensusForCompany(companyId),
    listQuestionsForCompany(companyId),
  ]);

  if (!data) return notFound();

  let companyPrepItems = [];
  let hasCompletedMock = false;
  const userApplicationsMap = {};
  if (user) {
    try {
      const [prepItemsRes, mockDone] = await Promise.all([
        getPreparationItems(companyId),
        getUserHasCompletedMock(user.id),
      ]);
      companyPrepItems = prepItemsRes;
      hasCompletedMock = mockDone;
      await Promise.all(
        placementDrives.map(async (d) => {
          const app = await getStudentApplicationForDrive(d.id, user.id);
          if (app) userApplicationsMap[d.id] = app;
        })
      );
    } catch {
      // Ignored
    }
  }

  const drivePrepProfile = extractDrivePreparationProfile(placementDrives);
  const combinedTopics = Array.from(
    new Set([
      ...drivePrepProfile.suggestedTopics,
      ...(data.company.topTopics?.map((t) => t.topic) || []),
    ])
  );

  const readiness = calculateReadinessScore({
    items: companyPrepItems,
    companyRequiredSkills:
      drivePrepProfile.requiredSkills.length > 0
        ? drivePrepProfile.requiredSkills
        : undefined,
    companyTopTopics: combinedTopics.length > 0 ? combinedTopics : undefined,
    hasCompletedMock,
  });

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-[1360px] py-8 sm:py-12 px-4 sm:px-6 md:px-8 space-y-10">
        {/* Master Two-Column Company Dossier Hero */}
        <CompanyDossierHero
          companyName={data.company.name}
          industry={data.company.industry || "Campus Hiring"}
          experienceCount={data.company.experienceCount || 0}
          drivesCount={placementDrives.length}
          alumniCount={data.alumni.length}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main 2-Column Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Phase 3.3: Interview Intelligence ("Signal, not truth") */}
            <InterviewIntelligence
              consensusData={consensusData}
              companyName={data.company.name}
            />

            {/* Preparation Section */}
            {user && (
              <section className="space-y-6 p-6 rounded-2xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#ECEAE5] pb-4">
                  <div>
                    <h2 className="font-editorial text-2xl font-bold text-[#111111] dark:text-foreground">
                      Preparation Command Center
                    </h2>
                    <p className="text-xs text-[#63606B] mt-0.5">
                      Tailored checklist and readiness index for {data.company.name}.
                    </p>
                  </div>
                  <Sparkles className="size-5 text-[#1B635C]" />
                </div>

                <ReadinessScoreCard
                  readiness={readiness}
                  companyName={data.company.name}
                />

                <GeneratePrepPlanButton
                  companyId={companyId}
                  companyName={data.company.name}
                  driveId={placementDrives[0]?.id}
                  hasTasks={companyPrepItems.length > 0}
                />

                <PreparationChecklist
                  key={companyId}
                  initialItems={companyPrepItems}
                  companyId={companyId}
                  companyName={data.company.name}
                />
              </section>
            )}

            {/* Placement Drives Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-editorial text-2xl font-bold text-[#111111] dark:text-foreground">
                    Placement Drives &amp; Eligibility
                  </h2>
                  <p className="text-xs text-[#63606B] mt-0.5">
                    Official on-campus and virtual hiring windows.
                  </p>
                </div>
              </div>

              {placementDrives.length > 0 ? (
                <div className="space-y-6">
                  {placementDrives.map((drive) => (
                    <div
                      key={drive.id}
                      className="p-6 border border-[#ECEAE5] rounded-2xl bg-[#FFFFFF] dark:bg-[var(--surface)] space-y-5 shadow-2xs hover:border-[#1B635C]/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 border-b border-[#ECEAE5] pb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-mono font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#FAF7F3] border border-[#EBE4D8] text-[#1A191D]">
                              {drive.season || "Placement Drive"}
                            </span>
                            {drive.status && (
                              <span
                                className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
                                  drive.status === "Open"
                                    ? "bg-[#D4E8DC] text-[#17563F] border-[#17563F]/20"
                                    : "bg-[#D8E2F2] text-[#1B2540] border-[#1B2540]/20"
                                }`}
                              >
                                ● {drive.status}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#63606B]">
                            {drive.date || "Date TBA"}
                            {drive.location ? ` · ${drive.location}` : ""}
                            {drive.deadline ? ` · Deadline: ${drive.deadline}` : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <DriveApplyButton
                            driveId={drive.id}
                            driveStatus={drive.status}
                            companyName={data.company.name}
                            existingApplication={userApplicationsMap[drive.id]}
                            user={user}
                          />
                        </div>
                      </div>

                      {drive.eligibleStudentInformation && (
                        <div className="p-3.5 rounded-xl bg-[#FAF7F3] border border-[#EBE4D8] text-xs space-y-1">
                          <h4 className="font-mono text-[10.5px] uppercase tracking-wider text-[#63606B] font-semibold">
                            Eligible Students &amp; Criteria
                          </h4>
                          <p className="text-[#111111] leading-relaxed">
                            {drive.eligibleStudentInformation}
                          </p>
                        </div>
                      )}

                      {drive.roles && drive.roles.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-mono text-[10.5px] uppercase tracking-wider text-[#63606B] font-semibold">
                            Roles in this Drive ({drive.roles.length})
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {drive.roles.map((dr) => (
                              <div
                                key={dr.id}
                                className="p-4 rounded-xl bg-[#FAF9F6] border border-[#ECEAE5] space-y-3"
                              >
                                <div className="flex flex-wrap justify-between items-start gap-2">
                                  <div>
                                    <h5 className="font-semibold text-sm text-[#111111]">
                                      {dr.title}
                                    </h5>
                                    {dr.location && (
                                      <p className="text-xs text-[#63606B] flex items-center gap-1 mt-0.5">
                                        <MapPin className="size-3" />
                                        <span>{dr.location}</span>
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    {dr.employmentType && (
                                      <span className="text-[11px] font-mono bg-white border border-[#ECEAE5] px-2 py-0.5 rounded-md text-[#111111]">
                                        {dr.employmentType}
                                      </span>
                                    )}
                                    {dr.ctc && (
                                      <span className="text-[11px] font-mono font-bold bg-[#D4E8DC] text-[#17563F] border border-[#17563F]/20 px-2.5 py-0.5 rounded-md">
                                        {dr.ctc}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#ECEAE5] text-xs">
                                  <div>
                                    <h6 className="font-mono text-[10px] uppercase tracking-wider text-[#63606B] font-semibold mb-1.5">
                                      ELIGIBILITY
                                    </h6>
                                    {dr.eligibility ? (
                                      <ul className="space-y-1 text-[#4A4752]">
                                        {dr.eligibility.cgpa && (
                                          <li>• CGPA Cutoff: <strong className="text-[#111111]">{dr.eligibility.cgpa}</strong></li>
                                        )}
                                        {dr.eligibility.branches && dr.eligibility.branches.length > 0 && (
                                          <li>• Branches: {dr.eligibility.branches.join(", ")}</li>
                                        )}
                                        {dr.eligibility.backlog && (
                                          <li>• Active Backlogs: {dr.eligibility.backlog}</li>
                                        )}
                                        {dr.eligibility.otherCriteria && (
                                          <li>• {dr.eligibility.otherCriteria}</li>
                                        )}
                                      </ul>
                                    ) : (
                                      <p className="text-[#63606B] italic">No specific eligibility listed.</p>
                                    )}
                                  </div>

                                  <div>
                                    <h6 className="font-mono text-[10px] uppercase tracking-wider text-[#63606B] font-semibold mb-1.5">
                                      PREPARATION SKILLS
                                    </h6>
                                    {dr.preparation?.requiredSkills && dr.preparation.requiredSkills.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {dr.preparation.requiredSkills.map((s) => (
                                          <span
                                            key={s}
                                            className="px-2 py-0.5 bg-white border border-[#ECEAE5] rounded text-[11px] text-[#111111]"
                                          >
                                            {s}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-[#63606B] italic">Review interview experiences below.</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStateEditorial
                  title="No active placement drives"
                  description="No upcoming placement drives currently registered for this employer. Training &amp; Placement officers can configure drives from the portal."
                />
              )}
            </section>

            {/* Questions Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#ECEAE5] pb-4">
                <div>
                  <h2 className="font-editorial text-2xl font-bold text-[#111111] dark:text-foreground">
                    Placement Question Slots
                  </h2>
                  <p className="text-xs text-[#63606B] mt-0.5">
                    Shared inquiries answered by verified {data.company.name} alumni.
                  </p>
                </div>
                <QuestionSlotDialog
                  companyId={companyId}
                  companyName={data.company.name}
                  roles={data.roles || []}
                />
              </div>

              {companyQuestionSlots.length > 0 ? (
                <div className="space-y-3">
                  {companyQuestionSlots.map((q) => (
                    <Link
                      key={q.id}
                      href={`/questions/${q.id}`}
                      className="group block p-4 border border-[#ECEAE5] rounded-xl bg-[#FFFFFF] dark:bg-[var(--surface)] hover:border-[#1B635C]/50 hover:shadow-2xs transition-all"
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[10.5px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-[#FAF7F3] border border-[#EBE4D8] text-[#1A191D] font-semibold">
                          {q.intent.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-[#63606B] font-mono">
                          {q.askCount} ask{q.askCount !== 1 && "s"} · {q.answerCount} answer{q.answerCount !== 1 && "s"}
                        </span>
                      </div>
                      <p className="font-semibold text-base text-[#111111] group-hover:text-[#1B635C] transition-colors">
                        {q.title}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#63606B] italic">No question slots opened yet for this company.</p>
              )}
            </section>

            {/* Recent Experiences */}
            <section className="space-y-6">
              <h2 className="font-editorial text-2xl font-bold text-[#111111] dark:text-foreground">
                Recent Verified Experiences
              </h2>
              {data.experiences.length > 0 ? (
                <div className="space-y-4">
                  {data.experiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-5 border border-[#ECEAE5] rounded-2xl bg-[#FFFFFF] dark:bg-[var(--surface)] space-y-3 shadow-2xs hover:border-[#1B635C]/30 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-base text-[#111111]">
                            {exp.role}
                          </h3>
                          <p className="text-xs text-[#63606B]">
                            {exp.type} • {exp.year}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold border ${
                            exp.verificationStatus === "verified"
                              ? "bg-[#D4E8DC] text-[#17563F] border-[#17563F]/20"
                              : "bg-[#FAF7F3] text-[#1A191D] border-[#EBE4D8]"
                          }`}
                        >
                          {exp.verificationStatus === "verified" ? "✓ Verified" : "Community"}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-[#4A4752]">
                        {exp.summary}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[#63606B] pt-2 border-t border-[#ECEAE5]">
                        <span>{exp.rounds} rounds</span>
                        <span>Difficulty: <strong className="text-[#111111]">{exp.difficulty}</strong></span>
                        <span>{exp.helpfulCount || 0} found helpful</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#63606B] italic">No experiences submitted yet for this company.</p>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Roles Card */}
            <div className="p-6 rounded-2xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] space-y-4 shadow-2xs">
              <h3 className="font-editorial text-xl font-bold text-[#111111]">
                Target Hiring Roles
              </h3>
              {data.roles && data.roles.length > 0 ? (
                <ul className="space-y-2">
                  {data.roles.map((r) => (
                    <li
                      key={r.id}
                      className="text-xs font-medium py-2 border-b border-[#ECEAE5] last:border-0 text-[#4A4752] flex items-center justify-between"
                    >
                      <span>{r.title}</span>
                      <span className="text-[10px] font-mono text-[#1B635C]">Active</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#63606B] italic">General Engineering &amp; Product roles.</p>
              )}
            </div>

            {/* Alumni Network Card */}
            <div className="p-6 rounded-2xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="font-editorial text-xl font-bold text-[#111111]">
                  Placed Alumni ({data.alumni.length})
                </h3>
                <Link href="/alumni" className="text-xs text-[#1B635C] hover:underline font-medium">
                  View All →
                </Link>
              </div>

              {data.alumni.length > 0 ? (
                <div className="space-y-3">
                  {data.alumni.map((alumnus) => (
                    <div
                      key={alumnus.id}
                      className="flex gap-3 items-center p-2.5 rounded-xl bg-[#FAF9F6] border border-[#ECEAE5]"
                    >
                      <div className="size-9 rounded-full bg-[#1B635C] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {alumnus.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#111111] truncate">
                          {alumnus.name}
                        </p>
                        <p className="text-[11px] text-[#63606B] truncate">
                          {alumnus.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#63606B] italic">No verified alumni profiles yet.</p>
              )}
            </div>

            {/* Rehearse with Company Mentors Card with Editorial Illustration */}
            <div className="p-6 rounded-2xl border border-[#D4E8DC] bg-gradient-to-br from-[#FAFDFB] to-[#E9F5EF] space-y-4 shadow-2xs">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-[#D4E8DC] bg-white">
                <Image
                  src="/assets/alumni-student-dialogue-editorial.png"
                  alt={`Mock interview session with verified ${data.company.name} alumni`}
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#17563F] font-bold block">
                  1-on-1 Rehearsal
                </span>
                <h4 className="font-editorial text-lg font-bold text-[#111111]">
                  Rehearse {data.company.name} Rounds
                </h4>
                <p className="text-xs text-[#4A4752] leading-relaxed">
                  Book a simulated technical interview with verified alumni who cleared this exact company loop.
                </p>
              </div>
              <Link href="/alumni" className="block">
                <button className="w-full bg-[#1B635C] hover:bg-[#154D48] text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5">
                  <UserCheck className="size-3.5" />
                  <span>Book Alumni Mock</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
