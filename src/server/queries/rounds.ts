import "server-only";

import { eq, inArray, asc } from "drizzle-orm";
import { db } from "../db";
import { 
  interviewRounds, 
  roundTypes, 
  roundTopics, 
  topics, 
  experienceQuestions, 
  interviewQuestions 
} from "../db/schema";

export async function getExperienceWithRounds(experienceId: string) {
  // Fetch rounds
  const rounds = await db
    .select({
      id: interviewRounds.id,
      title: interviewRounds.title,
      summary: interviewRounds.summary,
      difficulty: interviewRounds.difficulty,
      order: interviewRounds.order,
      roundTypeName: roundTypes.name,
    })
    .from(interviewRounds)
    .leftJoin(roundTypes, eq(interviewRounds.roundTypeId, roundTypes.id))
    .where(eq(interviewRounds.experienceId, experienceId))
    .orderBy(asc(interviewRounds.order));

  if (!rounds || rounds.length === 0) {
    return [];
  }

  const roundIds = rounds.map((r) => r.id);

  // Fetch all topics and questions in parallel batch queries
  const [allTopics, allQuestions] = await Promise.all([
    db
      .select({
        roundId: roundTopics.roundId,
        name: topics.name,
      })
      .from(roundTopics)
      .innerJoin(topics, eq(roundTopics.topicId, topics.id))
      .where(inArray(roundTopics.roundId, roundIds)),
    db
      .select({
        roundId: experienceQuestions.roundId,
        id: experienceQuestions.id,
        canonicalId: interviewQuestions.id,
        text: experienceQuestions.rawText, // Return rawText as text for frontend compatibility
        order: experienceQuestions.order,
      })
      .from(experienceQuestions)
      .innerJoin(interviewQuestions, eq(experienceQuestions.questionId, interviewQuestions.id))
      .where(inArray(experienceQuestions.roundId, roundIds))
      .orderBy(asc(experienceQuestions.order)),
  ]);

  const topicsByRound = new Map<string, string[]>();
  for (const t of allTopics) {
    if (!topicsByRound.has(t.roundId)) {
      topicsByRound.set(t.roundId, []);
    }
    topicsByRound.get(t.roundId)!.push(t.name);
  }

  const questionsByRound = new Map<
    string,
    Array<{ id: string; canonicalId: string; text: string; canonicalText?: string; order: number }>
  >();
  for (const q of allQuestions) {
    if (q.roundId) {
      if (!questionsByRound.has(q.roundId)) {
        questionsByRound.set(q.roundId, []);
      }
      questionsByRound.get(q.roundId)!.push({
        id: q.id,
        canonicalId: q.canonicalId,
        text: q.text,
        canonicalText: q.text,
        order: q.order,
      });
    }
  }

  return rounds.map((r) => ({
    ...r,
    topics: topicsByRound.get(r.id) || [],
    questions: questionsByRound.get(r.id) || [],
  }));
}
