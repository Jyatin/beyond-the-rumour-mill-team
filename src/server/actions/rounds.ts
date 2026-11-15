"use server";

import { z } from "zod";
import { eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { 
  experiences, 
  interviewRounds, 
  roundTypes, 
  topics, 
  roundTopics, 
  interviewQuestions, 
  experienceQuestions 
} from "../db/schema";
import { requireUser } from "../auth-helpers";
import { revalidatePath } from "next/cache";

const questionSchema = z.object({
  text: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.string().min(1),
});

const roundSchema = z.object({
  roundTypeName: z.string().min(1),
  title: z.string().optional(),
  summary: z.string().optional(),
  difficulty: z.string().optional(),
  topics: z.array(z.string()).default([]),
  questions: z.array(questionSchema).default([]),
});

export type RoundInput = z.infer<typeof roundSchema>;

const updateRoundsSchema = z.object({
  experienceId: z.string().min(1),
  rounds: z.array(roundSchema),
});

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface QuestionJob {
  roundId: string;
  text: string;
  normalizedHash: string;
  topicName?: string;
  order: number;
}

export async function saveExperienceRoundsInternal(
  tx: DbTransaction,
  experienceId: string,
  rawRounds: z.infer<typeof roundSchema>[]
) {
  // Delete existing rounds (cascade will handle round_topics and experience_questions)
  await tx.delete(interviewRounds).where(eq(interviewRounds.experienceId, experienceId));
  
  // Also explicitly delete any experience_questions that might not have a roundId
  await tx.delete(experienceQuestions).where(eq(experienceQuestions.experienceId, experienceId));

  if (!rawRounds || rawRounds.length === 0) {
    return;
  }

  // 1. Collect unique round types and resolve IDs in batch
  const uniqueRoundTypeNames = [...new Set(rawRounds.map((r) => r.roundTypeName.trim()).filter(Boolean))];
  const existingRoundTypes = uniqueRoundTypeNames.length > 0
    ? await tx.select().from(roundTypes).where(inArray(roundTypes.name, uniqueRoundTypeNames))
    : [];
  const roundTypeMap = new Map<string, string>(existingRoundTypes.map((rt) => [rt.name, rt.id]));

  const missingRoundTypeNames = uniqueRoundTypeNames.filter((name) => !roundTypeMap.has(name));
  if (missingRoundTypeNames.length > 0) {
    const toInsert = missingRoundTypeNames.map((name) => ({
      id: `rt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name,
    }));
    await tx.insert(roundTypes).values(toInsert).onConflictDoNothing();
    const refreshed = await tx.select().from(roundTypes).where(inArray(roundTypes.name, missingRoundTypeNames));
    for (const rt of refreshed) {
      roundTypeMap.set(rt.name, rt.id);
    }
  }

  // 2. Collect unique topic names across all rounds and questions in batch
  const allTopicNames = new Set<string>();
  for (const r of rawRounds) {
    for (const t of r.topics || []) {
      if (t && t.trim()) allTopicNames.add(t.trim());
    }
    for (const q of r.questions || []) {
      if (q.topic && q.topic.trim()) allTopicNames.add(q.topic.trim());
    }
  }
  const uniqueTopicNames = [...allTopicNames];
  const existingTopics = uniqueTopicNames.length > 0
    ? await tx.select().from(topics).where(inArray(topics.name, uniqueTopicNames))
    : [];
  const topicMap = new Map<string, string>(existingTopics.map((t) => [t.name, t.id]));

  const missingTopicNames = uniqueTopicNames.filter((name) => !topicMap.has(name));
  if (missingTopicNames.length > 0) {
    const toInsert = missingTopicNames.map((name) => ({
      id: `topic_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name,
    }));
    await tx.insert(topics).values(toInsert).onConflictDoNothing();
    const refreshed = await tx.select().from(topics).where(inArray(topics.name, missingTopicNames));
    for (const t of refreshed) {
      topicMap.set(t.name, t.id);
    }
  }

  // 3. Prepare rounds, round-topics, and question lists
  const roundsToInsert: (typeof interviewRounds.$inferInsert)[] = [];
  const roundTopicsToInsert: (typeof roundTopics.$inferInsert)[] = [];
  const questionsToProcess: QuestionJob[] = [];
  const seenRoundTopics = new Set<string>();

  let orderIndex = 0;
  for (const r of rawRounds) {
    const roundId = `round_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${orderIndex}`;
    const roundTypeId = roundTypeMap.get(r.roundTypeName.trim());

    roundsToInsert.push({
      id: roundId,
      experienceId,
      roundTypeId,
      title: r.title,
      summary: r.summary,
      difficulty: r.difficulty,
      order: orderIndex++,
    });

    const uniqueRoundTopics = [...new Set((r.topics || []).map((t) => t.trim()).filter(Boolean))];
    for (const tName of uniqueRoundTopics) {
      const topicId = topicMap.get(tName);
      if (topicId) {
        const key = `${roundId}_${topicId}`;
        if (!seenRoundTopics.has(key)) {
          seenRoundTopics.add(key);
          roundTopicsToInsert.push({ roundId, topicId });
        }
      }
    }

    let qOrder = 0;
    for (const q of r.questions || []) {
      const text = q.text.trim();
      if (!text) continue;
      const normalizedHash = text.toLowerCase();
      questionsToProcess.push({
        roundId,
        text,
        normalizedHash,
        topicName: q.topic?.trim(),
        order: qOrder++,
      });
    }
  }

  if (roundsToInsert.length > 0) {
    await tx.insert(interviewRounds).values(roundsToInsert);
  }

  if (roundTopicsToInsert.length > 0) {
    await tx.insert(roundTopics).values(roundTopicsToInsert);
  }

  // 4. Batch process interview questions & experience questions
  if (questionsToProcess.length > 0) {
    const uniqueHashes = [...new Set(questionsToProcess.map((q) => q.normalizedHash))];
    const existingIQs = await tx
      .select()
      .from(interviewQuestions)
      .where(inArray(interviewQuestions.normalizedHash, uniqueHashes));
    const iqMap = new Map<string, string>(existingIQs.map((iq) => [iq.normalizedHash, iq.id]));

    const missingHashes = uniqueHashes.filter((h) => !iqMap.has(h));
    if (missingHashes.length > 0) {
      const missingToInsert = missingHashes.map((hash) => {
        const sample = questionsToProcess.find((q) => q.normalizedHash === hash)!;
        const topicId = sample.topicName ? topicMap.get(sample.topicName) : undefined;
        return {
          id: `iq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          canonicalText: sample.text,
          normalizedHash: hash,
          topicId,
        };
      });
      await tx.insert(interviewQuestions).values(missingToInsert).onConflictDoNothing();
      const refreshed = await tx
        .select()
        .from(interviewQuestions)
        .where(inArray(interviewQuestions.normalizedHash, missingHashes));
      for (const iq of refreshed) {
        iqMap.set(iq.normalizedHash, iq.id);
      }
    }

    const expQuestionsToInsert = questionsToProcess
      .map((q) => {
        const questionId = iqMap.get(q.normalizedHash);
        if (!questionId) return null;
        return {
          id: `eq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${q.order}`,
          experienceId,
          roundId: q.roundId,
          questionId,
          rawText: q.text,
          order: q.order,
        };
      })
      .filter((eq): eq is NonNullable<typeof eq> => Boolean(eq));

    if (expQuestionsToInsert.length > 0) {
      await tx.insert(experienceQuestions).values(expQuestionsToInsert);
    }
  }
}

export async function updateExperienceRoundsAction(data: z.infer<typeof updateRoundsSchema>) {
  const user = await requireUser();
  const parsed = updateRoundsSchema.parse(data);

  // Enforce ownership outside transaction to fail fast
  const existingExp = await db.select().from(experiences).where(eq(experiences.id, parsed.experienceId)).limit(1);
  if (!existingExp[0]) {
    throw new Error("Experience not found");
  }
  if (existingExp[0].authorId !== user.id) {
    throw new Error("Unauthorized to edit this experience");
  }

  await db.transaction(async (tx) => {
    await saveExperienceRoundsInternal(tx, parsed.experienceId, parsed.rounds);
  });

  revalidatePath(`/experiences/${parsed.experienceId}`);
  revalidatePath(`/experiences/${parsed.experienceId}/edit`);
  revalidatePath(`/companies/${existingExp[0].companyId}`);

  return { success: true };
}
