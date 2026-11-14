import "server-only";

import { db } from "../db";
import { normalizationReviews, user } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../auth-helpers";

export async function getPendingNormalizationReviews() {
  await requireAdmin();

  const reviews = await db
    .select({
      id: normalizationReviews.id,
      candidate: normalizationReviews.candidate,
      candidateType: normalizationReviews.candidateType,
      proposedEntityId: normalizationReviews.proposedEntityId,
      proposedEntityLabel: normalizationReviews.proposedEntityLabel,
      confidence: normalizationReviews.confidence,
      status: normalizationReviews.status,
      reason: normalizationReviews.reason,
      createdAt: normalizationReviews.createdAt,
    })
    .from(normalizationReviews)
    .where(eq(normalizationReviews.status, "pending"))
    .orderBy(desc(normalizationReviews.createdAt));

  return reviews;
}

export async function getAllNormalizationReviews(statusFilter?: string) {
  await requireAdmin();

  if (statusFilter) {
    return db
      .select({
        id: normalizationReviews.id,
        candidate: normalizationReviews.candidate,
        candidateType: normalizationReviews.candidateType,
        proposedEntityId: normalizationReviews.proposedEntityId,
        proposedEntityLabel: normalizationReviews.proposedEntityLabel,
        confidence: normalizationReviews.confidence,
        status: normalizationReviews.status,
        reviewedBy: normalizationReviews.reviewedBy,
        reviewerName: user.name,
        reviewedAt: normalizationReviews.reviewedAt,
        reason: normalizationReviews.reason,
        createdAt: normalizationReviews.createdAt,
      })
      .from(normalizationReviews)
      .leftJoin(user, eq(normalizationReviews.reviewedBy, user.id))
      .where(eq(normalizationReviews.status, statusFilter))
      .orderBy(desc(normalizationReviews.createdAt));
  }

  return db
    .select({
      id: normalizationReviews.id,
      candidate: normalizationReviews.candidate,
      candidateType: normalizationReviews.candidateType,
      proposedEntityId: normalizationReviews.proposedEntityId,
      proposedEntityLabel: normalizationReviews.proposedEntityLabel,
      confidence: normalizationReviews.confidence,
      status: normalizationReviews.status,
      reviewedBy: normalizationReviews.reviewedBy,
      reviewerName: user.name,
      reviewedAt: normalizationReviews.reviewedAt,
      reason: normalizationReviews.reason,
      createdAt: normalizationReviews.createdAt,
    })
    .from(normalizationReviews)
    .leftJoin(user, eq(normalizationReviews.reviewedBy, user.id))
    .orderBy(desc(normalizationReviews.createdAt));
}
