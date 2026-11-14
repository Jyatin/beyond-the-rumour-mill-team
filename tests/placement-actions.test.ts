import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import {
  createPlacementDriveAction,
  updatePlacementDriveAction,
  deletePlacementDriveAction,
  applyToDriveAction,
  updateApplicationStatusAction,
} from "../src/server/actions/placement";
import { upsertMyProfileAction } from "../src/server/actions/profile";
import { getPlacementDriveWithDetails } from "../src/server/queries/placement";
import { db } from "../src/server/db";
import {
  user,
  companies,
  driveApplications,
  placementDrives,
  profiles,
} from "../src/server/db/schema";
import { eq } from "drizzle-orm";
import { requireUser, requireTpoOrAdmin } from "../src/server/auth-helpers";

vi.mock("../src/server/auth-helpers", () => ({
  requireUser: vi.fn(),
  requireTpoOrAdmin: vi.fn(),
  requireRole: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Placement Drive CRUD, Applications & Profile Integration", () => {
  const tpoUser = { id: "tpo_test_1", name: "TPO Coord", email: "tpo_test1@test.com", role: "tpo" };
  const studentUser = { id: "stu_test_1", name: "Student One", email: "stu_test1@test.com", role: "student" };
  const adminUser = { id: "adm_test_1", name: "Admin One", email: "adm_test1@test.com", role: "admin" };
  const companyId = "google";
  let sharedDriveId = "";
  let sharedRoleId = "";

  beforeAll(async () => {
    await Promise.all([
      db
        .insert(user)
        .values(
          [tpoUser, studentUser, adminUser].map((u) => ({
            ...u,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        )
        .onConflictDoNothing(),
      db
        .insert(companies)
        .values({
          id: companyId,
          name: "Google",
          domain: "google.com",
          industry: "Software / Search",
          roles: ["Software Engineer"],
          verificationStatus: "verified",
          lastVerifiedAt: new Date().toISOString(),
          topTopics: [{ topic: "Dynamic Programming", pct: 45 }],
        })
        .onConflictDoNothing(),
    ]);
  });

  afterAll(async () => {
    if (sharedDriveId) {
      await db.delete(placementDrives).where(eq(placementDrives.id, sharedDriveId)).catch(() => {});
    }
    await db.delete(profiles).where(eq(profiles.userId, adminUser.id)).catch(() => {});
  });

  it("blocks non-TPO/Admin users from creating placement drives", async () => {
    vi.mocked(requireTpoOrAdmin).mockRejectedValueOnce(
      new Error("Forbidden: requires TPO coordinator or Admin privileges")
    );
    await expect(
      createPlacementDriveAction({ companyId, season: "Blocked Drive" })
    ).rejects.toThrow("Forbidden");
  });

  it("creates an Open placement drive atomically with roles, eligibility, and prep resources", async () => {
    vi.mocked(requireTpoOrAdmin).mockResolvedValue(tpoUser as never);
    const created = await createPlacementDriveAction({
      companyId,
      season: "Campus Test Drive 2026",
      date: "Sep 2026",
      deadline: "Aug 31, 2026",
      location: "Bangalore",
      status: "Open",
      eligibleStudentInformation: "CSE/IT 2026",
      roles: [
        {
          title: "Cloud Engineer Test",
          ctc: "22 LPA",
          cgpa: "7.5+",
          branches: ["CSE", "IT"],
          requiredSkills: ["DSA", "Distributed Systems"],
          suggestedTopics: ["Graphs", "Load Balancing"],
          preparationResources: [
            { title: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer" },
          ],
        },
      ],
    });

    expect(created.success).toBe(true);
    sharedDriveId = created.driveId;

    const details = await getPlacementDriveWithDetails(sharedDriveId);
    expect(details?.season).toBe("Campus Test Drive 2026");
    expect(details?.roles.length).toBe(1);
    sharedRoleId = details?.roles[0]?.id || "";
    expect(sharedRoleId).toBeTruthy();
  });

  it("allows student application to Open drive and blocks duplicate applications", async () => {
    vi.mocked(requireUser).mockResolvedValue(studentUser as never);
    const applyRes = await applyToDriveAction({
      driveId: sharedDriveId,
      driveRoleId: sharedRoleId,
      notes: "Excited to apply",
    });
    expect(applyRes.success).toBe(true);

    const dupRes = await applyToDriveAction({ driveId: sharedDriveId });
    expect(dupRes.success).toBe(false);
  });

  it("updates drive and role in-place without losing existing candidate applications and updates applicant status", async () => {
    vi.mocked(requireTpoOrAdmin).mockResolvedValue(tpoUser as never);
    await updatePlacementDriveAction(sharedDriveId, {
      season: "Campus Test Drive 2026 Updated",
      status: "Ongoing",
      roles: [
        {
          id: sharedRoleId,
          title: "Cloud Engineer Test",
          ctc: "24 LPA",
          cgpa: "8.0+",
          branches: ["CSE", "IT", "ECE"],
          requiredSkills: ["DSA", "Kubernetes"],
          suggestedTopics: ["Trees"],
        },
      ],
    });

    const details = await getPlacementDriveWithDetails(sharedDriveId);
    expect(details?.season).toBe("Campus Test Drive 2026 Updated");
    expect(details?.status).toBe("Ongoing");
    expect(details?.roles[0]?.ctc).toBe("24 LPA");
    expect(details?.roles[0]?.eligibility?.cgpa).toBe("8.0+");

    const appsAfterEdit = await db
      .select()
      .from(driveApplications)
      .where(eq(driveApplications.driveId, sharedDriveId));
    expect(appsAfterEdit.length).toBe(1);
    expect(appsAfterEdit[0].driveRoleId).toBe(sharedRoleId);

    await updateApplicationStatusAction({
      applicationId: appsAfterEdit[0].id,
      status: "shortlisted",
      notes: "Cleared OA",
    });
    const [updatedApp] = await db
      .select()
      .from(driveApplications)
      .where(eq(driveApplications.id, appsAfterEdit[0].id));
    expect(updatedApp.status).toBe("shortlisted");
  });

  it("blocks applications to completed drives and deletes drive cleanly", async () => {
    vi.mocked(requireTpoOrAdmin).mockResolvedValue(tpoUser as never);
    vi.mocked(requireUser).mockResolvedValue(studentUser as never);

    await updatePlacementDriveAction(sharedDriveId, { status: "Completed" });
    await db.delete(driveApplications).where(eq(driveApplications.driveId, sharedDriveId));
    const closedRes = await applyToDriveAction({ driveId: sharedDriveId });
    expect(closedRes.success).toBe(false);

    const delRes = await deletePlacementDriveAction(sharedDriveId);
    expect(delRes.success).toBe(true);
    const deletedDetails = await getPlacementDriveWithDetails(sharedDriveId);
    expect(deletedDetails).toBeNull();
    sharedDriveId = "";
  });

  it("upserts profile without downgrading admin/tpo user roles", async () => {
    await db.delete(profiles).where(eq(profiles.userId, adminUser.id));
    vi.mocked(requireUser).mockResolvedValue(adminUser as never);

    const res = await upsertMyProfileAction({
      displayName: "Admin Lead",
      headline: "Placement Platform Admin",
      bio: "Managing verification & drives",
      college: "Central University",
      gradYear: 2025,
      openToMentoring: true,
      visibility: "public",
    });
    expect(res.success).toBe(true);
    expect(res.profile.displayName).toBe("Admin Lead");

    const [dbAdmin] = await db.select().from(user).where(eq(user.id, adminUser.id));
    expect(dbAdmin.role).toBe("admin");
  });
});
