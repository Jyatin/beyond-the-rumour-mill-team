import { AlumniDiscovery } from "@/components/connect/alumni-discovery";
import { getAlumniProfiles } from "@/server/queries/alumni";

export const metadata = {
  title: "Find Placed Alumni — Beyond the Rumour Mill",
  description: "Search real interview experiences and connect with placed alumni from top hiring companies."
};

export const dynamic = "force-dynamic";

export default async function AlumniPage() {
  const alumniProfiles = await getAlumniProfiles();

  return (
    <main className="alumni-page min-h-screen bg-[var(--background)]">
      <AlumniDiscovery alumniProfiles={alumniProfiles} />
    </main>
  );
}
