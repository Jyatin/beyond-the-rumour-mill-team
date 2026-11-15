import "server-only";

import {
  GOLDEN_EVALUATION_DATASET,
  EVALUATION_DATASET_VERSION,
  GoldenTestCase,
} from "./dataset";
import { runExperienceExtraction } from "../extractor";
import {
  EXTRACTION_PROMPT_VERSION,
  EXTRACTION_SCHEMA_VERSION,
} from "../prompts";
import { LLMProvider } from "../provider";
import { normalizeLabel } from "../../normalization/normalizer";

export interface EvaluationReport {
  datasetVersion: string;
  promptVersion: string;
  schemaVersion: string;
  totalCases: number;
  validStructuredOutputRate: number; // [0, 1]
  evidenceGroundingRate: number;      // [0, 1]
  topicRecall: number;                // [0, 1]
  questionRecall: number;             // [0, 1]
  roundAccuracy: number;              // [0, 1]
  caseResults: Array<{
    id: string;
    title: string;
    passed: boolean;
    extractedTopicsCount: number;
    extractedQuestionsCount: number;
    errors: string[];
  }>;
}

/**
 * Deterministically evaluates AI extraction pipeline against the golden benchmark dataset.
 */
export async function runAIEvaluationHarness(
  customProvider?: LLMProvider,
  testSubset?: GoldenTestCase[]
): Promise<EvaluationReport> {
  const cases = testSubset || GOLDEN_EVALUATION_DATASET;

  let validOutputs = 0;
  let totalQuotes = 0;
  let groundedQuotes = 0;
  let expectedTopicsTotal = 0;
  let expectedTopicsFound = 0;
  let expectedQuestionsTotal = 0;
  let expectedQuestionsFound = 0;
  let correctRoundCases = 0;

  const caseResults = [];

  for (const testCase of cases) {
    const errors: string[] = [];
    const exp = testCase.experience;

    const result = await runExperienceExtraction(
      {
        companyName: exp.companyName,
        role: exp.role,
        content: exp.content,
        summary: exp.summary,
      },
      customProvider
    );

    if (result.success && result.extractedData) {
      validOutputs++;
    } else {
      errors.push(`Extraction failed: ${result.error || "Unknown error"}`);
      if (result.validationErrors?.length) {
        errors.push(...result.validationErrors);
      }
    }

    const extracted = result.extractedData;
    let extractedTopicsCount = 0;
    let extractedQuestionsCount = 0;

    if (extracted) {
      const allExtractedTopics: string[] = [];
      const allExtractedQuestions: string[] = [];

      for (const rnd of extracted.rounds || []) {
        for (const top of rnd.topics || []) {
          totalQuotes++;
          if (top.evidence?.quote) {
            groundedQuotes++;
            allExtractedTopics.push(top.label);
          }
        }
        for (const q of rnd.questions || []) {
          totalQuotes++;
          if (q.evidence?.quote) {
            groundedQuotes++;
            allExtractedQuestions.push(q.text);
          }
        }
      }

      for (const top of extracted.unassignedTopics || []) {
        totalQuotes++;
        if (top.evidence?.quote) {
          groundedQuotes++;
          allExtractedTopics.push(top.label);
        }
      }

      for (const q of extracted.unassignedQuestions || []) {
        totalQuotes++;
        if (q.evidence?.quote) {
          groundedQuotes++;
          allExtractedQuestions.push(q.text);
        }
      }

      extractedTopicsCount = allExtractedTopics.length;
      extractedQuestionsCount = allExtractedQuestions.length;

      // Evaluate expected topics recall
      for (const expTop of testCase.expectedTopics) {
        expectedTopicsTotal++;
        const normExpected = normalizeLabel(expTop);
        const match = allExtractedTopics.some((t) => {
          const normT = normalizeLabel(t);
          return normT.includes(normExpected) || normExpected.includes(normT);
        });
        if (match) {
          expectedTopicsFound++;
        }
      }

      // Evaluate expected questions recall
      for (const expQ of testCase.expectedQuestions) {
        expectedQuestionsTotal++;
        const normExpected = normalizeLabel(expQ);
        const match = allExtractedQuestions.some((q) => {
          const normQ = normalizeLabel(q);
          return normQ.includes(normExpected) || normExpected.includes(normQ);
        });
        if (match) {
          expectedQuestionsFound++;
        }
      }

      // Evaluate round count accuracy
      const roundCount = (extracted.rounds || []).length;
      if (roundCount >= 1 && roundCount <= testCase.expectedRoundsCount + 1) {
        correctRoundCases++;
      }
    }

    caseResults.push({
      id: testCase.id,
      title: testCase.title,
      passed: errors.length === 0,
      extractedTopicsCount,
      extractedQuestionsCount,
      errors,
    });
  }

  const validStructuredOutputRate = cases.length > 0 ? validOutputs / cases.length : 1;
  const evidenceGroundingRate = totalQuotes > 0 ? groundedQuotes / totalQuotes : 1;
  const topicRecall = expectedTopicsTotal > 0 ? expectedTopicsFound / expectedTopicsTotal : 1;
  const questionRecall = expectedQuestionsTotal > 0 ? expectedQuestionsFound / expectedQuestionsTotal : 1;
  const roundAccuracy = cases.length > 0 ? correctRoundCases / cases.length : 1;

  return {
    datasetVersion: EVALUATION_DATASET_VERSION,
    promptVersion: EXTRACTION_PROMPT_VERSION,
    schemaVersion: EXTRACTION_SCHEMA_VERSION,
    totalCases: cases.length,
    validStructuredOutputRate: Math.round(validStructuredOutputRate * 1000) / 1000,
    evidenceGroundingRate: Math.round(evidenceGroundingRate * 1000) / 1000,
    topicRecall: Math.round(topicRecall * 1000) / 1000,
    questionRecall: Math.round(questionRecall * 1000) / 1000,
    roundAccuracy: Math.round(roundAccuracy * 1000) / 1000,
    caseResults,
  };
}
