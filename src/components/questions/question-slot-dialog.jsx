"use client";

import * as React from "react";
import { Plus, HelpCircle, Loader2, CheckCircle2, AlertCircle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createOrAttachQuestionAskAction } from "@/server/actions/questions";

const INTENTS = [
  { value: "selection_process", label: "Selection Process Overview" },
  { value: "oa", label: "Online Assessment (OA) Details" },
  { value: "dsa", label: "DSA & Algorithmic Expectations" },
  { value: "fundamentals", label: "CS Fundamentals (DBMS, OS, OOP, CN)" },
  { value: "development", label: "Development & Practical Tech Stack" },
  { value: "interview_rounds", label: "Technical & HR Round Breakdown" },
  { value: "projects", label: "Resume & Project Evaluation Depth" },
  { value: "hr", label: "Behavioral & HR Questions" },
  { value: "custom", label: "Custom Specific Question" },
];

export function QuestionSlotDialog({ companyId, companyName, roles = [], trigger, isOpen: controlledIsOpen, onOpenChange }) {
  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (val) => {
    if (onOpenChange) onOpenChange(val);
    if (!isControlled) setInternalIsOpen(val);
  };
  const [intent, setIntent] = React.useState("selection_process");
  const [roleFamilyId, setRoleFamilyId] = React.useState(roles[0]?.id || "");
  const [hiringCycle, setHiringCycle] = React.useState("2026/27");
  const [customTitle, setCustomTitle] = React.useState("");
  const [contextBody, setContextBody] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await createOrAttachQuestionAskAction({
        companyId,
        roleFamilyId: roleFamilyId || null,
        intent,
        hiringCycle,
        customTitle: intent === "custom" ? customTitle : undefined,
        contextBody: contextBody.trim() || undefined,
      });

      setSuccess(
        res.isNewSlot
          ? "Shared question slot created! Other candidates can now attach asks."
          : "Your ask was attached to the existing shared question slot!"
      );

      setTimeout(() => {
        setIsOpen(false);
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err?.message || "Failed to submit question ask.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {trigger !== undefined ? (
        trigger
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full bg-[#111016] dark:bg-white text-white dark:text-[#111016] px-5 py-2 text-[13px] font-semibold hover:scale-[1.02] transition-all shadow-xs inline-flex items-center gap-1.5"
        >
          <Plus className="size-4" /> Ask Question Slot
        </Button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#FFFFFF] dark:bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-[var(--brand)]" />
                  <span className="type-data text-[11px] uppercase tracking-wider text-[var(--brand)] font-semibold font-mono">
                    SHARED QUESTION SLOT
                  </span>
                </div>
                <h3 className="type-display text-[22px] font-bold text-[var(--ink)] mt-1">
                  Ask about {companyName}
                </h3>
                <p className="type-body text-[13px] text-[var(--ink-muted)]">
                  Standard questions are unified so alumni can answer once for all candidates.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--ink)] p-1 rounded-full transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-700 dark:text-red-400 rounded-lg text-[13px] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error === "Unauthorized" ? "Please sign up or sign in to open a shared question slot." : error}</span>
                </div>
                {error === "Unauthorized" && (
                  <a
                    href="/signup"
                    className="font-bold underline text-[#1B635C] hover:opacity-80 shrink-0"
                  >
                    Sign Up Free →
                  </a>
                )}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 text-green-700 dark:text-green-400 rounded-lg text-[13px] flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Intent */}
              <div>
                <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                  Question Intent
                </label>
                <select
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[#FAFAFA] dark:bg-[var(--surface-elevated)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)]"
                >
                  {INTENTS.map((i) => (
                    <option key={i.value} value={i.value}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role */}
              {roles.length > 0 && (
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                    Role Title
                  </label>
                  <select
                    value={roleFamilyId}
                    onChange={(e) => setRoleFamilyId(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[#FAFAFA] dark:bg-[var(--surface-elevated)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)]"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Title if custom intent */}
              {intent === "custom" && (
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                    Custom Question Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Is there a Low-Level Design round for freshers?"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[#FAFAFA] dark:bg-[var(--surface-elevated)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>
              )}

              {/* Hiring Cycle */}
              <div>
                <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                  Target Hiring Cycle
                </label>
                <select
                  value={hiringCycle}
                  onChange={(e) => setHiringCycle(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[#FAFAFA] dark:bg-[var(--surface-elevated)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)]"
                >
                  <option value="2026/27">2026 / 2027 Campus Season</option>
                  <option value="2025/26">2025 / 2026 Campus Season</option>
                  <option value="2024/25">2024 / 2025 Prior Season</option>
                </select>
              </div>

              {/* Context Body */}
              <div>
                <label className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                  Your Specific Context / Ask (Optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  placeholder="e.g. I am appearing next week and want to know how much time is given per coding problem."
                  value={contextBody}
                  onChange={(e) => setContextBody(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[#FAFAFA] dark:bg-[var(--surface-elevated)] p-3 text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)] placeholder:text-[var(--muted)]"
                />
                <span className="type-caption text-[11px] text-[var(--muted)] block text-right">
                  {contextBody.length} / 1000 characters
                </span>
              </div>

              {/* Submit CTA */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full bg-[#111016] dark:bg-white text-white dark:text-[#111016] px-6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" /> Submitting...
                    </>
                  ) : (
                    "Submit Question Ask"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
