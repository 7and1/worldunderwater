import type { Metadata } from "next";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - World Under Water",
  description:
    "How World Under Water collects, uses, and protects your information. GDPR compliant privacy policy with cookie and data handling details.",
};

export default function PrivacyPage() {
  return (
    <StaticPageLayout
      title="Privacy Policy"
      subtitle="Last updated: January 2025. We collect the minimum data needed to keep you informed and safe."
      kicker="Privacy"
    >
      {/* Overview */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Our Privacy Commitment
        </h2>
        <p className="text-foam-200 mb-4">
          World Under Water is committed to protecting your privacy. We collect
          and use data responsibly to provide disaster tracking services while
          minimizing personal information collection.
        </p>
        <p className="text-foam-200">
          This policy explains what data we collect, how we use it, your rights
          under GDPR and other privacy laws, and how to contact us with privacy
          concerns.
        </p>
      </section>

      {/* What We Collect */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Information We Collect
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-foam-100 mb-2">
              Information You Provide
            </h3>
            <ul className="space-y-2 text-foam-200">
              <li className="flex items-start gap-2">
                <span className="text-surface-400 mt-1">&bull;</span>
                <span>
                  <strong>Email addresses:</strong> When you subscribe to our
                  newsletter or alerts
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-surface-400 mt-1">&bull;</span>
                <span>
                  <strong>Location preferences:</strong> When you set up
                  location-based alerts (country, region, or city level only)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-surface-400 mt-1">&bull;</span>
                <span>
                  <strong>Contact form data:</strong> Name, email, and message
                  when you reach out to us
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foam-100 mb-2">
              Automatically Collected Information
            </h3>
            <ul className="space-y-2 text-foam-200">
              <li className="flex items-start gap-2">
                <span className="text-surface-400 mt-1">&bull;</span>
                <span>
                  <strong>Analytics data:</strong> Page views, bounce rate,
                  session duration, referrer sources
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-surface-400 mt-1">&bull;</span>
                <span>
                  <strong>Technical data:</strong> Browser type, device type,
                  operating system, IP address (anonymized)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-surface-400 mt-1">&bull;</span>
                <span>
                  <strong>Cookie data:</strong> Preferences and settings stored
                  locally on your device
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Location & Safety Tools */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Location Data & Safety Tools
        </h2>
        <p className="text-foam-200 mb-4">
          The "Am I Safe?" tool and similar features may request your browser
          location to check nearby hazards. Here's how we handle location data:
        </p>
        <ul className="space-y-2 text-foam-200 mb-4">
          <li className="flex items-start gap-2">
            <span className="text-phosphor-400 mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span>
              Location is only processed in real-time for your immediate query
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-phosphor-400 mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span>Precise GPS coordinates are never stored on our servers</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-phosphor-400 mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span>
              Browser permission is required and can be revoked at any time
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-phosphor-400 mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span>
              For alerts, we only store your general area (city/region level)
            </span>
          </li>
        </ul>
        <p className="text-foam-200">
          If you subscribe to location-based alerts, we store your chosen
          location (at city or region granularity) to deliver relevant
          notifications.
        </p>
      </section>

      {/* How We Use Your Data */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          How We Use Your Information
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold text-foam-100 mb-2">Primary Uses</h3>
            <ul className="space-y-1 text-foam-200 text-sm">
              <li>Deliver disaster alerts and safety information</li>
              <li>Send newsletters with preparedness content</li>
              <li>Improve site performance and user experience</li>
              <li>Analyze traffic trends to optimize content</li>
              <li>Respond to your inquiries and support requests</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foam-100 mb-2">We Never</h3>
            <ul className="space-y-1 text-foam-200 text-sm">
              <li>Sell your personal data to third parties</li>
              <li>Use your data for targeted advertising</li>
              <li>Track you across other websites</li>
              <li>Share data with anyone except as required by law</li>
              <li>Store precise location history</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Cookies */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Cookies & Tracking Technologies
        </h2>
        <p className="text-foam-200 mb-4">
          We use minimal cookies and local storage to provide essential
          services:
        </p>
        <div className="space-y-3">
          <div className="p-3 rounded bg-ocean-800">
            <h4 className="font-semibold text-foam-100 text-sm">
              Essential Cookies
            </h4>
            <p className="text-foam-200 text-sm">
              Required for site security, authentication, and core
              functionality. These cannot be disabled.
            </p>
          </div>
          <div className="p-3 rounded bg-ocean-800">
            <h4 className="font-semibold text-foam-100 text-sm">
              Analytics Cookies
            </h4>
            <p className="text-foam-200 text-sm">
              Help us understand how visitors use our site. Data is anonymized
              and aggregated.
            </p>
          </div>
          <div className="p-3 rounded bg-ocean-800">
            <h4 className="font-semibold text-foam-100 text-sm">
              Preference Cookies
            </h4>
            <p className="text-foam-200 text-sm">
              Remember your settings (location preferences, alert
              subscriptions).
            </p>
          </div>
          <div className="p-3 rounded bg-ocean-800">
            <h4 className="font-semibold text-foam-100 text-sm">
              A/B Testing Cookies
            </h4>
            <p className="text-foam-200 text-sm">
              Used to test different layouts and features for optimization.
            </p>
          </div>
        </div>
        <p className="text-foam-200 mt-4">
          You can manage cookies through your browser settings. Note that
          disabling essential cookies may impact site functionality.
        </p>
      </section>

      {/* GDPR Rights */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Your Privacy Rights (GDPR & CCPA)
        </h2>
        <p className="text-foam-200 mb-4">
          If you are located in the EU, UK, or California, you have additional
          rights regarding your personal data:
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-ocean-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-surface-400">1</span>
            </div>
            <div>
              <h4 className="font-semibold text-foam-100 text-sm">
                Right to Access
              </h4>
              <p className="text-foam-200 text-sm">
                Request a copy of all personal data we hold about you.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-ocean-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-surface-400">2</span>
            </div>
            <div>
              <h4 className="font-semibold text-foam-100 text-sm">
                Right to Rectification
              </h4>
              <p className="text-foam-200 text-sm">
                Request correction of inaccurate or incomplete data.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-ocean-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-surface-400">3</span>
            </div>
            <div>
              <h4 className="font-semibold text-foam-100 text-sm">
                Right to Erasure (Right to be Forgotten)
              </h4>
              <p className="text-foam-200 text-sm">
                Request deletion of your personal data (with some exceptions).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-ocean-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-surface-400">4</span>
            </div>
            <div>
              <h4 className="font-semibold text-foam-100 text-sm">
                Right to Portability
              </h4>
              <p className="text-foam-200 text-sm">
                Receive your data in a structured, machine-readable format.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-ocean-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-surface-400">5</span>
            </div>
            <div>
              <h4 className="font-semibold text-foam-100 text-sm">
                Right to Object
              </h4>
              <p className="text-foam-200 text-sm">
                Object to processing of your data for certain purposes.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-ocean-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-surface-400">6</span>
            </div>
            <div>
              <h4 className="font-semibold text-foam-100 text-sm">
                Right to Restrict Processing
              </h4>
              <p className="text-foam-200 text-sm">
                Limit how we use your data while a dispute is resolved.
              </p>
            </div>
          </div>
        </div>
        <p className="text-foam-200 mt-4">
          To exercise these rights, email us at{" "}
          <a
            href="mailto:privacy@worldunderwater.org"
            className="text-surface-400 hover:underline"
          >
            privacy@worldunderwater.org
          </a>
          . We will respond within 30 days.
        </p>
      </section>

      {/* Data Retention */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Data Retention & Security
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold text-foam-100 mb-2">
              Retention Periods
            </h3>
            <ul className="space-y-1 text-foam-200 text-sm">
              <li>Newsletter subscriptions: Until you unsubscribe</li>
              <li>Analytics data: Aggregated after 90 days</li>
              <li>Contact form submissions: 1 year</li>
              <li>Alert preferences: Until you delete them</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foam-100 mb-2">
              Security Measures
            </h3>
            <ul className="space-y-1 text-foam-200 text-sm">
              <li>HTTPS/TLS encryption for all data transmission</li>
              <li>Access logging and monitoring</li>
              <li>Regular security audits</li>
              <li>Restricted access to personal data</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Third-Party Services */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Third-Party Services & Affiliates
        </h2>
        <p className="text-foam-200 mb-4">
          We use the following third-party services:
        </p>
        <ul className="space-y-2 text-foam-200 text-sm">
          <li>
            <strong>Analytics:</strong> Privacy-focused analytics (no individual
            tracking)
          </li>
          <li>
            <strong>Email delivery:</strong> Secure email service for
            newsletters
          </li>
          <li>
            <strong>Content delivery:</strong> CDN for faster page loads
          </li>
          <li>
            <strong>Affiliate links:</strong> When you click product links, we
            may earn a commission. See our{" "}
            <Link
              href="/disclosure"
              className="text-surface-400 hover:underline"
            >
              Affiliate Disclosure
            </Link>
            .
          </li>
        </ul>
      </section>

      {/* Children's Privacy */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Children&apos;s Privacy
        </h2>
        <p className="text-foam-200">
          Our services are not directed to children under 16. We do not
          knowingly collect personal information from children under 16. If you
          are a parent or guardian and believe your child has provided us with
          personal data, please contact us immediately.
        </p>
      </section>

      {/* International Data Transfers */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          International Data Transfers
        </h2>
        <p className="text-foam-200">
          World Under Water may store and process data in the United States and
          other countries where our service providers operate. By using our
          service, you consent to this transfer. We take appropriate safeguards
          to protect your data in accordance with this privacy policy.
        </p>
      </section>

      {/* Changes to Policy */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Changes to This Privacy Policy
        </h2>
        <p className="text-foam-200">
          We may update this privacy policy from time to time. We will notify
          you of significant changes by emailing the address associated with
          your account or by placing a prominent notice on our site. The updated
          policy becomes effective when posted.
        </p>
      </section>

      {/* Contact */}
      <section className="card p-6 md:p-8 bg-gradient-to-br from-ocean-800 to-ocean-900">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Privacy Questions & Requests
        </h2>
        <p className="text-foam-200 mb-4">
          For privacy-related inquiries, requests, or complaints:
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="mailto:privacy@worldunderwater.org"
            className="btn btn-primary"
          >
            Email: privacy@worldunderwater.org
          </a>
          <Link href="/contact" className="btn btn-ghost">
            Contact Form
          </Link>
        </div>
        <p className="text-foam-muted text-sm mt-4">
          EU residents: You also have the right to lodge a complaint with your
          local data protection authority.
        </p>
      </section>
    </StaticPageLayout>
  );
}
