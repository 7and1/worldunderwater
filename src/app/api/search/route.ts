import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIdentifier } from "@/lib/security/rate-limiter";
import { search, clearSearchIndex } from "@/lib/search";
import type {
  SearchQuery,
  SearchResponse,
  SearchResultType,
} from "@/types/search.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_CONFIG = { limit: 20, windowMs: 60 * 1000 };

interface SearchRequest {
  q?: string;
  page?: number;
  limit?: number;
  filters?: SearchQuery["filters"];
}

function parseFilters(url: URL): SearchQuery["filters"] {
  const types = url.searchParams.get("types")?.split(",") as
    | SearchResultType[]
    | undefined;
  const disasterTypes = url.searchParams
    .get("disasterTypes")
    ?.split(",")
    .filter(Boolean);
  const productCategories = url.searchParams
    .get("categories")
    ?.split(",")
    .filter(Boolean);
  const dateFrom = url.searchParams.get("dateFrom") || undefined;
  const dateTo = url.searchParams.get("dateTo") || undefined;

  return {
    types,
    disasterTypes: disasterTypes?.length ? disasterTypes : undefined,
    productCategories: productCategories?.length
      ? productCategories
      : undefined,
    dateFrom,
    dateTo,
  };
}

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimitResult = rateLimit(identifier, RATE_LIMIT_CONFIG);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        resetAt: rateLimitResult.resetAt,
      },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json<SearchResponse>({
        results: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasMore: false,
        query: "",
        filters: {},
      });
    }

    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)),
    );
    const filters = parseFilters(url) ?? {};

    const { results, total, suggestions } = await search(
      query,
      filters,
      page,
      limit,
    );

    return NextResponse.json<SearchResponse>({
      results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
      query,
      filters,
      suggestions,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimitResult = rateLimit(identifier, RATE_LIMIT_CONFIG);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const body: SearchRequest = await request.json();
    const query = body.q || "";

    if (!query.trim()) {
      return NextResponse.json<SearchResponse>({
        results: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasMore: false,
        query: "",
        filters: {},
      });
    }

    const page = Math.max(1, body.page || 1);
    const limit = Math.min(50, Math.max(1, body.limit || 20));
    const filters = body.filters || {};

    const { results, total, suggestions } = await search(
      query,
      filters,
      page,
      limit,
    );

    return NextResponse.json<SearchResponse>({
      results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
      query,
      filters,
      suggestions,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// SECURITY: DELETE method removed - clearing search index requires authentication
// Use admin API endpoints or server-side scripts for index management
// The clearSearchIndex function is still available for authenticated admin routes
