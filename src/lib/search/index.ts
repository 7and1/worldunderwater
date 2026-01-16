import "server-only";
import { cacheStore } from "@/lib/cache";
import { safeFind } from "@/lib/data/payload";
import type {
  PublishedArticle,
  RawEvent,
  Product as PayloadProduct,
} from "@/types/schema.types";
import type {
  SearchResult,
  SearchResultType,
  SearchIndexEntry,
  ArticleSearchResult,
  ProductSearchResult,
  DisasterSearchResult,
} from "@/types/search.types";
import type { SearchFilters } from "@/types/search.types";

const INDEX_CACHE_TTL = 15 * 60;
const INDEX_KEY_PREFIX = "search:index:";

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&[^;]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function calculateScore(
  query: string,
  title: string,
  description: string,
  content: string | undefined,
): number {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const cleanTitle = title.toLowerCase();
  const cleanDesc = description.toLowerCase();
  const cleanContent = content ? cleanText(content) : "";

  let score = 0;

  for (const term of terms) {
    if (cleanTitle === term) score += 100;
    else if (cleanTitle.startsWith(term)) score += 50;
    else if (cleanTitle.includes(term)) score += 25;
    if (cleanDesc.includes(term)) score += 10;
    if (cleanContent.includes(term)) score += 5;
  }

  return score;
}

function highlightMatches(text: string, query: string, maxLen = 150): string {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const cleanTextLower = text.toLowerCase();

  let firstIndex = -1;
  for (const term of terms) {
    const idx = cleanTextLower.indexOf(term);
    if (idx !== -1 && (firstIndex === -1 || idx < firstIndex)) {
      firstIndex = idx;
    }
  }

  if (firstIndex === -1) {
    return text.length > maxLen ? text.substring(0, maxLen) + "..." : text;
  }

  const contextStart = Math.max(0, firstIndex - 40);
  const contextEnd = Math.min(text.length, firstIndex + maxLen - 40);
  let excerpt = text.substring(contextStart, contextEnd);

  if (contextStart > 0) excerpt = "..." + excerpt;
  if (contextEnd < text.length) excerpt = excerpt + "...";

  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\\\$&");
    const regex = new RegExp("(" + escaped + ")", "gi");
    excerpt = excerpt.replace(
      regex,
      '<mark class=\\"bg-ocean-500/30 text-foam-100 rounded px-0.5\\">$1</mark>',
    );
  }

  return excerpt;
}

async function getIndex(collection: string): Promise<SearchIndexEntry[]> {
  const cacheKey = INDEX_KEY_PREFIX + collection;
  const cached = cacheStore.get<SearchIndexEntry[]>(cacheKey);
  if (cached) return cached;

  let entries: SearchIndexEntry[] = [];
  const now = Date.now();

  if (collection === "articles") {
    const articles = await safeFind<PublishedArticle>({
      collection: "published-articles",
      depth: 0,
      limit: 500,
      where: { status: { equals: "published" } },
    });

    entries = articles.map((a) => ({
      id: a.id,
      type: "article" as const,
      title: a.title,
      description: a.excerpt || "",
      content: typeof a.content === "string" ? a.content : "",
      url: "/article/" + a.slug,
      metadata: {
        publishedAt: a.publishedAt?.toISOString(),
        tags: a.tags,
        thumbnailUrl: a.featuredImage?.url,
      },
      indexedAt: now,
    }));
  } else if (collection === "products") {
    const products = await safeFind<PayloadProduct>({
      collection: "products",
      depth: 0,
      limit: 500,
      where: { status: { equals: "active" } },
    });

    entries = products.map((p) => ({
      id: String(p.id),
      type: "product" as const,
      title: p.name,
      description: p.shortDescription || p.description || "",
      content: p.description || "",
      url: "/products/" + p.slug,
      metadata: {
        price: p.pricing?.priceCents,
        currency: p.pricing?.currency,
        categories: p.categories,
        thumbnailUrl: p.image?.url,
        inStock: p.status !== "out_of_stock",
      },
      indexedAt: now,
    }));
  } else if (collection === "disasters") {
    const disasters = await safeFind<RawEvent>({
      collection: "raw-events",
      depth: 0,
      limit: 500,
      where: { status: { not_equals: "archived" } },
    });

    entries = disasters.map((d) => {
      const rawType = (d as { disasterType?: { code?: string } }).disasterType
        ?.code;
      const disasterType = rawType || d.eventType || "storm";

      return {
        id: d.id,
        type: "disaster" as const,
        title: d.title || "Untitled Event",
        description: d.description || "",
        content: d.description || "",
        url: "/disasters/" + d.id,
        metadata: {
          disasterType,
          severity: d.metrics?.severity,
          location: d.location?.name,
          occurredAt: d.occurredAt?.toISOString(),
          isActive: d.status !== "archived",
        },
        indexedAt: now,
      };
    });
  }

  cacheStore.set(cacheKey, entries, INDEX_CACHE_TTL);
  return entries;
}

export function clearSearchIndex(collection?: string): void {
  if (collection) {
    cacheStore.delete(INDEX_KEY_PREFIX + collection);
  } else {
    const stats = cacheStore.getStats();
    for (const k of stats.keys) {
      if (k.startsWith(INDEX_KEY_PREFIX)) {
        cacheStore.delete(k);
      }
    }
  }
}

export async function search(
  query: string,
  filters: SearchFilters = {},
  page = 1,
  limit = 20,
): Promise<{ results: SearchResult[]; total: number; suggestions: string[] }> {
  if (!query.trim()) {
    return { results: [], total: 0, suggestions: [] };
  }

  const typesToSearch = filters.types || ["article", "product", "disaster"];

  const indices = await Promise.all(
    typesToSearch.map((type) => {
      if (type === "article") return getIndex("articles");
      if (type === "product") return getIndex("products");
      if (type === "disaster") return getIndex("disasters");
      return Promise.resolve([]);
    }),
  );

  const allEntries = indices.flat();
  let scored: Array<SearchIndexEntry & { score: number }> = [];

  for (const entry of allEntries) {
    const score = calculateScore(
      query,
      entry.title,
      entry.description,
      entry.content,
    );
    if (score > 0) {
      scored.push({ ...entry, score });
    }
  }

  if (filters.disasterTypes?.length || filters.productCategories?.length) {
    scored = scored.filter((entry) => {
      if (entry.type === "disaster" && filters.disasterTypes?.length) {
        const dt = (entry.metadata as { disasterType?: string }).disasterType;
        return filters.disasterTypes.includes(dt || "");
      }
      if (entry.type === "product" && filters.productCategories?.length) {
        const cats =
          (entry.metadata as { categories?: string[] }).categories || [];
        return filters.productCategories.some((c) => cats.includes(c));
      }
      return true;
    });
  }

  if (filters.dateFrom || filters.dateTo) {
    scored = scored.filter((entry) => {
      const pub = (entry.metadata as { publishedAt?: string }).publishedAt;
      const occ = (entry.metadata as { occurredAt?: string }).occurredAt;
      const ds = pub || occ;
      if (!ds) return true;
      const d = new Date(ds);
      if (filters.dateFrom && d < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && d > new Date(filters.dateTo)) return false;
      return true;
    });
  }

  scored.sort((a, b) => b.score - a.score);

  const total = scored.length;
  const start = (page - 1) * limit;
  const paginated = scored.slice(start, start + limit);

  const results: SearchResult[] = paginated.map((entry) => {
    const base = {
      id: entry.id,
      type: entry.type,
      title: entry.title,
      description: entry.description,
      url: entry.url,
      score: entry.score,
      highlightedTitle: highlightMatches(entry.title, query, 100),
      highlightedDescription: highlightMatches(entry.description, query),
    };

    // Add type-specific fields from metadata
    if (entry.type === "disaster") {
      return {
        ...base,
        disasterType: (entry.metadata as any).disasterType || "unknown",
        severity: (entry.metadata as any).severity,
        location: (entry.metadata as any).location,
        startDate: (entry.metadata as any).startDate,
        isActive: (entry.metadata as any).isActive,
      } as DisasterSearchResult;
    } else if (entry.type === "article") {
      return {
        ...base,
        publishedAt: (entry.metadata as any).publishedAt,
        readingTime: (entry.metadata as any).readingTime,
        thumbnailUrl: (entry.metadata as any).thumbnailUrl,
        tags: (entry.metadata as any).tags,
      } as ArticleSearchResult;
    } else if (entry.type === "product") {
      return {
        ...base,
        price: (entry.metadata as any).price,
        currency: (entry.metadata as any).currency,
        category: (entry.metadata as any).category,
        thumbnailUrl: (entry.metadata as any).thumbnailUrl,
        inStock: (entry.metadata as any).inStock,
      } as ProductSearchResult;
    }
    return base as SearchResult;
  }) as SearchResult[];

  const suggestions = generateSuggestions(query, allEntries);

  return { results, total, suggestions };
}

function generateSuggestions(
  query: string,
  entries: SearchIndexEntry[],
): string[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const suggestions = new Set<string>();

  for (const entry of entries) {
    const words = entry.title.toLowerCase().split(/\s+/);
    for (const w of words) {
      if (w.length > 3 && terms.some((t) => w.startsWith(t) && w !== t)) {
        suggestions.add(w);
      }
    }
  }

  return Array.from(suggestions).slice(0, 5);
}

export async function quickSearch(
  query: string,
  types?: SearchResultType[],
): Promise<SearchResult[]> {
  const { results } = await search(query, { types }, 1, 5);
  return results;
}

export async function getSearchSuggestions(query: string): Promise<string[]> {
  if (query.length < 2) return [];

  const allIndices = await Promise.all([
    getIndex("articles"),
    getIndex("products"),
    getIndex("disasters"),
  ]);

  const allEntries = allIndices.flat();
  return generateSuggestions(query, allEntries);
}
