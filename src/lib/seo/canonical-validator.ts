import { siteConfig } from "./metadata";

/**
 * Canonical URL uniqueness validation
 * Ensures no duplicate canonical URLs across articles
 */

interface CanonicalEntry {
  slug: string;
  canonicalUrl: string;
  generatedUrl: string;
  isManual: boolean;
  isValid: boolean;
  issues: string[];
}

/**
 * Validate a single canonical URL
 */
export function validateCanonicalUrl(
  slug: string,
  manualCanonical: string | undefined,
  type: "article" | "product" | "disaster" = "article",
): CanonicalEntry {
  const generatedUrl = `${siteConfig.siteUrl}/${type}/${slug}`;
  const canonicalUrl = manualCanonical || generatedUrl;
  const isManual = !!manualCanonical;
  const issues: string[] = [];
  let isValid = true;

  // Check if URL is valid
  try {
    const url = new URL(canonicalUrl);

    // Check hostname matches
    if (url.hostname !== new URL(siteConfig.siteUrl).hostname) {
      issues.push(
        `Canonical URL hostname (${url.hostname}) does not match site hostname (${new URL(siteConfig.siteUrl).hostname})`,
      );
      isValid = false;
    }

    // Check protocol is https
    if (url.protocol !== "https:") {
      issues.push(`Canonical URL should use HTTPS, not ${url.protocol}`);
      isValid = false;
    }

    // Check for trailing slash consistency
    const hasTrailingSlash = url.pathname.endsWith("/");
    if (hasTrailingSlash && url.pathname !== "/") {
      issues.push(`Canonical URL should not have trailing slash`);
      isValid = false;
    }
  } catch {
    issues.push(`Invalid URL format: ${canonicalUrl}`);
    isValid = false;
  }

  return {
    slug,
    canonicalUrl,
    generatedUrl,
    isManual,
    isValid,
    issues,
  };
}

/**
 * Validate multiple canonical URLs for uniqueness
 */
export function validateCanonicalUniqueness(
  entries: Array<{ slug: string; canonicalUrl?: string }>,
): {
  isValid: boolean;
  duplicates: string[];
  entries: CanonicalEntry[];
} {
  const validatedEntries = entries.map((entry) =>
    validateCanonicalUrl(entry.slug, entry.canonicalUrl),
  );

  // Check for duplicates
  const urlMap = new Map<string, string[]>();
  for (const entry of validatedEntries) {
    if (!urlMap.has(entry.canonicalUrl)) {
      urlMap.set(entry.canonicalUrl, []);
    }
    urlMap.get(entry.canonicalUrl)!.push(entry.slug);
  }

  const duplicates: string[] = [];
  for (const [url, slugs] of urlMap.entries()) {
    if (slugs.length > 1) {
      duplicates.push(`${url}: [${slugs.join(", ")}]`);
    }
  }

  return {
    isValid:
      duplicates.length === 0 && validatedEntries.every((e) => e.isValid),
    duplicates,
    entries: validatedEntries,
  };
}

/**
 * Generate a canonical URL from slug
 */
export function generateCanonicalUrl(
  slug: string,
  type: "article" | "product" | "disaster" = "article",
): string {
  return `${siteConfig.siteUrl}/${type}/${slug}`;
}
