import type { DisasterType, Severity } from "../data-sources/types";

/**
 * Significance Filter Layer
 *
 * Prevents thin content generation and controls API costs by filtering
 * events based on their newsworthiness and SEO value.
 *
 * Decision matrix:
 * - FULL_ARTICLE: Generate complete SEO article with product recommendations
 * - LIST_ONLY: Display in event list/map, no article generation
 * - DISCARD: Ignore completely (too minor or duplicate)
 */

export type ContentDecision = "FULL_ARTICLE" | "LIST_ONLY" | "DISCARD";

export interface SignificanceResult {
  decision: ContentDecision;
  score: number; // 0-100
  reasons: string[];
  suggestedAction?: string;
}

export interface EventForFiltering {
  disasterType: DisasterType;
  severity: Severity;
  magnitude?: number; // For earthquakes
  affectedPopulation?: number;
  affectedCountries?: number;
  isCapitalCity?: boolean;
  isMetroArea?: boolean; // Population > 1M
  hasDeaths?: boolean;
  hasEvacuations?: boolean;
  mediaAttention?: boolean; // Referenced in major news
  location: {
    latitude: number;
    longitude: number;
    locality?: string;
    country?: string;
  };
}

// Thresholds for article generation
const THRESHOLDS = {
  earthquake: {
    minMagnitude: 5.0, // Below this = LIST_ONLY
    majorMagnitude: 6.5, // Above this = always FULL_ARTICLE
    populatedAreaMagnitude: 4.5, // Lower threshold for metro areas
  },
  flood: {
    minSeverity: ["moderate", "severe", "catastrophic"] as Severity[],
  },
  wildfire: {
    minSeverity: ["moderate", "severe", "catastrophic"] as Severity[],
  },
  hurricane: {
    // All hurricanes are significant
    minSeverity: ["minor", "moderate", "severe", "catastrophic"] as Severity[],
  },
  tsunami: {
    // All tsunamis are significant
    minSeverity: ["minor", "moderate", "severe", "catastrophic"] as Severity[],
  },
  tornado: {
    minSeverity: ["moderate", "severe", "catastrophic"] as Severity[],
  },
  volcanic: {
    minSeverity: ["moderate", "severe", "catastrophic"] as Severity[],
  },
  drought: {
    minSeverity: ["severe", "catastrophic"] as Severity[], // Droughts need higher threshold
  },
  landslide: {
    minSeverity: ["moderate", "severe", "catastrophic"] as Severity[],
  },
  storm: {
    minSeverity: ["moderate", "severe", "catastrophic"] as Severity[],
  },
  heat_wave: {
    minSeverity: ["severe", "catastrophic"] as Severity[],
  },
  cold_wave: {
    minSeverity: ["severe", "catastrophic"] as Severity[],
  },
};

// Major metropolitan areas (simplified - in production, use PostGIS population data)
const MAJOR_METROS = [
  { name: "Tokyo", lat: 35.6762, lon: 139.6503, radius: 50 },
  { name: "New York", lat: 40.7128, lon: -74.006, radius: 50 },
  { name: "Los Angeles", lat: 34.0522, lon: -118.2437, radius: 50 },
  { name: "London", lat: 51.5074, lon: -0.1278, radius: 40 },
  { name: "Paris", lat: 48.8566, lon: 2.3522, radius: 30 },
  { name: "Beijing", lat: 39.9042, lon: 116.4074, radius: 50 },
  { name: "Shanghai", lat: 31.2304, lon: 121.4737, radius: 50 },
  { name: "Mumbai", lat: 19.076, lon: 72.8777, radius: 40 },
  { name: "São Paulo", lat: -23.5505, lon: -46.6333, radius: 50 },
  { name: "Mexico City", lat: 19.4326, lon: -99.1332, radius: 40 },
  { name: "Jakarta", lat: -6.2088, lon: 106.8456, radius: 40 },
  { name: "Manila", lat: 14.5995, lon: 120.9842, radius: 30 },
  { name: "Seoul", lat: 37.5665, lon: 126.978, radius: 30 },
  { name: "Hong Kong", lat: 22.3193, lon: 114.1694, radius: 20 },
  { name: "Singapore", lat: 1.3521, lon: 103.8198, radius: 20 },
  { name: "San Francisco", lat: 37.7749, lon: -122.4194, radius: 40 },
  { name: "Miami", lat: 25.7617, lon: -80.1918, radius: 40 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093, radius: 40 },
  { name: "Bangkok", lat: 13.7563, lon: 100.5018, radius: 30 },
  { name: "Istanbul", lat: 41.0082, lon: 28.9784, radius: 40 },
];

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if location is near a major metropolitan area
 */
function isNearMajorMetro(lat: number, lon: number): string | null {
  for (const metro of MAJOR_METROS) {
    const distance = calculateDistance(lat, lon, metro.lat, metro.lon);
    if (distance <= metro.radius) {
      return metro.name;
    }
  }
  return null;
}

/**
 * Evaluate earthquake significance
 */
function evaluateEarthquake(event: EventForFiltering): SignificanceResult {
  const reasons: string[] = [];
  let score = 0;
  const magnitude = event.magnitude || 0;

  // Base score from magnitude
  if (magnitude >= 7.0) {
    score = 100;
    reasons.push(`Major earthquake (M${magnitude})`);
  } else if (magnitude >= 6.5) {
    score = 90;
    reasons.push(`Strong earthquake (M${magnitude})`);
  } else if (magnitude >= 6.0) {
    score = 75;
    reasons.push(`Moderate-strong earthquake (M${magnitude})`);
  } else if (magnitude >= 5.5) {
    score = 60;
    reasons.push(`Moderate earthquake (M${magnitude})`);
  } else if (magnitude >= 5.0) {
    score = 45;
    reasons.push(`Light-moderate earthquake (M${magnitude})`);
  } else if (magnitude >= 4.5) {
    score = 30;
    reasons.push(`Light earthquake (M${magnitude})`);
  } else {
    score = 10;
    reasons.push(`Minor earthquake (M${magnitude})`);
  }

  // Location modifiers
  const nearMetro = isNearMajorMetro(
    event.location.latitude,
    event.location.longitude,
  );
  if (nearMetro) {
    score += 20;
    reasons.push(`Near major metropolitan area: ${nearMetro}`);
  }

  // Impact modifiers
  if (event.hasDeaths) {
    score += 30;
    reasons.push("Fatalities reported");
  }
  if (event.hasEvacuations) {
    score += 15;
    reasons.push("Evacuations ordered");
  }
  if (event.affectedPopulation && event.affectedPopulation > 100000) {
    score += 20;
    reasons.push(
      `Large affected population: ${event.affectedPopulation.toLocaleString()}`,
    );
  }

  // Determine decision
  score = Math.min(100, score);
  let decision: ContentDecision;

  if (score >= 50) {
    decision = "FULL_ARTICLE";
  } else if (score >= 25) {
    decision = "LIST_ONLY";
  } else {
    decision = "DISCARD";
  }

  return {
    decision,
    score,
    reasons,
    suggestedAction:
      decision === "LIST_ONLY"
        ? "Display on map/list without generating article"
        : undefined,
  };
}

/**
 * Evaluate general disaster significance based on severity
 */
function evaluateBySeverity(
  event: EventForFiltering,
  minSeverities: Severity[],
): SignificanceResult {
  const reasons: string[] = [];
  let score = 0;

  // Severity scoring
  const severityScores: Record<Severity, number> = {
    minor: 20,
    moderate: 50,
    severe: 75,
    catastrophic: 100,
  };

  score = severityScores[event.severity];
  reasons.push(`Severity: ${event.severity}`);

  // Location modifiers
  const nearMetro = isNearMajorMetro(
    event.location.latitude,
    event.location.longitude,
  );
  if (nearMetro) {
    score += 15;
    reasons.push(`Near major metropolitan area: ${nearMetro}`);
  }

  // Multi-country events are more significant
  if (event.affectedCountries && event.affectedCountries > 1) {
    score += 20;
    reasons.push(`Multi-country event: ${event.affectedCountries} countries`);
  }

  // Impact modifiers
  if (event.hasDeaths) {
    score += 25;
    reasons.push("Fatalities reported");
  }
  if (event.hasEvacuations) {
    score += 10;
    reasons.push("Evacuations ordered");
  }

  score = Math.min(100, score);

  // Check if severity meets minimum threshold
  const meetsThreshold = minSeverities.includes(event.severity);
  let decision: ContentDecision;

  if (meetsThreshold && score >= 45) {
    decision = "FULL_ARTICLE";
  } else if (score >= 30) {
    decision = "LIST_ONLY";
  } else {
    decision = "DISCARD";
  }

  return {
    decision,
    score,
    reasons,
    suggestedAction:
      decision === "LIST_ONLY"
        ? "Display on map/list without generating article"
        : undefined,
  };
}

/**
 * Main significance filter function
 *
 * Evaluates an event and returns a decision on whether to:
 * - Generate a full SEO article (FULL_ARTICLE)
 * - Display in lists/maps only (LIST_ONLY)
 * - Discard completely (DISCARD)
 */
export function evaluateSignificance(
  event: EventForFiltering,
): SignificanceResult {
  switch (event.disasterType) {
    case "earthquake":
      return evaluateEarthquake(event);

    case "tsunami":
    case "hurricane":
      // Always significant - generate article for any severity
      return {
        decision: "FULL_ARTICLE",
        score: 80,
        reasons: [`${event.disasterType} events are always newsworthy`],
      };

    case "flood":
      return evaluateBySeverity(event, THRESHOLDS.flood.minSeverity);

    case "wildfire":
      return evaluateBySeverity(event, THRESHOLDS.wildfire.minSeverity);

    case "tornado":
      return evaluateBySeverity(event, THRESHOLDS.tornado.minSeverity);

    case "volcanic":
      return evaluateBySeverity(event, THRESHOLDS.volcanic.minSeverity);

    case "drought":
      return evaluateBySeverity(event, THRESHOLDS.drought.minSeverity);

    case "landslide":
      return evaluateBySeverity(event, THRESHOLDS.landslide.minSeverity);

    case "storm":
      return evaluateBySeverity(event, THRESHOLDS.storm.minSeverity);

    case "heat_wave":
      return evaluateBySeverity(event, THRESHOLDS.heat_wave.minSeverity);

    case "cold_wave":
      return evaluateBySeverity(event, THRESHOLDS.cold_wave.minSeverity);

    default:
      // Unknown disaster type - be conservative
      return evaluateBySeverity(event, ["moderate", "severe", "catastrophic"]);
  }
}

/**
 * Batch filter for multiple events
 * Returns only events that should have articles generated
 */
export function filterForArticleGeneration(
  events: EventForFiltering[],
): Array<EventForFiltering & { significanceResult: SignificanceResult }> {
  return events
    .map((event) => ({
      ...event,
      significanceResult: evaluateSignificance(event),
    }))
    .filter((event) => event.significanceResult.decision === "FULL_ARTICLE");
}

/**
 * Get statistics on filtered events
 */
export function getFilterStats(events: EventForFiltering[]): {
  total: number;
  fullArticle: number;
  listOnly: number;
  discarded: number;
  estimatedApiCalls: number;
  estimatedCostSavings: number; // Assuming $0.03 per article generation
} {
  const results = events.map((e) => evaluateSignificance(e));

  const fullArticle = results.filter(
    (r) => r.decision === "FULL_ARTICLE",
  ).length;
  const listOnly = results.filter((r) => r.decision === "LIST_ONLY").length;
  const discarded = results.filter((r) => r.decision === "DISCARD").length;

  return {
    total: events.length,
    fullArticle,
    listOnly,
    discarded,
    estimatedApiCalls: fullArticle,
    estimatedCostSavings: (listOnly + discarded) * 0.03,
  };
}
