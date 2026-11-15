import { describe, it, expect } from "vitest";
import { createProfileImpl, getProfileByUserId, updateProfileImpl } from "../src/server/queries/profiles";
import { db } from "../src/server/db";
import { user } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

describe("Profiles & Onboarding Tests", () => {
  it("creates and updates a profile, prevents admin escalation", async () => {
    const mockId = "test-user-" + Date.now();
    await db.insert(user).values({
      id: mockId,
      name: "Test User",
      email: `${mockId}@example.com`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: "student",
    });

    const mockUser = { id: mockId, role: "student" };

    // 1. Confirm no profile initially exists
    let profile = await getProfileByUserId(mockId);
    expect(profile).toBeNull();

    // 2. Complete onboarding
    await createProfileImpl(mockUser as unknown as Parameters<typeof createProfileImpl>[0], {
      displayName: "Jane Doe",
      headline: "CS Student",
      bio: "Love coding",
      college: "State University",
      gradYear: 2026,
      avatarUrl: null,
      openToMentoring: true,
      visibility: "public",
    }, "alumni");

    // Verify role updated
    const updatedUser = await db.select().from(user).where(eq(user.id, mockId)).limit(1);
    expect(updatedUser[0].role).toBe("alumni");
    mockUser.role = "alumni";

    // 3. Confirm profile inserted
    profile = await getProfileByUserId(mockId);
    expect(profile?.displayName).toBe("Jane Doe");

    // 4. Update the profile
    await updateProfileImpl(mockUser as unknown as Parameters<typeof updateProfileImpl>[0], {
      headline: "Senior Engineer",
    });

    profile = await getProfileByUserId(mockId);
    expect(profile?.headline).toBe("Senior Engineer");

    // 5. Attempt admin creation
    const hackerId = "hacker-" + Date.now();
    await db.insert(user).values({
      id: hackerId,
      name: "Hacker",
      email: `${hackerId}@example.com`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: "student",
    });
    
    await createProfileImpl({ id: hackerId, role: "student" } as unknown as Parameters<typeof createProfileImpl>[0], {
      displayName: "Hacker",
      headline: "Hack",
      bio: "Hack",
      college: "Hack",
      gradYear: 2026,
      avatarUrl: null,
      openToMentoring: true,
      visibility: "public",
    }, "admin" as unknown as "alumni");
    
    const hackerUser = await db.select().from(user).where(eq(user.id, hackerId)).limit(1);
    expect(hackerUser[0].role).not.toBe("admin"); // Prevented!
  });
});
