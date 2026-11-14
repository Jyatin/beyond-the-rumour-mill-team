"use server";

import { z } from "zod";
import { db } from "../db";
import { normalizationReviews, topicAliases, topics } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin, requireUser } from "../auth-helpers";
import { normalizeLabel } from "../normalization/normalizer";
import { revalidatePath } from "next/cache";

const createReviewSchema = z.object({
  candidate: z.string().min(1, "Candidate is required"),
  candidateType: z.enum(["topic", "question"]),
  proposedEntityId: z.string().optional(),
  proposedEntityLabel: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  reason: z.string().optional(),
});

export async function createNormalizationReviewItemAction(params: z.infer<typeof createReviewSchema>) {
  const parsed = createReviewSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid input");
  }

  await requireUser();

  const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const [created] = await db
    .insert(normalizationReviews)
    .values({
      id,
      candidate: parsed.data.candidate,
      candidateType: parsed.data.candidateType,
      proposedEntityId: parsed.data.proposedEntityId || null,
      proposedEntityLabel: parsed.data.proposedEntityLabel || null,
      confidence: parsed.data.confidence || null,
      status: "pending",
      reason: parsed.data.reason || null,
      createdAt: new Date(),
    })
    .returning();

  return created;
}

const approveReviewSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  canonicalTopicId: z.string().optional(),
  aliasName: z.string().optional(),
});

export async function approveNormalizationReviewAction(params: z.infer<typeof approveReviewSchema>) {
  const parsed = approveReviewSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid input");
  }

  const admin = await requireAdmin();

  const [review] = await db
    .select()
    .from(normalizationReviews)
    .where(eq(normalizationReviews.id, parsed.data.reviewId))
    .limit(1);

  if (!review) {
    throw new Error("Review item not found");
  }

  const targetTopicId = parsed.data.canonicalTopicId || review.proposedEntityId;

  // If topic review and target topic exists, create alias
  if (review.candidateType === "topic" && targetTopicId) {
    const aliasAlias = parsed.data.aliasName || review.candidate;
    const normalizedAlias = normalizeLabel(aliasAlias);

    const [existingTopic] = await db
      .select()
      .from(topics)
      .where(eq(topics.id, targetTopicId))
      .limit(1);

    if (existingTopic) {
      await db
        .insert(topicAliases)
        .values({
          id: `alias_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          topicId: targetTopicId,
          alias: aliasAlias,
          normalizedAlias,
          createdAt: new Date(),
        })
        .onConflictDoNothing();
    }
  }

  await db
    .update(normalizationReviews)
    .set({
      status: "approved",
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    })
    .where(eq(normalizationReviews.id, review.id));

  revalidatePath("/admin/moderation");

  return { success: true, reviewId: review.id, status: "approved" };
}

const rejectReviewSchema = z.object({
  reviewId: z.string().min(1, "Review ID is required"),
  reason: z.string().optional(),
});

export async function rejectNormalizationReviewAction(params: z.infer<typeof rejectReviewSchema>) {
  const parsed = rejectReviewSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid input");
  }

  const admin = await requireAdmin();

  const [review] = await db
    .select()
    .from(normalizationReviews)
    .where(eq(normalizationReviews.id, parsed.data.reviewId))
    .limit(1);

  if (!review) {
    throw new Error("Review item not found");
  }

  await db
    .update(normalizationReviews)
    .set({
      status: "rejected",
      reviewedBy: admin.id,
      reviewedAt: new Date(),
      reason: parsed.data.reason || review.reason,
    })
    .where(eq(normalizationReviews.id, review.id));

  revalidatePath("/admin/moderation");

  return { success: true, reviewId: review.id, status: "rejected" };
}
