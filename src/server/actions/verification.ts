"use server";

import { z } from "zod";
import { eq, and, isNull, desc } from "drizzle-orm";
import { db } from "../db";
import { alumniProfiles, companies, verificationChallenges, evidence } from "../db/schema";
import { requireUser } from "../auth-helpers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { createNotificationTx } from "../notifications";

const requestVerificationSchema = z.object({
  employmentId: z.string().min(1),
  email: z.string().email(),
});

function hashOtp(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function requestWorkEmailVerificationAction(data: z.infer<typeof requestVerificationSchema>) {
  const user = await requireUser();
  const parsed = requestVerificationSchema.parse(data);

  const employment = await db.select().from(alumniProfiles).where(eq(alumniProfiles.id, parsed.employmentId)).limit(1);
  if (!employment[0]) throw new Error("Employment not found");
  if (employment[0].userId !== user.id) throw new Error("Unauthorized to verify this employment");

  const company = await db.select().from(companies).where(eq(companies.id, employment[0].companyId)).limit(1);
  if (!company[0]) throw new Error("Company not found");

  // Validate company domain if it exists (very naive check for phase 2.4)
  const domain = company[0].domain;
  if (domain && !parsed.email.endsWith(`@${domain}`)) {
    throw new Error(`Email must end with @${domain}`);
  }

  // Prevent excessive OTP generation (Rate Limiting)
  const recentChallenge = await db.select().from(verificationChallenges)
    .where(eq(verificationChallenges.employmentId, parsed.employmentId))
    .orderBy(desc(verificationChallenges.createdAt))
    .limit(1);

  if (recentChallenge[0]) {
    const timeSinceLast = Date.now() - new Date(recentChallenge[0].createdAt).getTime();
    if (timeSinceLast < 60 * 1000) { // 60 seconds cooldown
      throw new Error("Please wait 1 minute before requesting another OTP");
    }
  }

  // Generate OTP
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  // Explicitly gate dev logging to local development without configured email provider
  if (process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY) {
    console.log(`[DEV-ONLY] OTP for ${parsed.email} is ${otp}`);
  }

  // Send email using provider abstraction
  const { sendWorkEmailVerificationOtp } = await import("../email");
  await sendWorkEmailVerificationOtp({
    to: parsed.email,
    otp,
    companyName: company[0].name,
  });

  // Only persist challenge if email attempt didn't throw an error
  await db.insert(verificationChallenges).values({
    id: `vc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    employmentId: parsed.employmentId,
    email: parsed.email,
    otpHash,
    expiresAt,
    maxAttempts: 3,
  });

  return { success: true };
}

const verifyOtpSchema = z.object({
  employmentId: z.string().min(1),
  otp: z.string().min(6).max(6),
});

export async function verifyWorkEmailOtpAction(data: z.infer<typeof verifyOtpSchema>) {
  const user = await requireUser();
  const parsed = verifyOtpSchema.parse(data);

  const employment = await db.select().from(alumniProfiles).where(eq(alumniProfiles.id, parsed.employmentId)).limit(1);
  if (!employment[0] || employment[0].userId !== user.id) {
    throw new Error("Unauthorized");
  }

  // Get active challenge
  const challenge = await db.select().from(verificationChallenges)
    .where(and(
      eq(verificationChallenges.employmentId, parsed.employmentId),
      isNull(verificationChallenges.consumedAt)
    ))
    .orderBy(desc(verificationChallenges.createdAt))
    .limit(1);

  if (!challenge[0]) throw new Error("No active verification challenge");

  const vc = challenge[0];
  
  if (vc.attempts >= vc.maxAttempts) {
    throw new Error("Too many attempts");
  }

  if (new Date() > new Date(vc.expiresAt)) {
    throw new Error("OTP expired");
  }

  const otpHash = hashOtp(parsed.otp);

  if (vc.otpHash !== otpHash) {
    await db.update(verificationChallenges)
      .set({ attempts: vc.attempts + 1 })
      .where(eq(verificationChallenges.id, vc.id));
    throw new Error("Invalid OTP");
  }

  // Transaction for success
  await db.transaction(async (tx) => {
    // Mark consumed
    await tx.update(verificationChallenges)
      .set({ consumedAt: new Date() })
      .where(eq(verificationChallenges.id, vc.id));

    // Create evidence
    await tx.insert(evidence).values({
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      employmentId: parsed.employmentId,
      kind: "work_email",
      status: "accepted",
    });

    // Update verified status
    await tx.update(alumniProfiles)
      .set({ verifiedStatus: "verified" })
      .where(eq(alumniProfiles.id, parsed.employmentId));

    await createNotificationTx(tx, {
      userId: user.id,
      type: "verification_completed",
      title: "Employment Verified",
      body: `Your employment at ${employment[0].company} has been verified!`,
      href: "/profile",
    });
  });

  revalidatePath(`/companies/${employment[0].companyId}`);

  return { success: true };
}

const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function submitVerificationEvidenceAction(formData: FormData) {
  const user = await requireUser();

  const employmentId = (formData.get("employmentId") as string | null)?.trim() || null;
  const experienceId = (formData.get("experienceId") as string | null)?.trim() || null;
  const rawKind = ((formData.get("kind") as string | null) || "offer_screenshot").trim();
  const referenceUrl = (formData.get("referenceUrl") as string | null)?.trim() || null;
  const notes = (formData.get("notes") as string | null)?.trim().slice(0, 500) || null;
  const file = formData.get("file");

  if (!employmentId && !experienceId) {
    throw new Error("Target employment profile or experience is required");
  }

  if (!["offer_screenshot", "linkedin_url", "other"].includes(rawKind)) {
    throw new Error("Unsupported verification evidence type");
  }
  const kind = rawKind as "offer_screenshot" | "linkedin_url" | "other";

  if (employmentId) {
    const [employment] = await db
      .select()
      .from(alumniProfiles)
      .where(eq(alumniProfiles.id, employmentId))
      .limit(1);
    if (!employment) throw new Error("Employment profile not found");
    if (employment.userId !== user.id && user.role !== "admin") {
      throw new Error("Unauthorized to submit verification for this employment");
    }

    const existingPending = await db
      .select({ id: evidence.id })
      .from(evidence)
      .where(and(eq(evidence.employmentId, employmentId), eq(evidence.status, "pending")));
    if (existingPending.length >= 5) {
      throw new Error("You already have pending verification submissions under review.");
    }
  }

  if (experienceId) {
    const { experiences } = await import("../db/schema");
    const [exp] = await db
      .select()
      .from(experiences)
      .where(eq(experiences.id, experienceId))
      .limit(1);
    if (!exp) throw new Error("Experience not found");
    if (exp.authorId !== user.id && user.role !== "admin") {
      throw new Error("Unauthorized to submit verification for this experience");
    }
  }

  let storageKey: string | null = null;
  let fileName: string | null = null;
  let mimeType: string | null = null;
  let fileSize: number | null = null;
  let validatedUrl: string | null = null;

  if (kind === "linkedin_url") {
    if (!referenceUrl) {
      throw new Error("LinkedIn profile URL is required");
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(referenceUrl);
    } catch {
      throw new Error("Please enter a valid URL starting with https://");
    }
    const host = parsedUrl.hostname.toLowerCase();
    if (
      parsedUrl.protocol !== "https:" ||
      (host !== "linkedin.com" && !host.endsWith(".linkedin.com"))
    ) {
      throw new Error("URL must be a valid https://linkedin.com profile link");
    }
    validatedUrl = parsedUrl.toString();
  } else {
    if (!file || !(file instanceof File) || file.size === 0) {
      throw new Error("Please select a verification document (PDF, PNG, JPG, or WebP)");
    }
    if (file.size > MAX_EVIDENCE_BYTES) {
      throw new Error("Evidence file must be 5 MB or smaller");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { detectSafeEvidenceFileType, savePrivateFile } = await import("../storage");
    const detected = detectSafeEvidenceFileType(buffer, file.name);
    if (!detected) {
      throw new Error("Invalid file format: only PDF, PNG, JPG, and WebP files are accepted");
    }

    const cleanName = file.name.trim().replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    const key = `ev_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${detected.extension}`;
    storageKey = await savePrivateFile(key, buffer, {
      folder: "evidence",
      contentType: detected.mimeType,
    });
    fileName = cleanName || `evidence.${detected.extension}`;
    mimeType = detected.mimeType;
    fileSize = buffer.length;
  }

  const id = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  await db.insert(evidence).values({
    id,
    employmentId,
    experienceId,
    kind,
    status: "pending",
    storageKey,
    fileName,
    mimeType,
    fileSize,
    referenceUrl: validatedUrl,
    notes,
  });

  revalidatePath("/profile");
  revalidatePath("/admin/moderation");

  return {
    success: true,
    evidence: {
      id,
      kind,
      status: "pending" as const,
      fileName,
      referenceUrl: validatedUrl,
      notes,
    },
  };
}


