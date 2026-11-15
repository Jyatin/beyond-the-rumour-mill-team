import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth-helpers";
import {
  getPendingExperiences,
  getFlaggedExperiences,
  getOpenReports,
  getPendingEvidenceSubmissions,
} from "@/server/queries/moderation";
import { ModerationClient } from "@/components/admin/moderation-client";
import { EditorialPageHeader } from "@/components/ui/editorial-page-header";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Moderation Queue — Admin",
  description: "Manage pending experiences, flagged content, community reports, and alumni verification evidence.",
};

export default async function AdminModerationPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const [pending, flagged, reports, evidenceQueue] = await Promise.all([
    getPendingExperiences(),
    getFlaggedExperiences(),
    getOpenReports(),
    getPendingEvidenceSubmissions(),
  ]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Editorial Header */}
      <EditorialPageHeader
        eyebrow="CAMPUS REPOSITORY SHIELD"
        title="Moderation & Verification Queue"
        subtitle="Review pending student experiences, investigate flagged content, inspect corporate verification evidence, and audit reports."
        badges={[
          `${pending.length} Pending Approval`,
          `${flagged.length} Flagged Reports`,
          `${evidenceQueue.length} Proof Documents`,
        ]}
        action={
          <Link
            href="/admin/drives"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B635C] hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            <span>Placement Drives Command Center</span>
          </Link>
        }
      />

      <div className="mx-auto max-w-[1360px] py-10 px-4 sm:px-6 md:px-8">
        <ModerationClient
          initialPending={pending}
          initialFlagged={flagged}
          initialReports={reports}
          initialEvidence={evidenceQueue}
        />
      </div>
    </div>
  );
}
