import type { Article, Product } from "@/types";
import { siteConfig } from "./metadata";

/**
 * SEO validation utilities for content
 * Ensures articles and products meet Google's structured data guidelines
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

/**
 * Validate Article SEO according to Google News and structured data requirements
 */
export function validateArticleSEO(article: Article): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  // Required fields for NewsArticle schema
  if (!article.title || article.title.length < 10) {
    errors.push("Title is required and must be at least 10 characters");
  }

  if (!article.excerpt || article.excerpt.length < 50) {
    errors.push(
      "Excerpt/description is required and must be at least 50 characters",
    );
  }

  if (!article.featuredImage?.url) {
    errors.push("Featured image is required for NewsArticle schema");
  } else {
    // Check image dimensions hint
    info.push(
      "Featured image should be at least 1200x630 for optimal social sharing",
    );
  }

  if (!article.author) {
    errors.push("Author is required for NewsArticle schema");
  }

  if (!article.publishedAt) {
    errors.push("Published date is required");
  }

  if (!article.content || article.content.length < 300) {
    warnings.push("Content should be at least 300 words for better SEO");
  }

  // Meta title validation
  if (article.seo?.metaTitle) {
    if (article.seo.metaTitle.length > 60) {
      warnings.push(
        `Meta title is ${article.seo.metaTitle.length} chars. Recommended: 50-60 chars`,
      );
    } else if (article.seo.metaTitle.length < 30) {
      warnings.push("Meta title is too short. Recommended: 50-60 chars");
    }
  } else {
    errors.push("Meta title is required");
  }

  // Meta description validation
  if (article.seo?.metaDescription) {
    if (article.seo.metaDescription.length > 160) {
      warnings.push(
        `Meta description is ${article.seo.metaDescription.length} chars. Recommended: 150-160 chars`,
      );
    } else if (article.seo.metaDescription.length < 120) {
      warnings.push(
        "Meta description is too short. Recommended: 150-160 chars",
      );
    }
  } else {
    errors.push("Meta description is required");
  }

  // Canonical URL validation
  if (article.seo?.canonicalUrl) {
    try {
      const url = new URL(article.seo.canonicalUrl);
      if (url.hostname !== new URL(siteConfig.siteUrl).hostname) {
        errors.push(`Canonical URL hostname must match site hostname`);
      }
    } catch {
      errors.push("Invalid canonical URL format");
    }
  }

  // Tags validation
  if (!article.tags || article.tags.length === 0) {
    warnings.push("Add 5-10 relevant tags for better discoverability");
  } else if (article.tags.length < 3) {
    warnings.push("Consider adding more tags (recommended: 5-10)");
  }

  // FAQ validation (optional but beneficial)
  if (article.faqs && article.faqs.length > 0) {
    info.push(
      `FAQ section included with ${article.faqs.length} questions - great for rich snippets!`,
    );
  } else {
    info.push("Consider adding an FAQ section for FAQ rich snippets");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    info,
  };
}

/**
 * Validate Product SEO according to Google Product schema requirements
 */
export function validateProductSEO(product: Product): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  // Required fields for Product schema
  if (!product.name || product.name.length < 5) {
    errors.push("Product name is required and must be descriptive");
  }

  if (!product.description || product.description.length < 50) {
    errors.push("Product description is required and should be detailed");
  }

  if (!product.price || product.price <= 0) {
    errors.push("Valid price is required for Product schema");
  }

  if (!product.images || product.images.length === 0) {
    errors.push("At least one product image is required");
  } else {
    const hasPrimary = product.images.some((img) => img.isPrimary);
    if (!hasPrimary) {
      warnings.push("No primary image designated - first image will be used");
    }
  }

  if (!product.category) {
    warnings.push("Product category should be set for better categorization");
  }

  // Availability
  if (typeof product.inStock !== "boolean") {
    errors.push("Stock availability (inStock) must be specified");
  }

  // Rating
  if (product.rating > 5 || product.rating < 0) {
    errors.push("Rating must be between 0 and 5");
  }

  if (product.reviewCount > 0 && product.rating === 0) {
    warnings.push("Reviews exist but rating is 0 - may need verification");
  }

  // Affiliate URL
  if (!product.affiliateUrl) {
    errors.push("Affiliate URL is required");
  } else {
    try {
      new URL(product.affiliateUrl);
    } catch {
      errors.push("Invalid affiliate URL format");
    }
  }

  // Disaster types for relevance
  if (!product.disasterTypes || product.disasterTypes.length === 0) {
    warnings.push("Associate product with disaster types for better context");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    info,
  };
}

/**
 * Check if structured data is valid JSON-LD
 */
export function validateJsonLd(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  try {
    const json = JSON.stringify(data);
    const parsed = JSON.parse(json);

    // Check for @context
    if (!parsed || typeof parsed !== "object") {
      errors.push("Structured data must be a valid object");
      return { isValid: false, errors, warnings, info };
    }

    if (!("@context" in parsed)) {
      errors.push('Structured data must include "@context" property');
    }

    if (!("@type" in parsed)) {
      errors.push('Structured data must include "@type" property');
    }

    // Validate specific types
    if (parsed["@type"] === "NewsArticle") {
      if (!parsed.headline) {
        errors.push("NewsArticle must have a headline");
      }
      if (!parsed.image) {
        errors.push("NewsArticle must have an image");
      }
      if (!parsed.author) {
        errors.push("NewsArticle must have an author");
      }
      if (!parsed.datePublished) {
        errors.push("NewsArticle must have a datePublished");
      }
      if (!parsed.publisher) {
        errors.push("NewsArticle must have a publisher");
      }
    }

    if (parsed["@type"] === "Product") {
      if (!parsed.name) {
        errors.push("Product must have a name");
      }
      if (!parsed.offers) {
        errors.push("Product must have offers");
      }
      if (parsed.offers && !parsed.offers.price) {
        errors.push("Product offer must have a price");
      }
    }

    if (parsed["@type"] === "FAQPage") {
      if (!parsed.mainEntity || !Array.isArray(parsed.mainEntity)) {
        errors.push("FAQPage must have a mainEntity array");
      } else {
        for (const faq of parsed.mainEntity) {
          if (!faq.name || !faq.acceptedAnswer) {
            errors.push("Each FAQ must have a name and acceptedAnswer");
          }
        }
      }
    }
  } catch {
    errors.push("Structured data is not valid JSON");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    info,
  };
}

/**
 * Generate a summary report for SEO validation
 */
export function generateSEOReport(
  articles: Article[],
  products: Product[],
): string {
  let report = "=== SEO VALIDATION REPORT ===\n\n";

  // Article validation
  report += "ARTICLES\n";
  report += "--------\n";
  let validArticles = 0;
  for (const article of articles) {
    const result = validateArticleSEO(article);
    if (result.isValid) validArticles++;
    report += `[${result.isValid ? "✓" : "✗"}] ${article.slug}\n`;
    if (result.errors.length > 0) {
      report += `  Errors: ${result.errors.join(", ")}\n`;
    }
    if (result.warnings.length > 0) {
      report += `  Warnings: ${result.warnings.join(", ")}\n`;
    }
  }
  report += `\nValid: ${validArticles}/${articles.length}\n\n`;

  // Product validation
  report += "PRODUCTS\n";
  report += "--------\n";
  let validProducts = 0;
  for (const product of products) {
    const result = validateProductSEO(product);
    if (result.isValid) validProducts++;
    report += `[${result.isValid ? "✓" : "✗"}] ${product.slug}\n`;
    if (result.errors.length > 0) {
      report += `  Errors: ${result.errors.join(", ")}\n`;
    }
    if (result.warnings.length > 0) {
      report += `  Warnings: ${result.warnings.join(", ")}\n`;
    }
  }
  report += `\nValid: ${validProducts}/${products.length}\n`;

  return report;
}
