import { getCurrentUser } from "@/server/auth-helpers";
import { getCompanies } from "@/server/queries/companies";
import { getMyCv } from "@/server/queries/cv";
import { ExperienceForm } from "@/components/experiences/experience-form";
import { EditorialPageHeader } from "@/components/ui/editorial-page-header";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Submit Interview Experience — Beyond the Rumour Mill",
  description: "Share your placement and internship interview experience to help batchmates prepare.",
};

export default async function NewExperiencePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/experiences/new");
  }

  const [companies, initialCv] = await Promise.all([
    getCompanies().catch(() => []),
    getMyCv().catch(() => null),
  ]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Editorial Header */}
      <EditorialPageHeader
        eyebrow="COMMUNITY CONTRIBUTION"
        title="Share Your Interview Experience"
        subtitle="Help future students navigate campus hiring by detailing your rounds, questions asked, and preparation advice."
        illustration={
          <div className="relative w-full max-w-[340px] aspect-[4/3] rounded-3xl overflow-hidden border-2 border-[#1B635C]/20 bg-white p-2.5 shadow-md">
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#FAF7F3]">
              <Image
                src="/assets/editorial-interview-dialogue.jpg"
                alt="Engineering candidates sharing verified interview rounds"
                fill
                className="object-cover object-center hover:scale-[1.02] transition-transform duration-500"
                priority
              />
              <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full border border-[#D4E8DC] shadow-xs flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#1B635C]" />
                <span className="font-mono text-[10px] font-bold text-[#17563F]">VERIFIED CAMPUS TRANSCRIPT</span>
              </div>
            </div>
          </div>
        }
        badges={[
          "Round-by-Round Breakdown",
          "Optional Anonymous Publishing",
          "Verified Placement Credential",
        ]}
        action={
          <Link
            href="/experiences"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B635C] hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Experience Repository</span>
          </Link>
        }
      />

      <div className="mx-auto max-w-[1000px] py-10 px-4 sm:px-6 md:px-8">
        <ExperienceForm companies={companies} initialCv={initialCv} />
      </div>
    </div>
  );
}
