"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db";
import {
  preparationItems,
  driveRoles,
  preparationRequirements,
  companies,
  consensusSnapshots,
  consensusItems,
} from "../db/schema";
import { requireUser } from "../auth-helpers";
import { eq, and } from "drizzle-orm";

export async function generatePreparationPlanAction({
  companyId,
  driveId,
}: {
  companyId: string;
  driveId?: string;
}) {
  const user = await requireUser();

  // 1. Fetch Company details
  const company = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1)
    .then((r) => r[0]);

  if (!company) {
    throw new Error("Company not found");
  }

  // 2. Fetch Drive Requirements if driveId provided
  const targetSkills: string[] = [];
  const suggestedTopics: string[] = [];

  if (driveId) {
    const roles = await db
      .select({
        prep: preparationRequirements,
      })
      .from(driveRoles)
      .leftJoin(preparationRequirements, eq(driveRoles.id, preparationRequirements.driveRoleId))
      .where(eq(driveRoles.driveId, driveId));

    for (const r of roles) {
      if (r.prep?.requiredSkills) {
        targetSkills.push(...r.prep.requiredSkills);
      }
      if (r.prep?.suggestedTopics) {
        suggestedTopics.push(...r.prep.suggestedTopics);
      }
    }
  }

  // Add company's top topics from company profile if available
  if (company.topTopics && Array.isArray(company.topTopics)) {
    company.topTopics.forEach((t) => {
      if (t.topic && !suggestedTopics.includes(t.topic)) {
        suggestedTopics.push(t.topic);
      }
    });
  }

  // 3. Fetch Historical Consensus Items for this Company if available
  const latestSnapshot = await db
    .select()
    .from(consensusSnapshots)
    .where(eq(consensusSnapshots.companyId, companyId))
    .orderBy(consensusSnapshots.createdAt)
    .limit(1)
    .then((r) => r[0]);

  const consensusTopicLabels: string[] = [];
  if (latestSnapshot) {
    const items = await db
      .select()
      .from(consensusItems)
      .where(and(eq(consensusItems.snapshotId, latestSnapshot.id), eq(consensusItems.entityType, "topic")))
      .limit(6);

    items.forEach((i) => consensusTopicLabels.push(i.entityLabel));
  }

  // Deduplicate
  const uniqueSkills = Array.from(new Set(targetSkills.map((s) => s.trim()))).filter(Boolean);
  const uniqueTopics = Array.from(
    new Set([...suggestedTopics, ...consensusTopicLabels].map((t) => t.trim()))
  ).filter(Boolean);

  // 4. Construct Structured Plan Items
  const candidateTasks: Array<{
    title: string;
    description: string;
    category: string;
  }> = [];

  // Skills -> Categorized Tasks
  uniqueSkills.forEach((skill) => {
    let category = "DSA";
    const sLower = skill.toLowerCase();
    if (sLower.includes("system") || sLower.includes("architecture") || sLower.includes("distributed")) {
      category = "System Design";
    } else if (sLower.includes("sql") || sLower.includes("database") || sLower.includes("dbms")) {
      category = "SQL";
    } else if (sLower.includes("react") || sLower.includes("node") || sLower.includes("python") || sLower.includes("java")) {
      category = "Projects";
    }

    candidateTasks.push({
      title: `Master core ${skill} requirements for ${company.name}`,
      description: `Review fundamental patterns, standard questions, and typical problems required for ${company.name}.`,
      category,
    });
  });

  // Topics -> Problem Solving Tasks
  uniqueTopics.forEach((topic) => {
    candidateTasks.push({
      title: `Practice 5-10 high-frequency ${topic} questions`,
      description: `Historical interview rounds for ${company.name} consistently test ${topic}. Solve representative LeetCode/GFG problems.`,
      category: "DSA",
    });
  });

  // Standard Essential Baseline Tasks for the Company
  candidateTasks.push({
    title: `Research ${company.name} engineering culture and core products`,
    description: `Understand recent technical blog posts, company mission, and product ecosystem before the interviews.`,
    category: "Company Research",
  });

  candidateTasks.push({
    title: `Prepare STAR-format stories for ${company.name} behavioral round`,
    description: `Draft structured examples of leadership, resolving technical disagreement, overcoming roadblocks, and project trade-offs.`,
    category: "Behavioral",
  });

  candidateTasks.push({
    title: `Complete a 45-min peer or alumni mock interview for ${company.name}`,
    description: `Simulate real round pressure, think out loud, and calibrate time management before actual drive day.`,
    category: "Mock Interview",
  });

  // 5. Fetch existing tasks for this user & company to avoid duplicates
  const existingItems = await db
    .select({ title: preparationItems.title })
    .from(preparationItems)
    .where(and(eq(preparationItems.userId, user.id), eq(preparationItems.companyId, companyId)));

  const existingTitles = new Set(existingItems.map((i) => i.title.toLowerCase().trim()));

  // 6. Insert new non-duplicate items
  let insertedCount = 0;
  for (const task of candidateTasks) {
    if (existingTitles.has(task.title.toLowerCase().trim())) {
      continue;
    }

    const itemId = `prep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.insert(preparationItems).values({
      id: itemId,
      userId: user.id,
      companyId: companyId,
      driveId: driveId || null,
      source: "auto_drive",
      title: task.title,
      description: task.description,
      category: task.category,
    });
    insertedCount++;
  }

  revalidatePath("/prepare");
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/profile");

  return {
    success: true,
    companyName: company.name,
    tasksAdded: insertedCount,
    totalPlanned: candidateTasks.length,
  };
}
