import { pgTable, text, timestamp, integer, boolean, jsonb, pgEnum, index, unique, real } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";

export const experienceStatusEnum = pgEnum("experience_status", [
  "draft",
  "pending",
  "published",
  "flagged",
  "removed",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "official",
  "verified",
  "community",
  "review",
  "outdated",
]);

export const extractionStatusEnum = pgEnum("extraction_status", [
  "pending",
  "running",
  "succeeded",
  "failed",
]);

export const companies = pgTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain"),
  industry: text("industry").notNull(),
  roles: jsonb("roles").$type<string[]>().notNull(),
  verificationStatus: verificationStatusEnum("verification_status").notNull(),
  lastVerifiedAt: timestamp("last_verified_at", { mode: "string" }).notNull(),
  experienceCount: integer("experience_count").notNull().default(0),
  topTopics: jsonb("top_topics").$type<{ topic: string; pct: number }[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    nameTrgmIdx: index("companies_name_trgm_idx").using(
      "gin",
      sql`${table.name} gin_trgm_ops`
    ),
  };
});

export const roleTitles = pgTable("role_titles", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  unq: unique("role_titles_company_title_unq").on(t.companyId, t.title),
}));

export const experiences = pgTable("experiences", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  role: text("role").notNull(),
  roleId: text("role_id").references(() => roleTitles.id, { onDelete: "set null" }),
  year: integer("year").notNull(),
  type: text("type").notNull(), // "Internship" | "Full-time"
  rounds: integer("rounds").notNull(),
  difficulty: text("difficulty").notNull(), // "Easy" | "Medium" | "Hard" | "Medium-Hard"
  studentName: text("student_name").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  verificationStatus: verificationStatusEnum("verification_status").notNull(),
  summary: text("summary").notNull(),
  content: text("content"),
  outcome: text("outcome"),
  timeline: text("timeline"),
  status: experienceStatusEnum("status").notNull().default("published"),
  authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  helpfulCount: integer("helpful_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roundTypes = pgTable("round_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const topics = pgTable("topics", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const interviewQuestions = pgTable("interview_questions", {
  id: text("id").primaryKey(),
  canonicalText: text("canonical_text").notNull(),
  normalizedHash: text("normalized_hash").notNull().unique(),
  topicId: text("topic_id").references(() => topics.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const interviewRounds = pgTable("interview_rounds", {
  id: text("id").primaryKey(),
  experienceId: text("experience_id")
    .notNull()
    .references(() => experiences.id, { onDelete: "cascade" }),
  roundTypeId: text("round_type_id")
    .references(() => roundTypes.id, { onDelete: "set null" }),
  title: text("title"),
  order: integer("order").notNull().default(0),
  summary: text("summary"),
  difficulty: text("difficulty"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roundTopics = pgTable("round_topics", {
  roundId: text("round_id")
    .notNull()
    .references(() => interviewRounds.id, { onDelete: "cascade" }),
  topicId: text("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: index("round_topics_pk").on(t.roundId, t.topicId),
}));

export const experienceQuestions = pgTable("experience_questions", {
  id: text("id").primaryKey(),
  experienceId: text("experience_id")
    .notNull()
    .references(() => experiences.id, { onDelete: "cascade" }),
  roundId: text("round_id")
    .references(() => interviewRounds.id, { onDelete: "cascade" }),
  questionId: text("question_id")
    .notNull()
    .references(() => interviewQuestions.id, { onDelete: "restrict" }),
  rawText: text("raw_text").notNull(),
  order: integer("order").notNull().default(0),
});

export const extractionRuns = pgTable("extraction_runs", {
  id: text("id").primaryKey(),
  experienceId: text("experience_id")
    .notNull()
    .references(() => experiences.id, { onDelete: "cascade" }),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull(),
  schemaVersion: text("schema_version").notNull(),
  status: extractionStatusEnum("status").notNull().default("pending"),
  rawOutput: text("raw_output"),
  extractedData: jsonb("extracted_data").$type<Record<string, unknown>>(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  experienceIdx: index("extraction_runs_experience_idx").on(table.experienceId),
  statusIdx: index("extraction_runs_status_idx").on(table.status),
  createdAtIdx: index("extraction_runs_created_at_idx").on(table.createdAt),
}));

export const topicAliases = pgTable("topic_aliases", {
  id: text("id").primaryKey(),
  topicId: text("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  alias: text("alias").notNull(),
  normalizedAlias: text("normalized_alias").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  topicIdx: index("topic_aliases_topic_idx").on(table.topicId),
  normAliasIdx: index("topic_aliases_norm_alias_idx").on(table.normalizedAlias),
}));

export const consensusSnapshots = pgTable("consensus_snapshots", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  roleTitleId: text("role_title_id")
    .references(() => roleTitles.id, { onDelete: "set null" }),
  formulaVersion: text("formula_version").notNull(),
  totalEligibleExperiences: integer("total_eligible_experiences").notNull().default(0),
  totalWeightedExperiences: real("total_weighted_experiences").notNull().default(0),
  verificationScore: real("verification_score").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  companyIdx: index("consensus_snapshots_company_idx").on(table.companyId),
  createdAtIdx: index("consensus_snapshots_created_at_idx").on(table.createdAt),
}));

export const consensusItems = pgTable("consensus_items", {
  id: text("id").primaryKey(),
  snapshotId: text("snapshot_id")
    .notNull()
    .references(() => consensusSnapshots.id, { onDelete: "cascade" }),
  entityType: text("entity_type").notNull(), // "topic" | "question" | "round_type" | "difficulty" | "outcome"
  entityId: text("entity_id").notNull(),
  entityLabel: text("entity_label").notNull(),
  reportCount: integer("report_count").notNull().default(0),
  effectiveSampleSize: real("effective_sample_size").notNull().default(0),
  weightedPrevalence: real("weighted_prevalence").notNull().default(0),
  lowerBound: real("lower_bound").notNull().default(0),
  upperBound: real("upper_bound").notNull().default(0),
  totalWeight: real("total_weight").notNull().default(0),
  status: text("status").notNull().default("published"), // "published" | "insufficient_evidence" | "pending_review"
  formulaVersion: text("formula_version").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  snapshotIdx: index("consensus_items_snapshot_idx").on(table.snapshotId),
  entityTypeIdx: index("consensus_items_entity_type_idx").on(table.entityType),
  entityIdIdx: index("consensus_items_entity_id_idx").on(table.entityId),
}));

