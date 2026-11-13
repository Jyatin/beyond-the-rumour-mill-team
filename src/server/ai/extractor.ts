import "server-only";

import {
  extractedExperienceSchema,
  ExtractedExperience,
} from "./schema";
import {
  EXTRACTION_PROMPT_VERSION,
  EXTRACTION_SCHEMA_VERSION,
  buildExtractionSystemPrompt,
  buildExtractionUserPrompt,
} from "./prompts";
import { validateExtractedEvidence } from "./evidence-validator";
import { getAIProvider, LLMProvider } from "./provider";

export interface ExtractionPipelineResult {
  success: boolean;
  rawOutput: string;
  model: string;
  promptVersion: string;
  schemaVersion: string;
  extractedData?: ExtractedExperience;
  error?: string;
  validationErrors?: string[];
}

export interface ExperienceForExtraction {
  id?: string;
  companyName: string;
  role: string;
  content?: string | null;
  summary?: string | null;
  timeline?: string | null;
  outcome?: string | null;
}

export async function runExperienceExtraction(
  experience: ExperienceForExtraction,
  customProvider?: LLMProvider
): Promise<ExtractionPipelineResult> {
  const provider = customProvider || getAIProvider();
  const systemPrompt = buildExtractionSystemPrompt();
  const userPrompt = buildExtractionUserPrompt({
    companyName: experience.companyName,
    role: experience.role,
    content: experience.content || "",
    summary: experience.summary || "",
    timeline: experience.timeline || "",
    outcome: experience.outcome || "",
  });

  // Combine all source text for evidence validation
  const fullSourceText = [
    experience.companyName,
    experience.role,
    experience.summary || "",
    experience.content || "",
    experience.timeline || "",
    experience.outcome || "",
  ].join("\n\n");

  let rawOutput = "";
  let modelUsed = "unknown";

  try {
    const genResult = await provider.generate({
      systemPrompt,
      userPrompt,
    });

    rawOutput = genResult.rawText;
    modelUsed = genResult.model;

    // 1. Parse JSON safely
    let parsedJson: unknown;
    try {
      // Strip potential markdown wrapper if any
      const cleaned = rawOutput.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      parsedJson = JSON.parse(cleaned);
    } catch (parseErr) {
      return {
        success: false,
        rawOutput,
        model: modelUsed,
        promptVersion: EXTRACTION_PROMPT_VERSION,
        schemaVersion: EXTRACTION_SCHEMA_VERSION,
        error: `Failed to parse LLM JSON output: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
      };
    }

    // 2. Validate against Zod schema
    const zodResult = extractedExperienceSchema.safeParse(parsedJson);
    if (!zodResult.success) {
      const errorMsg = zodResult.error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      return {
        success: false,
        rawOutput,
        model: modelUsed,
        promptVersion: EXTRACTION_PROMPT_VERSION,
        schemaVersion: EXTRACTION_SCHEMA_VERSION,
        error: `Extraction schema validation failed: ${errorMsg}`,
      };
    }

    // 3. Validate evidence quotes against source text
    const evidenceValidation = validateExtractedEvidence(
      zodResult.data,
      fullSourceText
    );

    if (!evidenceValidation.isValid) {
      return {
        success: false,
        rawOutput,
        model: modelUsed,
        promptVersion: EXTRACTION_PROMPT_VERSION,
        schemaVersion: EXTRACTION_SCHEMA_VERSION,
        extractedData: evidenceValidation.validatedData,
        error: `Evidence verification failed: ${evidenceValidation.errors.length} unverified quotes`,
        validationErrors: evidenceValidation.errors,
      };
    }

    return {
      success: true,
      rawOutput,
      model: modelUsed,
      promptVersion: EXTRACTION_PROMPT_VERSION,
      schemaVersion: EXTRACTION_SCHEMA_VERSION,
      extractedData: evidenceValidation.validatedData,
    };
  } catch (err) {
    return {
      success: false,
      rawOutput,
      model: modelUsed,
      promptVersion: EXTRACTION_PROMPT_VERSION,
      schemaVersion: EXTRACTION_SCHEMA_VERSION,
      error: `Extraction provider error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
