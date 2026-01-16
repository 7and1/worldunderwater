// Data source types

export type DataSource =
  | "nasa_eonet"
  | "usgs_earthquake"
  | "reliefweb"
  | "openweathermap";

export type DisasterType =
  | "flood"
  | "wildfire"
  | "earthquake"
  | "tsunami"
  | "hurricane"
  | "tornado"
  | "drought"
  | "volcanic"
  | "landslide"
  | "storm"
  | "heat_wave"
  | "cold_wave";

export type Severity = "minor" | "moderate" | "severe" | "catastrophic";

export type EventStatus =
  | "new"
  | "processing"
  | "processed"
  | "archived"
  | "error";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location extends Coordinates {
  locality?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  coordinatesRaw?: unknown;
}

export interface NormalizedEvent {
  sourceId: string;
  source: DataSource;
  sourceUrl?: string;
  title: string;
  description?: string;
  disasterType: DisasterType;
  severity: Severity;
  magnitude?: number;
  location: Location;
  eventDate: Date;
  rawPayload: unknown;
  payloadHash?: string;
}

export interface DataSourceConfig {
  name: string;
  baseUrl: string;
  endpoints: Record<string, string>;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay?: number;
  };
  pollingIntervalMs: number;
  requiresAuth: boolean;
}

export interface IngestionResult {
  source: DataSource;
  status: "success" | "partial" | "error" | "rate_limited";
  eventsFound: number;
  eventsNew: number;
  eventsUpdated: number;
  eventsSkipped: number;
  durationMs: number;
  error?: string;
}
