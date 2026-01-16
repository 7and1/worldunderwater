import StaticPageLayout from "@/components/layout/StaticPageLayout";
import Link from "next/link";
import { getLatestArticles } from "@/lib/data";

export const metadata = {
  title: "Articles",
  description: "Latest disaster updates and preparedness guidance.",
};

export const revalidate = 300;

export default async function ArticlesPage() {
  const articles = await getLatestArticles(24);

  return (
    <StaticPageLayout
      title="Articles"
      subtitle="Breaking updates and preparedness insights, powered by verified data sources."
      kicker="Latest Coverage"
    >
      {articles.length > 0 ? (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                <h2 className="text-lg font-semibold text-foam-100 mb-2 line-clamp-2">
                  {article.title}
                </h2>
                <p className="text-sm text-foam-muted line-clamp-3">
                  {article.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="card p-6 md:p-8">
          <h2 className="text-xl font-semibold text-foam-100 mb-3">
            Live coverage is loading
          </h2>
          <p className="text-foam-200">
            Articles will appear here as soon as new disasters are published.
            Check the live map for current events.
          </p>
          <Link href="/disasters" className="btn btn-ghost mt-4">
            View Live Map
          </Link>
        </section>
      )}
    </StaticPageLayout>
  );
}
