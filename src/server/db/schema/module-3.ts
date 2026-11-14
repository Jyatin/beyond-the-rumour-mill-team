import { pgTable, text, timestamp, integer, jsonb, pgEnum, index, real } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { companies, roleTitles, experiences } from "./module-1";
import { alumniProfiles, questions, answers } from "./module-2";

export const applicationStatusEnum = pgEnum("application_status", [
  "applied",
  "shortlisted",
  "interviewing",
  "offered",
  "rejected",
  "withdrawn",
]);

export const evidenceKindEnum = pgEnum("evidence_kind", [
  "work_email",
  "offer_screenshot",
  "linkedin_url",
  "other",
]);

export const evidenceStatusEnum = pgEnum("evidence_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "open",
  "reviewing",
  "resolved",
  "dismissed",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "mentorship_request",
  "mentorship_accepted",
  "mentorship_rejected",
  "mock_booking",
  "mock_booking_cancelled",
  "mock_slot_cancelled",
  "experience_published",
  "experience_removed",
  "experience_flagged",
  "verification_completed",
  "contribution_required",
]);

export const placementDrives = pgTable("placement_drives", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  date: text("date"), 
  season: text("season"), 
  status: text("status").notNull().default("Upcoming"),
  deadline: text("deadline"),
  location: text("location"),
  eligibleStudentInformation: text("eligible_student_information"),
  tpoCoordinatorId: text("tpo_coordinator_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const driveRoles = pgTable("drive_roles", {
  id: text("id").primaryKey(),
  driveId: text("drive_id")
    .notNull()
    .references(() => placementDrives.id, { onDelete: "cascade" }),
  roleId: text("role_id")
    .notNull()
    .references(() => roleTitles.id, { onDelete: "cascade" }),
  location: text("location"),
  ctc: text("ctc"),
  employmentType: text("employment_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eligibilityRequirements = pgTable("eligibility_requirements", {
  id: text("id").primaryKey(),
  driveRoleId: text("drive_role_id")
    .notNull()
    .unique()
    .references(() => driveRoles.id, { onDelete: "cascade" }),
  cgpa: text("cgpa"),
  branches: jsonb("branches").$type<string[]>(),
  backlog: text("backlog"),
  otherCriteria: text("other_criteria"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const preparationRequirements = pgTable("preparation_requirements", {
  id: text("id").primaryKey(),
  driveRoleId: text("drive_role_id")
    .notNull()
    .unique()
    .references(() => driveRoles.id, { onDelete: "cascade" }),
  requiredSkills: jsonb("required_skills").$type<string[]>(),
  suggestedTopics: jsonb("suggested_topics").$type<string[]>(),
  preparationResources: jsonb("preparation_resources").$type<{ title: string; url?: string }[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const driveApplications = pgTable("drive_applications", {
  id: text("id").primaryKey(),
  driveId: text("drive_id")
    .notNull()
    .references(() => placementDrives.id, { onDelete: "cascade" }),
  driveRoleId: text("drive_role_id")
    .references(() => driveRoles.id, { onDelete: "cascade" }),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: applicationStatusEnum("status").notNull().default("applied"),
  resumeUrl: text("resume_url"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  notes: text("notes"),
}, (table) => ({
  studentDriveIdx: index("drive_applications_student_drive_idx").on(table.studentId, table.driveId),
  driveStatusIdx: index("drive_applications_drive_status_idx").on(table.driveId, table.status),
}));

export const evidence = pgTable("evidence", {
  id: text("id").primaryKey(),
  experienceId: text("experience_id").references(() => experiences.id, { onDelete: "cascade" }),
  employmentId: text("employment_id").references(() => alumniProfiles.id, { onDelete: "cascade" }),
  kind: evidenceKindEnum("kind").notNull(),
  status: evidenceStatusEnum("status").notNull().default("pending"),
  storageKey: text("storage_key"),
  fileName: text("file_name"),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  referenceUrl: text("reference_url"),
  notes: text("notes"),
  reviewNotes: text("review_notes"),
  reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verificationChallenges = pgTable("verification_challenges", {
  id: text("id").primaryKey(),
  employmentId: text("employment_id")
    .notNull()
    .references(() => alumniProfiles.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  otpHash: text("otp_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  reporterId: text("reporter_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  experienceId: text("experience_id").references(() => experiences.id, { onDelete: "set null" }),
  questionId: text("question_id").references(() => questions.id, { onDelete: "set null" }),
  answerId: text("answer_id").references(() => answers.id, { onDelete: "set null" }),
  reason: text("reason").notNull(),
  details: text("details"),
  status: reportStatusEnum("status").notNull().default("open"),
  resolvedBy: text("resolved_by").references(() => user.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  href: text("href"),
  readAt: timestamp("read_at"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("notifications_user_idx").on(table.userId),
  readAtIdx: index("notifications_read_at_idx").on(table.readAt),
  createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
}));

export const normalizationReviews = pgTable("normalization_reviews", {
  id: text("id").primaryKey(),
  candidate: text("candidate").notNull(),
  candidateType: text("candidate_type").notNull(), // "topic" | "question"
  proposedEntityId: text("proposed_entity_id"),
  proposedEntityLabel: text("proposed_entity_label"),
  confidence: real("confidence"),
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected"
  reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("normalization_reviews_status_idx").on(table.status),
  candidateTypeIdx: index("normalization_reviews_type_idx").on(table.candidateType),
  createdAtIdx: index("normalization_reviews_created_at_idx").on(table.createdAt),
}));

