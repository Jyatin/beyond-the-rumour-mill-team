import "server-only";

import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { extractionRuns, experiences } from "../db/schema";
import { requireUser } from "../auth-helpers";

export async function getExtractionRunsForExperience(experienceId: string) {
  const currentUser = await requireUser();

  const [experience] = await db
    .select()
    .from(experiences)
    .where(eq(experiences.id, experienceId))
    .limit(1);

  if (!experience) {
    return [];
  }

  const isAuthor = experience.authorId === currentUser.id;
  const isAdmin = currentUser.role === "admin";
  if (!isAuthor && !isAdmin) {
    throw new Error("Unauthorized: You do not have permission to view extraction runs for this experience");
  }

  const runs = await db
    .select()
    .from(extractionRuns)
    .where(eq(extractionRuns.experienceId, experienceId))
    .orderBy(desc(extractionRuns.createdAt));

  return runs;
}

export async function getExtractionRunById(runId: string) {
  const currentUser = await requireUser();

  const [run] = await db
    .select()
    .from(extractionRuns)
    .where(eq(extractionRuns.id, runId))
    .limit(1);

  if (!run) {
    return null;
  }

  const [experience] = await db
    .select()
    .from(experiences)
    .where(eq(experiences.id, run.experienceId))
    .limit(1);

  if (!experience) {
    return null;
  }

  const isAuthor = experience.authorId === currentUser.id;
  const isAdmin = currentUser.role === "admin";
  if (!isAuthor && !isAdmin) {
    throw new Error("Unauthorized: You do not have permission to view this extraction run");
  }

  return run;
}
