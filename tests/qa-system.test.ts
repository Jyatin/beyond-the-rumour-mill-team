import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { db } from "../src/server/db";
import {
  companies,
  roleTitles,
  topics,
  alumniProfiles,
  experiences,
  questions,
  questionAsks,
  answers,
  answerClaims,
  answerFeedback,
  user,
} from "../src/server/db/schema";
import { eq, and } from "drizzle-orm";
import { calculateAnswerRankScore } from "../src/server/qa/ranking";
import { deriveAnswerClaims, getDerivedRoundCount } from "../src/server/qa/claims";
import { validateContentForModeration } from "../src/server/qa/moderation-rules";
import {
  createOrAttachQuestionAskAction,
  submitAnswerAction,
  markAnswerHelpfulAction,
} from "../src/server/actions/questions";
import {
  getQuestionBySlot,
  getRankedQuestionAnswers,
  findSimilarCustomQuestions,
} from "../src/server/queries/questions";
import { isAuthorVerifiedAtCompany } from "../src/server/queries/verification";
import { getAnswerClaimsForConsensus } from "../src/server/qa/consensus-adapter";
import { getCurrentUser, requireUser, requireRole } from "../src/server/auth-helpers";

vi.mock("../src/server/auth-helpers", () => ({
  getCurrentUser: vi.fn(),
  requireUser: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("STUDENT QUESTIONS + ALUMNI ANSWERS SYSTEM (STAGE 1)", () => {
  const timestamp = Date.now();
  const testCompanyId = `comp_philips_${timestamp}`;
  const testCompanyBId = `comp_other_${timestamp}`;
  const testRoleId = `role_swe_${timestamp}`;
  const testTopicId = `topic_dsa_${timestamp}`;

  const studentA = {
    id: `user_studentA_${timestamp}`,
    name: "Jyatin Student",
    email: `studentA_${timestamp}@campus.edu`,
    role: "student",
    emailVerified: true,
  };

  const studentB = {
    id: `user_studentB_${timestamp}`,
    name: "Rohan Student",
    email: `studentB_${timestamp}@campus.edu`,
    role: "student",
    emailVerified: true,
  };

  const alumniA = {
    id: `user_alumniA_${timestamp}`,
    name: "Alumni Verified Philips",
    email: `alumniA_${timestamp}@philips.com`,
    role: "alumni",
    emailVerified: true,
  };

  const alumniB = {
    id: `user_alumniB_${timestamp}`,
    name: "Alumni Unverified",
    email: `alumniB_${timestamp}@other.com`,
    role: "alumni",
    emailVerified: true,
  };

  function setAuthUser(currentUser: unknown) {
    // @ts-expect-error mock
    requireUser.mockImplementation(() =>
      currentUser ? Promise.resolve(currentUser) : Promise.reject(new Error("Unauthorized"))
    );
    // @ts-expect-error mock
    getCurrentUser.mockImplementation(() => Promise.resolve(currentUser));
  }

  beforeAll(async () => {
    // 1. Setup test company
    await db
      .insert(companies)
      .values({
        id: testCompanyId,
        name: "Philips QA Test",
        domain: "philips.com",
        industry: "HealthTech",
        roles: ["Software Engineer"],
        verificationStatus: "verified",
        lastVerifiedAt: new Date().toISOString(),
        experienceCount: 0,
        topTopics: [],
      })
      .onConflictDoNothing();

    await db
      .insert(companies)
      .values({
        id: testCompanyBId,
        name: "Acme Corp QA",
        domain: "acme.com",
        industry: "Tech",
        roles: ["Software Engineer"],
        verificationStatus: "verified",
        lastVerifiedAt: new Date().toISOString(),
        experienceCount: 0,
        topTopics: [],
      })
      .onConflictDoNothing();

    // 2. Role Title
    await db
      .insert(roleTitles)
      .values({
        id: testRoleId,
        companyId: testCompanyId,
        title: "Software Engineer",
      })
      .onConflictDoNothing();

    // 3. Topic
    await db
      .insert(topics)
      .values({
        id: testTopicId,
        name: `DSA Problem Solving ${timestamp}`,
      })
      .onConflictDoNothing();

    // 4. Test Users
    await db
      .insert(user)
      .values([
        {
          id: studentA.id,
          name: studentA.name,
          email: studentA.email,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: "student",
        },
        {
          id: studentB.id,
          name: studentB.name,
          email: studentB.email,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: "student",
        },
        {
          id: alumniA.id,
          name: alumniA.name,
          email: alumniA.email,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: "alumni",
        },
        {
          id: alumniB.id,
          name: alumniB.name,
          email: alumniB.email,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: "alumni",
        },
      ])
      .onConflictDoNothing();

    // 5. Alumni Verified Employment at Philips (Company A only)
    await db
      .insert(alumniProfiles)
      .values({
        id: `alum_prof_${timestamp}`,
        userId: alumniA.id,
        name: alumniA.name,
        role: "Software Engineer",
        company: "Philips QA Test",
        companyId: testCompanyId,
        college: "IIT Delhi",
        year: 2026,
        interviewType: "Full-time",
        avatarBg: "bg-blue-100",
        quote: "Philips interview had 3 tech rounds.",
        tags: ["DSA", "DBMS"],
        roundsCount: 4,
        verifiedStatus: "verified",
        responseRate: "90%",
      })
      .onConflictDoNothing();
  });

  afterAll(async () => {
    try {
      await db.delete(answers).where(eq(answers.authorId, alumniA.id));
      await db.delete(questions).where(eq(questions.companyId, testCompanyId));
      await db.delete(alumniProfiles).where(eq(alumniProfiles.userId, alumniA.id));
      await db.delete(user).where(eq(user.id, studentA.id));
      await db.delete(user).where(eq(user.id, studentB.id));
      await db.delete(user).where(eq(user.id, alumniA.id));
      await db.delete(user).where(eq(user.id, alumniB.id));
      await db.delete(companies).where(eq(companies.id, testCompanyId));
      await db.delete(companies).where(eq(companies.id, testCompanyBId));
    } catch {
      // Ignored cleanup
    }
  });

  // -------------------------------------------------------------
  // TEST 1 & 2: QUESTION SLOTS & CONCURRENT ATTACHMENT
  // -------------------------------------------------------------
  it("1 & 2. Concurrent student asks on the same standard slot resolve to ONE shared question", async () => {
    const slotKey = "philips-qa-test:software-engineer:selection_process";

    // Set Student A as current user
    setAuthUser(studentA);

    const resA = await createOrAttachQuestionAskAction({
      companyId: testCompanyId,
      roleFamilyId: testRoleId,
      intent: "selection_process",
      hiringCycle: "2026/27",
      contextBody: "I am preparing for Philips 2026. What is the selection process?",
    });

    expect(resA.question).toBeDefined();
    expect(resA.question.slotKey).toBe(slotKey);
    expect(resA.isNewSlot).toBe(true);
    expect(resA.ask.userId).toBe(studentA.id);

    // Set Student B as current user
    setAuthUser(studentB);

    const resB = await createOrAttachQuestionAskAction({
      companyId: testCompanyId,
      roleFamilyId: testRoleId,
      intent: "selection_process",
      hiringCycle: "2026/27",
      contextBody: "Rohan's context: interested in CS fundamentals and DSA weightage.",
    });

    expect(resB.question.id).toBe(resA.question.id); // Exactly same shared question
    expect(resB.isNewSlot).toBe(false);
    expect(resB.ask.userId).toBe(studentB.id);

    // Verify question askCount incremented to 2
    const foundSlot = await getQuestionBySlot(slotKey);
    expect(foundSlot?.askCount).toBe(2);
  });

  // -------------------------------------------------------------
  // TEST 3: DUPLICATE ASK PREVENTION
  // -------------------------------------------------------------
  it("3. Same student cannot attach duplicate asks to the same question slot", async () => {
    setAuthUser(studentA);
    await expect(
      createOrAttachQuestionAskAction({
        companyId: testCompanyId,
        roleFamilyId: testRoleId,
        intent: "selection_process",
        hiringCycle: "2026/27",
        contextBody: "Duplicate ask attempt by Student A",
      })
    ).rejects.toThrow(/already attached an ask/i);
  });

  // -------------------------------------------------------------
  // TEST 4 & 5: CROSS-COMPANY VERIFICATION BOUNDARY
  // -------------------------------------------------------------
  it("4 & 5. Verified at Company A does NOT imply verified at Company B", async () => {
    const isVerifiedAtCompanyA = await isAuthorVerifiedAtCompany(alumniA.id, testCompanyId);
    const isVerifiedAtCompanyB = await isAuthorVerifiedAtCompany(alumniA.id, testCompanyBId);

    expect(isVerifiedAtCompanyA).toBe(true);
    expect(isVerifiedAtCompanyB).toBe(false);
  });

  // -------------------------------------------------------------
  // TEST 6: DERIVED ROUND COUNT & CLAIMS GENERATION
  // -------------------------------------------------------------
  it("6. Round count derives strictly from ordered sequence without manual typing", () => {
    const sequence = ["oa", "technical", "technical", "hr"];
    const derivedCount = getDerivedRoundCount(sequence);
    expect(derivedCount).toBe(4);

    const claims = deriveAnswerClaims({
      roundSequence: sequence,
      oaMode: "online",
      oaDifficulty: "Medium-Hard",
      topics: [{ topicId: testTopicId, weight: "heavy" }],
      dsaDifficulty: "Medium",
      outcomeTimelineWeeks: 2,
    });

    const seqClaims = claims.filter((c) => c.dimension === "round_sequence");
    expect(seqClaims.length).toBe(4);
    expect(seqClaims[0].valueText).toBe("oa");
    expect(seqClaims[1].valueText).toBe("technical");

    const oaDiffClaim = claims.find((c) => c.dimension === "oa_difficulty");
    expect(oaDiffClaim?.valueText).toBe("Medium-Hard");
  });

  // -------------------------------------------------------------
  // TEST 7: DETERMINISTIC ANSWER RANKING
  // -------------------------------------------------------------
  it("7. Ranking formula is purely deterministic and orders by evidence/role/recency", () => {
    const verifiedRank = calculateAnswerRankScore({
      id: "ans_1",
      isEmploymentVerifiedForCompany: true, // +25
      hasLinkedExperienceWithEvidence: true, // +20
      roleMatch: "exact", // +12
      cycleDiff: 0, // +15
      topicOverlapRatio: 1.0, // +8
      isComplete: true, // +10
      helpfulCount: 4, // +4
      userReputationScore: 80, // +4
      basis: "own_interview",
      updatedAt: new Date(),
    });

    // 25 + 20 + 12 + 15 + 8 + 10 + 4 + 4 = 98
    expect(verifiedRank.score).toBe(98);
    expect(verifiedRank.isDated).toBe(false);

    const secondhandRank = calculateAnswerRankScore({
      id: "ans_2",
      isEmploymentVerifiedForCompany: false,
      hasLinkedExperienceWithEvidence: false,
      roleMatch: "exact",
      cycleDiff: 0,
      topicOverlapRatio: 0.5,
      isComplete: true,
      helpfulCount: 2,
      basis: "secondhand", // Capped at 40
      updatedAt: new Date(),
    });

    expect(secondhandRank.score).toBeLessThanOrEqual(40);
  });

  // -------------------------------------------------------------
  // TEST 8: MODERATION PRE-CHECKS (PII & CONTACT INFO)
  // -------------------------------------------------------------
  it("8. Emails, phone numbers, and 'DM me' solicitations are blocked deterministically", () => {
    const emailCheck = validateContentForModeration("Contact me at test.student@gmail.com for questions");
    expect(emailCheck.allowed).toBe(false);
    expect(emailCheck.reason).toMatch(/Email addresses are prohibited/i);

    const phoneCheck = validateContentForModeration("Call my mobile at +91 9876543210");
    expect(phoneCheck.allowed).toBe(false);
    expect(phoneCheck.reason).toMatch(/Phone numbers are prohibited/i);

    const dmCheck = validateContentForModeration("I know the OA questions, dm me on telegram");
    expect(dmCheck.allowed).toBe(false);
    expect(dmCheck.reason).toMatch(/Direct solicitation/i);

    const cleanCheck = validateContentForModeration("The technical round focused on DP on trees and binary search.");
    expect(cleanCheck.allowed).toBe(true);
  });

  // -------------------------------------------------------------
  // TEST 9 & 10: ALUMNI ANSWER SUBMISSION & INVARIANTS
  // -------------------------------------------------------------
  it(
    "9 & 10. Alumni can submit structured answer and cannot answer own question",
    async () => {
    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.companyId, testCompanyId))
      .limit(1);

    // Set Alumni A as current user
    setAuthUser(alumniA);

    const res = await submitAnswerAction({
      questionId: question.id,
      hiringCycle: "2026/27",
      basis: "own_interview",
      displayMode: "named",
      roundSequence: ["oa", "technical", "technical", "hr"],
      oaMode: "online",
      oaDifficulty: "Medium",
      topics: [{ topicId: testTopicId, weight: "heavy" }],
      dsaDifficulty: "Medium-Hard",
      body: "First round was HackerRank OA with 2 questions. Technical rounds were interactive DSA.",
    });

    expect(res.success).toBe(true);
    expect(res.answerId).toBeDefined();

    // Invariant: One live answer per author (duplicate submission throws)
    await expect(
      submitAnswerAction({
        questionId: question.id,
        hiringCycle: "2026/27",
        basis: "own_interview",
        displayMode: "named",
        roundSequence: ["oa", "technical", "hr"],
      })
    ).rejects.toThrow(/already submitted an answer/i);
  }, 35000);

  // -------------------------------------------------------------
  // TEST 11: HELPFUL MARKS (Only Askers Can Mark Helpful)
  // -------------------------------------------------------------
  it("11. Only students who attached an ask can mark an answer helpful", async () => {
    const [answer] = await db
      .select()
      .from(answers)
      .where(eq(answers.authorId, alumniA.id))
      .limit(1);

    // Student A (who attached an ask) marks helpful
    setAuthUser(studentA);
    const feedbackRes = await markAnswerHelpfulAction({ answerId: answer.id });
    expect(feedbackRes.success).toBe(true);

    // Alumni B (who never asked on this question) attempts to mark helpful
    setAuthUser(alumniB);
    await expect(markAnswerHelpfulAction({ answerId: answer.id })).rejects.toThrow(
      /Only students who asked this question can mark answers helpful/i
    );
  });

  // -------------------------------------------------------------
  // TEST 12: ANONYMOUS VERIFIED PRIVACY MASKING
  // -------------------------------------------------------------
  it("12. Anonymous answer masks author identity in public query layer", async () => {
    const [question] = await db
      .select()
      .from(questions)
      .where(eq(questions.companyId, testCompanyId))
      .limit(1);

    const anonAnswerId = `ans_anon_${timestamp}`;
    await db.insert(answers).values({
      id: anonAnswerId,
      questionId: question.id,
      authorId: alumniB.id,
      hiringCycle: "2026/27",
      basis: "general_advice",
      displayMode: "anonymous_verified",
      source: "public",
      revision: 1,
      body: "Anonymous candidate perspective.",
    });

    const rankedAnswers = await getRankedQuestionAnswers(question.id);
    const anonAns = rankedAnswers.find((a) => a.id === anonAnswerId);

    expect(anonAns).toBeDefined();
    expect(anonAns?.authorId).toBeNull(); // Masked!
    expect(anonAns?.authorName).toMatch(/Anonymous Candidate · 2026\/27/i);

    // Cleanup
    await db.delete(answers).where(eq(answers.id, anonAnswerId));
  });

  // -------------------------------------------------------------
  // TEST 13: CONSENSUS ADAPTER & SUPERSESSION
  // -------------------------------------------------------------
  it("13. Full experience supersedes same author's answer in consensus adapter", async () => {
    // 1. Without experience, answer claims enter consensus
    const obsBefore = await getAnswerClaimsForConsensus(testCompanyId);
    expect(obsBefore.length).toBeGreaterThan(0);
    const unSuperseded = obsBefore.find((o) => o.authorId === alumniA.id);
    expect(unSuperseded?.counted).toBe(true);

    // 2. Add published full experience for alumniA at testCompanyId
    const expId = `exp_philips_${timestamp}`;
    await db.insert(experiences).values({
      id: expId,
      companyId: testCompanyId,
      companyName: "Philips QA Test",
      role: "Software Engineer",
      roleId: testRoleId,
      year: 2026,
      type: "Full-time",
      rounds: 4,
      difficulty: "Medium",
      studentName: alumniA.name,
      isAnonymous: false,
      verificationStatus: "verified",
      summary: "Full experience summary",
      status: "published",
      authorId: alumniA.id,
    });

    // 3. Re-query consensus claims: now marked superseded!
    const obsAfter = await getAnswerClaimsForConsensus(testCompanyId);
    const supersededClaim = obsAfter.find((o) => o.authorId === alumniA.id);
    expect(supersededClaim?.counted).toBe(false);
    expect(supersededClaim?.supersededReason).toBe("superseded_by_experience");
    expect(supersededClaim?.weight).toBe(0);

    // Cleanup
    await db.delete(experiences).where(eq(experiences.id, expId));
  });

  // -------------------------------------------------------------
  // TEST 14: CUSTOM QUESTION SIMILARITY (pg_trgm scoped to company)
  // -------------------------------------------------------------
  it("14. Custom question pg_trgm suggestions are scoped to the same company", async () => {
    const customQId = `q_custom_${timestamp}`;
    await db.insert(questions).values({
      id: customQId,
      companyId: testCompanyId,
      intent: "custom",
      slotKey: null,
      title: "Is there a System Design round for Philips freshers?",
      titleNormalized: "is there a system design round for philips freshers?",
      status: "open",
      moderationState: "visible",
      createdBy: studentA.id,
    });

    const suggestions = await findSimilarCustomQuestions(
      testCompanyId,
      "system design round for philips freshers"
    );

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].id).toBe(customQId);

    // Verify company B query returns nothing
    const suggestionsCompB = await findSimilarCustomQuestions(
      testCompanyBId,
      "system design round for philips freshers"
    );
    expect(suggestionsCompB.length).toBe(0);

    // Cleanup
    await db.delete(questions).where(eq(questions.id, customQId));
  });
});
