import { siteConfig } from "@/lib/seo/metadata";

interface RevalidateOptions {
  paths?: string[];
  tags?: string[];
}

export async function triggerRevalidation({
  paths = [],
  tags = [],
}: RevalidateOptions) {
  const token = process.env.REVALIDATE_TOKEN;
  if (!token) {
    console.warn("Revalidation skipped: missing REVALIDATE_TOKEN");
    return;
  }

  const baseUrl =
    process.env.REVALIDATE_URL || `${siteConfig.siteUrl}/api/revalidate`;

  try {
    await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: token, paths, tags }),
    });
  } catch (error) {
    console.warn("Revalidation request failed:", error);
  }
}
