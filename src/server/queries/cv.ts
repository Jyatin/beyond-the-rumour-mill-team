import "server-only";

import { db } from "../db";
import { alumniCvs } from "../db/schema";
import { getCurrentUser } from "../auth-helpers";
import { eq, inArray, and } from "drizzle-orm";

export async function getMyCv() {
  const user = await getCurrentUser();
  if (!user) return null;

  const results = await db
    .select({
      id: alumniCvs.id,
      fileName: alumniCvs.fileName,
      fileSize: alumniCvs.fileSize,
      mimeType: alumniCvs.mimeType,
      isShared: alumniCvs.isShared,
      uploadedAt: alumniCvs.uploadedAt,
      updatedAt: alumniCvs.updatedAt,
    })
    .from(alumniCvs)
    .where(eq(alumniCvs.userId, user.id))
    .limit(1);

  return results[0] || null;
}

export async function getAlumniCvAccess(targetUserId: string) {
  const viewer = await getCurrentUser();
  if (!viewer) {
    return { allowed: false, reason: "unauthenticated", cv: null };
  }

  const results = await db
    .select()
    .from(alumniCvs)
    .where(eq(alumniCvs.userId, targetUserId))
    .limit(1);

  const cv = results[0];
  if (!cv) {
    return { allowed: false, reason: "not_found", cv: null };
  }

  // Owner or Admin always has access
  if (viewer.id === targetUserId || viewer.role === "admin") {
    return { allowed: true, reason: "authorized", cv };
  }

  // Students/Others can only access if explicitly shared
  if (cv.isShared) {
    return { allowed: true, reason: "shared", cv };
  }

  return { allowed: false, reason: "private", cv: null };
}

export async function getSharedCvMap(userIds: string[]): Promise<Record<string, boolean>> {
  if (!userIds || userIds.length === 0) return {};

  const validIds = userIds.filter(Boolean);
  if (validIds.length === 0) return {};

  const sharedRecords = await db
    .select({
      userId: alumniCvs.userId,
    })
    .from(alumniCvs)
    .where(
      and(
        inArray(alumniCvs.userId, validIds),
        eq(alumniCvs.isShared, true)
      )
    );

  const map: Record<string, boolean> = {};
  for (const id of validIds) {
    map[id] = false;
  }
  for (const record of sharedRecords) {
    map[record.userId] = true;
  }
  return map;
}
