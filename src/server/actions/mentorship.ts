"use server";

import { z } from "zod";
import { eq, and, or } from "drizzle-orm";
import { db } from "../db";
import { mentorshipRequests, user } from "../db/schema";
import { requireUser } from "../auth-helpers";
import { revalidatePath } from "next/cache";
import { createAuditRecord } from "./audit";
import { createNotificationTx } from "../notifications";

const createMentorshipRequestSchema = z.object({
  mentorId: z.string().min(1, "Mentor ID is required"),
  message: z.string().max(2000, "Message cannot exceed 2000 characters").optional(),
});

export async function createMentorshipRequestAction(data: z.infer<typeof createMentorshipRequestSchema>) {
  const currentUser = await requireUser();
  const parsed = createMentorshipRequestSchema.parse(data);

  // Authorization: Only students (or admins) can initiate mentorship requests
  if (currentUser.role !== "student" && currentUser.role !== "admin") {
    throw new Error("Only students can initiate mentorship requests");
  }

  // Self-mentorship prevention
  if (currentUser.id === parsed.mentorId) {
    throw new Error("Cannot request mentorship from yourself");
  }

  // Verify mentor exists and is an eligible mentor
  const mentorResult = await db
    .select()
    .from(user)
    .where(eq(user.id, parsed.mentorId))
    .limit(1);

  const mentor = mentorResult[0];
  if (!mentor) {
    throw new Error("Mentor not found");
  }

  if (mentor.role !== "alumni" && mentor.role !== "admin") {
    throw new Error("Selected user is not an eligible alumni mentor");
  }

  // Prevent duplicate active mentorship requests between same student & mentor
  const existingActive = await db
    .select()
    .from(mentorshipRequests)
    .where(
      and(
        eq(mentorshipRequests.studentId, currentUser.id),
        eq(mentorshipRequests.mentorId, parsed.mentorId),
        or(
          eq(mentorshipRequests.status, "pending"),
          eq(mentorshipRequests.status, "accepted")
        )
      )
    )
    .limit(1);

  if (existingActive.length > 0) {
    throw new Error("An active mentorship request already exists with this mentor");
  }

  const requestId = `mr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  await db.transaction(async (tx) => {
    await tx.insert(mentorshipRequests).values({
      id: requestId,
      studentId: currentUser.id,
      mentorId: parsed.mentorId,
      message: parsed.message || null,
      status: "pending",
    });

    await createNotificationTx(tx, {
      userId: parsed.mentorId,
      type: "mentorship_request",
      title: "New Mentorship Request",
      body: `${currentUser.name || "A student"} sent you a mentorship request.`,
      href: "/profile",
    });

    await createAuditRecord({
      action: "mentorship_request_created",
      entityType: "mentorship_request",
      entityId: requestId,
      metadata: { mentorId: parsed.mentorId },
    });
  });

  revalidatePath("/connect");
  revalidatePath("/profile");

  return { success: true, id: requestId };
}

export async function acceptMentorshipRequestAction(requestId: string) {
  const currentUser = await requireUser();

  const result = await db
    .select()
    .from(mentorshipRequests)
    .where(eq(mentorshipRequests.id, requestId))
    .limit(1);

  const request = result[0];
  if (!request) {
    throw new Error("Mentorship request not found");
  }

  // Authorization: Only the addressed mentor (or admin) can accept
  if (request.mentorId !== currentUser.id && currentUser.role !== "admin") {
    throw new Error("Unauthorized: You can only accept mentorship requests addressed to you");
  }

  if (request.status !== "pending") {
    throw new Error("Only pending mentorship requests can be accepted");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(mentorshipRequests)
      .set({
        status: "accepted",
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(mentorshipRequests.id, requestId));

    await createNotificationTx(tx, {
      userId: request.studentId,
      type: "mentorship_accepted",
      title: "Mentorship Request Accepted",
      body: "Your mentorship request has been accepted by the mentor!",
      href: "/profile",
    });

    await createAuditRecord({
      action: "mentorship_request_accepted",
      entityType: "mentorship_request",
      entityId: requestId,
    });
  });

  revalidatePath("/connect");
  revalidatePath("/profile");

  return { success: true };
}

export async function rejectMentorshipRequestAction(requestId: string) {
  const currentUser = await requireUser();

  const result = await db
    .select()
    .from(mentorshipRequests)
    .where(eq(mentorshipRequests.id, requestId))
    .limit(1);

  const request = result[0];
  if (!request) {
    throw new Error("Mentorship request not found");
  }

  // Authorization: Only the addressed mentor (or admin) can reject
  if (request.mentorId !== currentUser.id && currentUser.role !== "admin") {
    throw new Error("Unauthorized: You can only reject mentorship requests addressed to you");
  }

  if (request.status !== "pending") {
    throw new Error("Only pending mentorship requests can be rejected");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(mentorshipRequests)
      .set({
        status: "rejected",
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(mentorshipRequests.id, requestId));

    await createNotificationTx(tx, {
      userId: request.studentId,
      type: "mentorship_rejected",
      title: "Mentorship Request Update",
      body: "Your mentorship request was declined.",
      href: "/profile",
    });

    await createAuditRecord({
      action: "mentorship_request_rejected",
      entityType: "mentorship_request",
      entityId: requestId,
    });
  });

  revalidatePath("/connect");
  revalidatePath("/profile");

  return { success: true };
}


export async function cancelMentorshipRequestAction(requestId: string) {
  const currentUser = await requireUser();

  const result = await db
    .select()
    .from(mentorshipRequests)
    .where(eq(mentorshipRequests.id, requestId))
    .limit(1);

  const request = result[0];
  if (!request) {
    throw new Error("Mentorship request not found");
  }

  // Authorization: Only the student who created the request (or admin) can cancel
  if (request.studentId !== currentUser.id && currentUser.role !== "admin") {
    throw new Error("Unauthorized: You can only cancel your own mentorship requests");
  }

  if (request.status !== "pending") {
    throw new Error("Only pending mentorship requests can be cancelled");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(mentorshipRequests)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(mentorshipRequests.id, requestId));

    await createAuditRecord({
      action: "mentorship_request_cancelled",
      entityType: "mentorship_request",
      entityId: requestId,
    });
  });

  revalidatePath("/connect");
  revalidatePath("/profile");

  return { success: true };
}
