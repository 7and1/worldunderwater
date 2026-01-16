import { NextResponse } from "next/server";
import { generateRobotsTxt } from "@/lib/seo/sitemap";

export const revalidate = 86400;

export async function GET() {
  const content = generateRobotsTxt();
  return new NextResponse(content, {
    headers: { "Content-Type": "text/plain" },
  });
}
