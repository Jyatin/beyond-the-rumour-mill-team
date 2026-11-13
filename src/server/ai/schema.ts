import { z } from "zod";

export const evidenceSpanSchema = z.object({
  start: z.number().int().nonnegative().optional(),
  end: z.number().int().nonnegative().optional(),
  quote: z.string().min(1, "Evidence quote cannot be empty"),
  sourceField: z.string().optional(),
});

export type EvidenceSpan = z.infer<typeof evidenceSpanSchema>;

export const extractedTopicSchema = z.object({
  label: z.string().min(1, "Topic label is required"),
  evidence: evidenceSpanSchema,
});

export type ExtractedTopic = z.infer<typeof extractedTopicSchema>;

export const extractedQuestionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  topicCandidate: z.string().optional(),
  roundPosition: z.number().int().positive().optional(),
  evidence: evidenceSpanSchema,
});

export type ExtractedQuestion = z.infer<typeof extractedQuestionSchema>;

export const extractedRoundSchema = z.object({
  position: z.number().int().positive(),
  roundType: z.string().min(1, "Round type is required"),
  durationMinutes: z.number().int().positive().nullable().optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard", "Medium-Hard"]).nullable().optional(),
  notes: z.string().nullable().optional(),
  topics: z.array(extractedTopicSchema).default([]),
  questions: z.array(extractedQuestionSchema).default([]),
});

export type ExtractedRound = z.infer<typeof extractedRoundSchema>;

export const extractedExperienceMetadataSchema = z.object({
  roleCandidate: z.string().nullable().optional(),
  outcomeCandidate: z.enum(["Offer", "Accepted", "Rejected", "In Progress", "No Offer"]).nullable().optional(),
  difficultyCandidate: z.enum(["Easy", "Medium", "Hard", "Medium-Hard"]).nullable().optional(),
  overallSummary: z.string().nullable().optional(),
});

export type ExtractedExperienceMetadata = z.infer<typeof extractedExperienceMetadataSchema>;

export const extractedExperienceSchema = z.object({
  metadata: extractedExperienceMetadataSchema.optional(),
  rounds: z.array(extractedRoundSchema).default([]),
  unassignedQuestions: z.array(extractedQuestionSchema).default([]),
  unassignedTopics: z.array(extractedTopicSchema).default([]),
});

export type ExtractedExperience = z.infer<typeof extractedExperienceSchema>;
