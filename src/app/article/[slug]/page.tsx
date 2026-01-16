import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleLayout from "@/components/article/ArticleLayout";
import { generateArticleMetadata } from "@/lib/seo/metadata";
import { getArticleBySlug, getLatestArticles } from "@/lib/data";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

// Generate static params for SSG
export async function generateStaticParams() {
  const articles = await getLatestArticles(50);
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  return generateArticleMetadata(article);
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <ArticleLayout article={article}>
      {/* Article content would be rendered here */}
      {/* In production, this would come from a CMS or markdown processing */}
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
    </ArticleLayout>
  );
}
