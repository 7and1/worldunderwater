// TypeScript types generated from database schema
// For use in application code

export type DataSource = "nasa_eonet" | "usgs_earthquake" | "reliefweb";
export type EventStatus =
  | "new"
  | "processing"
  | "processed"
  | "archived"
  | "error";
export type DisasterSeverity = "minor" | "moderate" | "severe" | "catastrophic";
export type ArticleStatus =
  | "draft"
  | "review"
  | "scheduled"
  | "published"
  | "archived";
export type ContentType = "news" | "guide" | "analysis" | "alert" | "update";
export type ProductStatus = "active" | "inactive" | "out_of_stock";
export type IngestionStatus =
  | "started"
  | "success"
  | "partial"
  | "error"
  | "rate_limited";

export interface DisasterType {
  id: number;
  code: string;
  name: string;
  description?: string;
  iconUrl?: string;
  colorHex?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RawEvent {
  id: string; // UUID
  source: DataSource;
  sourceId: string;
  sourceUrl?: string;
  rawPayload: Record<string, unknown>;
  payloadHash: string;
  eventType?: string;
  disasterTypeId?: number;
  title?: string;
  description?: string;
  location: {
    latitude?: number;
    longitude?: number;
    name?: string;
    countryCode?: string;
    coordinatesRaw?: Record<string, unknown>;
  };
  occurredAt?: Date;
  reportedAt?: Date;
  metrics: {
    magnitude?: number;
    severity?: DisasterSeverity;
    affectedAreaKm2?: number;
  };
  status: EventStatus;
  articleGenerated: boolean;
  processingErrors?: Record<string, unknown>;
  ingestedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: number;
  sku?: string;
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  affiliate: {
    url: string;
    network?: "amazon" | "shareasale" | "cj" | "impact" | "other";
    affiliateId?: string;
  };
  image: {
    url?: string;
    alt?: string;
  };
  galleryUrls?: { url: string }[];
  pricing: {
    priceCents?: number;
    currency: "USD" | "EUR" | "GBP";
    priceUpdatedAt?: Date;
  };
  categories: ProductCategory[];
  tags?: string[];
  brand?: string;
  matchingDisasters: {
    disasterType: number | DisasterType;
    relevanceScore: number;
    isEssential: boolean;
    displayOrder: number;
  }[];
  status: ProductStatus;
  priority: number;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type ProductCategory =
  | "water"
  | "food"
  | "shelter"
  | "first-aid"
  | "communication"
  | "power"
  | "tools"
  | "clothing"
  | "navigation"
  | "safety";

export interface PublishedArticle {
  id: string; // UUID
  title: string;
  slug: string;
  excerpt?: string;
  content: unknown; // Rich text content
  contentFormat: "html" | "markdown" | "mdx";
  disasterType?: number | DisasterType;
  contentType: ContentType;
  tags?: string[];
  sources: {
    primaryEvent?: string | RawEvent;
    rawEvents?: (string | RawEvent)[];
    attribution?: string;
  };
  aiMetadata: {
    model?: string;
    promptVersion?: string;
    generationParams?: Record<string, unknown>;
    humanEdited: boolean;
    editNotes?: string;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    ogImageUrl?: string;
    canonicalUrl?: string;
    keywords?: string[];
  };
  featuredImage: {
    url?: string;
    alt?: string;
  };
  mediaGallery?: Record<string, unknown>[];
  location: {
    name?: string;
    countryCode?: string;
    latitude?: number;
    longitude?: number;
  };
  products: {
    product: number | Product;
    displayOrder: number;
    contextNote?: string;
  }[];
  status: ArticleStatus;
  publishedAt?: Date;
  scheduledFor?: Date;
  expiresAt?: Date;
  engagement: {
    viewCount: number;
    shareCount: number;
  };
  author: {
    id?: number;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IngestionLog {
  id: number;
  source: DataSource;
  jobId?: string;
  status: IngestionStatus;
  request: {
    endpointUrl?: string;
    params?: Record<string, unknown>;
  };
  results: {
    eventsFound: number;
    eventsNew: number;
    eventsUpdated: number;
    eventsSkipped: number;
  };
  timing: {
    startedAt?: Date;
    completedAt?: Date;
    durationMs?: number;
  };
  error?: {
    code?: string;
    retryCount: number;
    message?: string;
    details?: Record<string, unknown>;
  };
  rateLimit?: {
    remaining?: number;
    resetAt?: Date;
  };
  response?: {
    sizeBytes?: number;
    headers?: Record<string, unknown>;
  };
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types for Data Sources

export interface NasaEonetEvent {
  id: string;
  title: string;
  description?: string;
  link: string;
  categories: { id: string; title: string }[];
  sources: { id: string; url: string }[];
  geometry: {
    date: string;
    type: string;
    coordinates: [number, number];
  }[];
}

export interface UsgsEarthquake {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    url: string;
    detail: string;
    felt?: number;
    tsunami: number;
    sig: number;
    type: string;
    title: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number, number];
  };
}

export interface ReliefWebReport {
  id: number;
  fields: {
    title: string;
    body?: string;
    date: { original: string };
    country: { name: string; iso3: string }[];
    disaster?: { name: string; type: { name: string }[] }[];
    source: { name: string }[];
    url: string;
  };
}
