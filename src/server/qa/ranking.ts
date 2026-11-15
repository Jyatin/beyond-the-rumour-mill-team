export interface AnswerRankingInput {
  id: string;
  isEmploymentVerifiedForCompany: boolean;
  hasLinkedExperienceWithEvidence: boolean;
  roleMatch: "exact" | "family" | "none";
  cycleDiff: number; // 0 = same cycle, 1 = 1 year/cycle older, etc.
  topicOverlapRatio: number; // 0.0 to 1.0
  isComplete: boolean; // has round sequence + topics
  helpfulCount: number;
  userReputationScore?: number; // 0 to 100
  basis: "own_interview" | "secondhand" | "general_advice";
  hasOpenReportOrReview?: boolean;
  updatedAt: Date | string;
}

export interface AnswerRankingResult {
  score: number; // 0 to 100
  isDated: boolean;
  breakdown: {
    employmentVerified: number;
    linkedExperience: number;
    roleMatch: number;
    cycleRecency: number;
    topicRelevance: number;
    completeness: number;
    helpfulMarks: number;
    reputation: number;
    penalty: number;
  };
}

/**
 * Pure deterministic answer ranking function.
 * Calculates score out of 100 according to verified evidence, role match, recency, and community feedback.
 */
export function calculateAnswerRankScore(input: AnswerRankingInput): AnswerRankingResult {
  const employmentVerified = input.isEmploymentVerifiedForCompany ? 25 : 0;
  const linkedExperience = input.hasLinkedExperienceWithEvidence ? 20 : 0;

  let roleMatch = 0;
  if (input.roleMatch === "exact") {
    roleMatch = 12;
  } else if (input.roleMatch === "family") {
    roleMatch = 8;
  }

  let cycleRecency = 0;
  if (input.cycleDiff <= 0) {
    cycleRecency = 15;
  } else if (input.cycleDiff === 1) {
    cycleRecency = 10;
  } else if (input.cycleDiff === 2) {
    cycleRecency = 5;
  } else {
    cycleRecency = 0;
  }

  const topicRelevance = Math.round(Math.min(1, Math.max(0, input.topicOverlapRatio)) * 8);
  const completeness = input.isComplete ? 10 : 0;
  const helpfulMarks = Math.min(5, Math.max(0, input.helpfulCount));
  const reputation = Math.min(5, Math.max(0, Math.round(((input.userReputationScore || 0) / 100) * 5)));

  const rawScore =
    employmentVerified +
    linkedExperience +
    roleMatch +
    cycleRecency +
    topicRelevance +
    completeness +
    helpfulMarks +
    reputation;

  let penalty = 0;
  if (input.hasOpenReportOrReview) {
    penalty += 20;
  }

  let finalScore = Math.max(0, rawScore - penalty);

  // If not own interview basis, cap at 40
  if (input.basis !== "own_interview") {
    finalScore = Math.min(40, finalScore);
  }

  finalScore = Math.min(100, Math.max(0, finalScore));
  const isDated = input.cycleDiff >= 3;

  return {
    score: finalScore,
    isDated,
    breakdown: {
      employmentVerified,
      linkedExperience,
      roleMatch,
      cycleRecency,
      topicRelevance,
      completeness,
      helpfulMarks,
      reputation,
      penalty,
    },
  };
}

/**
 * Pure deterministic comparator for ranking multiple answers.
 */
export function compareRankedAnswers<T extends { id: string; updatedAt?: Date | string | null }>(
  a: { item: T; ranking: AnswerRankingResult },
  b: { item: T; ranking: AnswerRankingResult }
): number {
  if (b.ranking.score !== a.ranking.score) {
    return b.ranking.score - a.ranking.score;
  }

  const timeA = new Date(a.item.updatedAt || 0).getTime();
  const timeB = new Date(b.item.updatedAt || 0).getTime();
  if (timeB !== timeA) {
    return timeB - timeA;
  }

  return String(a.item.id).localeCompare(String(b.item.id));
}
