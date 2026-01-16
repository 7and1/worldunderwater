import { NextResponse } from "next/server";
import { getLatestArticles } from "@/lib/data";
import { generateRSSFeed } from "@/lib/seo/sitemap";
import { cacheStore } from "@/lib/cache";

export const revalidate = 900;
export const dynamic = "force-static";

const RSS_CACHE_KEY = "rss:feed";
const RSS_CACHE_TTL = 900; // 15 minutes

export async function GET() {
  // Check cache first
  const cached = cacheStore.get<{ xml: string }>(RSS_CACHE_KEY);
  if (cached) {
    return new NextResponse(cached.xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=900, stale-while-revalidate=300",
      },
    });
  }

  const articles = await getLatestArticles(50);
  const xml = generateRSSFeed(articles);

  // Cache the result
  cacheStore.set(RSS_CACHE_KEY, { xml }, RSS_CACHE_TTL);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, stale-while-revalidate=300",
    },
  });
}
