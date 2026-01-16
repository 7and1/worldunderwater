import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import TrackedLink from "@/components/analytics/TrackedLink";
import type { Article } from "@/types";
import {
  generateNewsArticleSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
} from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/lib/seo/metadata";
import { formatDate, formatReadingTime } from "@/lib/utils/format";
import SeverityBadge from "@/components/ui/SeverityBadge";
import ProductRecommendation from "@/components/product/ProductRecommendation";
import CopyLinkButton from "@/components/ui/CopyLinkButton";

interface ArticleLayoutProps {
  article: Article;
  children: ReactNode;
}

export default function ArticleLayout({
  article,
  children,
}: ArticleLayoutProps) {
  const breadcrumbs = [
    { name: "Home", url: siteConfig.siteUrl },
    { name: "Disasters", url: `${siteConfig.siteUrl}/disasters` },
    {
      name:
        article.disaster.type.charAt(0).toUpperCase() +
        article.disaster.type.slice(1),
      url: `${siteConfig.siteUrl}/disasters?type=${article.disaster.type}`,
    },
    {
      name: article.title,
      url: `${siteConfig.siteUrl}/article/${article.slug}`,
    },
  ];

  // Generate FAQ schema if FAQs exist
  const faqSchema =
    article.faqs && article.faqs.length > 0
      ? generateFAQSchema(article.faqs)
      : null;

  return (
    <>
      <JsonLd data={generateNewsArticleSchema(article)} />
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} />
      {faqSchema && <JsonLd data={faqSchema} />}

      <article className="min-h-screen">
        {/* Hero Section */}
        <header className="relative">
          {/* Background Image */}
          <div className="absolute inset-0 h-[60vh] min-h-[400px]">
            <Image
              src={article.featuredImage.url}
              alt={article.featuredImage.alt}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-abyss-950/60 via-abyss-950/80 to-abyss-950" />
          </div>

          {/* Content */}
          <div className="relative container-content pt-12 pb-16 md:pt-20 md:pb-24 min-h-[50vh] flex flex-col justify-end">
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-foam-muted">
                {breadcrumbs.slice(0, -1).map((crumb, i) => (
                  <li key={crumb.url} className="flex items-center gap-2">
                    <Link
                      href={crumb.url}
                      className="hover:text-surface-400 transition-colors"
                    >
                      {crumb.name}
                    </Link>
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
                  </li>
                ))}
              </ol>
            </nav>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <SeverityBadge severity={article.disaster.severity} size="lg" />
              <span className="px-3 py-1 rounded-full bg-ocean-700 text-sm font-medium text-foam-200 capitalize">
                {article.disaster.type}
              </span>
              {article.disaster.isActive && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-phosphor-500/20 text-sm font-medium text-phosphor-400">
                  <span className="w-2 h-2 rounded-full bg-phosphor-400 animate-pulse" />
                  Active Event
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foam-100 max-w-4xl mb-4">
              {article.title}
            </h1>

            {/* Excerpt */}
            <p className="text-lg md:text-xl text-foam-200 max-w-3xl mb-6">
              {article.excerpt}
            </p>

            {/* Author & Meta */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-foam-muted">
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-ocean-600 flex items-center justify-center text-foam-100 font-medium">
                  {article.author.charAt(0)}
                </div>
                <span className="text-foam-200">{article.author}</span>
              </span>
              <span className="flex items-center gap-1.5">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {formatDate(article.publishedAt)}
              </span>
              <span className="flex items-center gap-1.5">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatReadingTime(article.readingTime)}
              </span>
            </div>

            {/* Image Caption */}
            {article.featuredImage.caption && (
              <p className="mt-6 text-sm text-foam-muted italic">
                {article.featuredImage.caption}
              </p>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="container-content py-12 md:py-16">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Article Body */}
            <div className="lg:col-span-8">
              <div className="mb-8 rounded-xl border border-ocean-700 bg-ocean-900/40 p-4 text-sm text-foam-200">
                <strong className="text-foam-100">Disclaimer:</strong> This
                article is for informational purposes only and is generated from
                automated data feeds. Always follow instructions from official
                authorities in your area.
              </div>
              <div className="prose prose-lg">{children}</div>

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-ocean-700">
                  <h3 className="text-sm font-semibold text-foam-muted uppercase tracking-wide mb-4">
                    Related Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/search?tag=${encodeURIComponent(tag)}`}
                        className="px-3 py-1.5 rounded-full bg-ocean-800 text-sm text-foam-200 hover:bg-ocean-700 hover:text-surface-300 transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Share */}
              <div className="mt-8 pt-8 border-t border-ocean-700">
                <h3 className="text-sm font-semibold text-foam-muted uppercase tracking-wide mb-4">
                  Share This Article
                </h3>
                <div className="flex gap-3">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(`${siteConfig.siteUrl}/article/${article.slug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Twitter
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${siteConfig.siteUrl}/article/${article.slug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </a>
                  <CopyLinkButton
                    url={`${siteConfig.siteUrl}/article/${article.slug}`}
                  />
                </div>
              </div>

              {article.disaster.sourceUrl && (
                <div className="mt-8 pt-8 border-t border-ocean-700">
                  <h3 className="text-sm font-semibold text-foam-muted uppercase tracking-wide mb-4">
                    Sources
                  </h3>
                  <a
                    href={article.disaster.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-surface-400 hover:underline"
                  >
                    View official source data
                  </a>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-8">
                {/* Emergency CTA */}
                <div className="card p-6 bg-gradient-to-br from-coral-600/20 to-ocean-800 border-coral-500/30">
                  <h3 className="text-lg font-bold text-foam-100 mb-2">
                    Are You Prepared?
                  </h3>
                  <p className="text-sm text-foam-200 mb-4">
                    Disasters can strike without warning. Make sure you have the
                    essential supplies to protect yourself and your family.
                  </p>
                  <TrackedLink
                    href="/products/emergency-kits"
                    className="btn btn-danger w-full"
                    eventType="click_cta_article_emergency"
                    articleId={article.id}
                  >
                    Get Emergency Supplies
                  </TrackedLink>
                </div>

                {/* Recommended Products */}
                {article.relatedProducts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foam-muted uppercase tracking-wide mb-4">
                      Recommended Gear
                    </h3>
                    <div className="space-y-4">
                      {article.relatedProducts.slice(0, 3).map((product, i) => (
                        <ProductRecommendation
                          key={product.id}
                          product={product}
                          variant="compact"
                          position={i + 1}
                          utmCampaign={`article-${article.slug}`}
                          articleId={article.id}
                        />
                      ))}
                    </div>
                    <TrackedLink
                      href={`/products?disaster=${article.disaster.type}`}
                      className="btn btn-ghost w-full mt-4"
                      eventType="click_cta_article_view_all_gear"
                      articleId={article.id}
                    >
                      View All {article.disaster.type} Gear
                    </TrackedLink>
                  </div>
                )}

                {/* Disaster Info Card */}
                <div className="card p-6">
                  <h3 className="text-sm font-semibold text-foam-muted uppercase tracking-wide mb-4">
                    Event Details
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-foam-muted">Location</dt>
                      <dd className="text-foam-100 font-medium">
                        {article.disaster.location.region},{" "}
                        {article.disaster.location.country}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-foam-muted">Started</dt>
                      <dd className="text-foam-100 font-medium">
                        {formatDate(article.disaster.startDate)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-foam-muted">Status</dt>
                      <dd
                        className={
                          article.disaster.isActive
                            ? "text-phosphor-400"
                            : "text-foam-muted"
                        }
                      >
                        {article.disaster.isActive ? "Active" : "Ended"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-foam-muted">Source</dt>
                      <dd>
                        <a
                          href={article.disaster.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-surface-400 hover:underline"
                        >
                          {article.disaster.source.toUpperCase()}
                        </a>
                      </dd>
                    </div>
                  </dl>
                  <Link href="/disasters" className="btn btn-ghost w-full mt-6">
                    View Live Map
                  </Link>
                </div>

                {/* FAQ Section */}
                {article.faqs && article.faqs.length > 0 && (
                  <div className="card p-6">
                    <h3 className="text-sm font-semibold text-foam-muted uppercase tracking-wide mb-4">
                      Frequently Asked Questions
                    </h3>
                    <div className="space-y-4">
                      {article.faqs.map((faq, index) => (
                        <details
                          key={index}
                          className="group border border-ocean-700 rounded-lg overflow-hidden"
                        >
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-ocean-800/50 transition-colors">
                            <span className="font-medium text-foam-100 pr-4">
                              {faq.question}
                            </span>
                            <svg
                              className="w-5 h-5 text-foam-muted flex-shrink-0 group-open:rotate-180 transition-transform"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </summary>
                          <div className="px-4 pb-4 text-sm text-foam-200">
                            {faq.answer}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}
