"use server";

import { z } from "zod";
import { db } from "../db";
import {
  questions,
  questionAsks,
  questionTopics,
  answers,
  answerClaims,
  answerFeedback,
  companies,
  roleTitles,
  reports,
  user,
} from "../db/schema";
import { eq, and, sql, isNull, inArray } from "drizzle-orm";
import { requireUser } from "../auth-helpers";
import { revalidatePath } from "next/cache";
import { createAuditRecord } from "./audit";
import { createNotificationTx } from "../notifications";
import { isAuthorVerifiedAtCompany } from "../queries/verification";
import { deriveAnswerClaims, getDerivedRoundCount } from "../qa/claims";
import { validateContentForModeration } from "../qa/moderation-rules";

// -------------------------------------------------------------
// SCHEMAS
// -------------------------------------------------------------

const createOrAttachQuestionAskSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  roleFamilyId: z.string().optional().nullable(),
  intent: z.enum([
    "selection_process",
    "oa",
    "dsa",
    "fundamentals",
    "development",
    "interview_rounds",
    "projects",
    "hr",
    "custom",
  ]),
  hiringCycle: z.string().min(1, "Hiring cycle is required"), // e.g. "2026/27"
  customTitle: z.string().max(200).optional(),
  contextBody: z.string().max(1000).optional(),
  topicIds: z.array(z.string()).optional(),
});

const submitAnswerSchema = z.object({
  questionId: z.string().min(1, "Question is required"),
  roleFamilyId: z.string().optional().nullable(),
  hiringCycle: z.string().min(1, "Hiring cycle is required"),
  basis: z.enum(["own_interview", "secondhand", "general_advice"]),
  experienceId: z.string().optional().nullable(),
  body: z.string().max(2000, "Body cannot exceed 2000 characters").optional().nullable(),
  displayMode: z.enum(["named", "anonymous_verified"]).default("named"),
  roundSequence: z.array(z.string()).min(1, "At least one round is required"),
  oaMode: z.enum(["online", "offline"]).optional(),
  oaDifficulty: z.enum(["Easy", "Medium", "Hard", "Medium-Hard"]).optional(),
  topics: z
    .array(
      z.object({
        topicId: z.string(),
        weight: z.enum(["light", "moderate", "heavy"]),
      })
    )
    .optional(),
  dsaDifficulty: z.enum(["Easy", "Medium", "Hard", "Medium-Hard"]).optional(),
  outcomeTimelineWeeks: z.number().positive().optional(),
});

const helpfulFeedbackSchema = z.object({
  answerId: z.string().min(1, "Answer ID is required"),
});

const reportItemSchema = z.object({
  questionId: z.string().optional(),
  answerId: z.string().optional(),
  reason: z.string().min(1, "Reason is required"),
  details: z.string().max(1000).optional(),
});

// -------------------------------------------------------------
// HELPER: Generate Canonical Title for Standard Question Slot
// -------------------------------------------------------------
function generateStandardTitle(companyName: string, roleName: string, intent: string): string {
  switch (intent) {
    case "selection_process":
      return `What is the ${companyName} ${roleName} selection process?`;
    case "oa":
      return `What is asked in the ${companyName} ${roleName} Online Assessment (OA)?`;
    case "dsa":
      return `What level of DSA and problem-solving is expected for ${companyName} ${roleName}?`;
    case "fundamentals":
      return `What CS Fundamentals (DBMS, OS, OOP, CN) are asked in ${companyName} ${roleName} rounds?`;
    case "development":
      return `What development and practical tech stack questions are asked for ${companyName} ${roleName}?`;
    case "interview_rounds":
      return `How many technical and HR rounds are there for ${companyName} ${roleName}?`;
    case "projects":
      return `How deeply are resume projects evaluated in ${companyName} ${roleName} interviews?`;
    case "hr":
      return `What behavioral and HR questions are asked at ${companyName} ${roleName}?`;
    default:
      return `What to expect for ${companyName} ${roleName}?`;
  }
}

// -------------------------------------------------------------
// 1. CREATE OR ATTACH QUESTION ASK
// -------------------------------------------------------------
export async function createOrAttachQuestionAskAction(data: z.infer<typeof createOrAttachQuestionAskSchema>) {
  const user = await requireUser();
  const parsed = createOrAttachQuestionAskSchema.parse(data);

  // 1. Pre-check moderation on context body & custom title
  const contextCheck = validateContentForModeration(parsed.contextBody);
  if (!contextCheck.allowed) {
    throw new Error(contextCheck.reason || "Content flagged by moderation.");
  }

  if (parsed.intent === "custom" && parsed.customTitle) {
    const titleCheck = validateContentForModeration(parsed.customTitle);
    if (!titleCheck.allowed) {
      throw new Error(titleCheck.reason || "Question title flagged by moderation.");
    }
  }

  // 2. Fetch company & role
  const [comp] = await db.select().from(companies).where(eq(companies.id, parsed.companyId)).limit(1);
  if (!comp) throw new Error("Company not found");

  let roleTitleName = "Software Engineer";
  let resolvedRoleFamilyId: string | null = null;
  if (parsed.roleFamilyId) {
    const [role] = await db.select().from(roleTitles).where(eq(roleTitles.id, parsed.roleFamilyId)).limit(1);
    if (role) {
      roleTitleName = role.title;
      resolvedRoleFamilyId = role.id;
    }
  }

  const roleSlug = roleTitleName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const compSlug = comp.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  let slotKey: string | null = null;
  let title: string = "";
  if (parsed.intent !== "custom") {
    slotKey = `${compSlug}:${roleSlug}:${parsed.intent}`;
    title = generateStandardTitle(comp.name, roleTitleName, parsed.intent);
  } else {
    if (!parsed.customTitle || parsed.customTitle.trim().length === 0) {
      throw new Error("Custom questions require a title.");
    }
    title = parsed.customTitle.trim();
  }

  const titleNormalized = title.toLowerCase().trim();

  // Execute in transaction for atomicity and concurrency safety
  const result = await db.transaction(async (tx) => {
    let questionRecord: typeof questions.$inferSelect | null = null;
    let isNewSlot = false;

    if (slotKey) {
      // Standard Question Slot: Check existing active slot
      const existing = await tx
        .select()
        .from(questions)
        .where(and(eq(questions.slotKey, slotKey), isNull(questions.deletedAt)))
        .limit(1);

      if (existing[0]) {
        questionRecord = existing[0];
      }
    }

    if (!questionRecord) {
      isNewSlot = true;
      const questionId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const [newQ] = await tx
        .insert(questions)
        .values({
          id: questionId,
          companyId: parsed.companyId,
          roleFamilyId: resolvedRoleFamilyId,
          intent: parsed.intent,
          slotKey: slotKey || null,
          title,
          titleNormalized,
          status: "open",
          moderationState: contextCheck.flaggedForReview ? "held" : "visible",
          createdBy: user.id,
          askCount: 0, // will increment below
          answerCount: 0,
          eligibleAnswerCount: 0,
        })
        .returning();

      questionRecord = newQ;

      // Add question topics if provided
      if (Array.isArray(parsed.topicIds) && parsed.topicIds.length > 0) {
        for (const tid of parsed.topicIds) {
          await tx.insert(questionTopics).values({
            questionId: questionRecord.id,
            topicId: tid,
          }).onConflictDoNothing();
        }
      }
    }

    // Check if user already asked on this question
    const existingAsk = await tx
      .select()
      .from(questionAsks)
      .where(and(eq(questionAsks.questionId, questionRecord.id), eq(questionAsks.userId, user.id)))
      .limit(1);

    if (existingAsk[0]) {
      throw new Error("You have already attached an ask to this question slot.");
    }

    // Insert student's individual context/ask
    const askId = `ask_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const [newAsk] = await tx
      .insert(questionAsks)
      .values({
        id: askId,
        questionId: questionRecord.id,
        userId: user.id,
        contextBody: parsed.contextBody || null,
        hiringCycle: parsed.hiringCycle,
        collegeSnapshot: null,
        batchSnapshot: null,
      })
      .returning();

    // Increment askCount on question
    await tx
      .update(questions)
      .set({
        askCount: sql`${questions.askCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, questionRecord.id));

    return {
      question: questionRecord,
      ask: newAsk,
      isNewSlot,
    };
  });

  try {
    await createAuditRecord({
      action: result.isNewSlot ? "question_slot_created" : "question_ask_attached",
      entityType: "question",
      entityId: result.question.id,
      actorId: user.id,
      metadata: { askId: result.ask.id, userId: user.id, slotKey },
    });
  } catch (err) {
    console.error("Audit log error on question ask:", err);
  }

  revalidatePath("/questions");
  revalidatePath(`/companies/${parsed.companyId}`);
  return result;
}

// -------------------------------------------------------------
// 2. SUBMIT STRUCTURED ALUMNI ANSWER
// -------------------------------------------------------------
export async function submitAnswerAction(data: z.infer<typeof submitAnswerSchema>) {
  const user = await requireUser();
  const parsed = submitAnswerSchema.parse(data);

  // 1. Moderation pre-check on body
  const bodyCheck = validateContentForModeration(parsed.body);
  if (!bodyCheck.allowed) {
    throw new Error(bodyCheck.reason || "Content flagged by moderation.");
  }

  // 2. Fetch question
  const [question] = await db
    .select()
    .from(questions)
    .where(and(eq(questions.id, parsed.questionId), isNull(questions.deletedAt)))
    .limit(1);

  if (!question) throw new Error("Question not found");

  // Invariant 7: Author cannot answer their own question
  if (question.createdBy === user.id) {
    throw new Error("You cannot answer your own question.");
  }

  // Invariant: One live answer per author per question
  const existingAnswer = await db
    .select()
    .from(answers)
    .where(
      and(
        eq(answers.questionId, parsed.questionId),
        eq(answers.authorId, user.id),
        isNull(answers.deletedAt)
      )
    )
    .limit(1);

  if (existingAnswer[0]) {
    throw new Error("You have already submitted an answer for this question. Please edit your existing answer.");
  }

  // Derive claims & round count
  const claims = deriveAnswerClaims({
    roundSequence: parsed.roundSequence,
    oaMode: parsed.oaMode,
    oaDifficulty: parsed.oaDifficulty,
    topics: parsed.topics,
    dsaDifficulty: parsed.dsaDifficulty,
    outcomeTimelineWeeks: parsed.outcomeTimelineWeeks,
  });

  // Verify if author has verified employment for THIS company
  const isVerifiedEmployment = await isAuthorVerifiedAtCompany(user.id, question.companyId);
  const isEligibleForConsensus = parsed.basis === "own_interview" && isVerifiedEmployment;

  const answerId = `ans_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  await db.transaction(async (tx) => {
    // 1. Insert answer
    await tx.insert(answers).values({
      id: answerId,
      questionId: parsed.questionId,
      authorId: user.id,
      roleFamilyId: parsed.roleFamilyId || question.roleFamilyId,
      hiringCycle: parsed.hiringCycle,
      basis: parsed.basis,
      experienceId: parsed.experienceId || null,
      body: parsed.body || null,
      displayMode: parsed.displayMode,
      source: "public",
      revision: 1,
      moderationState: bodyCheck.flaggedForReview ? "held" : "visible",
    });

    // 2. Insert answer claims
    for (const claim of claims) {
      const claimId = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await tx.insert(answerClaims).values({
        id: claimId,
        answerId,
        dimension: claim.dimension,
        roundKind: claim.roundKind || null,
        topicId: claim.topicId || null,
        valueText: claim.valueText || null,
        valueNum: claim.valueNum || null,
        position: claim.position || null,
      });
    }

    // 3. Update question counts & status
    const newAnswerCount = question.answerCount + 1;
    const newEligibleCount = question.eligibleAnswerCount + (isEligibleForConsensus ? 1 : 0);
    const newStatus = newEligibleCount >= 3 ? "well_covered" : "answered";

    await tx
      .update(questions)
      .set({
        answerCount: sql`${questions.answerCount} + 1`,
        eligibleAnswerCount: sql`${questions.eligibleAnswerCount} + ${isEligibleForConsensus ? 1 : 0}`,
        status: newStatus,
        lastAnsweredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(questions.id, parsed.questionId));

    // 4. Notifications: Notify askers of first answer / first verified answer
    const asks = await tx
      .select({ userId: questionAsks.userId })
      .from(questionAsks)
      .where(eq(questionAsks.questionId, parsed.questionId));

    if (question.answerCount === 0) {
      // First answer notification
      for (const ask of asks) {
        if (ask.userId !== user.id) {
          await createNotificationTx(tx, {
            userId: ask.userId,
            type: "experience_published", // reusable standard notif type
            title: "New Answer on Your Question",
            body: `An alumni just answered "${question.title}".`,
            href: `/questions/${question.id}`,
            metadata: { questionId: question.id, answerId },
          });
        }
      }
    } else if (isVerifiedEmployment && question.eligibleAnswerCount === 0) {
      // First verified answer notification
      for (const ask of asks) {
        if (ask.userId !== user.id) {
          await createNotificationTx(tx, {
            userId: ask.userId,
            type: "verification_completed",
            title: "Verified Alumni Answer Received",
            body: `A verified employee answered "${question.title}".`,
            href: `/questions/${question.id}`,
            metadata: { questionId: question.id, answerId },
          });
        }
      }
    }

  });

  try {
    await createAuditRecord({
      action: "answer_submitted",
      entityType: "answer",
      entityId: answerId,
      actorId: user.id,
      metadata: { questionId: question.id, basis: parsed.basis, isEligibleForConsensus },
    });
  } catch (err) {
    console.error("Audit log error on answer submit:", err);
  }

  revalidatePath(`/questions/${parsed.questionId}`);
  revalidatePath(`/companies/${question.companyId}`);

  return { success: true, answerId };
}

// -------------------------------------------------------------
// 3. MARK ANSWER HELPFUL (Only permitted if user asked this question)
// -------------------------------------------------------------
export async function markAnswerHelpfulAction(data: z.infer<typeof helpfulFeedbackSchema>) {
  const user = await requireUser();
  const parsed = helpfulFeedbackSchema.parse(data);

  const [answer] = await db
    .select()
    .from(answers)
    .where(and(eq(answers.id, parsed.answerId), isNull(answers.deletedAt)))
    .limit(1);

  if (!answer) throw new Error("Answer not found");

  // Invariant 8: Cannot mark own answer helpful
  if (answer.authorId === user.id) {
    throw new Error("You cannot mark your own answer helpful.");
  }

  // Invariant 9: Helpful feedback ONLY from users who actually asked on that question
  const [userAsk] = await db
    .select()
    .from(questionAsks)
    .where(and(eq(questionAsks.questionId, answer.questionId), eq(questionAsks.userId, user.id)))
    .limit(1);

  if (!userAsk) {
    throw new Error("Only students who asked this question can mark answers helpful.");
  }

  // Check if already marked helpful
  const [existing] = await db
    .select()
    .from(answerFeedback)
    .where(and(eq(answerFeedback.answerId, parsed.answerId), eq(answerFeedback.userId, user.id)))
    .limit(1);

  if (existing) {
    throw new Error("You have already marked this answer helpful.");
  }

  const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  await db.transaction(async (tx) => {
    await tx.insert(answerFeedback).values({
      id: feedbackId,
      answerId: parsed.answerId,
      userId: user.id,
      kind: "helpful",
    });

    await tx
      .update(answers)
      .set({
        helpfulCount: sql`${answers.helpfulCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(answers.id, parsed.answerId));
  });

  revalidatePath(`/questions/${answer.questionId}`);
  return { success: true };
}

// -------------------------------------------------------------
// 4. REPORT QUESTION OR ANSWER
// -------------------------------------------------------------
export async function reportQuestionOrAnswerAction(data: z.infer<typeof reportItemSchema>) {
  const user = await requireUser();
  const parsed = reportItemSchema.parse(data);

  if (!parsed.questionId && !parsed.answerId) {
    throw new Error("Either questionId or answerId is required.");
  }

  const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  await db.insert(reports).values({
    id: reportId,
    reporterId: user.id,
    questionId: parsed.questionId || null,
    answerId: parsed.answerId || null,
    reason: parsed.reason,
    details: parsed.details || null,
    status: "open",
  });

  await createAuditRecord({
    action: "qa_item_reported",
    entityType: parsed.questionId ? "question" : "answer",
    entityId: parsed.questionId || parsed.answerId || "",
    metadata: { reporterId: user.id, reason: parsed.reason },
  });

  return { success: true, reportId };
}
