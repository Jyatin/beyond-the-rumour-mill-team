import "server-only";
import { db } from "../db";
import { profiles, user } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "../auth-helpers";

export async function getProfileByUserId(userId: string) {
  const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return result[0] || null;
}

export async function getProfileById(profileId: string) {
  const result = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
  return result[0] || null;
}

export async function createProfileImpl(currentUser: { id: string; role: string; [key: string]: unknown }, data: Omit<typeof profiles.$inferInsert, "id" | "userId" | "createdAt">, role: "student" | "alumni") {
  // Validate no profile exists
  const existing = await getProfileByUserId(currentUser.id);
  if (existing) {
    throw new Error("Profile already exists");
  }

  const [newProfile] = await db.insert(profiles).values({
    id: crypto.randomUUID(),
    userId: currentUser.id,
    ...data,
  }).returning();

  // Update user role if valid
  if (role === "student" || role === "alumni") {
    await db.update(user).set({ role }).where(eq(user.id, currentUser.id));
  }

  return newProfile;
}

export async function createProfile(data: Omit<typeof profiles.$inferInsert, "id" | "userId" | "createdAt">, role: "student" | "alumni") {
  const currentUser = await requireUser();
  return createProfileImpl(currentUser, data, role);
}

export async function updateProfileImpl(currentUser: { id: string; [key: string]: unknown }, data: Partial<Omit<typeof profiles.$inferInsert, "id" | "userId" | "createdAt">>) {
  const existing = await getProfileByUserId(currentUser.id);
  if (!existing) {
    throw new Error("Profile does not exist");
  }

  const [updated] = await db.update(profiles).set(data).where(eq(profiles.userId, currentUser.id)).returning();
  return updated;
}

export async function updateProfile(data: Partial<Omit<typeof profiles.$inferInsert, "id" | "userId" | "createdAt">>) {
  const currentUser = await requireUser();
  return updateProfileImpl(currentUser, data);
}

export async function upsertMyProfile(
  data: Omit<typeof profiles.$inferInsert, "id" | "userId" | "createdAt">
) {
  const currentUser = await requireUser();
  const existing = await getProfileByUserId(currentUser.id);
  if (existing) {
    const [updated] = await db
      .update(profiles)
      .set(data)
      .where(eq(profiles.userId, currentUser.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(profiles)
    .values({
      id: crypto.randomUUID(),
      userId: currentUser.id,
      ...data,
    })
    .returning();
  return created;
}
