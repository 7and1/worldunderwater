import { NextResponse } from "next/server";
import { generateSitemap } from "@/lib/seo/sitemap";
import {
  getLatestArticles,
  getFeaturedProducts,
  getProductCategories,
  getRecentDisasters,
} from "@/lib/data";
import { cacheStore } from "@/lib/cache";

// P1-5: Revalidate every 15 minutes (Next.js ISR)
export const revalidate = 900;

// P1-5: Cache key for sitemap
const SITEMAP_CACHE_KEY = "sitemap:xml";
const SITEMAP_CACHE_TTL = 900; // 15 minutes

export async function GET() {
  // P1-5: Check cache first to avoid expensive queries
  const cached = cacheStore.get<{ xml: string; lastModified: string }>(
    SITEMAP_CACHE_KEY,
  );
  if (cached) {
    return new NextResponse(cached.xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Last-Modified": cached.lastModified,
        "Cache-Control": "public, max-age=900, stale-while-revalidate=300",
      },
    });
  }

  const [articles, products, categories, disasters] = await Promise.all([
    getLatestArticles(200),
    getFeaturedProducts(200),
    getProductCategories(),
    getRecentDisasters(200),
  ]);

  const sitemap = await generateSitemap(
    articles,
    products,
    categories as Array<Parameters<typeof generateSitemap>[2][number]>,
    disasters,
  );

  // P1-5: Find the most recent lastModified date for the header
  const mostRecent = sitemap.reduce((latest, entry) => {
    const entryDate =
      entry.lastModified instanceof Date
        ? entry.lastModified
        : new Date(entry.lastModified || 0);
    return entryDate > latest ? entryDate : latest;
  }, new Date(0));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${sitemap
  .map(
    (entry) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${(entry.lastModified instanceof Date ? entry.lastModified : new Date(entry.lastModified || 0)).toISOString()}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${(entry.priority ?? 0.5).toFixed(1)}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  // P1-5: Cache the generated sitemap
  cacheStore.set(
    SITEMAP_CACHE_KEY,
    { xml, lastModified: mostRecent.toUTCString() },
    SITEMAP_CACHE_TTL,
  );

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Last-Modified": mostRecent.toUTCString(),
      "Cache-Control": "public, max-age=900, stale-while-revalidate=300",
    },
  });
}
