import type { NormalizedEvent } from "../data-sources/types";
import { generateArticle } from "./content-generator";
import { getProductMatchesForDisaster } from "./product-matcher";
import { generateAndCacheThumbnail } from "../maps/thumbnail-generator";

export interface GeneratedArticleData {
  eventId: string;
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  thumbnailUrl: string;
  keywords: string[];
  sections: unknown[];
  productRecommendations: unknown[];
}

export async function generateArticleForEvent(
  event: NormalizedEvent,
  eventId: string,
): Promise<GeneratedArticleData> {
  const productMatch = getProductMatchesForDisaster(event.disasterType);

  const thumbnailUrl = await generateAndCacheThumbnail(
    eventId,
    event.disasterType,
    event.location.latitude,
    event.location.longitude,
  );

  const article = await generateArticle({
    event: {
      title: event.title,
      description: event.description,
      disasterType: event.disasterType,
      severity: event.severity,
      source: event.source,
      sourceUrl: event.sourceUrl,
      location: {
        locality: event.location.locality,
        country: event.location.country,
        latitude: event.location.latitude,
        longitude: event.location.longitude,
      },
      eventDate: event.eventDate,
    },
    matchedProducts: productMatch.essentialItems.map((name, i) => ({
      id: `seed-product-${i}`,
      name,
      description: "",
      category: productMatch.categories[0]?.category || "safety",
    })),
  });

  return {
    eventId,
    title: article.title,
    slug: article.slug,
    content: article.content,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    excerpt: article.excerpt,
    thumbnailUrl,
    keywords: article.keywords,
    sections: article.sections,
    productRecommendations: article.productRecommendations,
  };
}
