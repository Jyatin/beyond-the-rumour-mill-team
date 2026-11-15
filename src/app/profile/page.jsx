import { getCurrentUser } from "@/server/auth-helpers";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { alumniProfiles } from "@/server/db/schema";
import { redirect } from "next/navigation";
import { VerificationClient } from "@/components/profile/verification-client";
import { ProfileSettingsClient } from "@/components/profile/profile-settings-client";
import { MentorshipManagementClient } from "@/components/profile/mentorship-client";
import { GiveToGetBanner } from "@/components/profile/give-to-get-banner";
import { PreparationChecklist } from "@/components/profile/preparation-checklist";
import { CvManagementClient } from "@/components/profile/cv-management-client";
import { getMyCv } from "@/server/queries/cv";
import { getProfileByUserId } from "@/server/queries/profiles";
import { getEvidenceForEmployment } from "@/server/queries/verification";
import { 
  getMyMentorshipRequests, 
  getMentorshipRequestsForMentor, 
  getMySlots, 
  getMyBookings, 
  getBookingsForMentor 
} from "@/server/queries/mentorship";
import { getMyContributionStatus } from "@/server/queries/contribution";
import { getPreparationItems } from "@/server/queries/preparation";
import { getMyDriveApplications } from "@/server/queries/placement";
import { EditorialPageHeader } from "@/components/ui/editorial-page-header";
import { AlumniIllustration } from "@/components/ui/editorial-illustrations";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your Profile — Beyond the Rumour Mill",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let alumniProfile = null;
  let initialEvidence = [];
  let userProfile = null;
  let contributionData = { status: "not_contributed", hasContributed: false, submittedCount: 0 };

  try {
    const [profileRes, alumniRows, contrib] = await Promise.all([
      getProfileByUserId(user.id),
      db
        .select()
        .from(alumniProfiles)
        .where(eq(alumniProfiles.userId, user.id))
        .limit(1),
      getMyContributionStatus(),
    ]);

    userProfile = profileRes;
    alumniProfile = alumniRows[0] || null;
    contributionData = contrib;

    if (alumniProfile) {
      initialEvidence = await getEvidenceForEmployment(alumniProfile.id);
    }
  } catch (err) {
    console.error("Failed to load core profile data:", err);
  }

  // Load student preparation items
  let prepItems = [];
  if (user.role === "student" || user.role === "admin") {
    try {
      prepItems = await getPreparationItems();
    } catch {
      // Ignored
    }
  }

  // Load mentorship & mock interview data based on role
  let myRequests = [];
  let mentorRequests = [];
  let mySlots = [];
  let myBookings = [];
  let mentorBookings = [];
  let myCv = null;
  let myApplications = [];

  try {
    if (user.role === "student" || user.role === "admin") {
      myApplications = await getMyDriveApplications(user.id);
    }
    if (user.role === "student") {
      myRequests = await getMyMentorshipRequests();
      myBookings = await getMyBookings();
    } else if (user.role === "alumni" || user.role === "admin") {
      mentorRequests = await getMentorshipRequestsForMentor();
      mySlots = await getMySlots();
      mentorBookings = await getBookingsForMentor();
      myCv = await getMyCv();
    }
  } catch (err) {
    console.error("Failed to load profile records:", err);
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Editorial Header */}
      <EditorialPageHeader
        eyebrow="STUDENT &amp; ALUMNI PROFILE"
        title="Your Profile &amp; Career Hub"
        subtitle="Manage your placement preparation roadmap, community contributions, mock interviews, and verified campus credentials."
        illustration={<AlumniIllustration />}
        badges={[
          `Role: ${user.role.toUpperCase()}`,
          user.email,
          contributionData.hasContributed ? "✓ Contributor Unlocked" : "Give-to-Get Active",
        ]}
      />

      <div className="mx-auto max-w-[1000px] py-10 px-4 sm:px-6 md:px-8 space-y-10">
        {/* Give-to-Get Community Access Status */}
        <section>
          <GiveToGetBanner 
            contributionStatus={contributionData.status} 
            submittedCount={contributionData.submittedCount} 
          />
        </section>

        {/* Student Preparation Roadmap & Tasks */}
        {(user.role === "student" || user.role === "admin") && (
          <section className="space-y-4 p-6 rounded-2xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#ECEAE5] pb-4">
              <div>
                <h2 className="font-editorial text-2xl font-bold text-[#111111] dark:text-foreground">
                  Interview Preparation
                </h2>
                <p className="text-xs text-[#63606B] mt-0.5">
                  Your personalized checklist and skill gap tracker.
                </p>
              </div>
              <Link href="/prepare" className="text-xs text-[#1B635C] hover:underline font-semibold flex items-center gap-1">
                <span>Full Hub</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>
            <PreparationChecklist initialItems={prepItems} />
          </section>
        )}

        {/* Campus Drive Applications */}
        {(user.role === "student" || user.role === "admin") && myApplications.length > 0 && (
          <section className="space-y-4 p-6 rounded-2xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] shadow-2xs">
            <h2 className="font-editorial text-2xl font-bold text-[#111111] dark:text-foreground">
              Your Drive Registrations ({myApplications.length})
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {myApplications.map(({ application: app, drive, company }) => (
                <div key={app.id} className="p-4 rounded-xl border border-[#ECEAE5] bg-[#FAF9F6] flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#111111] font-editorial">{company.name}</span>
                      <span className="text-xs text-[#63606B]">· {drive.season}</span>
                    </div>
                    <p className="text-xs text-[#63606B] mt-0.5">
                      Applied on {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono font-semibold uppercase px-2.5 py-0.5 rounded-full border bg-[#1B635C]/10 text-[#1B635C] border-[#1B635C]/20">
                      {app.status}
                    </span>
                    <Link href={`/companies/${company.id}`} className="text-xs font-semibold text-[#1B635C] hover:underline">
                      Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Account & Academic Profile Details */}
        <section className="space-y-4 p-6 rounded-2xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] shadow-2xs">
          <h2 className="font-editorial text-2xl font-bold text-[#111111] dark:text-foreground">
            Account &amp; Academic Profile
          </h2>
          <ProfileSettingsClient user={user} initialProfile={userProfile} />
        </section>

        {/* Alumni Resume & CV Management */}
        {(user.role === "alumni" || user.role === "admin") && (
          <section className="space-y-4 p-6 rounded-2xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] shadow-2xs">
            <CvManagementClient initialCv={myCv} />
          </section>
        )}

        {/* Mentorship & Mock Interviews Hub */}
        <section className="space-y-4 p-6 rounded-2xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] shadow-2xs">
          <h2 className="font-editorial text-2xl font-bold text-[#111111] dark:text-foreground">
            Mentorship &amp; Mock Interviews
          </h2>
          <MentorshipManagementClient
            role={user.role}
            myRequests={myRequests}
            mentorRequests={mentorRequests}
            mySlots={mySlots}
            myBookings={myBookings}
            mentorBookings={mentorBookings}
          />
        </section>

        {(user.role === "alumni" || user.role === "admin") && alumniProfile && (
          <section className="space-y-4 p-6 rounded-2xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] shadow-2xs">
            <h2 className="font-editorial text-2xl font-bold text-[#111111] dark:text-foreground">
              Employment Verification
            </h2>
            <VerificationClient profile={alumniProfile} initialEvidence={initialEvidence} />
          </section>
        )}
        
        {user.role === 'alumni' && !alumniProfile && (
          <section className="space-y-4 p-6 rounded-2xl border border-[#ECEAE5] bg-[#FFFFFF] dark:bg-[var(--surface)] shadow-2xs">
            <h2 className="font-editorial text-2xl font-bold text-[#111111] dark:text-foreground">
              Employment Verification
            </h2>
            <div className="bg-[#FAF7F3] border border-[#EBE4D8] rounded-xl p-6 text-center">
              <p className="text-sm text-[#4A4752]">You don&apos;t have an active alumni profile set up yet. Once your profile is created, you can verify your employment here.</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
