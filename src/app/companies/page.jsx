import Link from "next/link";
import { getCompanies } from "@/server/queries/companies";
import { getAllPlacementDrivesWithStats } from "@/server/queries/placement";
import { CompaniesHero } from "@/components/companies/companies-hero";
import { ActiveDrivesRadar } from "@/components/companies/active-drives-radar";
import { CompanyConsensusBanner } from "@/components/companies/company-consensus-banner";
import { EmptyStateEditorial } from "@/components/ui/editorial-illustrations";
import { CompanyLogo } from "@/components/ui/company-logo";
import ErrorState from "@/components/ui/error-state";
import { Briefcase, Calendar, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Companies & Placement Intelligence — Beyond the Rumour Mill",
  description: "Explore hiring companies, active campus drives, eligibility criteria, and verified interview experiences.",
};

export const dynamic = "force-dynamic";

export default async function CompaniesPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const selectedIndustry = resolvedParams?.industry || "All";

  let companies = [];
  let drives = [];
  try {
    [companies, drives] = await Promise.all([
      getCompanies(),
      getAllPlacementDrivesWithStats(),
    ]);
  } catch (error) {
    console.error(error);
    return <ErrorState message="Failed to load companies data." retry={() => location.reload()} />;
  }

  // Map drives to companies
  const drivesByCompany = {};
  for (const d of drives) {
    if (!drivesByCompany[d.companyId]) {
      drivesByCompany[d.companyId] = [];
    }
    drivesByCompany[d.companyId].push(d);
  }

  // Industries list
  const industries = ["All", ...Array.from(new Set(companies.map((c) => c.industry).filter(Boolean)))];
  const filteredCompanies = selectedIndustry === "All"
    ? companies
    : companies.filter((c) => c.industry === selectedIndustry);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-[1360px] py-8 sm:py-12 px-4 sm:px-6 md:px-8 space-y-12 sm:space-y-16">
        {/* 1. MASTER TWO-COLUMN EDITORIAL HERO */}
        <CompaniesHero companyCount={companies.length} driveCount={drives.length} />

        {/* 2. ACTIVE CAMPUS PLACEMENT DRIVES RADAR */}
        <ActiveDrivesRadar drives={drives} />

        {/* 3. TWO-COLUMN DIRECTORY SECTION */}
        <div id="employers-directory" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pt-2">
          {/* Left Sidebar Filter Column */}
          <aside className="lg:col-span-3 space-y-6 p-6 rounded-3xl bg-[#FAF7F3] border border-[#EBE4D8] shadow-2xs">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#63606B] font-bold block mb-2">
                Filter by Industry
              </span>
              <nav className="space-y-1">
                {industries.map((ind) => {
                  const isActive = selectedIndustry === ind;
                  return (
                    <Link
                      key={ind}
                      href={ind === "All" ? "/companies#employers-directory" : `/companies?industry=${encodeURIComponent(ind)}#employers-directory`}
                      className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "bg-[#1B635C] text-white font-semibold shadow-xs"
                          : "text-[#4A4752] hover:bg-white hover:text-[#111111]"
                      }`}
                    >
                      <span>{ind}</span>
                      {ind === "All" ? (
                        <span className="font-mono text-[10.5px] opacity-75">{companies.length}</span>
                      ) : (
                        <span className="font-mono text-[10.5px] opacity-75">
                          {companies.filter((c) => c.industry === ind).length}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-[#EBE4D8] space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#63606B] font-bold block">
                Quick Placement Stats
              </span>
              <div className="space-y-2 text-xs text-[#55515D]">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#ECEAE5]">
                  <span>Active Drives:</span>
                  <strong className="text-[#1B635C] font-mono">
                    {drives.filter((d) => d.status === "Open" || d.status === "Upcoming").length}
                  </strong>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#ECEAE5]">
                  <span>Indexed Companies:</span>
                  <strong className="text-[#111111] font-mono">{companies.length}</strong>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EBE4D8]">
              <Link href="/prepare" className="block text-center p-3 rounded-xl bg-[#E6F3F0] border border-[#8AC4BE]/40 text-[#1B635C] text-xs font-semibold hover:bg-[#DCEEEF] transition-colors">
                Generate Study Checklist →
              </Link>
            </div>
          </aside>

          {/* Right Main Stream: Employer Cards */}
          <main className="lg:col-span-9 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECEAE5] pb-4">
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#111111]">
                  {selectedIndustry === "All" ? "All Employers" : `${selectedIndustry} Employers`}
                </h2>
                <p className="text-xs text-[#63606B] mt-0.5">
                  Showing {filteredCompanies.length} indexed companies with verified student reports.
                </p>
              </div>

              {selectedIndustry !== "All" && (
                <Link
                  href="/companies#employers-directory"
                  className="text-xs font-semibold text-[#1B635C] hover:underline"
                >
                  Clear filter (Show All)
                </Link>
              )}
            </div>

            {filteredCompanies.length === 0 ? (
              <EmptyStateEditorial
                title="No employers match this category"
                description="Try selecting a different industry from the left filter panel or explore the complete directory."
                actionLabel="Show All Employers"
                actionHref="/companies"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCompanies.map((c) => {
                  const companyDrives = drivesByCompany[c.id] || [];
                  const activeDrive = companyDrives.find((d) => d.status === "Open" || d.status === "Upcoming") || companyDrives[0];

                  return (
                    <div
                      key={c.id}
                      className="group relative p-6 rounded-3xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] hover:border-[#1B635C]/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-5"
                    >
                      <div className="space-y-4">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            <CompanyLogo name={c.name} size="md" className="group-hover:scale-105 transition-transform" />
                            <div>
                              <h3 className="font-editorial text-2xl font-bold text-[#111111] dark:text-foreground group-hover:text-[#1B635C] transition-colors leading-tight">
                                {c.name}
                              </h3>
                              <span className="text-xs font-mono uppercase tracking-wider text-[#63606B]">
                                {c.industry || "Technology"}
                              </span>
                            </div>
                          </div>

                          {activeDrive && (
                            <span
                              className={`shrink-0 text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                                activeDrive.status === "Open"
                                  ? "bg-[#D4E8DC] text-[#17563F] border-[#17563F]/20"
                                  : "bg-[#D8E2F2] text-[#1B2540] border-[#1B2540]/20"
                              }`}
                            >
                              ● {activeDrive.status}
                            </span>
                          )}
                        </div>

                        {/* Active Drive Details Pill if any */}
                        {activeDrive && (
                          <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#EBE4D8] text-xs space-y-1.5">
                            <div className="font-semibold text-[#111111] flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-[#1B635C]" />
                                {activeDrive.season || "Placement Drive"}
                              </span>
                              {activeDrive.rolesCount > 0 && (
                                <span className="font-mono text-[10.5px] text-[#1B635C] font-medium">
                                  {activeDrive.rolesCount} Role(s)
                                </span>
                              )}
                            </div>
                            <div className="text-[#63606B] flex items-center justify-between text-[11px]">
                              <span>Date: {activeDrive.date || "Announced soon"}</span>
                              {activeDrive.applicantCount !== undefined && (
                                <span>{activeDrive.applicantCount} applied</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Frequent Interview Topics */}
                        {c.topTopics && Array.isArray(c.topTopics) && c.topTopics.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#63606B] font-semibold block">
                              Frequent Interview Topics
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {c.topTopics.slice(0, 3).map((t, idx) => (
                                <span
                                  key={idx}
                                  className="text-[11px] px-2.5 py-0.5 rounded-lg bg-[#FAF9F6] border border-[#ECEAE5] text-[#111111] font-medium"
                                >
                                  {t.topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="pt-4 border-t border-[#ECEAE5] flex items-center justify-between">
                        <span className="text-xs text-[#63606B] flex items-center gap-1.5 font-medium">
                          <Briefcase className="size-3.5 text-[#1B635C]" />
                          {c.experienceCount || 0} Experiences
                        </span>

                        <Link
                          href={`/companies/${c.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B635C] hover:text-[#154D48] transition-colors group-hover:translate-x-0.5"
                        >
                          <span>Explore Dossier</span>
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* 4. CAMPUS HIRING CONSENSUS BANNER */}
        <CompanyConsensusBanner />
      </div>
    </div>
  );
}
