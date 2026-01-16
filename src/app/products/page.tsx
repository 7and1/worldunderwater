import type { Metadata } from "next";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import Link from "next/link";
import { getFeaturedProducts } from "@/lib/data";
import ProductRecommendation from "@/components/product/ProductRecommendation";
import { siteConfig } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: "Preparedness Products | Survival Gear & Emergency Supplies",
  description:
    "Curated survival gear and emergency supplies for disaster preparedness. Expert-recommended products organized by category including emergency kits, water safety, first aid, communication, shelter, and more.",
  keywords: [
    "survival gear",
    "emergency supplies",
    "disaster preparedness",
    "emergency kit",
    "water filtration",
    "first aid kit",
    "emergency radio",
    "survival equipment",
  ],
  openGraph: {
    type: "website",
    url: `${siteConfig.siteUrl}/products`,
    title: "Preparedness Products | Survival Gear & Emergency Supplies",
    description:
      "Curated survival gear and emergency supplies for disaster preparedness.",
  },
  alternates: {
    canonical: `${siteConfig.siteUrl}/products`,
  },
};

export const revalidate = 3600;

const categories = [
  { label: "Emergency Kits", slug: "emergency-kits" },
  { label: "Water Safety", slug: "water-safety" },
  { label: "First Aid", slug: "first-aid" },
  { label: "Communication", slug: "communication" },
  { label: "Shelter", slug: "shelter" },
  { label: "Food & Water", slug: "food-water" },
  { label: "Tools", slug: "tools" },
];

export default async function ProductsPage() {
  const products = await getFeaturedProducts(12);
  return (
    <StaticPageLayout
      title="Preparedness Products"
      subtitle="Curated survival gear matched to real-time disaster risks."
      kicker="Survival Gear"
    >
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/products/${category.slug}`}
            className="card p-6 hover:border-surface-400/40"
          >
            <h2 className="text-lg font-semibold text-foam-100 mb-2">
              {category.label}
            </h2>
            <p className="text-foam-200">
              Explore top-rated gear for {category.label.toLowerCase()}.
            </p>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foam-100 mb-4">
          Featured Gear
        </h2>
        {products.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <ProductRecommendation
                key={product.id}
                product={product}
                position={index + 1}
                utmCampaign="products"
              />
            ))}
          </div>
        ) : (
          <div className="card p-6 md:p-8">
            <p className="text-foam-200">
              Product recommendations will appear once the catalog is synced.
            </p>
          </div>
        )}
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-semibold text-foam-100 mb-3">
          Affiliate Disclosure
        </h2>
        <p className="text-foam-200">
          Some product links are affiliate links. As an Amazon Associate we earn
          from qualifying purchases.
        </p>
      </section>
    </StaticPageLayout>
  );
}
