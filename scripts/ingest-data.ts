#!/usr/bin/env node
/**
 * Cron Job: Data Ingestion
 *
 * Run with: npx tsx scripts/ingest-data.ts
 * Schedule: Every 30 minutes via cron
 */

import { config } from "dotenv";
config();

import { getPayload } from "payload";
import { randomUUID } from "crypto";
import payloadConfig from "../src/payload.config";
import { runIngestionPipeline } from "../src/lib/ingestion";
import type { IngestionResult } from "../src/lib/ingestion";
import type { NormalizedEvent } from "../src/lib/data-sources/types";
import type { DisasterType } from "../src/types/schema.types";
import { triggerRevalidation } from "../src/lib/integrations/revalidate";
import { query } from "../src/lib/db";
import { enqueueContentJob } from "../src/lib/queue";

interface StoredEvent {
  id: string;
  sourceId: string;
  payloadHash?: string;
}

async function buildDisasterTypeMap(
  payload: Awaited<ReturnType<typeof getPayload>>,
) {
  const result = await payload.find({
    collection: "disaster-types",
    limit: 200,
  });

  return new Map(
    result.docs.map((doc) => [
      (doc as DisasterType).code,
      (doc as DisasterType).id,
    ]),
  );
}

function mapNormalizedEventToPayload(
  event: NormalizedEvent,
  disasterTypeMap: Map<string, number>,
) {
  return {
    source: event.source,
    sourceId: event.sourceId,
    sourceUrl: event.sourceUrl,
    rawPayload: event.rawPayload,
    payloadHash: event.payloadHash,
    eventType: event.disasterType,
    disasterType: disasterTypeMap.get(event.disasterType) || undefined,
    title: event.title,
    description: event.description,
    location: {
      latitude: event.location.latitude,
      longitude: event.location.longitude,
      name: event.location.locality || event.location.country || "",
      countryCode: event.location.countryCode,
      coordinatesRaw: event.location.coordinatesRaw,
    },
    occurredAt: event.eventDate,
    reportedAt: event.eventDate,
    metrics: {
      magnitude: event.magnitude,
      severity: event.severity,
    },
    status: "new",
    articleGenerated: false,
    ingestedAt: new Date().toISOString(),
  };
}

async function main() {
  console.log(`[${new Date().toISOString()}] Starting data ingestion...`);

  const payload = await getPayload({ config: payloadConfig });
  const disasterTypeMap = await buildDisasterTypeMap(payload);
  const jobId = randomUUID();

  const storage = {
    async findEventBySourceId(sourceId: string): Promise<StoredEvent | null> {
      const result = await payload.find({
        collection: "raw-events",
        where: { sourceId: { equals: sourceId } },
        limit: 1,
      });
      if (result.docs.length === 0) return null;
      const doc = result.docs[0] as Record<string, unknown>;
      return {
        id: doc.id as string,
        sourceId: doc.sourceId as string,
        payloadHash: doc.payloadHash as string | undefined,
      };
    },

    async createEvent(event: NormalizedEvent): Promise<StoredEvent> {
      const data = mapNormalizedEventToPayload(event, disasterTypeMap);
      const doc = await payload.create({
        collection: "raw-events",
        data,
      });

      if (
        event.location &&
        typeof event.location.longitude === "number" &&
        typeof event.location.latitude === "number"
      ) {
        try {
          await query(
            "UPDATE raw_events SET coordinates = ST_MakePoint($1, $2)::geography WHERE id = $3",
            [event.location.longitude, event.location.latitude, doc.id],
          );
        } catch {
          // Ignore if raw_events table or coordinates column does not exist
        }
      }
      return {
        id: doc.id as string,
        sourceId: (doc as Record<string, unknown>).sourceId as string,
        payloadHash: (doc as Record<string, unknown>).payloadHash as string,
      };
    },

    async updateEvent(
      id: string,
      event: Partial<NormalizedEvent> & {
        status?: "new" | "processing" | "processed" | "archived" | "error";
        articleGenerated?: boolean;
        processingErrors?: unknown;
      },
    ): Promise<StoredEvent> {
      const data: Record<string, unknown> = {};

      if (event.source) data.source = event.source;
      if (event.sourceId) data.sourceId = event.sourceId;
      if (event.sourceUrl) data.sourceUrl = event.sourceUrl;
      if (event.rawPayload) data.rawPayload = event.rawPayload;
      if (event.payloadHash) data.payloadHash = event.payloadHash;
      if (event.title) data.title = event.title;
      if (event.description) data.description = event.description;
      if (event.disasterType) {
        data.eventType = event.disasterType;
        data.disasterType = disasterTypeMap.get(event.disasterType);
      }
      if (event.location) {
        data.location = {
          latitude: event.location.latitude,
          longitude: event.location.longitude,
          name: event.location.locality || event.location.country || "",
          countryCode: event.location.countryCode,
          coordinatesRaw: (event.location as { coordinatesRaw?: unknown })
            .coordinatesRaw,
        };
      }
      if (event.eventDate) {
        data.occurredAt = event.eventDate;
        data.reportedAt = event.eventDate;
      }
      if (event.magnitude || event.severity) {
        data.metrics = {
          magnitude: event.magnitude,
          severity: event.severity,
        };
      }
      if (event.status) data.status = event.status;
      if (typeof event.articleGenerated === "boolean") {
        data.articleGenerated = event.articleGenerated;
      }
      if (event.processingErrors) {
        data.processingErrors = event.processingErrors;
      }

      const doc = await payload.update({
        collection: "raw-events",
        id,
        data,
      });

      if (
        event.location &&
        typeof event.location.longitude === "number" &&
        typeof event.location.latitude === "number"
      ) {
        try {
          await query(
            "UPDATE raw_events SET coordinates = ST_MakePoint($1, $2)::geography WHERE id = $3",
            [event.location.longitude, event.location.latitude, doc.id],
          );
        } catch {
          // Ignore if raw_events table or coordinates column does not exist
        }
      }
      return {
        id: doc.id as string,
        sourceId: (doc as Record<string, unknown>).sourceId as string,
        payloadHash: (doc as Record<string, unknown>).payloadHash as string,
      };
    },

    async markEventForArticle(eventId: string): Promise<void> {
      await enqueueContentJob(
        eventId,
        Number(process.env.CONTENT_QUEUE_PRIORITY || "50"),
      );
      await payload.update({
        collection: "raw-events",
        id: eventId,
        data: {
          status: "new",
          articleGenerated: false,
        },
      });
    },

    async logIngestion(result: IngestionResult): Promise<void> {
      const now = Date.now();
      const startedAt = new Date(now - result.duration).toISOString();

      const status =
        result.status === "failed"
          ? "error"
          : result.status === "skipped"
            ? "rate_limited"
            : result.status;

      await payload.create({
        collection: "ingestion-logs",
        data: {
          source: result.source,
          jobId,
          status,
          results: {
            eventsFound: result.eventsProcessed,
            eventsNew: result.eventsCreated,
            eventsUpdated: result.eventsUpdated,
            eventsSkipped: result.eventsSkipped,
          },
          timing: {
            startedAt,
            completedAt: new Date().toISOString(),
            durationMs: result.duration,
          },
          error: result.errors.length
            ? {
                message: result.errors.join("\n"),
                retryCount: 0,
              }
            : undefined,
        },
      });
    },
  };

  const healthGuard = {
    async shouldSkip(source: string) {
      const recent = await payload.find({
        collection: "ingestion-logs",
        where: { source: { equals: source } },
        limit: 3,
        sort: "-createdAt",
      });

      if (recent.docs.length < 3) return null;

      const failures = recent.docs.filter(
        (doc) =>
          (doc as { status?: string }).status === "error" ||
          (doc as { status?: string }).status === "partial" ||
          (doc as { status?: string }).status === "rate_limited",
      );

      const lastFailure = recent.docs[0] as { createdAt?: string };
      const lastFailureAt = lastFailure.createdAt
        ? new Date(lastFailure.createdAt).getTime()
        : 0;

      if (failures.length >= 3 && Date.now() - lastFailureAt < 30 * 60 * 1000) {
        return { skip: true, reason: "Source paused after repeated failures" };
      }

      return null;
    },
    async recordSuccess() {
      return;
    },
    async recordFailure() {
      return;
    },
  };

  try {
    const result = await runIngestionPipeline(storage, {
      generateArticles: true,
      dryRun: process.argv.includes("--dry-run"),
      health: healthGuard,
    });

    console.log(`[${new Date().toISOString()}] Ingestion completed:`);
    console.log(`  Duration: ${result.totalDuration}ms`);
    console.log(`  Total events: ${result.summary.totalEvents}`);
    console.log(`  New events: ${result.summary.newEvents}`);
    console.log(`  Articles queued: ${result.summary.articlesQueued}`);
    console.log(`  Filter stats:`);
    console.log(
      `    - Full articles: ${result.summary.filterStats.fullArticle}`,
    );
    console.log(`    - List only: ${result.summary.filterStats.listOnly}`);
    console.log(`    - Discarded: ${result.summary.filterStats.discarded}`);
    console.log(
      `    - Est. cost savings: $${result.summary.filterStats.estimatedCostSavings.toFixed(2)}`,
    );

    for (const source of result.sources) {
      console.log(`  ${source.source}: ${source.status}`);
      if (source.errors.length > 0) {
        console.log(`    Errors: ${source.errors.join(", ")}`);
      }
    }

    if (result.summary.newEvents > 0) {
      await triggerRevalidation({ paths: ["/", "/disasters", "/sitemap.xml"] });
    }

    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Ingestion failed:`, error);
    process.exit(1);
  }
}

main();
