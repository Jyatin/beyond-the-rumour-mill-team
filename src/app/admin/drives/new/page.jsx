import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth-helpers";
import { getCompanies } from "@/server/queries/companies";
import { DriveCreateForm } from "@/components/admin/drive-create-form";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New Placement Drive — Beyond the Rumour Mill",
  description: "Schedule and publish a new campus placement drive.",
};

export default async function NewPlacementDrivePage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "tpo")) {
    redirect("/login");
  }

  const companies = await getCompanies();

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
          Publish Placement Drive
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Define company parameters, eligible branches, minimum CGPA, and preparation roadmaps for students.
        </p>
      </div>

      <DriveCreateForm companies={companies} />
    </div>
  );
}
