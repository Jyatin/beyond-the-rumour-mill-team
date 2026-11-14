import "server-only";

import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { alumniProfiles, evidence, experiences } from "../db/schema";
import { requireUser } from "../auth-helpers";

export async function getEmploymentVerificationStatus(employmentId: string) {
  const employment = await db.select().from(alumniProfiles).where(eq(alumniProfiles.id, employmentId)).limit(1);
  if (!employment[0]) return null;
  return employment[0].verifiedStatus;
}

export async function getEvidenceForEmployment(employmentId: string) {
  const user = await requireUser();
  const employment = await db.select().from(alumniProfiles).where(eq(alumniProfiles.id, employmentId)).limit(1);
  if (!employment[0] || employment[0].userId !== user.id) return [];

  const ev = await db.select({
    id: evidence.id,
    kind: evidence.kind,
    status: evidence.status,
    fileName: evidence.fileName,
    mimeType: evidence.mimeType,
    referenceUrl: evidence.referenceUrl,
    notes: evidence.notes,
    reviewNotes: evidence.reviewNotes,
    createdAt: evidence.createdAt,
  }).from(evidence).where(eq(evidence.employmentId, employmentId));

  return ev;
}

export async function getEvidenceForExperience(experienceId: string) {
  const user = await requireUser();
  const exp = await db.select().from(experiences).where(eq(experiences.id, experienceId)).limit(1);
  if (!exp[0] || (exp[0].authorId !== user.id && user.role !== "admin")) return [];

  const ev = await db.select({
    id: evidence.id,
    kind: evidence.kind,
    status: evidence.status,
    createdAt: evidence.createdAt,
  }).from(evidence).where(eq(evidence.experienceId, experienceId));

  return ev;
}

export async function isEmploymentVerified(employmentId: string) {
  const status = await getEmploymentVerificationStatus(employmentId);
  return status === "verified" || status === "official";
}

export async function isAuthorVerifiedAtCompany(authorId: string, companyId: string) {
  const employment = await db.select()
    .from(alumniProfiles)
    .where(and(
      eq(alumniProfiles.userId, authorId),
      eq(alumniProfiles.companyId, companyId)
    ))
    .limit(1);
    
  if (!employment[0]) return false;
  return employment[0].verifiedStatus === "verified" || employment[0].verifiedStatus === "official";
}
