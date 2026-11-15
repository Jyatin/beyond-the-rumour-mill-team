import "server-only";

import { db } from "../db";
import {
  questions,
  questionAsks,
  questionTopics,
  answers,
  answerClaims,
  answerFeedback,
  companies,
  roleTitles,
  topics,
  alumniProfiles,
  user,
  experiences,
  evidence,
} from "../db/schema";
import { eq, and, desc, sql, or, isNull, inArray } from "drizzle-orm";
import { getCurrentUser } from "../auth-helpers";
import { isAuthorVerifiedAtCompany } from "./verification";
import { getUserReputationSignals } from "../reputation/signals";
import { calculateAnswerRankScore, compareRankedAnswers, AnswerRankingResult } from "../qa/ranking";

export async function getQuestionBySlot(slotKey: string) {
  if (!slotKey) return null;
  const result = await db
    .select()
    .from(questions)
    .where(and(eq(questions.slotKey, slotKey), isNull(questions.deletedAt)))
    .limit(1);
  return result[0] || null;
}

export async function getQuestionById(id: string) {
  if (!id) return null;
  const result = await db
    .select()
    .from(questions)
    .where(and(eq(questions.id, id), isNull(questions.deletedAt)))
    .limit(1);
  return result[0] || null;
}

export async function listQuestionsForCompany(companyId: string) {
  if (!companyId) return [];
  return await db
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.companyId, companyId),
        isNull(questions.deletedAt),
        eq(questions.moderationState, "visible")
      )
    )
    .orderBy(desc(questions.askCount), desc(questions.answerCount));
}

export async function listQuestionsForCompanyRole(companyId: string, roleFamilyId?: string) {
  if (!companyId) return [];
  const whereClauses = [
    eq(questions.companyId, companyId),
    isNull(questions.deletedAt),
    eq(questions.moderationState, "visible"),
  ];
  if (roleFamilyId) {
    whereClauses.push(eq(questions.roleFamilyId, roleFamilyId));
  }
  return await db
    .select()
    .from(questions)
    .where(and(...whereClauses))
    .orderBy(desc(questions.askCount), desc(questions.answerCount));
}

export async function getQuestionAsks(questionId: string) {
  if (!questionId) return [];
  return await db
    .select({
      id: questionAsks.id,
      userId: questionAsks.userId,
      contextBody: questionAsks.contextBody,
      hiringCycle: questionAsks.hiringCycle,
      collegeSnapshot: questionAsks.collegeSnapshot,
      batchSnapshot: questionAsks.batchSnapshot,
      createdAt: questionAsks.createdAt,
      userName: user.name,
    })
    .from(questionAsks)
    .innerJoin(user, eq(questionAsks.userId, user.id))
    .where(eq(questionAsks.questionId, questionId))
    .orderBy(desc(questionAsks.createdAt));
}

export async function getQuestionTopics(questionId: string) {
  if (!questionId) return [];
  const rows = await db
    .select({
      topicId: topics.id,
      topicName: topics.name,
    })
    .from(questionTopics)
    .innerJoin(topics, eq(questionTopics.topicId, topics.id))
    .where(eq(questionTopics.questionId, questionId));
  return rows;
}

/**
 * Fetches answers for a question with structured claims, anonymous masking, and deterministic ranking.
 */
export async function getRankedQuestionAnswers(questionId: string, options?: { viewerId?: string }) {
  if (!questionId) return [];

  const question = await getQuestionById(questionId);
  if (!question) return [];

  const rawAnswers = await db
    .select({
      id: answers.id,
      questionId: answers.questionId,
      authorId: answers.authorId,
      roleFamilyId: answers.roleFamilyId,
      hiringCycle: answers.hiringCycle,
      basis: answers.basis,
      experienceId: answers.experienceId,
      body: answers.body,
      displayMode: answers.displayMode,
      source: answers.source,
      revision: answers.revision,
      moderationState: answers.moderationState,
      helpfulCount: answers.helpfulCount,
      createdAt: answers.createdAt,
      updatedAt: answers.updatedAt,
      authorName: user.name,
    })
    .from(answers)
    .leftJoin(user, eq(answers.authorId, user.id))
    .where(
      and(
        eq(answers.questionId, questionId),
        isNull(answers.deletedAt),
        eq(answers.moderationState, "visible")
      )
    );

  if (rawAnswers.length === 0) return [];

  const answerIds = rawAnswers.map((a) => a.id);
  const claims = await db
    .select()
    .from(answerClaims)
    .where(inArray(answerClaims.answerId, answerIds))
    .orderBy(answerClaims.position);

  // Group claims by answerId
  const claimsByAnswer = new Map<string, typeof claims>();
  for (const c of claims) {
    const list = claimsByAnswer.get(c.answerId) || [];
    list.push(c);
    claimsByAnswer.set(c.answerId, list);
  }

  // Question topics for topic overlap calculation
  const qTopics = await getQuestionTopics(questionId);
  const qTopicIds = new Set(qTopics.map((t) => t.topicId));

  // Determine current cycle year (e.g. 2026/27 -> 2026)
  const currentYear = new Date().getFullYear();

  const rankedItems = await Promise.all(
    rawAnswers.map(async (ans) => {
      const isVerified = ans.authorId
        ? await isAuthorVerifiedAtCompany(ans.authorId, question.companyId)
        : false;

      // Check linked experience evidence
      let hasLinkedEvidence = false;
      if (ans.experienceId) {
        const ev = await db
          .select({ id: evidence.id })
          .from(evidence)
          .where(and(eq(evidence.experienceId, ans.experienceId), eq(evidence.status, "accepted")))
          .limit(1);
        hasLinkedEvidence = !!ev[0];
      }

      // Role match
      let roleMatch: "exact" | "family" | "none" = "none";
      if (question.roleFamilyId && ans.roleFamilyId) {
        if (question.roleFamilyId === ans.roleFamilyId) {
          roleMatch = "exact";
        } else {
          roleMatch = "family";
        }
      }

      // Cycle diff
      const ansYear = parseInt(ans.hiringCycle.split("/")[0], 10) || currentYear;
      const cycleDiff = Math.max(0, currentYear - ansYear);

      // Topic overlap
      const ansClaimsList = claimsByAnswer.get(ans.id) || [];
      const ansTopicIds = ansClaimsList
        .filter((c) => c.dimension === "topic_covered" && c.topicId)
        .map((c) => c.topicId as string);

      let topicOverlapRatio = 0;
      if (qTopicIds.size > 0 && ansTopicIds.length > 0) {
        const overlap = ansTopicIds.filter((t) => qTopicIds.has(t)).length;
        topicOverlapRatio = overlap / qTopicIds.size;
      } else if (ansTopicIds.length > 0) {
        topicOverlapRatio = 0.5;
      }

      // Completeness: has round sequence & topics
      const hasRoundSeq = ansClaimsList.some((c) => c.dimension === "round_sequence");
      const hasTopic = ansClaimsList.some((c) => c.dimension === "topic_covered");
      const isComplete = hasRoundSeq && hasTopic;

      // Reputation
      let repScore = 0;
      if (ans.authorId) {
        const rep = await getUserReputationSignals(ans.authorId).catch(() => null);
        repScore = rep?.reputationScore || 0;
      }

      const ranking = calculateAnswerRankScore({
        id: ans.id,
        isEmploymentVerifiedForCompany: isVerified,
        hasLinkedExperienceWithEvidence: hasLinkedEvidence,
        roleMatch,
        cycleDiff,
        topicOverlapRatio,
        isComplete,
        helpfulCount: ans.helpfulCount,
        userReputationScore: repScore,
        basis: ans.basis,
        updatedAt: ans.updatedAt,
      });

      // Safe author identity masking for anonymous verified mode
      let displayAuthorName = ans.authorName || "Alumni";
      let displayAuthorId: string | null = ans.authorId;
      if (ans.displayMode === "anonymous_verified") {
        displayAuthorName = isVerified
          ? `Verified Employee · ${ans.hiringCycle}`
          : `Anonymous Candidate · ${ans.hiringCycle}`;
        displayAuthorId = null;
      }

      return {
        item: {
          ...ans,
          authorName: displayAuthorName,
          authorId: displayAuthorId,
          isVerifiedEmployment: isVerified,
          claims: ansClaimsList,
        },
        ranking,
      };
    })
  );

  rankedItems.sort(compareRankedAnswers);

  return rankedItems.map((r) => ({
    ...r.item,
    rankScore: r.ranking.score,
    isDated: r.ranking.isDated,
    rankBreakdown: r.ranking.breakdown,
  }));
}

/**
 * Searches for similar custom questions in the same company using pg_trgm similarity.
 */
export async function findSimilarCustomQuestions(companyId: string, title: string) {
  if (!companyId || !title || title.trim().length === 0) return [];
  const sanitized = title.trim();

  const titleSimilarity = sql<number>`similarity(${questions.titleNormalized}, ${sanitized})`;

  const similar = await db
    .select({
      id: questions.id,
      title: questions.title,
      intent: questions.intent,
      askCount: questions.askCount,
      answerCount: questions.answerCount,
      similarity: titleSimilarity,
    })
    .from(questions)
    .where(
      and(
        eq(questions.companyId, companyId),
        isNull(questions.deletedAt),
        eq(questions.moderationState, "visible"),
        or(
          sql`${questions.titleNormalized} % ${sanitized}`,
          sql`similarity(${questions.titleNormalized}, ${sanitized}) > 0.25`
        )
      )
    )
    .orderBy(desc(titleSimilarity))
    .limit(3);

  return similar;
}

/**
 * Returns question coverage state (open, answered, well_covered).
 */
export async function getQuestionCoverage(questionId: string) {
  const q = await getQuestionById(questionId);
  if (!q) return null;

  const answersList = await getRankedQuestionAnswers(questionId);
  const eligibleAnswers = answersList.filter((a) => a.isVerifiedEmployment && a.basis === "own_interview");

  const isWellCovered = eligibleAnswers.length >= 3;

  return {
    questionId,
    totalAnswers: answersList.length,
    eligibleAnswersCount: eligibleAnswers.length,
    isWellCovered,
    status: isWellCovered ? "well_covered" : answersList.length > 0 ? "answered" : "open",
  };
}
