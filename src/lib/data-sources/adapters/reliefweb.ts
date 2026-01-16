import { createHash } from "crypto";
import type { NormalizedEvent, DisasterType, Severity } from "../types";
import { hashPayload } from "@/lib/utils/hash";

// ReliefWeb disaster type mapping
const RELIEFWEB_TYPE_MAP: Record<string, DisasterType> = {
  Flood: "flood",
  "Flash Flood": "flood",
  Earthquake: "earthquake",
  Tsunami: "tsunami",
  Cyclone: "hurricane",
  Hurricane: "hurricane",
  Typhoon: "hurricane",
  Tornado: "tornado",
  "Wild Fire": "wildfire",
  Volcano: "volcanic",
  Drought: "drought",
  Landslide: "landslide",
  "Mud Slide": "landslide",
  Storm: "storm",
  "Severe Local Storm": "storm",
  "Cold Wave": "cold_wave",
  "Heat Wave": "heat_wave",
};

interface ReliefwebDisaster {
  id: number;
  score: number;
  href: string;
  fields: {
    id: number;
    name: string;
    description?: string;
    status: string;
    glide?: string;
    date: {
      created: string;
      changed: string;
      original?: string;
    };
    country: Array<{
      id: number;
      name: string;
      iso3: string;
      location?: {
        lat: number;
        lon: number;
      };
    }>;
    type: Array<{
      id: number;
      name: string;
      code: string;
    }>;
    primary_type?: {
      id: number;
      name: string;
      code: string;
    };
    url?: string;
    url_alias?: string;
  };
}

interface ReliefwebResponse {
  time: number;
  href: string;
  links: {
    self: { href: string };
    next?: { href: string };
    prev?: { href: string };
  };
  took: number;
  totalCount: number;
  count: number;
  data: ReliefwebDisaster[];
}

export async function fetchReliefwebDisasters(
  limit = 50,
): Promise<NormalizedEvent[]> {
  const url = new URL("https://api.reliefweb.int/v1/disasters");
  url.searchParams.set("appname", "worldunderwater.org");
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("preset", "latest");
  url.searchParams.set(
    "fields[include][]",
    "id,name,description,status,glide,date,country,type,primary_type,url",
  );

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 1800 }, // 30 minutes
  });

  if (!response.ok) {
    throw new Error(
      `ReliefWeb API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: ReliefwebResponse = await response.json();

  return data.data.map((disaster) => normalizeReliefwebEvent(disaster));
}

function normalizeReliefwebEvent(disaster: ReliefwebDisaster): NormalizedEvent {
  const { fields } = disaster;
  const primaryCountry = fields.country[0];
  const location = primaryCountry?.location;

  return {
    sourceId: `reliefweb_${fields.id}`,
    source: "reliefweb",
    sourceUrl: fields.url || disaster.href,
    title: fields.name,
    description: fields.description?.slice(0, 500),
    disasterType: mapReliefwebType(
      fields.primary_type?.name || fields.type[0]?.name,
    ),
    severity: estimateSeverity(fields),
    location: {
      latitude: location?.lat || 0,
      longitude: location?.lon || 0,
      country: primaryCountry?.name,
      countryCode: primaryCountry?.iso3,
      coordinatesRaw: fields.country,
    },
    eventDate: new Date(fields.date.original || fields.date.created),
    rawPayload: disaster,
    payloadHash: hashPayload(disaster),
  };
}

function mapReliefwebType(typeName?: string): DisasterType {
  if (!typeName) return "storm";
  return RELIEFWEB_TYPE_MAP[typeName] || "storm";
}

function estimateSeverity(fields: ReliefwebDisaster["fields"]): Severity {
  // Check if GLIDE number indicates major event
  if (fields.glide) {
    // GLIDE format: XX-YYYY-NNNNNN-CCC
    // Could parse significance from the number
    return "moderate";
  }

  // Multi-country events are typically more severe
  if (fields.country.length > 3) return "catastrophic";
  if (fields.country.length > 1) return "severe";

  // Ongoing events
  if (fields.status === "ongoing") return "moderate";

  return "minor";
}

export async function fetchReliefwebReports(
  disasterType?: string,
  limit = 20,
): Promise<ReliefwebReport[]> {
  const url = new URL("https://api.reliefweb.int/v1/reports");
  url.searchParams.set("appname", "worldunderwater.org");
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("preset", "latest");

  if (disasterType) {
    url.searchParams.set("query[value]", disasterType);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 1800 },
  });

  if (!response.ok) {
    throw new Error(`ReliefWeb Reports API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

interface ReliefwebReport {
  id: number;
  fields: {
    title: string;
    body?: string;
    date: { created: string };
    source: Array<{ name: string }>;
    country: Array<{ name: string; iso3: string }>;
    disaster: Array<{ name: string }>;
  };
}

export function generateReliefwebSourceId(disasterId: number): string {
  return `reliefweb_${disasterId}`;
}

export function generateReliefwebContentHash(
  disaster: ReliefwebDisaster,
): string {
  const content = JSON.stringify({
    id: disaster.fields.id,
    status: disaster.fields.status,
    changed: disaster.fields.date.changed,
  });
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}
