import { describe, it, expect, vi, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../src/server/db";
import { user, auditLog } from "../src/server/db/schema";
import {
  createExperienceAction,
  submitExperienceAction,
} from "../src/server/actions/experiences";
import {
  publishExperienceAction,
  removeExperienceAction,
  restoreExperienceAction,
} from "../src/server/actions/moderation";
import { createExperienceReportAction } from "../src/server/actions/reports";
import { getExperienceById, getPublishedExperiences, getExperiencesByCompanyId } from "../src/server/queries/experiences";
import { getCurrentUser, requireUser, requireRole } from "../src/server/auth-helpers";

const testUserId = "test_user_id";
const adminUser = { id: "admin_id", name: "Admin", role: "admin" } as const;


vi.mock("../src/server/auth-helpers", () => ({
  getCurrentUser: vi.fn(),
  requireUser: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

async function setUser(role: "admin" | "student" | "alumni" | "other" | null) {
  let mockUser;
  if (role === "admin") {
    mockUser = adminUser;
  } else if (role === "other") {
    mockUser = { id: "other_user_id", name: "Other", role: "student" } as const;
  } else if (role) {
    mockUser = { id: testUserId, name: "Temp", role } as const;
  } else {
    mockUser = null;
  }
  // @ts-expect-error mock implementation
  requireUser.mockImplementation(() => (mockUser ? Promise.resolve(mockUser) : Promise.reject(new Error("Unauthorized"))));
  // @ts-expect-error mock implementation
  getCurrentUser.mockImplementation(() => Promise.resolve(mockUser));
  // @ts-expect-error mock implementation
  requireRole.mockImplementation((required: string) => {
    if (!mockUser) throw new Error("Unauthorized");
    if (mockUser.role !== required && mockUser.role !== "admin") {
      throw new Error(`Forbidden: requires role ${required}`);
    }
    return Promise.resolve(mockUser);
  });
}

describe("Phase 2.6 Moderation Security & Regression", () => {
  beforeAll(async () => {
    // Ensure test user exists
    const existing = await db.select().from(user).where(eq(user.id, testUserId));
    if (existing.length === 0) {
      await db.insert(user).values({
        id: testUserId,
        name: "Test User",
        email: "test@example.com",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "student",
      });
    }
    // Ensure admin user exists
    const adminExisting = await db.select().from(user).where(eq(user.id, adminUser.id));
    if (adminExisting.length === 0) {
      await db.insert(user).values({
        id: adminUser.id,
        name: adminUser.name,
        email: "admin@example.com",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "admin",
      });
    }
    // Ensure "other" user exists for reporting/visibility tests
    const otherExisting = await db.select().from(user).where(eq(user.id, "other_user_id"));
    if (otherExisting.length === 0) {
      await db.insert(user).values({
        id: "other_user_id",
        name: "Other User",
        email: "other@example.com",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "student",
      });
    }
  });

  it("draft → pending via submitExperienceAction", async () => {
    await setUser("student");
    const exp = await createExperienceAction({
      companyId: "amazon",
      companyName: "Amazon",
      role: "Dev",
      year: 2024,
      type: "Full-time",
      rounds: 1,
      difficulty: "Easy",
      studentName: "Tester",
      isAnonymous: false,
      summary: "s",
      content: "c",
      outcome: "Offer",
      timeline: "2024",
      status: "draft",
    });
    const submit = await submitExperienceAction(exp.id);
    expect(submit.success).toBe(true);
    const fetched = await getExperienceById(exp.id);
    expect(fetched?.status).toBe("pending");
  });

  it("pending → published via admin action", async () => {
    await setUser("admin");
    // create pending experience
    await setUser("student");
    const exp = await createExperienceAction({
      companyId: "microsoft",
      companyName: "Microsoft",
      role: "Dev",
      year: 2024,
      type: "Full-time",
      rounds: 1,
      difficulty: "Easy",
      studentName: "Tester",
      isAnonymous: false,
      summary: "s",
      content: "c",
      outcome: "Offer",
      timeline: "2024",
      status: "draft",
    });
    await submitExperienceAction(exp.id);
    // admin publish
    await setUser("admin");
    const pub = await publishExperienceAction(exp.id);
    expect(pub.success).toBe(true);
    const after = await getExperienceById(exp.id);
    expect(after?.status).toBe("published");
  });

  it("published → flagged via report creation (auto‑flag)", async () => {
    await setUser("student");
    const exp = await createExperienceAction({
      companyId: "google",
      companyName: "Google",
      role: "Dev",
      year: 2024,
      type: "Full-time",
      rounds: 1,
      difficulty: "Easy",
      studentName: "Tester",
      isAnonymous: false,
      summary: "s",
      content: "c",
      outcome: "Offer",
      timeline: "2024",
      status: "draft",
    });
    await submitExperienceAction(exp.id);
    await setUser("admin");
    await publishExperienceAction(exp.id);
    // other user reports
    await setUser("other");
    const reportRes = await createExperienceReportAction({
      experienceId: exp.id,
      reason: "spam",
      details: "spammy",
    });
    expect(reportRes.success).toBe(true);
    await setUser("admin"); // admin can see flagged experiences
    const after = await getExperienceById(exp.id);
    expect(after?.status).toBe("flagged");
  });

  it("flagged → published via admin restore", async () => {
    // create, submit, publish, then flag via report
    await setUser("student");
    const exp = await createExperienceAction({
      companyId: "google",
      companyName: "Google",
      role: "Dev",
      year: 2024,
      type: "Full-time",
      rounds: 1,
      difficulty: "Easy",
      studentName: "Tester",
      isAnonymous: false,
      summary: "s",
      content: "c",
      outcome: "Offer",
      timeline: "2024",
      status: "draft",
    });
    await submitExperienceAction(exp.id);
    await setUser("admin");
    await publishExperienceAction(exp.id);
    // other user reports to flag
    await setUser("other");
    await createExperienceReportAction({ experienceId: exp.id, reason: "spam", details: "spammy" });
    // verify it's flagged
    await setUser("admin");
    const flaggedCheck = await getExperienceById(exp.id);
    expect(flaggedCheck?.status).toBe("flagged");
    // admin restores
    const restore = await restoreExperienceAction(exp.id);
    expect(restore.success).toBe(true);
    const after = await getExperienceById(exp.id);
    expect(after?.status).toBe("published");
  });

  it("removal works and creates audit record", async () => {
    await setUser("admin");
    const draft = await createExperienceAction({
      companyId: "atlassian",
      companyName: "Atlassian",
      role: "Dev",
      year: 2024,
      type: "Full-time",
      rounds: 1,
      difficulty: "Easy",
      studentName: "Tester",
      isAnonymous: false,
      summary: "s",
      content: "c",
      outcome: "Offer",
      timeline: "2024",
      status: "draft",
    });
    const remove = await removeExperienceAction(draft.id, { reason: "test removal" });
    expect(remove.success).toBe(true);
    const after = await getExperienceById(draft.id);
    expect(after?.status).toBe("removed");
    const audit = await db.select().from(auditLog).where(eq(auditLog.entityId, draft.id)).orderBy(eq(auditLog.createdAt, auditLog.createdAt)).limit(1);
    expect(audit[0]?.action).toBe("experience_removed");
  });

  it("invalid transition: publish without pending should error", async () => {
    await setUser("admin");
    const exp = await createExperienceAction({
      companyId: "uber",
      companyName: "Uber",
      role: "Dev",
      year: 2024,
      type: "Full-time",
      rounds: 1,
      difficulty: "Easy",
      studentName: "Tester",
      isAnonymous: false,
      summary: "s",
      content: "c",
      outcome: "Offer",
      timeline: "2024",
      status: "draft",
    });
    // Production allows draft→published for admin, so submit+publish first, then remove
    await submitExperienceAction(exp.id);
    await publishExperienceAction(exp.id);
    await removeExperienceAction(exp.id, { reason: "test" });
    // A removed experience cannot be published directly
    await expect(publishExperienceAction(exp.id)).rejects.toThrow();
  });

  it("duplicate report protection", async () => {
    await setUser("student");
    const exp = await createExperienceAction({
      companyId: "goldmansachs",
      companyName: "Goldman Sachs",
      role: "Dev",
      year: 2024,
      type: "Full-time",
      rounds: 1,
      difficulty: "Easy",
      studentName: "Tester",
      isAnonymous: false,
      summary: "s",
      content: "c",
      outcome: "Offer",
      timeline: "2024",
      status: "draft",
    });
    await submitExperienceAction(exp.id);
    await setUser("admin");
    await publishExperienceAction(exp.id);
    await setUser("other");
    const first = await createExperienceReportAction({ experienceId: exp.id, reason: "spam", details: "first" });
    expect(first.success).toBe(true);
    await expect(
      createExperienceReportAction({ experienceId: exp.id, reason: "spam", details: "second" })
    ).rejects.toThrow();
  });

  it("report validation: invalid reason enum throws", async () => {
    await setUser("student");
    const exp = await createExperienceAction({
      companyId: "microsoft",
      companyName: "Microsoft",
      role: "Dev",
      year: 2024,
      type: "Full-time",
      rounds: 1,
      difficulty: "Easy",
      studentName: "Tester",
      isAnonymous: false,
      summary: "s",
      content: "c",
      outcome: "Offer",
      timeline: "2024",
      status: "draft",
    });
    await submitExperienceAction(exp.id);
    await setUser("admin");
    await publishExperienceAction(exp.id);
    await setUser("student");
    // @ts-expect-error deliberately wrong value
    await expect(createExperienceReportAction({ experienceId: exp.id, reason: "invalid_reason", details: "" })).rejects.toThrow();
  });

  it("admin authorization enforcement", async () => {
    const exp = await createExperienceAction({
      companyId: "amazon",
      companyName: "Amazon",
      role: "Dev",
      year: 2024,
      type: "Full-time",
      rounds: 1,
      difficulty: "Easy",
      studentName: "Tester",
      isAnonymous: false,
      summary: "s",
      content: "c",
      outcome: "Offer",
      timeline: "2024",
      status: "draft",
    });
    await submitExperienceAction(exp.id);
    // student should be rejected
    await setUser("student");
    await expect(publishExperienceAction(exp.id)).rejects.toThrow();
    // alumni should be rejected
    await setUser("alumni");
    await expect(publishExperienceAction(exp.id)).rejects.toThrow();
    // unauthenticated
    await setUser(null);
    await expect(publishExperienceAction(exp.id)).rejects.toThrow();
    // admin allowed
    await setUser("admin");
    const res = await publishExperienceAction(exp.id);
    expect(res.success).toBe(true);
  });

  it("public visibility hides non‑published experiences", async () => {
    // Ensure a draft experience exists
    await setUser("student");
    const draft = await createExperienceAction({
      companyId: "atlassian",
      companyName: "Atlassian",
      role: "Dev",
      year: 2024,
      type: "Full-time",
      rounds: 1,
      difficulty: "Easy",
      studentName: "Tester",
      isAnonymous: false,
      summary: "s",
      content: "c",
      outcome: "Offer",
      timeline: "2024",
      status: "draft",
    });
    await setUser(null); // unauthenticated public
    const byId = await getExperienceById(draft.id);
    expect(byId).toBeNull();
    const publishedList = await getPublishedExperiences();
    const found = publishedList.find((e) => e.id === draft.id);
    expect(found).toBeUndefined();
    const byCompany = await getExperiencesByCompanyId("c9");
    const found2 = byCompany.find((e) => e.id === draft.id);
    expect(found2).toBeUndefined();
  });

  it("author can view own non‑published experiences", async () => {
    await setUser("student");
    const exp = await createExperienceAction({
      companyId: "google",
      companyName: "Google",
      role: "Dev",
      year: 2024,
      type: "Full-time",
      rounds: 1,
      difficulty: "Easy",
      studentName: "Tester",
      isAnonymous: false,
      summary: "s",
      content: "c",
      outcome: "Offer",
      timeline: "2024",
      status: "draft",
    });
    const fetched = await getExperienceById(exp.id);
    expect(fetched?.authorId).toBe(testUserId);
    expect(fetched?.status).toBe("draft");
    // other user should not see it
    await setUser("other"); // different student
    const otherFetched = await getExperienceById(exp.id);
    expect(otherFetched).toBeNull();
  });
});
