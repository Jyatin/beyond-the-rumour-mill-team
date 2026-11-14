import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth-helpers";
import { getCompanies } from "@/server/queries/companies";
import { getPlacementDriveWithDetails } from "@/server/queries/placement";
import { DriveCreateForm } from "@/components/admin/drive-create-form";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Placement Drive — Beyond the Rumour Mill",
  description: "Modify scheduled placement drive details, roles, eligibility, and preparation criteria.",
};

export default async function EditPlacementDrivePage({ params }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "tpo")) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const driveId = resolvedParams.id;

  const [drive, companies] = await Promise.all([
    getPlacementDriveWithDetails(driveId),
    getCompanies(),
  ]);

  if (!drive) {
    notFound();
  }

  return (
    <div className="container max-w-4xl py-12 px-5 sm:px-8">
      <Link
        href="/admin/drives"
        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Drives Manager
      </Link>

      <div className="border-b border-border pb-6 mb-8">
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-foreground">
          Edit Placement Drive
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Update timelines, registration status, eligible criteria, and role-level preparation requirements.
        </p>
      </div>

      <DriveCreateForm
        companies={companies}
        initialDrive={drive}
        mode="edit"
      />
    </div>
  );
}

