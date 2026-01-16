import type { Metadata } from "next";
import type { Article, DisasterEvent, Product, SiteMetadata } from "@/types";

const resolvedSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.PAYLOAD_PUBLIC_SITE_URL ||
  "https://worldunderwater.org";

export const siteConfig: SiteMetadata = {
  title: "World Under Water",
  description:
    "Real-time climate disaster tracking, survival guides, and emergency preparedness resources. Stay informed, stay prepared.",
  siteUrl: resolvedSiteUrl,
  ogImage: `${resolvedSiteUrl}/og-default.png`,
  twitterHandle: "@worldunderwater",
};

export function generateSiteMetadata(): Metadata {
  return {
    metadataBase: new URL(siteConfig.siteUrl),
    title: {
      default: siteConfig.title,
      template: `%s | ${siteConfig.title}`,
    },
    description: siteConfig.description,
    keywords: [
      "climate disasters",
      "natural disasters",
      "emergency preparedness",
      "survival gear",
      "flood warning",
      "hurricane tracking",
      "disaster news",
      "climate change",
    ],
    authors: [{ name: "World Under Water Team" }],
    creator: "World Under Water",
    publisher: "World Under Water",
    formatDetection: {
      email: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteConfig.siteUrl,
      siteName: siteConfig.title,
      title: siteConfig.title,
      description: siteConfig.description,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitterHandle,
      creator: siteConfig.twitterHandle,
      title: siteConfig.title,
      description: siteConfig.description,
      images: [siteConfig.ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: siteConfig.siteUrl,
      types: {
        "application/rss+xml": `${siteConfig.siteUrl}/feed.xml`,
      },
    },
  };
}

/**
 * Generate canonical URL with automatic fallback and manual override support
 */
export function generateCanonicalUrl(
  slug: string,
  type: "article" | "product" | "disaster" = "article",
  manualOverride?: string,
): string {
  // If manual override is provided, validate and use it
  if (manualOverride) {
    try {
      const url = new URL(manualOverride);
      // Ensure it's for the same domain (security)
      if (url.hostname === new URL(siteConfig.siteUrl).hostname) {
        return manualOverride;
      }
      // Log warning if different domain
      console.warn(
        `Canonical URL hostname mismatch: ${url.hostname} vs ${new URL(siteConfig.siteUrl).hostname}`,
      );
    } catch {
      console.warn(`Invalid canonical URL provided: ${manualOverride}`);
    }
  }

  // Auto-generate from slug
  return `${siteConfig.siteUrl}/${type}/${slug}`;
}

export function generateArticleMetadata(article: Article): Metadata {
  const url = `${siteConfig.siteUrl}/article/${article.slug}`;
  // Auto-generate canonical URL with manual override support
  const canonicalUrl = generateCanonicalUrl(
    article.slug,
    "article",
    article.seo.canonicalUrl,
  );

  return {
    title: article.seo.metaTitle,
    description: article.seo.metaDescription,
    keywords: article.seo.keywords,
    openGraph: {
      type: "article",
      url,
      title: article.seo.metaTitle,
      description: article.seo.metaDescription,
      images: [
        {
          url: article.seo.ogImage,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
      tags: article.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: article.seo.metaTitle,
      description: article.seo.metaDescription,
      images: [article.seo.ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export function generateDisasterMapMetadata(): Metadata {
  return {
    title: "Live Disaster Map",
    description:
      "Interactive real-time map showing active natural disasters worldwide. Track floods, hurricanes, wildfires, earthquakes, and more.",
    openGraph: {
      type: "website",
      url: `${siteConfig.siteUrl}/disasters`,
      title: "Live Disaster Map | World Under Water",
      description:
        "Interactive real-time map showing active natural disasters worldwide.",
      images: [
        {
          url: `${siteConfig.siteUrl}/og-disaster-map.jpg`,
          width: 1200,
          height: 630,
          alt: "World Under Water - Live Disaster Map",
        },
      ],
    },
  };
}

export function generateProductCategoryMetadata(
  category: string,
  productCount: number,
): Metadata {
  const categoryTitles: Record<string, string> = {
    "emergency-kits": "Emergency Survival Kits",
    "water-safety": "Water Safety Equipment",
    shelter: "Emergency Shelter & Protection",
    communication: "Emergency Communication Devices",
    "first-aid": "First Aid & Medical Supplies",
    "food-water": "Emergency Food & Water Storage",
    lighting: "Emergency Lighting & Power",
    tools: "Survival Tools & Equipment",
    water: "Water & Filtration",
    food: "Food & Nutrition",
    power: "Power & Light",
    clothing: "Clothing & Gear",
    navigation: "Navigation Tools",
    safety: "Safety & Security",
  };

  const title = categoryTitles[category] || "Survival Products";
  const url = `${siteConfig.siteUrl}/products/${category}`;

  return {
    title,
    description: `Browse ${productCount} expert-recommended ${title.toLowerCase()} for disaster preparedness. Stay safe with our curated survival gear.`,
    openGraph: {
      type: "website",
      url,
      title: `${title} | World Under Water`,
      description: `Expert-recommended ${title.toLowerCase()} for disaster preparedness.`,
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateProductMetadata(product: Product): Metadata {
  const url = `${siteConfig.siteUrl}/products/${product.category}/${product.slug}`;

  return {
    title: `${product.name} | World Under Water`,
    description: product.shortDescription,
    keywords: [
      ...product.disasterTypes,
      product.category,
      "survival gear",
      "emergency preparedness",
    ],
    openGraph: {
      type: "website",
      url,
      title: product.name,
      description: product.shortDescription,
      images: product.images.map((img) => ({
        url: img.url,
        width: 1200,
        height: 630,
        alt: img.alt,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.shortDescription,
      images: [product.images[0]?.url || ""],
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateDisasterMetadata(disaster: DisasterEvent): Metadata {
  const url = `${siteConfig.siteUrl}/disasters/${disaster.id}`;
  const location =
    `${disaster.location.region || ""}, ${disaster.location.country}`.trim();
  const title = `${disaster.title} | ${location} | World Under Water`;
  const description =
    disaster.description ||
    `Track the ${disaster.title} ${disaster.type} event in ${location}. Real-time updates, status, and impact information.`;

  return {
    title,
    description,
    keywords: [
      disaster.type,
      disaster.title,
      disaster.location.country,
      disaster.location.region || "",
      "natural disaster",
      "emergency alert",
      "live tracking",
      "climate event",
    ].filter(Boolean),
    openGraph: {
      type: "article",
      url,
      title,
      description,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: disaster.title,
        },
      ],
      publishedTime: disaster.startDate,
      modifiedTime: disaster.endDate || disaster.startDate,
    },
    twitter: {
      card: "summary_large_image",
      title: disaster.title,
      description,
      images: [siteConfig.ogImage],
    },
    alternates: {
      canonical: url,
    },
  };
}
