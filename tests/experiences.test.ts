import { describe, it, expect, vi, beforeAll } from "vitest";
import {
  getPublishedExperiences,
  getExperienceById,
  getExperiencesByCompanyId,
  getExperiencesByAuthorId,
} from "../src/server/queries/experiences";
import { createExperienceAction, updateExperienceAction, submitExperienceAction } from "../src/server/actions/experiences";
import { db } from "../src/server/db";
import { user } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

const testUserId = "test_user_id";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("../src/server/auth-helpers", () => ({
  requireUser: vi.fn().mockImplementation(() => Promise.resolve({ id: testUserId, name: "Test User" })),
  getCurrentUser: vi.fn().mockImplementation(() => Promise.resolve({ id: testUserId, name: "Test User" })),
}));

describe("Experience Queries and Actions", () => {
  beforeAll(async () => {
    // Ensure test user exists in DB to satisfy foreign key constraint
    const existing = await db.select().from(user).where(eq(user.id, testUserId));
    if (existing.length === 0) {
      await db.insert(user).values({
        id: testUserId,
        name: "Test User",
        email: "testuser@example.com",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "student",
      });
    }
  });

  it("should fetch published experiences only", async () => {
    const experiences = await getPublishedExperiences();
    expect(experiences).toBeDefined();
    for (const exp of experiences) {
      expect(exp.status).toBe("published");
    }
  });

  it("should create a draft experience via action", async () => {
    const res = await createExperienceAction({
      companyId: "google",
      companyName: "Google",
      role: "Backend Engineer",
      year: 2024,
      type: "Full-time",
      rounds: 3,
      difficulty: "Medium",
      studentName: "Test",
      isAnonymous: false,
      summary: "Test summary",
      content: "Test content",
      outcome: "Offer",
      timeline: "Jan 2024",
      status: "draft",
    });
    expect(res.success).toBe(true);
    expect(res.id).toBeDefined();

    const exp = await getExperienceById(res.id);
    expect(exp).toBeDefined();
    expect(exp?.status).toBe("draft");
    expect(exp?.authorId).toBe("test_user_id");
  });

  it("should update an existing experience", async () => {
    const res = await createExperienceAction({
      companyId: "google",
      companyName: "Google",
      role: "Backend Engineer",
      year: 2024,
      type: "Full-time",
      rounds: 3,
      difficulty: "Medium",
      studentName: "Test",
      isAnonymous: false,
      summary: "Test summary",
      content: "Test content",
      outcome: "Offer",
      timeline: "Jan 2024",
      status: "draft",
    });

    const updateRes = await updateExperienceAction(res.id, {
      companyId: "google",
      companyName: "Google",
      role: "Backend Engineer",
      year: 2024,
      type: "Full-time",
      rounds: 3,
      difficulty: "Medium",
      studentName: "Test",
      isAnonymous: false,
      summary: "Updated summary",
      content: "Test content",
      outcome: "Offer",
      timeline: "Jan 2024",
      status: "draft",
    });
    
    expect(updateRes.success).toBe(true);
    const exp = await getExperienceById(res.id);
    expect(exp?.summary).toBe("Updated summary");
  });

  it("should publish an experience", async () => {
    const res = await createExperienceAction({
      companyId: "google",
      companyName: "Google",
      role: "Backend Engineer",
      year: 2024,
      type: "Full-time",
      rounds: 3,
      difficulty: "Medium",
      studentName: "Test",
      isAnonymous: false,
      summary: "Test summary",
      content: "Test content",
      outcome: "Offer",
      timeline: "Jan 2024",
      status: "draft",
    });

    const submitRes = await submitExperienceAction(res.id);
    expect(submitRes.success).toBe(true);

    const exp = await getExperienceById(res.id);
    expect(exp?.status).toBe("pending");
  });

  it("should fetch experiences by company id (published only)", async () => {
    const exps = await getExperiencesByCompanyId("google");
    expect(exps).toBeDefined();
    for (const exp of exps) {
      expect(exp.status).toBe("published");
      expect(exp.companyId).toBe("google");
    }
  });

  it("should fetch experiences by author id", async () => {
    const exps = await getExperiencesByAuthorId("test_user_id");
    expect(exps).toBeDefined();
    expect(exps.length).toBeGreaterThan(0);
    for (const exp of exps) {
      expect(exp.authorId).toBe("test_user_id");
    }
  });
});
