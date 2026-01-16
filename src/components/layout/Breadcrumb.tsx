import Link from "next/link";
import type { BreadcrumbItem } from "@/types";

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  schema?: boolean;
}

const baseBreadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
};

export function Breadcrumb({ items, schema = true }: BreadcrumbProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const itemListElement = items.map((item, index) => ({
    "@type": "ListItem" as const,
    position: index + 1,
    name: item.name,
    item: item.href
      ? `${process.env.NEXT_PUBLIC_SITE_URL || "https://worldunderwater.org"}${item.href}`
      : undefined,
  }));

  const jsonLd = {
    ...baseBreadcrumbSchema,
    itemListElement,
  };

  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 flex-wrap">
          <li className="flex items-center gap-2">
            <Link
              href="/"
              className="text-foam-muted hover:text-surface-400 transition-colors"
              aria-label="Home"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-foam-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              {item.href && !item.current ? (
                <Link
                  href={item.href}
                  className="text-foam-muted hover:text-surface-400 transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <span
                  className={
                    item.current ? "text-foam-100 font-medium" : "text-foam-200"
                  }
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

export function ArticleBreadcrumb({
  disasterType,
  articleTitle,
}: {
  disasterType?: string;
  articleTitle?: string;
}) {
  const items: BreadcrumbItem[] = [{ name: "Articles", href: "/articles" }];

  if (disasterType) {
    items.push({
      name: disasterType.charAt(0).toUpperCase() + disasterType.slice(1),
      href: `/disasters?type=${disasterType}`,
    });
  }

  if (articleTitle) {
    items.push({ name: articleTitle, current: true });
  }

  return <Breadcrumb items={items} />;
}

export function ProductBreadcrumb({
  category,
  productName,
}: {
  category?: string;
  productName?: string;
}) {
  const items: BreadcrumbItem[] = [{ name: "Products", href: "/products" }];

  if (category) {
    items.push({
      name: category
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      href: `/products/${category}`,
    });
  }

  if (productName) {
    items.push({ name: productName, current: true });
  }

  return <Breadcrumb items={items} />;
}

export function DisasterBreadcrumb({
  disasterType,
  disasterTitle,
}: {
  disasterType?: string;
  disasterTitle?: string;
}) {
  const items: BreadcrumbItem[] = [{ name: "Live Map", href: "/disasters" }];

  if (disasterType) {
    items.push({
      name: disasterType.charAt(0).toUpperCase() + disasterType.slice(1),
      href: `/disasters?type=${disasterType}`,
    });
  }

  if (disasterTitle) {
    items.push({ name: disasterTitle, current: true });
  }

  return <Breadcrumb items={items} />;
}

export default Breadcrumb;
