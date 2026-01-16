import Image from "next/image";
import TrackedAffiliateLink from "@/components/analytics/TrackedAffiliateLink";
import type { Product } from "@/types";
import { cookies } from "next/headers";
import { formatPrice } from "@/lib/utils/format";

interface ProductRecommendationProps {
  product: Product;
  variant?: "default" | "compact" | "horizontal";
  showDisasterTags?: boolean;
  position?: number; // For tracking
  utmCampaign?: string;
  abVariant?: "A" | "B";
  articleId?: string;
  analyticsEventType?: string;
}

const PLACEHOLDER_IMAGE = "/images/product-placeholder.png";

async function getAbVariant(abVariant?: "A" | "B"): Promise<"A" | "B"> {
  if (abVariant) return abVariant;
  const cookieStore = await cookies();
  return (cookieStore.get("wuw_ab")?.value as "A" | "B") || "A";
}

export default async function ProductRecommendation({
  product,
  variant = "default",
  showDisasterTags = true,
  position,
  utmCampaign,
  abVariant,
  articleId,
  analyticsEventType,
}: ProductRecommendationProps) {
  const resolvedVariant = await getAbVariant(abVariant);
  const primaryImage =
    product.images.find((img) => img.isPrimary) ||
    product.images[0] ||
    ({ url: PLACEHOLDER_IMAGE, alt: product.name } as const);

  // Star rating component
  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? "text-amber-400" : "text-ocean-600"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-foam-muted ml-1">
        ({product.reviewCount.toLocaleString()})
      </span>
    </div>
  );

  // Affiliate tracking URL + UTM parameters
  const affiliateUrl = (() => {
    if (!product.affiliateUrl) return "#";
    try {
      const url = new URL(product.affiliateUrl);
      url.searchParams.set("ref", "wuw");
      if (position) url.searchParams.set("pos", `${position}`);
      url.searchParams.set("utm_source", "worldunderwater");
      url.searchParams.set("utm_medium", "affiliate");
      url.searchParams.set(
        "utm_campaign",
        utmCampaign || product.category || "preparedness",
      );
      url.searchParams.set("utm_content", `ab-${resolvedVariant}`);
      return url.toString();
    } catch {
      const separator = product.affiliateUrl.includes("?") ? "&" : "?";
      return `${product.affiliateUrl}${separator}ref=wuw${
        position ? `&pos=${position}` : ""
      }&utm_source=worldunderwater&utm_medium=affiliate&utm_campaign=${
        utmCampaign || product.category || "preparedness"
      }&utm_content=ab-${resolvedVariant}`;
    }
  })();

  if (variant === "compact") {
    return (
      <TrackedAffiliateLink
        href={affiliateUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="card group flex items-center gap-4 p-3 hover:border-surface-400/30"
        eventType={analyticsEventType}
        articleId={articleId}
        productId={product.id}
      >
        <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-ocean-800">
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt}
            fill
            className="object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = PLACEHOLDER_IMAGE;
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foam-100 truncate group-hover:text-surface-300 transition-colors">
            {product.name}
          </h4>
          <p className="text-lg font-bold text-surface-400">
            {formatPrice(product.price, product.currency)}
          </p>
        </div>
        <svg
          className="w-5 h-5 text-foam-muted group-hover:text-surface-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </TrackedAffiliateLink>
    );
  }

  if (variant === "horizontal") {
    return (
      <TrackedAffiliateLink
        href={affiliateUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="card group flex flex-col sm:flex-row gap-4 p-4"
        eventType={analyticsEventType}
        articleId={articleId}
        productId={product.id}
      >
        {/* Image */}
        <div className="relative w-full sm:w-40 h-40 flex-shrink-0 rounded-lg overflow-hidden bg-ocean-800">
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = PLACEHOLDER_IMAGE;
            }}
          />
          {!product.inStock && (
            <div className="absolute inset-0 bg-abyss-950/80 flex items-center justify-center">
              <span className="text-sm font-medium text-coral-400">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <h4 className="font-semibold text-foam-100 group-hover:text-surface-300 transition-colors mb-1">
              {product.name}
            </h4>
            <StarRating rating={Math.round(product.rating)} />
            <p className="text-sm text-foam-200 mt-2 line-clamp-2">
              {product.shortDescription}
            </p>

            {/* Features */}
            {product.features.length > 0 && (
              <ul className="mt-3 space-y-1">
                {product.features.slice(0, 3).map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-foam-muted"
                  >
                    <svg
                      className="w-4 h-4 text-phosphor-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-ocean-700">
            <div>
              <span className="text-2xl font-bold text-surface-400">
                {formatPrice(product.price, product.currency)}
              </span>
              {product.affiliateProvider === "amazon" && (
                <span className="block text-xs text-foam-muted">on Amazon</span>
              )}
            </div>
            <span className="btn btn-primary text-sm">
              View Deal
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </span>
          </div>
        </div>
      </TrackedAffiliateLink>
    );
  }

  // Default card variant
  return (
    <TrackedAffiliateLink
      href={affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="card group flex flex-col h-full"
      eventType={analyticsEventType}
      articleId={articleId}
      productId={product.id}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-ocean-800">
        <Image
          src={primaryImage.url}
          alt={primaryImage.alt}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = PLACEHOLDER_IMAGE;
          }}
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-abyss-950/80 flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-coral-500/20 text-coral-400 text-sm font-medium">
              Out of Stock
            </span>
          </div>
        )}
        {product.priority === 1 && (
          <span className="absolute top-3 left-3 px-2 py-1 rounded bg-amber-500 text-abyss-950 text-xs font-bold uppercase">
            Top Pick
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4">
        {/* Disaster type tags */}
        {showDisasterTags && product.disasterTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {product.disasterTypes.slice(0, 3).map((type) => (
              <span
                key={type}
                className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-ocean-700 text-foam-muted"
              >
                {type}
              </span>
            ))}
          </div>
        )}

        <h4 className="font-semibold text-foam-100 group-hover:text-surface-300 transition-colors line-clamp-2 mb-1">
          {product.name}
        </h4>

        <StarRating rating={Math.round(product.rating)} />

        <p className="text-sm text-foam-200 mt-2 line-clamp-2 flex-1">
          {product.shortDescription}
        </p>

        {/* Price */}
        <div className="mt-4 pt-3 border-t border-ocean-700">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xl font-bold text-surface-400">
                {formatPrice(product.price, product.currency)}
              </span>
              {product.affiliateProvider === "amazon" && (
                <span className="block text-xs text-foam-muted mt-0.5">
                  on Amazon
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-surface-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              View
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Affiliate disclosure */}
      <div className="px-4 pb-3">
        <p className="text-[10px] text-foam-muted text-center">
          Affiliate link - we may earn a commission
        </p>
      </div>
    </TrackedAffiliateLink>
  );
}
