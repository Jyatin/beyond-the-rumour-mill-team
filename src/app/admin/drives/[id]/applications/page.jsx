import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth-helpers";
import { getPlacementDriveWithDetails, getDriveApplicationsForDrive } from "@/server/queries/placement";
import { ApplicationStatusPicker } from "@/components/admin/application-status-picker";
import { ArrowLeft, Users, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Drive Applicants — Beyond the Rumour Mill",
};

export default async function DriveApplicationsPage({ params }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "tpo")) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const driveId = resolvedParams.id;

  const [drive, applicants] = await Promise.all([
    getPlacementDriveWithDetails(driveId),
    getDriveApplicationsForDrive(driveId),
  ]);

  if (!drive) return notFound();

  return (
    <div className="container max-w-5xl py-12 px-5 sm:px-8">
      <Link 
        href="/admin/drives"
        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Placement Drives
      </Link>

      <div className="border-b border-border pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-brand font-semibold">
            {drive.status} Drive
          </span>
          <h1 className="font-editorial text-3xl font-semibold text-foreground mt-1">
            {drive.season} Candidates
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {applicants.length} total student application{applicants.length !== 1 ? "s" : ""} registered for this drive.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/companies/${drive.companyId}`} className="text-xs text-muted-foreground hover:text-foreground">
            View Company Info →
          </Link>
        </div>
      </div>

      {applicants.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-border bg-muted/20">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-lg text-foreground">No applications yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Students who view this company drive and click &ldquo;Apply&rdquo; will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase font-mono text-muted-foreground tracking-wider">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Applied At</th>
                  <th className="py-3 px-4">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applicants.map(({ application: app, student }) => (
                  <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-foreground">{student.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {student.email}
                      </div>
                      {app.notes && (
                        <div className="text-xs text-muted-foreground/80 mt-1 italic">
                          &ldquo;{app.notes}&rdquo;
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-muted-foreground">
                      {new Date(app.appliedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <ApplicationStatusPicker
                        applicationId={app.id}
                        currentStatus={app.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
