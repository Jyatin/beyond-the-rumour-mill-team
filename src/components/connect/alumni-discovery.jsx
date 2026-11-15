"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Send,
  X,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  SlidersHorizontal,
  GraduationCap,
  Coffee,
  Laptop,
  FileText,
  Target,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DoodleTape, DoodleUnderline } from "@/components/marketing/doodles";
import {
  TexturedWashBanner,
  EditorialCharacterVignette,
  FloatingTopicStrip,
} from "@/components/ui/editorial-visuals";
import { createMentorshipRequestAction } from "@/server/actions/mentorship";
import { QuestionSlotDialog } from "@/components/questions/question-slot-dialog";
import { CompanyLogo } from "@/components/ui/company-logo";

const MENTORSHIP_PILLARS = [
  {
    id: "strategy",
    icon: "coffee",
    title: "1-on-1 Strategy",
    badge: "Direct Advice",
    description: "30-min debrief on preparation roadmap and interview timeline.",
    tag: "Strategy",
  },
  {
    id: "technical",
    icon: "laptop",
    title: "Technical Mock",
    badge: "Live Coding",
    description: "DSA problem solving and live system design walkthrough.",
    tag: "DSA",
  },
  {
    id: "resume",
    icon: "file",
    title: "Resume & Portfolio",
    badge: "ATS & Bar",
    description: "Targeted feedback aligned to company hiring standards.",
    tag: "Resume",
  },
  {
    id: "negotiation",
    icon: "target",
    title: "Offer & Joining",
    badge: "Guidance",
    description: "Compensation structure, joining clauses, and transition tips.",
    tag: "System Design",
  },
  {
    id: "drives",
    icon: "building",
    title: "On-Campus Drives",
    badge: "TPO Rounds",
    description: "Online assessment patterns, cutoff criteria, and round weights.",
    tag: "Graphs",
  },
];

export function AlumniDiscovery({ alumniProfiles = [] }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCompany, setSelectedCompany] = React.useState("All");
  const [selectedRole, setSelectedRole] = React.useState("All");
  const [selectedCollege, setSelectedCollege] = React.useState("All");
  const [selectedYear, setSelectedYear] = React.useState("All");

  // Interactive connection state map: id -> 'none' | 'pending'
  const [connectionStates, setConnectionStates] = React.useState({});

  const [activeModalAlumni, setActiveModalAlumni] = React.useState(null);
  const [selectedProfileAlumni, setSelectedProfileAlumni] = React.useState(null);
  const [questionModalCompany, setQuestionModalCompany] = React.useState(null);

  const [messageText, setMessageText] = React.useState("");
  const [modalLoading, setModalLoading] = React.useState(false);
  const [modalError, setModalError] = React.useState("");
  const [modalSuccess, setModalSuccess] = React.useState("");

  const companiesList = React.useMemo(
    () => ["All", ...Array.from(new Set(alumniProfiles.map((a) => a.company).filter(Boolean)))],
    [alumniProfiles]
  );
  const rolesList = React.useMemo(
    () => ["All", ...Array.from(new Set(alumniProfiles.map((a) => a.role).filter(Boolean)))],
    [alumniProfiles]
  );
  const collegesList = React.useMemo(
    () => ["All", ...Array.from(new Set(alumniProfiles.map((a) => a.college).filter(Boolean)))],
    [alumniProfiles]
  );
  const yearsList = React.useMemo(
    () => [
      "All",
      ...Array.from(new Set(alumniProfiles.map((a) => String(a.year)).filter(Boolean))).sort((a, b) =>
        b.localeCompare(a)
      ),
    ],
    [alumniProfiles]
  );

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCompany !== "All" ||
    selectedRole !== "All" ||
    selectedCollege !== "All" ||
    selectedYear !== "All";

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCompany("All");
    setSelectedRole("All");
    setSelectedCollege("All");
    setSelectedYear("All");
  };

  const filteredAlumni = alumniProfiles.filter((alumni) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      alumni.name?.toLowerCase().includes(q) ||
      alumni.company?.toLowerCase().includes(q) ||
      alumni.role?.toLowerCase().includes(q) ||
      alumni.college?.toLowerCase().includes(q) ||
      (alumni.tags && alumni.tags.some((t) => t.toLowerCase().includes(q)));
    const matchesCompany = selectedCompany === "All" || alumni.company === selectedCompany;
    const matchesRole = selectedRole === "All" || alumni.role === selectedRole;
    const matchesCollege = selectedCollege === "All" || alumni.college === selectedCollege;
    const matchesYear = selectedYear === "All" || String(alumni.year) === selectedYear;
    return matchesSearch && matchesCompany && matchesRole && matchesCollege && matchesYear;
  });

  const handleConnectClick = (alumni, e) => {
    if (e) e.stopPropagation();
    if (!alumni.userId) return;
    const currentState = connectionStates[alumni.id] || "none";
    if (currentState !== "none") return;

    setModalError("");
    setModalSuccess("");
    setActiveModalAlumni(alumni);
    setMessageText(
      `Hi ${alumni.name.split(" ")[0]}, I'm preparing for the ${alumni.company} ${alumni.role} interview and saw your experience dossier. Would love your quick guidance on technical round preparation!`
    );
  };

  const handleSendMessage = async () => {
    if (!activeModalAlumni?.userId || modalLoading) return;
    try {
      setModalLoading(true);
      setModalError("");
      await createMentorshipRequestAction({
        mentorId: activeModalAlumni.userId,
        message: messageText,
      });
      setModalSuccess("Mentorship request sent! Track replies in your Profile.");
      setConnectionStates((prev) => ({
        ...prev,
        [activeModalAlumni.id]: "pending",
      }));
      setTimeout(() => {
        setActiveModalAlumni(null);
      }, 1200);
    } catch (err) {
      setModalError(err?.message || "Failed to send request. Make sure you are signed in with a student account.");
    } finally {
      setModalLoading(false);
    }
  };

  const getCompanyHref = (alumni) =>
    `/companies/${alumni.companyId || alumni.company.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

  return (
    <div className="alumni-discovery-module relative min-h-screen bg-[var(--background)]">
      {/* 1. Master Editorial Textured Wash Banner with Hero & Character Vignette */}
      <TexturedWashBanner variant="purple" className="border-b border-[#ECEAE5]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
          <div className="flex-1 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 border border-[#D6C7EE] shadow-2xs mb-4">
              <Sparkles className="size-3.5 text-[#6B46C1]" />
              <span className="text-[11.5px] font-mono uppercase tracking-[0.12em] font-semibold text-[#6B46C1]">
                PLACED ALUMNI NETWORK · 1-ON-1 GUIDANCE
              </span>
            </div>

            <h1 className="type-display text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.08] text-[var(--ink)] tracking-tight">
              FIND SENIORS WHO&apos;VE{" "}
              <span className="relative inline-block text-[var(--brand)] italic">
                BEEN THERE.
                <DoodleUnderline className="absolute -bottom-2 left-0 w-full text-[var(--brand)] pointer-events-none" />
              </span>
            </h1>

            <p className="type-body text-[15.5px] sm:text-[17px] leading-relaxed text-[var(--ink-muted)] mt-4 max-w-xl">
              Search verified interview dossiers, technical round breakdowns, and connect directly with placed graduates who recently conquered the hiring bar.
            </p>

            {/* Integrated Search Bar (Reference 2 style) */}
            <div className="mt-7 max-w-xl">
              <div className="relative flex items-center bg-white dark:bg-[var(--surface)] border-2 border-[#111111]/15 focus-within:border-[var(--brand)] rounded-full p-1.5 shadow-md transition-all">
                <Search className="size-5 text-[var(--ink-muted)] ml-3.5 shrink-0" />
                <input
                  type="text"
                  placeholder="Search company, role, campus, or technical topic (e.g. Google, SDE, DSA)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 px-3 bg-transparent type-body text-[14.5px] text-[var(--ink)] placeholder:text-[var(--ink-muted)]/60 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery("")}
                    className="p-2 text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {}}
                  className="rounded-full bg-[#111016] text-white px-5 h-9 text-xs font-semibold shrink-0 cursor-pointer"
                >
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Editorial Character Vignette (User Reference 1) */}
          <div className="shrink-0 w-full lg:w-auto flex justify-center">
            <EditorialCharacterVignette
              imageSrc="/assets/editorial-character-quote.png"
              alt="Placed alumni mentor"
              quote="On-campus hiring bars shifted toward live problem solving. Connect with seniors who cracked the exact round."
              author="Senior Alumni Cohort"
              role="Verified SDE & Product Mentors"
              accentColor="purple"
              className="scale-95 sm:scale-100"
            />
          </div>
        </div>

        {/* Floating Mentorship Pillars Strip (Reference 2) */}
        <div className="mt-12 pt-8 border-t border-[#E0D7F0]/80">
          <FloatingTopicStrip
            title="Browse mentorship & preparation pillars"
            items={MENTORSHIP_PILLARS}
            activeId={
              MENTORSHIP_PILLARS.find((p) => p.tag.toLowerCase() === searchQuery.toLowerCase())?.id
            }
            onSelect={(pillarId) => {
              const selectedPillar = MENTORSHIP_PILLARS.find((p) => p.id === pillarId);
              if (selectedPillar) {
                if (searchQuery.toLowerCase() === selectedPillar.tag.toLowerCase()) {
                  setSearchQuery("");
                } else {
                  setSearchQuery(selectedPillar.tag);
                }
              }
            }}
          />
        </div>
      </TexturedWashBanner>

      {/* 2. Main Content: Magazine Layout with Left Filter Sidebar & Right Stream */}
      <section id="alumni-directory" className="py-12 md:py-16">
        <div className="mx-auto max-w-[1360px] px-5 md:px-8">
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-10">
            {/* Left Sticky Filter Sidebar */}
            <aside className="w-full lg:w-[280px] shrink-0 space-y-6 lg:sticky lg:top-24">
              <div className="bg-[#FFFFFF] dark:bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="size-4 text-[var(--brand)]" />
                    <span className="type-data text-[12px] uppercase font-mono tracking-wider font-bold text-[var(--ink)]">
                      Filters
                    </span>
                  </div>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="type-mono text-[11px] font-semibold text-[var(--brand)] hover:underline cursor-pointer"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                {/* Company Filter */}
                <div className="space-y-2">
                  <span className="type-data text-[11px] uppercase tracking-wider text-[var(--ink-muted)] font-mono block">
                    Company:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {companiesList.map((comp) => (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => setSelectedCompany(comp)}
                        className={`type-data text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          selectedCompany === comp
                            ? "bg-[#111016] text-white dark:bg-white dark:text-[#111016] border-[#111016] dark:border-white font-semibold"
                            : "bg-[#FAFAFA] dark:bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--brand)]"
                        }`}
                      >
                        {comp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role Filter */}
                <div className="space-y-2">
                  <span className="type-data text-[11px] uppercase tracking-wider text-[var(--ink-muted)] font-mono block">
                    Role / Domain:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {rolesList.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRole(r)}
                        className={`type-data text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          selectedRole === r
                            ? "bg-[#557D70] text-white border-[#557D70] font-semibold"
                            : "bg-[#FAFAFA] dark:bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--brand)]"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* College / Campus Filter */}
                <div className="space-y-2">
                  <span className="type-data text-[11px] uppercase tracking-wider text-[var(--ink-muted)] font-mono block">
                    Campus / College:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {collegesList.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setSelectedCollege(col)}
                        className={`type-data text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          selectedCollege === col
                            ? "bg-[var(--brand-bright)] text-white border-[var(--brand-bright)] font-semibold"
                            : "bg-[#FAFAFA] dark:bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--brand)]"
                        }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Batch / Year Filter */}
                <div className="space-y-2">
                  <span className="type-data text-[11px] uppercase tracking-wider text-[var(--ink-muted)] font-mono block">
                    Batch Year:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {yearsList.map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setSelectedYear(y)}
                        className={`type-data text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          selectedYear === y
                            ? "bg-[#8D6BB3] text-white border-[#8D6BB3] font-semibold"
                            : "bg-[#FAFAFA] dark:bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--brand)]"
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Community Guidelines Card (Reference 2 Sidebar) */}
              <div className="bg-[#FAF7F2] dark:bg-[var(--surface-elevated)] border border-[#ECEAE5] rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-[#7B4D1B]">
                  <GraduationCap className="size-4" />
                  <span className="type-data text-[11px] uppercase font-mono tracking-wider font-bold">
                    Give-to-Get Policy
                  </span>
                </div>
                <h4 className="type-display text-[15px] font-bold text-[var(--ink)] leading-snug">
                  Placed This Season?
                </h4>
                <p className="type-body text-[12.5px] leading-relaxed text-[var(--ink-muted)]">
                  Share your interview journey and round timelines to unlock full direct message privileges with alumni mentors.
                </p>
                <div className="pt-1">
                  <Link
                    href="/experiences/new"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)] hover:underline"
                  >
                    Contribute Dossier <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </aside>

            {/* Right Main Content Area */}
            <main className="flex-1 min-w-0 space-y-6">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                <div>
                  <h2 className="type-display text-xl sm:text-2xl font-bold text-[var(--ink)]">
                    Placed Mentors & Dossiers
                  </h2>
                  <p className="type-caption text-[12.5px] font-mono text-[var(--ink-muted)] mt-0.5">
                    Showing {filteredAlumni.length} verified candidate profile{filteredAlumni.length === 1 ? "" : "s"}
                  </p>
                </div>
                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="rounded-full text-xs"
                  >
                    Clear Active Filters
                  </Button>
                )}
              </div>

              {/* Alumni Cards Grid or Empty State */}
              {filteredAlumni.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[#FFFFFF] dark:bg-[var(--surface)] p-12 text-center space-y-3">
                  <div className="size-12 rounded-full bg-[#EAE2F8] mx-auto flex items-center justify-center text-[#6B46C1]">
                    <Search className="size-6" />
                  </div>
                  <h3 className="type-display text-xl text-[var(--ink)] font-bold">
                    No matching alumni dossiers found
                  </h3>
                  <p className="type-body text-sm text-[var(--ink-muted)] max-w-md mx-auto">
                    Try widening your company, role, campus, or batch filters to explore other placed mentors.
                  </p>
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                      className="rounded-full"
                    >
                      Reset All Filters
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 items-stretch">
                  {filteredAlumni.map((alumni, index) => {
                    const rotations = ["rotate-[-0.5deg]", "rotate-[0.5deg]", "rotate-0", "rotate-[-0.2deg]"];
                    const state = connectionStates[alumni.id] || "none";
                    const isVerified =
                      alumni.verifiedStatus === "verified" || alumni.verifiedStatus === "official";
                    const canRequestMentorship = Boolean(alumni.userId);

                    return (
                      <div
                        key={alumni.id}
                        onClick={() => setSelectedProfileAlumni(alumni)}
                        className={`group relative flex flex-col justify-between h-full border border-[var(--border)] bg-[#FFFFFF] dark:bg-[var(--surface)] p-6 rounded-2xl shadow-xs transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 hover:shadow-lg hover:border-[var(--brand)]/40 cursor-pointer ${rotations[index % rotations.length]}`}
                      >
                        <DoodleTape className="absolute -top-2.5 right-8" />

                        <div>
                          {/* Top Tag & Rounds */}
                          <div className="flex items-center justify-between border-b border-[var(--hairline-soft)] pb-3 mb-4">
                            <div className="flex items-center gap-1.5">
                              {isVerified ? (
                                <span className="type-data text-[10.5px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#4A7768]/10 text-[#4A7768] font-bold border border-[#4A7768]/25 flex items-center gap-1">
                                  <ShieldCheck className="size-3" /> Verified
                                </span>
                              ) : (
                                <span className="type-data text-[10.5px] font-mono uppercase px-2 py-0.5 rounded-full bg-[var(--paper-tint)] text-[var(--ink-muted)] font-semibold border border-[var(--border)]">
                                  Community
                                </span>
                              )}
                            </div>
                            <span className="type-data text-[11px] font-mono text-[var(--ink-muted)] font-semibold">
                              {alumni.roundsCount || 4} interview rounds
                            </span>
                          </div>

                          {/* Profile Header */}
                          <div className="flex items-start gap-3.5 mb-3.5">
                            <div
                              className={`size-12 rounded-full ${alumni.avatarBg || "bg-[#ECE8F5]"} border border-[#111016]/10 flex items-center justify-center type-display text-[17px] font-bold text-[#18161C] shrink-0 shadow-2xs`}
                            >
                              {alumni.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div className="min-w-0">
                              <h3 className="type-display text-[20px] text-[var(--ink)] leading-snug font-bold group-hover:text-[var(--brand)] transition-colors truncate">
                                {alumni.name}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <CompanyLogo name={alumni.company} size="xs" />
                                <p className="type-body text-[13px] font-semibold text-[var(--brand-bright)] truncate">
                                  {alumni.role} @ {alumni.company}
                                </p>
                              </div>
                              <p className="type-data text-[11px] text-[var(--ink-muted)] font-mono truncate">
                                {alumni.college} · Batch {alumni.year}
                              </p>
                            </div>
                          </div>

                          {/* Quote Callout */}
                          <div className="my-3 p-3 bg-[#F8F7FC] dark:bg-[var(--surface-elevated)] border border-[#ECE9F5] rounded-xl">
                            <p className="type-body text-[12.5px] leading-relaxed text-[var(--ink)] italic line-clamp-3">
                              “{alumni.quote || "Technical rounds focused heavily on DSA problem solving, Trees, and practical System Design."}”
                            </p>
                          </div>

                          {/* Technical Skill Tags */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(alumni.tags && alumni.tags.length > 0
                              ? alumni.tags
                              : ["DSA", "LeetCode", "System Design", "HR"]
                            ).slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="type-data text-[10.5px] font-mono bg-[var(--brand-soft)]/50 text-[var(--brand-bright)] px-2 py-0.5 rounded-full font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="mt-6 pt-3.5 border-t border-[var(--border)] flex items-center justify-between gap-2">
                          <span className="type-data text-[12px] font-semibold text-[var(--ink)] group-hover:text-[var(--brand)] flex items-center gap-1 font-sans transition-colors">
                            View dossier →
                          </span>

                          {canRequestMentorship ? (
                            <Button
                              size="sm"
                              disabled={state === "pending"}
                              onClick={(e) => handleConnectClick(alumni, e)}
                              className={`rounded-full px-3.5 py-1 text-[12px] font-medium transition-all shadow-2xs ${
                                state === "pending"
                                  ? "bg-[var(--brand-soft)] text-[var(--brand-bright)] border border-[var(--brand)] opacity-90 cursor-default"
                                  : "bg-[#111016] hover:bg-[var(--brand-bright)] text-white dark:bg-white dark:text-[#111016] dark:hover:bg-[var(--brand)] dark:hover:text-white cursor-pointer"
                              }`}
                            >
                              {state === "pending" ? (
                                <span className="inline-flex items-center gap-1">
                                  <Send className="size-3" /> Requested
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1">
                                  <MessageSquare className="size-3" /> Connect
                                </span>
                              )}
                            </Button>
                          ) : (
                            <Link
                              href={getCompanyHref(alumni)}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1 text-[11.5px] font-medium text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
                            >
                              Company Q&A <ArrowUpRight className="size-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* Expandable Alumni Profile Detail Modal */}
      {selectedProfileAlumni && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-xl bg-[#FFFFFF] dark:bg-[var(--surface)] border border-[var(--hairline-strong)] rounded-2xl p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              aria-label="Close alumni dossier"
              onClick={() => setSelectedProfileAlumni(null)}
              className="absolute right-5 top-5 text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-start gap-4 border-b border-[var(--border)] pb-5">
              <div
                className={`size-16 rounded-full ${selectedProfileAlumni.avatarBg || "bg-[#ECE8F5]"} border border-[#111016]/15 flex items-center justify-center type-display text-[22px] font-bold text-[#18161C] shrink-0 shadow-sm`}
              >
                {selectedProfileAlumni.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {selectedProfileAlumni.verifiedStatus === "verified" ||
                  selectedProfileAlumni.verifiedStatus === "official" ? (
                    <span className="type-data text-[11px] font-mono uppercase px-2 py-0.5 rounded-xs bg-[#4A7768]/10 text-[#4A7768] font-bold border border-[#4A7768]/25">
                      ✓ Verified Placed
                    </span>
                  ) : (
                    <span className="type-data text-[11px] font-mono uppercase px-2 py-0.5 rounded-xs bg-[var(--paper-tint)] text-[var(--ink-muted)] font-semibold border border-[var(--border)]">
                      Community Dossier
                    </span>
                  )}
                  <span className="type-data text-[11px] text-[var(--ink-muted)] font-mono">
                    {selectedProfileAlumni.roundsCount || 4} rounds
                  </span>
                </div>
                <h3 className="type-display text-[26px] text-[var(--ink)] leading-snug font-bold">
                  {selectedProfileAlumni.name}
                </h3>
                <p className="type-body text-[15px] font-semibold text-[var(--brand-bright)]">
                  {selectedProfileAlumni.role} @ {selectedProfileAlumni.company}
                </p>
                <p className="type-data text-[12px] text-[var(--ink-muted)] font-mono mt-0.5">
                  {selectedProfileAlumni.college} · Batch {selectedProfileAlumni.year}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="type-data text-[11px] uppercase tracking-wider text-[var(--ink-muted)] font-mono font-semibold mb-1.5">
                  Interview Reconstruction
                </h4>
                <div className="p-4 bg-[#F7F6FB] dark:bg-[var(--surface-elevated)] border border-[var(--hairline-soft)] rounded-md">
                  <p className="type-body text-[14px] leading-relaxed text-[var(--ink)] italic">
                    “{selectedProfileAlumni.quote || "Technical rounds focused on DSA, Trees, Graphs, and System Design fundamentals."}”
                  </p>
                </div>
              </div>

              <div>
                <h4 className="type-data text-[11px] uppercase tracking-wider text-[var(--ink-muted)] font-mono font-semibold mb-2">
                  Topic & Domain Signals
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedProfileAlumni.tags && selectedProfileAlumni.tags.length > 0
                    ? selectedProfileAlumni.tags
                    : ["DSA", "Trees", "Graphs", "System Design"]
                  ).map((tag) => (
                    <span
                      key={tag}
                      className="type-data text-[12px] font-mono bg-[var(--brand-soft)] text-[var(--brand-bright)] px-2.5 py-1 rounded-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setQuestionModalCompany({
                    id:
                      selectedProfileAlumni.companyId ||
                      selectedProfileAlumni.company.toLowerCase().replace(/\s+/g, "-"),
                    name: selectedProfileAlumni.company,
                  });
                }}
                className="rounded-full border-[var(--brand)] text-[var(--brand-bright)] hover:bg-[var(--brand-soft)]/50 px-5 text-[13.5px] font-semibold cursor-pointer"
              >
                Ask a Question
              </Button>

              {selectedProfileAlumni.userId ? (
                <Button
                  disabled={connectionStates[selectedProfileAlumni.id] === "pending"}
                  onClick={(e) => {
                    const target = selectedProfileAlumni;
                    setSelectedProfileAlumni(null);
                    handleConnectClick(target, e);
                  }}
                  className="rounded-full bg-[#111016] dark:bg-white text-white dark:text-[#111016] px-6 text-[13.5px] font-semibold hover:scale-[1.02] transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  {connectionStates[selectedProfileAlumni.id] === "pending"
                    ? "Request sent"
                    : "Connect / Mentorship"}
                  <ArrowUpRight className="size-4" />
                </Button>
              ) : (
                <Link
                  href={getCompanyHref(selectedProfileAlumni)}
                  className="rounded-full bg-[#111016] dark:bg-white text-white dark:text-[#111016] px-6 py-2.5 text-[13.5px] font-semibold hover:scale-[1.02] transition-all shadow-sm inline-flex items-center gap-2"
                >
                  Open {selectedProfileAlumni.company} Dossier <ArrowUpRight className="size-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {questionModalCompany && (
        <QuestionSlotDialog
          companyId={questionModalCompany.id}
          companyName={questionModalCompany.name}
          roles={[]}
          isOpen={true}
          onOpenChange={(open) => {
            if (!open) setQuestionModalCompany(null);
          }}
          trigger={null}
        />
      )}

      {activeModalAlumni && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-lg bg-[#FFFFFF] dark:bg-[var(--surface)] border border-[var(--hairline-strong)] rounded-sm p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              aria-label="Close message dialog"
              onClick={() => setActiveModalAlumni(null)}
              className="absolute right-5 top-5 text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="size-2 rounded-full bg-[#557D70] animate-pulse" />
              <p className="type-data text-[11px] uppercase tracking-wider text-[var(--brand)] font-mono font-semibold">
                Direct Alumni Mentorship Request
              </p>
            </div>

            <h3 className="type-display text-[24px] text-[var(--ink)] font-semibold leading-snug">
              Connect with {activeModalAlumni.name}
            </h3>
            <p className="type-body text-[13.5px] text-[var(--ink-muted)] mt-1">
              {activeModalAlumni.role} @ {activeModalAlumni.company} ({activeModalAlumni.college} · {activeModalAlumni.year})
            </p>

            {modalError && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
                <Link
                  href="/signup?next=/alumni"
                  className="font-bold underline text-[#1B635C] shrink-0"
                >
                  Sign Up Free →
                </Link>
              </div>
            )}

            {modalSuccess && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <div className="mt-5">
              <label className="type-data text-[11px] uppercase tracking-wider text-[var(--ink)] font-mono font-semibold block mb-2">
                Your message / question:
              </label>
              <textarea
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full p-3.5 bg-[#FAFAFA] dark:bg-[var(--surface-elevated)] border border-[var(--hairline-strong)] rounded-xs type-body text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 shadow-inner"
              />
              <span className="type-data text-[10.5px] text-[var(--muted)] block mt-1.5">
                ● Replies and mentorship status updates appear in your Profile inbox.
              </span>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveModalAlumni(null)}
                className="rounded-full border-[var(--hairline-strong)]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={modalLoading}
                onClick={handleSendMessage}
                className="rounded-full bg-[var(--brand-bright)] hover:bg-[var(--brand)] text-white px-5 cursor-pointer"
              >
                {modalLoading ? (
                  "Sending..."
                ) : (
                  <>
                    Send Request <Send className="size-3.5 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
