import "server-only";

import { db } from "../db";
import { interviewQuestions } from "../db/schema";
import { calculateTrigramSimilarity, normalizeLabel } from "./normalizer";

export interface QuestionNormalizationResult {
  status: "matched" | "pending" | "new";
  questionId: string | null;
  canonicalText: string | null;
  topicId: string | null;
  confidence: number;
  method: "hash" | "exact" | "trigram" | null;
}

/**
 * Normalizes question candidate text to find or resolve canonical interview questions.
 */
export async function normalizeQuestionCandidate(
  rawText: string,
  candidateTopicId?: string
): Promise<QuestionNormalizationResult> {
  const normalized = normalizeLabel(rawText);
  if (!normalized) {
    return {
      status: "new",
      questionId: null,
      canonicalText: null,
      topicId: null,
      confidence: 0,
      method: null,
    };
  }

  // 1. Direct hash / exact normalized search
  const allQuestions = await db.select().from(interviewQuestions);
  for (const q of allQuestions) {
    if (normalizeLabel(q.canonicalText) === normalized) {
      return {
        status: "matched",
        questionId: q.id,
        canonicalText: q.canonicalText,
        topicId: q.topicId,
        confidence: 1.0,
        method: "exact",
      };
    }
  }

  // 2. Trigram similarity comparison
  let bestMatch: { question: typeof interviewQuestions.$inferSelect; score: number } | null = null;
  for (const q of allQuestions) {
    const score = calculateTrigramSimilarity(q.canonicalText, rawText);
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { question: q, score };
    }
  }

  if (bestMatch && bestMatch.score >= 0.85) {
    return {
      status: "matched",
      questionId: bestMatch.question.id,
      canonicalText: bestMatch.question.canonicalText,
      topicId: bestMatch.question.topicId,
      confidence: Math.round(bestMatch.score * 100) / 100,
      method: "trigram",
    };
  }

  if (bestMatch && bestMatch.score >= 0.55) {
    return {
      status: "pending",
      questionId: bestMatch.question.id,
      canonicalText: bestMatch.question.canonicalText,
      topicId: bestMatch.question.topicId,
      confidence: Math.round(bestMatch.score * 100) / 100,
      method: "trigram",
    };
  }

  return {
    status: "new",
    questionId: null,
    canonicalText: null,
    topicId: candidateTopicId || null,
    confidence: bestMatch ? Math.round(bestMatch.score * 100) / 100 : 0,
    method: bestMatch && bestMatch.score > 0 ? "trigram" : null,
  };
}
