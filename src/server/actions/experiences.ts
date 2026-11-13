"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { experiences, companies } from "../db/schema";
import { requireUser } from "../auth-helpers";
import { revalidatePath } from "next/cache";
import type { RoundInput } from "./rounds";

const experienceSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  companyName: z.string().min(1, "Company name is required"),
  role: z.string().min(1, "Role is required"),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  type: z.string().min(1, "Type is required"),
  rounds: z.number().min(0),
  difficulty: z.string().min(1, "Difficulty is required"),
  studentName: z.string(),
  isAnonymous: z.boolean().default(false),
  summary: z.string().min(1, "Summary is required"),
  content: z.string().optional(),
  outcome: z.string().optional(),
  timeline: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
});

export async function createExperienceAction(data: z.infer<typeof experienceSchema>) {
  const user = await requireUser();
  const parsed = experienceSchema.parse(data);

  const studentDisplayName = parsed.isAnonymous
    ? "Anonymous"
    : (user.name?.trim() || user.email?.split("@")[0] || "Alumni Contributor");

  const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  await db.transaction(async (tx) => {
    // Ensure company exists before referencing it
    const existingCompany = await tx.select({ id: companies.id }).from(companies).where(eq(companies.id, parsed.companyId)).limit(1);
    if (!existingCompany[0]) {
      await tx.insert(companies).values({
        id: parsed.companyId,
        name: parsed.companyName || parsed.companyId,
        industry: "Technology",
        roles: [parsed.role || "Software Engineer"],
        verificationStatus: "verified" as const,
        lastVerifiedAt: new Date().toISOString(),
        topTopics: [],
      }).onConflictDoNothing();
    }

    await tx.insert(experiences).values({
      id,
      ...parsed,
      authorId: user.id,
      studentName: studentDisplayName,
      verificationStatus: "review",
    });
  });

  revalidatePath("/experiences");
  revalidatePath(`/companies/${parsed.companyId}`);
  
  return { success: true, id };
}

export async function updateExperienceAction(id: string, data: z.infer<typeof experienceSchema>) {
  const user = await requireUser();
  const parsed = experienceSchema.parse(data);

  const existing = await db.select().from(experiences).where(eq(experiences.id, id)).limit(1);
  if (!existing[0]) {
    throw new Error("Experience not found");
  }

  if (existing[0].authorId !== user.id) {
    throw new Error("Unauthorized to edit this experience");
  }

  const studentDisplayName = parsed.isAnonymous
    ? "Anonymous"
    : (user.name?.trim() || user.email?.split("@")[0] || "Alumni Contributor");

  await db.transaction(async (tx) => {
    const existingCompany = await tx.select({ id: companies.id }).from(companies).where(eq(companies.id, parsed.companyId)).limit(1);
    if (!existingCompany[0]) {
      await tx.insert(companies).values({
        id: parsed.companyId,
        name: parsed.companyName || parsed.companyId,
        industry: "Technology",
        roles: [parsed.role || "Software Engineer"],
        verificationStatus: "verified" as const,
        lastVerifiedAt: new Date().toISOString(),
        topTopics: [],
      }).onConflictDoNothing();
    }

    await tx.update(experiences).set({
      ...parsed,
      studentName: studentDisplayName,
      status: existing[0].status === "pending" || existing[0].status === "flagged" ? "draft" : existing[0].status,
      updatedAt: new Date(),
    }).where(eq(experiences.id, id));
  });

  revalidatePath("/experiences");
  revalidatePath(`/experiences/${id}`);
  revalidatePath(`/companies/${parsed.companyId}`);

  return { success: true, id };
}

export async function submitExperienceAction(id: string) {
  const user = await requireUser();

  const existing = await db.select().from(experiences).where(eq(experiences.id, id)).limit(1);
  if (!existing[0]) {
    throw new Error("Experience not found");
  }

  if (existing[0].authorId !== user.id) {
    throw new Error("Unauthorized to edit this experience");
  }

  await db.update(experiences).set({
    status: "pending",
    updatedAt: new Date(),
  }).where(eq(experiences.id, id));

  try {
    const { createAuditRecord } = await import("./audit");
    await createAuditRecord({
      action: "experience_submitted",
      entityType: "experience",
      entityId: id,
      actorId: user.id,
    });
  } catch (err) {
    console.error("Audit log error on experience submission:", err);
  }

  revalidatePath("/experiences");
  revalidatePath(`/experiences/${id}`);
  revalidatePath(`/companies/${existing[0].companyId}`);

  return { success: true, id };
}

export async function saveFullExperienceAction({
  id,
  data,
  rounds = [],
  targetStatus = "published",
}: {
  id?: string;
  data: z.infer<typeof experienceSchema>;
  rounds?: RoundInput[];
  targetStatus?: "draft" | "published";
}) {
  const user = await requireUser();
  const parsed = experienceSchema.parse(data);

  const studentDisplayName = parsed.isAnonymous
    ? "Anonymous"
    : (user.name?.trim() || user.email?.split("@")[0] || "Alumni Contributor");

  let expId = id;
  const isCreate = !expId;
  if (isCreate) {
    expId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  const { saveExperienceRoundsInternal } = await import("./rounds");

  await db.transaction(async (tx) => {
    // 1. Ensure company exists before referencing in experiences table
    const existingCompany = await tx
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.id, parsed.companyId))
      .limit(1);

    if (!existingCompany[0]) {
      await tx
        .insert(companies)
        .values({
          id: parsed.companyId,
          name: parsed.companyName || parsed.companyId,
          industry: "Technology",
          roles: [parsed.role || "Software Engineer"],
          verificationStatus: "verified" as const,
          lastVerifiedAt: new Date().toISOString(),
          topTopics: [],
        })
        .onConflictDoNothing();
    }

    // 2. Insert or update experience record
    if (isCreate) {
      await tx.insert(experiences).values({
        id: expId!,
        ...parsed,
        authorId: user.id,
        studentName: studentDisplayName,
        status: targetStatus === "published" ? "pending" : "draft",
        verificationStatus: "review",
      });
    } else {
      const existing = await tx
        .select()
        .from(experiences)
        .where(eq(experiences.id, expId!))
        .limit(1);

      if (!existing[0]) {
        throw new Error("Experience not found");
      }
      if (existing[0].authorId !== user.id) {
        throw new Error("Unauthorized to edit this experience");
      }

      const nextStatus = targetStatus === "published"
        ? "pending"
        : (existing[0].status === "pending" || existing[0].status === "flagged" ? "draft" : existing[0].status);

      await tx.update(experiences).set({
        ...parsed,
        studentName: studentDisplayName,
        status: nextStatus,
        updatedAt: new Date(),
      }).where(eq(experiences.id, expId!));
    }

    // 3. Atomically persist interview rounds & questions in the same transaction
    if (rounds && rounds.length > 0) {
      await saveExperienceRoundsInternal(tx, expId!, rounds);
    }
  });

  // Record audit if submitted
  if (targetStatus === "published") {
    try {
      const { createAuditRecord } = await import("./audit");
      await createAuditRecord({
        action: "experience_submitted",
        entityType: "experience",
        entityId: expId!,
        actorId: user.id,
      });
    } catch (e) {
      console.error("Audit log error on experience submission:", e);
    }
  }

  // Revalidate paths once
  revalidatePath("/experiences");
  revalidatePath(`/experiences/${expId}`);
  revalidatePath(`/companies/${parsed.companyId}`);

  return { success: true, id: expId };
}
