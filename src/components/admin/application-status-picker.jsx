"use client";

import * as React from "react";
import { updateApplicationStatusAction } from "@/server/actions/placement";

export function ApplicationStatusPicker({ applicationId, currentStatus }) {
  const [status, setStatus] = React.useState(currentStatus);
  const [saving, setSaving] = React.useState(false);

  const handleChange = async (e) => {
    const nextStatus = e.target.value;
    setStatus(nextStatus);
    try {
      setSaving(true);
      await updateApplicationStatusAction({
        applicationId,
        status: nextStatus,
      });
    } catch (err) {
      console.error("Failed to update status:", err);
      setStatus(currentStatus);
    } finally {
      setSaving(false);
    }
  };

  const getBadgeClass = (s) => {
    switch (s) {
      case "offered":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300";
      case "interviewing":
      case "shortlisted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300";
      case "rejected":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300";
      default:
        return "bg-muted text-foreground border-border";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={handleChange}
        disabled={saving}
        className={`text-xs font-semibold px-2.5 py-1 rounded-md border focus:outline-none focus:ring-1 focus:ring-brand transition-colors cursor-pointer ${getBadgeClass(status)}`}
      >
        <option value="applied">Applied</option>
        <option value="shortlisted">Shortlisted</option>
        <option value="interviewing">Interviewing</option>
        <option value="offered">Offered</option>
        <option value="rejected">Rejected</option>
        <option value="withdrawn">Withdrawn</option>
      </select>
      {saving && <span className="text-[10px] text-muted-foreground animate-pulse">Saving...</span>}
    </div>
  );
}
