import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectSafeEvidenceFileType, deletePrivateFile } from "../src/server/storage";
import {
  sendWorkEmailVerificationOtp,
  sendDriveApplicationAlert,
  sendVerificationDecisionAlert,
} from "../src/server/email";
import { submitVerificationEvidenceAction } from "../src/server/actions/verification";
import { reviewEvidenceAction } from "../src/server/actions/moderation";
import { db } from "../src/server/db";
import {
  user,
  companies,
  alumniProfiles,
  evidence,
  notifications,
  auditLog,
} from "../src/server/db/schema";
import { eq } from "drizzle-orm";
import { requireUser, requireRole } from "../src/server/auth-helpers";

vi.mock("../src/server/auth-helpers", () => ({
  requireUser: vi.fn(),
  requireRole: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Evidence Magic-Byte & Storage Security", () => {
  it("accepts valid PDF, PNG, JPEG, and WebP buffers", () => {
    const pdf = Buffer.from("%PDF-1.7\n%sample", "utf-8");
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const webp = Buffer.concat([
      Buffer.from("RIFF"),
      Buffer.from([0x10, 0x00, 0x00, 0x00]),
      Buffer.from("WEBP"),
    ]);

    expect(detectSafeEvidenceFileType(pdf, "offer.pdf")).toEqual({
      mimeType: "application/pdf",
      extension: "pdf",
    });
    expect(detectSafeEvidenceFileType(png, "id.png")).toEqual({
      mimeType: "image/png",
      extension: "png",
    });
    expect(detectSafeEvidenceFileType(jpg, "id.jpg")).toEqual({
      mimeType: "image/jpeg",
      extension: "jpg",
    });
    expect(detectSafeEvidenceFileType(webp, "id.webp")).toEqual({
      mimeType: "image/webp",
      extension: "webp",
    });
  });

  it("rejects spoofed files like HTML/scripts disguised with .pdf extension", () => {
    const fakePdf = Buffer.from("<html><script>alert(1)</script></html>", "utf-8");
    const tiny = Buffer.from("abc", "utf-8");

    expect(detectSafeEvidenceFileType(fakePdf, "offer.pdf")).toBeNull();
    expect(detectSafeEvidenceFileType(tiny, "small.png")).toBeNull();
  });
});

describe("Email Provider Safety Rules", () => {
  it("throws when RESEND_API_KEY is missing in production for OTP delivery", async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    try {
      await expect(
        sendWorkEmailVerificationOtp({
          to: "user@google.com",
          otp: "123456",
          companyName: "Google",
        })
      ).rejects.toThrow("Email provider not configured in production");

      const alertRes = await sendDriveApplicationAlert({
        to: "student@test.com",
        studentName: "Student",
        companyName: "Google",
        status: "shortlisted",
      });
      expect(alertRes.success).toBe(false);

      const decRes = await sendVerificationDecisionAlert({
        to: "alumni@test.com",
        recipientName: "Alumnus",
        companyName: "Google",
        decision: "accepted",
      });
      expect(decRes.success).toBe(false);
    } finally {
      process.env.RESEND_API_KEY = originalKey;
      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    }
  });
});

describe("Verification Evidence Upload & Moderation Workflow", () => {
  const alumniUserId = "ev_alumni_user";
  const otherUserId = "ev_other_user";
  const adminUserId = "ev_admin_user";
  const companyId = "ev_test_company";
  const employmentId = "ev_test_emp";

  beforeEach(async () => {
    await db.delete(evidence).where(eq(evidence.employmentId, employmentId));
    await db.delete(notifications).where(eq(notifications.userId, alumniUserId));

    for (const u of [
      { id: alumniUserId, name: "Evidence Alumnus", email: "ev_alumni@test.com", role: "alumni" },
      { id: otherUserId, name: "Other Student", email: "ev_other@test.com", role: "student" },
      { id: adminUserId, name: "Admin Mod", email: "ev_admin@test.com", role: "admin" },
    ]) {
      await db
        .insert(user)
        .values({
          ...u,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing();
    }

    await db
      .insert(companies)
      .values({
        id: companyId,
        name: "Evidence Test Corp",
        domain: "evcorp.com",
        industry: "Software",
        roles: ["SWE"],
        verificationStatus: "community",
        lastVerifiedAt: new Date().toISOString(),
        topTopics: [],
      })
      .onConflictDoNothing();

    await db
      .insert(alumniProfiles)
      .values({
        id: employmentId,
        name: "Evidence Alumnus",
        role: "SWE",
        company: "Evidence Test Corp",
        companyId,
        college: "Test Institute",
        year: 2024,
        interviewType: "Full-time",
        avatarBg: "bg-blue-500",
        quote: "Verify me",
        tags: [],
        roundsCount: 3,
        verifiedStatus: "review",
        responseRate: "100%",
        userId: alumniUserId,
      })
      .onConflictDoUpdate({
        target: alumniProfiles.id,
        set: { verifiedStatus: "review" },
      });

    vi.mocked(requireUser).mockResolvedValue({
      id: alumniUserId,
      name: "Evidence Alumnus",
      role: "alumni",
    } as never);
    vi.mocked(requireRole).mockResolvedValue({
      id: adminUserId,
      name: "Admin Mod",
      role: "admin",
    } as never);
  });

  it("rejects non-LinkedIn or insecure http URLs for linkedin_url evidence", async () => {
    const badHost = new FormData();
    badHost.append("employmentId", employmentId);
    badHost.append("kind", "linkedin_url");
    badHost.append("referenceUrl", "https://evil.example.com/in/user");

    await expect(submitVerificationEvidenceAction(badHost)).rejects.toThrow(
      "URL must be a valid https://linkedin.com profile link"
    );

    const httpUrl = new FormData();
    httpUrl.append("employmentId", employmentId);
    httpUrl.append("kind", "linkedin_url");
    httpUrl.append("referenceUrl", "http://www.linkedin.com/in/user");

    await expect(submitVerificationEvidenceAction(httpUrl)).rejects.toThrow(
      "URL must be a valid https://linkedin.com profile link"
    );
  });

  it("blocks unauthorized users from submitting evidence for another alumni profile", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce({
      id: otherUserId,
      name: "Other Student",
      role: "student",
    } as never);

    const fd = new FormData();
    fd.append("employmentId", employmentId);
    fd.append("kind", "linkedin_url");
    fd.append("referenceUrl", "https://www.linkedin.com/in/valid");

    await expect(submitVerificationEvidenceAction(fd)).rejects.toThrow(
      "Unauthorized to submit verification for this employment"
    );
  });

  it("submits valid LinkedIn URL and lets admin approve & verify alumni profile", async () => {
    const fd = new FormData();
    fd.append("employmentId", employmentId);
    fd.append("kind", "linkedin_url");
    fd.append("referenceUrl", "https://www.linkedin.com/in/verified-engineer");
    fd.append("notes", "Current role listed");

    const submitRes = await submitVerificationEvidenceAction(fd);
    expect(submitRes.success).toBe(true);
    expect(submitRes.evidence.status).toBe("pending");

    // Non-admin review fails
    vi.mocked(requireRole).mockRejectedValueOnce(new Error("Forbidden: requires role admin"));
    await expect(
      reviewEvidenceAction({
        evidenceId: submitRes.evidence.id,
        decision: "accepted",
      })
    ).rejects.toThrow("Forbidden");

    // Admin approves
    vi.mocked(requireUser).mockResolvedValueOnce({
      id: adminUserId,
      name: "Admin Mod",
      role: "admin",
    } as never);
    const reviewRes = await reviewEvidenceAction({
      evidenceId: submitRes.evidence.id,
      decision: "accepted",
      reviewNotes: "Verified via LinkedIn",
    });
    expect(reviewRes.success).toBe(true);

    const [updatedEmp] = await db
      .select()
      .from(alumniProfiles)
      .where(eq(alumniProfiles.id, employmentId));
    expect(updatedEmp.verifiedStatus).toBe("verified");

    const notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, alumniUserId));
    expect(notifs.some((n) => n.type === "verification_completed")).toBe(true);

    const audits = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, submitRes.evidence.id));
    expect(audits.some((a) => a.action === "evidence_accepted")).toBe(true);
  });

  it("submits a valid PDF file and handles admin rejection cleanly", async () => {
    const pdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n", "utf-8");
    const file = new File([pdfBuffer], "offer-letter.pdf", {
      type: "application/pdf",
    });

    const fd = new FormData();
    fd.append("employmentId", employmentId);
    fd.append("kind", "offer_screenshot");
    fd.append("file", file);
    fd.append("notes", "Redacted salary");

    const submitRes = await submitVerificationEvidenceAction(fd);
    expect(submitRes.success).toBe(true);
    expect(submitRes.evidence.fileName).toBe("offer-letter.pdf");

    vi.mocked(requireUser).mockResolvedValueOnce({
      id: adminUserId,
      name: "Admin Mod",
      role: "admin",
    } as never);
    await reviewEvidenceAction({
      evidenceId: submitRes.evidence.id,
      decision: "rejected",
      reviewNotes: "Company header missing",
    });

    const [updatedEmp] = await db
      .select()
      .from(alumniProfiles)
      .where(eq(alumniProfiles.id, employmentId));
    expect(updatedEmp.verifiedStatus).toBe("review");

    const [updatedEv] = await db
      .select()
      .from(evidence)
      .where(eq(evidence.id, submitRes.evidence.id));
    expect(updatedEv.status).toBe("rejected");
    expect(updatedEv.reviewNotes).toBe("Company header missing");

    if (updatedEv.storageKey) {
      await deletePrivateFile(updatedEv.storageKey, { folder: "evidence" });
    }
  });
});

