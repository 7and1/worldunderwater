import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import Link from "next/link";
import { ProductBreadcrumb } from "@/components/layout/Breadcrumb";
import { getProductBySlug } from "@/lib/data";
import ProductRecommendation from "@/components/product/ProductRecommendation";
import { generateProductMetadata } from "@/lib/seo/metadata";
import {
  generateProductSchema,
  generateBreadcrumbSchema,
} from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/lib/seo/metadata";

interface ProductDetailPageProps {
  params: Promise<{ category: string; slug: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return generateProductMetadata(product);
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { category, slug } = await params;
  if (!slug) {
    notFound();
  }

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const breadcrumbs = [
    { name: "Home", url: siteConfig.siteUrl },
    { name: "Products", url: `${siteConfig.siteUrl}/products` },
    {
      name:
        product.category.charAt(0).toUpperCase() +
        product.category.slice(1).replace(/-/g, " "),
      url: `${siteConfig.siteUrl}/products/${product.category}`,
    },
    {
      name: product.name,
      url: `${siteConfig.siteUrl}/products/${product.category}/${product.slug}`,
    },
  ];

  return (
    <>
      <JsonLd data={generateProductSchema(product)} />
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} />
      <StaticPageLayout
        title={product.name}
        subtitle={product.shortDescription}
        kicker="Product"
      >
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <ProductBreadcrumb
            category={product.category}
            productName={product.name}
          />
        </div>
        <section className="grid gap-8 lg:grid-cols-2">
          <div className="card p-6 md:p-8">
            <ProductRecommendation
              product={product}
              variant="horizontal"
              utmCampaign="product-detail"
            />
          </div>
          <div className="space-y-6">
            <div className="card p-6 md:p-8">
              <h2 className="text-xl font-semibold text-foam-100 mb-3">
                Why we recommend it
              </h2>
              <p className="text-foam-200">
                This item is matched to disaster categories that require rapid
                response and reliable gear. Always review manufacturer safety
                instructions before use.
              </p>
            </div>
            <div className="card p-6 md:p-8">
              <h2 className="text-xl font-semibold text-foam-100 mb-3">
                Quick facts
              </h2>
              <ul className="space-y-2 text-foam-200 text-sm">
                <li>Category: {product.category}</li>
                <li>Rating: {product.rating} / 5</li>
                <li>
                  Availability: {product.inStock ? "In stock" : "Out of stock"}
                </li>
                <li>Affiliate provider: {product.affiliateProvider}</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <Link href={`/products/${category}`} className="btn btn-ghost">
            Back to category
          </Link>
        </section>
      </StaticPageLayout>
    </>
  );
}
