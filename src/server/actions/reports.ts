"use server";

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { experiences, reports } from "../db/schema";
import { requireUser } from "../auth-helpers";
import { createAuditRecord } from "./audit";

const reportSchema = z.object({
  experienceId: z.string().min(1, "Experience is required"),
  reason: z.enum([
    "inaccurate_information",
    "inappropriate_content",
    "personal_information",
    "nda_or_confidential_information",
    "spam",
    "harassment",
    "impersonation",
    "other",
  ]),
  details: z.string().max(1000).optional(),
});

export async function createExperienceReportAction(data: z.infer<typeof reportSchema>) {
  const user = await requireUser();
  const parsed = reportSchema.parse(data);

  const existingExp = await db.select().from(experiences).where(eq(experiences.id, parsed.experienceId)).limit(1);
  if (!existingExp[0]) throw new Error("Experience not found");

  if (existingExp[0].authorId === user.id) {
    throw new Error("You cannot report your own experience");
  }

  // Abuse protection: limit one open report per user per experience
  const existingReport = await db.select()
    .from(reports)
    .where(
      and(
        eq(reports.reporterId, user.id),
        eq(reports.experienceId, parsed.experienceId),
        eq(reports.status, "open")
      )
    )
    .limit(1);

  if (existingReport[0]) {
    throw new Error("You already have an open report for this experience");
  }

  const id = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  await db.transaction(async (tx) => {
    await tx.insert(reports).values({
      id,
      reporterId: user.id,
      experienceId: parsed.experienceId,
      reason: parsed.reason,
      details: parsed.details,
      status: "open",
    });

    // Automatically flag if the config allows it (we just flag it on any report for now as a safe baseline)
    if (existingExp[0].status === "published") {
      await tx.update(experiences)
        .set({ status: "flagged", updatedAt: new Date() })
        .where(eq(experiences.id, parsed.experienceId));
    }

    await createAuditRecord({
      action: "report_created",
      entityType: "report",
      entityId: id,
      metadata: { reason: parsed.reason },
    });
  });

  return { success: true, id };
}
