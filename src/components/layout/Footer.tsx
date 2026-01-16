import Link from "next/link";

const footerLinks = {
  disasters: [
    { label: "Live Map", href: "/disasters" },
    { label: "Floods", href: "/disasters?type=flood" },
    { label: "Hurricanes", href: "/disasters?type=hurricane" },
    { label: "Wildfires", href: "/disasters?type=wildfire" },
    { label: "Earthquakes", href: "/disasters?type=earthquake" },
  ],
  products: [
    { label: "Emergency Kits", href: "/products/emergency-kits" },
    { label: "Water Safety", href: "/products/water-safety" },
    { label: "First Aid", href: "/products/first-aid" },
    { label: "Communication", href: "/products/communication" },
    { label: "All Products", href: "/products" },
  ],
  resources: [
    { label: "Survival Guides", href: "/guides" },
    { label: "Emergency Checklist", href: "/checklist" },
    { label: "Data Sources", href: "/sources" },
    { label: "API Access", href: "/api" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Affiliate Disclosure", href: "/disclosure" },
  ],
};

const socialLinks = [
  {
    label: "Twitter",
    href: "https://twitter.com/worldunderwater",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "GitHub",
    href: "https://github.com/worldunderwater",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    label: "RSS Feed",
    href: "/feed.xml",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-abyss-900 border-t border-ocean-700/50">
      {/* Main Footer Content */}
      <div className="container-wide py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-surface-400 to-ocean-600 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-4 h-4 text-abyss-950"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-foam-100">
                World Under Water
              </span>
            </Link>
            <p className="text-sm text-foam-muted mb-6 max-w-xs">
              Real-time climate disaster tracking and emergency preparedness
              resources. Stay informed. Stay prepared.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foam-muted hover:text-surface-400 transition-colors"
                  aria-label={link.label}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          <div>
            <h3 className="text-sm font-semibold text-foam-100 uppercase tracking-wide mb-4">
              Disasters
            </h3>
            <ul className="space-y-3">
              {footerLinks.disasters.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foam-muted hover:text-surface-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foam-100 uppercase tracking-wide mb-4">
              Products
            </h3>
            <ul className="space-y-3">
              {footerLinks.products.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foam-muted hover:text-surface-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foam-100 uppercase tracking-wide mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foam-muted hover:text-surface-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foam-100 uppercase tracking-wide mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foam-muted hover:text-surface-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-ocean-800">
        <div className="container-wide py-6 flex flex-col gap-4">
          <p className="text-xs text-foam-muted">
            As an Amazon Associate, we earn from qualifying purchases. This site
            uses automated data from NASA/USGS for informational purposes only.
            Not professional survival advice.
          </p>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-foam-muted">
              {currentYear} World Under Water. Data sourced from NASA, USGS, and
              NOAA.
            </p>
            <p className="text-xs text-foam-muted">
              <Link href="/disclosure" className="hover:text-surface-400">
                Affiliate Disclosure
              </Link>{" "}
              &bull; Some links may earn us a commission.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
