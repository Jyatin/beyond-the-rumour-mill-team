import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/server/db";
import { user, experiences, companies, alumniCvs } from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";
import { uploadCvAction, toggleCvSharingAction, deleteCvAction } from "@/server/actions/cv";
import { getAlumniCvAccess, getSharedCvMap } from "@/server/queries/cv";
import { getPublishedExperiences, getExperienceById, getRawExperienceById } from "@/server/queries/experiences";
import { createExperienceAction } from "@/server/actions/experiences";
import { readPrivateFile, savePrivateFile, deletePrivateFile } from "@/server/storage";

// Mock server-only & next/headers & next/cache
let currentMockUser: { id: string; name: string; email: string; role: string } | null = null;

vi.mock("@/server/auth-helpers", () => ({
  getCurrentUser: vi.fn(async () => currentMockUser),
  getCurrentSession: vi.fn(async () => currentMockUser ? { user: currentMockUser } : null),
  requireUser: vi.fn(async () => {
    if (!currentMockUser) throw new Error("Unauthorized");
    return currentMockUser;
  }),
  requireRole: vi.fn(async (role: string) => {
    if (!currentMockUser) throw new Error("Unauthorized");
    if (currentMockUser.role !== role && currentMockUser.role !== "admin") {
      throw new Error(`Forbidden: requires role ${role}`);
    }
    return currentMockUser;
  }),
  requireAdmin: vi.fn(async () => {
    if (!currentMockUser || currentMockUser.role !== "admin") {
      throw new Error("Forbidden: requires admin");
    }
    return currentMockUser;
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const mockBlobUrl = "https://mockstore.public.blob.vercel-storage.com/cvs/alumni_test.pdf";
const samplePdfContent = "%PDF-1.4 Mock Vercel Blob PDF Content";

vi.mock("@vercel/blob", () => ({
  put: vi.fn(async (_path, _data, _opts) => ({
    url: mockBlobUrl,
    pathname: "cvs/alumni_test.pdf",
    contentType: "application/pdf",
  })),
  del: vi.fn(async (_url, _opts) => {}),
}));

describe("Phase 3.4 & 3.5 — Anonymous Experiences & Persistent Vercel Blob CV Storage", () => {
  const timestamp = Date.now();
  const testCompanyId = `comp_anon_${timestamp}`;
  const alumni1 = {
    id: `usr_alumni1_${timestamp}`,
    name: "Alumni One",
    email: `alumni1_${timestamp}@example.com`,
    role: "alumni",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const alumni2 = {
    id: `usr_alumni2_${timestamp}`,
    name: "Alumni Two",
    email: `alumni2_${timestamp}@example.com`,
    role: "alumni",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const student = {
    id: `usr_student_${timestamp}`,
    name: "Student Candidate",
    email: `student_${timestamp}@example.com`,
    role: "student",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const admin = {
    id: `usr_admin_${timestamp}`,
    name: "Platform Admin",
    email: `admin_${timestamp}@example.com`,
    role: "admin",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let anonExpId: string = "";
  let publicExpId: string = "";

  beforeAll(async () => {
    // Seed users
    await db.insert(user).values([alumni1, alumni2, student, admin]);

    // Seed company
    await db.insert(companies).values({
      id: testCompanyId,
      name: "Stripe",
      industry: "Fintech",
      roles: ["Backend Engineer"],
      verificationStatus: "official",
      lastVerifiedAt: new Date().toISOString(),
      experienceCount: 0,
      topTopics: [{ topic: "System Design", pct: 80 }],
    });
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(alumniCvs).where(inArray(alumniCvs.userId, [alumni1.id, alumni2.id, student.id, admin.id]));
    await db.delete(experiences).where(eq(experiences.companyId, testCompanyId));
    await db.delete(companies).where(eq(companies.id, testCompanyId));
    await db.delete(user).where(inArray(user.id, [alumni1.id, alumni2.id, student.id, admin.id]));
  });

  // ==========================================
  // 1. ALUMNI CV TESTS
  // ==========================================
  describe("Alumni CV Management & Privacy", () => {
    it("1. rejects non-alumni from uploading a CV", async () => {
      currentMockUser = student;
      const formData = new FormData();
      const pdfBlob = new Blob(["%PDF-1.4 sample pdf content"], { type: "application/pdf" });
      formData.append("file", new File([pdfBlob], "resume.pdf", { type: "application/pdf" }));

      await expect(uploadCvAction(formData)).rejects.toThrow(/Only alumni accounts/i);
    });

    it("2. rejects invalid (non-PDF) or oversized files", async () => {
      currentMockUser = alumni1;
      
      // Text file disguised as pdf
      const fakeForm = new FormData();
      const fakeBlob = new Blob(["NOT A PDF CONTENT"], { type: "text/plain" });
      fakeForm.append("file", new File([fakeBlob], "document.txt", { type: "text/plain" }));
      await expect(uploadCvAction(fakeForm)).rejects.toThrow(/Only PDF documents/i);

      // PDF extension but invalid magic bytes
      const corruptForm = new FormData();
      const corruptBlob = new Blob(["NOT_REAL_PDF_HEADER"], { type: "application/pdf" });
      corruptForm.append("file", new File([corruptBlob], "malicious.pdf", { type: "application/pdf" }));
      await expect(uploadCvAction(corruptForm)).rejects.toThrow(/not a valid PDF document/i);
    });

    it("3. allows alumni to upload CV and defaults to PRIVATE", async () => {
      currentMockUser = alumni1;
      const formData = new FormData();
      const pdfContent = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF";
      const pdfBlob = new Blob([pdfContent], { type: "application/pdf" });
      formData.append("file", new File([pdfBlob], "alumni1_resume.pdf", { type: "application/pdf" }));

      const res = await uploadCvAction(formData);
      expect(res.success).toBe(true);
      expect(res.cv.fileName).toBe("alumni1_resume.pdf");
      expect(res.cv.isShared).toBe(false); // MUST BE PRIVATE BY DEFAULT

      // Verify DB record
      const rows = await db.select().from(alumniCvs).where(eq(alumniCvs.userId, alumni1.id));
      expect(rows).toHaveLength(1);
      expect(rows[0].isShared).toBe(false);

      // Verify file persisted in storage
      const fileData = await readPrivateFile(rows[0].storageKey);
      expect(fileData).not.toBeNull();
      expect(fileData?.contentType).toBe("application/pdf");
    });

    it("4. prevents student or unauthenticated users from accessing private CV", async () => {
      // Unauthenticated
      currentMockUser = null;
      const unauthAccess = await getAlumniCvAccess(alumni1.id);
      expect(unauthAccess.allowed).toBe(false);
      expect(unauthAccess.reason).toBe("unauthenticated");

      // Student viewer
      currentMockUser = student;
      const studentAccess = await getAlumniCvAccess(alumni1.id);
      expect(studentAccess.allowed).toBe(false);
      expect(studentAccess.reason).toBe("private");
      expect(studentAccess.cv).toBeNull();
    });

    it("5. allows owner alumni and platform admin to access private CV", async () => {
      // Owner
      currentMockUser = alumni1;
      const ownerAccess = await getAlumniCvAccess(alumni1.id);
      expect(ownerAccess.allowed).toBe(true);
      expect(ownerAccess.cv?.fileName).toBe("alumni1_resume.pdf");

      // Admin
      currentMockUser = admin;
      const adminAccess = await getAlumniCvAccess(alumni1.id);
      expect(adminAccess.allowed).toBe(true);
      expect(adminAccess.cv?.fileName).toBe("alumni1_resume.pdf");
    });

    it("6. enables CV sharing and grants student access", async () => {
      currentMockUser = alumni1;
      const toggleRes = await toggleCvSharingAction(true);
      expect(toggleRes.success).toBe(true);
      expect(toggleRes.isShared).toBe(true);

      // Student viewer now permitted
      currentMockUser = student;
      const studentAccess = await getAlumniCvAccess(alumni1.id);
      expect(studentAccess.allowed).toBe(true);
      expect(studentAccess.reason).toBe("shared");
      expect(studentAccess.cv).not.toBeNull();

      // Shared map lookup reflects sharing
      const map = await getSharedCvMap([alumni1.id, alumni2.id]);
      expect(map[alumni1.id]).toBe(true);
      expect(map[alumni2.id]).toBe(false);
    });

    it("7. disabling CV sharing immediately revokes student access", async () => {
      currentMockUser = alumni1;
      await toggleCvSharingAction(false);

      // Student viewer immediately blocked
      currentMockUser = student;
      const studentAccess = await getAlumniCvAccess(alumni1.id);
      expect(studentAccess.allowed).toBe(false);
      expect(studentAccess.reason).toBe("private");
    });

    it("8. deleting CV cleans up storage and database", async () => {
      currentMockUser = alumni1;
      const rowsBefore = await db.select().from(alumniCvs).where(eq(alumniCvs.userId, alumni1.id));
      const storageKey = rowsBefore[0].storageKey;

      const delRes = await deleteCvAction();
      expect(delRes.success).toBe(true);

      const rowsAfter = await db.select().from(alumniCvs).where(eq(alumniCvs.userId, alumni1.id));
      expect(rowsAfter).toHaveLength(0);

      // File removed from storage
      const fileData = await readPrivateFile(storageKey);
      expect(fileData).toBeNull();
    });
  });

  // ==========================================
  // 2. ANONYMOUS EXPERIENCES TESTS
  // ==========================================
  describe("Anonymous Interview Experiences", () => {
    it("9. creates an anonymous experience with authorId stored server-side", async () => {
      currentMockUser = alumni1;

      const res = await createExperienceAction({
        companyId: testCompanyId,
        companyName: "Stripe",
        role: "Backend Engineer",
        year: 2024,
        type: "Full-time",
        rounds: 3,
        difficulty: "Hard",
        studentName: "Alumni One",
        isAnonymous: true, // EXPLICIT ANONYMOUS CHOICE
        summary: "Stripe backend distributed systems rounds.",
        status: "published",
      });

      expect(res.success).toBe(true);
      anonExpId = res.id;

      // Check raw database record
      const raw = await getRawExperienceById(anonExpId);
      expect(raw).not.toBeNull();
      expect(raw?.isAnonymous).toBe(true);
      expect(raw?.studentName).toBe("Anonymous");
      expect(raw?.authorId).toBe(alumni1.id); // Securely retained for server lineage
    });

    it("10. creates a public experience with normal author attribution", async () => {
      currentMockUser = alumni2;

      const res = await createExperienceAction({
        companyId: testCompanyId,
        companyName: "Stripe",
        role: "Backend Engineer",
        year: 2024,
        type: "Full-time",
        rounds: 2,
        difficulty: "Medium",
        studentName: "Alumni Two",
        isAnonymous: false,
        summary: "Stripe public review with full attribution.",
        status: "published",
      });

      expect(res.success).toBe(true);
      publicExpId = res.id;

      const raw = await getRawExperienceById(publicExpId);
      expect(raw?.isAnonymous).toBe(false);
      expect(raw?.studentName).toBe("Alumni Two");
      expect(raw?.authorId).toBe(alumni2.id);
    });

    it("11. public and student readers do NOT receive authorId for anonymous experiences", async () => {
      // Unauthenticated public reader
      currentMockUser = null;
      const expPublic = await getExperienceById(anonExpId);
      expect(expPublic).not.toBeNull();
      expect(expPublic?.isAnonymous).toBe(true);
      expect(expPublic?.studentName).toBe("Anonymous");
      expect(expPublic?.authorId).toBeNull(); // STRIPPED / MASKED

      // Student reader
      currentMockUser = student;
      const expStudent = await getExperienceById(anonExpId);
      expect(expStudent?.authorId).toBeNull();
      expect(expStudent?.studentName).toBe("Anonymous");

      // Published experiences list also masks anonymous authors
      const allPublished = await getPublishedExperiences();
      const anonInList = allPublished.find(e => e.id === anonExpId);
      expect(anonInList?.authorId).toBeNull();
      expect(anonInList?.studentName).toBe("Anonymous");

      // Public experience retains attribution
      const publicInList = allPublished.find(e => e.id === publicExpId);
      expect(publicInList?.authorId).toBe(alumni2.id);
      expect(publicInList?.studentName).toBe("Alumni Two");
    });

    it("12. author and admin CAN resolve authorId on anonymous experience", async () => {
      // Author viewing own experience
      currentMockUser = alumni1;
      const authorView = await getExperienceById(anonExpId);
      expect(authorView?.authorId).toBe(alumni1.id);

      // Admin viewing moderation/support
      currentMockUser = admin;
      const adminView = await getExperienceById(anonExpId);
      expect(adminView?.authorId).toBe(alumni1.id);
    });

    it("13. anonymous experiences participate in company aggregates and consensus", async () => {
      currentMockUser = null;
      const { getExperiencesByCompanyId } = await import("@/server/queries/experiences");
      const companyExperiences = await getExperiencesByCompanyId(testCompanyId);

      // Both anonymous and public experiences are included in company intelligence
      expect(companyExperiences).toHaveLength(2);
      const anonItem = companyExperiences.find(e => e.id === anonExpId);
      const publicItem = companyExperiences.find(e => e.id === publicExpId);

      expect(anonItem).toBeDefined();
      expect(anonItem?.authorId).toBeNull(); // Masked
      expect(anonItem?.summary).toBe("Stripe backend distributed systems rounds.");

      expect(publicItem).toBeDefined();
      expect(publicItem?.authorId).toBe(alumni2.id);
    });
  });

  // ==========================================
  // 3. VERCEL BLOB STORAGE ADAPTER TESTS
  // ==========================================
  describe("Vercel Blob Storage Provider", () => {
    it("14. uses Vercel Blob when BLOB_READ_WRITE_TOKEN is present", async () => {
      const origToken = process.env.BLOB_READ_WRITE_TOKEN;
      process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test_mock_token";

      const samplePdf = Buffer.from(samplePdfContent);

      const origFetch = global.fetch;
      global.fetch = vi.fn(async (url) => {
        if (url === mockBlobUrl) {
          return {
            ok: true,
            status: 200,
            arrayBuffer: async () =>
              samplePdf.buffer.slice(
                samplePdf.byteOffset,
                samplePdf.byteOffset + samplePdf.byteLength
              ),
          } as unknown as Response;
        }
        return { ok: false, status: 404 } as unknown as Response;
      });

      try {
        // Save to blob
        const savedUrl = await savePrivateFile("alumni_test.pdf", samplePdf);
        expect(savedUrl).toBe(mockBlobUrl);

        // Read from blob URL
        const readResult = await readPrivateFile(savedUrl);
        expect(readResult).not.toBeNull();
        expect(readResult?.buffer.toString("utf-8")).toBe(samplePdfContent);

        // Delete from blob
        const delResult = await deletePrivateFile(savedUrl);
        expect(delResult).toBe(true);
      } finally {
        global.fetch = origFetch;
        process.env.BLOB_READ_WRITE_TOKEN = origToken;
      }
    });
  });
});
