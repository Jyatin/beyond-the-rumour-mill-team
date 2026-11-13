import "server-only";

export interface LLMGenerationParams {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
}

export interface LLMGenerationResult {
  rawText: string;
  model: string;
}

export interface LLMProvider {
  name: string;
  generate(params: LLMGenerationParams): Promise<LLMGenerationResult>;
}

export class MockLLMProvider implements LLMProvider {
  name = "mock";

  async generate(params: LLMGenerationParams): Promise<LLMGenerationResult> {
    const model = params.model || "mock-extractor-v1";
    
    // Extract fields from userPrompt <interview_experience_data> tag
    const dataMatch = params.userPrompt.match(/<interview_experience_data>([\s\S]*?)<\/interview_experience_data>/);
    const rawData = dataMatch ? dataMatch[1].trim() : params.userPrompt;
    
    // Extract Detailed Narrative or Summary if present, or use rawData
    const detailedMatch = rawData.match(/Detailed Narrative:\s*([\s\S]*?)(?=\n\n[A-Z]|$)/i);
    const summaryMatch = rawData.match(/Summary:\s*([\s\S]*?)(?=\n\n[A-Z]|$)/i);
    const detailedText = detailedMatch ? detailedMatch[1].trim() : "";
    const summaryText = summaryMatch ? summaryMatch[1].trim() : "";

    const primarySource = detailedText || summaryText || rawData;
    const primaryField = detailedText ? "content" : "summary";

    const fullTextLower = primarySource.toLowerCase();

    // 1. Identify Topic Candidates with Verbatim Quotes
    const candidateKeywords = [
      "Two Sum", "HashMaps", "HashMap", "Binary Trees", "Binary Tree", "Dynamic Programming", "Algorithms", "Data Structures", "DSA",
      "System Design", "Redis caching", "Redis", "distributed URL shortener", "rate limiting", "Rate Limiter", "Distributed Systems", "load balancer", "consistent hashing",
      "SQL queries", "SQL", "window functions", "database", "indexing", "query optimization", "PostgreSQL",
      "Customer Obsession", "Behavioral", "conflict resolution", "leadership", "Tell me about a time",
      "Network Security", "TLS handshake", "security",
      "React projects", "React", "Frontend",
    ];

    const allFoundTopics: Array<{ label: string; evidence: { quote: string; sourceField: "content" | "summary" } }> = [];

    for (const kw of candidateKeywords) {
      const idx = fullTextLower.indexOf(kw.toLowerCase());
      if (idx !== -1) {
        const exactQuote = primarySource.slice(idx, idx + kw.length);
        if (!allFoundTopics.some((t) => t.label.toLowerCase() === exactQuote.toLowerCase())) {
          allFoundTopics.push({
            label: exactQuote,
            evidence: {
              quote: exactQuote,
              sourceField: primaryField,
            },
          });
        }
      }
    }

    if (allFoundTopics.length === 0) {
      const fallbackQuote = primarySource.slice(0, Math.min(20, primarySource.length)).trim() || "interview";
      allFoundTopics.push({
        label: "General Discussion",
        evidence: {
          quote: fallbackQuote,
          sourceField: primaryField,
        },
      });
    }

    // 2. Identify Question Candidates with Verbatim Quotes
    const sentences = primarySource
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    const allFoundQuestions: Array<{
      text: string;
      topicCandidate?: string;
      roundPosition?: number;
      evidence: { quote: string; sourceField: "content" | "summary" };
    }> = [];

    for (const sent of sentences) {
      const sLower = sent.toLowerCase();
      if (
        sent.includes("?") ||
        sLower.includes("asked") ||
        sLower.includes("design") ||
        sLower.includes("write ") ||
        sLower.includes("implement") ||
        sLower.includes("tell me") ||
        sLower.includes("how does") ||
        sLower.includes("solve") ||
        sLower.includes("cover") ||
        sLower.includes("focus") ||
        sLower.includes("discuss") ||
        sLower.includes("question") ||
        sLower.includes("problem") ||
        sLower.includes("coding")
      ) {
        allFoundQuestions.push({
          text: sent,
          topicCandidate: allFoundTopics[0]?.label || "Technical",
          roundPosition: 1,
          evidence: {
            quote: sent,
            sourceField: primaryField,
          },
        });
      }
    }

    // 3. Construct Multi-round or Single-round structure
    const rounds = [];
    if (fullTextLower.includes("round 2") || fullTextLower.includes("two rounds")) {
      // Split into 2 rounds
      const r1Topics = allFoundTopics.slice(0, Math.ceil(allFoundTopics.length / 2));
      const r2Topics = allFoundTopics.slice(Math.ceil(allFoundTopics.length / 2));
      const r1Questions = allFoundQuestions.slice(0, Math.ceil(allFoundQuestions.length / 2));
      const r2Questions = allFoundQuestions.slice(Math.ceil(allFoundQuestions.length / 2));

      rounds.push({
        position: 1,
        roundType: "Technical Coding",
        durationMinutes: 45,
        difficulty: "Medium",
        notes: "Round 1 technical",
        topics: r1Topics.length > 0 ? r1Topics : allFoundTopics,
        questions: r1Questions.length > 0 ? r1Questions : (allFoundQuestions.length > 0 ? [allFoundQuestions[0]] : []),
      });

      rounds.push({
        position: 2,
        roundType: "System Design",
        durationMinutes: 45,
        difficulty: "Medium",
        notes: "Round 2 architecture",
        topics: r2Topics.length > 0 ? r2Topics : allFoundTopics,
        questions: r2Questions.length > 0 ? r2Questions : (allFoundQuestions.length > 1 ? [allFoundQuestions[1]] : []),
      });
    } else {
      let roundType = "Technical Round";
      if (fullTextLower.includes("system design")) {
        roundType = "System Design";
      } else if (fullTextLower.includes("behavioral") || fullTextLower.includes("hr")) {
        roundType = "Behavioral";
      } else if (fullTextLower.includes("sql") || fullTextLower.includes("database")) {
        roundType = "Database / SQL Round";
      }

      rounds.push({
        position: 1,
        roundType,
        durationMinutes: 45,
        difficulty: "Medium",
        notes: "Grounded extracted round",
        topics: allFoundTopics,
        questions: allFoundQuestions,
      });
    }

    const mockOutput = {
      metadata: {
        roleCandidate: "Software Engineer",
        outcomeCandidate: "Offer",
        difficultyCandidate: "Medium",
        overallSummary: primarySource.slice(0, 100),
      },
      rounds,
      unassignedQuestions: [],
      unassignedTopics: [],
    };

    return {
      rawText: JSON.stringify(mockOutput, null, 2),
      model,
    };
  }
}

export class StandardLLMProvider implements LLMProvider {
  name = "standard";

  async generate(params: LLMGenerationParams): Promise<LLMGenerationResult> {
    const apiKey = process.env.AI_API_KEY;
    const model = params.model || process.env.AI_MODEL || "gemini-1.5-flash";

    if (!apiKey) {
      // Fall back to Mock provider if no API key is set
      const mock = new MockLLMProvider();
      return mock.generate(params);
    }

    // Generic OpenAI-compatible JSON endpoint call
    const baseUrl = process.env.AI_BASE_URL || "https://api.openai.com/v1";
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.userPrompt },
        ],
        temperature: params.temperature ?? 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`AI Provider HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const rawText = data.choices?.[0]?.message?.content || "{}";

    return {
      rawText,
      model,
    };
  }
}

let activeProvider: LLMProvider | null = null;

export function getAIProvider(): LLMProvider {
  if (activeProvider) return activeProvider;

  const providerType = process.env.AI_PROVIDER?.toLowerCase();
  if (providerType === "mock" || !process.env.AI_API_KEY) {
    activeProvider = new MockLLMProvider();
  } else {
    activeProvider = new StandardLLMProvider();
  }

  return activeProvider;
}

export function setTestAIProvider(provider: LLMProvider | null) {
  activeProvider = provider;
}
