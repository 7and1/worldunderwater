import type { Metadata } from "next";
import Link from "next/link";
import StaticPageLayout from "@/components/layout/StaticPageLayout";

export const metadata: Metadata = {
  title: "About World Under Water - Mission, Data Sources & Team",
  description:
    "Learn how World Under Water tracks climate disasters using NASA, USGS, and NOAA data. Our mission, methodology, data sources, and editorial standards.",
  openGraph: {
    title: "About World Under Water",
    description:
      "Real-time climate disaster tracking with verified data sources.",
  },
};

export default function AboutPage() {
  return (
    <StaticPageLayout
      title="About World Under Water"
      subtitle="We turn trusted disaster data into practical, location-aware preparedness guidance."
      kicker="Our Mission"
    >
      {/* Mission Statement */}
      <section className="card p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-foam-100 mb-4">
          Our Mission
        </h2>
        <p className="text-foam-200 mb-4">
          World Under Water exists to help families make faster, smarter
          decisions when disasters strike. We combine official data feeds with
          preparedness expertise to surface the most relevant events and
          actionable guidance.
        </p>
        <p className="text-foam-200">
          Climate disasters are increasing in frequency and severity. When every
          minute counts, you need accurate information you can trust. We bridge
          the gap between raw scientific data and practical preparedness action.
        </p>
      </section>

      {/* Core Values */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="card p-6">
          <div className="w-12 h-12 rounded-lg bg-ocean-700 flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-surface-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foam-100 mb-2">
            Verified Data Only
          </h3>
          <p className="text-foam-200 text-sm">
            We only use data from official government agencies and trusted
            scientific organizations.
          </p>
        </div>
        <div className="card p-6">
          <div className="w-12 h-12 rounded-lg bg-ocean-700 flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-surface-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foam-100 mb-2">
            Real-Time Updates
          </h3>
          <p className="text-foam-200 text-sm">
            Our systems monitor data feeds continuously, updating event
            information within minutes of official reports.
          </p>
        </div>
        <div className="card p-6">
          <div className="w-12 h-12 rounded-lg bg-ocean-700 flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-surface-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foam-100 mb-2">
            Community Focused
          </h3>
          <p className="text-foam-200 text-sm">
            Every feature is designed to help real families prepare for and
            respond to disasters in their communities.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section>
        <h2 className="text-2xl font-semibold text-foam-100 mb-6">
          How We Work
        </h2>
        <div className="grid gap-6 md:grid-cols-4">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-surface-400 text-abyss-950 font-bold flex items-center justify-center mx-auto mb-3">
              1
            </div>
            <h3 className="text-sm font-semibold text-foam-100 mb-1">
              Data Ingestion
            </h3>
            <p className="text-xs text-foam-200">
              Live feeds from NASA, USGS, NOAA, and other official sources
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-surface-400 text-abyss-950 font-bold flex items-center justify-center mx-auto mb-3">
              2
            </div>
            <h3 className="text-sm font-semibold text-foam-100 mb-1">
              Verification
            </h3>
            <p className="text-xs text-foam-200">
              Automated validation and human review for significant events
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-surface-400 text-abyss-950 font-bold flex items-center justify-center mx-auto mb-3">
              3
            </div>
            <h3 className="text-sm font-semibold text-foam-100 mb-1">
              Analysis
            </h3>
            <p className="text-xs text-foam-200">
              AI-assisted impact assessment and preparedness guidance
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-surface-400 text-abyss-950 font-bold flex items-center justify-center mx-auto mb-3">
              4
            </div>
            <h3 className="text-sm font-semibold text-foam-100 mb-1">
              Publication
            </h3>
            <p className="text-xs text-foam-200">
              Real-time updates with actionable safety information
            </p>
          </div>
        </div>
      </section>

      {/* Data Sources */}
      <section className="card p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-foam-100 mb-4">
          Data Sources You Can Trust
        </h2>
        <p className="text-foam-200 mb-6">
          We rely exclusively on government agencies, scientific organizations,
          and humanitarian bodies for disaster data. We never use unverified
          social media reports as primary sources.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-lg bg-ocean-800">
            <h3 className="font-semibold text-foam-100 mb-2">NASA EONET</h3>
            <p className="text-sm text-foam-200">
              Real-time natural event data from NASA's Earth Observatory Natural
              Event Tracker. Covers wildfires, floods, storms, and more.
            </p>
            <a
              href="https://eonet.gsfc.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-surface-400 hover:underline mt-2 inline-block"
            >
              Visit NASA EONET &rarr;
            </a>
          </div>
          <div className="p-4 rounded-lg bg-ocean-800">
            <h3 className="font-semibold text-foam-100 mb-2">
              USGS Earthquake Hazards
            </h3>
            <p className="text-sm text-foam-200">
              Real-time earthquake data from the U.S. Geological Survey.
              Provides magnitude, location, and impact assessments worldwide.
            </p>
            <a
              href="https://earthquake.usgs.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-surface-400 hover:underline mt-2 inline-block"
            >
              Visit USGS &rarr;
            </a>
          </div>
          <div className="p-4 rounded-lg bg-ocean-800">
            <h3 className="font-semibold text-foam-100 mb-2">
              NOAA / National Weather Service
            </h3>
            <p className="text-sm text-foam-200">
              U.S. weather data including hurricanes, tornadoes, floods, and
              severe weather alerts from the National Oceanic and Atmospheric
              Administration.
            </p>
            <a
              href="https://www.weather.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-surface-400 hover:underline mt-2 inline-block"
            >
              Visit NOAA &rarr;
            </a>
          </div>
          <div className="p-4 rounded-lg bg-ocean-800">
            <h3 className="font-semibold text-foam-100 mb-2">ReliefWeb</h3>
            <p className="text-sm text-foam-200">
              Humanitarian disaster information from the United Nations Office
              for the Coordination of Humanitarian Affairs (OCHA).
            </p>
            <a
              href="https://reliefweb.int/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-surface-400 hover:underline mt-2 inline-block"
            >
              Visit ReliefWeb &rarr;
            </a>
          </div>
        </div>
        <p className="text-foam-200 mt-6">
          Want a complete list of our data sources? Visit our{" "}
          <Link href="/sources" className="text-surface-400 hover:underline">
            Sources page
          </Link>
          .
        </p>
      </section>

      {/* Editorial Team */}
      <section className="card p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-foam-100 mb-4">Our Team</h2>
        <p className="text-foam-200 mb-6">
          World Under Water is maintained by a distributed team of disaster
          response experts, data scientists, and preparedness specialists.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <h3 className="font-semibold text-foam-100 mb-2">
              Disaster Analysts
            </h3>
            <p className="text-sm text-foam-200">
              Monitor incoming feeds 24/7, validate severity thresholds, and
              assess potential human impact.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foam-100 mb-2">
              Preparedness Editors
            </h3>
            <p className="text-sm text-foam-200">
              Ensure guidance is practical, accurate, and accessible to diverse
              audiences regardless of experience level.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foam-100 mb-2">
              Product Researchers
            </h3>
            <p className="text-sm text-foam-200">
              Evaluate and test preparedness gear, mapping products to specific
              disaster types and use cases.
            </p>
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section>
        <h2 className="text-2xl font-semibold text-foam-100 mb-4">
          Our Methodology
        </h2>
        <div className="space-y-4">
          <details className="card p-4">
            <summary className="font-semibold text-foam-100 cursor-pointer">
              How do you decide which disasters to cover?
            </summary>
            <p className="text-foam-200 mt-3 text-sm">
              We use a significance scoring system that considers severity,
              affected population, potential impact, and unusual or
              unprecedented characteristics. We prioritize events that pose
              immediate risks to human safety or represent notable climate
              phenomena.
            </p>
          </details>
          <details className="card p-4">
            <summary className="font-semibold text-foam-100 cursor-pointer">
              How quickly is information updated?
            </summary>
            <p className="text-foam-200 mt-3 text-sm">
              Our systems poll official data feeds every 5-15 minutes depending
              on the source. Significant events trigger immediate review and
              publication. Minor updates to ongoing events may take longer to
              appear.
            </p>
          </details>
          <details className="card p-4">
            <summary className="font-semibold text-foam-100 cursor-pointer">
              Do you provide emergency alerts?
            </summary>
            <p className="text-foam-200 mt-3 text-sm">
              World Under Water provides informational updates only. We are not
              an emergency alert system. For official emergency notifications,
              sign up for alerts from your local emergency management agency,
              FEMA, or equivalent national systems.
            </p>
          </details>
          <details className="card p-4">
            <summary className="font-semibold text-foam-100 cursor-pointer">
              How are products recommended?
            </summary>
            <p className="text-foam-200 mt-3 text-sm">
              Our product researchers evaluate gear based on quality,
              reliability, price-to-value ratio, and relevance to specific
              disaster scenarios. We receive affiliate commissions on some
              purchases, which helps fund our operations. See our{" "}
              <Link
                href="/disclosure"
                className="text-surface-400 hover:underline"
              >
                disclosure
              </Link>{" "}
              for details.
            </p>
          </details>
        </div>
      </section>

      {/* Transparency & Disclosures */}
      <section className="card p-6 md:p-8 bg-gradient-to-br from-ocean-800 to-ocean-900">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Transparency & Disclosures
        </h2>
        <p className="text-foam-200 mb-4">
          World Under Water is supported by affiliate partnerships. When you
          purchase through qualifying links we may earn a commission, which
          helps fund continuous monitoring and reporting.
        </p>
        <p className="text-foam-200 mb-4">
          Our editorial content is never influenced by affiliate relationships.
          We recommend products based on merit, not commission rates.
        </p>
        <p className="text-foam-200">
          For complete details, read our{" "}
          <Link href="/disclosure" className="text-surface-400 hover:underline">
            Affiliate Disclosure
          </Link>
          ,{" "}
          <Link href="/privacy" className="text-surface-400 hover:underline">
            Privacy Policy
          </Link>
          , and{" "}
          <Link href="/terms" className="text-surface-400 hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      </section>

      {/* Contact */}
      <section className="text-center py-8">
        <p className="text-foam-200 mb-4">
          Have questions or feedback? We'd like to hear from you.
        </p>
        <Link href="/contact" className="btn btn-primary">
          Contact Us
        </Link>
      </section>
    </StaticPageLayout>
  );
}
