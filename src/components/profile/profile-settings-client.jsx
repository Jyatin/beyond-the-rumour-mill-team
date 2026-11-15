"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { upsertMyProfileAction } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Pencil, Check, Shield, GraduationCap, Eye, EyeOff } from "lucide-react";

export function ProfileSettingsClient({ user, initialProfile = null }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(!initialProfile);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [savedMsg, setSavedMsg] = React.useState("");

  const [displayName, setDisplayName] = React.useState(
    initialProfile?.displayName || user?.name || ""
  );
  const [headline, setHeadline] = React.useState(
    initialProfile?.headline || ""
  );
  const [college, setCollege] = React.useState(
    initialProfile?.college || ""
  );
  const [gradYear, setGradYear] = React.useState(
    String(initialProfile?.gradYear || 2026)
  );
  const [bio, setBio] = React.useState(initialProfile?.bio || "");
  const [openToMentoring, setOpenToMentoring] = React.useState(
    Boolean(initialProfile?.openToMentoring)
  );
  const [visibility, setVisibility] = React.useState(
    initialProfile?.visibility === "private" ? "private" : "public"
  );

  const canMentor = user?.role === "alumni" || user?.role === "admin";
  const isStaff = user?.role === "admin" || user?.role === "tpo";

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSavedMsg("");

    try {
      setSaving(true);
      const res = await upsertMyProfileAction({
        displayName,
        headline,
        bio,
        college,
        gradYear: Number(gradYear),
        openToMentoring: canMentor ? openToMentoring : false,
        visibility,
      });

      if (res.success) {
        setSavedMsg("Profile updated.");
        setEditing(false);
        router.refresh();
      }
    } catch (err) {
      setError(err?.message || "Failed to save profile settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border rounded-xl p-6 space-y-6">
      {/* Top Account Strip */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider font-semibold">
              Account Name
            </p>
            <p className="font-medium text-base mt-0.5">{user.name}</p>
          </div>
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider font-semibold">
              Email
            </p>
            <p className="font-medium text-sm mt-0.5 break-all">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider font-semibold">
              Role
            </p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground capitalize">
              {isStaff && <Shield className="size-3 text-brand" />}
              {user.role}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isStaff && (
            <>
              <Link href="/admin/drives">
                <Button variant="outline" size="sm" className="text-xs">
                  Drives Manager
                </Button>
              </Link>
              <Link href="/admin/moderation">
                <Button variant="outline" size="sm" className="text-xs">
                  Moderation Queue
                </Button>
              </Link>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEditing((prev) => !prev);
              setError("");
              setSavedMsg("");
            }}
            className="gap-1.5 text-xs"
          >
            <Pencil className="size-3.5" />
            {editing ? "Close Editor" : initialProfile ? "Edit Academic Profile" : "Set Up Profile"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          {error}
        </div>
      )}

      {savedMsg && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50 text-xs flex items-center gap-1.5">
          <Check className="size-3.5" />
          {savedMsg}
        </div>
      )}

      {/* Read Summary */}
      {!editing && initialProfile && (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-base text-foreground">{initialProfile.displayName}</p>
              <p className="text-muted-foreground">{initialProfile.headline}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              {initialProfile.visibility === "private" ? (
                <>
                  <EyeOff className="size-3" /> Private Profile
                </>
              ) : (
                <>
                  <Eye className="size-3" /> Public Profile
                </>
              )}
            </span>
          </div>

          <p className="text-muted-foreground leading-relaxed">{initialProfile.bio}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground pt-1">
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="size-3.5 text-brand" />
              {initialProfile.college} · Class of {initialProfile.gradYear}
            </span>
            {canMentor && (
              <span className="text-foreground">
                Mentorship: {initialProfile.openToMentoring ? "Open to mentoring" : "Paused"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Profile Editor Form */}
      {editing && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                Display Name *
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                Headline *
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={160}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Final Year CSE Student / SDE Intern"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                College / University *
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={160}
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. NIT Surathkal"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                Graduation Year *
              </label>
              <input
                type="number"
                required
                min={1990}
                max={2035}
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
              Academic & Preparation Bio *
            </label>
            <textarea
              required
              minLength={5}
              maxLength={1000}
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share target roles, core tech stack, or focus areas for upcoming drives."
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/60">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="px-2.5 py-1 rounded-md border border-input bg-background text-xs"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              {canMentor && (
                <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openToMentoring}
                    onChange={(e) => setOpenToMentoring(e.target.checked)}
                    className="rounded border-input accent-[var(--brand)]"
                  />
                  <span>Open to mentoring & mock interviews</span>
                </label>
              )}
            </div>

            <div className="flex items-center gap-2">
              {initialProfile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-brand hover:bg-brand/90 text-white"
              >
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

