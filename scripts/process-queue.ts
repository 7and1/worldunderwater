#!/usr/bin/env node
/**
 * Cron Job: Content Queue Processor
 *
 * Run with: npx tsx scripts/process-queue.ts
 * Schedule: Every 2-5 minutes via cron
 *
 * Uses PostgreSQL content_queue for article generation and the persistent
 * job_queue for background tasks (social automation).
 */

import { config } from "dotenv";
config();

import { getPayload } from "payload";
import payloadConfig from "../src/payload.config";
import type { NormalizedEvent } from "../src/lib/data-sources/types";
import type {
  RawEvent,
  DisasterType as SchemaDisasterType,
} from "../src/types/schema.types";
import { generateArticleForEvent } from "../src/lib/ai-pipeline/article-orchestrator";
import { convertHtmlToLexical } from "../src/lib/content/lexical";
import {
  claimContentJobs,
  markContentJobCompleted,
  markContentJobFailed,
  markContentJobSkipped,
  startWorker,
  stopWorker,
  type ContentQueueItem,
  type JobHandler,
  type JobType,
} from "../src/lib/queue";
import {
  executeSocialPost,
  SocialJobType,
} from "../src/lib/integrations/social";
import { closePool } from "../src/lib/db";

const CONTENT_BATCH_SIZE = Number(process.env.CONTENT_QUEUE_BATCH || 3);
const CONTENT_WORKER_ID =
  process.env.CONTENT_QUEUE_WORKER_ID || `content-${process.pid}-${Date.now()}`;

interface SocialPayload {
  articleId: string;
  slug: string;
  title: string;
  text: string;
  imageUrl?: string;
}

async function buildDisasterTypeMap(
  payload: Awaited<ReturnType<typeof getPayload>>,
) {
  const result = await payload.find({
    collection: "disaster-types",
    limit: 200,
  });

  const idToCode = new Map<number, string>();
  const codeToId = new Map<string, number>();

  result.docs.forEach((doc) => {
    const type = doc as SchemaDisasterType;
    idToCode.set(type.id, type.code);
    codeToId.set(type.code, type.id);
  });

  return { idToCode, codeToId };
}

function mapRawEventToNormalized(
  raw: RawEvent,
  disasterTypeMap: { idToCode: Map<number, string> },
): NormalizedEvent {
  const disasterType =
    (raw as unknown as { eventType?: string }).eventType ||
    (typeof raw.disasterTypeId === "number"
      ? disasterTypeMap.idToCode.get(raw.disasterTypeId)
      : undefined) ||
    "storm";

  return {
    sourceId: raw.sourceId,
    source: raw.source,
    sourceUrl: raw.sourceUrl,
    title: raw.title || "Untitled Event",
    description: raw.description,
    disasterType: disasterType as NormalizedEvent["disasterType"],
    severity: (raw.metrics?.severity ||
      "moderate") as NormalizedEvent["severity"],
    magnitude: raw.metrics?.magnitude,
    location: {
      latitude: raw.location?.latitude || 0,
      longitude: raw.location?.longitude || 0,
      locality: raw.location?.name || "",
      country: raw.location?.name || "",
      countryCode: raw.location?.countryCode,
      coordinatesRaw: raw.location?.coordinatesRaw,
    },
    eventDate: raw.occurredAt ? new Date(raw.occurredAt) : new Date(),
    rawPayload: raw.rawPayload,
    payloadHash: raw.payloadHash,
  };
}

function isRetryableError(error: Error): boolean {
  const retryablePatterns = [
    /ECONNRESET/,
    /ETIMEDOUT/,
    /ENOTFOUND/,
    /rate limit/i,
    /timeout/i,
    /503/,
    /502/,
    /504/,
  ];
  return retryablePatterns.some((pattern) => pattern.test(error.message));
}

async function processContentQueue(
  payload: Awaited<ReturnType<typeof getPayload>>,
  disasterTypeMap: {
    idToCode: Map<number, string>;
    codeToId: Map<string, number>;
  },
) {
  const items = await claimContentJobs(CONTENT_BATCH_SIZE, CONTENT_WORKER_ID);

  if (items.length === 0) {
    console.log("No pending content queue items.");
    return;
  }

  console.log(`Processing ${items.length} content queue item(s)...`);

  for (const item of items) {
    await handleContentQueueItem(payload, disasterTypeMap, item);
  }
}

async function handleContentQueueItem(
  payload: Awaited<ReturnType<typeof getPayload>>,
  disasterTypeMap: {
    idToCode: Map<number, string>;
    codeToId: Map<string, number>;
  },
  item: ContentQueueItem,
) {
  const rawEventId = item.rawEventId;

  let rawEvent: RawEvent | null = null;

  try {
    rawEvent = (await payload.findByID({
      collection: "raw-events",
      id: rawEventId,
    })) as RawEvent;
  } catch {
    rawEvent = null;
  }

  if (!rawEvent) {
    await markContentJobSkipped(item.id, "Raw event not found");
    return;
  }

  if ((rawEvent as RawEvent).articleGenerated) {
    await markContentJobSkipped(item.id, "Article already generated");
    return;
  }

  try {
    await payload.update({
      collection: "raw-events",
      id: rawEventId,
      data: { status: "processing" },
    });

    const normalized = mapRawEventToNormalized(rawEvent, disasterTypeMap);
    const article = await generateArticleForEvent(normalized, rawEventId);
    const lexicalContent = await convertHtmlToLexical(article.content);

    const disasterTypeId =
      (rawEvent as unknown as { disasterType?: { id?: number } }).disasterType
        ?.id ||
      (rawEvent as unknown as { disasterTypeId?: number }).disasterTypeId ||
      disasterTypeMap.codeToId.get(
        (rawEvent as unknown as { eventType?: string }).eventType || "",
      );

    const created = await payload.create({
      collection: "published-articles",
      data: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: lexicalContent,
        contentFormat: "html",
        disasterType: disasterTypeId,
        tags: article.keywords,
        sources: {
          primaryEvent: rawEventId,
          rawEvents: [rawEventId],
          attribution: `Source: ${rawEvent.sourceUrl || rawEvent.source}`,
        },
        aiMetadata: {
          model: "gpt-4o",
          promptVersion: "v1",
          generationParams: {},
          humanEdited: false,
        },
        seo: {
          metaTitle: article.metaTitle,
          metaDescription: article.metaDescription,
          ogImageUrl: article.thumbnailUrl,
          canonicalUrl: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.PAYLOAD_PUBLIC_SITE_URL || "https://worldunderwater.org"}/article/${article.slug}`,
          keywords: article.keywords,
        },
        featuredImage: {
          url: article.thumbnailUrl,
          alt: article.title,
        },
        location: {
          name: rawEvent.location?.name,
          countryCode: rawEvent.location?.countryCode,
          latitude: rawEvent.location?.latitude,
          longitude: rawEvent.location?.longitude,
        },
        status: "published",
        publishedAt: new Date().toISOString(),
        author: {
          name: "Editorial Team",
        },
      },
    });

    await payload.update({
      collection: "raw-events",
      id: rawEventId,
      data: {
        status: "processed",
        articleGenerated: true,
      },
    });

    await markContentJobCompleted(item.id, String(created.id));

    console.log(`Generated article for event ${rawEventId}`);
  } catch (error) {
    const err = error as Error;
    const retryable = isRetryableError(err) && item.attempts < item.maxAttempts;

    console.error(`Article generation failed for ${rawEventId}:`, err);

    await markContentJobFailed(item.id, err.message, retryable);

    await payload.update({
      collection: "raw-events",
      id: rawEventId,
      data: {
        status: retryable ? "new" : "error",
        processingErrors: {
          message: err.message,
          stack: err.stack,
        },
      },
    });
  }
}

async function registerSocialHandlers() {
  const worker = await startWorker({
    pollIntervalMs: Number(process.env.QUEUE_POLL_INTERVAL || "1000"),
    maxConcurrentJobs: Number(process.env.QUEUE_MAX_CONCURRENT || "2"),
    shutdownTimeoutMs: 30000,
  });

  Object.values(SocialJobType).forEach((jobType) => {
    const handler: JobHandler<unknown, unknown> = {
      type: jobType as unknown as JobType,
      async handler(payload) {
        // Validate payload has required properties
        const p = payload as Record<string, unknown>;
        if (!p.articleId || !p.slug || !p.title || !p.text) {
          return {
            success: false,
            error: new Error("Invalid payload: missing required fields"),
            retryable: false,
          };
        }
        const socialPayload: SocialPayload = {
          articleId: String(p.articleId),
          slug: String(p.slug),
          title: String(p.title),
          text: String(p.text),
          imageUrl: p.imageUrl ? String(p.imageUrl) : undefined,
        };
        const result = await executeSocialPost(
          jobType as SocialJobType,
          socialPayload,
        );

        if (result.success) {
          return { success: true };
        }

        return {
          success: false,
          error: result.error,
          retryable: true,
        };
      },
      timeoutMs: 60000,
      maxRetries: 3,
      retryDelay: 5000,
    };

    worker.registerHandler(handler);
  });

  return worker;
}

async function main() {
  const payload = await getPayload({ config: payloadConfig });
  const disasterTypeMap = await buildDisasterTypeMap(payload);

  await registerSocialHandlers();

  await processContentQueue(payload, disasterTypeMap);

  const shutdown = async () => {
    console.log("Shutting down worker...");
    await stopWorker();
    await closePool();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  const maxRunTime = Number(process.env.QUEUE_MAX_RUN_TIME || "300000");
  setTimeout(async () => {
    console.log(`Max run time of ${maxRunTime}ms reached, shutting down...`);
    await shutdown();
  }, maxRunTime);
}

main().catch((error) => {
  console.error("Queue processing failed:", error);
  process.exit(1);
});
