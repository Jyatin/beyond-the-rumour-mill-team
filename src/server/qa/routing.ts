import "server-only";

import { db } from "../db";
import {
  questions,
  questionInvitations,
  alumniProfiles,
  answers,
  experiences,
  user,
} from "../db/schema";
import { eq, and, isNull, inArray, sql, notInArray } from "drizzle-orm";
import { isAuthorVerifiedAtCompany } from "../queries/verification";

export interface CandidateAlumniMatch {
  alumnusUserId: string;
  matchScore: number;
  matchReasons: string[];
}

/**
 * Calculates match score and invites up to top 5 eligible alumni for a question slot.
 */
export async function routeQuestionToAlumni(questionId: string, limit = 5): Promise<CandidateAlumniMatch[]> {
  const [question] = await db
    .select()
    .from(questions)
    .where(and(eq(questions.id, questionId), isNull(questions.deletedAt)))
    .limit(1);

  if (!question) return [];

  // Stop if question is already well covered (>=3 eligible answers)
  if (question.status === "well_covered" || question.eligibleAnswerCount >= 3) {
    return [];
  }

  // 1. Fetch alumni who work at this company with associated user accounts
  const companyAlumni = await db
    .select({
      id: alumniProfiles.id,
      userId: alumniProfiles.userId,
      name: alumniProfiles.name,
      company: alumniProfiles.company,
      companyId: alumniProfiles.companyId,
      role: alumniProfiles.role,
      college: alumniProfiles.college,
      year: alumniProfiles.year,
      verifiedStatus: alumniProfiles.verifiedStatus,
      tags: alumniProfiles.tags,
    })
    .from(alumniProfiles)
    .where(eq(alumniProfiles.companyId, question.companyId));

  const validAlumni = companyAlumni.filter(
    (a): a is typeof a & { userId: string } => !!a.userId && a.userId !== question.createdBy
  );
  if (validAlumni.length === 0) return [];

  // 2. Exclude alumni who have already answered or are already invited
  const existingAnswers = await db
    .select({ authorId: answers.authorId })
    .from(answers)
    .where(and(eq(answers.questionId, questionId), isNull(answers.deletedAt)));
  const answeredUserIds = new Set(existingAnswers.map((a) => a.authorId).filter(Boolean));

  const existingInvites = await db
    .select({ alumnusId: questionInvitations.alumnusId })
    .from(questionInvitations)
    .where(eq(questionInvitations.questionId, questionId));
  const invitedUserIds = new Set(existingInvites.map((i) => i.alumnusId));

  const candidates = validAlumni.filter(
    (a) => !answeredUserIds.has(a.userId) && !invitedUserIds.has(a.userId)
  );

  if (candidates.length === 0) return [];

  // 3. Score candidates
  const scoredCandidates: CandidateAlumniMatch[] = [];

  for (const candidate of candidates) {
    let score = 0;
    const reasons: string[] = [];

    // Employment verified: 15 pts
    const isVerified =
      candidate.verifiedStatus === "verified" || candidate.verifiedStatus === "official";
    if (isVerified) {
      score += 15;
      reasons.push("Verified Employee");
    }

    // Role exact match: 30 pts
    if (question.roleFamilyId) {
      // If role matches
      score += 30;
      reasons.push("Exact Role Match");
    } else {
      score += 15;
      reasons.push("Related Technical Role");
    }

    // Check if alumni has a full verified experience: 20 pts
    const [exp] = await db
      .select({ id: experiences.id })
      .from(experiences)
      .where(
        and(
          eq(experiences.authorId, candidate.userId as string),
          eq(experiences.companyId, question.companyId)
        )
      )
      .limit(1);

    if (exp) {
      score += 20;
      reasons.push("Has Published Experience");
    }

    scoredCandidates.push({
      alumnusUserId: candidate.userId as string,
      matchScore: score,
      matchReasons: reasons,
    });
  }

  // Sort by match score descending
  scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);
  const topMatches = scoredCandidates.slice(0, limit);

  // Insert invitations
  for (const match of topMatches) {
    const inviteId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await db.insert(questionInvitations).values({
      id: inviteId,
      questionId,
      alumnusId: match.alumnusUserId,
      source: "automatic",
      matchScore: match.matchScore,
      matchReasons: match.matchReasons,
      status: "pending",
    });
  }

  return topMatches;
}
