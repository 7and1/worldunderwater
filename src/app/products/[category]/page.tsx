import type { Metadata } from "next";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import Link from "next/link";
import { getProductsByCategory } from "@/lib/data";
import ProductRecommendation from "@/components/product/ProductRecommendation";
import { generateProductCategoryMetadata } from "@/lib/seo/metadata";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const products = await getProductsByCategory(category, 100);
  return generateProductCategoryMetadata(category, products.length);
}

export default async function ProductCategoryPage({
  params,
}: CategoryPageProps) {
  const { category } = await params;
  const label = category.replace(/-/g, " ");
  const products = await getProductsByCategory(category, 24);

  return (
    <StaticPageLayout
      title={label.charAt(0).toUpperCase() + label.slice(1)}
      subtitle="Curated gear tailored to the disasters you face."
      kicker="Product Category"
    >
      {products.length > 0 ? (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <ProductRecommendation
              key={product.id}
              product={product}
              position={index + 1}
              utmCampaign={`category-${category}`}
            />
          ))}
        </section>
      ) : (
        <section className="card p-6 md:p-8">
          <h2 className="text-xl font-semibold text-foam-100 mb-3">
            Products coming soon
          </h2>
          <p className="text-foam-200">
            We are finalizing our gear recommendations for this category.
          </p>
          <Link href="/products" className="btn btn-ghost mt-4">
            Back to all products
          </Link>
        </section>
      )}
    </StaticPageLayout>
  );
}
