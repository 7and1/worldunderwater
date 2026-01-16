import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { DisasterBreadcrumb } from "@/components/layout/Breadcrumb";
import {
  getDisasterById,
  getRecentDisasters,
  getArticlesByDisasterType,
  getProductsByDisasterType,
} from "@/lib/data";
import { formatDate } from "@/lib/utils/format";
import SeverityBadge from "@/components/ui/SeverityBadge";
import ProductRecommendation from "@/components/product/ProductRecommendation";
import DisasterCard from "@/components/disaster/DisasterCard";
import { generateDisasterMetadata } from "@/lib/seo/metadata";
import {
  generateDisasterEventSchema,
  generateBreadcrumbSchema,
} from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/lib/seo/metadata";

interface DisasterDetailPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 300;

export async function generateMetadata({
  params,
}: DisasterDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const disaster = await getDisasterById(id);

  if (!disaster) {
    return {
      title: "Disaster Event Not Found",
    };
  }

  return generateDisasterMetadata(disaster);
}

export default async function DisasterDetailPage({
  params,
}: DisasterDetailPageProps) {
  const { id } = await params;
  const disaster = await getDisasterById(id);

  if (!disaster) {
    notFound();
  }

  // Get nearby events (within last 30 days)
  const allDisasters = await getRecentDisasters(100);
  const nearbyEvents = allDisasters
    .filter(
      (d) =>
        d.id !== disaster.id &&
        Math.abs(d.location.lat - disaster.location.lat) < 10 &&
        Math.abs(d.location.lng - disaster.location.lng) < 10,
    )
    .slice(0, 4);

  // Get related articles by disaster type
  const relatedArticles = await getArticlesByDisasterType(disaster.type, 3);

  // Get product recommendations based on disaster type
  const recommendedProducts = await getProductsByDisasterType(disaster.type, 3);

  // Generate breadcrumb schema
  const breadcrumbs = [
    { name: "Home", url: siteConfig.siteUrl },
    { name: "Disasters", url: `${siteConfig.siteUrl}/disasters` },
    {
      name: disaster.type.charAt(0).toUpperCase() + disaster.type.slice(1),
      url: `${siteConfig.siteUrl}/disasters?type=${disaster.type}`,
    },
    {
      name: disaster.title,
      url: `${siteConfig.siteUrl}/disasters/${disaster.id}`,
    },
  ];

  return (
    <>
      <JsonLd data={generateDisasterEventSchema(disaster)} />
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} />
      <StaticPageLayout
        title={disaster.title}
        subtitle={disaster.description || "Live disaster event details."}
        kicker="Event Detail"
      >
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <DisasterBreadcrumb
            disasterType={disaster.type}
            disasterTitle={disaster.title}
          />
        </div>

        <section className="card p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <SeverityBadge severity={disaster.severity} size="lg" />
            <span className="px-3 py-1 rounded-full bg-ocean-700 text-sm font-medium text-foam-200 capitalize">
              {disaster.type}
            </span>
            {disaster.isActive && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-phosphor-500/20 text-sm font-medium text-phosphor-400">
                <span className="w-2 h-2 rounded-full bg-phosphor-400 animate-pulse" />
                Active Event
              </span>
            )}
          </div>

          <dl className="grid gap-4 md:grid-cols-2 text-sm text-foam-200">
            <div>
              <dt className="text-foam-muted">Location</dt>
              <dd className="text-foam-100 font-medium">
                {disaster.location.region || "Unknown"},{" "}
                {disaster.location.country}
              </dd>
            </div>
            <div>
              <dt className="text-foam-muted">Coordinates</dt>
              <dd className="text-foam-100 font-medium">
                {disaster.location.lat.toFixed(4)},{" "}
                {disaster.location.lng.toFixed(4)}
              </dd>
            </div>
            <div>
              <dt className="text-foam-muted">First reported</dt>
              <dd className="text-foam-100 font-medium">
                {disaster.startDate ? formatDate(disaster.startDate) : "N/A"}
              </dd>
            </div>
            <div>
              <dt className="text-foam-muted">Status</dt>
              <dd className="text-foam-100 font-medium">
                {disaster.isActive ? "Active" : "Archived"}
              </dd>
            </div>
            <div>
              <dt className="text-foam-muted">Source</dt>
              <dd className="text-foam-100 font-medium">
                {disaster.source.toUpperCase()}
              </dd>
            </div>
            {disaster.affectedPopulation && (
              <div>
                <dt className="text-foam-muted">Affected Population</dt>
                <dd className="text-foam-100 font-medium">
                  {disaster.affectedPopulation.toLocaleString()}
                </dd>
              </div>
            )}
          </dl>

          {disaster.sourceUrl && (
            <Link
              href={disaster.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost mt-6 inline-flex"
            >
              View source data
            </Link>
          )}
        </section>

        {/* Recommended Products */}
        {recommendedProducts.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-foam-100 mb-4">
              Recommended Preparedness Gear
            </h2>
            <p className="text-foam-200 mb-6">
              Based on this {disaster.type} event, consider these essential
              items for emergency preparedness.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recommendedProducts.map((product, index) => (
                <ProductRecommendation
                  key={product.id}
                  product={product}
                  position={index + 1}
                  utmCampaign={`disaster-${disaster.type}`}
                />
              ))}
            </div>
          </section>
        )}

        {/* Nearby Events */}
        {nearbyEvents.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-foam-100 mb-4">
              Nearby Events
            </h2>
            <p className="text-foam-200 mb-6">
              Other disaster events in the surrounding region.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {nearbyEvents.map((event) => (
                <DisasterCard
                  key={event.id}
                  disaster={event}
                  variant="compact"
                />
              ))}
            </div>
          </section>
        )}

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-foam-100 mb-4">
              Related Coverage
            </h2>
            <p className="text-foam-200 mb-6">
              In-depth articles and analysis about {disaster.type} events.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/article/${article.slug}`}
                  className="card"
                >
                  <div className="relative aspect-video">
                    <img
                      src={article.featuredImage.url}
                      alt={article.featuredImage.alt}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/80 to-transparent" />
                    <span className="absolute bottom-3 left-3 rounded bg-ocean-700 px-2 py-1 text-xs font-medium text-foam-200 capitalize">
                      {article.disaster.type}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-foam-100 mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-foam-muted line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-foam-muted">
                      <span>{article.readingTime} min read</span>
                      <span>&bull;</span>
                      <span>
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <Link href="/disasters" className="btn btn-ghost">
            Back to live map
          </Link>
        </section>
      </StaticPageLayout>
    </>
  );
}
