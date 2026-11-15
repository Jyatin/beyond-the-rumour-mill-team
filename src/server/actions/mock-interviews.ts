"use server";

import { z } from "zod";
import { eq, and, ne, lt, gt } from "drizzle-orm";
import { db } from "../db";
import { mockSlots, mockBookings } from "../db/schema";
import { requireUser } from "../auth-helpers";
import { revalidatePath } from "next/cache";
import { createAuditRecord } from "./audit";
import { createNotificationTx } from "../notifications";

const createSlotSchema = z.object({
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
});

export async function createMockSlotAction(data: z.infer<typeof createSlotSchema>) {
  const currentUser = await requireUser();
  const parsed = createSlotSchema.parse(data);

  // Authorization: Only alumni (or admins) can create mock interview slots
  if (currentUser.role !== "alumni" && currentUser.role !== "admin") {
    throw new Error("Only alumni can create mock interview slots");
  }

  const { startsAt, endsAt, notes } = parsed;

  if (startsAt >= endsAt) {
    throw new Error("Slot start time must be before end time");
  }

  const now = new Date();
  if (startsAt <= now) {
    throw new Error("Slot start time must be in the future");
  }

  const durationMinutes = (endsAt.getTime() - startsAt.getTime()) / (1000 * 60);
  if (durationMinutes < 15 || durationMinutes > 240) {
    throw new Error("Slot duration must be between 15 minutes and 4 hours");
  }

  // Prevent overlapping active slots for the same mentor
  const existingOverlaps = await db
    .select()
    .from(mockSlots)
    .where(
      and(
        eq(mockSlots.mentorId, currentUser.id),
        ne(mockSlots.status, "cancelled"),
        lt(mockSlots.startsAt, endsAt),
        gt(mockSlots.endsAt, startsAt)
      )
    )
    .limit(1);

  if (existingOverlaps.length > 0) {
    throw new Error("Slot overlaps with an existing active slot");
  }

  const slotId = `slot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  await db.transaction(async (tx) => {
    await tx.insert(mockSlots).values({
      id: slotId,
      mentorId: currentUser.id,
      startsAt,
      endsAt,
      notes: notes || null,
      status: "available",
    });

    await createAuditRecord({
      action: "mock_slot_created",
      entityType: "mock_slot",
      entityId: slotId,
      metadata: { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() },
    });
  });

  revalidatePath("/connect");
  revalidatePath("/profile");

  return { success: true, id: slotId };
}

export async function cancelMockSlotAction(slotId: string) {
  const currentUser = await requireUser();

  const slotResult = await db
    .select()
    .from(mockSlots)
    .where(eq(mockSlots.id, slotId))
    .limit(1);

  const slot = slotResult[0];
  if (!slot) {
    throw new Error("Slot not found");
  }

  // Authorization: Only the slot creator (or admin) can cancel the slot
  if (slot.mentorId !== currentUser.id && currentUser.role !== "admin") {
    throw new Error("Unauthorized: You can only cancel your own slots");
  }

  if (slot.status === "cancelled") {
    throw new Error("Slot is already cancelled");
  }

  await db.transaction(async (tx) => {
    // Find active bookings before cancelling
    const activeBookings = await tx
      .select()
      .from(mockBookings)
      .where(
        and(
          eq(mockBookings.slotId, slotId),
          eq(mockBookings.status, "confirmed")
        )
      );

    // Cancel any active bookings for this slot
    await tx
      .update(mockBookings)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(mockBookings.slotId, slotId),
          eq(mockBookings.status, "confirmed")
        )
      );

    // Notify affected students
    for (const ab of activeBookings) {
      await createNotificationTx(tx, {
        userId: ab.studentId,
        type: "mock_slot_cancelled",
        title: "Mock Interview Slot Cancelled",
        body: "An upcoming mock interview slot was cancelled by the mentor.",
        href: "/profile",
      });
    }

    // Cancel slot
    await tx
      .update(mockSlots)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(mockSlots.id, slotId));

    await createAuditRecord({
      action: "mock_slot_cancelled",
      entityType: "mock_slot",
      entityId: slotId,
    });
  });

  revalidatePath("/connect");
  revalidatePath("/profile");

  return { success: true };
}

export async function bookMockSlotAction(slotId: string) {
  const currentUser = await requireUser();

  // Authorization: Only students (or admins) can book mock interview slots
  if (currentUser.role !== "student" && currentUser.role !== "admin") {
    throw new Error("Only students can book mock interview slots");
  }

  let bookingId: string = "";

  await db.transaction(async (tx) => {
    // 1. Lock slot row with FOR UPDATE to eliminate race conditions
    const [slot] = await tx
      .select()
      .from(mockSlots)
      .where(eq(mockSlots.id, slotId))
      .for("update");

    if (!slot) {
      throw new Error("Slot not found");
    }

    if (slot.mentorId === currentUser.id) {
      throw new Error("Cannot book your own slot");
    }

    if (slot.status !== "available") {
      throw new Error("Slot is no longer available");
    }

    if (slot.startsAt <= new Date()) {
      throw new Error("Cannot book past slots");
    }

    // 2. Concurrency safety check: verify no active confirmed booking exists for this slot
    const existingBooking = await tx
      .select()
      .from(mockBookings)
      .where(
        and(
          eq(mockBookings.slotId, slotId),
          eq(mockBookings.status, "confirmed")
        )
      )
      .limit(1);

    if (existingBooking.length > 0) {
      throw new Error("Slot is already booked");
    }

    // 3. Mark slot as booked
    await tx
      .update(mockSlots)
      .set({
        status: "booked",
        updatedAt: new Date(),
      })
      .where(eq(mockSlots.id, slotId));

    // 4. Create confirmed booking
    bookingId = `booking_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await tx.insert(mockBookings).values({
      id: bookingId,
      slotId: slot.id,
      studentId: currentUser.id,
      status: "confirmed",
    });

    // 5. Notify mentor
    await createNotificationTx(tx, {
      userId: slot.mentorId,
      type: "mock_booking",
      title: "New Mock Interview Booking",
      body: `${currentUser.name || "A student"} booked your mock interview slot.`,
      href: "/profile",
    });

    await createAuditRecord({
      action: "mock_slot_booked",
      entityType: "mock_booking",
      entityId: bookingId,
      metadata: { slotId, mentorId: slot.mentorId },
    });
  });

  revalidatePath("/connect");
  revalidatePath("/profile");

  return { success: true, id: bookingId };
}

export async function cancelMockBookingAction(bookingId: string) {
  const currentUser = await requireUser();

  const bookingRows = await db
    .select({
      id: mockBookings.id,
      slotId: mockBookings.slotId,
      studentId: mockBookings.studentId,
      status: mockBookings.status,
      slotMentorId: mockSlots.mentorId,
      slotStartsAt: mockSlots.startsAt,
      slotStatus: mockSlots.status,
    })
    .from(mockBookings)
    .innerJoin(mockSlots, eq(mockBookings.slotId, mockSlots.id))
    .where(eq(mockBookings.id, bookingId))
    .limit(1);

  const booking = bookingRows[0];
  if (!booking) {
    throw new Error("Booking not found");
  }

  // Authorization: Student who booked it, mentor of the slot, or admin
  const isStudent = booking.studentId === currentUser.id;
  const isMentor = booking.slotMentorId === currentUser.id;
  const isAdmin = currentUser.role === "admin";

  if (!isStudent && !isMentor && !isAdmin) {
    throw new Error("Unauthorized: You cannot cancel this booking");
  }

  if (booking.status !== "confirmed") {
    throw new Error("Booking is not in confirmed status");
  }

  await db.transaction(async (tx) => {
    // 1. Mark booking cancelled
    await tx
      .update(mockBookings)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(mockBookings.id, bookingId));

    // 2. Adjust slot status:
    // If student cancels and slot starts in the future, return slot to 'available'
    // If mentor cancels, mark slot as 'cancelled'
    if (isStudent && booking.slotStartsAt > new Date()) {
      await tx
        .update(mockSlots)
        .set({
          status: "available",
          updatedAt: new Date(),
        })
        .where(eq(mockSlots.id, booking.slotId));

      // Notify mentor that student cancelled
      await createNotificationTx(tx, {
        userId: booking.slotMentorId,
        type: "mock_booking_cancelled",
        title: "Mock Booking Cancelled",
        body: `${currentUser.name || "A student"} cancelled their mock interview booking.`,
        href: "/profile",
      });
    } else {
      await tx
        .update(mockSlots)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(mockSlots.id, booking.slotId));

      // Notify student that mentor cancelled
      await createNotificationTx(tx, {
        userId: booking.studentId,
        type: "mock_booking_cancelled",
        title: "Mock Interview Cancelled",
        body: "Your upcoming mock interview session was cancelled by the mentor.",
        href: "/profile",
      });
    }

    await createAuditRecord({
      action: "mock_booking_cancelled",
      entityType: "mock_booking",
      entityId: bookingId,
      metadata: { slotId: booking.slotId, cancelledBy: currentUser.id },
    });
  });

  revalidatePath("/connect");
  revalidatePath("/profile");

  return { success: true };
}

