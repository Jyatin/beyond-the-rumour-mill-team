import "server-only";

import { db } from "../db";
import {
  experiences,
  extractionRuns,
  roundTopics,
  interviewRounds,
  topics,
  experienceQuestions,
  interviewQuestions,
  consensusSnapshots,
  consensusItems,
} from "../db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import {
  CONSENSUS_FORMULA_VERSION,
  calculateReportWeight,
  calculateEffectiveSampleSize,
  calculateWeightedPrevalence,
  calculateWilsonInterval,
  isPublicationEligible,
  calculateVerificationScore,
  getCredibilityWeight,
  calculateRecencyWeight,
} from "./stats";
import { normalizeTopicCandidate } from "../normalization/normalizer";
import { normalizeQuestionCandidate } from "../normalization/question-normalizer";
import { ExtractedExperience } from "../ai/schema";

export interface BuildSnapshotParams {
  companyId: string;
  roleTitleId?: string;
  referenceDate?: Date;
}

export async function buildConsensusSnapshot(params: {
  companyId: string;
  roleTitleId?: string;
  referenceDate?: Date;
}) {
  const refDate = params.referenceDate || new Date();

  // 1. Fetch all published eligible experiences for company / role
  const whereClauses = [
    eq(experiences.companyId, params.companyId),
    eq(experiences.status, "published"),
  ];

  if (params.roleTitleId) {
    whereClauses.push(eq(experiences.roleId, params.roleTitleId));
  }

  const eligibleExps = await db
    .select()
    .from(experiences)
    .where(and(...whereClauses));

  if (eligibleExps.length === 0) {
    // Return empty / zero snapshot
    const emptySnapId = `snap_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const [emptySnap] = await db
      .insert(consensusSnapshots)
      .values({
        id: emptySnapId,
        companyId: params.companyId,
        roleTitleId: params.roleTitleId || null,
        formulaVersion: CONSENSUS_FORMULA_VERSION,
        totalEligibleExperiences: 0,
        totalWeightedExperiences: 0,
        verificationScore: 0,
        createdAt: refDate,
      })
      .returning();

    return { snapshot: emptySnap, items: [] };
  }

  // 2. Compute weights for all eligible experiences
  const expWeights = new Map<string, number>();
  const allEligibleWeights: number[] = [];
  let sumCredibility = 0;
  let sumRecency = 0;

  for (const exp of eligibleExps) {
    const w = calculateReportWeight({
      verificationStatus: exp.verificationStatus,
      createdAt: exp.createdAt,
      referenceDate: refDate,
    });
    expWeights.set(exp.id, w);
    allEligibleWeights.push(w);

    sumCredibility += getCredibilityWeight(exp.verificationStatus);
    sumRecency += calculateRecencyWeight(exp.createdAt, refDate);
  }

  const totalWeightedExperiences = allEligibleWeights.reduce((acc, w) => acc + w, 0);

  // 3. Collect topic mentions across experiences (1 mention per experience per topic)
  // Map: canonicalTopicId -> Set of experienceIds
  const topicMentions = new Map<string, { label: string; expIds: Set<string> }>();
  // Map: canonicalQuestionId -> Set of experienceIds
  const questionMentions = new Map<string, { label: string; expIds: Set<string> }>();

  const expIds = eligibleExps.map((e) => e.id);

  // A. Human structured topics
  const humanRounds = await db
    .select({
      expId: interviewRounds.experienceId,
      topicId: roundTopics.topicId,
      topicName: topics.name,
    })
    .from(roundTopics)
    .innerJoin(interviewRounds, eq(roundTopics.roundId, interviewRounds.id))
    .innerJoin(topics, eq(roundTopics.topicId, topics.id))
    .where(inArray(interviewRounds.experienceId, expIds));

  for (const hr of humanRounds) {
    if (!topicMentions.has(hr.topicId)) {
      topicMentions.set(hr.topicId, { label: hr.topicName, expIds: new Set() });
    }
    topicMentions.get(hr.topicId)!.expIds.add(hr.expId);
  }

  // B. AI Extracted topics
  const successfulRuns = await db
    .select()
    .from(extractionRuns)
    .where(
      and(
        inArray(extractionRuns.experienceId, expIds),
        eq(extractionRuns.status, "succeeded")
      )
    )
    .orderBy(desc(extractionRuns.createdAt));

  let successfulRunsCount = 0;
  // Use latest run per experience
  const seenExpRuns = new Set<string>();
  for (const run of successfulRuns) {
    if (seenExpRuns.has(run.experienceId)) continue;
    seenExpRuns.add(run.experienceId);
    successfulRunsCount++;

    const extracted = run.extractedData as unknown as ExtractedExperience;
    if (!extracted) continue;

    // Process round topics & unassigned topics
    const candidateLabels = new Set<string>();
    for (const rnd of extracted.rounds || []) {
      for (const top of rnd.topics || []) {
        if (top.label) candidateLabels.add(top.label);
      }
    }
    for (const top of extracted.unassignedTopics || []) {
      if (top.label) candidateLabels.add(top.label);
    }

    for (const rawLabel of candidateLabels) {
      const normRes = await normalizeTopicCandidate(rawLabel);
      if (normRes.status === "matched" && normRes.topicId) {
        const topId = normRes.topicId;
        const topName = normRes.topicName || rawLabel;
        if (!topicMentions.has(topId)) {
          topicMentions.set(topId, { label: topName, expIds: new Set() });
        }
        topicMentions.get(topId)!.expIds.add(run.experienceId);
      }
    }

    // Process extracted questions
    const candidateQuestions = new Set<string>();
    for (const rnd of extracted.rounds || []) {
      for (const q of rnd.questions || []) {
        if (q.text) candidateQuestions.add(q.text);
      }
    }
    for (const q of extracted.unassignedQuestions || []) {
      if (q.text) candidateQuestions.add(q.text);
    }

    for (const rawQ of candidateQuestions) {
      const qNorm = await normalizeQuestionCandidate(rawQ);
      if (qNorm.status === "matched" && qNorm.questionId) {
        const qId = qNorm.questionId;
        const qText = qNorm.canonicalText || rawQ;
        if (!questionMentions.has(qId)) {
          questionMentions.set(qId, { label: qText, expIds: new Set() });
        }
        questionMentions.get(qId)!.expIds.add(run.experienceId);
      }
    }
  }

  // C. Human structured questions
  const humanQuestions = await db
    .select({
      expId: experienceQuestions.experienceId,
      questionId: experienceQuestions.questionId,
      canonicalText: interviewQuestions.canonicalText,
    })
    .from(experienceQuestions)
    .innerJoin(interviewQuestions, eq(experienceQuestions.questionId, interviewQuestions.id))
    .where(inArray(experienceQuestions.experienceId, expIds));

  for (const hq of humanQuestions) {
    if (!questionMentions.has(hq.questionId)) {
      questionMentions.set(hq.questionId, { label: hq.canonicalText, expIds: new Set() });
    }
    questionMentions.get(hq.questionId)!.expIds.add(hq.expId);
  }

  // 4. Calculate verification score components
  const avgCredibility = sumCredibility / eligibleExps.length;
  const avgRecency = sumRecency / eligibleExps.length;
  const coverage = Math.min(1.0, eligibleExps.length / 10.0);
  const evidenceQuality = seenExpRuns.size > 0 ? successfulRunsCount / seenExpRuns.size : 0.5;

  // Compute agreement from topic distribution
  let totalPrevalences = 0;
  let topicCount = 0;

  // 5. Create consensus snapshot record
  const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const createdItems: Array<typeof consensusItems.$inferInsert> = [];

  // Generate topic consensus items
  for (const [topicId, data] of topicMentions.entries()) {
    const supportingExpIds = Array.from(data.expIds);
    const supportingWeights = supportingExpIds.map((id) => expWeights.get(id) || 0.3);
    const reportCount = supportingExpIds.length;
    const totalWeight = supportingWeights.reduce((acc, w) => acc + w, 0);

    const prevalence = calculateWeightedPrevalence(supportingWeights, allEligibleWeights);
    const nEff = calculateEffectiveSampleSize(supportingWeights);
    const interval = calculateWilsonInterval(prevalence, nEff);

    totalPrevalences += prevalence;
    topicCount++;

    const status = isPublicationEligible(reportCount)
      ? "published"
      : "insufficient_evidence";

    createdItems.push({
      id: `ci_top_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      snapshotId,
      entityType: "topic",
      entityId: topicId,
      entityLabel: data.label,
      reportCount,
      effectiveSampleSize: Math.round(nEff * 100) / 100,
      weightedPrevalence: Math.round(prevalence * 10000) / 10000,
      lowerBound: interval.lower,
      upperBound: interval.upper,
      totalWeight: Math.round(totalWeight * 100) / 100,
      status,
      formulaVersion: CONSENSUS_FORMULA_VERSION,
      metadata: { supportingExperienceIds: supportingExpIds },
      createdAt: refDate,
    });
  }

  // Generate question consensus items
  for (const [questionId, data] of questionMentions.entries()) {
    const supportingExpIds = Array.from(data.expIds);
    const supportingWeights = supportingExpIds.map((id) => expWeights.get(id) || 0.3);
    const reportCount = supportingExpIds.length;
    const totalWeight = supportingWeights.reduce((acc, w) => acc + w, 0);

    const prevalence = calculateWeightedPrevalence(supportingWeights, allEligibleWeights);
    const nEff = calculateEffectiveSampleSize(supportingWeights);
    const interval = calculateWilsonInterval(prevalence, nEff);

    const status = isPublicationEligible(reportCount)
      ? "published"
      : "insufficient_evidence";

    createdItems.push({
      id: `ci_q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      snapshotId,
      entityType: "question",
      entityId: questionId,
      entityLabel: data.label,
      reportCount,
      effectiveSampleSize: Math.round(nEff * 100) / 100,
      weightedPrevalence: Math.round(prevalence * 10000) / 10000,
      lowerBound: interval.lower,
      upperBound: interval.upper,
      totalWeight: Math.round(totalWeight * 100) / 100,
      status,
      formulaVersion: CONSENSUS_FORMULA_VERSION,
      metadata: { supportingExperienceIds: supportingExpIds },
      createdAt: refDate,
    });
  }

  const avgAgreement = topicCount > 0 ? totalPrevalences / topicCount : 0.5;

  const verificationScore = calculateVerificationScore({
    coverage,
    agreement: avgAgreement,
    credibility: avgCredibility,
    recency: avgRecency,
    evidenceQuality,
  });

  // Insert snapshot & items
  const [snapshot] = await db
    .insert(consensusSnapshots)
    .values({
      id: snapshotId,
      companyId: params.companyId,
      roleTitleId: params.roleTitleId || null,
      formulaVersion: CONSENSUS_FORMULA_VERSION,
      totalEligibleExperiences: eligibleExps.length,
      totalWeightedExperiences: Math.round(totalWeightedExperiences * 100) / 100,
      verificationScore,
      createdAt: refDate,
    })
    .returning();

  if (createdItems.length > 0) {
    await db.insert(consensusItems).values(createdItems);
  }

  return {
    snapshot,
    items: createdItems,
  };
}
