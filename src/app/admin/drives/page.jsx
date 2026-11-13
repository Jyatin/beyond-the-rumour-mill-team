import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth-helpers";
import { getAllPlacementDrivesWithStats } from "@/server/queries/placement";
import { Button } from "@/components/ui/button";
import { DriveRowActions } from "@/components/admin/drive-row-actions";
import { EditorialPageHeader } from "@/components/ui/editorial-page-header";
import { EmptyStateEditorial } from "@/components/ui/editorial-illustrations";
import {
  Plus,
  Users,
  Briefcase,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Placement Drives Manager — Admin & TPO",
  description: "Create, schedule, publish and manage campus placement drives and candidate applications.",
};

export default async function AdminDrivesPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "tpo")) {
    redirect("/login");
  }

  const drives = await getAllPlacementDrivesWithStats();

  const totalDrives = drives.length;
  const activeDrives = drives.filter(d => d.status === "Open" || d.status === "Upcoming").length;
  const totalApplications = drives.reduce((acc, d) => acc + (d.applicantCount || 0), 0);
  const totalRoles = drives.reduce((acc, d) => acc + (d.rolesCount || 0), 0);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Editorial Header */}
      <EditorialPageHeader
        eyebrow="TPO &amp; CAMPUS COORDINATION"
        title="Placement Drives Command Center"
        subtitle="Schedule upcoming company drives, set eligibility filters, specify preparation requirements, and review student applications."
        badges={[
          `${totalDrives} Configured Drives`,
          `${activeDrives} Currently Active`,
          `${totalApplications} Total Applications`,
        ]}
        action={
          <div className="flex items-center gap-3">
            <Link href="/admin/moderation">
              <Button variant="outline" size="sm" className="rounded-full text-xs">
                Moderation Queue
              </Button>
            </Link>
            <Link href="/admin/drives/new">
              <Button size="sm" className="bg-[#1B635C] hover:bg-[#154D48] text-white rounded-full text-xs gap-1.5 shadow-xs">
                <Plus className="w-4 h-4" />
                New Placement Drive
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mx-auto max-w-[1360px] py-10 px-4 sm:px-6 md:px-8 space-y-10">
        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] shadow-2xs">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#63606B] font-semibold">Total Drives</p>
            <p className="text-3xl sm:text-4xl font-bold font-editorial text-[#111111] mt-1">{totalDrives}</p>
          </div>
          <div className="p-6 rounded-2xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] shadow-2xs">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#63606B] font-semibold">Active / Upcoming</p>
            <p className="text-3xl sm:text-4xl font-bold font-editorial text-[#1B635C] mt-1">{activeDrives}</p>
          </div>
          <div className="p-6 rounded-2xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] shadow-2xs">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#63606B] font-semibold">Total Roles</p>
            <p className="text-3xl sm:text-4xl font-bold font-editorial text-[#111111] mt-1">{totalRoles}</p>
          </div>
          <div className="p-6 rounded-2xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] shadow-2xs">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#63606B] font-semibold">Applications</p>
            <p className="text-3xl sm:text-4xl font-bold font-editorial text-[#111111] mt-1">{totalApplications}</p>
          </div>
        </div>

        {/* Drives List */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold font-editorial text-[#111111]">
            Configured Campus Drives ({drives.length})
          </h2>

          {drives.length === 0 ? (
            <EmptyStateEditorial
              title="No placement drives registered"
              description="Create the first campus placement drive to publish eligibility criteria, roles, and preparation patterns."
              actionLabel="Create First Drive"
              actionHref="/admin/drives/new"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {drives.map((d) => (
                <div 
                  key={d.id}
                  className="p-6 rounded-2xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] hover:border-[#1B635C]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-bold text-xl text-[#111111] font-editorial">{d.companyName}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF7F3] border border-[#EBE4D8] text-[#1A191D] font-mono font-medium">
                        {d.companyIndustry || "Tech"}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold border ${
                        d.status === "Open"
                          ? "bg-[#D4E8DC] text-[#17563F] border-[#17563F]/20"
                          : d.status === "Cancelled"
                          ? "bg-[#FAECE8] text-[#9E372E] border-[#9E372E]/20"
                          : d.status === "Completed"
                          ? "bg-[#FAF7F3] text-[#1A191D] border-[#EBE4D8]"
                          : "bg-[#D8E2F2] text-[#1B2540] border-[#1B2540]/20"
                      }`}>
                        ● {d.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#4A4752] font-medium">
                      {d.season || "Placement Season"} · <span className="text-[#63606B] font-normal">{d.date || "Date TBA"}</span>
                      {d.deadline && <span className="text-[#9E372E] font-mono text-[11px] ml-2 font-semibold">Deadline: {d.deadline}</span>}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#63606B] pt-1">
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        {d.rolesCount} Role{d.rolesCount !== 1 ? "s" : ""}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[#111111]">
                        <Users className="w-3.5 h-3.5 text-[#1B635C]" />
                        {d.applicantCount} Applicant{d.applicantCount !== 1 ? "s" : ""}
                      </span>
                      {d.location && <span>📍 {d.location}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                    <DriveRowActions driveId={d.id} currentStatus={d.status} />
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/drives/${d.id}/applications`}>
                        <Button variant="outline" size="sm" className="rounded-full text-xs gap-1.5 border-[#ECEAE5]">
                          <Users className="w-3.5 h-3.5 text-[#1B635C]" />
                          Applicants ({d.applicantCount})
                        </Button>
                      </Link>
                      <Link href={`/companies/${d.companyId}`}>
                        <Button variant="ghost" size="sm" className="rounded-full text-xs gap-1 text-[#63606B] hover:text-[#111111]">
                          <span>Dossier</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
