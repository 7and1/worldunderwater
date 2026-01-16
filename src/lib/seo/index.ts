// SEO Module Entry Point
// Exports all SEO utilities for easy importing

// Metadata generation
export {
  siteConfig,
  generateSiteMetadata,
  generateArticleMetadata,
  generateProductMetadata,
  generateProductCategoryMetadata,
  generateDisasterMapMetadata,
  generateCanonicalUrl,
} from "./metadata";

// Structured data (JSON-LD)
export {
  generateWebsiteSchema,
  generateOrganizationSchema,
  generateNewsArticleSchema,
  generateProductSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateDisasterEventSchema,
} from "./structured-data";

// JsonLd component is now a separate client component
export { JsonLd } from "@/components/seo/JsonLd";

// Sitemap and RSS
export {
  generateSitemap,
  generateStaticSitemapEntries,
  generateArticleSitemapEntries,
  generateProductSitemapEntries,
  generateProductCategorySitemapEntries,
  generateDisasterSitemapEntries,
  generateRobotsTxt,
  generateRSSFeed,
} from "./sitemap";

// Editorial workflow
export {
  VALID_TRANSITIONS,
  isValidTransition,
  requiresHumanReview,
  getNextStatuses,
  STATUS_LABELS,
  STATUS_COLORS,
  SEO_REQUIREMENTS,
} from "./editorial-workflow";

// Validation
export {
  validateArticleSEO,
  validateProductSEO,
  validateJsonLd,
  generateSEOReport,
} from "./seo-validator";

// Canonical URL validation
export {
  validateCanonicalUrl,
  validateCanonicalUniqueness,
} from "./canonical-validator";

// Types
export type { EditorialStatus, EditorialTransition, FAQ } from "@/types";
