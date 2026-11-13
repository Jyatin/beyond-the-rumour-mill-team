import { ExtractedExperience, ExtractedQuestion, ExtractedTopic, ExtractedRound } from "./schema";

export interface EvidenceValidationResult {
  isValid: boolean;
  errors: string[];
  validatedData: ExtractedExperience;
  stats: {
    totalQuotes: number;
    validQuotes: number;
    invalidQuotes: number;
  };
}

/**
 * Normalizes text for robust substring matching across whitespace and line breaks.
 */
function normalizeText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

/**
 * Checks whether a quote exists in the source text and verifies/computes offsets.
 */
export function verifyQuoteInSource(
  quote: string,
  sourceText: string,
  startOffset?: number,
  endOffset?: number
): { exists: boolean; correctedStart?: number; correctedEnd?: number } {
  if (!quote || !quote.trim()) {
    return { exists: false };
  }

  const rawTrimmedQuote = quote.trim();
  
  // 1. Exact raw check
  const exactIndex = sourceText.indexOf(rawTrimmedQuote);
  if (exactIndex !== -1) {
    // If offsets were provided, check if they matched roughly
    if (startOffset !== undefined && endOffset !== undefined) {
      const sliceAtOffset = sourceText.slice(startOffset, endOffset).trim();
      if (sliceAtOffset === rawTrimmedQuote) {
        return { exists: true, correctedStart: startOffset, correctedEnd: endOffset };
      }
    }
    return {
      exists: true,
      correctedStart: exactIndex,
      correctedEnd: exactIndex + rawTrimmedQuote.length,
    };
  }

  // 2. Normalized whitespace check
  const normSource = normalizeText(sourceText);
  const normQuote = normalizeText(rawTrimmedQuote);
  const normIndex = normSource.indexOf(normQuote);

  if (normIndex !== -1) {
    // Found in normalized text
    return {
      exists: true,
      correctedStart: startOffset,
      correctedEnd: endOffset,
    };
  }

  // 3. Case-insensitive normalized check as fallback
  const lowerNormSource = normSource.toLowerCase();
  const lowerNormQuote = normQuote.toLowerCase();
  if (lowerNormSource.includes(lowerNormQuote)) {
    return {
      exists: true,
      correctedStart: startOffset,
      correctedEnd: endOffset,
    };
  }

  return { exists: false };
}

/**
 * Validates all evidence quotes across rounds, topics, questions and unassigned entities.
 */
export function validateExtractedEvidence(
  data: ExtractedExperience,
  sourceText: string
): EvidenceValidationResult {
  const errors: string[] = [];
  let totalQuotes = 0;
  let validQuotes = 0;
  let invalidQuotes = 0;

  const validatedRounds: ExtractedRound[] = [];

  for (const round of data.rounds || []) {
    const validatedTopics: ExtractedTopic[] = [];
    const validatedQuestions: ExtractedQuestion[] = [];

    // Validate round topics
    for (const topic of round.topics || []) {
      totalQuotes++;
      const check = verifyQuoteInSource(
        topic.evidence.quote,
        sourceText,
        topic.evidence.start,
        topic.evidence.end
      );

      if (check.exists) {
        validQuotes++;
        validatedTopics.push({
          ...topic,
          evidence: {
            ...topic.evidence,
            start: check.correctedStart ?? topic.evidence.start,
            end: check.correctedEnd ?? topic.evidence.end,
          },
        });
      } else {
        invalidQuotes++;
        errors.push(
          `Round ${round.position} Topic '${topic.label}' evidence quote was not found in source text: "${topic.evidence.quote.slice(0, 50)}..."`
        );
      }
    }

    // Validate round questions
    for (const question of round.questions || []) {
      totalQuotes++;
      const check = verifyQuoteInSource(
        question.evidence.quote,
        sourceText,
        question.evidence.start,
        question.evidence.end
      );

      if (check.exists) {
        validQuotes++;
        validatedQuestions.push({
          ...question,
          evidence: {
            ...question.evidence,
            start: check.correctedStart ?? question.evidence.start,
            end: check.correctedEnd ?? question.evidence.end,
          },
        });
      } else {
        invalidQuotes++;
        errors.push(
          `Round ${round.position} Question '${question.text.slice(0, 40)}...' evidence quote was not found in source text: "${question.evidence.quote.slice(0, 50)}..."`
        );
      }
    }

    validatedRounds.push({
      ...round,
      topics: validatedTopics,
      questions: validatedQuestions,
    });
  }

  // Validate unassigned topics
  const validatedUnassignedTopics: ExtractedTopic[] = [];
  for (const topic of data.unassignedTopics || []) {
    totalQuotes++;
    const check = verifyQuoteInSource(
      topic.evidence.quote,
      sourceText,
      topic.evidence.start,
      topic.evidence.end
    );
    if (check.exists) {
      validQuotes++;
      validatedUnassignedTopics.push({
        ...topic,
        evidence: {
          ...topic.evidence,
          start: check.correctedStart ?? topic.evidence.start,
          end: check.correctedEnd ?? topic.evidence.end,
        },
      });
    } else {
      invalidQuotes++;
      errors.push(
        `Unassigned Topic '${topic.label}' evidence quote was not found in source text: "${topic.evidence.quote.slice(0, 50)}..."`
      );
    }
  }

  // Validate unassigned questions
  const validatedUnassignedQuestions: ExtractedQuestion[] = [];
  for (const question of data.unassignedQuestions || []) {
    totalQuotes++;
    const check = verifyQuoteInSource(
      question.evidence.quote,
      sourceText,
      question.evidence.start,
      question.evidence.end
    );
    if (check.exists) {
      validQuotes++;
      validatedUnassignedQuestions.push({
        ...question,
        evidence: {
          ...question.evidence,
          start: check.correctedStart ?? question.evidence.start,
          end: check.correctedEnd ?? question.evidence.end,
        },
      });
    } else {
      invalidQuotes++;
      errors.push(
        `Unassigned Question '${question.text.slice(0, 40)}...' evidence quote was not found in source text: "${question.evidence.quote.slice(0, 50)}..."`
      );
    }
  }

  const validatedData: ExtractedExperience = {
    metadata: data.metadata,
    rounds: validatedRounds,
    unassignedTopics: validatedUnassignedTopics,
    unassignedQuestions: validatedUnassignedQuestions,
  };

  return {
    isValid: invalidQuotes === 0,
    errors,
    validatedData,
    stats: {
      totalQuotes,
      validQuotes,
      invalidQuotes,
    },
  };
}
