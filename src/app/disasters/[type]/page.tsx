import { notFound } from "next/navigation";
import Link from "next/link";
import TrackedLink from "@/components/analytics/TrackedLink";
import type { Metadata } from "next";
import DisasterCard from "@/components/disaster/DisasterCard";
import ProductRecommendation from "@/components/product/ProductRecommendation";
import DisasterTypeIcon from "@/components/ui/DisasterTypeIcon";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import {
  getRecentDisasters,
  getArticlesByDisasterType,
  getProductsByDisasterType,
} from "@/lib/data";
import type { DisasterType } from "@/types";

// Disaster type configuration
const DISASTER_TYPE_CONFIG: Record<
  DisasterType,
  {
    name: string;
    description: string;
    metaTitle: string;
    metaDescription: string;
    color: string;
  }
> = {
  flood: {
    name: "Floods",
    description:
      "Real-time flood tracking and preparedness resources. Flash floods, river flooding, and coastal flood events worldwide.",
    metaTitle: "Flood Tracker - Live Flood Warnings & Preparedness",
    metaDescription:
      "Track active floods worldwide in real-time. Get flood warnings, safety tips, and recommended emergency preparedness gear for flood events.",
    color: "var(--disaster-flood)",
  },
  hurricane: {
    name: "Hurricanes",
    description:
      "Hurricane and tropical storm tracking with real-time updates, evacuation information, and preparedness guides.",
    metaTitle: "Hurricane Tracker - Live Storm Updates & Preparedness",
    metaDescription:
      "Track active hurricanes and tropical storms. Get real-time updates, evacuation routes, and essential hurricane preparedness supplies.",
    color: "var(--disaster-hurricane)",
  },
  tsunami: {
    name: "Tsunamis",
    description:
      "Tsunami warnings and tracking data from global monitoring stations. Coastal safety information and emergency resources.",
    metaTitle: "Tsunami Tracker - Live Warnings & Coastal Safety",
    metaDescription:
      "Monitor tsunami warnings worldwide. Get real-time alerts, evacuation zones, and tsunami survival preparedness gear.",
    color: "var(--disaster-tsunami)",
  },
  wildfire: {
    name: "Wildfires",
    description:
      "Active wildfire tracking with air quality data, evacuation information, and fire safety preparedness resources.",
    metaTitle: "Wildfire Tracker - Live Fire Maps & Air Quality",
    metaDescription:
      "Track active wildfires globally. Get real-time fire maps, air quality updates, evacuation info, and wildfire preparedness equipment.",
    color: "var(--disaster-wildfire)",
  },
  earthquake: {
    name: "Earthquakes",
    description:
      "Real-time earthquake monitoring with magnitude data, aftershock tracking, and seismic safety guides.",
    metaTitle: "Earthquake Tracker - Live Seismic Activity & Safety",
    metaDescription:
      "Monitor earthquake activity worldwide. Get real-time seismic alerts, magnitude data, and essential earthquake preparedness supplies.",
    color: "var(--disaster-earthquake)",
  },
  tornado: {
    name: "Tornadoes",
    description:
      "Tornado warnings and tracking with storm cell data, shelter locations, and severe weather preparedness.",
    metaTitle: "Tornado Tracker - Live Warnings & Storm Shelters",
    metaDescription:
      "Track tornado and severe storm activity. Get real-time tornado warnings, shelter info, and storm preparedness gear.",
    color: "var(--disaster-tornado)",
  },
  drought: {
    name: "Droughts",
    description:
      "Drought monitoring with precipitation data, water conservation alerts, and drought impact resources.",
    metaTitle: "Drought Monitor - Water Conservation Alerts",
    metaDescription:
      "Track drought conditions globally. Get water conservation alerts, precipitation data, and drought preparedness resources.",
    color: "var(--disaster-drought)",
  },
  volcano: {
    name: "Volcanic Eruptions",
    description:
      "Volcano monitoring with eruption alerts, ash cloud tracking, and volcanic safety information.",
    metaTitle: "Volcano Tracker - Eruption Alerts & Ash Clouds",
    metaDescription:
      "Monitor volcanic activity worldwide. Get eruption alerts, ash cloud tracking, and volcano safety preparedness gear.",
    color: "var(--disaster-volcano)",
  },
  volcanic: {
    name: "Volcanic Activity",
    description:
      "Volcanic activity monitoring with eruption alerts, ash cloud tracking, and safety information.",
    metaTitle: "Volcanic Activity Tracker - Eruption Alerts",
    metaDescription:
      "Monitor volcanic activity worldwide. Get eruption alerts, ash cloud tracking, and volcano safety preparedness gear.",
    color: "var(--disaster-volcanic)",
  },
  landslide: {
    name: "Landslides",
    description:
      "Landslide monitoring with risk area mapping, precipitation-triggered events, and slope safety resources.",
    metaTitle: "Landslide Tracker - Hazard Monitoring & Safety",
    metaDescription:
      "Track landslide hazards worldwide. Get risk area alerts, slope safety info, and landslide preparedness resources.",
    color: "var(--disaster-landslide)",
  },
  storm: {
    name: "Severe Storms",
    description:
      "Severe storm tracking including thunderstorms, winter storms, and extreme weather events.",
    metaTitle: "Severe Storm Tracker - Weather Alerts & Preparedness",
    metaDescription:
      "Track severe storms worldwide. Get weather alerts, storm path predictions, and severe weather preparedness gear.",
    color: "var(--disaster-storm)",
  },
  heat_wave: {
    name: "Heat Waves",
    description:
      "Extreme heat monitoring with temperature tracking, heat advisory alerts, and cooling safety resources.",
    metaTitle: "Heat Wave Tracker - Extreme Temperature Alerts",
    metaDescription:
      "Monitor heat wave conditions globally. Get extreme temperature alerts, heat safety tips, and cooling preparedness supplies.",
    color: "var(--disaster-heat_wave)",
  },
  cold_wave: {
    name: "Cold Waves",
    description:
      "Extreme cold monitoring with freezing temperatures, winter storm alerts, and cold safety resources.",
    metaTitle: "Cold Wave Tracker - Freeze Alerts & Winter Safety",
    metaDescription:
      "Track extreme cold events. Get freeze alerts, winter storm warnings, and cold weather survival gear recommendations.",
    color: "var(--disaster-cold_wave)",
  },
};

// FAQ Schema for disaster types
const generateFAQSchema = (disasterType: DisasterType) => {
  const faqs: Record<
    DisasterType,
    Array<{ question: string; answer: string }>
  > = {
    flood: [
      {
        question: "What should I do during a flood?",
        answer:
          "Move to higher ground immediately, avoid walking or driving through flood waters, and follow evacuation orders from local authorities.",
      },
      {
        question: "How do I prepare for a flood?",
        answer:
          "Create an emergency kit, know your evacuation routes, purchase flood insurance if available, and move valuables to higher levels of your home.",
      },
    ],
    hurricane: [
      {
        question: "When should I evacuate for a hurricane?",
        answer:
          "Evacuate if ordered by authorities, if you live in an evacuation zone, or if you live in a mobile home or flood-prone area.",
      },
      {
        question: "What supplies do I need for hurricane season?",
        answer:
          "Water, non-perishable food, flashlights, batteries, first aid supplies, medications, important documents, and a battery-powered or hand-crank radio.",
      },
    ],
    tsunami: [
      {
        question: "What are the warning signs of a tsunami?",
        answer:
          "Strong ground shaking, a loud ocean roar, or the ocean suddenly receding unusually far from the shoreline.",
      },
      {
        question: "How far inland should I go during a tsunami warning?",
        answer:
          "Move to at least 2 miles inland or to an area 100 feet above sea level. Follow official evacuation routes.",
      },
    ],
    wildfire: [
      {
        question: "How do I protect my home from wildfires?",
        answer:
          "Create defensible space around your home, use fire-resistant materials, keep gutters clear of debris, and have an evacuation plan.",
      },
      {
        question: "What should I pack for wildfire evacuation?",
        answer:
          "N95 masks, important documents, medications, change of clothes, phone chargers, and irreplaceable items in a go-bag.",
      },
    ],
    earthquake: [
      {
        question: "What should I do during an earthquake?",
        answer:
          "Drop, Cover, and Hold On. Drop to your hands and knees, take cover under a sturdy table or desk, and hold on until shaking stops.",
      },
      {
        question: "How can I prepare my home for earthquakes?",
        answer:
          "Secure heavy furniture, strap water heaters, install latches on cabinets, and create an emergency supply kit.",
      },
    ],
    tornado: [
      {
        question: "Where is the safest place during a tornado?",
        answer:
          "In a basement or storm cellar. If no basement, go to the lowest floor and center of a building in a small interior room or hallway.",
      },
      {
        question: "What is the difference between a watch and a warning?",
        answer:
          "A watch means conditions are favorable for tornadoes. A warning means a tornado has been sighted or indicated by weather radar.",
      },
    ],
    drought: [
      {
        question: "How can I conserve water during a drought?",
        answer:
          "Fix leaks, take shorter showers, run full loads of laundry and dishes, and limit outdoor watering.",
      },
      {
        question: "What are the impacts of drought?",
        answer:
          "Water shortages, crop failures, increased wildfire risk, and ecosystem damage.",
      },
    ],
    volcano: [
      {
        question: "What should I do during a volcanic eruption?",
        answer:
          "Follow evacuation orders, avoid areas downwind of the volcano, protect yourself from ash fall with masks and goggles, and stay indoors.",
      },
      {
        question: "How far should I stay from a volcano during eruption?",
        answer:
          "Follow all exclusion zone orders from authorities. Ash can affect areas hundreds of miles away.",
      },
    ],
    volcanic: [
      {
        question: "What should I do during a volcanic eruption?",
        answer:
          "Follow evacuation orders, avoid areas downwind of the volcano, protect yourself from ash fall with masks and goggles, and stay indoors.",
      },
      {
        question: "How far should I stay from a volcano during eruption?",
        answer:
          "Follow all exclusion zone orders from authorities. Ash can affect areas hundreds of miles away.",
      },
    ],
    landslide: [
      {
        question: "What are warning signs of a landslide?",
        answer:
          "Changes in landscape, leaning trees, cracking foundations, unusual sounds like trees cracking or boulders knocking together.",
      },
      {
        question: "What should I do if a landslide occurs?",
        answer:
          "Move away from the path quickly, avoid river valleys and low-lying areas, and stay alert after the landslide for more activity.",
      },
    ],
    storm: [
      {
        question: "How do I prepare for a severe storm?",
        answer:
          "Secure loose outdoor items, trim trees, have emergency supplies ready, and stay informed through weather alerts.",
      },
      {
        question: "What should I do during a severe storm?",
        answer:
          "Stay indoors away from windows, avoid using electrical appliances, and don't go outside until the storm has passed.",
      },
    ],
    heat_wave: [
      {
        question: "How do I stay safe during a heat wave?",
        answer:
          "Stay hydrated, stay in air-conditioned spaces, avoid strenuous activity during peak heat hours, and check on vulnerable neighbors.",
      },
      {
        question: "What are signs of heat exhaustion?",
        answer:
          "Heavy sweating, weakness, dizziness, nausea, headache, and muscle cramps. Seek medical attention if symptoms worsen.",
      },
    ],
    cold_wave: [
      {
        question: "How do I stay safe during extreme cold?",
        answer:
          "Dress in layers, stay dry, limit time outdoors, and keep emergency supplies in your car including blankets and warm clothing.",
      },
      {
        question: "What are signs of hypothermia?",
        answer:
          "Shivering, confusion, slurred speech, drowsiness, and loss of coordination. Seek medical attention immediately.",
      },
    ],
  };

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (faqs[disasterType] || []).map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
};

interface DisasterTypePageProps {
  params: Promise<{ type: string }>;
}

export async function generateMetadata({
  params,
}: DisasterTypePageProps): Promise<Metadata> {
  const { type } = await params;
  const disasterType = type as DisasterType;
  const config = DISASTER_TYPE_CONFIG[disasterType];

  if (!config) {
    return {
      title: "Disaster Type Not Found",
    };
  }

  const siteUrl = "https://worldunderwater.org";

  return {
    title: config.metaTitle,
    description: config.metaDescription,
    openGraph: {
      type: "website",
      url: `${siteUrl}/disasters/${type}`,
      title: config.metaTitle,
      description: config.metaDescription,
      images: [
        {
          url: `${siteUrl}/og-${type}.jpg`,
          width: 1200,
          height: 630,
          alt: config.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: config.metaTitle,
      description: config.metaDescription,
    },
    alternates: {
      canonical: `${siteUrl}/disasters/${type}`,
    },
  };
}

export const revalidate = 300;

export default async function DisasterTypePage({
  params,
}: DisasterTypePageProps) {
  const { type } = await params;
  const disasterType = type as DisasterType;
  const config = DISASTER_TYPE_CONFIG[disasterType];

  if (!config) {
    notFound();
  }

  // Fetch data for this disaster type
  const [allDisasters, articles, products] = await Promise.all([
    getRecentDisasters(200),
    getArticlesByDisasterType(disasterType, 6),
    getProductsByDisasterType(disasterType, 6),
  ]);

  // Filter disasters by type
  const disasters = allDisasters.filter((d) => d.type === disasterType);
  const activeDisasters = disasters.filter((d) => d.isActive);
  const pastDisasters = disasters.filter((d) => !d.isActive);

  // Generate structured data
  const faqSchema = generateFAQSchema(disasterType);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen">
        {/* Hero Section */}
        <section
          className="relative bg-ocean-900/50 border-b border-ocean-700 overflow-hidden"
          style={{
            backgroundColor:
              "color-mix(in srgb, " + config.color + " 10%, transparent)",
          }}
        >
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

            <div className="flex flex-col md:flex-row md:items-center gap-8">
              {/* Icon */}
              <div
                className="flex-shrink-0 p-6 rounded-2xl"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, " + config.color + " 20%, transparent)",
                }}
              >
                <DisasterTypeIcon
                  type={disasterType}
                  className="w-16 h-16"
                  style={{ color: config.color }}
                />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-foam-100 mb-4">
                  {config.name}
                </h1>
                <p className="text-lg text-foam-200 mb-6 max-w-2xl">
                  {config.description}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="px-4 py-2 rounded-lg bg-ocean-800">
                    <span
                      className="text-2xl font-bold"
                      style={{ color: config.color }}
                    >
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
                  <div className="px-4 py-2 rounded-lg bg-ocean-800">
                    <span className="text-2xl font-bold text-foam-100">
                      {products.length}
                    </span>
                    <span className="ml-2 text-foam-muted">
                      Preparedness Products
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Active Disasters */}
        {activeDisasters.length > 0 && (
          <section className="py-12 bg-ocean-900/30">
            <div className="container-content">
              <h2 className="text-2xl font-bold text-foam-100 mb-6 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-coral-500 animate-pulse" />
                Active {config.name}
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
                Recent {config.name} Events
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
              {pastDisasters.length > 8 && (
                <div className="mt-6 text-center">
                  <Link
                    href={`/disasters?type=${type}`}
                    className="btn btn-ghost"
                  >
                    View all events
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Preparedness Products */}
        {products.length > 0 && (
          <section className="py-12 bg-ocean-900/30">
            <div className="container-content">
              <h2 className="text-2xl font-bold text-foam-100 mb-2">
                {config.name} Preparedness Gear
              </h2>
              <p className="text-foam-200 mb-6">
                Expert-recommended supplies and equipment for{" "}
                {config.name.toLowerCase()} preparedness and survival.
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product, index) => (
                  <ProductRecommendation
                    key={product.id}
                    product={product}
                    position={index + 1}
                    utmCampaign={`disaster-type-${type}`}
                  />
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link href="/products" className="btn btn-ghost">
                  View all preparedness products
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Related Articles */}
        {articles.length > 0 && (
          <section className="py-12">
            <div className="container-content">
              <h2 className="text-2xl font-bold text-foam-100 mb-2">
                Latest {config.name} Coverage
              </h2>
              <p className="text-foam-200 mb-6">
                In-depth articles and analysis about {config.name.toLowerCase()}{" "}
                events.
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
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

        {/* FAQ Section */}
        <section className="py-12 bg-ocean-900/30">
          <div className="container-content">
            <h2 className="text-2xl font-bold text-foam-100 mb-6">
              Frequently Asked Questions About {config.name}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {(() => {
                const faqs: Record<
                  DisasterType,
                  Array<{ question: string; answer: string }>
                > = {
                  flood: [
                    {
                      question: "What should I do during a flood?",
                      answer:
                        "Move to higher ground immediately, avoid walking or driving through flood waters, and follow evacuation orders from local authorities.",
                    },
                    {
                      question: "How do I prepare for a flood?",
                      answer:
                        "Create an emergency kit, know your evacuation routes, purchase flood insurance if available, and move valuables to higher levels of your home.",
                    },
                  ],
                  hurricane: [
                    {
                      question: "When should I evacuate for a hurricane?",
                      answer:
                        "Evacuate if ordered by authorities, if you live in an evacuation zone, or if you live in a mobile home or flood-prone area.",
                    },
                    {
                      question: "What supplies do I need for hurricane season?",
                      answer:
                        "Water, non-perishable food, flashlights, batteries, first aid supplies, medications, important documents, and a battery-powered or hand-crank radio.",
                    },
                  ],
                  tsunami: [
                    {
                      question: "What are the warning signs of a tsunami?",
                      answer:
                        "Strong ground shaking, a loud ocean roar, or the ocean suddenly receding unusually far from the shoreline.",
                    },
                    {
                      question:
                        "How far inland should I go during a tsunami warning?",
                      answer:
                        "Move to at least 2 miles inland or to an area 100 feet above sea level. Follow official evacuation routes.",
                    },
                  ],
                  wildfire: [
                    {
                      question: "How do I protect my home from wildfires?",
                      answer:
                        "Create defensible space around your home, use fire-resistant materials, keep gutters clear of debris, and have an evacuation plan.",
                    },
                    {
                      question: "What should I pack for wildfire evacuation?",
                      answer:
                        "N95 masks, important documents, medications, change of clothes, phone chargers, and irreplaceable items in a go-bag.",
                    },
                  ],
                  earthquake: [
                    {
                      question: "What should I do during an earthquake?",
                      answer:
                        "Drop, Cover, and Hold On. Drop to your hands and knees, take cover under a sturdy table or desk, and hold on until shaking stops.",
                    },
                    {
                      question: "How can I prepare my home for earthquakes?",
                      answer:
                        "Secure heavy furniture, strap water heaters, install latches on cabinets, and create an emergency supply kit.",
                    },
                  ],
                  tornado: [
                    {
                      question: "Where is the safest place during a tornado?",
                      answer:
                        "In a basement or storm cellar. If no basement, go to the lowest floor and center of a building in a small interior room or hallway.",
                    },
                    {
                      question:
                        "What is the difference between a watch and a warning?",
                      answer:
                        "A watch means conditions are favorable for tornadoes. A warning means a tornado has been sighted or indicated by weather radar.",
                    },
                  ],
                  drought: [
                    {
                      question: "How can I conserve water during a drought?",
                      answer:
                        "Fix leaks, take shorter showers, run full loads of laundry and dishes, and limit outdoor watering.",
                    },
                    {
                      question: "What are the impacts of drought?",
                      answer:
                        "Water shortages, crop failures, increased wildfire risk, and ecosystem damage.",
                    },
                  ],
                  volcano: [
                    {
                      question: "What should I do during a volcanic eruption?",
                      answer:
                        "Follow evacuation orders, avoid areas downwind of the volcano, protect yourself from ash fall with masks and goggles, and stay indoors.",
                    },
                    {
                      question:
                        "How far should I stay from a volcano during eruption?",
                      answer:
                        "Follow all exclusion zone orders from authorities. Ash can affect areas hundreds of miles away.",
                    },
                  ],
                  volcanic: [
                    {
                      question: "What should I do during a volcanic eruption?",
                      answer:
                        "Follow evacuation orders, avoid areas downwind of the volcano, protect yourself from ash fall with masks and goggles, and stay indoors.",
                    },
                    {
                      question:
                        "How far should I stay from a volcano during eruption?",
                      answer:
                        "Follow all exclusion zone orders from authorities. Ash can affect areas hundreds of miles away.",
                    },
                  ],
                  landslide: [
                    {
                      question: "What are warning signs of a landslide?",
                      answer:
                        "Changes in landscape, leaning trees, cracking foundations, unusual sounds like trees cracking or boulders knocking together.",
                    },
                    {
                      question: "What should I do if a landslide occurs?",
                      answer:
                        "Move away from the path quickly, avoid river valleys and low-lying areas, and stay alert after the landslide for more activity.",
                    },
                  ],
                  storm: [
                    {
                      question: "How do I prepare for a severe storm?",
                      answer:
                        "Secure loose outdoor items, trim trees, have emergency supplies ready, and stay informed through weather alerts.",
                    },
                    {
                      question: "What should I do during a severe storm?",
                      answer:
                        "Stay indoors away from windows, avoid using electrical appliances, and don't go outside until the storm has passed.",
                    },
                  ],
                  heat_wave: [
                    {
                      question: "How do I stay safe during a heat wave?",
                      answer:
                        "Stay hydrated, stay in air-conditioned spaces, avoid strenuous activity during peak heat hours, and check on vulnerable neighbors.",
                    },
                    {
                      question: "What are signs of heat exhaustion?",
                      answer:
                        "Heavy sweating, weakness, dizziness, nausea, headache, and muscle cramps. Seek medical attention if symptoms worsen.",
                    },
                  ],
                  cold_wave: [
                    {
                      question: "How do I stay safe during extreme cold?",
                      answer:
                        "Dress in layers, stay dry, limit time outdoors, and keep emergency supplies in your car including blankets and warm clothing.",
                    },
                    {
                      question: "What are signs of hypothermia?",
                      answer:
                        "Shivering, confusion, slurred speech, drowsiness, and loss of coordination. Seek medical attention immediately.",
                    },
                  ],
                };
                return (faqs[disasterType] || []).map((faq, index) => (
                  <div key={index} className="card p-6">
                    <h3 className="text-lg font-semibold text-foam-100 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-foam-200">{faq.answer}</p>
                  </div>
                ));
              })()}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12">
          <div className="container-content">
            <div className="card p-8 text-center bg-gradient-to-br from-ocean-800 to-ocean-900">
              <h2 className="text-2xl font-bold text-foam-100 mb-3">
                Stay Prepared for {config.name}
              </h2>
              <p className="text-foam-200 mb-6 max-w-xl mx-auto">
                Get real-time alerts and expert preparedness guidance delivered
                to your inbox.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <TrackedLink
                  href="/checklist"
                  className="btn btn-primary"
                  eventType="click_cta_disaster_checklist"
                >
                  Download Emergency Checklist
                </TrackedLink>
                <TrackedLink
                  href="/guides"
                  className="btn btn-ghost"
                  eventType="click_cta_disaster_guides"
                >
                  Read Preparedness Guides
                </TrackedLink>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
