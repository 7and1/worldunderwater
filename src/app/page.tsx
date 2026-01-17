import Link from "next/link";
import TrackedLink from "@/components/analytics/TrackedLink";
import DisasterCard from "@/components/disaster/DisasterCard";
import RiskChecker from "@/components/disaster/RiskChecker";
import ProductRecommendation from "@/components/product/ProductRecommendation";
import { NewsletterSubscribe } from "@/components/forms/NewsletterSubscribe";
import {
  getFeaturedDisaster,
  getRecentDisasters,
  getLatestArticles,
  getFeaturedProducts,
} from "@/lib/data";

export const revalidate = 300;

async function getDisasterStats() {
  const disasters = await getRecentDisasters(200);
  return {
    active: disasters.filter((event) => event.isActive).length,
    countries: new Set(disasters.map((event) => event.location.country)).size,
    updated: new Date().toISOString(),
  };
}

export default async function HomePage() {
  const [
    featuredDisaster,
    recentDisasters,
    latestArticles,
    featuredProducts,
    stats,
  ] = await Promise.all([
    getFeaturedDisaster(),
    getRecentDisasters(),
    getLatestArticles(),
    getFeaturedProducts(),
    getDisasterStats(),
  ]);

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[45vh] flex items-center wave-overlay">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-abyss-950 via-ocean-900/90 to-abyss-950" />
          {/* Animated water effect */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2 bg-[radial-gradient(ellipse_at_center,_rgba(56,189,248,0.3)_0%,_transparent_70%)] animate-float" />
          </div>
        </div>

        <div className="relative container-content py-10 md:py-14">
          <div className="max-w-3xl">
            {/* Live stats badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-coral-500 animate-pulse" />
                <span className="text-sm font-medium text-coral-400">
                  {stats.active} Active Disasters
                </span>
              </span>
              <span className="text-foam-muted">|</span>
              <span className="text-sm text-foam-muted">
                {stats.countries} Countries Affected
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foam-100 mb-6 leading-tight">
              Real-Time Climate{" "}
              <span className="text-gradient">Disaster Tracking</span>
            </h1>

            <p className="text-lg md:text-xl text-foam-200 mb-8 max-w-2xl">
              Stay informed with live updates on floods, hurricanes, wildfires,
              and more. Get the survival gear you need before disaster strikes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <TrackedLink
                href="/disasters"
                className="btn btn-primary text-base px-8 py-4"
                eventType="click_cta_home_live_map"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                View Live Map
              </TrackedLink>
              <TrackedLink
                href="/products/emergency-kits"
                className="btn btn-ghost text-base px-8 py-4"
                eventType="click_cta_home_emergency"
              >
                Get Emergency Supplies
              </TrackedLink>
              <TrackedLink
                href="#risk-checker"
                className="btn btn-ghost text-base px-8 py-4"
                eventType="click_cta_home_risk"
              >
                Check My Risk
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Disaster */}
      {featuredDisaster && (
        <section className="py-12 md:py-16">
          <div className="container-content">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="flex items-center gap-2 text-sm font-semibold text-coral-400 uppercase tracking-wide mb-2">
                  <span className="w-2 h-2 rounded-full bg-coral-400 animate-pulse" />
                  Breaking News
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-foam-100">
                  Featured Disaster
                </h2>
              </div>
            </div>
            <DisasterCard disaster={featuredDisaster} variant="featured" />
          </div>
        </section>
      )}

      {/* Recent Disasters Grid */}
      <section className="py-12 md:py-16 bg-ocean-900/30">
        <div className="container-content">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foam-100">
              Active Disasters
            </h2>
            <Link
              href="/disasters"
              className="text-surface-400 font-medium hover:text-surface-300 flex items-center gap-1"
            >
              View all
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
            </Link>
          </div>

          {recentDisasters.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentDisasters.slice(0, 6).map((disaster) => (
                <DisasterCard key={disaster.id} disaster={disaster} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-10 h-10 rounded-full bg-ocean-800 flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-5 h-5 text-foam-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-foam-100 mb-1">
                No Active Disasters
              </h3>
              <p className="text-xs text-foam-muted">
                Check back later for updates.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Risk Checker */}
      <section id="risk-checker" className="py-12 md:py-16">
        <div className="container-content">
          <RiskChecker />
        </div>
      </section>

      {/* Preparedness CTA */}
      <section className="py-16 md:py-24">
        <div className="container-content">
          <div className="relative rounded-2xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-coral-600/20 via-ocean-800 to-ocean-900" />
            <div className="absolute inset-0 bg-[url('/images/emergency-bg.svg')] bg-cover bg-center opacity-10" />

            <div className="relative p-8 md:p-12 lg:p-16">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foam-100 mb-4">
                    Are You Prepared for the Next Disaster?
                  </h2>
                  <p className="text-lg text-foam-200 mb-6">
                    72 hours. That is how long you may need to survive on your
                    own during a major disaster. Make sure you have the
                    essential supplies to protect yourself and your loved ones.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <TrackedLink
                      href="/products/emergency-kits"
                      className="btn btn-danger text-base"
                      eventType="click_cta_home_shop_kits"
                    >
                      Shop Emergency Kits
                    </TrackedLink>
                    <TrackedLink
                      href="/checklist"
                      className="btn btn-ghost text-base"
                      eventType="click_cta_home_checklist"
                    >
                      Download Checklist
                    </TrackedLink>
                  </div>
                </div>

                {/* Featured Products Preview */}
                {featuredProducts.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {featuredProducts.slice(0, 4).map((product, i) => (
                      <ProductRecommendation
                        key={product.id}
                        product={product}
                        variant="compact"
                        position={i + 1}
                        utmCampaign="homepage"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      {latestArticles.length > 0 && (
        <section className="py-12 md:py-16 bg-ocean-900/30">
          <div className="container-content">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foam-100">
                Latest Updates
              </h2>
              <Link
                href="/articles"
                className="text-surface-400 font-medium hover:text-surface-300 flex items-center gap-1"
              >
                All articles
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
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestArticles.slice(0, 3).map((article) => (
                <Link
                  key={article.id}
                  href={`/article/${article.slug}`}
                  className="card group"
                >
                  <div className="relative aspect-video">
                    <img
                      src={article.featuredImage.url}
                      alt={article.featuredImage.alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ocean-900 to-transparent" />
                    <span className="absolute bottom-3 left-3 px-2 py-1 rounded bg-ocean-700 text-xs font-medium text-foam-200 capitalize">
                      {article.disaster.type}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foam-100 group-hover:text-surface-300 transition-colors line-clamp-2 mb-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-foam-muted line-clamp-2">
                      {article.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Data Sources */}
      <section className="py-12 md:py-16 border-t border-ocean-800">
        <div className="container-content">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-foam-100 mb-2">
              Trusted Data Sources
            </h2>
            <p className="text-sm text-foam-muted">
              Our disaster data is aggregated from official government and
              scientific sources
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60">
            {["NASA", "USGS", "NOAA", "FEMA", "GDACS"].map((source) => (
              <span
                key={source}
                className="text-lg font-bold text-foam-muted tracking-wide"
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 md:py-16 bg-ocean-900/50">
        <div className="container-narrow text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foam-100 mb-4">
            Stay Alert, Stay Safe
          </h2>
          <p className="text-foam-200 mb-8">
            Get instant alerts for disasters in your area and weekly
            preparedness tips.
          </p>

          <NewsletterSubscribe />

          <p className="text-xs text-foam-muted mt-4">
            No spam, unsubscribe anytime. Read our{" "}
            <Link href="/privacy" className="text-surface-400 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
