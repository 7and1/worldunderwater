import type { ReactNode } from "react";

interface StaticPageLayoutProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  children: ReactNode;
}

export default function StaticPageLayout({
  title,
  subtitle,
  kicker,
  children,
}: StaticPageLayoutProps) {
  return (
    <div className="min-h-screen">
      <section className="bg-ocean-900/50 border-b border-ocean-700">
        <div className="container-content py-10 md:py-14">
          {kicker && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ocean-800 text-xs font-semibold uppercase tracking-wide text-surface-300 mb-4">
              <span className="w-2 h-2 rounded-full bg-surface-400" />
              {kicker}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-foam-100">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-lg text-foam-200 max-w-2xl">{subtitle}</p>
          )}
        </div>
      </section>

      <section className="py-10 md:py-16">
        <div className="container-content space-y-10">{children}</div>
      </section>
    </div>
  );
}
