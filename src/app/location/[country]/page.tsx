import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import DisasterCard from "@/components/disaster/DisasterCard";
import ProductRecommendation from "@/components/product/ProductRecommendation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { getRecentDisasters, getArticlesByDisasterType } from "@/lib/data";
import type { DisasterType } from "@/types";

// Country/region code configuration
const COUNTRY_CONFIG: Record<
  string,
  { name: string; region?: string; description: string }
> = {
  us: {
    name: "United States",
    region: "North America",
    description:
      "Disaster tracking for the United States including hurricanes, wildfires, earthquakes, tornadoes, and severe weather events.",
  },
  usa: {
    name: "United States",
    region: "North America",
    description:
      "Disaster tracking for the United States including hurricanes, wildfires, earthquakes, tornadoes, and severe weather events.",
  },
  jp: {
    name: "Japan",
    region: "Asia",
    description:
      "Earthquake, tsunami, and typhoon monitoring for Japan with real-time alerts and preparedness resources.",
  },
  id: {
    name: "Indonesia",
    region: "Asia",
    description:
      "Volcanic activity, earthquake, and tsunami monitoring for Indonesia with early warning information.",
  },
  ph: {
    name: "Philippines",
    region: "Asia",
    description:
      "Typhoon, earthquake, and volcanic activity tracking for the Philippines with disaster preparedness guidance.",
  },
  au: {
    name: "Australia",
    region: "Oceania",
    description:
      "Bushfire, flood, and cyclone monitoring for Australia with emergency services information.",
  },
  br: {
    name: "Brazil",
    region: "South America",
    description:
      "Flood, landslide, and drought monitoring for Brazil with environmental disaster tracking.",
  },
  in: {
    name: "India",
    region: "Asia",
    description:
      "Flood, cyclone, and heat wave monitoring for India with monsoon and extreme weather tracking.",
  },
  gb: {
    name: "United Kingdom",
    region: "Europe",
    description:
      "Flood and storm monitoring for the United Kingdom with severe weather alerts.",
  },
  de: {
    name: "Germany",
    region: "Europe",
    description:
      "Flood and storm monitoring for Germany with extreme weather event tracking.",
  },
  fr: {
    name: "France",
    region: "Europe",
    description:
      "Heat wave, flood, and storm monitoring for France with emergency preparedness information.",
  },
  ca: {
    name: "Canada",
    region: "North America",
    description:
      "Wildfire, flood, and winter storm monitoring for Canada with extreme weather alerts.",
  },
  mx: {
    name: "Mexico",
    region: "North America",
    description:
      "Hurricane, earthquake, and volcanic activity monitoring for Mexico with disaster response information.",
  },
  it: {
    name: "Italy",
    region: "Europe",
    description:
      "Earthquake, flood, and heat wave monitoring for Italy with seismic activity tracking.",
  },
  nz: {
    name: "New Zealand",
    region: "Oceania",
    description:
      "Earthquake, volcanic activity, and flood monitoring for New Zealand with natural hazard tracking.",
  },
  cl: {
    name: "Chile",
    region: "South America",
    description:
      "Earthquake, tsunami, and volcanic activity monitoring for Chile with Pacific Ring of Fire tracking.",
  },
  cn: {
    name: "China",
    region: "Asia",
    description:
      "Flood, typhoon, and earthquake monitoring for China with extreme weather event tracking.",
  },
  ru: {
    name: "Russia",
    region: "Europe/Asia",
    description:
      "Wildfire, flood, and extreme cold monitoring for Russia with climate disaster tracking.",
  },
  za: {
    name: "South Africa",
    region: "Africa",
    description:
      "Flood, drought, and storm monitoring for South Africa with extreme weather tracking.",
  },
  ke: {
    name: "Kenya",
    region: "Africa",
    description:
      "Drought and flood monitoring for Kenya with climate impact tracking.",
  },
};

// Common disaster types by country
const COMMON_DISASTERS_BY_COUNTRY: Record<string, DisasterType[]> = {
  us: ["hurricane", "wildfire", "earthquake", "tornado", "flood", "storm"],
  usa: ["hurricane", "wildfire", "earthquake", "tornado", "flood", "storm"],
  jp: ["earthquake", "tsunami", "hurricane", "volcanic"],
  id: ["earthquake", "tsunami", "volcano", "flood"],
  ph: ["hurricane", "earthquake", "volcano", "flood"],
  au: ["wildfire", "flood", "storm"],
  br: ["flood", "landslide", "drought"],
  in: ["flood", "storm", "heat_wave"],
  gb: ["flood", "storm"],
  de: ["flood", "storm"],
  fr: ["heat_wave", "flood", "storm"],
  ca: ["wildfire", "flood", "storm", "cold_wave"],
  mx: ["hurricane", "earthquake", "volcano"],
  it: ["earthquake", "flood", "heat_wave"],
  nz: ["earthquake", "volcano", "flood"],
  cl: ["earthquake", "tsunami", "volcano"],
  cn: ["flood", "storm", "heat_wave"],
  ru: ["wildfire", "flood", "cold_wave"],
  za: ["flood", "storm", "drought"],
  ke: ["drought", "flood"],
};

interface CountryPageProps {
  params: Promise<{ country: string }>;
}

export async function generateMetadata({
  params,
}: CountryPageProps): Promise<Metadata> {
  const { country } = await params;
  const countryCode = country.toLowerCase();
  const config = COUNTRY_CONFIG[countryCode];

  if (!config) {
    return {
      title: "Location Not Found",
    };
  }

  const siteUrl = "https://worldunderwater.org";

  return {
    title: `Disaster Tracker - ${config.name} | World Under Water`,
    description: config.description,
    openGraph: {
      type: "website",
      url: `${siteUrl}/location/${countryCode}`,
      title: `${config.name} Disaster Tracker`,
      description: config.description,
    },
    alternates: {
      canonical: `${siteUrl}/location/${countryCode}`,
    },
  };
}

export const revalidate = 300;

export default async function CountryPage({ params }: CountryPageProps) {
  const { country } = await params;
  const countryCode = country.toLowerCase();
  const config = COUNTRY_CONFIG[countryCode];

  if (!config) {
    notFound();
  }

  // Fetch all disasters and filter by country
  const allDisasters = await getRecentDisasters(200);

  // Filter disasters by this country (case-insensitive match)
  const countryDisasters = allDisasters.filter(
    (d) =>
      d.location.countryCode.toLowerCase() === countryCode ||
      d.location.country.toLowerCase() === config.name.toLowerCase(),
  );

  const activeDisasters = countryDisasters.filter((d) => d.isActive);
  const pastDisasters = countryDisasters.filter((d) => !d.isActive);

  // Get common disaster types for this country
  const commonDisasterTypes = COMMON_DISASTERS_BY_COUNTRY[countryCode] || [];

  // Fetch articles and products for common disaster types
  const [articles, products] = await Promise.all(
    commonDisasterTypes.slice(0, 2).map((type) =>
      Promise.all([
        getArticlesByDisasterType(type, 3),
        // Note: We'll need a similar function for products by disaster type
      ]),
    ),
  );

  const allArticles = articles.flat();

  // Calculate statistics
  const disasterCounts = countryDisasters.reduce(
    (acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-ocean-900/50 border-b border-ocean-700">
        <div className="container-content py-12 md:py-16">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Breadcrumb
              items={[
                { name: "Disasters", href: "/disasters" },
                { name: config.name, current: true },
              ]}
              schema={false}
            />
          </div>

          <div className="flex flex-col md:flex-row md:items-start gap-8">
            {/* Content */}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-foam-100 mb-4">
                {config.name} Disaster Tracker
              </h1>
              <p className="text-lg text-foam-200 mb-6 max-w-2xl">
                {config.description}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="px-4 py-2 rounded-lg bg-ocean-800">
                  <span className="text-2xl font-bold text-coral-400">
                    {activeDisasters.length}
                  </span>
                  <span className="ml-2 text-foam-muted">Active Events</span>
                </div>
                <div className="px-4 py-2 rounded-lg bg-ocean-800">
                  <span className="text-2xl font-bold text-foam-100">
                    {pastDisasters.length}
                  </span>
                  <span className="ml-2 text-foam-muted">Recent Events</span>
                </div>
                {config.region && (
                  <div className="px-4 py-2 rounded-lg bg-ocean-800">
                    <span className="text-lg font-medium text-foam-200">
                      {config.region}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Disaster Type Summary */}
            {Object.keys(disasterCounts).length > 0 && (
              <div className="md:w-64">
                <h3 className="text-sm font-semibold text-foam-100 uppercase tracking-wide mb-3">
                  Disaster Types
                </h3>
                <div className="card p-4">
                  <ul className="space-y-2">
                    {Object.entries(disasterCounts)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 8)
                      .map(([type, count]) => (
                        <li
                          key={type}
                          className="flex items-center justify-between text-sm"
                        >
                          <Link
                            href={`/disasters?type=${type}`}
                            className="text-foam-200 hover:text-surface-400 capitalize"
                          >
                            {type.replace("_", " ")}
                          </Link>
                          <span className="text-foam-muted">{count}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Active Disasters */}
      {activeDisasters.length > 0 && (
        <section className="py-12 bg-ocean-900/30">
          <div className="container-content">
            <h2 className="text-2xl font-bold text-foam-100 mb-6 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-coral-500 animate-pulse" />
              Active Disasters in {config.name}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeDisasters.map((disaster) => (
                <DisasterCard key={disaster.id} disaster={disaster} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Events */}
      {pastDisasters.length > 0 && (
        <section className="py-12">
          <div className="container-content">
            <h2 className="text-2xl font-bold text-foam-100 mb-6">
              Recent Events in {config.name}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pastDisasters.slice(0, 8).map((disaster) => (
                <DisasterCard
                  key={disaster.id}
                  disaster={disaster}
                  variant="compact"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Common Disaster Types */}
      {commonDisasterTypes.length > 0 && (
        <section className="py-12 bg-ocean-900/30">
          <div className="container-content">
            <h2 className="text-2xl font-bold text-foam-100 mb-6">
              Common Disaster Types in {config.name}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {commonDisasterTypes.map((type) => {
                const count = disasterCounts[type] || 0;
                return (
                  <Link
                    key={type}
                    href={`/disasters?type=${type}`}
                    className="card p-4 hover:border-surface-400/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg disaster-${type}`}
                        style={{ backgroundColor: "var(--ocean-800)" }}
                      >
                        <span className="text-xs uppercase text-foam-200">
                          {type.replace("_", " ")}
                        </span>
                      </div>
                      {count > 0 && (
                        <span className="text-sm text-foam-muted">
                          {count} {count === 1 ? "event" : "events"}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Related Articles */}
      {allArticles.length > 0 && (
        <section className="py-12">
          <div className="container-content">
            <h2 className="text-2xl font-bold text-foam-100 mb-2">
              Latest Coverage from {config.name}
            </h2>
            <p className="text-foam-200 mb-6">
              News and analysis about disaster events affecting {config.name}.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {allArticles.slice(0, 6).map((article) => (
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
          </div>
        </section>
      )}

      {/* Preparedness Section */}
      <section className="py-12 bg-ocean-900/30">
        <div className="container-content">
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-foam-100 mb-3">
              Preparedness Resources for {config.name}
            </h2>
            <p className="text-foam-200 mb-6 max-w-2xl">
              Get prepared for emergencies in {config.name}. Follow official
              guidance from local authorities and keep essential supplies ready.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/checklist"
                className="btn btn-outline w-full justify-center"
              >
                Emergency Checklist
              </Link>
              <Link
                href="/guides"
                className="btn btn-outline w-full justify-center"
              >
                Preparedness Guides
              </Link>
              <Link
                href="/products"
                className="btn btn-outline w-full justify-center"
              >
                Survival Gear
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 border-t border-ocean-800">
        <div className="container-content">
          <p className="text-sm text-foam-muted text-center">
            Data is sourced from NASA EONET, USGS, NOAA, and other official
            agencies. Always follow instructions from local emergency management
            authorities.
          </p>
        </div>
      </section>
    </div>
  );
}
