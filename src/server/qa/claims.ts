export interface StructuredAnswerInput {
  roundSequence: string[]; // e.g. ["oa", "technical", "technical", "hr"]
  oaMode?: "online" | "offline";
  oaDifficulty?: "Easy" | "Medium" | "Hard" | "Medium-Hard";
  topics?: Array<{
    topicId: string;
    weight: "light" | "moderate" | "heavy";
  }>;
  dsaDifficulty?: "Easy" | "Medium" | "Hard" | "Medium-Hard";
  outcomeTimelineWeeks?: number;
}

export interface GeneratedClaim {
  dimension:
    | "round_sequence"
    | "round_present"
    | "oa_mode"
    | "oa_difficulty"
    | "topic_covered"
    | "topic_weight"
    | "dsa_difficulty"
    | "outcome_timeline";
  roundKind?: string;
  topicId?: string;
  valueText?: string;
  valueNum?: number;
  position?: number;
}

/**
 * Derives atomic answer claims deterministically from validated structured form inputs.
 * Never uses AI or unvalidated text extraction.
 */
export function deriveAnswerClaims(input: StructuredAnswerInput): GeneratedClaim[] {
  const claims: GeneratedClaim[] = [];

  // 1. Derive ordered round sequence & individual round presence
  if (Array.isArray(input.roundSequence) && input.roundSequence.length > 0) {
    input.roundSequence.forEach((roundKind, index) => {
      const normalizedKind = roundKind.trim().toLowerCase();
      // Record position in overall sequence
      claims.push({
        dimension: "round_sequence",
        roundKind: normalizedKind,
        valueText: normalizedKind,
        position: index + 1,
      });

      // Record presence
      claims.push({
        dimension: "round_present",
        roundKind: normalizedKind,
        valueNum: 1,
        position: index + 1,
      });
    });
  }

  // 2. OA mode & difficulty claims
  if (input.oaMode) {
    claims.push({
      dimension: "oa_mode",
      valueText: input.oaMode,
    });
  }

  if (input.oaDifficulty) {
    claims.push({
      dimension: "oa_difficulty",
      valueText: input.oaDifficulty,
    });
  }

  // 3. Topics covered and weights
  if (Array.isArray(input.topics)) {
    input.topics.forEach((t) => {
      if (t.topicId) {
        claims.push({
          dimension: "topic_covered",
          topicId: t.topicId,
          valueNum: 1,
        });

        if (t.weight) {
          claims.push({
            dimension: "topic_weight",
            topicId: t.topicId,
            valueText: t.weight,
          });
        }
      }
    });
  }

  // 4. DSA difficulty
  if (input.dsaDifficulty) {
    claims.push({
      dimension: "dsa_difficulty",
      valueText: input.dsaDifficulty,
    });
  }

  // 5. Outcome timeline
  if (typeof input.outcomeTimelineWeeks === "number" && input.outcomeTimelineWeeks > 0) {
    claims.push({
      dimension: "outcome_timeline",
      valueNum: input.outcomeTimelineWeeks,
    });
  }

  return claims;
}

/**
 * Derives total round count strictly from ordered sequence.
 */
export function getDerivedRoundCount(roundSequence: string[]): number {
  if (!Array.isArray(roundSequence)) return 0;
  return roundSequence.length;
}
