import { describe, it, expect } from "vitest";
import {
  createDriveSchema,
  updateDriveSchema,
  applyToDriveSchema,
  updateApplicationStatusSchema,
} from "../src/server/validators/placement";

describe("Placement Drives & Prep Generator Logic", () => {
  it("should categorize technical skills into correct domains", () => {
    const categorizeSkill = (skill: string) => {
      const sLower = skill.toLowerCase();
      if (sLower.includes("system") || sLower.includes("architecture") || sLower.includes("distributed")) {
        return "System Design";
      } else if (sLower.includes("sql") || sLower.includes("database") || sLower.includes("dbms")) {
        return "SQL";
      } else if (sLower.includes("react") || sLower.includes("node") || sLower.includes("python") || sLower.includes("java")) {
        return "Projects";
      }
      return "DSA";
    };

    expect(categorizeSkill("High Level System Architecture")).toBe("System Design");
    expect(categorizeSkill("Complex SQL Queries & Indexing")).toBe("SQL");
    expect(categorizeSkill("React & Node Microservices")).toBe("Projects");
    expect(categorizeSkill("Dynamic Programming & Graphs")).toBe("DSA");
  });

  it("should properly deduplicate generated preparation tasks against existing ones", () => {
    const existingTitles = new Set([
      "master core dsa requirements for google",
      "research google engineering culture",
    ]);

    const incomingTasks = [
      { title: "Master Core DSA Requirements for Google", category: "DSA" },
      { title: "Practice 5-10 high-frequency Trees questions", category: "DSA" },
      { title: "Research Google Engineering Culture", category: "Company Research" },
    ];

    const filtered = incomingTasks.filter(
      (t) => !existingTitles.has(t.title.toLowerCase().trim())
    );

    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe("Practice 5-10 high-frequency Trees questions");
  });

  it("should validate application state transitions", () => {
    const validTransitions: Record<string, string[]> = {
      applied: ["shortlisted", "rejected", "withdrawn"],
      shortlisted: ["interviewing", "rejected", "withdrawn"],
      interviewing: ["offered", "rejected", "withdrawn"],
      offered: [],
      rejected: [],
      withdrawn: [],
    };

    const isValidTransition = (from: string, to: string) => {
      return validTransitions[from]?.includes(to) ?? false;
    };

    expect(isValidTransition("applied", "shortlisted")).toBe(true);
    expect(isValidTransition("shortlisted", "interviewing")).toBe(true);
    expect(isValidTransition("interviewing", "offered")).toBe(true);
    expect(isValidTransition("offered", "applied")).toBe(false);
  });

  it("should validate placement drive schemas and reject unsafe resource URLs", () => {
    const valid = createDriveSchema.safeParse({
      companyId: "google",
      season: "Campus 2026",
      status: "Open",
      roles: [
        {
          title: "SDE-1",
          ctc: "28 LPA",
          requiredSkills: ["DSA", "System Design"],
          preparationResources: [
            { title: "NeetCode", url: "https://neetcode.io" },
          ],
        },
      ],
    });
    expect(valid.success).toBe(true);

    const xssResource = createDriveSchema.safeParse({
      companyId: "google",
      roles: [
        {
          title: "SDE-1",
          preparationResources: [{ title: "Bad", url: "javascript:alert(1)" }],
        },
      ],
    });
    expect(xssResource.success).toBe(false);

    const badStatus = updateApplicationStatusSchema.safeParse({
      applicationId: "app_1",
      status: "hacked_status",
    });
    expect(badStatus.success).toBe(false);

    const emptyUpdate = updateDriveSchema.safeParse({
      status: "Cancelled",
    });
    expect(emptyUpdate.success).toBe(true);

    const applyValid = applyToDriveSchema.safeParse({
      driveId: "drive_1",
      resumeUrl: "",
    });
    expect(applyValid.success).toBe(true);
  });
});
