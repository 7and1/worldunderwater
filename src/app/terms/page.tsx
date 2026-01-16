import type { Metadata } from "next";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - World Under Water",
  description:
    "Terms and conditions for using the World Under Water website and services. Legal disclaimer and user agreements.",
};

export default function TermsPage() {
  return (
    <StaticPageLayout
      title="Terms of Service"
      subtitle="Last updated: January 2025. By using this site, you agree to these terms."
      kicker="Legal"
    >
      {/* Agreement to Terms */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Agreement to Terms
        </h2>
        <p className="text-foam-200 mb-4">
          By accessing or using World Under Water, you agree to be bound by
          these Terms of Service and all applicable laws and regulations. If you
          do not agree with any of these terms, you are prohibited from using
          this site.
        </p>
        <p className="text-foam-200">
          The materials contained in this website are protected by applicable
          copyright and trademark law.
        </p>
      </section>

      {/* Informational Use Only */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Informational Use Only Disclaimer
        </h2>
        <p className="text-foam-200 mb-4">
          World Under Water provides automated disaster information and
          preparedness guidance for informational purposes only.
        </p>
        <div className="p-4 rounded-lg bg-coral-500/10 border border-coral-500/30 mb-4">
          <p className="text-coral-300 text-sm font-medium mb-2">
            IMPORTANT SAFETY NOTICE
          </p>
          <p className="text-foam-200 text-sm">
            This site does not provide professional emergency, medical, or
            survival advice. Always follow instructions from local emergency
            management authorities, official government agencies, and qualified
            professionals. In an emergency, call your local emergency number
            (911 in the US).
          </p>
        </div>
        <ul className="space-y-2 text-foam-200 text-sm">
          <li>
            Disaster information may be delayed or incomplete due to data source
            limitations
          </li>
          <li>
            We cannot guarantee the accuracy or timeliness of third-party data
          </li>
          <li>
            Preparedness guidance is general and may not apply to your specific
            situation
          </li>
          <li>
            Product recommendations do not constitute professional endorsements
          </li>
        </ul>
      </section>

      {/* Permitted Use */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Permitted Use and License
        </h2>
        <p className="text-foam-200 mb-4">
          You are granted a limited, non-exclusive, non-transferable license to:
        </p>
        <ul className="space-y-2 text-foam-200">
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
              Access and use this website for personal, non-commercial purposes
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
              View disaster data and preparedness content for personal safety
              planning
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
              Share links to our content on social media for non-commercial
              purposes
            </span>
          </li>
        </ul>
      </section>

      {/* Prohibited Uses */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Prohibited Uses
        </h2>
        <p className="text-foam-200 mb-4">
          You may not use this website for any of the following:
        </p>
        <ul className="space-y-2 text-foam-200">
          <li className="flex items-start gap-2">
            <span className="text-coral-400 mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span>
              Scraping, crawling, or harvesting data without prior written
              consent
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-coral-400 mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span>
              Commercial use of our data, maps, or content without licensing
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-coral-400 mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span>Reproducing or redistributing content as your own</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-coral-400 mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span>
              Using automated tools to access the site in a way that places
              unreasonable load on our servers
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-coral-400 mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span>
              Attempting to interfere with the security or operation of the site
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-coral-400 mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span>Falsifying information or impersonating others</span>
          </li>
        </ul>
      </section>

      {/* External Links */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          External Links and Third-Party Content
        </h2>
        <p className="text-foam-200 mb-4">
          World Under Water may contain links to third-party websites and
          resources:
        </p>
        <div className="space-y-3 text-foam-200 text-sm">
          <div className="p-3 rounded bg-ocean-800">
            <h4 className="font-semibold text-foam-100 mb-1">Data Sources</h4>
            <p>
              We link to NASA EONET, USGS, NOAA, ReliefWeb, and other official
              sources. We are not responsible for their content, accuracy, or
              availability.
            </p>
          </div>
          <div className="p-3 rounded bg-ocean-800">
            <h4 className="font-semibold text-foam-100 mb-1">
              Affiliate Products
            </h4>
            <p>
              Product links go to Amazon and other retailers. We earn
              commissions on qualifying purchases. See our{" "}
              <Link
                href="/disclosure"
                className="text-surface-400 hover:underline"
              >
                Affiliate Disclosure
              </Link>
              .
            </p>
          </div>
          <div className="p-3 rounded bg-ocean-800">
            <h4 className="font-semibold text-foam-100 mb-1">
              Third-Party Sites
            </h4>
            <p>
              Links to other websites are provided as a convenience. We do not
              endorse and are not responsible for the content, privacy
              practices, or policies of third-party sites.
            </p>
          </div>
        </div>
      </section>

      {/* Intellectual Property */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Intellectual Property
        </h2>
        <p className="text-foam-200 mb-4">
          Unless otherwise noted, all content on this website is owned by World
          Under Water or our licensors and is protected by copyright laws.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold text-foam-100 mb-2 text-sm">
              What We Own
            </h3>
            <ul className="space-y-1 text-foam-200 text-sm">
              <li>Site design and layout</li>
              <li>Original articles and guides</li>
              <li>Our aggregated disaster data presentations</li>
              <li>Graphics, logos, and trademarks</li>
              <li>Code and software</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foam-100 mb-2 text-sm">
              Third-Party Content
            </h3>
            <ul className="space-y-1 text-foam-200 text-sm">
              <li>Raw disaster data (from NASA, USGS, NOAA, etc.)</li>
              <li>Maps and map tiles (Mapbox, OpenStreetMap)</li>
              <li>Product images and descriptions</li>
              <li>Government agency information</li>
              <li>Linked external resources</li>
            </ul>
          </div>
        </div>
      </section>

      {/* User Accounts */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          User Accounts and Subscriptions
        </h2>
        <p className="text-foam-200 mb-4">
          If you create an account or subscribe to our services:
        </p>
        <ul className="space-y-2 text-foam-200 text-sm">
          <li>
            You are responsible for maintaining the confidentiality of your
            password
          </li>
          <li>
            You are responsible for all activities that occur under your account
          </li>
          <li>
            You must notify us immediately of any unauthorized use of your
            account
          </li>
          <li>You may not share your account credentials with others</li>
          <li>
            We reserve the right to terminate accounts that violate these terms
          </li>
        </ul>
      </section>

      {/* API Access */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          API and Data Access
        </h2>
        <p className="text-foam-200 mb-4">
          For developers and organizations using our API or bulk data access:
        </p>
        <ul className="space-y-2 text-foam-200 text-sm">
          <li>Commercial use requires a separate license agreement</li>
          <li>Rate limits and attribution requirements apply</li>
          <li>Data may not be redistributed without permission</li>
          <li>
            We reserve the right to revoke API access for terms violations
          </li>
        </ul>
        <p className="text-foam-200 mt-4 text-sm">
          For commercial licensing inquiries, see our{" "}
          <Link href="/api" className="text-surface-400 hover:underline">
            API documentation
          </Link>
          .
        </p>
      </section>

      {/* Affiliate Disclosure */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Affiliate Relationships
        </h2>
        <p className="text-foam-200 mb-4">
          World Under Water participates in affiliate advertising programs:
        </p>
        <ul className="space-y-2 text-foam-200 text-sm">
          <li>
            <strong>Amazon Associates:</strong> We earn from qualifying
            purchases
          </li>
          <li>
            <strong>Other retailers:</strong> We may earn commissions on product
            recommendations
          </li>
          <li>
            This does not affect our editorial independence or product
            recommendations
          </li>
          <li>
            See our{" "}
            <Link
              href="/disclosure"
              className="text-surface-400 hover:underline"
            >
              full Affiliate Disclosure
            </Link>
          </li>
        </ul>
      </section>

      {/* Limitation of Liability */}
      <section className="card p-6 md:p-8 border-2 border-coral-500/30">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Limitation of Liability
        </h2>
        <p className="text-foam-200 mb-4">
          To the fullest extent permitted by law, World Under Water and its
          operators, affiliates, and licensors shall not be liable for:
        </p>
        <ul className="space-y-2 text-foam-200 text-sm">
          <li>
            Any indirect, incidental, special, consequential, or punitive
            damages
          </li>
          <li>Loss of use, data, profits, or business opportunities</li>
          <li>
            Personal injury or property damage resulting from use or inability
            to use our services
          </li>
          <li>Errors, inaccuracies, or omissions in content</li>
          <li>Actions taken based on information provided on this site</li>
        </ul>
        <p className="text-foam-200 mt-4 text-sm">
          In no event shall our total liability exceed the amount you paid, if
          any, for accessing this site.
        </p>
      </section>

      {/* Indemnification */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Indemnification
        </h2>
        <p className="text-foam-200">
          You agree to indemnify and hold harmless World Under Water, its
          operators, affiliates, and licensors from any claims, damages, losses,
          liabilities, and expenses (including attorney fees) arising from:
        </p>
        <ul className="space-y-1 text-foam-200 text-sm mt-3">
          <li>Your use of or access to this website</li>
          <li>Your violation of these terms</li>
          <li>Your violation of any third-party rights</li>
          <li>Content you post or submit to the site</li>
        </ul>
      </section>

      {/* Termination */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Termination of Service
        </h2>
        <p className="text-foam-200 mb-4">We reserve the right to:</p>
        <ul className="space-y-2 text-foam-200 text-sm">
          <li>
            Suspend or terminate your access to the site at any time, with or
            without cause
          </li>
          <li>Modify or discontinue any features or services without notice</li>
          <li>Refuse service to anyone for any reason</li>
        </ul>
        <p className="text-foam-200 mt-4 text-sm">
          Upon termination, your right to use the service immediately ceases.
        </p>
      </section>

      {/* Updates to Terms */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Changes to These Terms
        </h2>
        <p className="text-foam-200">
          We may update these terms at any time. Continued use of the site after
          changes indicates acceptance of the new terms. We will notify users of
          material changes via email or site notice. Your continued use of the
          platform indicates acceptance of the latest terms.
        </p>
      </section>

      {/* Governing Law */}
      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Governing Law and Dispute Resolution
        </h2>
        <p className="text-foam-200 mb-4">
          These terms are governed by the laws of the jurisdiction in which
          World Under Water operates. Any disputes arising under these terms
          shall be resolved through:
        </p>
        <ol className="space-y-2 text-foam-200 text-sm list-decimal list-inside">
          <li>Good faith negotiation between parties</li>
          <li>Mediation, if negotiation fails</li>
          <li>Binding arbitration, as a last resort</li>
        </ol>
      </section>

      {/* Contact */}
      <section className="card p-6 md:p-8 bg-gradient-to-br from-ocean-800 to-ocean-900">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Questions About These Terms
        </h2>
        <p className="text-foam-200 mb-4">
          If you have questions about these Terms of Service, please contact us:
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="mailto:legal@worldunderwater.org"
            className="btn btn-primary"
          >
            Email: legal@worldunderwater.org
          </a>
          <Link href="/contact" className="btn btn-ghost">
            Contact Form
          </Link>
        </div>
        <p className="text-foam-muted text-sm mt-4">
          For issues related to your data, see our{" "}
          <Link href="/privacy" className="text-surface-400 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </StaticPageLayout>
  );
}
