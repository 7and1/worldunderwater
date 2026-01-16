import OpenAI from "openai";
import type { DisasterType } from "../data-sources/types";
import {
  initCostTracking,
  estimateCost,
  estimateTokens as estimateTokensCost,
  recordSpend,
  getRecommendedModel,
  canMakeRequest,
} from "../ai-cost";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// P1-11: Initialize cost tracking on module load
initCostTracking().catch((err) => {
  console.warn("[AI Cost] Failed to initialize cost tracking:", err.message);
});

export interface ArticleGenerationInput {
  event: {
    title: string;
    description?: string;
    disasterType: DisasterType;
    severity: string;
    source?: string;
    sourceUrl?: string;
    location: {
      locality?: string;
      country?: string;
      latitude: number;
      longitude: number;
    };
    eventDate: Date;
  };
  relatedEvents?: Array<{
    title: string;
    eventDate: Date;
  }>;
  matchedProducts?: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
  }>;
}

export interface GeneratedArticle {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  sections: ArticleSection[];
  productRecommendations: ProductRecommendation[];
  keywords: string[];
}

interface ArticleSection {
  type: "overview" | "safety" | "preparation" | "products" | "resources";
  heading: string;
  body: string;
}

interface ProductRecommendation {
  productId: string;
  relevanceReason: string;
  priority: number;
}

export async function generateArticle(
  input: ArticleGenerationInput,
): Promise<GeneratedArticle> {
  const prompt = buildArticlePrompt(input);

  // P1-11: Estimate tokens and cost before request
  const inputTokenEstimate = estimateTokensCost(
    JSON.stringify(input) +
      prompt +
      "You are an expert disaster preparedness writer...",
  );
  const outputTokenEstimate = 4000; // max_tokens setting
  const estimatedCostData = estimateCost(
    "gpt-4o",
    inputTokenEstimate,
    outputTokenEstimate,
  );

  // P1-11: Check if request is allowed
  const { allowed, reason } = await canMakeRequest(
    estimatedCostData.estimatedCost,
  );
  if (!allowed) {
    throw new Error(`[AI Cost] Request blocked: ${reason}`);
  }

  // P1-11: Get recommended model (may fallback to cheaper model)
  const { model: recommendedModel, reason: modelReason } =
    await getRecommendedModel("gpt-4o", estimatedCostData.estimatedCost);

  if (modelReason) {
    console.warn(`[AI Cost] ${modelReason}`);
  }

  const response = await openai.chat.completions.create({
    model: recommendedModel,
    messages: [
      {
        role: "system",
        content: `You are an expert disaster preparedness writer for worldunderwater.org.
Your articles help people understand climate disasters and prepare for emergencies.
Always output valid JSON. Be factual, urgent but calm, and helpful.
Focus on actionable advice and survival preparedness.`,
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content returned from OpenAI");
  }

  // P1-11: Record actual spend
  const inputTokens = response.usage?.prompt_tokens || inputTokenEstimate;
  const outputTokens = response.usage?.completion_tokens || outputTokenEstimate;
  await recordSpend(recommendedModel, inputTokens, outputTokens, undefined, {
    operation: "generate_article",
    eventTitle: input.event.title,
  });

  console.log(`[AI Cost] Recorded spend for ${recommendedModel}:`, {
    inputTokens,
    outputTokens,
    cost: estimateCost(
      recommendedModel,
      inputTokens,
      outputTokens,
    ).estimatedCost.toFixed(4),
  });

  const parsed = JSON.parse(content) as GeneratedArticle;
  return validateAndCleanArticle(parsed);
}

function buildArticlePrompt(input: ArticleGenerationInput): string {
  const { event, relatedEvents, matchedProducts } = input;

  const locationStr =
    [event.location.locality, event.location.country]
      .filter(Boolean)
      .join(", ") || "Unknown Location";

  return `Generate a comprehensive, SEO-optimized article about the following disaster event.

EVENT DETAILS:
- Type: ${event.disasterType}
- Title: ${event.title}
- Location: ${locationStr}
- Date: ${event.eventDate.toLocaleDateString()}
- Severity: ${event.severity}
- Description: ${event.description || "No additional details available"}
- Primary Source: ${event.source || "Official data feed"} ${
    event.sourceUrl ? `(${event.sourceUrl})` : ""
  }

${
  relatedEvents?.length
    ? `
RELATED RECENT EVENTS:
${relatedEvents.map((e) => `- ${e.title} (${e.eventDate.toLocaleDateString()})`).join("\n")}
`
    : ""
}

${
  matchedProducts?.length
    ? `
RECOMMENDED PRODUCTS TO FEATURE:
${matchedProducts.map((p) => `- ${p.name} (${p.category}): ${p.description}`).join("\n")}
`
    : ""
}

REQUIREMENTS:
1. Write a compelling headline (max 70 chars) optimized for search
2. Write a meta description (max 160 chars)
3. Write an excerpt (max 300 chars)
4. Structure the article with these sections:
   - Overview: What happened, current status, affected areas
   - Safety Guidelines: Immediate actions people should take
   - Preparation Checklist: Items and steps for preparedness
   - Product Recommendations: Naturally integrate survival products
   - Resources: Emergency contacts and helpful links
   - Sources: Bullet list of official data sources with URLs
   - Risk Notice: A short disclaimer that information is automated and not professional advice
5. Include 5-10 relevant SEO keywords
6. Tone: Authoritative, urgent but calm, helpful
7. Length: 800-1200 words total

OUTPUT FORMAT (JSON):
{
  "title": "...",
  "slug": "...",
  "metaTitle": "...",
  "metaDescription": "...",
  "excerpt": "...",
  "content": "... (full HTML article)",
  "sections": [
    {
      "type": "overview|safety|preparation|products|resources",
      "heading": "...",
      "body": "... (HTML formatted)"
    }
  ],
  "productRecommendations": [
    {
      "productId": "...",
      "relevanceReason": "...",
      "priority": 1-10
    }
  ],
  "keywords": ["keyword1", "keyword2", ...]
}`;
}

function validateAndCleanArticle(article: GeneratedArticle): GeneratedArticle {
  // Ensure slug is URL-safe
  article.slug = article.slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);

  // Truncate meta fields if too long
  if (article.metaTitle.length > 70) {
    article.metaTitle = article.metaTitle.slice(0, 67) + "...";
  }
  if (article.metaDescription.length > 160) {
    article.metaDescription = article.metaDescription.slice(0, 157) + "...";
  }
  if (article.excerpt.length > 300) {
    article.excerpt = article.excerpt.slice(0, 297) + "...";
  }

  // Ensure keywords is an array
  if (!Array.isArray(article.keywords)) {
    article.keywords = [];
  }

  // Ensure sections is an array
  if (!Array.isArray(article.sections)) {
    article.sections = [];
  }

  return article;
}

// Estimate token usage for cost tracking
export function estimateInputTokens(input: ArticleGenerationInput): number {
  const promptLength = JSON.stringify(input).length;
  // Rough estimate: 4 chars per token for input, expect ~2000 tokens output
  return Math.ceil(promptLength / 4) + 2000;
}
