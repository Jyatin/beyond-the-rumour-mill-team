"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { applyToDriveAction } from "@/server/actions/placement";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Send } from "lucide-react";

export function DriveApplyButton({
  driveId,
  driveStatus = "Upcoming",
  companyName,
  existingApplication,
  user,
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [applied, setApplied] = React.useState(!!existingApplication);
  const [status, setStatus] = React.useState(existingApplication?.status || "applied");
  const [showModal, setShowModal] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState("");

  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <a
          href="/signup"
          className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1B635C] hover:bg-[#154D48] text-white shadow-xs transition-all"
        >
          Sign Up to Apply
        </a>
      </div>
    );
  }

  if (applied) {
    const getBadgeClass = (s) => {
      switch (s) {
        case "offered":
          return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300";
        case "shortlisted":
        case "interviewing":
          return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300";
        case "rejected":
          return "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300";
        default:
          return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200";
      }
    };

    return (
      <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${getBadgeClass(status)}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Status: {status.toUpperCase()}</span>
      </div>
    );
  }

  if (driveStatus === "Completed" || driveStatus === "Cancelled") {
    return (
      <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border border-border bg-muted text-muted-foreground">
        Applications Closed
      </span>
    );
  }

  const handleApply = async () => {
    setError("");
    try {
      setLoading(true);
      const res = await applyToDriveAction({
        driveId,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setApplied(true);
        setStatus("applied");
        setShowModal(false);
        router.refresh();
      } else if (res.message) {
        setError(res.message);
      }
    } catch (err) {
      setError(err?.message || "Failed to register application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => {
          setShowModal(true);
          setError("");
        }}
        className="bg-brand hover:bg-brand/90 text-white font-medium text-xs px-4 rounded-full gap-1.5"
      >
        <Send className="w-3 h-3" />
        Apply to Drive
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="font-editorial text-xl font-semibold text-foreground">
              Apply to {companyName} Drive
            </h3>
            <p className="text-sm text-muted-foreground">
              Confirm your registration for this campus drive. Your academic details and verified profile will be shared with the Placement Cell.
            </p>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                Optional Note / Preferred Role Focus
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Backend SDE interest, Completed LeetCode 300+ problems"
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={loading}
                className="bg-brand text-white font-medium gap-1.5"
              >
                {loading ? "Registering..." : "Submit Application"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
