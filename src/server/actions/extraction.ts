"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { experiences, extractionRuns } from "../db/schema";
import { requireUser } from "../auth-helpers";
import {
  runExperienceExtraction,
  ExperienceForExtraction,
} from "../ai/extractor";
import {
  EXTRACTION_PROMPT_VERSION,
  EXTRACTION_SCHEMA_VERSION,
} from "../ai/prompts";

const extractInputSchema = z.object({
  experienceId: z.string().min(1, "Experience ID is required"),
});

export async function extractExperienceAction(experienceId: string) {
  const parsed = extractInputSchema.safeParse({ experienceId });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid input");
  }

  const currentUser = await requireUser();

  // 1. Fetch experience
  const [experience] = await db
    .select()
    .from(experiences)
    .where(eq(experiences.id, experienceId))
    .limit(1);

  if (!experience) {
    throw new Error("Interview experience not found");
  }

  // 2. Authorization check: author or admin
  const isAuthor = experience.authorId === currentUser.id;
  const isAdmin = currentUser.role === "admin";
  if (!isAuthor && !isAdmin) {
    throw new Error("Unauthorized: You do not have permission to extract intelligence from this experience");
  }

  // 3. Create extraction_runs record in 'running' state
  const runId = `ext_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const defaultModel = process.env.AI_MODEL || "gemini-1.5-flash";

  await db.insert(extractionRuns).values({
    id: runId,
    experienceId: experience.id,
    model: defaultModel,
    promptVersion: EXTRACTION_PROMPT_VERSION,
    schemaVersion: EXTRACTION_SCHEMA_VERSION,
    status: "running",
    rawOutput: null,
    extractedData: null,
    error: null,
    createdAt: new Date(),
  });

  // 4. Run extraction
  const expForExtraction: ExperienceForExtraction = {
    id: experience.id,
    companyName: experience.companyName,
    role: experience.role,
    content: experience.content,
    summary: experience.summary,
    timeline: experience.timeline,
    outcome: experience.outcome,
  };

  const result = await runExperienceExtraction(expForExtraction);

  // 5. Update extraction_runs record
  if (result.success) {
    await db
      .update(extractionRuns)
      .set({
        model: result.model,
        status: "succeeded",
        rawOutput: result.rawOutput,
        extractedData: result.extractedData as Record<string, unknown>,
        error: null,
        completedAt: new Date(),
      })
      .where(eq(extractionRuns.id, runId));

    return {
      success: true,
      runId,
      status: "succeeded" as const,
      extractedData: result.extractedData,
      model: result.model,
    };
  } else {
    await db
      .update(extractionRuns)
      .set({
        model: result.model,
        status: "failed",
        rawOutput: result.rawOutput,
        extractedData: (result.extractedData || null) as Record<string, unknown>,
        error: result.error || "Unknown extraction error",
        completedAt: new Date(),
      })
      .where(eq(extractionRuns.id, runId));

    return {
      success: false,
      runId,
      status: "failed" as const,
      error: result.error,
      validationErrors: result.validationErrors,
      model: result.model,
    };
  }
}
