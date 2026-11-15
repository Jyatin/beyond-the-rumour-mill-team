export interface ReadinessResult {
  score: number; // 0 to 100
  badge: "High Readiness" | "Moderate Readiness" | "Early Preparation";
  color: string;
  summary: string;
  breakdown: {
    skillCoveragePct: number;
    topicCoveragePct: number;
    mockRehearsalPct: number;
    behavioralPct: number;
  };
  criticalGaps: string[];
  strengths: string[];
}

export interface ExtractedDrivePrepProfile {
  requiredSkills: string[];
  suggestedTopics: string[];
  resources: Array<{ title: string; url?: string }>;
}

export function extractDrivePreparationProfile(
  drives: Array<{
    roles?: Array<{
      preparation?: {
        requiredSkills?: string[] | null;
        suggestedTopics?: string[] | null;
        preparationResources?: Array<{ title: string; url?: string }> | null;
      } | null;
    }>;
  }> = []
): ExtractedDrivePrepProfile {
  const skillsSet = new Set<string>();
  const topicsSet = new Set<string>();
  const resourceMap = new Map<string, { title: string; url?: string }>();

  for (const drive of drives) {
    for (const role of drive.roles || []) {
      const prep = role.preparation;
      if (!prep) continue;
      for (const s of prep.requiredSkills || []) {
        const clean = s.trim();
        if (clean) skillsSet.add(clean);
      }
      for (const t of prep.suggestedTopics || []) {
        const clean = t.trim();
        if (clean) topicsSet.add(clean);
      }
      for (const r of prep.preparationResources || []) {
        const cleanTitle = r?.title?.trim();
        if (!cleanTitle) continue;
        const key = `${cleanTitle.toLowerCase()}::${r.url || ""}`;
        if (!resourceMap.has(key)) {
          resourceMap.set(key, r.url ? { title: cleanTitle, url: r.url } : { title: cleanTitle });
        }
      }
    }
  }

  return {
    requiredSkills: Array.from(skillsSet),
    suggestedTopics: Array.from(topicsSet),
    resources: Array.from(resourceMap.values()),
  };
}

export function calculateReadinessScore({
  items = [],
  companyRequiredSkills = [],
  companyTopTopics = [],
  hasCompletedMock = false,
}: {
  items: Array<{ title: string; category: string; completedAt: Date | null | string }>;
  companyRequiredSkills?: string[];
  companyTopTopics?: string[];
  hasCompletedMock?: boolean;
}): ReadinessResult {
  const completedItems = items.filter((i) => i.completedAt !== null);

  // 1. Skill Coverage (Weight: 35%)
  let skillCoveragePct = 0;
  if (companyRequiredSkills.length > 0) {
    const matchedSkills = companyRequiredSkills.filter((skill) =>
      completedItems.some(
        (i) => i.title.toLowerCase().includes(skill.toLowerCase()) || i.category.toLowerCase().includes(skill.toLowerCase())
      )
    );
    skillCoveragePct = Math.round((matchedSkills.length / companyRequiredSkills.length) * 100);
  } else {
    // If no explicit skills listed, compute based on total core tasks (DSA, System Design, SQL)
    const coreTasks = items.filter((i) => ["DSA", "System Design", "SQL", "Development"].includes(i.category));
    const completedCore = coreTasks.filter((i) => i.completedAt !== null);
    skillCoveragePct = coreTasks.length > 0 ? Math.round((completedCore.length / coreTasks.length) * 100) : (completedItems.length > 0 ? 50 : 0);
  }

  // 2. Topic Coverage (Weight: 30%)
  let topicCoveragePct = 0;
  if (companyTopTopics.length > 0) {
    const matchedTopics = companyTopTopics.filter((topic) =>
      completedItems.some((i) => i.title.toLowerCase().includes(topic.toLowerCase()))
    );
    topicCoveragePct = Math.round((matchedTopics.length / companyTopTopics.length) * 100);
  } else {
    const topicTasks = items.filter((i) => !["Behavioral", "Company Research", "Mock Interview"].includes(i.category));
    const completedTopic = topicTasks.filter((i) => i.completedAt !== null);
    topicCoveragePct = topicTasks.length > 0 ? Math.round((completedTopic.length / topicTasks.length) * 100) : (completedItems.length > 0 ? 50 : 0);
  }

  // 3. Mock Rehearsal (Weight: 20%)
  const hasMockItem = completedItems.some((i) => i.category === "Mock Interview");
  const mockRehearsalPct = hasCompletedMock || hasMockItem ? 100 : 0;

  // 4. Behavioral & Company Research (Weight: 15%)
  const behavioralTasks = items.filter((i) => ["Behavioral", "Company Research"].includes(i.category));
  const completedBehavioral = behavioralTasks.filter((i) => i.completedAt !== null);
  const behavioralPct = behavioralTasks.length > 0 ? Math.round((completedBehavioral.length / behavioralTasks.length) * 100) : (completedItems.length > 0 ? 50 : 0);

  // Compute final weighted composite
  const rawScore =
    skillCoveragePct * 0.35 +
    topicCoveragePct * 0.30 +
    mockRehearsalPct * 0.20 +
    behavioralPct * 0.15;

  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Identify Critical Gaps
  const criticalGaps: string[] = [];
  if (companyRequiredSkills.length > 0) {
    companyRequiredSkills.forEach((skill) => {
      const isDone = completedItems.some((i) => i.title.toLowerCase().includes(skill.toLowerCase()));
      if (!isDone && criticalGaps.length < 3) {
        criticalGaps.push(`Uncovered skill requirement: ${skill}`);
      }
    });
  }
  if (!hasCompletedMock && !hasMockItem) {
    criticalGaps.push("No mock interview or live interview rehearsal completed yet");
  }
  if (behavioralPct < 50) {
    criticalGaps.push("Behavioral & leadership principles prep incomplete");
  }

  // Strengths
  const strengths: string[] = [];
  if (skillCoveragePct >= 75) strengths.push("Strong coverage of target technical requirements");
  if (topicCoveragePct >= 75) strengths.push("Thorough preparation of historical interview topics");
  if (mockRehearsalPct === 100) strengths.push("Practical mock interview practice verified");
  if (behavioralPct >= 75) strengths.push("Solid foundation in behavioral & culture fit questions");

  let badge: "High Readiness" | "Moderate Readiness" | "Early Preparation" = "Early Preparation";
  let color = "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-300";
  let summary = "Initial preparation phase. Focus on high-frequency topics and required skills.";

  if (score >= 75) {
    badge = "High Readiness";
    color = "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300";
    summary = "Outstanding preparation trajectory. Ready for full technical and behavioral rounds.";
  } else if (score >= 50) {
    badge = "Moderate Readiness";
    color = "text-blue-700 bg-blue-50 dark:bg-blue-950/30 border-blue-300";
    summary = "Solid core knowledge. Bridge remaining critical gaps and complete a mock interview.";
  }

  return {
    score,
    badge,
    color,
    summary,
    breakdown: {
      skillCoveragePct,
      topicCoveragePct,
      mockRehearsalPct,
      behavioralPct,
    },
    criticalGaps,
    strengths,
  };
}
