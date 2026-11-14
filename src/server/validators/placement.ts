import { z } from "zod";

export const DRIVE_STATUSES = [
  "Upcoming",
  "Open",
  "Ongoing",
  "Completed",
  "Cancelled",
] as const;

export const APPLICATION_STATUSES = [
  "applied",
  "shortlisted",
  "interviewing",
  "offered",
  "rejected",
  "withdrawn",
] as const;

export const preparationResourceSchema = z.object({
  title: z.string().trim().min(1, "Resource title is required").max(160),
  url: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v))
    .refine(
      (v) => !v || /^https?:\/\//i.test(v),
      "Resource URL must start with http:// or https://"
    ),
});

export const driveRoleInputSchema = z.object({
  id: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1, "Role title is required").max(160),
  ctc: z.string().trim().max(80).optional(),
  location: z.string().trim().max(160).optional(),
  employmentType: z.string().trim().max(60).optional(),
  cgpa: z.string().trim().max(40).optional(),
  branches: z.array(z.string().trim().min(1).max(60)).optional(),
  backlog: z.string().trim().max(80).optional(),
  otherCriteria: z.string().trim().max(500).optional(),
  requiredSkills: z.array(z.string().trim().min(1).max(100)).optional(),
  suggestedTopics: z.array(z.string().trim().min(1).max(120)).optional(),
  preparationResources: z.array(preparationResourceSchema).optional(),
});

export const createDriveSchema = z.object({
  companyId: z.string().trim().min(1, "Company is required"),
  season: z.string().trim().max(160).optional(),
  date: z.string().trim().max(120).optional(),
  deadline: z.string().trim().max(120).optional(),
  location: z.string().trim().max(200).optional(),
  eligibleStudentInformation: z.string().trim().max(2000).optional(),
  status: z.enum(DRIVE_STATUSES).optional(),
  roles: z.array(driveRoleInputSchema).optional(),
});

export const updateDriveSchema = createDriveSchema.partial();

export const applyToDriveSchema = z.object({
  driveId: z.string().trim().min(1, "Drive ID is required"),
  driveRoleId: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(1000).optional(),
  resumeUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v))
    .refine(
      (v) => !v || /^https?:\/\//i.test(v),
      "Resume URL must start with http:// or https://"
    ),
});

export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().trim().min(1, "Application ID is required"),
  status: z.enum(APPLICATION_STATUSES),
  notes: z.string().trim().max(1000).optional(),
});

export type CreateDriveInput = z.infer<typeof createDriveSchema>;
export type UpdateDriveInput = z.infer<typeof updateDriveSchema>;

