import type { MetadataRoute } from "next";
import type { Article, Product, ProductCategory, DisasterEvent } from "@/types";
import { siteConfig } from "./metadata";

interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority: number;
}

// Generate sitemap entries for static pages
export function generateStaticSitemapEntries(): SitemapEntry[] {
  return [
    {
      url: siteConfig.siteUrl,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${siteConfig.siteUrl}/disasters`,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.9,
    },
    {
      url: `${siteConfig.siteUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteConfig.siteUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteConfig.siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteConfig.siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteConfig.siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteConfig.siteUrl}/disclosure`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteConfig.siteUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: `${siteConfig.siteUrl}/checklist`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteConfig.siteUrl}/sources`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteConfig.siteUrl}/api`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}

// Generate sitemap entries for articles
export function generateArticleSitemapEntries(
  articles: Article[],
): SitemapEntry[] {
  return articles.map((article) => ({
    url: `${siteConfig.siteUrl}/article/${article.slug}`,
    lastModified: new Date(article.updatedAt),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));
}

// Generate sitemap entries for product categories
export function generateProductCategorySitemapEntries(
  categories: ProductCategory[],
): SitemapEntry[] {
  return categories.map((category) => ({
    url: `${siteConfig.siteUrl}/products/${category}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
}

// Generate sitemap entries for individual products
export function generateProductSitemapEntries(
  products: Product[],
): SitemapEntry[] {
  return products.map((product) => ({
    url: `${siteConfig.siteUrl}/products/${product.category}/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
}

// Generate sitemap entries for disaster events
export function generateDisasterSitemapEntries(
  disasters: DisasterEvent[],
): SitemapEntry[] {
  return disasters.map((disaster) => ({
    url: `${siteConfig.siteUrl}/disasters/${disaster.id}`,
    lastModified: new Date(disaster.updatedAt),
    changeFrequency: disaster.isActive
      ? ("hourly" as const)
      : ("daily" as const),
    priority: disaster.isActive ? 0.9 : 0.6,
  }));
}

// Combine all entries into final sitemap
export async function generateSitemap(
  articles: Article[],
  products: Product[],
  categories: ProductCategory[],
  disasters?: DisasterEvent[],
): Promise<MetadataRoute.Sitemap> {
  const staticEntries = generateStaticSitemapEntries();
  const articleEntries = generateArticleSitemapEntries(articles);
  const categoryEntries = generateProductCategorySitemapEntries(categories);
  const productEntries = generateProductSitemapEntries(products);
  const disasterEntries = disasters
    ? generateDisasterSitemapEntries(disasters)
    : [];

  return [
    ...staticEntries,
    ...articleEntries,
    ...categoryEntries,
    ...productEntries,
    ...disasterEntries,
  ];
}

// Generate robots.txt content
export function generateRobotsTxt(): string {
  return `
User-agent: *
Allow: /

Sitemap: ${siteConfig.siteUrl}/sitemap.xml

# Disallow admin and API routes
Allow: /api$
Disallow: /api/
Disallow: /admin/

# Allow search engines to crawl images
User-agent: Googlebot-Image
Allow: /images/

# Crawl delay for polite crawling
User-agent: *
Crawl-delay: 1
`.trim();
}

// Generate RSS feed for articles
export function generateRSSFeed(articles: Article[]): string {
  const items = articles
    .slice(0, 50)
    .map(
      (article) => `    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${siteConfig.siteUrl}/article/${article.slug}</link>
      <description><![CDATA[${article.excerpt}]]></description>
      <content:encoded><![CDATA[${article.excerpt}]]></content:encoded>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      <guid isPermaLink="true">${siteConfig.siteUrl}/article/${article.slug}</guid>
      <category><![CDATA[${article.disaster.type}]]></category>
      ${article.tags.map((tag) => `      <category><![CDATA[${tag}]]></category>`).join("\n")}
      <dc:creator><![CDATA[${article.author}]]></dc:creator>
      <enclosure url="${article.featuredImage.url}" type="image/jpeg" length="0" />
    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title><![CDATA[${siteConfig.title}]]></title>
    <link>${siteConfig.siteUrl}</link>
    <description><![CDATA[${siteConfig.description}]]></description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteConfig.siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteConfig.siteUrl}/logo.png</url>
      <title><![CDATA[${siteConfig.title}]]></title>
      <link>${siteConfig.siteUrl}</link>
    </image>
${items}
  </channel>
</rss>`;
}
