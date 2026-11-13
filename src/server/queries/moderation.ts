import "server-only";

import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { experiences, reports, auditLog, evidence, alumniProfiles, user } from "../db/schema";
import { requireRole } from "../auth-helpers";

export async function getPendingExperiences() {
  await requireRole("admin");
  try {
    return await db
      .select()
      .from(experiences)
      .where(eq(experiences.status, "pending"))
      .orderBy(desc(experiences.updatedAt));
  } catch (err) {
    console.error("Failed to fetch pending experiences:", err);
    return [];
  }
}

export async function getFlaggedExperiences() {
  await requireRole("admin");
  try {
    return await db
      .select()
      .from(experiences)
      .where(eq(experiences.status, "flagged"))
      .orderBy(desc(experiences.updatedAt));
  } catch (err) {
    console.error("Failed to fetch flagged experiences:", err);
    return [];
  }
}

export async function getOpenReports() {
  await requireRole("admin");
  try {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.status, "open"))
      .orderBy(desc(reports.createdAt));
  } catch (err) {
    console.error("Failed to fetch open reports:", err);
    return [];
  }
}

export async function getPendingEvidenceSubmissions() {
  await requireRole("admin");
  try {
    const rows = await db
      .select({
        evidence: evidence,
        employment: alumniProfiles,
        experience: experiences,
        applicant: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(evidence)
      .leftJoin(alumniProfiles, eq(evidence.employmentId, alumniProfiles.id))
      .leftJoin(experiences, eq(evidence.experienceId, experiences.id))
      .leftJoin(user, eq(alumniProfiles.userId, user.id))
      .where(eq(evidence.status, "pending"))
      .orderBy(desc(evidence.createdAt));

    return rows;
  } catch (err) {
    console.error("Failed to fetch pending evidence submissions:", err);
    return [];
  }
}

export async function getExperienceModerationHistory(experienceId: string) {
  await requireRole("admin");
  try {
    return await db
      .select()
      .from(auditLog)
      .where(
        and(
          eq(auditLog.entityType, "experience"),
          eq(auditLog.entityId, experienceId)
        )
      )
      .orderBy(desc(auditLog.createdAt));
  } catch (err) {
    console.error("Failed to fetch moderation history:", err);
    return [];
  }
}
