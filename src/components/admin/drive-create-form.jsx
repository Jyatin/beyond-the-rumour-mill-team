"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  createPlacementDriveAction,
  updatePlacementDriveAction,
} from "@/server/actions/placement";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Building2, Briefcase } from "lucide-react";

function formatResourcesText(resources) {
  if (!Array.isArray(resources) || resources.length === 0) return "";
  return resources
    .map((r) => (r.url ? `${r.title} | ${r.url}` : r.title))
    .join("\n");
}

function parseResourcesText(text) {
  if (!text || !text.trim()) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawTitle, ...rest] = line.split("|");
      const title = rawTitle?.trim() || "";
      const url = rest.join("|").trim();
      return url ? { title, url } : { title };
    })
    .filter((r) => r.title.length > 0);
}

function mapInitialRoles(initialDrive) {
  if (!initialDrive?.roles || initialDrive.roles.length === 0) {
    return [
      {
        title: initialDrive ? "" : "Software Engineer (SDE-1)",
        ctc: initialDrive ? "" : "16-22 LPA",
        employmentType: "Full-time",
        location: initialDrive?.location || "Bangalore",
        cgpa: initialDrive ? "" : "7.5+",
        branches: initialDrive ? "" : "CSE, IT, ECE",
        backlog: initialDrive ? "" : "0 Active Backlogs",
        otherCriteria: "",
        requiredSkills: initialDrive ? "" : "Data Structures, Algorithms, System Design, SQL",
        suggestedTopics: initialDrive ? "" : "Dynamic Programming, Trees, Graphs, DBMS, OOP",
        preparationResourcesText: "",
      },
    ];
  }

  return initialDrive.roles.map((r) => ({
    id: r.id,
    title: r.title || "",
    ctc: r.ctc || "",
    employmentType: r.employmentType || "Full-time",
    location: r.location || initialDrive.location || "",
    cgpa: r.eligibility?.cgpa || "",
    branches: Array.isArray(r.eligibility?.branches)
      ? r.eligibility.branches.join(", ")
      : "",
    backlog: r.eligibility?.backlog || "",
    otherCriteria: r.eligibility?.otherCriteria || "",
    requiredSkills: Array.isArray(r.preparation?.requiredSkills)
      ? r.preparation.requiredSkills.join(", ")
      : "",
    suggestedTopics: Array.isArray(r.preparation?.suggestedTopics)
      ? r.preparation.suggestedTopics.join(", ")
      : "",
    preparationResourcesText: formatResourcesText(r.preparation?.preparationResources),
  }));
}

export function DriveCreateForm({
  companies = [],
  initialDrive = null,
  mode = "create",
}) {
  const isEdit = mode === "edit" && Boolean(initialDrive?.id);
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Drive metadata
  const [companyId, setCompanyId] = React.useState(
    initialDrive?.companyId || companies[0]?.id || ""
  );
  const [season, setSeason] = React.useState(
    initialDrive?.season || "Placement Season 2026"
  );
  const [date, setDate] = React.useState(initialDrive?.date || "August 2026");
  const [deadline, setDeadline] = React.useState(
    initialDrive?.deadline ?? (isEdit ? "" : "July 31, 2026")
  );
  const [location, setLocation] = React.useState(
    initialDrive?.location ?? (isEdit ? "" : "Bangalore / Hyderabad / Hybrid")
  );
  const [status, setStatus] = React.useState(initialDrive?.status || "Upcoming");
  const [eligibleStudentInfo, setEligibleStudentInfo] = React.useState(
    initialDrive?.eligibleStudentInformation ??
      (isEdit
        ? ""
        : "Open to B.Tech final-year students (CSE, IT, ECE) graduating in 2026.")
  );

  const [roles, setRoles] = React.useState(() => mapInitialRoles(initialDrive));

  const addRole = () => {
    setRoles((prev) => [
      ...prev,
      {
        title: "",
        ctc: "",
        employmentType: "Full-time",
        location: location,
        cgpa: "7.0+",
        branches: "CSE, IT, ECE",
        backlog: "0 Active Backlogs",
        otherCriteria: "",
        requiredSkills: "",
        suggestedTopics: "",
        preparationResourcesText: "",
      },
    ]);
  };

  const removeRole = (index) => {
    setRoles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRole = (index, field, value) => {
    setRoles((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!companyId) {
      setError("Please select a target company.");
      return;
    }

    try {
      setLoading(true);

      const parsedRoles = roles
        .filter((r) => r.title.trim().length > 0)
        .map((r) => ({
          id: r.id,
          title: r.title.trim(),
          ctc: r.ctc.trim() || undefined,
          location: r.location.trim() || location.trim() || undefined,
          employmentType: r.employmentType || "Full-time",
          cgpa: r.cgpa.trim() || undefined,
          branches: r.branches
            ? r.branches
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          backlog: r.backlog.trim() || undefined,
          otherCriteria: r.otherCriteria?.trim() || undefined,
          requiredSkills: r.requiredSkills
            ? r.requiredSkills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          suggestedTopics: r.suggestedTopics
            ? r.suggestedTopics
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          preparationResources: parseResourcesText(r.preparationResourcesText),
        }));

      const payload = {
        companyId,
        season: season.trim(),
        date: date.trim() || undefined,
        deadline: deadline.trim() || undefined,
        location: location.trim() || undefined,
        status,
        eligibleStudentInformation: eligibleStudentInfo.trim() || undefined,
        roles: parsedRoles,
      };

      const res = isEdit
        ? await updatePlacementDriveAction(initialDrive.id, payload)
        : await createPlacementDriveAction(payload);

      if (res.success) {
        router.push("/admin/drives");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError(
        err?.message ||
          (isEdit
            ? "Failed to update placement drive."
            : "Failed to create placement drive.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* SECTION 1: Company & Season */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-6">
        <h2 className="text-lg font-semibold font-editorial flex items-center gap-2">
          <Building2 className="w-5 h-5 text-brand" />
          1. Company & Scheduling
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Select Company *
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
              required
            >
              <option value="">Select a company...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.industry})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Drive Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="Upcoming">Upcoming (Scheduled)</option>
              <option value="Open">Open (Applications Live)</option>
              <option value="Ongoing">Ongoing (Interviews Active)</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Season / Drive Title
            </label>
            <input
              type="text"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="e.g. Campus Hiring 2026"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Drive Date
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="e.g. August 15-20, 2026"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Registration Deadline
            </label>
            <input
              type="text"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              placeholder="e.g. July 31, 2026 - 11:59 PM"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bangalore / Remote"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
            Eligible Student Criteria Overview
          </label>
          <textarea
            value={eligibleStudentInfo}
            onChange={(e) => setEligibleStudentInfo(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="e.g. Final-year students graduating 2026 with no active backlogs."
          />
        </div>
      </div>

      {/* SECTION 2: Roles & Requirements */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-lg font-semibold font-editorial flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand" />
            2. Roles & Preparation Requirements ({roles.length})
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={addRole} className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            Add Another Role
          </Button>
        </div>

        <div className="space-y-6">
          {roles.map((role, idx) => (
            <div key={role.id || idx} className="p-5 rounded-lg border border-border/80 bg-muted/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase font-bold text-brand">Role #{idx + 1}</span>
                {roles.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRole(idx)}
                    className="text-destructive hover:bg-destructive/10 h-7 px-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    value={role.title}
                    onChange={(e) => updateRole(idx, "title", e.target.value)}
                    placeholder="e.g. SDE-1, Data Analyst, Cloud Consultant"
                    className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    CTC Package
                  </label>
                  <input
                    type="text"
                    value={role.ctc}
                    onChange={(e) => updateRole(idx, "ctc", e.target.value)}
                    placeholder="e.g. 18 LPA"
                    className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    Type
                  </label>
                  <select
                    value={role.employmentType}
                    onChange={(e) => updateRole(idx, "employmentType", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Intern + FTE">Intern + FTE</option>
                  </select>
                </div>
              </div>

              {/* Eligibility Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/60">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    Min CGPA
                  </label>
                  <input
                    type="text"
                    value={role.cgpa}
                    onChange={(e) => updateRole(idx, "cgpa", e.target.value)}
                    placeholder="e.g. 7.5+"
                    className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    Eligible Branches (comma separated)
                  </label>
                  <input
                    type="text"
                    value={role.branches}
                    onChange={(e) => updateRole(idx, "branches", e.target.value)}
                    placeholder="e.g. CSE, IT, ECE, EEE"
                    className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    Backlog Policy
                  </label>
                  <input
                    type="text"
                    value={role.backlog}
                    onChange={(e) => updateRole(idx, "backlog", e.target.value)}
                    placeholder="e.g. 0 Active Backlogs"
                    className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              {/* Required Skills & Prep topics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    Required Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={role.requiredSkills}
                    onChange={(e) => updateRole(idx, "requiredSkills", e.target.value)}
                    placeholder="e.g. DSA, Python, Docker, React, AWS"
                    className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    Suggested Prep Topics (comma separated)
                  </label>
                  <input
                    type="text"
                    value={role.suggestedTopics}
                    onChange={(e) => updateRole(idx, "suggestedTopics", e.target.value)}
                    placeholder="e.g. Dynamic Programming, Graphs, System Design"
                    className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Preparation Resources (one per line: Title | https://...)
                </label>
                <textarea
                  value={role.preparationResourcesText}
                  onChange={(e) => updateRole(idx, "preparationResourcesText", e.target.value)}
                  rows={2}
                  placeholder="NeetCode Roadmap | https://neetcode.io/roadmap"
                  className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/drives")}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-brand text-white font-medium px-6">
          {loading
            ? isEdit
              ? "Saving Changes..."
              : "Publishing Drive..."
            : isEdit
            ? "Save Drive Changes"
            : "Publish Placement Drive"}
        </Button>
      </div>
    </form>
  );
}
