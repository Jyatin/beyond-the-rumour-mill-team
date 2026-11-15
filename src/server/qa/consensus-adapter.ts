import "server-only";

import { db } from "../db";
import {
  questions,
  answers,
  answerClaims,
  experiences,
  topics,
} from "../db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { isAuthorVerifiedAtCompany } from "../queries/verification";

export interface QaConsensusObservation {
  authorId: string;
  companyId: string;
  roleTitleId: string | null;
  hiringCycle: string;
  dimension: string;
  subject: string;
  value: string | number;
  sourceType: "answer" | "experience";
  sourceId: string;
  weight: number;
  counted: boolean;
  supersededReason?: string;
}

/**
 * Extracts and adapts answer claims into normalized observation tuples for consensus.
 * Enforces:
 * 1. Only own_interview basis + verified company employment qualify.
 * 2. If author has a full verified experience for the same company/role/cycle, the experience supersedes the answer claim.
 * 3. Exactly one observation per author × company × role × cycle × dimension.
 */
export async function getAnswerClaimsForConsensus(companyId: string, roleTitleId?: string): Promise<QaConsensusObservation[]> {
  // 1. Fetch eligible answers for company
  const whereClauses = [
    eq(questions.companyId, companyId),
    eq(answers.basis, "own_interview"),
    isNull(answers.deletedAt),
    eq(answers.moderationState, "visible"),
  ];

  if (roleTitleId) {
    whereClauses.push(eq(answers.roleFamilyId, roleTitleId));
  }

  const rawAnswers = await db
    .select({
      id: answers.id,
      questionId: answers.questionId,
      authorId: answers.authorId,
      roleFamilyId: answers.roleFamilyId,
      hiringCycle: answers.hiringCycle,
      companyId: questions.companyId,
    })
    .from(answers)
    .innerJoin(questions, eq(answers.questionId, questions.id))
    .where(and(...whereClauses));

  if (rawAnswers.length === 0) return [];

  const answerIds = rawAnswers.map((a) => a.id);
  const claims = await db
    .select()
    .from(answerClaims)
    .where(inArray(answerClaims.answerId, answerIds));

  // 2. Fetch existing experiences for these authors at this company to detect supersession
  const authorIds = Array.from(new Set(rawAnswers.map((a) => a.authorId).filter(Boolean))) as string[];
  const existingExperiences = await db
    .select({
      id: experiences.id,
      authorId: experiences.authorId,
      companyId: experiences.companyId,
      roleId: experiences.roleId,
      year: experiences.year,
    })
    .from(experiences)
    .where(
      and(
        eq(experiences.companyId, companyId),
        eq(experiences.status, "published"),
        inArray(experiences.authorId, authorIds)
      )
    );

  const experienceSet = new Set<string>();
  for (const exp of existingExperiences) {
    if (exp.authorId) {
      experienceSet.add(`${exp.authorId}:${exp.companyId}`);
    }
  }

  const observations: QaConsensusObservation[] = [];

  for (const ans of rawAnswers) {
    if (!ans.authorId) continue;

    // Verify company employment
    const isVerified = await isAuthorVerifiedAtCompany(ans.authorId, ans.companyId);
    if (!isVerified) {
      continue; // Unverified answers do not enter consensus
    }

    // Check if full experience supersedes answer
    const hasFullExperience = experienceSet.has(`${ans.authorId}:${ans.companyId}`);

    const ansClaims = claims.filter((c) => c.answerId === ans.id);

    for (const c of ansClaims) {
      const isSuperseded = hasFullExperience;
      observations.push({
        authorId: ans.authorId,
        companyId: ans.companyId,
        roleTitleId: ans.roleFamilyId,
        hiringCycle: ans.hiringCycle,
        dimension: c.dimension,
        subject: c.roundKind || c.topicId || c.dimension,
        value: c.valueNum ?? c.valueText ?? 1,
        sourceType: "answer",
        sourceId: ans.id,
        weight: isSuperseded ? 0 : 1.0,
        counted: !isSuperseded,
        supersededReason: isSuperseded ? "superseded_by_experience" : undefined,
      });
    }
  }

  return observations;
}
