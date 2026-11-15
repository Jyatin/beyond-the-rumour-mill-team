"use client";

import * as React from "react";
import { Send, CheckCircle2, AlertCircle, Loader2, Plus, Trash2, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitAnswerAction } from "@/server/actions/questions";

const AVAILABLE_ROUND_KINDS = [
  { value: "oa", label: "Online Assessment (OA)" },
  { value: "technical", label: "Technical Interview" },
  { value: "machine_coding", label: "Machine Coding / Live Pair" },
  { value: "system_design", label: "System Design" },
  { value: "project", label: "Project & Resume Deep Dive" },
  { value: "managerial", label: "Managerial Round" },
  { value: "hr", label: "HR / Cultural Values" },
];

export function AnswerComposer({ questionId, questionTitle, companyName }) {
  const [basis, setBasis] = React.useState("own_interview");
  const [hiringCycle, setHiringCycle] = React.useState("2026/27");
  const [displayMode, setDisplayMode] = React.useState("named");
  const [roundSequence, setRoundSequence] = React.useState(["oa", "technical", "technical", "hr"]);
  const [oaMode, setOaMode] = React.useState("online");
  const [oaDifficulty, setOaDifficulty] = React.useState("Medium");
  const [dsaDifficulty, setDsaDifficulty] = React.useState("Medium-Hard");
  const [body, setBody] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const handleAddRound = () => {
    setRoundSequence((prev) => [...prev, "technical"]);
  };

  const handleRemoveRound = (index) => {
    setRoundSequence((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRoundChange = (index, value) => {
    setRoundSequence((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (roundSequence.length === 0) {
      setError("Please add at least one round in the process sequence.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await submitAnswerAction({
        questionId,
        hiringCycle,
        basis,
        displayMode,
        roundSequence,
        oaMode,
        oaDifficulty,
        dsaDifficulty,
        body: body.trim() || undefined,
      });

      setSuccess("Your structured answer was published successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setError(err?.message || "Failed to submit answer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-[var(--border)] bg-[#FFFFFF] dark:bg-[var(--surface)] p-6 sm:p-8 rounded-2xl shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[var(--brand)]" />
            <span className="type-data text-[11px] uppercase tracking-wider text-[var(--brand)] font-semibold font-mono">
              ALUMNI ANSWER COMPOSER
            </span>
          </div>
          <h3 className="type-display text-[22px] font-bold text-[var(--ink)] mt-1">
            Answer: {questionTitle}
          </h3>
          <p className="type-body text-[13px] text-[var(--ink-muted)]">
            Answers capture structured claims for deterministic consensus without social noise.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#4A7768]/10 text-[#4A7768] border border-[#4A7768]/20">
          <ShieldCheck className="size-3.5" /> Blind Answering Active
        </span>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-700 dark:text-red-400 rounded-lg text-[13.5px] flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-green-50 dark:bg-green-950/30 border border-green-200 text-green-700 dark:text-green-400 rounded-lg text-[13.5px] flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basis & Hiring Cycle */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
              Your Knowledge Basis
            </label>
            <select
              value={basis}
              onChange={(e) => setBasis(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[#FAFAFA] dark:bg-[var(--surface-elevated)] p-2.5 text-[13.5px] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)]"
            >
              <option value="own_interview">I interviewed here (Eligible for consensus)</option>
              <option value="secondhand">I know someone who interviewed</option>
              <option value="general_advice">General hiring advice</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
              Interview Hiring Cycle
            </label>
            <select
              value={hiringCycle}
              onChange={(e) => setHiringCycle(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[#FAFAFA] dark:bg-[var(--surface-elevated)] p-2.5 text-[13.5px] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)]"
            >
              <option value="2026/27">2026 / 2027 Campus Season</option>
              <option value="2025/26">2025 / 2026 Campus Season</option>
              <option value="2024/25">2024 / 2025 Prior Season</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
              Display Mode
            </label>
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[#FAFAFA] dark:bg-[var(--surface-elevated)] p-2.5 text-[13.5px] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)]"
            >
              <option value="named">Display My Name</option>
              <option value="anonymous_verified">Anonymous Verified Employee</option>
            </select>
          </div>
        </div>

        {/* Structured Process Sequence */}
        <div className="space-y-3 p-4 bg-[#F8F8FA] dark:bg-[var(--surface-elevated)] border border-[var(--hairline-soft)] rounded-xl">
          <div className="flex items-center justify-between">
            <span className="type-data text-[12.5px] font-semibold text-[var(--ink)]">
              Structured Round Sequence ({roundSequence.length} rounds derived)
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRound}
              className="rounded-full text-[12px] h-7 px-3"
            >
              <Plus className="size-3.5 mr-1" /> Add Round
            </Button>
          </div>

          <div className="space-y-2">
            {roundSequence.map((roundKind, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="type-mono text-[12px] font-bold text-[var(--brand-bright)] w-6">
                  0{idx + 1}
                </span>
                <select
                  value={roundKind}
                  onChange={(e) => handleRoundChange(idx, e.target.value)}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[#FFFFFF] dark:bg-[var(--surface)] p-2 text-[13px] text-[var(--ink)]"
                >
                  {AVAILABLE_ROUND_KINDS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
                {roundSequence.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRound(idx)}
                    className="p-1.5 text-[var(--muted)] hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* OA & DSA Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
              OA Mode
            </label>
            <select
              value={oaMode}
              onChange={(e) => setOaMode(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[#FAFAFA] dark:bg-[var(--surface-elevated)] p-2.5 text-[13.5px] text-[var(--ink)]"
            >
              <option value="online">Online / Proctored</option>
              <option value="offline">On-Campus Lab</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
              OA Difficulty
            </label>
            <select
              value={oaDifficulty}
              onChange={(e) => setOaDifficulty(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[#FAFAFA] dark:bg-[var(--surface-elevated)] p-2.5 text-[13.5px] text-[var(--ink)]"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Medium-Hard">Medium-Hard</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
              DSA Expected Level
            </label>
            <select
              value={dsaDifficulty}
              onChange={(e) => setDsaDifficulty(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[#FAFAFA] dark:bg-[var(--surface-elevated)] p-2.5 text-[13.5px] text-[var(--ink)]"
            >
              <option value="Easy">Easy (Arrays, Basic Math)</option>
              <option value="Medium">Medium (Trees, Binary Search, Sliding Window)</option>
              <option value="Medium-Hard">Medium-Hard (Graphs, DP, Trie)</option>
              <option value="Hard">Hard (Segment Trees, State DP)</option>
            </select>
          </div>
        </div>

        {/* Free text commentary */}
        <div>
          <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
            Observations & Context (Max 2000 chars)
          </label>
          <textarea
            rows={4}
            maxLength={2000}
            placeholder="Share specific round tips, evaluation criteria, and practical guidance..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[#FAFAFA] dark:bg-[var(--surface-elevated)] p-3 text-[14px] text-[var(--ink)] placeholder:text-[var(--muted)]"
          />
          <span className="type-caption text-[11px] text-[var(--muted)] block text-right">
            {body.length} / 2000 characters
          </span>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="rounded-full bg-[#111016] dark:bg-white text-white dark:text-[#111016] px-7 py-3 text-[14px] font-semibold shadow-xs hover:scale-[1.02] transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" /> Publishing...
              </>
            ) : (
              <>
                <Send className="size-4 mr-1.5" /> Publish Answer
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
