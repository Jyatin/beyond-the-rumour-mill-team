"use client";

import * as React from "react";
import { Flag, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createExperienceReportAction } from "@/server/actions/reports";

const REPORT_REASONS = [
  { value: "inaccurate_information", label: "Inaccurate or misleading details" },
  { value: "nda_or_confidential_information", label: "Contains confidential or NDA material" },
  { value: "personal_information", label: "Exposes personal / private contact information" },
  { value: "inappropriate_content", label: "Inappropriate or offensive content" },
  { value: "impersonation", label: "False identity or impersonation" },
  { value: "spam", label: "Spam or promotional content" },
  { value: "harassment", label: "Harassment or abuse" },
  { value: "other", label: "Other issue" },
];

export function ReportExperienceDialog({ experienceId }) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("inaccurate_information");
  const [details, setDetails] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await createExperienceReportAction({
        experienceId,
        reason,
        details: details.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err?.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setSubmitted(false);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
      >
        <Flag className="size-3.5" />
        <span>Report</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-experience-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close report dialog"
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-full cursor-pointer"
            >
              <X className="size-4" />
            </button>

            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Moderation & Quality
              </span>
              <h3 id="report-experience-title" className="font-editorial text-xl font-semibold mt-1">
                Report Experience
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Reports are reviewed by platform moderators and protect community accuracy.
              </p>
            </div>

            {submitted ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>Report submitted</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Thank you. This report has been queued for moderator review.
                </p>
                <div className="pt-2">
                  <Button type="button" size="sm" onClick={() => setOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div role="alert" className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="report-reason" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Reason
                  </label>
                  <select
                    id="report-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {REPORT_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="report-details" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Additional details (optional)
                  </label>
                  <textarea
                    id="report-details"
                    rows={3}
                    maxLength={1000}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Share context that helps moderators verify your report..."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" variant="destructive" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" /> Submitting...
                      </>
                    ) : (
                      "Submit Report"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

