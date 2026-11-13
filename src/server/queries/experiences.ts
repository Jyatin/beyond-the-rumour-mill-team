import "server-only";

import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { experiences } from "../db/schema";
import { getCurrentUser } from "../auth-helpers";

export type ExperienceRecord = typeof experiences.$inferSelect;

/**
 * Ensures anonymous experiences never leak the author ID or student name to unauthorized public viewers.
 */
export function maskExperienceForViewer<T extends ExperienceRecord>(
  exp: T,
  viewer: { id: string; role?: string } | null
): T {
  if (!exp.isAnonymous) {
    return exp;
  }

  const isOwnerOrAdmin = viewer && (viewer.id === exp.authorId || viewer.role === "admin");
  if (isOwnerOrAdmin) {
    return exp;
  }

  return {
    ...exp,
    studentName: "Anonymous",
    authorId: null,
  };
}

export async function getPublishedExperiences() {
  try {
    const user = await getCurrentUser().catch(() => null);
    const rows = await db
      .select()
      .from(experiences)
      .where(eq(experiences.status, "published"))
      .orderBy(desc(experiences.createdAt));

    return rows.map((r) => maskExperienceForViewer(r, user));
  } catch (err) {
    console.error("Failed to fetch published experiences from DB:", err);
    return [];
  }
}

export async function getExperienceById(id: string) {
  if (!id || typeof id !== "string") return null;

  try {
    const result = await db
      .select()
      .from(experiences)
      .where(eq(experiences.id, id))
      .limit(1);
    const exp = result[0] || null;
    if (!exp) return null;

    const user = await getCurrentUser().catch(() => null);

    // If no user context or non-published, restrict to author or admin only
    if (exp.status !== "published") {
      if (!user) return null;
      if (exp.authorId !== user.id && user.role !== "admin") {
        return null;
      }
    }

    return maskExperienceForViewer(exp, user);
  } catch (err) {
    console.error(`Failed to fetch experience ${id} from DB:`, err);
    return null;
  }
}

export async function getRawExperienceById(id: string) {
  try {
    const result = await db
      .select()
      .from(experiences)
      .where(eq(experiences.id, id))
      .limit(1);
    return result[0] || null;
  } catch (err) {
    console.error(`Failed to fetch raw experience ${id} from DB:`, err);
    return null;
  }
}

export async function getExperiencesByCompanyId(companyId: string) {
  try {
    const user = await getCurrentUser().catch(() => null);
    const rows = await db
      .select()
      .from(experiences)
      .where(
        and(
          eq(experiences.companyId, companyId),
          eq(experiences.status, "published")
        )
      )
      .orderBy(desc(experiences.createdAt));

    return rows.map((r) => maskExperienceForViewer(r, user));
  } catch (err) {
    console.error(`Failed to fetch experiences for company ${companyId}:`, err);
    return [];
  }
}

export async function getExperiencesByAuthorId(authorId: string) {
  try {
    return await db
      .select()
      .from(experiences)
      .where(eq(experiences.authorId, authorId))
      .orderBy(desc(experiences.createdAt));
  } catch (err) {
    console.error(`Failed to fetch experiences for author ${authorId}:`, err);
    return [];
  }
}

export async function getMyExperiences() {
  const user = await getCurrentUser();
  if (!user) return [];
  return getExperiencesByAuthorId(user.id);
}
