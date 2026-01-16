/**
 * Data Ingestion Pipeline
 *
 * Orchestrates fetching from all data sources, applying significance filter,
 * and triggering article generation for significant events.
 */

import {
  fetchEonetEvents,
  fetchUsgsEarthquakes,
  fetchReliefwebDisasters,
} from "../data-sources/adapters";
import type { NormalizedEvent } from "../data-sources/types";
import {
  evaluateSignificance,
  getFilterStats,
  type EventForFiltering,
} from "../ai-pipeline/significance-filter";
import { hashPayload } from "../utils/hash";

export interface IngestionResult {
  source: string;
  status: "success" | "partial" | "failed" | "skipped" | "rate_limited";
  eventsProcessed: number;
  eventsCreated: number;
  eventsUpdated: number;
  eventsSkipped: number;
  articlesQueued: number;
  errors: string[];
  duration: number;
}

export interface PipelineResult {
  startedAt: Date;
  completedAt: Date;
  totalDuration: number;
  sources: IngestionResult[];
  summary: {
    totalEvents: number;
    newEvents: number;
    articlesQueued: number;
    filterStats: ReturnType<typeof getFilterStats>;
  };
}

interface StorageAdapter {
  findEventBySourceId(sourceId: string): Promise<StoredEvent | null>;
  createEvent(event: NormalizedEvent): Promise<StoredEvent>;
  updateEvent(
    id: string,
    event: Partial<NormalizedEvent> & {
      status?: "new" | "processing" | "processed" | "archived" | "error";
      articleGenerated?: boolean;
      processingErrors?: unknown;
    },
  ): Promise<StoredEvent>;
  logIngestion(result: IngestionResult): Promise<void>;
  markEventForArticle(eventId: string): Promise<void>;
}

interface SourceHealthManager {
  shouldSkip(
    source: string,
  ): Promise<{ skip: boolean; reason?: string } | null>;
  recordSuccess(source: string): Promise<void>;
  recordFailure(source: string): Promise<void>;
}

interface StoredEvent {
  id: string;
  sourceId: string;
  payloadHash?: string;
}

/**
 * Convert NormalizedEvent to EventForFiltering
 */
function toFilteringEvent(event: NormalizedEvent): EventForFiltering {
  return {
    disasterType: event.disasterType,
    severity: event.severity,
    magnitude: event.magnitude,
    location: {
      latitude: event.location.latitude,
      longitude: event.location.longitude,
      locality: event.location.locality,
      country: event.location.country,
    },
  };
}

/**
 * Run the full ingestion pipeline
 */
export async function runIngestionPipeline(
  storage: StorageAdapter,
  options: {
    generateArticles?: boolean;
    dryRun?: boolean;
    health?: SourceHealthManager;
  } = {},
): Promise<PipelineResult> {
  const startedAt = new Date();
  const results: IngestionResult[] = [];
  const allEvents: NormalizedEvent[] = [];

  // Fetch from all sources in parallel
  const [eonetResult, usgsResult, reliefwebResult] = await Promise.allSettled([
    ingestFromSource("nasa_eonet", fetchEonetEvents, storage, options),
    ingestFromSource(
      "usgs_earthquake",
      () => fetchUsgsEarthquakes(4.5, 24),
      storage,
      options,
    ),
    ingestFromSource("reliefweb", fetchReliefwebDisasters, storage, options),
  ]);

  // Collect results
  if (eonetResult.status === "fulfilled") {
    results.push(eonetResult.value.result);
    allEvents.push(...eonetResult.value.events);
  } else {
    results.push({
      source: "nasa_eonet",
      status: "failed",
      eventsProcessed: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsSkipped: 0,
      articlesQueued: 0,
      errors: [eonetResult.reason?.message || "Unknown error"],
      duration: 0,
    });
  }

  if (usgsResult.status === "fulfilled") {
    results.push(usgsResult.value.result);
    allEvents.push(...usgsResult.value.events);
  } else {
    results.push({
      source: "usgs_earthquake",
      status: "failed",
      eventsProcessed: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsSkipped: 0,
      articlesQueued: 0,
      errors: [usgsResult.reason?.message || "Unknown error"],
      duration: 0,
    });
  }

  if (reliefwebResult.status === "fulfilled") {
    results.push(reliefwebResult.value.result);
    allEvents.push(...reliefwebResult.value.events);
  } else {
    results.push({
      source: "reliefweb",
      status: "failed",
      eventsProcessed: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsSkipped: 0,
      articlesQueued: 0,
      errors: [reliefwebResult.reason?.message || "Unknown error"],
      duration: 0,
    });
  }

  // Calculate filter stats
  const filterStats = getFilterStats(allEvents.map(toFilteringEvent));

  const completedAt = new Date();

  await Promise.all(results.map((result) => storage.logIngestion(result)));

  return {
    startedAt,
    completedAt,
    totalDuration: completedAt.getTime() - startedAt.getTime(),
    sources: results,
    summary: {
      totalEvents: allEvents.length,
      newEvents: results.reduce((sum, r) => sum + r.eventsCreated, 0),
      articlesQueued: results.reduce((sum, r) => sum + r.articlesQueued, 0),
      filterStats,
    },
  };
}

/**
 * Ingest events from a single source
 */
async function ingestFromSource(
  sourceName: string,
  fetcher: () => Promise<NormalizedEvent[]>,
  storage: StorageAdapter,
  options: {
    generateArticles?: boolean;
    dryRun?: boolean;
    health?: SourceHealthManager;
  },
): Promise<{ result: IngestionResult; events: NormalizedEvent[] }> {
  const startTime = Date.now();
  const errors: string[] = [];
  let eventsCreated = 0;
  let eventsUpdated = 0;
  let eventsSkipped = 0;
  let articlesQueued = 0;

  let events: NormalizedEvent[] = [];

  try {
    const healthDecision = await options.health?.shouldSkip(sourceName);
    if (healthDecision?.skip) {
      return {
        result: {
          source: sourceName,
          status: "skipped",
          eventsProcessed: 0,
          eventsCreated: 0,
          eventsUpdated: 0,
          eventsSkipped: 0,
          articlesQueued: 0,
          errors: [healthDecision.reason || "Source paused"],
          duration: Date.now() - startTime,
        },
        events: [],
      };
    }

    events = await fetcher();
  } catch (error) {
    const message = (error as Error).message || "Unknown error";
    const status =
      message.includes("429") || message.includes("rate limit")
        ? "rate_limited"
        : "failed";
    await options.health?.recordFailure(sourceName);
    return {
      result: {
        source: sourceName,
        status,
        eventsProcessed: 0,
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsSkipped: 0,
        articlesQueued: 0,
        errors: [message],
        duration: Date.now() - startTime,
      },
      events: [],
    };
  }

  for (const event of events) {
    try {
      // Check if event already exists
      const existing = await storage.findEventBySourceId(event.sourceId);
      const payloadHash = event.payloadHash || hashPayload(event.rawPayload);

      if (existing) {
        if (existing.payloadHash === payloadHash) {
          eventsSkipped++;
          continue;
        }

        if (!options.dryRun) {
          await storage.updateEvent(existing.id, {
            ...event,
            payloadHash,
          });
        }

        eventsUpdated++;
        continue;
      }

      // Evaluate significance
      const filterResult = evaluateSignificance(toFilteringEvent(event));

      if (filterResult.decision === "DISCARD") {
        eventsSkipped++;
        continue;
      }

      if (options.dryRun) {
        eventsCreated++;
        continue;
      }

      // Store the event
      const storedEvent = await storage.createEvent({
        ...event,
        payloadHash,
      });
      eventsCreated++;

      // Generate article for significant events
      if (
        filterResult.decision === "FULL_ARTICLE" &&
        options.generateArticles !== false
      ) {
        try {
          await storage.markEventForArticle(storedEvent.id);
          articlesQueued++;
        } catch (articleError) {
          errors.push(
            `Queueing failed for ${event.sourceId}: ${(articleError as Error).message}`,
          );
        }
      } else if (filterResult.decision !== "FULL_ARTICLE") {
        await storage.updateEvent(storedEvent.id, { status: "processed" });
      }
    } catch (eventError) {
      errors.push(
        `Failed to process ${event.sourceId}: ${(eventError as Error).message}`,
      );
    }
  }

  if (errors.length > 0) {
    await options.health?.recordFailure(sourceName);
  } else {
    await options.health?.recordSuccess(sourceName);
  }

  return {
    result: {
      source: sourceName,
      status: errors.length > 0 ? "partial" : "success",
      eventsProcessed: events.length,
      eventsCreated,
      eventsUpdated,
      eventsSkipped,
      articlesQueued,
      errors,
      duration: Date.now() - startTime,
    },
    events,
  };
}

/**
 * Run a single source ingestion (for targeted updates)
 */
export async function ingestFromSingleSource(
  source: "nasa_eonet" | "usgs_earthquake" | "reliefweb",
  storage: StorageAdapter,
  options: { generateArticles?: boolean; dryRun?: boolean } = {},
): Promise<IngestionResult> {
  const fetchers = {
    nasa_eonet: fetchEonetEvents,
    usgs_earthquake: () => fetchUsgsEarthquakes(4.5, 24),
    reliefweb: fetchReliefwebDisasters,
  };

  const { result } = await ingestFromSource(source, fetchers[source], storage, {
    ...options,
  });

  return result;
}
