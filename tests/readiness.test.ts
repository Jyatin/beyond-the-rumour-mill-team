import { describe, it, expect } from "vitest";
import {
  calculateReadinessScore,
  extractDrivePreparationProfile,
} from "../src/server/readiness/calculator";

describe("Readiness Score Calculator Engine", () => {
  it("should return early preparation state for empty tasks", () => {
    const res = calculateReadinessScore({
      items: [],
      companyRequiredSkills: ["DSA", "System Design", "SQL"],
      companyTopTopics: ["Dynamic Programming", "Trees"],
      hasCompletedMock: false,
    });

    expect(res.score).toBe(0);
    expect(res.badge).toBe("Early Preparation");
    expect(res.criticalGaps.length).toBeGreaterThan(0);
    expect(res.criticalGaps).toContain("No mock interview or live interview rehearsal completed yet");
  });

  it("should compute weighted score based on skill, topic, mock and behavioral coverage", () => {
    const items = [
      { title: "Master DSA for Google", category: "DSA", completedAt: new Date() },
      { title: "Review System Design patterns", category: "System Design", completedAt: new Date() },
      { title: "Practice Dynamic Programming", category: "DSA", completedAt: new Date() },
      { title: "Research company culture", category: "Company Research", completedAt: new Date() },
    ];

    const res = calculateReadinessScore({
      items,
      companyRequiredSkills: ["DSA", "System Design"],
      companyTopTopics: ["Dynamic Programming"],
      hasCompletedMock: true,
    });

    // Skills: 100% * 0.35 = 35
    // Topics: 100% * 0.30 = 30
    // Mock: 100% * 0.20 = 20
    // Behavioral: 100% * 0.15 = 15
    // Total: 100
    expect(res.score).toBe(100);
    expect(res.badge).toBe("High Readiness");
    expect(res.strengths.length).toBeGreaterThan(0);
  });

  it("should accurately reflect moderate readiness when mock interview is missing", () => {
    const items = [
      { title: "Master DSA for Amazon", category: "DSA", completedAt: new Date() },
      { title: "Practice Dynamic Programming", category: "DSA", completedAt: new Date() },
      { title: "Behavioral STAR stories", category: "Behavioral", completedAt: new Date() },
    ];

    const res = calculateReadinessScore({
      items,
      companyRequiredSkills: ["DSA", "System Design"], // 50%
      companyTopTopics: ["Dynamic Programming", "Graphs"], // 50%
      hasCompletedMock: false, // 0%
    });

    expect(res.score).toBeGreaterThanOrEqual(30);
    expect(res.score).toBeLessThan(75);
    expect(res.criticalGaps).toContain("No mock interview or live interview rehearsal completed yet");
  });

  it("should deduplicate drive skills, topics, and resources from placement drives", () => {
    const profile = extractDrivePreparationProfile([
      {
        roles: [
          {
            preparation: {
              requiredSkills: ["DSA", "System Design", " DSA "],
              suggestedTopics: ["Graphs", "Dynamic Programming"],
              preparationResources: [
                { title: "NeetCode Roadmap", url: "https://neetcode.io/roadmap" },
                { title: "System Design Primer" },
              ],
            },
          },
          {
            preparation: {
              requiredSkills: ["SQL", "System Design"],
              suggestedTopics: ["Graphs", "Trees"],
              preparationResources: [
                { title: "NeetCode Roadmap", url: "https://neetcode.io/roadmap" },
              ],
            },
          },
        ],
      },
    ]);

    expect(profile.requiredSkills).toEqual(["DSA", "System Design", "SQL"]);
    expect(profile.suggestedTopics).toEqual(["Graphs", "Dynamic Programming", "Trees"]);
    expect(profile.resources).toEqual([
      { title: "NeetCode Roadmap", url: "https://neetcode.io/roadmap" },
      { title: "System Design Primer" },
    ]);
  });
});
