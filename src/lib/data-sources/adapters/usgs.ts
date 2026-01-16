import { createHash } from "crypto";
import type { NormalizedEvent, Severity } from "../types";
import { hashPayload } from "@/lib/utils/hash";

interface UsgsFeature {
  type: "Feature";
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    tz: number | null;
    url: string;
    detail: string;
    felt: number | null;
    cdi: number | null;
    mmi: number | null;
    alert: string | null;
    status: string;
    tsunami: number;
    sig: number;
    net: string;
    code: string;
    ids: string;
    sources: string;
    types: string;
    nst: number | null;
    dmin: number | null;
    rms: number;
    gap: number | null;
    magType: string;
    type: string;
    title: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number, number]; // [lon, lat, depth]
  };
}

interface UsgsResponse {
  type: "FeatureCollection";
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: UsgsFeature[];
}

export async function fetchUsgsEarthquakes(
  minMagnitude = 4.5,
  hoursBack = 24,
): Promise<NormalizedEvent[]> {
  const endTime = new Date().toISOString();
  const startTime = new Date(
    Date.now() - hoursBack * 60 * 60 * 1000,
  ).toISOString();

  const url = new URL("https://earthquake.usgs.gov/fdsnws/event/1/query");
  url.searchParams.set("format", "geojson");
  url.searchParams.set("minmagnitude", minMagnitude.toString());
  url.searchParams.set("starttime", startTime);
  url.searchParams.set("endtime", endTime);
  url.searchParams.set("orderby", "time");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 300 }, // 5 minutes
  });

  if (!response.ok) {
    throw new Error(
      `USGS API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: UsgsResponse = await response.json();

  return data.features.map((feature) => normalizeUsgsEvent(feature));
}

function normalizeUsgsEvent(feature: UsgsFeature): NormalizedEvent {
  const { properties, geometry } = feature;
  const [longitude, latitude, depth] = geometry.coordinates;

  return {
    sourceId: `usgs_${feature.id}`,
    source: "usgs_earthquake",
    sourceUrl: properties.url,
    title: properties.title,
    description: `Magnitude ${properties.mag} earthquake at depth ${depth.toFixed(1)}km. ${
      properties.tsunami ? "⚠️ Tsunami warning issued." : ""
    }`,
    disasterType: properties.tsunami ? "tsunami" : "earthquake",
    severity: mapMagnitudeToSeverity(properties.mag),
    magnitude: properties.mag,
    location: {
      longitude,
      latitude,
      locality: properties.place,
      coordinatesRaw: geometry,
    },
    eventDate: new Date(properties.time),
    rawPayload: feature,
    payloadHash: hashPayload(feature),
  };
}

function mapMagnitudeToSeverity(magnitude: number): Severity {
  if (magnitude >= 7.0) return "catastrophic";
  if (magnitude >= 6.0) return "severe";
  if (magnitude >= 5.0) return "moderate";
  return "minor";
}

export function generateUsgsSourceId(eventId: string): string {
  return `usgs_${eventId}`;
}

export function generateUsgsContentHash(feature: UsgsFeature): string {
  const content = JSON.stringify({
    id: feature.id,
    mag: feature.properties.mag,
    updated: feature.properties.updated,
  });
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

// Check for potential duplicates (aftershocks near main event)
export function isLikelyDuplicate(
  newEvent: NormalizedEvent,
  existingEvents: NormalizedEvent[],
  radiusKm = 50,
  timeWindowMinutes = 60,
): boolean {
  const timeWindow = timeWindowMinutes * 60 * 1000;

  for (const existing of existingEvents) {
    const timeDiff = Math.abs(
      newEvent.eventDate.getTime() - existing.eventDate.getTime(),
    );
    if (timeDiff > timeWindow) continue;

    const distance = haversineDistance(
      newEvent.location.latitude,
      newEvent.location.longitude,
      existing.location.latitude,
      existing.location.longitude,
    );

    if (distance < radiusKm) {
      return true;
    }
  }

  return false;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
