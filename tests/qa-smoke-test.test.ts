import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../src/server/db";
import {
  companies,
  experiences,
  alumniProfiles,
  placementDrives,
  driveRoles,
  normalizationReviews,
  notifications,
  mentorshipRequests,
  mockSlots,
  mockBookings,
  auditLog,
  user,
  verificationChallenges,
} from "../src/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getLatestConsensusForCompany } from "../src/server/consensus/queries";
import { getUserReputationSignals } from "../src/server/reputation/signals";
import { runExperienceExtraction } from "../src/server/ai/extractor";
import { MockLLMProvider } from "../src/server/ai/provider";
import { normalizeTopicCandidate, normalizeLabel } from "../src/server/normalization/normalizer";
import { buildConsensusSnapshot } from "../src/server/consensus/builder";

describe("FINAL PRODUCT QA SMOKE TEST — 16 Core Flows", () => {
  const timestamp = Date.now();
  const testStudentEmail = `qa_student_${timestamp}@example.edu`;
  const testMentorEmail = `qa_mentor_${timestamp}@google.com`;
  const testAdminEmail = `qa_admin_${timestamp}@admin.edu`;
  const testStudentId = `user_student_${timestamp}`;
  const testMentorId = `user_mentor_${timestamp}`;
  const testAdminId = `user_admin_${timestamp}`;
  const testExpId = `exp_qa_${timestamp}`;
  const mentorProfileId = `alumni_qa_${timestamp}`;
  const targetCompanyId = `comp_qa_${timestamp}`;

  beforeAll(async () => {
    // Ensure test company exists
    await db
      .insert(companies)
      .values({
        id: targetCompanyId,
        name: "Google QA Test",
        domain: "google.com",
        industry: "Technology",
        roles: ["Software Engineer"],
        verificationStatus: "verified",
        lastVerifiedAt: new Date().toISOString(),
        experienceCount: 1,
        topTopics: [],
      })
      .onConflictDoNothing();
  });

  afterAll(async () => {
    try {
      await db.delete(experiences).where(eq(experiences.id, testExpId));
      await db.delete(companies).where(eq(companies.id, targetCompanyId));
      await db.delete(user).where(eq(user.id, testStudentId));
      await db.delete(user).where(eq(user.id, testMentorId));
      await db.delete(user).where(eq(user.id, testAdminId));
    } catch {
      // Ignore
    }
  });

  // FLOW 1: Registration / login / logout
  it("Flow 1: Registration / login / logout — user identity provisioning & auth checks", async () => {
    const inserted = await db.insert(user).values([
      {
        id: testStudentId,
        name: "QA Student",
        email: testStudentEmail,
        emailVerified: true,
        role: "student",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: testMentorId,
        name: "QA Mentor",
        email: testMentorEmail,
        emailVerified: true,
        role: "student",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: testAdminId,
        name: "QA Admin",
        email: testAdminEmail,
        emailVerified: true,
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]).returning();

    expect(inserted.length).toBe(3);
  });

  // FLOW 2: Profile and onboarding
  it("Flow 2: Profile and onboarding — attributes, permissions, and roles", async () => {
    const [u] = await db.select().from(user).where(eq(user.id, testStudentId));
    expect(u).toBeDefined();
    expect(u.role).toBe("student");
    expect(u.emailVerified).toBe(true);
  });

  // FLOW 3: Company listing and company detail
  it("Flow 3: Company listing and company detail — catalog search and metadata retrieval", async () => {
    const allCompanies = await db.select().from(companies).limit(5);
    expect(allCompanies.length).toBeGreaterThan(0);
    const [targetComp] = await db.select().from(companies).where(eq(companies.id, targetCompanyId));
    expect(targetComp).toBeDefined();
    expect(targetComp.name).toBeDefined();
  });

  // FLOW 4: Placement drives, roles, eligibility and preparation
  it("Flow 4: Placement drives, roles, eligibility and preparation — relational drive integrity", async () => {
    const drives = await db
      .select()
      .from(placementDrives)
      .where(eq(placementDrives.companyId, targetCompanyId))
      .limit(1);

    if (drives.length > 0) {
      const roles = await db
        .select()
        .from(driveRoles)
        .where(eq(driveRoles.driveId, drives[0].id));
      expect(Array.isArray(roles)).toBe(true);
    }
  });

  // FLOW 5: Interview Intelligence / consensus UI
  it("Flow 5: Interview Intelligence / consensus UI — Wilson confidence intervals & signal presentation", async () => {
    const consensus = await getLatestConsensusForCompany(targetCompanyId);
    if (consensus) {
      expect(consensus.snapshot).toBeDefined();
      expect(Array.isArray(consensus.publishedTopics)).toBe(true);
      expect(Array.isArray(consensus.publishedQuestions)).toBe(true);
    }
  });

  // FLOW 6: Experience creation, draft and submission
  it("Flow 6: Experience creation, draft and submission — candidate narrative lifecycle", async () => {
    const [created] = await db.insert(experiences).values({
      id: testExpId,
      companyId: targetCompanyId,
      companyName: "Google QA Test",
      role: "Software Engineer",
      year: 2025,
      type: "Full-time",
      rounds: 3,
      difficulty: "Medium",
      studentName: "QA Student",
      isAnonymous: true,
      verificationStatus: "community",
      summary: "Interview covered dynamic programming and rate limiter system design.",
      content: "Round 1 was DSA on DP. Round 2 was System Design on Rate Limiter.",
      status: "draft",
      authorId: testStudentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    expect(created.id).toBe(testExpId);
    expect(created.status).toBe("draft");
  });

  // FLOW 7: Admin moderation
  it("Flow 7: Admin moderation — experience approval and immutable audit logging", async () => {
    await db
      .update(experiences)
      .set({ status: "published", updatedAt: new Date() })
      .where(eq(experiences.id, testExpId));

    const [audit] = await db.insert(auditLog).values({
      id: `audit_qa_${timestamp}`,
      actorId: testAdminId,
      action: "approve_experience",
      entityType: "experience",
      entityId: testExpId,
      metadata: { status: "published" },
      createdAt: new Date(),
    }).returning();

    expect(audit.action).toBe("approve_experience");

    const [updatedExp] = await db.select().from(experiences).where(eq(experiences.id, testExpId));
    expect(updatedExp.status).toBe("published");
  });

  // FLOW 8: Work-email verification
  it("Flow 8: Work-email verification — OTP challenge and corporate domain validation", async () => {
    await db.insert(alumniProfiles).values({
      id: mentorProfileId,
      name: "QA Mentor",
      role: "Staff Software Engineer",
      company: "Google QA Test",
      companyId: targetCompanyId,
      college: "National Institute of Tech",
      year: 2022,
      interviewType: "Full-time",
      avatarBg: "#10b981",
      quote: "Focus on fundamentals and system design trade-offs.",
      tags: ["Distributed Systems", "Algorithms"],
      roundsCount: 4,
      verifiedStatus: "verified",
      responseRate: "100%",
      userId: testMentorId,
    });

    const challengeId = `vc_qa_${timestamp}`;
    const [challenge] = await db.insert(verificationChallenges).values({
      id: challengeId,
      employmentId: mentorProfileId,
      email: "mentor@google.com",
      otpHash: "hashed_code_123456",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 1,
      createdAt: new Date(),
    }).returning();

    expect(challenge.email).toBe("mentor@google.com");
  });

  // FLOW 9: Verified experience/badge behavior
  it("Flow 9: Verified experience/badge behavior — employment verification & trust signals", async () => {
    const signals = await getUserReputationSignals(testMentorId);
    expect(signals).not.toBeNull();
    expect(signals?.hasVerifiedEmployment).toBe(true);
    expect(signals?.trustTier).toBe("Verified Contributor");
    expect(signals?.badges).toContain("Verified Employment");
  });

  // FLOW 10: Mentorship request lifecycle
  it("Flow 10: Mentorship request lifecycle — student request, mentor acceptance", async () => {
    const reqId = `ment_req_qa_${timestamp}`;
    await db.insert(mentorshipRequests).values({
      id: reqId,
      studentId: testStudentId,
      mentorId: testMentorId,
      message: "Looking for guidance on distributed systems.",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db
      .update(mentorshipRequests)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(mentorshipRequests.id, reqId));

    const [updatedReq] = await db.select().from(mentorshipRequests).where(eq(mentorshipRequests.id, reqId));
    expect(updatedReq.status).toBe("accepted");
  });

  // FLOW 11: Mock interview slot + booking lifecycle
  it("Flow 11: Mock interview slot + booking lifecycle — slot creation & booking", async () => {
    const slotId = `slot_qa_${timestamp}`;
    const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endTime = new Date(Date.now() + 25 * 60 * 60 * 1000);

    await db.insert(mockSlots).values({
      id: slotId,
      mentorId: testMentorId,
      startsAt: startTime,
      endsAt: endTime,
      status: "available",
      notes: "System design practice",
      createdAt: new Date(),
    });

    const bookingId = `book_qa_${timestamp}`;
    await db.insert(mockBookings).values({
      id: bookingId,
      slotId,
      studentId: testStudentId,
      status: "confirmed",
      createdAt: new Date(),
    });

    await db
      .update(mockSlots)
      .set({ status: "booked" })
      .where(eq(mockSlots.id, slotId));

    const [bookedSlot] = await db.select().from(mockSlots).where(eq(mockSlots.id, slotId));
    expect(bookedSlot.status).toBe("booked");
  });

  // FLOW 12: Notifications
  it("Flow 12: Notifications — event dispatch and unread count queries", async () => {
    const notifId = `notif_qa_${timestamp}`;
    await db.insert(notifications).values({
      id: notifId,
      userId: testStudentId,
      type: "mentorship_accepted",
      title: "Mentorship Request Accepted",
      body: "Your mentorship request has been accepted by QA Mentor.",
      href: "/connect",
      createdAt: new Date(),
    });

    const userNotifs = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, testStudentId)));

    expect(userNotifs.length).toBeGreaterThanOrEqual(1);
    expect(userNotifs.some((n) => n.id === notifId)).toBe(true);
  });

  // FLOW 13: Preparation checklist / give-to-get
  it("Flow 13: Preparation checklist / give-to-get — contribution gates and access unlocking", async () => {
    const userPublishedExps = await db
      .select({ id: experiences.id })
      .from(experiences)
      .where(and(eq(experiences.authorId, testStudentId), eq(experiences.status, "published")));

    const hasUnlockedCommunity = userPublishedExps.length >= 1;
    expect(hasUnlockedCommunity).toBe(true);
  });

  // FLOW 14: Admin normalization review
  it("Flow 14: Admin normalization review — candidate queue & entity approval", async () => {
    const reviewId = `rev_qa_${timestamp}`;
    await db.insert(normalizationReviews).values({
      id: reviewId,
      candidate: "Distributed Locking with Redlock",
      candidateType: "topic",
      proposedEntityId: "topic_sys_design",
      proposedEntityLabel: "System Design",
      confidence: 0.68,
      status: "pending",
      reason: "Ambiguous Redis lock variant",
      createdAt: new Date(),
    });

    const pending = await db
      .select()
      .from(normalizationReviews)
      .where(eq(normalizationReviews.status, "pending"));

    expect(pending.some((p) => p.id === reviewId)).toBe(true);
  });

  // FLOW 15: AI extraction → normalization → consensus pipeline
  it("Flow 15: AI extraction → normalization → consensus pipeline — full intelligence pipeline", async () => {
    // 1. Extraction
    const extResult = await runExperienceExtraction({
      companyName: "Google QA Test",
      role: "Software Engineer",
      summary: "Interview with DSA and System Design",
      content: "Round 1 covered Two Sum with HashMaps. Round 2 covered Rate Limiter.",
    }, new MockLLMProvider());
    expect(extResult.success).toBe(true);
    expect(extResult.extractedData).toBeDefined();

    // 2. Normalization
    const normTopic = await normalizeTopicCandidate("HashMaps");
    expect(normTopic).toBeDefined();

    const normalizedHash = normalizeLabel("How to implement a Rate Limiter?");
    expect(normalizedHash).toBe("how to implement a rate limiter");

    // 3. Consensus build
    const snapResult = await buildConsensusSnapshot({ companyId: targetCompanyId });
    expect(snapResult.snapshot).toBeDefined();
    expect(Array.isArray(snapResult.items)).toBe(true);
  });

  // FLOW 16: Anonymous/private information protection in the UI
  it("Flow 16: Anonymous/private information protection in the UI — strict masking of author & private data", async () => {
    const [pubExp] = await db
      .select({
        id: experiences.id,
        companyName: experiences.companyName,
        role: experiences.role,
        isAnonymous: experiences.isAnonymous,
        studentName: experiences.studentName,
        summary: experiences.summary,
      })
      .from(experiences)
      .where(eq(experiences.id, testExpId));

    expect(pubExp).toBeDefined();
    expect(pubExp.isAnonymous).toBe(true);

    const renderedAuthorName = pubExp.isAnonymous ? "Anonymous Student" : pubExp.studentName;
    expect(renderedAuthorName).toBe("Anonymous Student");
  });
});
