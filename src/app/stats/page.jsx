import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db } from "@/server/db";
import {
  companies,
  experiences,
  alumniProfiles,
  placementDrives,
  evidence,
  questions,
} from "@/server/db/schema";
import { EditorialPageHeader } from "@/components/ui/editorial-page-header";
import { Building2, Briefcase, Users, Calendar, ShieldCheck, MessageSquare, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Campus Metrics — Beyond the Rumour Mill",
};

export default async function StatsPage() {
  const metrics = {
    companiesCount: 0,
    publishedExperiences: 0,
    verifiedAlumni: 0,
    activeDrives: 0,
    acceptedEvidence: 0,
    openQuestions: 0,
  };

  try {
    const [compRes, expRes, alumRes, driveRes, evRes, qRes] = await Promise.all([
      db.select({ value: count() }).from(companies),
      db.select({ value: count() }).from(experiences).where(eq(experiences.status, "published")),
      db.select({ value: count() }).from(alumniProfiles).where(eq(alumniProfiles.verifiedStatus, "verified")),
      db.select({ value: count() }).from(placementDrives),
      db.select({ value: count() }).from(evidence).where(eq(evidence.status, "accepted")),
      db.select({ value: count() }).from(questions),
    ]);

    metrics.companiesCount = Number(compRes[0]?.value || 0);
    metrics.publishedExperiences = Number(expRes[0]?.value || 0);
    metrics.verifiedAlumni = Number(alumRes[0]?.value || 0);
    metrics.activeDrives = Number(driveRes[0]?.value || 0);
    metrics.acceptedEvidence = Number(evRes[0]?.value || 0);
    metrics.openQuestions = Number(qRes[0]?.value || 0);
  } catch (err) {
    console.error("Failed to fetch campus stats:", err);
  }

  const cards = [
    {
      label: "Indexed Employers",
      value: metrics.companiesCount,
      href: "/companies",
      desc: "Hiring companies indexed with past CTC, eligibility, and consensus",
      icon: Building2,
      color: "#1B635C",
    },
    {
      label: "Published Experiences",
      value: metrics.publishedExperiences,
      href: "/experiences",
      desc: "Round-by-round candidate reports with interview problem statements",
      icon: Briefcase,
      color: "#155A38",
    },
    {
      label: "Verified Alumni Mentors",
      value: metrics.verifiedAlumni,
      href: "/alumni",
      desc: "Active graduates with verified work email or offer letter credentials",
      icon: Users,
      color: "#1B2540",
    },
    {
      label: "Campus Placement Drives",
      value: metrics.activeDrives,
      href: "/companies",
      desc: "Scheduled campus hiring cycles configured with TPO coordinators",
      icon: Calendar,
      color: "#247B72",
    },
    {
      label: "Accepted Proof Records",
      value: metrics.acceptedEvidence,
      href: "/experiences",
      desc: "Offer letters, corporate badges, and OTP-confirmed submissions",
      icon: ShieldCheck,
      color: "#17563F",
    },
    {
      label: "Placement Q&A Slots",
      value: metrics.openQuestions,
      href: "/questions",
      desc: "Unified student question slots answered by placed alumni",
      icon: MessageSquare,
      color: "#1A191D",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Editorial Header */}
      <EditorialPageHeader
        eyebrow="REPOSITORY TELEMETRY"
        title="Campus Placement Intelligence Metrics"
        subtitle="Live database totals across indexed companies, verified alumni credentials, active drives, and community interview transcripts."
        badges={[
          "Live System Telemetry",
          "Immutable Verification Audit",
          "Zero-Hearsay Ground Truth",
        ]}
      />

      <div className="mx-auto max-w-[1360px] py-10 px-4 sm:px-6 md:px-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.label}
                href={card.href}
                className="group relative p-7 rounded-2xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] hover:border-[#1B635C]/50 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between space-y-4 shadow-2xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-xl bg-[#FAF7F3] border border-[#EBE4D8] flex items-center justify-center text-[#1B635C]">
                      <Icon className="size-5" />
                    </div>
                    <ArrowUpRight className="size-4 text-[#63606B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#1B635C] transition-all" />
                  </div>

                  <div>
                    <p className="font-editorial text-4xl sm:text-5xl font-bold text-[#111111] dark:text-foreground">
                      {card.value}
                    </p>
                    <p className="text-sm font-semibold text-[#111111] mt-1">
                      {card.label}
                    </p>
                  </div>

                  <p className="text-xs text-[#63606B] leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#ECEAE5] flex items-center text-xs font-semibold text-[#1B635C] group-hover:underline">
                  <span>Explore archive →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
