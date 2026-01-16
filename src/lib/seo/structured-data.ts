import type { Article, DisasterEvent, Product } from "@/types";
import { siteConfig } from "./metadata";

// JSON-LD structured data generators for SEO

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.title,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.siteUrl}/logo.png`,
      },
    },
  };
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.title,
    url: siteConfig.siteUrl,
    logo: `${siteConfig.siteUrl}/logo.png`,
    sameAs: [
      `https://twitter.com/${siteConfig.twitterHandle.replace("@", "")}`,
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "English",
    },
  };
}

export function generateNewsArticleSchema(article: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: {
      "@type": "ImageObject",
      url: article.featuredImage.url,
      caption: article.featuredImage.caption,
    },
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.title,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.siteUrl}/logo.png`,
      },
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.siteUrl}/article/${article.slug}`,
    },
    keywords: article.tags.join(", "),
    articleSection: article.disaster.type,
    wordCount: article.content.split(/\s+/).length,
    about: {
      "@type": "Event",
      name: article.disaster.title,
      startDate: article.disaster.startDate,
      location: {
        "@type": "Place",
        name: article.disaster.location.region,
        geo: {
          "@type": "GeoCoordinates",
          latitude: article.disaster.location.lat,
          longitude: article.disaster.location.lng,
        },
      },
    },
  };
}

export function generateProductSchema(product: Product) {
  const primaryImage =
    product.images.find((img) => img.isPrimary) || product.images[0];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: primaryImage?.url,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: "Various",
    },
    offers: {
      "@type": "Offer",
      url: `${siteConfig.siteUrl}/products/${product.category}/${product.slug}`,
      priceCurrency: product.currency,
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name:
          product.affiliateProvider === "amazon" ? "Amazon" : "Partner Store",
      },
    },
    aggregateRating:
      product.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    category: product.category,
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateFAQSchema(
  faqs: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateDisasterEventSchema(disaster: DisasterEvent) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: disaster.title,
    description: disaster.description,
    startDate: disaster.startDate,
    endDate: disaster.endDate,
    eventStatus: disaster.isActive
      ? "https://schema.org/EventScheduled"
      : "https://schema.org/EventCancelled",
    location: {
      "@type": "Place",
      name: `${disaster.location.region}, ${disaster.location.country}`,
      geo: {
        "@type": "GeoCoordinates",
        latitude: disaster.location.lat,
        longitude: disaster.location.lng,
      },
      address: {
        "@type": "PostalAddress",
        addressCountry: disaster.location.countryCode,
        addressRegion: disaster.location.region,
      },
    },
    organizer: {
      "@type": "Organization",
      name: disaster.source.toUpperCase(),
      url: disaster.sourceUrl,
    },
  };
}

// Note: JsonLd component is now a client component in its own file
// to avoid TypeScript compilation issues with this .ts file
