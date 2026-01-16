import { createHash } from "crypto";
import type { NormalizedEvent, DisasterType, Severity } from "../types";
import { hashPayload } from "@/lib/utils/hash";

// NASA EONET category mapping
const EONET_CATEGORY_MAP: Record<string, DisasterType> = {
  wildfires: "wildfire",
  severeStorms: "storm",
  volcanoes: "volcanic",
  floods: "flood",
  earthquakes: "earthquake",
  drought: "drought",
  landslides: "landslide",
  seaLakeIce: "flood",
  waterColor: "flood",
  dustHaze: "storm",
  tempExtremes: "heat_wave",
  manmade: "storm",
  snow: "cold_wave",
};

interface EonetEvent {
  id: string;
  title: string;
  description?: string;
  link?: string;
  closed?: string;
  categories: Array<{ id: string; title: string }>;
  sources: Array<{ id: string; url: string; date?: string }>;
  geometry: Array<{
    magnitudeValue?: number;
    magnitudeUnit?: string;
    date: string;
    type: string;
    coordinates: number[];
  }>;
}

interface EonetResponse {
  title: string;
  description: string;
  link: string;
  events: EonetEvent[];
}

export async function fetchEonetEvents(
  daysBack = 30,
): Promise<NormalizedEvent[]> {
  const url = `https://eonet.gsfc.nasa.gov/api/v3/events?days=${daysBack}&status=open`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 900 }, // 15 minutes
  });

  if (!response.ok) {
    throw new Error(
      `EONET API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: EonetResponse = await response.json();

  return data.events.map((event) => normalizeEonetEvent(event));
}

function normalizeEonetEvent(event: EonetEvent): NormalizedEvent {
  const latestGeometry = event.geometry[event.geometry.length - 1];
  const coordinates = latestGeometry?.coordinates || [0, 0];

  return {
    sourceId: `eonet_${event.id}`,
    source: "nasa_eonet",
    sourceUrl: event.sources?.[0]?.url || event.link,
    title: event.title,
    description: event.description || undefined,
    disasterType: mapEonetCategory(event.categories),
    severity: estimateSeverity(event),
    magnitude: latestGeometry?.magnitudeValue,
    location: {
      longitude: coordinates[0],
      latitude: coordinates[1],
      locality: extractLocalityFromTitle(event.title),
      coordinatesRaw: event.geometry,
    },
    eventDate: new Date(
      latestGeometry?.date || event.sources[0]?.date || Date.now(),
    ),
    rawPayload: event,
    payloadHash: hashPayload(event),
  };
}

function mapEonetCategory(categories: Array<{ id: string }>): DisasterType {
  for (const cat of categories) {
    if (EONET_CATEGORY_MAP[cat.id]) {
      return EONET_CATEGORY_MAP[cat.id];
    }
  }
  return "storm"; // Default fallback
}

function estimateSeverity(event: EonetEvent): Severity {
  // Check magnitude if available
  const magnitude = event.geometry[0]?.magnitudeValue;
  if (magnitude !== undefined) {
    if (magnitude >= 7) return "catastrophic";
    if (magnitude >= 5) return "severe";
    if (magnitude >= 3) return "moderate";
    return "minor";
  }

  // Check if event has been going on for a while (multiple geometry points = ongoing)
  if (event.geometry.length > 10) return "severe";
  if (event.geometry.length > 5) return "moderate";

  return "minor";
}

function extractLocalityFromTitle(title: string): string | undefined {
  // Try to extract location from title like "Wildfire - California, USA"
  const match = title.match(/[-–]\s*(.+)$/);
  return match?.[1]?.trim();
}

export function generateEonetSourceId(eventId: string): string {
  return `eonet_${eventId}`;
}

export function generateEonetContentHash(event: EonetEvent): string {
  const content = JSON.stringify({
    id: event.id,
    geometryCount: event.geometry.length,
    lastUpdate: event.geometry[event.geometry.length - 1]?.date,
  });
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}
