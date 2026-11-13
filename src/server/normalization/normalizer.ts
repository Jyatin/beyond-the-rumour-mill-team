import "server-only";

import { db } from "../db";
import { topics, topicAliases } from "../db/schema";
import { eq } from "drizzle-orm";

export interface TopicNormalizationResult {
  status: "matched" | "pending" | "new";
  topicId: string | null;
  topicName: string | null;
  confidence: number;
  method: "alias" | "exact" | "trigram" | "embedding" | "adjudication" | null;
  matchedAlias?: string;
}

/**
 * Deterministically normalizes a label for canonical comparison.
 * e.g., "Hash-Maps!!", "HashMaps", "hash map" -> "hash maps" / "hashmap"
 */
export function normalizeLabel(label: string): string {
  if (!label) return "";
  return label
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates string similarity using character trigrams.
 * Returns a score between 0.0 and 1.0.
 */
export function calculateTrigramSimilarity(strA: string, strB: string): number {
  const normA = normalizeLabel(strA);
  const normB = normalizeLabel(strB);

  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  // Generate 3-character n-grams with boundary markers
  const getTrigrams = (str: string): Set<string> => {
    const s = `  ${str} `;
    const set = new Set<string>();
    for (let i = 0; i <= s.length - 3; i++) {
      set.add(s.slice(i, i + 3));
    }
    return set;
  };

  const setA = getTrigrams(normA);
  const setB = getTrigrams(normB);

  let matches = 0;
  for (const tri of setA) {
    if (setB.has(tri)) matches++;
  }

  const union = setA.size + setB.size - matches;
  return union > 0 ? matches / union : 0.0;
}

/**
 * Resolves a raw extracted topic candidate to a canonical topic entity.
 * Deterministic resolution hierarchy:
 * 1. Exact normalized alias match
 * 2. Exact canonical topic match
 * 3. Trigram similarity >= 0.85 -> matched
 * 4. Trigram similarity 0.60..0.85 -> ambiguous / pending
 * 5. Low similarity -> new candidate
 */
export async function normalizeTopicCandidate(
  candidateLabel: string
): Promise<TopicNormalizationResult> {
  const trimmed = candidateLabel.trim();
  const normalizedCandidate = normalizeLabel(trimmed);

  if (!normalizedCandidate) {
    return {
      status: "new",
      topicId: null,
      topicName: null,
      confidence: 0,
      method: null,
    };
  }

  // 1. Exact alias lookup
  const aliasMatch = await db
    .select({
      id: topicAliases.id,
      topicId: topicAliases.topicId,
      alias: topicAliases.alias,
      topicName: topics.name,
    })
    .from(topicAliases)
    .innerJoin(topics, eq(topicAliases.topicId, topics.id))
    .where(eq(topicAliases.normalizedAlias, normalizedCandidate))
    .limit(1);

  if (aliasMatch.length > 0) {
    return {
      status: "matched",
      topicId: aliasMatch[0].topicId,
      topicName: aliasMatch[0].topicName,
      confidence: 1.0,
      method: "alias",
      matchedAlias: aliasMatch[0].alias,
    };
  }

  // 2. Exact canonical topic match
  const allTopics = await db.select().from(topics);
  for (const top of allTopics) {
    if (normalizeLabel(top.name) === normalizedCandidate) {
      return {
        status: "matched",
        topicId: top.id,
        topicName: top.name,
        confidence: 1.0,
        method: "exact",
      };
    }
  }

  // 3. Trigram fuzzy similarity search across all topics & aliases
  let bestMatch: { topicId: string; topicName: string; score: number } | null = null;
  const allAliases = await db.select().from(topicAliases);

  for (const top of allTopics) {
    const score = calculateTrigramSimilarity(top.name, trimmed);
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { topicId: top.id, topicName: top.name, score };
    }
  }

  for (const al of allAliases) {
    const score = calculateTrigramSimilarity(al.alias, trimmed);
    if (!bestMatch || score > bestMatch.score) {
      const parentTopic = allTopics.find((t) => t.id === al.topicId);
      if (parentTopic) {
        bestMatch = { topicId: al.topicId, topicName: parentTopic.name, score };
      }
    }
  }

  if (bestMatch && bestMatch.score >= 0.76) {
    return {
      status: "matched",
      topicId: bestMatch.topicId,
      topicName: bestMatch.topicName,
      confidence: Math.round(bestMatch.score * 100) / 100,
      method: "trigram",
    };
  }

  if (bestMatch && bestMatch.score >= 0.50) {
    // Ambiguous candidate - keep as pending rather than unsafe automatic merge
    return {
      status: "pending",
      topicId: bestMatch.topicId,
      topicName: bestMatch.topicName,
      confidence: Math.round(bestMatch.score * 100) / 100,
      method: "trigram",
    };
  }

  // 4. Low similarity -> candidate represents a new topic
  return {
    status: "new",
    topicId: null,
    topicName: null,
    confidence: bestMatch ? Math.round(bestMatch.score * 100) / 100 : 0,
    method: bestMatch && bestMatch.score > 0 ? "trigram" : null,
  };
}
