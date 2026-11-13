import "server-only";

import { z } from "zod";
import { getAIProvider } from "../ai/provider";

export const adjudicationSchema = z.object({
  isSameTopic: z.boolean(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(300),
});

export type AdjudicationResult = z.infer<typeof adjudicationSchema>;

/**
 * Narrow LLM adjudication helper for ambiguous topic candidate resolution.
 * Strictly answers: Do labelA and labelB refer to the exact same technical topic?
 */
export async function adjudicateTopicAmbiguity(params: {
  candidateLabel: string;
  targetCanonicalTopic: string;
}): Promise<AdjudicationResult | null> {
  const provider = getAIProvider();

  const systemPrompt = `You are a strict technical topic disambiguation engine.
Your task is to determine whether two technical terms refer to the exact same technical concept in a technical interview context.

Rules:
1. Return valid JSON only adhering to: {"isSameTopic": boolean, "confidence": number (0.0 to 1.0), "reasoning": string}.
2. "HashMaps" and "Hash Table" -> isSameTopic: true.
3. "Trees" and "Binary Search Tree" -> isSameTopic: false (BST is a specific sub-type, not identical).
4. "System Design" and "Low Level Design" -> isSameTopic: false.
5. No markdown formatting.`;

  const userPrompt = `Determine if these two terms refer to the same canonical topic:
Term 1: "${params.candidateLabel}"
Term 2: "${params.targetCanonicalTopic}"`;

  try {
    const res = await provider.generate({ systemPrompt, userPrompt });
    const cleaned = res.rawText.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned);
    const result = adjudicationSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    return null;
  } catch {
    return null;
  }
}
