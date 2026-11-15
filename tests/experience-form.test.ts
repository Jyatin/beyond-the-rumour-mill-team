import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/server/db";
import { 
  user, 
  experiences, 
  alumniCvs, 
  auditLog 
} from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";
import { createExperienceAction, submitExperienceAction, saveFullExperienceAction } from "@/server/actions/experiences";
import { updateExperienceRoundsAction } from "@/server/actions/rounds";
import { uploadCvAction, toggleCvSharingAction } from "@/server/actions/cv";
import { getExperienceById } from "@/server/queries/experiences";
import { getExperienceWithRounds } from "@/server/queries/rounds";
import { getAlumniCvAccess } from "@/server/queries/cv";

const { mockState } = vi.hoisted(() => {
  return {
    mockState: {
      user: null as { id: string; name: string; email: string; role: string } | null,
    },
  };
});

vi.mock("@/server/auth-helpers", () => ({
  getCurrentUser: vi.fn(async () => mockState.user),
  getCurrentSession: vi.fn(async () => mockState.user ? { user: mockState.user } : null),
  requireUser: vi.fn(async () => {
    if (!mockState.user) throw new Error("Unauthorized");
    return mockState.user;
  }),
  requireRole: vi.fn(async (role: string) => {
    if (!mockState.user) throw new Error("Unauthorized");
    if (mockState.user.role !== role && mockState.user.role !== "admin") {
      throw new Error(`Forbidden: requires role ${role}`);
    }
    return mockState.user;
  }),
  requireAdmin: vi.fn(async () => {
    if (!mockState.user || mockState.user.role !== "admin") {
      throw new Error("Forbidden: requires admin");
    }
    return mockState.user;
  }),
}));

vi.mock("../src/server/auth-helpers", () => ({
  getCurrentUser: vi.fn(async () => mockState.user),
  getCurrentSession: vi.fn(async () => mockState.user ? { user: mockState.user } : null),
  requireUser: vi.fn(async () => {
    if (!mockState.user) throw new Error("Unauthorized");
    return mockState.user;
  }),
  requireRole: vi.fn(async (role: string) => {
    if (!mockState.user) throw new Error("Unauthorized");
    if (mockState.user.role !== role && mockState.user.role !== "admin") {
      throw new Error(`Forbidden: requires role ${role}`);
    }
    return mockState.user;
  }),
  requireAdmin: vi.fn(async () => {
    if (!mockState.user || mockState.user.role !== "admin") {
      throw new Error("Forbidden: requires admin");
    }
    return mockState.user;
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const mockBlobUrl = "https://mockstore.public.blob.vercel-storage.com/cvs/alumni_test.pdf";
vi.mock("@vercel/blob", () => ({
  put: vi.fn(async (_path, _data, _opts) => ({
    url: mockBlobUrl,
    pathname: "cvs/alumni_test.pdf",
    contentType: "application/pdf",
  })),
  del: vi.fn(async (_url, _opts) => {}),
}));

describe("Alumni Interview Experience Form & Multi-Step Architecture", { timeout: 60000 }, () => {
  const timestamp = Date.now();
  const testCompanyId = "google";
  
  const alumniUser = {
    id: `usr_form_alumni_${timestamp}`,
    name: "Alumni Contributor",
    email: `alumni_form_${timestamp}@example.com`,
    role: "alumni",
  };

  const studentUser = {
    id: `usr_form_student_${timestamp}`,
    name: "Student Viewer",
    email: `student_form_${timestamp}@example.com`,
    role: "student",
  };

  beforeAll(async () => {
    // Insert test users
    await db.insert(user).values([
      {
        id: alumniUser.id,
        name: alumniUser.name,
        email: alumniUser.email,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: alumniUser.role,
      },
      {
        id: studentUser.id,
        name: studentUser.name,
        email: studentUser.email,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: studentUser.role,
      }
    ]).onConflictDoNothing();
  });

  afterAll(async () => {
    // Clean up created entities
    await db.delete(alumniCvs).where(eq(alumniCvs.userId, alumniUser.id));
    await db.delete(experiences).where(eq(experiences.authorId, alumniUser.id));
    await db.delete(user).where(inArray(user.id, [alumniUser.id, studentUser.id]));
  });

  it("1. creates draft experience with process & candidate details", async () => {
    mockState.user = alumniUser;

    const res = await createExperienceAction({
      companyId: testCompanyId,
      companyName: "Google",
      role: "Software Engineer (SDE 1)",
      year: 2025,
      type: "Full-time",
      rounds: 4,
      difficulty: "Medium-Hard",
      studentName: "Alumni Contributor",
      isAnonymous: false,
      summary: "Comprehensive Google SDE 1 interview process including OA, DSA, and System Design.",
      content: "Detailed experience walkthrough with candidate tips.",
      outcome: "Offer",
      timeline: "Cycle: On-Campus | August 2025",
      status: "draft",
    });

    expect(res.success).toBe(true);
    expect(res.id).toBeDefined();

    const exp = await getExperienceById(res.id);
    expect(exp).toBeDefined();
    expect(exp?.status).toBe("draft");
    expect(exp?.authorId).toBe(alumniUser.id);
    expect(exp?.difficulty).toBe("Medium-Hard");
  });

  it("2. saves Online Assessment (OA) conditional fields and questions", async () => {
    mockState.user = alumniUser;

    const expRes = await createExperienceAction({
      companyId: testCompanyId,
      companyName: "Google",
      role: "SDE 1",
      year: 2025,
      type: "Full-time",
      rounds: 1,
      difficulty: "Medium",
      studentName: "Alumni Contributor",
      isAnonymous: false,
      summary: "OA evaluation test",
      content: "OA description",
      status: "draft",
    });

    const roundsPayload = [
      {
        roundTypeName: "Online Assessment",
        title: "Online Assessment (Online)",
        summary: "Platform: HackerRank | Type: Coding",
        difficulty: "Medium",
        topics: ["Arrays", "Strings", "Dynamic Programming"],
        questions: [
          { text: "Find maximum subarray sum with length constraint", topic: "Arrays", difficulty: "Medium" },
          { text: "Count palindromic substrings in O(N)", topic: "Strings", difficulty: "Medium" }
        ],
      }
    ];

    const roundsRes = await updateExperienceRoundsAction({
      experienceId: expRes.id,
      rounds: roundsPayload,
    });

    expect(roundsRes.success).toBe(true);

    const savedRounds = await getExperienceWithRounds(expRes.id);
    expect(savedRounds.length).toBe(1);
    expect(savedRounds[0].roundTypeName).toBe("Online Assessment");
    expect(savedRounds[0].topics).toContain("Arrays");
    expect(savedRounds[0].topics).toContain("Dynamic Programming");
    expect(savedRounds[0].questions.length).toBe(2);
    expect(savedRounds[0].questions[0].text).toContain("Find maximum subarray sum");
  });

  it("3. handles dedicated DSA section with structured topics and questions", async () => {
    mockState.user = alumniUser;

    const expRes = await createExperienceAction({
      companyId: testCompanyId,
      companyName: "Google",
      role: "SDE 1",
      year: 2025,
      type: "Full-time",
      rounds: 1,
      difficulty: "Hard",
      studentName: "Alumni Contributor",
      isAnonymous: false,
      summary: "DSA coding evaluation",
      status: "draft",
    });

    const dsaRounds = [
      {
        roundTypeName: "DSA / Coding",
        title: "Data Structures & Algorithms",
        summary: "Live coding and algorithmic problem solving",
        difficulty: "Hard",
        topics: ["Trees", "Binary Search", "Dynamic Programming", "Sliding Window"],
        questions: [
          { text: "Find median in two sorted arrays of different sizes", topic: "Binary Search", difficulty: "Hard" },
          { text: "Lowest Common Ancestor in Binary Search Tree", topic: "Trees", difficulty: "Medium" }
        ],
      }
    ];

    await updateExperienceRoundsAction({
      experienceId: expRes.id,
      rounds: dsaRounds,
    });

    const saved = await getExperienceWithRounds(expRes.id);
    expect(saved.length).toBe(1);
    expect(saved[0].roundTypeName).toBe("DSA / Coding");
    expect(saved[0].topics).toEqual(expect.arrayContaining(["Trees", "Binary Search"]));
    expect(saved[0].questions.length).toBe(2);
    expect(saved[0].questions[0].text).toContain("Find median in two sorted arrays");
  });

  it("4. handles Core CS Fundamentals section as completely separate rounds from DSA", async () => {
    mockState.user = alumniUser;

    const expRes = await createExperienceAction({
      companyId: testCompanyId,
      companyName: "Google",
      role: "SDE 1",
      year: 2025,
      type: "Full-time",
      rounds: 3,
      difficulty: "Medium",
      studentName: "Alumni Contributor",
      isAnonymous: false,
      summary: "Core fundamentals assessment",
      status: "draft",
    });

    const fundamentalRounds = [
      {
        roundTypeName: "Technical Interview",
        title: "Core CS Fundamentals: DBMS",
        summary: "Conceptual questioning on DBMS",
        difficulty: "Medium",
        topics: ["Normalization", "Transactions", "ACID Properties", "Indexing & B-Trees"],
        questions: [
          { text: "Explain B+ Tree index structure vs Hash index", topic: "Indexing & B-Trees", difficulty: "Medium" },
          { text: "Explain isolation levels and phantom reads", topic: "Transactions", difficulty: "Hard" }
        ],
      },
      {
        roundTypeName: "Technical Interview",
        title: "Core CS Fundamentals: Operating Systems",
        summary: "Conceptual questioning on Operating Systems",
        difficulty: "Medium",
        topics: ["Processes & Threads", "Deadlocks", "Virtual Memory & Paging"],
        questions: [
          { text: "Explain banker's algorithm for deadlock avoidance", topic: "Deadlocks", difficulty: "Medium" }
        ],
      },
      {
        roundTypeName: "Technical Interview",
        title: "Core CS Fundamentals: OOP",
        summary: "Object-oriented design evaluation",
        difficulty: "Easy",
        topics: ["SOLID Principles", "Design Patterns", "Polymorphism"],
        questions: [
          { text: "Explain Dependency Inversion vs Dependency Injection", topic: "SOLID Principles", difficulty: "Easy" }
        ],
      }
    ];

    await updateExperienceRoundsAction({
      experienceId: expRes.id,
      rounds: fundamentalRounds,
    });

    const saved = await getExperienceWithRounds(expRes.id);
    expect(saved.length).toBe(3);
    expect(saved.map(r => r.title)).toContain("Core CS Fundamentals: DBMS");
    expect(saved.map(r => r.title)).toContain("Core CS Fundamentals: Operating Systems");
    expect(saved.map(r => r.title)).toContain("Core CS Fundamentals: OOP");
  });

  it("5. supports Machine Coding & AI / Debugging special technical rounds", async () => {
    mockState.user = alumniUser;

    const expRes = await createExperienceAction({
      companyId: testCompanyId,
      companyName: "Google",
      role: "SDE 1",
      year: 2025,
      type: "Full-time",
      rounds: 2,
      difficulty: "Medium-Hard",
      studentName: "Alumni Contributor",
      isAnonymous: false,
      summary: "Machine coding and AI debugging rounds",
      status: "draft",
    });

    const specialRounds = [
      {
        roundTypeName: "Machine Coding",
        title: "Round 2: Machine Coding",
        summary: "Problem: Build an in-memory pub-sub messaging broker | Tech: Node.js, TypeScript | Focus: Code Quality, Clean Architecture",
        difficulty: "Hard",
        topics: ["Machine Coding", "Concurrency", "Design Patterns"],
        questions: [
          { text: "Design and implement in-memory event bus with subscriber filtering", topic: "Machine Coding", difficulty: "Hard" }
        ],
      },
      {
        roundTypeName: "AI / Debugging",
        title: "Round 3: AI & Debugging",
        summary: "Focus Areas: Debugging in Pre-written Code, AI-assisted Development | Live bug fixing on distributed cache codebase",
        difficulty: "Medium",
        topics: ["Debugging", "AI-assisted Development"],
        questions: [
          { text: "Diagnose memory leak in high-throughput streaming server", topic: "Debugging", difficulty: "Medium" }
        ],
      }
    ];

    await updateExperienceRoundsAction({
      experienceId: expRes.id,
      rounds: specialRounds,
    });

    const saved = await getExperienceWithRounds(expRes.id);
    expect(saved.length).toBe(2);
    expect(saved[0].roundTypeName).toBe("Machine Coding");
    expect(saved[0].summary).toContain("in-memory pub-sub");
    expect(saved[1].roundTypeName).toBe("AI / Debugging");
    expect(saved[1].summary).toContain("AI-assisted Development");
  });

  it("6. integrates CV upload, defaults to private, and allows toggle sharing", async () => {
    mockState.user = alumniUser;

    // Simulate PDF upload
    const pdfBlob = new Blob(["%PDF-1.4 Mock Alumni Form CV Content"], { type: "application/pdf" });
    const file = new File([pdfBlob], "alumni_resume.pdf", { type: "application/pdf" });
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await uploadCvAction(formData);
    expect(uploadRes.success).toBe(true);
    expect(uploadRes.cv.fileName).toBe("alumni_resume.pdf");
    expect(uploadRes.cv.isShared).toBe(false); // MUST BE PRIVATE BY DEFAULT

    // Student should not have access to private CV
    mockState.user = studentUser;
    const privateAccess = await getAlumniCvAccess(alumniUser.id);
    expect(privateAccess.allowed).toBe(false);
    expect(privateAccess.reason).toBe("private");

    // Alumni enables sharing
    mockState.user = alumniUser;
    const toggleRes = await toggleCvSharingAction(true);
    expect(toggleRes.success).toBe(true);
    expect(toggleRes.isShared).toBe(true);

    // Student now has access to shared CV
    mockState.user = studentUser;
    const sharedAccess = await getAlumniCvAccess(alumniUser.id);
    expect(sharedAccess.allowed).toBe(true);
    expect(sharedAccess.reason).toBe("shared");
  });

  it("7. supports Anonymous Experience + Shared CV combination independently", async () => {
    mockState.user = alumniUser;

    // Ensure CV is shared
    await toggleCvSharingAction(true);

    // Create Anonymous Experience
    const anonRes = await createExperienceAction({
      companyId: testCompanyId,
      companyName: "Google",
      role: "SDE 1",
      year: 2025,
      type: "Full-time",
      rounds: 2,
      difficulty: "Medium",
      studentName: "Anonymous",
      isAnonymous: true,
      summary: "Anonymous submission with shared CV on profile",
      status: "draft",
    });

    const exp = await getExperienceById(anonRes.id);
    expect(exp?.isAnonymous).toBe(true);

    // Student views CV (allowed because CV is shared)
    mockState.user = studentUser;
    const cvAccess = await getAlumniCvAccess(alumniUser.id);
    expect(cvAccess.allowed).toBe(true);
  });

  it("8. supports Public Experience + Private CV combination independently", async () => {
    mockState.user = alumniUser;

    // Make CV private
    await toggleCvSharingAction(false);

    // Create Public Experience
    const pubRes = await createExperienceAction({
      companyId: testCompanyId,
      companyName: "Google",
      role: "SDE 1",
      year: 2025,
      type: "Full-time",
      rounds: 2,
      difficulty: "Medium",
      studentName: "Alumni Contributor",
      isAnonymous: false,
      summary: "Public experience with private CV",
      status: "draft",
    });

    const exp = await getExperienceById(pubRes.id);
    expect(exp?.isAnonymous).toBe(false);
    expect(exp?.studentName).toBe("Alumni Contributor");

    // Student attempts to view CV (blocked because CV is private)
    mockState.user = studentUser;
    const cvAccess = await getAlumniCvAccess(alumniUser.id);
    expect(cvAccess.allowed).toBe(false);
    expect(cvAccess.reason).toBe("private");
  });

  it("9. submits experience with audit logging and pending moderation status", async () => {
    mockState.user = alumniUser;

    const expRes = await createExperienceAction({
      companyId: testCompanyId,
      companyName: "Google",
      role: "SDE 1",
      year: 2025,
      type: "Full-time",
      rounds: 3,
      difficulty: "Medium",
      studentName: "Alumni Contributor",
      isAnonymous: false,
      summary: "Final submission experience",
      status: "draft",
    });

    const submitRes = await submitExperienceAction(expRes.id);
    expect(submitRes.success).toBe(true);

    const submittedExp = await getExperienceById(expRes.id);
    expect(submittedExp?.status).toBe("pending");

    // Check audit log record created
    const logs = await db.select().from(auditLog).where(eq(auditLog.entityId, expRes.id));
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action).toBe("experience_submitted");
  });

  it("10. submits complete experience via saveFullExperienceAction with full rounds & questions", async () => {
    mockState.user = alumniUser;

    const payload = {
      companyId: testCompanyId,
      companyName: "Google",
      role: "Software Development Engineer (SDE 1)",
      year: 2026,
      type: "Full-time",
      rounds: 3,
      difficulty: "Medium",
      studentName: "Alumni Contributor",
      isAnonymous: false,
      summary: "Full submission test summary",
      content: "Detailed experience content with rounds and recommendations.",
      outcome: "Offer",
      timeline: "Cycle: On-Campus | August 2026",
      status: "draft" as const,
    };

    const rounds = [
      {
        roundTypeName: "DSA / Coding",
        title: "DSA Round",
        summary: "Live coding on binary trees",
        difficulty: "Medium",
        topics: ["Trees", "Binary Search"],
        questions: [
          { text: "Find Lowest Common Ancestor", topic: "Trees", difficulty: "Medium" }
        ],
      },
      {
        roundTypeName: "Technical Interview",
        title: "Core CS Fundamentals: DBMS",
        summary: "Conceptual questions on ACID and Normalization",
        difficulty: "Medium",
        topics: ["Normalization", "ACID Properties"],
        questions: [
          { text: "Explain B-Trees vs B+ Trees", topic: "Normalization", difficulty: "Medium" }
        ],
      }
    ];

    const result = await saveFullExperienceAction({
      data: payload,
      rounds,
      targetStatus: "published",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();

    const saved = await getExperienceById(result.id);
    expect(saved).toBeDefined();
    expect(saved?.status).toBe("pending");

    const savedRounds = await getExperienceWithRounds(result.id);
    expect(savedRounds.length).toBe(2);
    expect(savedRounds[0].questions.length).toBe(1);
    expect(savedRounds[0].questions[0].canonicalText).toBe("Find Lowest Common Ancestor");
  });
});
