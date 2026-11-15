import "server-only";

import { db } from "../db";
import { mentorshipRequests, mockSlots, mockBookings, user } from "../db/schema";
import { eq, and, gt, desc, asc, or } from "drizzle-orm";
import { requireUser, getCurrentUser } from "../auth-helpers";

// ---- MENTORSHIP REQUEST QUERIES ----

export async function getMentorshipRequestById(id: string) {
  const currentUser = await requireUser();

  const result = await db
    .select()
    .from(mentorshipRequests)
    .where(eq(mentorshipRequests.id, id))
    .limit(1);

  const request = result[0] || null;
  if (!request) return null;

  // Privacy protection: only student, mentor, or admin can access
  if (
    request.studentId !== currentUser.id &&
    request.mentorId !== currentUser.id &&
    currentUser.role !== "admin"
  ) {
    throw new Error("Forbidden: You are not authorized to view this mentorship request");
  }

  return request;
}

export async function getMyMentorshipRequests() {
  const currentUser = await requireUser();

  const rows = await db
    .select({
      id: mentorshipRequests.id,
      studentId: mentorshipRequests.studentId,
      mentorId: mentorshipRequests.mentorId,
      message: mentorshipRequests.message,
      status: mentorshipRequests.status,
      respondedAt: mentorshipRequests.respondedAt,
      createdAt: mentorshipRequests.createdAt,
      updatedAt: mentorshipRequests.updatedAt,
      mentorName: user.name,
      mentorEmail: user.email,
      mentorImage: user.image,
    })
    .from(mentorshipRequests)
    .leftJoin(user, eq(mentorshipRequests.mentorId, user.id))
    .where(eq(mentorshipRequests.studentId, currentUser.id))
    .orderBy(desc(mentorshipRequests.createdAt));

  return rows;
}

export async function getMentorshipRequestsForMentor() {
  const currentUser = await requireUser();

  const rows = await db
    .select({
      id: mentorshipRequests.id,
      studentId: mentorshipRequests.studentId,
      mentorId: mentorshipRequests.mentorId,
      message: mentorshipRequests.message,
      status: mentorshipRequests.status,
      respondedAt: mentorshipRequests.respondedAt,
      createdAt: mentorshipRequests.createdAt,
      updatedAt: mentorshipRequests.updatedAt,
      studentName: user.name,
      studentEmail: user.email,
      studentImage: user.image,
    })
    .from(mentorshipRequests)
    .leftJoin(user, eq(mentorshipRequests.studentId, user.id))
    .where(eq(mentorshipRequests.mentorId, currentUser.id))
    .orderBy(desc(mentorshipRequests.createdAt));

  return rows;
}

export async function getMentorshipStatus(studentId: string, mentorId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  // Only the student, mentor, or admin can query this status
  if (
    currentUser.id !== studentId &&
    currentUser.id !== mentorId &&
    currentUser.role !== "admin"
  ) {
    return null;
  }

  const result = await db
    .select()
    .from(mentorshipRequests)
    .where(
      and(
        eq(mentorshipRequests.studentId, studentId),
        eq(mentorshipRequests.mentorId, mentorId),
        or(
          eq(mentorshipRequests.status, "pending"),
          eq(mentorshipRequests.status, "accepted")
        )
      )
    )
    .limit(1);

  return result[0] || null;
}

// ---- MOCK INTERVIEW SLOT QUERIES ----

export async function getMockSlotById(id: string) {
  const result = await db
    .select()
    .from(mockSlots)
    .where(eq(mockSlots.id, id))
    .limit(1);

  return result[0] || null;
}

export async function getAvailableSlotsForMentor(mentorId: string) {
  const now = new Date();

  return await db
    .select({
      id: mockSlots.id,
      mentorId: mockSlots.mentorId,
      startsAt: mockSlots.startsAt,
      endsAt: mockSlots.endsAt,
      status: mockSlots.status,
      notes: mockSlots.notes,
      createdAt: mockSlots.createdAt,
    })
    .from(mockSlots)
    .where(
      and(
        eq(mockSlots.mentorId, mentorId),
        eq(mockSlots.status, "available"),
        gt(mockSlots.startsAt, now)
      )
    )
    .orderBy(asc(mockSlots.startsAt));
}

export async function getMySlots() {
  const currentUser = await requireUser();

  return await db
    .select()
    .from(mockSlots)
    .where(eq(mockSlots.mentorId, currentUser.id))
    .orderBy(desc(mockSlots.startsAt));
}

// ---- MOCK BOOKING QUERIES ----

export async function getMyBookings() {
  const currentUser = await requireUser();

  const rows = await db
    .select({
      id: mockBookings.id,
      slotId: mockBookings.slotId,
      studentId: mockBookings.studentId,
      status: mockBookings.status,
      cancelledAt: mockBookings.cancelledAt,
      createdAt: mockBookings.createdAt,
      startsAt: mockSlots.startsAt,
      endsAt: mockSlots.endsAt,
      notes: mockSlots.notes,
      mentorId: mockSlots.mentorId,
      mentorName: user.name,
      mentorEmail: user.email,
    })
    .from(mockBookings)
    .innerJoin(mockSlots, eq(mockBookings.slotId, mockSlots.id))
    .leftJoin(user, eq(mockSlots.mentorId, user.id))
    .where(eq(mockBookings.studentId, currentUser.id))
    .orderBy(desc(mockSlots.startsAt));

  return rows;
}

export async function getBookingsForMentor() {
  const currentUser = await requireUser();

  const rows = await db
    .select({
      id: mockBookings.id,
      slotId: mockBookings.slotId,
      studentId: mockBookings.studentId,
      status: mockBookings.status,
      cancelledAt: mockBookings.cancelledAt,
      createdAt: mockBookings.createdAt,
      startsAt: mockSlots.startsAt,
      endsAt: mockSlots.endsAt,
      notes: mockSlots.notes,
      studentName: user.name,
      studentEmail: user.email,
    })
    .from(mockBookings)
    .innerJoin(mockSlots, eq(mockBookings.slotId, mockSlots.id))
    .leftJoin(user, eq(mockBookings.studentId, user.id))
    .where(eq(mockSlots.mentorId, currentUser.id))
    .orderBy(desc(mockSlots.startsAt));

  return rows;
}

export async function getBookingById(id: string) {
  const currentUser = await requireUser();

  const rows = await db
    .select({
      id: mockBookings.id,
      slotId: mockBookings.slotId,
      studentId: mockBookings.studentId,
      status: mockBookings.status,
      cancelledAt: mockBookings.cancelledAt,
      createdAt: mockBookings.createdAt,
      startsAt: mockSlots.startsAt,
      endsAt: mockSlots.endsAt,
      notes: mockSlots.notes,
      mentorId: mockSlots.mentorId,
    })
    .from(mockBookings)
    .innerJoin(mockSlots, eq(mockBookings.slotId, mockSlots.id))
    .where(eq(mockBookings.id, id))
    .limit(1);

  const booking = rows[0] || null;
  if (!booking) return null;

  // Privacy check: only the student, the mentor, or admin
  if (
    booking.studentId !== currentUser.id &&
    booking.mentorId !== currentUser.id &&
    currentUser.role !== "admin"
  ) {
    throw new Error("Forbidden: You are not authorized to view this booking");
  }

  return booking;
}
