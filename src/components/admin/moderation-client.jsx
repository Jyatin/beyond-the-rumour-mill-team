"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import {
  publishExperienceAction,
  removeExperienceAction,
  restoreExperienceAction,
  dismissReportAction,
  resolveReportAction,
  reviewEvidenceAction,
} from "@/server/actions/moderation";
import { Button } from "@/components/ui/button";

export function ModerationClient({
  initialPending = [],
  initialFlagged = [],
  initialReports = [],
  initialEvidence = [],
}) {
  const router = useRouter();
  const [tab, setTab] = useState("pending");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [activeEvidence, setActiveEvidence] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");

  // Accessible modal state for experience removal reason (replaces window.prompt)
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removalReason, setRemovalReason] = useState("");
  const [removalFormError, setRemovalFormError] = useState("");

  const runAction = async (fn, successMsg) => {
    if (isProcessing) return;
    setActionError("");
    setActionSuccess("");
    setIsProcessing(true);
    try {
      await fn();
      setActionSuccess(successMsg);
      router.refresh();
    } catch (e) {
      setActionError(e?.message || "Failed to process moderation action.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = (id) =>
    runAction(() => publishExperienceAction(id), "Experience approved and published.");

  const handleConfirmRemove = async (e) => {
    e.preventDefault();
    if (!removeTarget || isProcessing) return;
    const trimmed = removalReason.trim();
    if (trimmed.length < 3) {
      setRemovalFormError("Please enter a short removal reason (at least 3 characters).");
      return;
    }

    setRemovalFormError("");
    await runAction(async () => {
      await removeExperienceAction(removeTarget.id, { reason: trimmed });
      setRemoveTarget(null);
      setRemovalReason("");
    }, "Experience removed from public visibility.");
  };

  const handleRestore = (id) =>
    runAction(() => restoreExperienceAction(id), "Experience restored to published status.");

  const handleDismissReport = (id) =>
    runAction(() => dismissReportAction(id), "Report dismissed.");

  const handleResolveReport = (id) =>
    runAction(() => resolveReportAction(id), "Report resolved and linked experience removed.");

  const handleEvidenceDecision = (evidenceId, decision) =>
    runAction(async () => {
      await reviewEvidenceAction({
        evidenceId,
        decision,
        reviewNotes: reviewNotes.trim() || undefined,
      });
      setActiveEvidence(null);
      setReviewNotes("");
    }, decision === "accepted" ? "Verification evidence approved." : "Verification evidence rejected.");

  return (
    <div className="space-y-6">
      {actionError && (
        <div role="alert" className="p-3.5 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError("")}
            aria-label="Dismiss error"
            className="text-red-700/70 hover:text-red-700 p-1 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div role="status" className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess("")}
            aria-label="Dismiss message"
            className="text-emerald-700/70 hover:text-emerald-700 p-1 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="flex border-b border-border/40 overflow-x-auto hide-scrollbar">
        {[
          { key: "pending", label: "Pending Experiences", count: initialPending.length, pillClass: "bg-secondary" },
          { key: "evidence", label: "Verification Evidence", count: initialEvidence.length, pillClass: "bg-emerald-100 text-emerald-800" },
          { key: "flagged", label: "Flagged", count: initialFlagged.length, pillClass: "bg-red-100 text-red-800" },
          { key: "reports", label: "Reports", count: initialReports.length, pillClass: "bg-orange-100 text-orange-800" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              tab === t.key
                ? "border-brand text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-2 ${t.pillClass} text-xs px-1.5 py-0.5 rounded-full`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "pending" && (
          <div className="space-y-4">
            {initialPending.length === 0 ? (
              <div className="p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
                No pending experiences to review.
              </div>
            ) : (
              initialPending.map((exp) => (
                <div key={exp.id} className="p-4 border rounded-lg bg-card">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {exp.companyName} - {exp.role}
                      </h3>
                      <p className="text-sm text-muted-foreground">{exp.summary}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Author Verification: {exp.verificationStatus} | Anonymous: {exp.isAnonymous ? "Yes" : "No"}
                      </p>
                      <a
                        href={`/experiences/${exp.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-brand hover:underline mt-2 inline-block"
                      >
                        View Full Experience
                      </a>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handlePublish(exp.id)} disabled={isProcessing}>
                        Publish
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setRemovalReason("");
                          setRemovalFormError("");
                          setRemoveTarget({ id: exp.id, title: `${exp.companyName} - ${exp.role}` });
                        }}
                        disabled={isProcessing}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "evidence" && (
          <div className="space-y-4">
            {initialEvidence.length === 0 ? (
              <div className="p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
                No pending verification evidence to review.
              </div>
            ) : (
              initialEvidence.map((row) => {
                const ev = row.evidence;
                const company = row.employment?.company || row.experience?.companyName || "Unknown Company";
                const applicantName = row.applicant?.name || row.employment?.name || "Alumni Applicant";
                return (
                  <div key={ev.id} className="p-4 border rounded-lg bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-base">{applicantName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary font-medium">
                          {company}
                        </span>
                        <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-muted">
                          {ev.kind.replace(/_/g, " ")}
                        </span>
                      </div>
                      {row.applicant?.email && (
                        <p className="text-xs text-muted-foreground">{row.applicant.email}</p>
                      )}
                      {ev.notes && <p className="text-sm text-foreground/80 mt-1">&ldquo;{ev.notes}&rdquo;</p>}
                      {ev.fileName && (
                        <p className="text-xs text-muted-foreground font-mono">
                          File: {ev.fileName} ({ev.mimeType || "document"})
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveEvidence(row);
                          setReviewNotes("");
                        }}
                      >
                        Inspect Proof
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEvidenceDecision(ev.id, "accepted")}
                        disabled={isProcessing}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "flagged" && (
          <div className="space-y-4">
            {initialFlagged.length === 0 ? (
              <div className="p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
                No flagged experiences.
              </div>
            ) : (
              initialFlagged.map((exp) => (
                <div key={exp.id} className="p-4 border border-red-200 dark:border-red-900 rounded-lg bg-card">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {exp.companyName} - {exp.role}
                      </h3>
                      <p className="text-sm text-muted-foreground">{exp.summary}</p>
                      <a
                        href={`/experiences/${exp.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-brand hover:underline mt-2 inline-block"
                      >
                        View Full Experience
                      </a>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleRestore(exp.id)} disabled={isProcessing}>
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setRemovalReason("");
                          setRemovalFormError("");
                          setRemoveTarget({ id: exp.id, title: `${exp.companyName} - ${exp.role}` });
                        }}
                        disabled={isProcessing}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "reports" && (
          <div className="space-y-4">
            {initialReports.length === 0 ? (
              <div className="p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
                No open reports.
              </div>
            ) : (
              initialReports.map((report) => (
                <div key={report.id} className="p-4 border border-orange-200 dark:border-orange-900 rounded-lg bg-card">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <h3 className="font-semibold">
                        Reason: <span className="font-mono text-sm">{report.reason}</span>
                      </h3>
                      {report.details && <p className="text-sm mt-1">{report.details}</p>}
                      <p className="text-xs text-muted-foreground mt-2">
                        Reported Experience ID: {report.experienceId}
                      </p>
                      {report.experienceId && (
                        <a
                          href={`/experiences/${report.experienceId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-brand hover:underline mt-1 inline-block"
                        >
                          View Experience
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2 sm:flex-col items-end shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleDismissReport(report.id)} disabled={isProcessing}>
                        Dismiss
                      </Button>
                      <Button size="sm" variant="default" onClick={() => handleResolveReport(report.id)} disabled={isProcessing}>
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Experience Removal Reason Modal */}
      {removeTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="removal-reason-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-destructive font-semibold">
                  Moderator Action
                </span>
                <h3 id="removal-reason-modal-title" className="font-editorial text-xl font-semibold mt-1">
                  Remove Experience
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{removeTarget.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                aria-label="Close modal"
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRemove} className="space-y-4">
              {removalFormError && (
                <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2.5">
                  {removalFormError}
                </p>
              )}
              <div>
                <label htmlFor="removal-reason-input" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Removal Reason (Recorded in Audit Log)
                </label>
                <textarea
                  id="removal-reason-input"
                  rows={3}
                  required
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  placeholder="e.g. Violates NDA / Unverified duplicate claim / Contains personal contact info"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setRemoveTarget(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" size="sm" disabled={isProcessing}>
                  {isProcessing ? "Removing..." : "Confirm Removal"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evidence Preview & Decision Modal */}
      {activeEvidence && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="evidence-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-brand font-semibold">
                  Verification Evidence Review
                </span>
                <h3 id="evidence-modal-title" className="font-editorial text-xl font-semibold mt-1">
                  {activeEvidence.applicant?.name || activeEvidence.employment?.name || "Applicant"} —{" "}
                  {activeEvidence.employment?.company || activeEvidence.experience?.companyName || "Company"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Type: {activeEvidence.evidence.kind.replace(/_/g, " ")}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveEvidence(null)}>
                Close
              </Button>
            </div>

            {activeEvidence.evidence.notes && (
              <div className="p-3 rounded-lg bg-muted/40 text-sm">
                <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground block mb-1">
                  Applicant Notes
                </span>
                {activeEvidence.evidence.notes}
              </div>
            )}

            {activeEvidence.evidence.referenceUrl && (
              <div className="p-4 rounded-lg border border-border bg-muted/20">
                <span className="text-xs font-mono uppercase text-muted-foreground block mb-1">
                  Submitted Reference URL
                </span>
                <a
                  href={activeEvidence.evidence.referenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-brand hover:underline break-all"
                >
                  {activeEvidence.evidence.referenceUrl}
                </a>
              </div>
            )}

            {activeEvidence.evidence.storageKey && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Document Preview ({activeEvidence.evidence.fileName})</span>
                  <a
                    href={`/api/evidence/${activeEvidence.evidence.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand hover:underline font-medium"
                  >
                    Open in New Tab ↗
                  </a>
                </div>
                {activeEvidence.evidence.mimeType?.startsWith("image/") ? (
                  <img
                    src={`/api/evidence/${activeEvidence.evidence.id}`}
                    alt="Uploaded verification proof"
                    className="max-h-96 w-auto mx-auto rounded-lg border border-border"
                  />
                ) : (
                  <iframe
                    src={`/api/evidence/${activeEvidence.evidence.id}`}
                    title="Uploaded verification PDF"
                    className="w-full h-96 rounded-lg border border-border bg-white"
                  />
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Reviewer Notes (Optional on approval, recommended on rejection)
              </label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="e.g. Offer letter domain verified / Image illegible"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <Button
                variant="destructive"
                size="sm"
                disabled={isProcessing}
                onClick={() => handleEvidenceDecision(activeEvidence.evidence.id, "rejected")}
              >
                Reject Proof
              </Button>
              <Button
                size="sm"
                className="bg-brand text-white"
                disabled={isProcessing}
                onClick={() => handleEvidenceDecision(activeEvidence.evidence.id, "accepted")}
              >
                Approve & Verify
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
