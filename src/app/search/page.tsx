import StaticPageLayout from "@/components/layout/StaticPageLayout";
import SearchPageClient from "./SearchPageClient";

interface SearchPageProps {
  searchParams?: Promise<{ q?: string; tag?: string }>;
}

export const metadata = {
  title: "Search",
  description: "Search disaster coverage and preparedness guidance.",
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const initialQuery = params?.q || params?.tag || "";

  return (
    <StaticPageLayout
      title="Search"
      subtitle="Find disaster coverage, guides, and preparedness tips."
      kicker="Explore"
    >
      <SearchPageClient initialQuery={initialQuery} />
    </StaticPageLayout>
  );
}
