"use client";

import * as React from "react";
import {
  ShieldCheck,
  ThumbsUp,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAnswerHelpfulAction } from "@/server/actions/questions";

export function QuestionThread({ question, asks = [], answers = [], currentUserId }) {
  const [helpfulCounts, setHelpfulCounts] = React.useState(() => {
    const map = {};
    answers.forEach((a) => {
      map[a.id] = a.helpfulCount || 0;
    });
    return map;
  });

  const [helpfulSuccess, setHelpfulSuccess] = React.useState({});
  const [feedbackError, setFeedbackError] = React.useState({});

  const handleMarkHelpful = async (answerId) => {
    try {
      setFeedbackError((prev) => ({ ...prev, [answerId]: "" }));
      await markAnswerHelpfulAction({ answerId });
      setHelpfulCounts((prev) => ({
        ...prev,
        [answerId]: (prev[answerId] || 0) + 1,
      }));
      setHelpfulSuccess((prev) => ({ ...prev, [answerId]: true }));
    } catch (err) {
      setFeedbackError((prev) => ({
        ...prev,
        [answerId]: err?.message || "Failed to mark helpful.",
      }));
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Question Slot Header Card */}
      <div className="border border-[var(--border)] bg-[#FFFFFF] dark:bg-[var(--surface)] p-6 sm:p-8 rounded-2xl shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2">
            <span className="type-data text-[11px] font-mono uppercase px-3 py-1 rounded-full bg-[var(--brand-soft)] text-[var(--brand-bright)] font-semibold border border-[var(--brand)]/20">
              {question.intent.replace(/_/g, " ")}
            </span>
            {question.status === "well_covered" && (
              <span className="type-data text-[11px] font-mono uppercase px-3 py-1 rounded-full bg-[#4A7768]/10 text-[#4A7768] font-bold border border-[#4A7768]/20 flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" /> Well Covered
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[12px] font-mono text-[var(--ink-muted)]">
            <span>{question.askCount} candidate ask{question.askCount !== 1 && "s"}</span>
            <span>·</span>
            <span>{question.answerCount} answer{question.answerCount !== 1 && "s"}</span>
          </div>
        </div>

        <h1 className="font-serif text-[28px] sm:text-[34px] font-bold text-[var(--ink)] leading-[1.15] tracking-tight">
          {question.title}
        </h1>

        {/* Candidate Asks Accordion / List */}
        {asks.length > 0 && (
          <div className="pt-2">
            <span className="type-data text-[11.5px] uppercase tracking-wider text-[var(--ink-muted)] font-mono font-semibold block mb-2">
              Candidate Inquiries ({asks.length}):
            </span>
            <div className="space-y-2">
              {asks.map((ask) => (
                <div
                  key={ask.id}
                  className="p-4 bg-[#F8F8FA] dark:bg-[var(--surface-elevated)] border border-[var(--hairline-soft)] rounded-xl text-[13.5px]"
                >
                  <div className="flex items-center justify-between text-[11.5px] font-mono text-[var(--muted)] mb-1">
                    <span className="font-semibold text-[var(--ink)]">{ask.userName || "Candidate"}</span>
                    <span>Hiring Cycle: {ask.hiringCycle}</span>
                  </div>
                  {ask.contextBody ? (
                    <p className="type-body text-[13.5px] text-[var(--ink-muted)] leading-relaxed italic">
                      “{ask.contextBody}”
                    </p>
                  ) : (
                    <p className="type-body text-[12.5px] text-[var(--muted)] italic">
                      Attached ask to standard question slot.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Answers Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="type-display text-[22px] font-bold text-[var(--ink)]">
            Alumni Answers ({answers.length})
          </h2>
          <span className="type-caption text-[12px] text-[var(--muted)] font-mono">
            Ordered by deterministic evidence score
          </span>
        </div>

        {answers.length === 0 ? (
          <div className="p-8 border border-dashed border-[var(--border)] rounded-xl bg-[#FAFAFA] dark:bg-[var(--surface)] text-center space-y-2">
            <p className="type-display text-[16px] text-[var(--ink)] font-semibold">
              No answers submitted yet.
            </p>
            <p className="type-body text-[13.5px] text-[var(--ink-muted)]">
              Eligible alumni who interviewed for this role can answer using the composer below.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {answers.map((ans, idx) => {
              const seqClaims = (ans.claims || []).filter((c) => c.dimension === "round_sequence");
              const oaModeClaim = (ans.claims || []).find((c) => c.dimension === "oa_mode");
              const oaDiffClaim = (ans.claims || []).find((c) => c.dimension === "oa_difficulty");
              const dsaDiffClaim = (ans.claims || []).find((c) => c.dimension === "dsa_difficulty");

              return (
                <div
                  key={ans.id}
                  className="border border-[var(--border)] bg-[#FFFFFF] dark:bg-[var(--surface)] p-6 sm:p-7 rounded-2xl shadow-xs space-y-4 hover:border-[var(--brand)]/30 transition-all"
                >
                  {/* Top Bar: Author, Verification, Score */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="type-display text-[16px] font-bold text-[var(--ink)]">
                          {ans.authorName}
                        </span>
                        {ans.isVerifiedEmployment && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-[#4A7768]/10 text-[#4A7768] border border-[#4A7768]/20">
                            <ShieldCheck className="size-3" /> Verified Employee
                          </span>
                        )}
                        {ans.basis === "own_interview" ? (
                          <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-[var(--brand-bright)] font-semibold">
                            First-hand
                          </span>
                        ) : (
                          <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[var(--muted)]">
                            {ans.basis.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <p className="type-caption text-[11.5px] text-[var(--muted)] font-mono mt-0.5">
                        Cycle: {ans.hiringCycle} · {ans.isDated && <span className="text-amber-600 font-semibold">(Dated &gt;3 yrs)</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="type-mono text-[13px] font-bold text-[var(--brand-bright)]">
                          {ans.rankScore} / 100
                        </span>
                        <span className="type-caption text-[10px] text-[var(--muted)] block font-mono">
                          Evidence Score
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Round Sequence Flow */}
                  {seqClaims.length > 0 && (
                    <div className="p-3 bg-[#F8F8FA] dark:bg-[var(--surface-elevated)] border border-[var(--hairline-soft)] rounded-lg space-y-1.5">
                      <span className="type-data text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)] block">
                        Interview Process ({seqClaims.length} rounds):
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 text-[12px] font-mono">
                        {seqClaims.map((round, rIdx) => (
                          <span key={rIdx} className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-md bg-[#FFFFFF] dark:bg-[var(--surface)] border border-[var(--border)] font-semibold text-[var(--ink)]">
                              {round.valueText}
                            </span>
                            {rIdx < seqClaims.length - 1 && (
                              <span className="text-[var(--muted)]">→</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Highlights (OA / DSA) */}
                  <div className="flex flex-wrap gap-2 text-[12px] font-mono">
                    {oaModeClaim && (
                      <span className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground">
                        OA: {oaModeClaim.valueText} {oaDiffClaim ? `(${oaDiffClaim.valueText})` : ""}
                      </span>
                    )}
                    {dsaDiffClaim && (
                      <span className="px-2.5 py-1 rounded-md bg-[var(--brand-soft)] text-[var(--brand-bright)] font-semibold">
                        DSA Level: {dsaDiffClaim.valueText}
                      </span>
                    )}
                  </div>

                  {/* Free text context */}
                  {ans.body && (
                    <p className="type-body text-[14.5px] leading-relaxed text-[var(--ink)] pt-1">
                      {ans.body}
                    </p>
                  )}

                  {/* Helpful feedback button */}
                  <div className="pt-2 border-t flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkHelpful(ans.id)}
                        disabled={helpfulSuccess[ans.id]}
                        className="rounded-full text-[12px] h-8 px-3.5 gap-1.5"
                      >
                        <ThumbsUp className="size-3.5" />
                        <span>Helpful ({helpfulCounts[ans.id] || 0})</span>
                      </Button>
                      {helpfulSuccess[ans.id] && (
                        <span className="text-[11.5px] text-green-600 font-mono">
                          ✓ Marked helpful
                        </span>
                      )}
                    </div>

                    {feedbackError[ans.id] && (
                      <span className="text-[11.5px] text-red-600">
                        {feedbackError[ans.id]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
