import { pgTable, text, timestamp, integer, boolean, jsonb, pgEnum, index, unique, real } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";
import { companies, roleTitles, experiences, topics, verificationStatusEnum } from "./module-1";
import { placementDrives } from "./module-3";

export const mentorshipRequestStatusEnum = pgEnum("mentorship_request_status", [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
]);

export const mockSlotStatusEnum = pgEnum("mock_slot_status", [
  "available",
  "booked",
  "cancelled",
]);

export const mockBookingStatusEnum = pgEnum("mock_booking_status", [
  "confirmed",
  "cancelled",
  "completed",
]);

export const questionIntentEnum = pgEnum("question_intent", [
  "selection_process",
  "oa",
  "dsa",
  "fundamentals",
  "development",
  "interview_rounds",
  "projects",
  "hr",
  "custom",
]);

export const questionStatusEnum = pgEnum("question_status", [
  "open",
  "answered",
  "well_covered",
  "merged",
  "archived",
]);

export const qaModerationStateEnum = pgEnum("qa_moderation_state", [
  "visible",
  "held",
  "removed",
]);

export const answerBasisEnum = pgEnum("answer_basis", [
  "own_interview",
  "secondhand",
  "general_advice",
]);

export const answerDisplayModeEnum = pgEnum("answer_display_mode", [
  "named",
  "anonymous_verified",
]);

export const answerSourceEnum = pgEnum("answer_source", [
  "public",
  "direct",
]);

export const claimDimensionEnum = pgEnum("claim_dimension", [
  "round_sequence",
  "round_present",
  "oa_mode",
  "oa_difficulty",
  "topic_covered",
  "topic_weight",
  "dsa_difficulty",
  "outcome_timeline",
]);

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "declined",
  "expired",
]);

export const alumniProfiles = pgTable("alumni_profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  company: text("company").notNull(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  college: text("college").notNull(),
  year: integer("year").notNull(),
  interviewType: text("interview_type").notNull(), // "Full-time" | "Internship"
  avatarBg: text("avatar_bg").notNull(),
  quote: text("quote").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull(),
  roundsCount: integer("rounds_count").notNull(),
  verifiedStatus: verificationStatusEnum("verified_status").notNull(),
  responseRate: text("response_rate").notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    nameTrgmIdx: index("alumni_name_trgm_idx").using(
      "gin",
      sql`${table.name} gin_trgm_ops`
    ),
    collegeTrgmIdx: index("alumni_college_trgm_idx").using(
      "gin",
      sql`${table.college} gin_trgm_ops`
    ),
  };
});

export const alumniCvs = pgTable("alumni_cvs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull().default("application/pdf"),
  isShared: boolean("is_shared").notNull().default(false), // Private by default
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const preparationItems = pgTable("preparation_items", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  companyId: text("company_id")
    .references(() => companies.id, { onDelete: "cascade" }),
  driveId: text("drive_id")
    .references(() => placementDrives.id, { onDelete: "cascade" }),
  source: text("source").notNull().default("custom"),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("preparation_items_user_idx").on(table.userId),
  companyIdx: index("preparation_items_company_idx").on(table.companyId),
  driveIdx: index("preparation_items_drive_idx").on(table.driveId),
}));

export const mentorshipRequests = pgTable("mentorship_requests", {
  id: text("id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  mentorId: text("mentor_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  message: text("message"),
  status: mentorshipRequestStatusEnum("status").notNull().default("pending"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  studentIdx: index("mentorship_requests_student_idx").on(table.studentId),
  mentorIdx: index("mentorship_requests_mentor_idx").on(table.mentorId),
  statusIdx: index("mentorship_requests_status_idx").on(table.status),
}));

export const mockSlots = pgTable("mock_slots", {
  id: text("id").primaryKey(),
  mentorId: text("mentor_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  status: mockSlotStatusEnum("status").notNull().default("available"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  mentorIdx: index("mock_slots_mentor_idx").on(table.mentorId),
  statusIdx: index("mock_slots_status_idx").on(table.status),
  startsAtIdx: index("mock_slots_starts_at_idx").on(table.startsAt),
}));

export const mockBookings = pgTable("mock_bookings", {
  id: text("id").primaryKey(),
  slotId: text("slot_id")
    .notNull()
    .references(() => mockSlots.id, { onDelete: "cascade" }),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: mockBookingStatusEnum("status").notNull().default("confirmed"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  slotIdx: index("mock_bookings_slot_idx").on(table.slotId),
  studentIdx: index("mock_bookings_student_idx").on(table.studentId),
  statusIdx: index("mock_bookings_status_idx").on(table.status),
}));

export const questions = pgTable("questions", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  roleFamilyId: text("role_family_id")
    .references(() => roleTitles.id, { onDelete: "set null" }),
  intent: questionIntentEnum("intent").notNull(),
  slotKey: text("slot_key"),
  title: text("title").notNull(),
  titleNormalized: text("title_normalized").notNull(),
  status: questionStatusEnum("status").notNull().default("open"),
  moderationState: qaModerationStateEnum("moderation_state").notNull().default("visible"),
  mergedIntoId: text("merged_into_id"),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  askCount: integer("ask_count").notNull().default(1),
  answerCount: integer("answer_count").notNull().default(0),
  eligibleAnswerCount: integer("eligible_answer_count").notNull().default(0),
  lastAnsweredAt: timestamp("last_answered_at"),
  deletedAt: timestamp("deleted_at"),
  deletedBy: text("deleted_by").references(() => user.id, { onDelete: "set null" }),
  deletionReason: text("deletion_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  companyIdx: index("questions_company_idx").on(table.companyId),
  slotKeyIdx: index("questions_slot_key_idx").on(table.slotKey),
  statusIdx: index("questions_status_idx").on(table.status),
  moderationIdx: index("questions_moderation_idx").on(table.moderationState),
  titleTrgmIdx: index("questions_title_trgm_idx").using(
    "gin",
    sql`${table.titleNormalized} gin_trgm_ops`
  ),
}));

export const questionAsks = pgTable("question_asks", {
  id: text("id").primaryKey(),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  contextBody: text("context_body"),
  hiringCycle: text("hiring_cycle").notNull(),
  collegeSnapshot: text("college_snapshot"),
  batchSnapshot: text("batch_snapshot"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  unqAsk: unique("question_asks_user_question_unq").on(table.questionId, table.userId),
  questionIdx: index("question_asks_question_idx").on(table.questionId),
  userIdx: index("question_asks_user_idx").on(table.userId),
}));

export const questionTopics = pgTable("question_topics", {
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  topicId: text("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: index("question_topics_pk").on(table.questionId, table.topicId),
}));

export const answers = pgTable("answers", {
  id: text("id").primaryKey(),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .references(() => user.id, { onDelete: "set null" }),
  roleFamilyId: text("role_family_id")
    .references(() => roleTitles.id, { onDelete: "set null" }),
  hiringCycle: text("hiring_cycle").notNull(),
  basis: answerBasisEnum("basis").notNull(),
  experienceId: text("experience_id")
    .references(() => experiences.id, { onDelete: "set null" }),
  body: text("body"),
  displayMode: answerDisplayModeEnum("display_mode").notNull().default("named"),
  source: answerSourceEnum("source").notNull().default("public"),
  sourceDirectQuestionId: text("source_direct_question_id"),
  revision: integer("revision").notNull().default(1),
  moderationState: qaModerationStateEnum("moderation_state").notNull().default("visible"),
  helpfulCount: integer("helpful_count").notNull().default(0),
  deletedAt: timestamp("deleted_at"),
  deletedBy: text("deleted_by").references(() => user.id, { onDelete: "set null" }),
  deletionReason: text("deletion_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  questionIdx: index("answers_question_idx").on(table.questionId),
  authorIdx: index("answers_author_idx").on(table.authorId),
  moderationIdx: index("answers_moderation_idx").on(table.moderationState),
}));

export const answerClaims = pgTable("answer_claims", {
  id: text("id").primaryKey(),
  answerId: text("answer_id")
    .notNull()
    .references(() => answers.id, { onDelete: "cascade" }),
  dimension: claimDimensionEnum("dimension").notNull(),
  roundKind: text("round_kind"),
  topicId: text("topic_id")
    .references(() => topics.id, { onDelete: "set null" }),
  valueText: text("value_text"),
  valueNum: real("value_num"),
  position: integer("position"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  answerIdx: index("answer_claims_answer_idx").on(table.answerId),
  dimensionIdx: index("answer_claims_dimension_idx").on(table.dimension),
}));

export const answerFeedback = pgTable("answer_feedback", {
  id: text("id").primaryKey(),
  answerId: text("answer_id")
    .notNull()
    .references(() => answers.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("helpful"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  unqFeedback: unique("answer_feedback_user_answer_unq").on(table.answerId, table.userId),
  answerIdx: index("answer_feedback_answer_idx").on(table.answerId),
}));

export const questionInvitations = pgTable("question_invitations", {
  id: text("id").primaryKey(),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  alumnusId: text("alumnus_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  source: text("source").notNull().default("automatic"),
  matchScore: real("match_score").notNull().default(0),
  matchReasons: jsonb("match_reasons").$type<string[]>(),
  status: invitationStatusEnum("status").notNull().default("pending"),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
}, (table) => ({
  alumnusIdx: index("question_invitations_alumnus_idx").on(table.alumnusId),
  questionIdx: index("question_invitations_question_idx").on(table.questionId),
  statusIdx: index("question_invitations_status_idx").on(table.status),
}));

