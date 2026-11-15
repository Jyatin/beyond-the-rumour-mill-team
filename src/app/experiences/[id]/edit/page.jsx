import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth-helpers";
import { getExperienceById } from "@/server/queries/experiences";
import { getExperienceWithRounds } from "@/server/queries/rounds";
import { getCompanies } from "@/server/queries/companies";
import { getMyCv } from "@/server/queries/cv";
import { ExperienceForm } from "@/components/experiences/experience-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditExperiencePage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  if (!id) return notFound();

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/experiences/${id}/edit`)}`);
  }

  const experience = await getExperienceById(id);

  if (!experience) return notFound();

  if (experience.authorId !== user.id && user.role !== "admin") {
    return notFound();
  }

  const [rounds, companies, initialCv] = await Promise.all([
    getExperienceWithRounds(id).catch(() => []),
    getCompanies().catch(() => []),
    getMyCv().catch(() => null),
  ]);
  const experienceData = { ...experience, rounds };

  return (
    <div className="container max-w-5xl py-10 md:py-14">
      <div className="mb-6 flex justify-between items-center">
        <Link href={`/experiences/${experience.id}`} className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors">
          &larr; Back to Experience
        </Link>
      </div>

      <div className="mb-8 text-center space-y-2">
        <h1 className="font-editorial text-3xl md:text-4xl tracking-tight">
          Edit Interview Experience
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Update your structured rounds, technical questions, preparation tips, or privacy settings.
        </p>
      </div>

      <ExperienceForm
        initialData={experienceData}
        mode="edit"
        companies={companies}
        initialCv={initialCv}
      />
    </div>
  );
}
