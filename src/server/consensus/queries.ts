import "server-only";

import { db } from "../db";
import { consensusSnapshots, consensusItems } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getLatestConsensusForCompany(
  companyId: string,
  roleTitleId?: string
) {
  const whereClauses = [eq(consensusSnapshots.companyId, companyId)];
  if (roleTitleId) {
    whereClauses.push(eq(consensusSnapshots.roleTitleId, roleTitleId));
  }

  const [snapshot] = await db
    .select()
    .from(consensusSnapshots)
    .where(and(...whereClauses))
    .orderBy(desc(consensusSnapshots.createdAt))
    .limit(1);

  if (!snapshot) {
    return null;
  }

  const items = await db
    .select()
    .from(consensusItems)
    .where(eq(consensusItems.snapshotId, snapshot.id))
    .orderBy(desc(consensusItems.weightedPrevalence));

  return {
    snapshot,
    items,
    publishedTopics: items.filter(
      (it) => it.entityType === "topic" && it.status === "published"
    ),
    publishedQuestions: items.filter(
      (it) => it.entityType === "question" && it.status === "published"
    ),
    insufficientEvidenceItems: items.filter(
      (it) => it.status === "insufficient_evidence"
    ),
  };
}

export async function getConsensusSnapshotById(snapshotId: string) {
  const [snapshot] = await db
    .select()
    .from(consensusSnapshots)
    .where(eq(consensusSnapshots.id, snapshotId))
    .limit(1);

  if (!snapshot) return null;

  const items = await db
    .select()
    .from(consensusItems)
    .where(eq(consensusItems.snapshotId, snapshot.id))
    .orderBy(desc(consensusItems.weightedPrevalence));

  return { snapshot, items };
}
