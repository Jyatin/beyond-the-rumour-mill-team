import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "../src/server/db";
import {
  topics,
  topicAliases,
  companies,
  user,
  experiences,
  interviewQuestions,
  extractionRuns,
  consensusSnapshots,
} from "../src/server/db/schema";
import { eq, inArray } from "drizzle-orm";
import {
  normalizeLabel,
  normalizeTopicCandidate,
} from "../src/server/normalization/normalizer";
import { normalizeQuestionCandidate } from "../src/server/normalization/question-normalizer";
import {
  CONSENSUS_FORMULA_VERSION,
  MIN_INDEPENDENT_REPORTS_THRESHOLD,
  getCredibilityWeight,
  calculateRecencyWeight,
  calculateIndependenceCorrection,
  calculateReportWeight,
  calculateEffectiveSampleSize,
  calculateWeightedPrevalence,
  calculateWilsonInterval,
  isPublicationEligible,
  calculateVerificationScore,
} from "../src/server/consensus/stats";
import { buildConsensusSnapshot } from "../src/server/consensus/builder";
import { getLatestConsensusForCompany } from "../src/server/consensus/queries";
import { generateConsensusSnapshotAction } from "../src/server/actions/consensus";

let mockUser: { id: string; role: string } = { id: "user_consensus_admin", role: "admin" };

vi.mock("../src/server/auth-helpers", () => ({
  requireUser: vi.fn(async () => mockUser),
  getCurrentUser: vi.fn(async () => mockUser),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Phase 3.2: Normalization & Deterministic Consensus", () => {
  const testCompany = {
    id: "comp_consensus_test",
    name: "Consensus Dynamics Inc",
    industry: "Enterprise Software",
    roles: ["Software Engineer"],
    verificationStatus: "verified" as const,
    lastVerifiedAt: new Date().toISOString(),
    topTopics: [],
  };

  beforeEach(async () => {
    mockUser = { id: "user_consensus_admin", role: "admin" };

    // Setup user and company
    await db.insert(user).values({
      id: "user_consensus_admin",
      name: "Consensus Admin",
      email: "admin@consensus.com",
      role: "admin",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();

    await db.insert(companies).values(testCompany).onConflictDoNothing();

    // Setup canonical topic & aliases
    await db.insert(topics).values([
      { id: "top_hash_tables", name: "Hash Tables" },
      { id: "top_sys_design", name: "System Design" },
      { id: "top_dynamic_prog", name: "Dynamic Programming" },
    ]).onConflictDoNothing();

    await db.delete(topicAliases).where(inArray(topicAliases.id, ["alias_1", "alias_2", "alias_3"]));

    await db.insert(topicAliases).values([
      {
        id: "alias_1",
        topicId: "top_hash_tables",
        alias: "HashMaps",
        normalizedAlias: normalizeLabel("HashMaps"),
      },
      {
        id: "alias_2",
        topicId: "top_hash_tables",
        alias: "hash-map",
        normalizedAlias: normalizeLabel("hash-map"),
      },
      {
        id: "alias_3",
        topicId: "top_dynamic_prog",
        alias: "DP",
        normalizedAlias: normalizeLabel("DP"),
      },
    ]);

    await db.insert(interviewQuestions).values([
      {
        id: "q_canonical_two_sum",
        canonicalText: "Two Sum with Hash Map",
        normalizedHash: "hash_two_sum_canon",
        topicId: "top_hash_tables",
      },
    ]).onConflictDoNothing();
  });

  // --- 1. NORMALIZATION TESTS ---

  it("1. Alias normalization resolves known variants to canonical topic", async () => {
    const res1 = await normalizeTopicCandidate("HashMaps");
    expect(res1.status).toBe("matched");
    expect(res1.topicId).toBe("top_hash_tables");
    expect(res1.method).toBe("alias");

    const res2 = await normalizeTopicCandidate("hash-map");
    expect(res2.status).toBe("matched");
    expect(res2.topicId).toBe("top_hash_tables");
  });

  it("2. Exact canonical topic matching works", async () => {
    const res = await normalizeTopicCandidate("System Design");
    expect(res.status).toBe("matched");
    expect(res.topicId).toBe("top_sys_design");
    expect(res.method).toBe("exact");
  });

  it("3. Trigram fuzzy matching resolves close typographical variants", async () => {
    // "Hash Table" (singular variant of "Hash Tables") -> matches "Hash Tables" (similarity >= 0.80)
    const res = await normalizeTopicCandidate("Hash Table");
    expect(res.status).toBe("matched");
    expect(res.topicId).toBe("top_hash_tables");
    expect(res.method).toBe("trigram");
    expect(res.confidence).toBeGreaterThanOrEqual(0.76);
  });

  it("4. Ambiguous candidates remain pending without unsafe auto-merge", async () => {
    // "Design System" vs "System Design" (word reversal) -> intermediate similarity score (0.55..0.85)
    const res = await normalizeTopicCandidate("Design System");
    expect(res.status).toBe("pending");
    expect(res.confidence).toBeLessThan(0.85);
    expect(res.confidence).toBeGreaterThanOrEqual(0.55);
  });

  it("5. Question candidate normalization matches canonical questions", async () => {
    const qRes = await normalizeQuestionCandidate("Two Sum with Hash Map");
    expect(qRes.status).toBe("matched");
    expect(qRes.questionId).toBe("q_canonical_two_sum");
    expect(qRes.method).toBe("exact");
  });

  // --- 2. STATISTICAL & MATHEMATICAL FOUNDATION TESTS ---

  it("6. Credibility weights adhere to blueprint specifications", () => {
    expect(getCredibilityWeight("verified")).toBe(1.00);
    expect(getCredibilityWeight("official")).toBe(1.00);
    expect(getCredibilityWeight("community")).toBe(0.80);
    expect(getCredibilityWeight("review")).toBe(0.50);
    expect(getCredibilityWeight(null)).toBe(0.30);
    expect(getCredibilityWeight("unknown")).toBe(0.30);
  });

  it("7. 12-month exponential half-life recency decay is mathematically correct", () => {
    const ref = new Date("2026-01-01T00:00:00Z");
    
    // Exactly 0 months old -> recency 1.0
    const w0 = calculateRecencyWeight(new Date("2026-01-01T00:00:00Z"), ref);
    expect(w0).toBeCloseTo(1.0, 4);

    // Exactly 12 months old -> recency 0.5
    const date12m = new Date(ref.getTime() - 12 * 30.4375 * 24 * 60 * 60 * 1000);
    const w12 = calculateRecencyWeight(date12m, ref);
    expect(w12).toBeCloseTo(0.5, 2);

    // Exactly 24 months old -> recency 0.25
    const date24m = new Date(ref.getTime() - 24 * 30.4375 * 24 * 60 * 60 * 1000);
    const w24 = calculateRecencyWeight(date24m, ref);
    expect(w24).toBeCloseTo(0.25, 2);
  });

  it("8. Independence correction scales with cluster size", () => {
    expect(calculateIndependenceCorrection(1)).toBe(1.0);
    expect(calculateIndependenceCorrection(4)).toBe(0.5); // 1 / sqrt(4) = 0.5
    expect(calculateIndependenceCorrection(9)).toBeCloseTo(1 / 3, 4); // 1 / sqrt(9) = 0.3333
  });

  it("9. Combined report weight multiplies credibility, recency, independence", () => {
    const ref = new Date("2026-01-01T00:00:00Z");
    const weight = calculateReportWeight({
      verificationStatus: "verified", // 1.0
      createdAt: ref,                 // 1.0
      clusterSize: 4,                 // 0.5
      referenceDate: ref,
    });
    expect(weight).toBeCloseTo(0.5, 4);
  });

  it("10. Kish Effective Sample Size (n_eff) calculation is accurate", () => {
    // Equal weights -> n_eff = N
    const equalWeights = [1.0, 1.0, 1.0, 1.0];
    expect(calculateEffectiveSampleSize(equalWeights)).toBe(4.0);

    // Unequal weights: [1.0, 0.5, 0.5, 0.5]
    // sum = 2.5, sum^2 = 6.25, sum(w^2) = 1 + 0.25 + 0.25 + 0.25 = 1.75
    // n_eff = 6.25 / 1.75 = 3.5714
    const unequal = [1.0, 0.5, 0.5, 0.5];
    expect(calculateEffectiveSampleSize(unequal)).toBeCloseTo(3.5714, 3);
  });

  it("11. Weighted prevalence computes proportion correctly", () => {
    const supporting = [1.0, 0.8];
    const all = [1.0, 0.8, 0.5, 0.5];
    // sum(supp) = 1.8, sum(all) = 2.8 -> prev = 1.8 / 2.8 = 0.642857
    const prev = calculateWeightedPrevalence(supporting, all);
    expect(prev).toBeCloseTo(0.6429, 3);
  });

  it("12. Wilson Score Interval computes valid intervals for non-trivial inputs", () => {
    const interval = calculateWilsonInterval(0.6, 20);
    expect(interval.lower).toBeGreaterThan(0.3);
    expect(interval.upper).toBeLessThan(0.9);
    expect(interval.lower).toBeLessThan(interval.upper);
    expect(interval.center).toBeGreaterThan(interval.lower);
    expect(interval.center).toBeLessThan(interval.upper);
  });

  it("13. Wilson interval handles edge cases without NaN or Infinity", () => {
    // Edge case: zero effective sample size
    const zeroN = calculateWilsonInterval(0.5, 0);
    expect(zeroN.lower).toBe(0);
    expect(zeroN.upper).toBe(0);

    // Edge case: p = 0
    const zeroP = calculateWilsonInterval(0.0, 10);
    expect(zeroP.lower).toBe(0.0);
    expect(zeroP.upper).toBeGreaterThan(0.0);
    expect(Number.isFinite(zeroP.upper)).toBe(true);

    // Edge case: p = 1
    const oneP = calculateWilsonInterval(1.0, 10);
    expect(oneP.lower).toBeLessThan(1.0);
    expect(oneP.upper).toBe(1.0);
    expect(Number.isFinite(oneP.lower)).toBe(true);
  });

  it("14. Minimum publication threshold adheres to 5-report rule", () => {
    expect(MIN_INDEPENDENT_REPORTS_THRESHOLD).toBe(5);
    expect(isPublicationEligible(4)).toBe(false);
    expect(isPublicationEligible(5)).toBe(true);
    expect(isPublicationEligible(10)).toBe(true);
  });

  it("15. Verification score formula produces bounded scores (0 to 100)", () => {
    const perfectScore = calculateVerificationScore({
      coverage: 1.0,
      agreement: 1.0,
      credibility: 1.0,
      recency: 1.0,
      evidenceQuality: 1.0,
    });
    expect(perfectScore).toBe(100.0);

    const zeroScore = calculateVerificationScore({
      coverage: 0.0,
      agreement: 0.0,
      credibility: 0.0,
      recency: 0.0,
      evidenceQuality: 0.0,
    });
    expect(zeroScore).toBe(0.0);

    const typicalScore = calculateVerificationScore({
      coverage: 0.6,
      agreement: 0.7,
      credibility: 0.8,
      recency: 0.9,
      evidenceQuality: 0.9,
    });
    expect(typicalScore).toBeGreaterThan(50);
    expect(typicalScore).toBeLessThan(100);
  });

  // --- 3. CONSENSUS BUILDER & QUERY INTEGRATION TESTS ---

  it("16. Full consensus snapshot builds deterministically from multiple experiences", async () => {
    const companyId = testCompany.id;

    // Clean any prior snapshots
    await db.delete(consensusSnapshots).where(eq(consensusSnapshots.companyId, companyId));
    await db.delete(experiences).where(eq(experiences.companyId, companyId));

    // Seed 6 experiences for company (>= 5 threshold)
    const seededExps = [];
    for (let i = 1; i <= 6; i++) {
      const expId = `exp_cons_${i}`;
      await db.insert(experiences).values({
        id: expId,
        companyId,
        companyName: testCompany.name,
        role: "Software Engineer",
        year: 2025,
        type: "Full-time",
        rounds: 2,
        difficulty: "Medium",
        studentName: `Student ${i}`,
        isAnonymous: false,
        verificationStatus: i <= 4 ? "verified" : "community",
        summary: `Experience ${i} covering HashMaps and System Design`,
        content: `Detailed notes on HashMaps algorithms in round 1`,
        status: "published",
        authorId: "user_consensus_admin",
      }).onConflictDoNothing();

      // Seed Phase 3.1 extraction run for each experience
      await db.insert(extractionRuns).values({
        id: `ext_run_cons_${i}`,
        experienceId: expId,
        model: "mock-extractor-v1",
        promptVersion: "v1",
        schemaVersion: "v1",
        status: "succeeded",
        rawOutput: JSON.stringify({}),
        extractedData: {
          rounds: [
            {
              position: 1,
              roundType: "Technical Round",
              topics: [{ label: "HashMaps", evidence: { quote: "HashMaps" } }],
              questions: [{ text: "Two Sum with Hash Map", evidence: { quote: "HashMaps" } }],
            },
          ],
        },
      }).onConflictDoNothing();

      seededExps.push(expId);
    }

    // Build snapshot
    const res = await buildConsensusSnapshot({ companyId });
    expect(res.snapshot).toBeDefined();
    expect(res.snapshot.totalEligibleExperiences).toBe(6);
    expect(res.snapshot.formulaVersion).toBe(CONSENSUS_FORMULA_VERSION);
    expect(res.snapshot.verificationScore).toBeGreaterThan(0);

    // Verify topic consensus item
    const hashMapTopic = res.items.find((it) => it.entityId === "top_hash_tables");
    expect(hashMapTopic).toBeDefined();
    expect(hashMapTopic?.reportCount).toBe(6);
    expect(hashMapTopic?.status).toBe("published");
    expect(hashMapTopic?.weightedPrevalence).toBeCloseTo(1.0, 2);
    expect(hashMapTopic?.lowerBound).toBeGreaterThan(0.5);

    // Verify lineage metadata exists
    expect(hashMapTopic?.metadata).toBeDefined();
    const meta = hashMapTopic?.metadata as { supportingExperienceIds?: string[] };
    expect(meta.supportingExperienceIds?.length).toBe(6);
  });

  it("17. Consensus items with < 5 reports are marked insufficient_evidence", async () => {
    const smallCompany = {
      id: "comp_small_cons",
      name: "Boutique Startup",
      industry: "AI",
      roles: ["SWE"],
      verificationStatus: "verified" as const,
      lastVerifiedAt: new Date().toISOString(),
      topTopics: [],
    };
    await db.insert(companies).values(smallCompany).onConflictDoNothing();

    // Clean prior
    await db.delete(consensusSnapshots).where(eq(consensusSnapshots.companyId, smallCompany.id));
    await db.delete(experiences).where(eq(experiences.companyId, smallCompany.id));

    // Only 2 experiences
    for (let i = 1; i <= 2; i++) {
      const expId = `exp_small_${i}`;
      await db.insert(experiences).values({
        id: expId,
        companyId: smallCompany.id,
        companyName: smallCompany.name,
        role: "SWE",
        year: 2025,
        type: "Full-time",
        rounds: 1,
        difficulty: "Easy",
        studentName: `Student ${i}`,
        isAnonymous: false,
        verificationStatus: "community",
        summary: "Interview on System Design",
        status: "published",
        authorId: "user_consensus_admin",
      }).onConflictDoNothing();

      await db.insert(extractionRuns).values({
        id: `ext_small_${i}`,
        experienceId: expId,
        model: "mock-extractor-v1",
        promptVersion: "v1",
        schemaVersion: "v1",
        status: "succeeded",
        rawOutput: JSON.stringify({}),
        extractedData: {
          rounds: [
            {
              position: 1,
              roundType: "Technical Round",
              topics: [{ label: "System Design", evidence: { quote: "System Design" } }],
              questions: [],
            },
          ],
        },
      }).onConflictDoNothing();
    }

    const res = await buildConsensusSnapshot({ companyId: smallCompany.id });
    expect(res.snapshot.totalEligibleExperiences).toBe(2);

    const sysDesignItem = res.items.find((it) => it.entityId === "top_sys_design");
    expect(sysDesignItem).toBeDefined();
    expect(sysDesignItem?.reportCount).toBe(2);
    expect(sysDesignItem?.status).toBe("insufficient_evidence"); // Not published!
  });

  it("18. Public consensus query layer retrieves latest snapshot with segregated categories", async () => {
    const data = await getLatestConsensusForCompany(testCompany.id);
    expect(data).not.toBeNull();
    expect(data?.snapshot).toBeDefined();
    expect(data?.publishedTopics).toBeDefined();
    expect(Array.isArray(data?.publishedTopics)).toBe(true);
  });

  it("19. Unauthorized student cannot trigger consensus snapshot generation action", async () => {
    mockUser = { id: "user_student_unauth", role: "student" };

    await expect(
      generateConsensusSnapshotAction({ companyId: testCompany.id })
    ).rejects.toThrow(/Unauthorized/);
  });

  it("20. Multiple mentions of same topic in single experience are not double-counted", async () => {
    const singleExpComp = {
      id: "comp_dedup_test",
      name: "Dedup Tech",
      industry: "Tech",
      roles: ["SWE"],
      verificationStatus: "verified" as const,
      lastVerifiedAt: new Date().toISOString(),
      topTopics: [],
    };
    await db.insert(companies).values(singleExpComp).onConflictDoNothing();

    const expId = "exp_dedup_single";
    await db.insert(experiences).values({
      id: expId,
      companyId: singleExpComp.id,
      companyName: singleExpComp.name,
      role: "SWE",
      year: 2025,
      type: "Full-time",
      rounds: 3,
      difficulty: "Hard",
      studentName: "Dedup Student",
      isAnonymous: false,
      verificationStatus: "verified",
      summary: "3 rounds all about HashMaps",
      status: "published",
      authorId: "user_consensus_admin",
    }).onConflictDoNothing();

    // 3 rounds each with "HashMaps"
    await db.insert(extractionRuns).values({
      id: "ext_dedup_run",
      experienceId: expId,
      model: "mock-extractor-v1",
      promptVersion: "v1",
      schemaVersion: "v1",
      status: "succeeded",
      rawOutput: JSON.stringify({}),
      extractedData: {
        rounds: [
          { position: 1, roundType: "R1", topics: [{ label: "HashMaps", evidence: { quote: "HashMaps" } }], questions: [] },
          { position: 2, roundType: "R2", topics: [{ label: "HashMaps", evidence: { quote: "HashMaps" } }], questions: [] },
          { position: 3, roundType: "R3", topics: [{ label: "HashMaps", evidence: { quote: "HashMaps" } }], questions: [] },
        ],
      },
    }).onConflictDoNothing();

    const res = await buildConsensusSnapshot({ companyId: singleExpComp.id });
    const hashMapItem = res.items.find((it) => it.entityId === "top_hash_tables");
    expect(hashMapItem).toBeDefined();
    // Must be counted exactly ONCE, not 3 times
    expect(hashMapItem?.reportCount).toBe(1);
  });
});
