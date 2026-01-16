import "server-only";
import { safeFind } from "@/lib/data/payload";
import {
  mapPublishedArticleToArticle,
  mapProductToUiProduct,
  mapRawEventToDisasterEvent,
} from "@/lib/data/transformers";
import type { Article, DisasterEvent, Product } from "@/types";
import type {
  PublishedArticle,
  RawEvent,
  Product as PayloadProduct,
} from "@/types/schema.types";

// P1-2: Cache for product categories to avoid repeated queries
let categoriesCache: string[] | null = null;
let categoriesCacheTime = 0;
const CATEGORIES_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function getRecentDisasters(limit = 50): Promise<DisasterEvent[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const rawEvents = await safeFind<RawEvent>({
    collection: "raw-events",
    depth: 1,
    limit,
    sort: "-occurredAt",
    where: {
      occurredAt: { greater_than: since },
      status: { not_equals: "archived" },
    },
  });

  return rawEvents.map(mapRawEventToDisasterEvent);
}

export async function getDisasterById(
  id: string,
): Promise<DisasterEvent | null> {
  const rawEvents = await safeFind<RawEvent>({
    collection: "raw-events",
    depth: 1,
    limit: 1,
    where: {
      id: { equals: id },
    },
  });

  if (rawEvents.length === 0) return null;
  return mapRawEventToDisasterEvent(rawEvents[0]);
}

export async function getFeaturedDisaster(): Promise<DisasterEvent | null> {
  const disasters = await getRecentDisasters(10);
  return disasters[0] || null;
}

/**
 * P1-2: Optimized article fetching with eager loading
 * Uses depth: 2 to fetch related data (events, products) in a single query
 * This prevents N+1 queries by leveraging Payload's populate feature
 */
export async function getLatestArticles(limit = 6): Promise<Article[]> {
  // P1-2: Single query with depth=2 fetches all related data (events, products)
  // This is Payload CMS's equivalent of GraphQL field selection/batch loading
  const articles = await safeFind<PublishedArticle>({
    collection: "published-articles",
    depth: 2, // Eager load relationships to prevent N+1 queries
    limit,
    sort: "-publishedAt",
    where: {
      status: { equals: "published" },
    },
  });

  // P1-2: Data is already loaded, just map it
  return articles.map((article) => {
    const rawEvent =
      typeof article.sources?.primaryEvent === "object"
        ? (article.sources.primaryEvent as RawEvent)
        : undefined;
    const products = (article.products || [])
      .map((item) =>
        typeof item.product === "object"
          ? (item.product as PayloadProduct)
          : null,
      )
      .filter(Boolean) as PayloadProduct[];
    return mapPublishedArticleToArticle(article, rawEvent, products);
  });
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articles = await safeFind<PublishedArticle>({
    collection: "published-articles",
    depth: 2,
    limit: 1,
    where: {
      slug: { equals: slug },
      status: { equals: "published" },
    },
  });

  if (articles.length === 0) return null;
  const article = articles[0];
  const rawEvent =
    typeof article.sources?.primaryEvent === "object"
      ? (article.sources.primaryEvent as RawEvent)
      : undefined;
  const products = (article.products || [])
    .map((item) =>
      typeof item.product === "object"
        ? (item.product as PayloadProduct)
        : null,
    )
    .filter(Boolean) as PayloadProduct[];

  return mapPublishedArticleToArticle(article, rawEvent, products);
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const products = await safeFind<PayloadProduct>({
    collection: "products",
    depth: 1,
    limit,
    sort: "-priority",
    where: {
      status: { equals: "active" },
    },
  });

  return products.map(mapProductToUiProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await safeFind<PayloadProduct>({
    collection: "products",
    depth: 1,
    limit: 1,
    where: {
      slug: { equals: slug },
      status: { equals: "active" },
    },
  });

  if (products.length === 0) return null;
  return mapProductToUiProduct(products[0]);
}

export async function getProductsByCategory(
  category: string,
  limit = 30,
): Promise<Product[]> {
  const products = await safeFind<PayloadProduct>({
    collection: "products",
    depth: 1,
    limit,
    sort: "-priority",
    where: {
      categories: { contains: category },
      status: { equals: "active" },
    },
  });

  return products.map(mapProductToUiProduct);
}

/**
 * P1-2: Optimized product categories with in-memory caching
 * Categories rarely change, so cache for 30 minutes
 */
export async function getProductCategories(): Promise<string[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (categoriesCache && now - categoriesCacheTime < CATEGORIES_CACHE_TTL) {
    return categoriesCache;
  }

  const products = await safeFind<PayloadProduct>({
    collection: "products",
    depth: 0,
    limit: 200,
    where: {
      status: { equals: "active" },
    },
  });

  const categories = new Set<string>();
  for (const product of products) {
    for (const category of product.categories || []) {
      categories.add(category);
    }
  }

  // Update cache
  categoriesCache = Array.from(categories);
  categoriesCacheTime = now;

  return categoriesCache;
}

/**
 * P1-2: Clear categories cache (call after product updates)
 */
export function clearCategoriesCache(): void {
  categoriesCache = null;
  categoriesCacheTime = 0;
}

/**
 * Get articles filtered by disaster type
 */
export async function getArticlesByDisasterType(
  disasterType: string,
  limit = 6,
): Promise<Article[]> {
  // First get disasters of this type
  const disasters = await safeFind<RawEvent>({
    collection: "raw-events",
    depth: 0,
    limit: 50,
    where: {
      type: { equals: disasterType as any },
      status: { not_equals: "archived" },
    },
  });

  const disasterIds = disasters.map((d) => d.id);

  if (disasterIds.length === 0) return [];

  // Then get articles linked to these disasters
  const articles = await safeFind<PublishedArticle>({
    collection: "published-articles",
    depth: 2,
    limit,
    sort: "-publishedAt",
    where: {
      and: [
        { status: { equals: "published" } },
        {
          or: disasterIds.map((id) => ({
            "sources.primaryEvent": { equals: id },
          })),
        },
      ],
    },
  });

  return articles.map((article) => {
    const rawEvent =
      typeof article.sources?.primaryEvent === "object"
        ? (article.sources.primaryEvent as RawEvent)
        : undefined;
    const products = (article.products || [])
      .map((item) =>
        typeof item.product === "object"
          ? (item.product as PayloadProduct)
          : null,
      )
      .filter(Boolean) as PayloadProduct[];
    return mapPublishedArticleToArticle(article, rawEvent, products);
  });
}

/**
 * Get products filtered by disaster type
 */
export async function getProductsByDisasterType(
  disasterType: string,
  limit = 6,
): Promise<Product[]> {
  // Map disaster types to product categories
  const disasterToCategoryMap: Record<string, string[]> = {
    flood: ["water-safety", "shelter", "first-aid"],
    hurricane: ["shelter", "communication", "emergency-kits"],
    tsunami: ["water-safety", "emergency-kits", "communication"],
    wildfire: ["shelter", "first-aid", "emergency-kits"],
    earthquake: ["shelter", "emergency-kits", "first-aid"],
    tornado: ["shelter", "emergency-kits", "communication"],
    drought: ["water-safety", "food-water"],
    volcano: ["shelter", "emergency-kits", "water-safety"],
    volcanic: ["shelter", "emergency-kits", "water-safety"],
    landslide: ["shelter", "emergency-kits", "tools"],
    storm: ["shelter", "emergency-kits", "communication"],
    heat_wave: ["water-safety", "food-water"],
    cold_wave: ["shelter", "emergency-kits", "clothing"],
  };

  const categories = disasterToCategoryMap[disasterType] || [];

  if (categories.length === 0) return [];

  // Get products from all relevant categories
  const products = await safeFind<PayloadProduct>({
    collection: "products",
    depth: 1,
    limit,
    sort: "-priority",
    where: {
      and: [
        { status: { equals: "active" } },
        {
          or: categories.map((cat) => ({
            categories: { contains: cat },
          })),
        },
      ],
    },
  });

  return products.map(mapProductToUiProduct);
}
