import type {
  Article,
  DisasterEvent,
  DisasterType,
  Product as UiProduct,
  SeverityLevel,
} from "@/types";
import type {
  PublishedArticle,
  RawEvent,
  Product as PayloadProduct,
  DisasterSeverity,
  DataSource,
} from "@/types/schema.types";
import { generateArticleThumbnail } from "@/lib/maps/thumbnail-generator";
import { siteConfig } from "@/lib/seo/metadata";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";

const SOURCE_MAP: Record<DataSource, DisasterEvent["source"]> = {
  nasa_eonet: "nasa_eonet",
  usgs_earthquake: "usgs_earthquake",
  reliefweb: "reliefweb",
};

const DISASTER_TYPE_MAP: Record<string, DisasterType> = {
  flood: "flood",
  wildfire: "wildfire",
  earthquake: "earthquake",
  tsunami: "tsunami",
  hurricane: "hurricane",
  tornado: "tornado",
  drought: "drought",
  volcanic: "volcanic",
  volcano: "volcanic",
  landslide: "landslide",
  storm: "storm",
  heat_wave: "heat_wave",
  cold_wave: "cold_wave",
};

function mapSeverity(severity?: DisasterSeverity): SeverityLevel {
  switch (severity) {
    case "catastrophic":
      return "catastrophic";
    case "severe":
      return "emergency";
    case "moderate":
      return "warning";
    case "minor":
    default:
      return "watch";
  }
}

function mapDisasterType(code?: string | { code?: string }): DisasterType {
  if (!code) return "storm";
  if (typeof code === "string") {
    return DISASTER_TYPE_MAP[code] || "storm";
  }
  return DISASTER_TYPE_MAP[code.code || ""] || "storm";
}

function mapSource(source?: DataSource): DisasterEvent["source"] {
  if (!source) return "aggregated";
  return SOURCE_MAP[source] || "aggregated";
}

export function mapRawEventToDisasterEvent(raw: RawEvent): DisasterEvent {
  const rawDisasterType =
    (raw as unknown as { disasterType?: { code?: string } }).disasterType
      ?.code ||
    (raw as unknown as { eventType?: string }).eventType ||
    (raw as unknown as { disasterTypeId?: string | number }).disasterTypeId;
  const disasterType = mapDisasterType(rawDisasterType as string | undefined);
  const latitude = raw.location?.latitude ?? 0;
  const longitude = raw.location?.longitude ?? 0;
  const thumbnailUrl = generateArticleThumbnail(
    disasterType,
    latitude,
    longitude,
  );

  return {
    id: raw.id,
    type: disasterType,
    title: raw.title || "Untitled Event",
    description: raw.description || "",
    severity: mapSeverity(raw.metrics?.severity),
    location: {
      lat: latitude,
      lng: longitude,
      region: raw.location?.name || "",
      country: raw.location?.countryCode || raw.location?.name || "",
      countryCode: raw.location?.countryCode || "",
    },
    startDate: raw.occurredAt ? new Date(raw.occurredAt).toISOString() : "",
    endDate: undefined,
    isActive: raw.status !== "archived",
    source: mapSource(raw.source),
    sourceUrl: raw.sourceUrl || "",
    affectedPopulation: undefined,
    thumbnailUrl,
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : "",
  };
}

function estimateReadingTime(content: string): number {
  const words = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function normalizeContent(content: unknown, excerpt?: string): string {
  if (typeof content === "string") return content;

  if (content && typeof content === "object" && "root" in content) {
    try {
      return convertLexicalToHTML({
        data: content as any,
        disableContainer: true,
      });
    } catch {
      // Fall through to fallback
    }
  }

  return `<p>${excerpt || "Coverage details are being prepared."}</p>`;
}

export function mapProductToUiProduct(product: PayloadProduct): UiProduct {
  const price = product.pricing?.priceCents
    ? product.pricing.priceCents / 100
    : 0;

  return {
    id: String(product.id),
    name: product.name,
    slug: product.slug || "",
    description: product.description || "",
    shortDescription: product.shortDescription || "",
    price,
    currency: product.pricing?.currency || "USD",
    affiliateUrl: product.affiliate?.url || "",
    affiliateProvider:
      product.affiliate?.network === "amazon" ? "amazon" : "other",
    images: [
      {
        url: product.image?.url || "/images/product-placeholder.png",
        alt: product.image?.alt || product.name,
        isPrimary: true,
      },
    ],
    category: (product.categories?.[0] as UiProduct["category"]) || "tools",
    disasterTypes:
      product.matchingDisasters?.map((match) =>
        mapDisasterType(
          typeof match.disasterType === "object"
            ? match.disasterType.code
            : undefined,
        ),
      ) || [],
    rating: 4.6,
    reviewCount: 1200,
    features: product.tags || [],
    inStock: product.status !== "out_of_stock",
    priority: product.priority || 50,
  };
}

export function mapPublishedArticleToArticle(
  article: PublishedArticle,
  rawEvent?: RawEvent,
  products: PayloadProduct[] = [],
): Article {
  const content = normalizeContent(
    article.content,
    article.excerpt || undefined,
  );

  const disasterEvent = rawEvent
    ? mapRawEventToDisasterEvent(rawEvent)
    : {
        id: article.id,
        type: mapDisasterType(
          typeof article.disasterType === "object"
            ? article.disasterType.code
            : undefined,
        ),
        title: article.title,
        description: article.excerpt || "",
        severity: "warning" as const,
        location: {
          lat: article.location?.latitude || 0,
          lng: article.location?.longitude || 0,
          region: article.location?.name || "",
          country: article.location?.name || "",
          countryCode: article.location?.countryCode || "",
        },
        startDate: article.publishedAt
          ? new Date(article.publishedAt).toISOString()
          : "",
        endDate: undefined,
        isActive: true,
        source: "aggregated" as const,
        sourceUrl: "",
        affectedPopulation: undefined,
        thumbnailUrl:
          article.seo?.ogImageUrl ||
          generateArticleThumbnail(
            mapDisasterType(
              typeof article.disasterType === "object"
                ? article.disasterType.code
                : undefined,
            ),
            article.location?.latitude || 0,
            article.location?.longitude || 0,
          ),
        updatedAt: article.updatedAt
          ? new Date(article.updatedAt).toISOString()
          : "",
      };

  const relatedProducts = products.map(mapProductToUiProduct);

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt || "",
    content,
    disaster: disasterEvent,
    featuredImage: {
      url:
        article.featuredImage?.url ||
        article.seo?.ogImageUrl ||
        "/og-default.png",
      alt: article.featuredImage?.alt || article.title,
      caption: undefined,
    },
    author: article.author?.name || "Editorial Team",
    publishedAt: article.publishedAt
      ? new Date(article.publishedAt).toISOString()
      : new Date(article.createdAt).toISOString(),
    updatedAt: article.updatedAt
      ? new Date(article.updatedAt).toISOString()
      : new Date(article.createdAt).toISOString(),
    readingTime: estimateReadingTime(content),
    tags: article.tags || [],
    relatedProducts,
    seo: {
      metaTitle: article.seo?.metaTitle || article.title,
      metaDescription: article.seo?.metaDescription || article.excerpt || "",
      canonicalUrl:
        article.seo?.canonicalUrl ||
        `${siteConfig.siteUrl}/article/${article.slug}`,
      ogImage:
        article.seo?.ogImageUrl ||
        article.featuredImage?.url ||
        "/og-default.png",
      keywords: article.seo?.keywords || [],
    },
  };
}
