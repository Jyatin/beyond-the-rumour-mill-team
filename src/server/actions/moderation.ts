"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { experiences, reports, evidence, alumniProfiles, user as userTable } from "../db/schema";
import { requireRole, requireUser } from "../auth-helpers";
import { revalidatePath } from "next/cache";
import { createAuditRecord } from "./audit";
import { createNotificationTx } from "../notifications";

const removeExperienceSchema = z.object({
  reason: z.string().min(1, "A removal reason is required"),
});

export async function publishExperienceAction(experienceId: string) {
  await requireRole("admin");

  const existing = await db.select().from(experiences).where(eq(experiences.id, experienceId)).limit(1);
  if (!existing[0]) throw new Error("Experience not found");
  if (existing[0].status !== "pending" && existing[0].status !== "draft" && existing[0].status !== "flagged") {
    throw new Error("Invalid state transition");
  }

  await db.transaction(async (tx) => {
    await tx.update(experiences)
      .set({ status: "published", updatedAt: new Date() })
      .where(eq(experiences.id, experienceId));

    if (existing[0].authorId) {
      await createNotificationTx(tx, {
        userId: existing[0].authorId,
        type: "experience_published",
        title: "Experience Published",
        body: "Your interview experience has been approved and published!",
        href: `/experiences/${experienceId}`,
      });
    }

    await createAuditRecord({
      action: "experience_published",
      entityType: "experience",
      entityId: experienceId,
    });
  });

  revalidatePath("/admin/moderation");
  revalidatePath(`/experiences/${experienceId}`);
  
  return { success: true };
}

export async function removeExperienceAction(experienceId: string, data: z.infer<typeof removeExperienceSchema>) {
  await requireRole("admin");
  const parsed = removeExperienceSchema.parse(data);

  const existing = await db.select().from(experiences).where(eq(experiences.id, experienceId)).limit(1);
  if (!existing[0]) throw new Error("Experience not found");

  await db.transaction(async (tx) => {
    await tx.update(experiences)
      .set({ status: "removed", updatedAt: new Date() })
      .where(eq(experiences.id, experienceId));

    if (existing[0].authorId) {
      await createNotificationTx(tx, {
        userId: existing[0].authorId,
        type: "experience_removed",
        title: "Experience Moderation Notice",
        body: `Your interview experience was removed. Reason: ${parsed.reason}`,
        href: "/profile",
      });
    }

    await createAuditRecord({
      action: "experience_removed",
      entityType: "experience",
      entityId: experienceId,
      metadata: { reason: parsed.reason },
    });
  });

  revalidatePath("/admin/moderation");
  revalidatePath(`/experiences/${experienceId}`);
  
  return { success: true };
}

export async function restoreExperienceAction(experienceId: string) {
  await requireRole("admin");

  const existing = await db.select().from(experiences).where(eq(experiences.id, experienceId)).limit(1);
  if (!existing[0]) throw new Error("Experience not found");
  if (existing[0].status !== "flagged" && existing[0].status !== "removed") {
    throw new Error("Invalid state transition");
  }

  await db.transaction(async (tx) => {
    await tx.update(experiences)
      .set({ status: "published", updatedAt: new Date() })
      .where(eq(experiences.id, experienceId));

    if (existing[0].authorId) {
      await createNotificationTx(tx, {
        userId: existing[0].authorId,
        type: "experience_published",
        title: "Experience Restored",
        body: "Your interview experience has been restored and published.",
        href: `/experiences/${experienceId}`,
      });
    }

    await createAuditRecord({
      action: "experience_restored",
      entityType: "experience",
      entityId: experienceId,
    });
  });

  revalidatePath("/admin/moderation");
  revalidatePath(`/experiences/${experienceId}`);
  
  return { success: true };
}


export async function dismissReportAction(reportId: string) {
  await requireRole("admin");
  const user = await requireUser();

  const existing = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!existing[0]) throw new Error("Report not found");

  await db.transaction(async (tx) => {
    await tx.update(reports)
      .set({ 
        status: "dismissed", 
        resolvedBy: user.id,
        resolvedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(reports.id, reportId));

    await createAuditRecord({
      action: "report_dismissed",
      entityType: "report",
      entityId: reportId,
    });
  });

  revalidatePath("/admin/moderation");
  
  return { success: true };
}


export async function resolveReportAction(reportId: string) {
  await requireRole("admin");
  const user = await requireUser();

  const existing = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!existing[0]) throw new Error("Report not found");

  await db.transaction(async (tx) => {
    await tx.update(reports)
      .set({ 
        status: "resolved", 
        resolvedBy: user.id,
        resolvedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(reports.id, reportId));

    await createAuditRecord({
      action: "report_resolved",
      entityType: "report",
      entityId: reportId,
    });
  });

  revalidatePath("/admin/moderation");
  
  return { success: true };
}

const reviewEvidenceSchema = z.object({
  evidenceId: z.string().min(1),
  decision: z.enum(["accepted", "rejected"]),
  reviewNotes: z.string().max(500).optional(),
});

export async function reviewEvidenceAction(data: z.infer<typeof reviewEvidenceSchema>) {
  await requireRole("admin");
  const actor = await requireUser();
  const parsed = reviewEvidenceSchema.parse(data);

  const [ev] = await db
    .select()
    .from(evidence)
    .where(eq(evidence.id, parsed.evidenceId))
    .limit(1);

  if (!ev) {
    throw new Error("Evidence record not found");
  }

  let notifyUserId: string | null = null;
  let companyName = "Target Company";
  let companyId: string | null = null;

  await db.transaction(async (tx) => {
    await tx
      .update(evidence)
      .set({
        status: parsed.decision,
        reviewNotes: parsed.reviewNotes || null,
        reviewedBy: actor.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(evidence.id, ev.id));

    if (ev.employmentId) {
      const [emp] = await tx
        .select()
        .from(alumniProfiles)
        .where(eq(alumniProfiles.id, ev.employmentId))
        .limit(1);

      if (emp) {
        notifyUserId = emp.userId;
        companyName = emp.company;
        companyId = emp.companyId;
        if (parsed.decision === "accepted") {
          await tx
            .update(alumniProfiles)
            .set({ verifiedStatus: "verified" })
            .where(eq(alumniProfiles.id, emp.id));
        }
      }
    }

    if (ev.experienceId) {
      const [exp] = await tx
        .select()
        .from(experiences)
        .where(eq(experiences.id, ev.experienceId))
        .limit(1);

      if (exp) {
        if (!notifyUserId && exp.authorId) notifyUserId = exp.authorId;
        companyName = exp.companyName;
        companyId = exp.companyId;
        if (parsed.decision === "accepted") {
          await tx
            .update(experiences)
            .set({ verificationStatus: "verified", updatedAt: new Date() })
            .where(eq(experiences.id, exp.id));
        }
      }
    }

    if (notifyUserId) {
      await createNotificationTx(tx, {
        userId: notifyUserId,
        type: "verification_completed",
        title:
          parsed.decision === "accepted"
            ? `Verified: ${companyName}`
            : `Verification Update: ${companyName}`,
        body:
          parsed.decision === "accepted"
            ? `Your verification evidence for ${companyName} was accepted.`
            : `Your verification evidence for ${companyName} was not accepted.${parsed.reviewNotes ? ` Note: ${parsed.reviewNotes}` : ""}`,
        href: "/profile",
      });
    }

    await createAuditRecord({
      action: parsed.decision === "accepted" ? "evidence_accepted" : "evidence_rejected",
      entityType: "evidence",
      entityId: ev.id,
      metadata: {
        decision: parsed.decision,
        reviewNotes: parsed.reviewNotes || null,
      },
    });
  });

  if (notifyUserId) {
    try {
      const [recipient] = await db
        .select({ email: userTable.email, name: userTable.name })
        .from(userTable)
        .where(eq(userTable.id, notifyUserId))
        .limit(1);
      if (recipient?.email) {
        const { sendVerificationDecisionAlert } = await import("../email");
        await sendVerificationDecisionAlert({
          to: recipient.email,
          recipientName: recipient.name || "Alumni",
          companyName,
          decision: parsed.decision,
          reviewNotes: parsed.reviewNotes,
        });
      }
    } catch (err) {
      console.error("Failed verification email notification:", err);
    }
  }

  revalidatePath("/admin/moderation");
  revalidatePath("/profile");
  if (companyId) revalidatePath(`/companies/${companyId}`);

  return { success: true };
}

