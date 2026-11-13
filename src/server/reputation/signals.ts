import "server-only";

import { db } from "../db";
import { user, alumniProfiles, experiences, evidence } from "../db/schema";
import { eq, and } from "drizzle-orm";

export interface UserReputationSignals {
  userId: string;
  role: string;
  hasVerifiedEmployment: boolean;
  publishedExperiencesCount: number;
  verifiedEvidenceCount: number;
  reputationScore: number; // [0, 100]
  trustTier: "Verified Practitioner" | "Verified Contributor" | "Active Contributor" | "Community Member";
  badges: string[];
}

/**
 * Deterministically computes user trust signals and reputation based on verified activity.
 */
export async function getUserReputationSignals(userId: string): Promise<UserReputationSignals | null> {
  const [targetUser] = await db
    .select({
      id: user.id,
      role: user.role,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!targetUser) return null;

  // 1. Check verified alumni/employment status
  const alumniRecords = await db
    .select({
      verifiedStatus: alumniProfiles.verifiedStatus,
    })
    .from(alumniProfiles)
    .where(eq(alumniProfiles.userId, userId));

  const hasVerifiedEmployment = alumniRecords.some(
    (a) => a.verifiedStatus === "verified" || a.verifiedStatus === "official"
  );

  // 2. Count published experiences
  const publishedExps = await db
    .select({ id: experiences.id })
    .from(experiences)
    .where(
      and(
        eq(experiences.authorId, userId),
        eq(experiences.status, "published")
      )
    );

  const publishedExperiencesCount = publishedExps.length;

  // 3. Count verified/accepted evidence items for user's experiences
  const userEvidence = await db
    .select({
      id: evidence.id,
      status: evidence.status,
    })
    .from(evidence)
    .innerJoin(experiences, eq(evidence.experienceId, experiences.id))
    .where(
      and(
        eq(experiences.authorId, userId),
        eq(evidence.status, "accepted")
      )
    );

  const verifiedEvidenceCount = userEvidence.length;

  // 4. Deterministic composite reputation calculation (0 to 100)
  let score = 10; // baseline community membership

  if (hasVerifiedEmployment) score += 40;
  score += Math.min(30, publishedExperiencesCount * 10);
  score += Math.min(20, verifiedEvidenceCount * 10);

  const reputationScore = Math.min(100, Math.max(0, score));

  // 5. Derive Trust Tier & Badges
  let trustTier: UserReputationSignals["trustTier"] = "Community Member";
  const badges: string[] = [];

  if (hasVerifiedEmployment) {
    badges.push("Verified Employment");
  }
  if (publishedExperiencesCount > 0) {
    badges.push("Interview Contributor");
  }
  if (verifiedEvidenceCount > 0) {
    badges.push("Evidence Verified");
  }

  if (reputationScore >= 80) {
    trustTier = "Verified Practitioner";
  } else if (reputationScore >= 50) {
    trustTier = "Verified Contributor";
  } else if (reputationScore >= 20) {
    trustTier = "Active Contributor";
  }

  return {
    userId,
    role: targetUser.role,
    hasVerifiedEmployment,
    publishedExperiencesCount,
    verifiedEvidenceCount,
    reputationScore,
    trustTier,
    badges,
  };
}
