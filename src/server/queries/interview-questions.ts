import "server-only";

import { eq } from "drizzle-orm";
import { db } from "../db";
import { interviewQuestions } from "../db/schema";

export async function getInterviewQuestions() {
  try {
    return await db.select().from(interviewQuestions);
  } catch (err) {
    console.error("Failed to fetch interview questions from DB:", err);
    return [];
  }
}

export async function getInterviewQuestionById(id: string) {
  const result = await db
    .select()
    .from(interviewQuestions)
    .where(eq(interviewQuestions.id, id))
    .limit(1);
  return result[0] || null;
}
