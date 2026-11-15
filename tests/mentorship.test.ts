import { describe, it, expect, vi, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../src/server/db";
import { user, mockSlots, mockBookings, mentorshipRequests } from "../src/server/db/schema";
import {
  createMentorshipRequestAction,
  acceptMentorshipRequestAction,
  rejectMentorshipRequestAction,
} from "../src/server/actions/mentorship";
import {
  createMockSlotAction,
  cancelMockSlotAction,
  bookMockSlotAction,
  cancelMockBookingAction,
} from "../src/server/actions/mock-interviews";
import {
  getMentorshipRequestById,
  getMyMentorshipRequests,
  getAvailableSlotsForMentor,
  getBookingById,
} from "../src/server/queries/mentorship";
import { getCurrentUser, requireUser, requireRole } from "../src/server/auth-helpers";

const studentUser1 = { id: "test_student_1", name: "Student One", email: "student1@test.com", role: "student" } as const;
const studentUser2 = { id: "test_student_2", name: "Student Two", email: "student2@test.com", role: "student" } as const;
const mentorUser1 = { id: "test_mentor_1", name: "Mentor One", email: "mentor1@test.com", role: "alumni" } as const;
const mentorUser2 = { id: "test_mentor_2", name: "Mentor Two", email: "mentor2@test.com", role: "alumni" } as const;
const adminUser = { id: "test_admin", name: "Admin", email: "admin@test.com", role: "admin" } as const;

vi.mock("../src/server/auth-helpers", () => ({
  getCurrentUser: vi.fn(),
  requireUser: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

async function setUser(currentUser: typeof studentUser1 | typeof studentUser2 | typeof mentorUser1 | typeof mentorUser2 | typeof adminUser | null) {
  // @ts-expect-error mock implementation
  requireUser.mockImplementation(() => (currentUser ? Promise.resolve(currentUser) : Promise.reject(new Error("Unauthorized"))));
  // @ts-expect-error mock implementation
  getCurrentUser.mockImplementation(() => Promise.resolve(currentUser));
  // @ts-expect-error mock implementation
  requireRole.mockImplementation((required: string) => {
    if (!currentUser) throw new Error("Unauthorized");
    if (currentUser.role !== required && currentUser.role !== "admin") {
      throw new Error(`Forbidden: requires role ${required}`);
    }
    return Promise.resolve(currentUser);
  });
}

describe("Phase 2.7 Mentorship & Mock Interviews Integration", () => {
  beforeAll(async () => {
    // Ensure all test users exist in DB
    const testUsers = [studentUser1, studentUser2, mentorUser1, mentorUser2, adminUser];
    for (const u of testUsers) {
      const existing = await db.select().from(user).where(eq(user.id, u.id));
      if (existing.length === 0) {
        await db.insert(user).values({
          id: u.id,
          name: u.name,
          email: u.email,
          emailVerified: true,
          role: u.role,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Clean up test data from any previous test runs
    for (const u of testUsers) {
      await db.delete(mockBookings).where(eq(mockBookings.studentId, u.id));
      await db.delete(mockSlots).where(eq(mockSlots.mentorId, u.id));
      await db.delete(mentorshipRequests).where(eq(mentorshipRequests.studentId, u.id));
      await db.delete(mentorshipRequests).where(eq(mentorshipRequests.mentorId, u.id));
    }
  });


  describe("Mentorship Requests", () => {
    it("1. Student can request mentorship", async () => {
      await setUser(studentUser1);
      const res = await createMentorshipRequestAction({
        mentorId: mentorUser1.id,
        message: "Can we connect for career guidance?",
      });

      expect(res.success).toBe(true);
      expect(res.id).toBeDefined();

      const req = await getMentorshipRequestById(res.id);
      expect(req).not.toBeNull();
      expect(req?.studentId).toBe(studentUser1.id);
      expect(req?.mentorId).toBe(mentorUser1.id);
      expect(req?.status).toBe("pending");
      expect(req?.message).toBe("Can we connect for career guidance?");
    });

    it("2. Non-student cannot create mentorship request", async () => {
      await setUser(mentorUser2);
      await expect(
        createMentorshipRequestAction({
          mentorId: mentorUser1.id,
          message: "Mentor trying to request mentorship",
        })
      ).rejects.toThrow("Only students can initiate mentorship requests");
    });

    it("3. Mentor can accept or reject their request", async () => {
      // Create request from student2 to mentor1
      await setUser(studentUser2);
      const res = await createMentorshipRequestAction({
        mentorId: mentorUser1.id,
        message: "Need interview tips",
      });

      // Mentor accepts
      await setUser(mentorUser1);
      const acceptRes = await acceptMentorshipRequestAction(res.id);
      expect(acceptRes.success).toBe(true);

      let req = await getMentorshipRequestById(res.id);
      expect(req?.status).toBe("accepted");
      expect(req?.respondedAt).not.toBeNull();

      // Create another request from student2 to mentor2 and reject
      await setUser(studentUser2);
      const res2 = await createMentorshipRequestAction({
        mentorId: mentorUser2.id,
        message: "Resume review?",
      });

      await setUser(mentorUser2);
      const rejectRes = await rejectMentorshipRequestAction(res2.id);
      expect(rejectRes.success).toBe(true);

      req = await getMentorshipRequestById(res2.id);
      expect(req?.status).toBe("rejected");
    });

    it("4. Student cannot accept or reject the mentor's decision", async () => {
      await setUser(studentUser1);
      const myReqs = await getMyMentorshipRequests();
      const pendingReq = myReqs.find((r) => r.status === "pending");
      expect(pendingReq).toBeDefined();

      // Student trying to accept their own request
      await expect(acceptMentorshipRequestAction(pendingReq!.id)).rejects.toThrow(
        "Unauthorized: You can only accept mentorship requests addressed to you"
      );

      // Student trying to reject their own request
      await expect(rejectMentorshipRequestAction(pendingReq!.id)).rejects.toThrow(
        "Unauthorized: You can only reject mentorship requests addressed to you"
      );
    });

    it("5. Duplicate active mentorship request is rejected", async () => {
      await setUser(studentUser1);
      // studentUser1 already has an active request with mentorUser1
      await expect(
        createMentorshipRequestAction({
          mentorId: mentorUser1.id,
          message: "Another request",
        })
      ).rejects.toThrow("An active mentorship request already exists with this mentor");
    });
  });

  describe("Mock Interview Slots", () => {
    let createdSlotId: string;

    it("6. Alumni can create a slot", async () => {
      await setUser(mentorUser1);
      const startsAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // in 2 days
      const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000); // 1 hour duration

      const res = await createMockSlotAction({
        startsAt,
        endsAt,
        notes: "Frontend & React System Design",
      });

      expect(res.success).toBe(true);
      expect(res.id).toBeDefined();
      createdSlotId = res.id;

      const available = await getAvailableSlotsForMentor(mentorUser1.id);
      expect(available.some((s) => s.id === createdSlotId)).toBe(true);
    });

    it("7. Student cannot create a slot", async () => {
      await setUser(studentUser1);
      const startsAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
      const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

      await expect(
        createMockSlotAction({
          startsAt,
          endsAt,
          notes: "Student creating slot",
        })
      ).rejects.toThrow("Only alumni can create mock interview slots");
    });

    it("8. Mentor cannot modify/cancel another mentor's slot", async () => {
      await setUser(mentorUser2);
      await expect(cancelMockSlotAction(createdSlotId)).rejects.toThrow(
        "Unauthorized: You can only cancel your own slots"
      );
    });
  });

  describe("Mock Bookings & Double-Booking Protection", () => {
    let testSlotId: string;
    let testBookingId: string;

    beforeAll(async () => {
      // Create a fresh slot for mentor 1
      await setUser(mentorUser1);
      const startsAt = new Date(Date.now() + 96 * 60 * 60 * 1000);
      const endsAt = new Date(startsAt.getTime() + 45 * 60 * 1000);
      const res = await createMockSlotAction({
        startsAt,
        endsAt,
        notes: "DSA Mock Interview",
      });
      testSlotId = res.id;
    });

    it("9. Student can book available slot", async () => {
      await setUser(studentUser1);
      const res = await bookMockSlotAction(testSlotId);
      expect(res.success).toBe(true);
      expect(res.id).toBeDefined();
      testBookingId = res.id;

      const booking = await getBookingById(testBookingId);
      expect(booking).not.toBeNull();
      expect(booking?.studentId).toBe(studentUser1.id);
      expect(booking?.status).toBe("confirmed");
    });

    it("10. Student cannot book own slot (if mentor)", async () => {
      // Create slot for mentor 2
      await setUser(mentorUser2);
      const startsAt = new Date(Date.now() + 100 * 60 * 60 * 1000);
      const endsAt = new Date(startsAt.getTime() + 45 * 60 * 1000);
      const res = await createMockSlotAction({ startsAt, endsAt });

      // Admin or mentor user trying to book their own slot
      await expect(bookMockSlotAction(res.id)).rejects.toThrow();
    });

    it("11. Double booking is prevented", async () => {
      // Student 2 attempts to book the already booked testSlotId
      await setUser(studentUser2);
      await expect(bookMockSlotAction(testSlotId)).rejects.toThrow("Slot is no longer available");
    });

    it("12. Unrelated student cannot access another student's booking", async () => {
      await setUser(studentUser2);
      await expect(getBookingById(testBookingId)).rejects.toThrow(
        "Forbidden: You are not authorized to view this booking"
      );
    });

    it("13. Mentor can cancel their own slot/booking", async () => {
      // Mentor 1 creates a new slot
      await setUser(mentorUser1);
      const startsAt = new Date(Date.now() + 120 * 60 * 60 * 1000);
      const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
      const slotRes = await createMockSlotAction({ startsAt, endsAt });

      // Student 2 books it
      await setUser(studentUser2);
      const bookingRes = await bookMockSlotAction(slotRes.id);

      // Mentor cancels booking
      await setUser(mentorUser1);
      const cancelRes = await cancelMockBookingAction(bookingRes.id);
      expect(cancelRes.success).toBe(true);

      const booking = await getBookingById(bookingRes.id);
      expect(booking?.status).toBe("cancelled");
    });

    it("14. Student can cancel their own booking (slot becomes available again)", async () => {
      // Student 1 cancels testBookingId
      await setUser(studentUser1);
      const cancelRes = await cancelMockBookingAction(testBookingId);
      expect(cancelRes.success).toBe(true);

      const booking = await getBookingById(testBookingId);
      expect(booking?.status).toBe("cancelled");

      // Verify slot is now available again for Student 2 to book
      await setUser(studentUser2);
      const rebookRes = await bookMockSlotAction(testSlotId);
      expect(rebookRes.success).toBe(true);
    });
  });
});
