"use client";

import * as React from "react";
import Link from "next/link";
import { Search, X, Plus } from "lucide-react";
import { EmptyStateEditorial } from "@/components/ui/editorial-illustrations";
import { EditorialArticleRow } from "@/components/ui/editorial-visuals";
import { CompanyLogo } from "@/components/ui/company-logo";

export function ExperiencesBrowser({ experiences = [] }) {
  const [query, setQuery] = React.useState("");
  const [selectedOutcome, setSelectedOutcome] = React.useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = React.useState("All");
  const [viewMode, setViewMode] = React.useState("cards"); // 'cards' | 'stream'

  const outcomes = React.useMemo(
    () => ["All", ...Array.from(new Set(experiences.map((e) => e.outcome).filter(Boolean)))],
    [experiences]
  );

  const difficulties = React.useMemo(
    () => ["All", ...Array.from(new Set(experiences.map((e) => e.difficulty).filter(Boolean)))],
    [experiences]
  );

  const filtered = experiences.filter((exp) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      exp.companyName?.toLowerCase().includes(q) ||
      exp.role?.toLowerCase().includes(q) ||
      exp.summary?.toLowerCase().includes(q);
    const matchesOutcome = selectedOutcome === "All" || exp.outcome === selectedOutcome;
    const matchesDifficulty = selectedDifficulty === "All" || exp.difficulty === selectedDifficulty;
    return matchesQuery && matchesOutcome && matchesDifficulty;
  });

  const reset = () => {
    setQuery("");
    setSelectedOutcome("All");
    setSelectedDifficulty("All");
  };

  const getTagColor = (outcome) => {
    if (outcome === "Offer") return "green";
    if (outcome === "Rejected") return "pink";
    return "blue";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      {/* LEFT COLUMN: Search & Filter Navigation (inspired by Reference 3 Sidebar) */}
      <aside className="lg:col-span-4 space-y-6 p-6 rounded-3xl bg-[#FAF7F3] border border-[#EBE4D8] shadow-2xs">
        {/* Search Input Box */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-[#63606B] font-bold block">
            Search Experience Repository
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#63606B]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Company, role, algorithm..."
              className="w-full h-11 pl-10 pr-9 rounded-2xl border border-[#ECEAE5] bg-white text-xs sm:text-sm text-[#111111] placeholder:text-[#63606B] focus:outline-none focus:border-[#1B635C] focus:ring-2 focus:ring-[#1B635C]/20 shadow-2xs transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#63606B] hover:text-[#111111]"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter by Outcome */}
        <div className="space-y-2 pt-4 border-t border-[#EBE4D8]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#63606B] font-bold block">
            Interview Outcome
          </span>
          <nav className="space-y-1">
            {outcomes.map((out) => {
              const active = selectedOutcome === out;
              const count =
                out === "All"
                  ? experiences.length
                  : experiences.filter((e) => e.outcome === out).length;

              return (
                <button
                  key={out}
                  type="button"
                  onClick={() => setSelectedOutcome(out)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                    active
                      ? "bg-[#1B635C] text-white font-semibold shadow-xs"
                      : "text-[#4A4752] hover:bg-white hover:text-[#111111]"
                  }`}
                >
                  <span>{out === "All" ? "All Decisions" : out}</span>
                  <span className="font-mono text-[10.5px] opacity-75">{count}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Filter by Difficulty */}
        {difficulties.length > 2 && (
          <div className="space-y-2 pt-4 border-t border-[#EBE4D8]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#63606B] font-bold block">
              Round Difficulty
            </span>
            <div className="flex flex-wrap gap-2">
              {difficulties.map((diff) => {
                const active = selectedDifficulty === diff;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`text-xs px-3.5 py-1.5 rounded-full font-mono transition-all cursor-pointer ${
                      active
                        ? "bg-[#1A191D] text-white font-semibold"
                        : "bg-white text-[#4A4752] border border-[#ECEAE5] hover:border-[#1A191D]/40"
                    }`}
                  >
                    {diff}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Contribution Box */}
        <div className="pt-6 border-t border-[#EBE4D8] space-y-3">
          <div className="p-4 rounded-2xl bg-white border border-[#ECEAE5] space-y-2 text-center">
            <span className="text-xl">🎓</span>
            <h4 className="font-editorial text-base font-bold text-[#111111]">
              Interviewed recently?
            </h4>
            <p className="text-xs text-[#63606B]">
              Share your rounds to unlock full consensus archives.
            </p>
            <Link
              href="/experiences/new"
              className="inline-flex items-center justify-center w-full rounded-full bg-[#1B635C] hover:bg-[#154D48] text-white py-2 text-xs font-semibold shadow-xs transition-colors gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Share Experience</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN COLUMN: Editorial Stream / Cards */}
      <main className="lg:col-span-8 space-y-8">
        {/* Stream Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECEAE5] pb-4">
          <div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#111111]">
              Latest Candidate Reports
            </h2>
            <p className="text-xs text-[#63606B] mt-0.5">
              Showing {filtered.length} verified candidate interview breakdowns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium cursor-pointer transition-colors ${
                viewMode === "cards"
                  ? "bg-[#1B635C] text-white"
                  : "bg-white text-[#4A4752] border border-[#ECEAE5]"
              }`}
            >
              Card View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("stream")}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium cursor-pointer transition-colors ${
                viewMode === "stream"
                  ? "bg-[#1B635C] text-white"
                  : "bg-white text-[#4A4752] border border-[#ECEAE5]"
              }`}
            >
              Article Stream
            </button>
          </div>
        </div>

        {/* Content Stream */}
        {filtered.length === 0 ? (
          <EmptyStateEditorial
            title="No interview experiences match your filters"
            description="Try clearing your search keyword or selecting a different interview outcome from the left menu."
            actionLabel="Reset All Filters"
            onAction={reset}
          />
        ) : viewMode === "stream" ? (
          /* Magazine Editorial Stream (inspired by Image 3) */
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#ECEAE5] shadow-2xs divide-y divide-[#ECEAE5]">
            {filtered.map((exp) => (
              <EditorialArticleRow
                key={exp.id}
                tag={exp.outcome === "Offer" ? "VERIFIED OFFER" : exp.outcome || "INTERVIEW DOSSIER"}
                tagColor={getTagColor(exp.outcome)}
                title={`${exp.companyName} — ${exp.role}`}
                excerpt={exp.summary}
                meta={`Reported by ${exp.isAnonymous ? "Anonymous Candidate" : exp.studentName || "Candidate"} • ${exp.rounds || 4} Rounds • Difficulty: ${exp.difficulty || "Medium"}`}
                href={`/experiences/${exp.id}`}
              />
            ))}
          </div>
        ) : (
          /* Rich Card Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((exp) => (
              <Link key={exp.id} href={`/experiences/${exp.id}`} className="group block h-full">
                <div className="h-full p-6 border border-[#ECEAE5] rounded-3xl bg-[#FFFFFF] dark:bg-[var(--surface)] hover:border-[#1B635C]/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4">
                  <div className="space-y-3.5">
                    {/* Top Row: Company Monogram + Outcome Badge */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3">
                        <CompanyLogo name={exp.companyName} size="md" className="group-hover:scale-105 transition-transform" />
                        <div>
                          <h3 className="font-editorial text-xl font-bold text-[#111111] dark:text-foreground group-hover:text-[#1B635C] transition-colors leading-tight">
                            {exp.companyName}
                          </h3>
                          <p className="text-xs font-mono uppercase tracking-wider text-[#63606B]">
                            {exp.role} {exp.year ? `• ${exp.year}` : ""}
                          </p>
                        </div>
                      </div>

                      {exp.outcome && (
                        <span
                          className={`shrink-0 text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                            exp.outcome === "Offer"
                              ? "bg-[#D4E8DC] text-[#17563F] border-[#17563F]/20"
                              : exp.outcome === "Rejected"
                                ? "bg-[#FAECE8] text-[#9E372E] border-[#9E372E]/20"
                                : "bg-[#FAF7F3] text-[#1A191D] border-[#EBE4D8]"
                          }`}
                        >
                          {exp.outcome === "Offer" ? "🎉 Offer" : exp.outcome}
                        </span>
                      )}
                    </div>

                    {/* Summary */}
                    <p className="text-xs sm:text-[13px] leading-relaxed line-clamp-3 text-[#4A4752]">
                      {exp.summary}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 border-t border-[#ECEAE5] flex items-center justify-between text-xs text-[#63606B]">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-[#1B635C] text-white flex items-center justify-center font-bold text-[10.5px]">
                        {exp.studentName ? exp.studentName.charAt(0) : "A"}
                      </div>
                      <span className="truncate max-w-[120px] text-[#111111] font-medium">
                        {exp.studentName || "Anonymous"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      {exp.difficulty && (
                        <span className="px-2 py-0.5 rounded-md bg-[#FAF7F3] border border-[#EBE4D8] text-[#111111]">
                          {exp.difficulty}
                        </span>
                      )}
                      {exp.rounds && (
                        <span className="text-[#63606B]">
                          {exp.rounds} Rds
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
