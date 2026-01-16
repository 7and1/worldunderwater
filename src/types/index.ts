// Core domain types for World Under Water

export type DisasterType =
  | "flood"
  | "hurricane"
  | "tsunami"
  | "wildfire"
  | "earthquake"
  | "tornado"
  | "drought"
  | "volcano"
  | "volcanic"
  | "landslide"
  | "storm"
  | "heat_wave"
  | "cold_wave";

export type SeverityLevel = "watch" | "warning" | "emergency" | "catastrophic";

export type EditorialStatus = "draft" | "review" | "approved" | "published";
export type EditorialTransition = {
  from: EditorialStatus;
  to: EditorialStatus;
  requiresHumanReview: boolean;
};

export interface GeoLocation {
  lat: number;
  lng: number;
  region: string;
  country: string;
  countryCode: string;
}

export interface DisasterEvent {
  id: string;
  type: DisasterType;
  title: string;
  description: string;
  severity: SeverityLevel;
  location: GeoLocation;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  source:
    | "nasa"
    | "usgs"
    | "noaa"
    | "aggregated"
    | "nasa_eonet"
    | "usgs_earthquake"
    | "reliefweb";
  sourceUrl: string;
  affectedPopulation?: number;
  thumbnailUrl?: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  disaster: DisasterEvent;
  featuredImage: {
    url: string;
    alt: string;
    caption?: string;
  };
  author: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: number;
  tags: string[];
  relatedProducts: Product[];
  seo: ArticleSEO;
  faqs?: FAQ[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface ArticleSEO {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImage: string;
  keywords: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  currency: string;
  affiliateUrl: string;
  affiliateProvider: "amazon" | "other";
  images: ProductImage[];
  category: ProductCategory;
  disasterTypes: DisasterType[];
  rating: number;
  reviewCount: number;
  features: string[];
  inStock: boolean;
  priority: number;
}

export interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export type ProductCategory =
  | "emergency-kits"
  | "water-safety"
  | "shelter"
  | "communication"
  | "first-aid"
  | "food-water"
  | "lighting"
  | "tools"
  | "water"
  | "food"
  | "power"
  | "clothing"
  | "navigation"
  | "safety";

export interface AlertBannerData {
  id: string;
  type: "breaking" | "urgent" | "update";
  message: string;
  link?: string;
  disaster?: DisasterEvent;
  expiresAt: string;
}

export interface MapMarker {
  id: string;
  disaster: DisasterEvent;
  position: [number, number];
  iconType: DisasterType;
}

export interface SiteMetadata {
  title: string;
  description: string;
  siteUrl: string;
  ogImage: string;
  twitterHandle: string;
}

export interface BreadcrumbItem {
  name: string;
  href?: string;
  current?: boolean;
}
