import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { rateLimit, getClientIdentifier } from "@/lib/security/rate-limiter";
import {
  timingSafeEqual,
  validateHMACToken,
  validateOrigin,
} from "@/lib/security/token-validator";

// Rate limiting: 10 requests per minute per IP
const RATE_LIMIT_CONFIG = {
  limit: 10,
  windowMs: 60 * 1000, // 1 minute
};

// Allowed origins for revalidation requests
// In production, set REVALIDATE_ALLOWED_ORIGINS env var with comma-separated domains
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.REVALIDATE_ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(",").map((s) => s.trim());
  }
  // Default to local and same-origin
  return [process.env.PAYLOAD_PUBLIC_SITE_URL || "http://localhost:3000"];
}

export async function POST(request: NextRequest) {
  // Security: Rate limiting to prevent DoS
  const clientId = getClientIdentifier(request);
  const rateLimitResult = rateLimit(clientId, RATE_LIMIT_CONFIG);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        ok: false,
        message: "Too many requests. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(rateLimitResult.resetAt).toISOString(),
          "Retry-After": Math.ceil(
            (rateLimitResult.resetAt - Date.now()) / 1000,
          ).toString(),
        },
      },
    );
  }

  // Security: Origin validation to prevent CSRF
  const allowedOrigins = getAllowedOrigins();
  if (!validateOrigin(request, allowedOrigins)) {
    return NextResponse.json(
      { ok: false, message: "Forbidden - Invalid origin" },
      { status: 403 },
    );
  }

  const secret = process.env.REVALIDATE_TOKEN;
  if (!secret) {
    return NextResponse.json(
      { ok: false, message: "Server configuration error" },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const providedToken =
    body?.secret || body?.token || request.nextUrl.searchParams.get("secret");

  if (!providedToken) {
    return NextResponse.json(
      { ok: false, message: "Missing token" },
      { status: 401 },
    );
  }

  // Security: Try HMAC token validation first (more secure)
  // Falls back to timing-safe string comparison for backward compatibility
  let isValid = false;

  // Check if token is HMAC-signed (format: base64.base64)
  if (providedToken.includes(".")) {
    isValid = await validateHMACToken(
      providedToken,
      secret,
      5 * 60 * 1000, // 5 minute max age
    );
  } else {
    // Fallback: timing-safe comparison prevents timing attacks
    isValid = timingSafeEqual(providedToken, secret);
  }

  if (!isValid) {
    return NextResponse.json(
      { ok: false, message: "Invalid token" },
      { status: 401 },
    );
  }

  // Parse paths and tags from request
  const paths = Array.isArray(body?.paths)
    ? body.paths
    : body?.path
      ? [body.path]
      : [];
  const tags = Array.isArray(body?.tags) ? body.tags : [];

  const revalidated: string[] = [];
  const tagRevalidated: string[] = [];

  for (const path of paths) {
    if (typeof path === "string" && path.length > 0) {
      // Security: Validate path format to prevent path traversal
      if (path.startsWith("/") && !path.includes("..")) {
        revalidatePath(path);
        revalidated.push(path);
      }
    }
  }

  for (const tag of tags) {
    if (typeof tag === "string" && tag.length > 0) {
      // Security: Validate tag format (alphanumeric, hyphens, underscores only)
      if (/^[a-zA-Z0-9_-]+$/.test(tag)) {
        revalidateTag(tag);
        tagRevalidated.push(tag);
      }
    }
  }

  return NextResponse.json(
    {
      ok: true,
      revalidated,
      tags: tagRevalidated,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "X-RateLimit-Limit": RATE_LIMIT_CONFIG.limit.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": new Date(rateLimitResult.resetAt).toISOString(),
      },
    },
  );
}
