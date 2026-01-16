import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getRecentDisasters } from "@/lib/data";
import { cacheStore } from "@/lib/cache";
import { rateLimit, getClientIdentifier } from "@/lib/security/rate-limiter";
import {
  validateGeoQuery,
  formatValidationErrors,
} from "@/lib/validation/schemas";

const DEFAULT_RADIUS_KM = 50;
const MAX_RADIUS_KM = 500;

// P1-4: Cache duration in seconds (5 minutes for risk data)
const RISK_CACHE_TTL = 300;
// P1-4: Stale-while-revalidate time (serve stale for 2 minutes while revalidating)
const STALE_WHILE_REVALIDATE = 120;

// P0-3: Rate limiting to prevent abuse
const RATE_LIMIT_CONFIG = {
  limit: 60,
  windowMs: 60 * 1000, // 1 minute
};

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// P1-4: Generate ETag from request parameters for conditional caching
function generateETag(lat: number, lon: number, radiusKm: number): string {
  return `risk-${lat.toFixed(4)}-${lon.toFixed(4)}-${radiusKm}-${Math.floor(Date.now() / RISK_CACHE_TTL / 1000)}`;
}

/**
 * GET /api/risk?lat={number}&lon={number}&radiusKm={number}
 *
 * Returns disaster risk assessment for a geographic location.
 *
 * Security measures:
 * - IP-based rate limiting (60 req/min)
 * - Input validation with range checks (lat: -90 to 90, lon: -180 to 180, radius: 1-500km)
 * - SQL injection prevention via parameterized queries
 * - ETag support for conditional requests
 */
export async function GET(request: NextRequest) {
  // P0-3: Rate limiting to prevent abuse
  const clientId = getClientIdentifier(request);
  const rateLimitResult = rateLimit(clientId, RATE_LIMIT_CONFIG);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        ok: false,
        message: "Rate limit exceeded. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": RATE_LIMIT_CONFIG.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(rateLimitResult.resetAt).toISOString(),
          "Retry-After": Math.ceil(
            (rateLimitResult.resetAt - Date.now()) / 1000,
          ).toString(),
        },
      },
    );
  }

  // P0-5: Input validation with range checks
  const { searchParams } = new URL(request.url);
  const validation = validateGeoQuery(searchParams);

  if (!validation.success || !validation.data) {
    return NextResponse.json(
      {
        ok: false,
        message: formatValidationErrors(validation.errors || []),
      },
      { status: 400 },
    );
  }

  const { lat, lon, radiusKm } = validation.data;

  // P1-4: Check cache first
  const cacheKey = `risk:${lat.toFixed(4)}:${lon.toFixed(4)}:${radiusKm}`;
  const cached = await cacheStore.get(cacheKey);
  const currentETag = generateETag(lat, lon, radiusKm);

  // P1-4: Return 304 if client has cached version
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch === currentETag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        "X-RateLimit-Limit": RATE_LIMIT_CONFIG.limit.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": new Date(rateLimitResult.resetAt).toISOString(),
      },
    });
  }

  // P1-4: Return cached data if available
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": `public, max-age=${RISK_CACHE_TTL}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`,
        ETag: currentETag,
        "X-RateLimit-Limit": RATE_LIMIT_CONFIG.limit.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": new Date(rateLimitResult.resetAt).toISOString(),
      },
    });
  }

  try {
    const meters = radiusKm * 1000;
    // Security: Parameterized query prevents SQL injection
    const result = await query(
      `SELECT
         id,
         title,
         source,
         source_url,
         occurred_at,
         event_type,
         severity,
         ST_Distance(coordinates, ST_MakePoint($1, $2)::geography) as distance_m
       FROM raw_events
       WHERE coordinates IS NOT NULL
         AND occurred_at > NOW() - INTERVAL '30 days'
         AND ST_DWithin(coordinates, ST_MakePoint($1, $2)::geography, $3)
       ORDER BY distance_m ASC
       LIMIT 20`,
      [lon, lat, meters],
    );

    const events = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      source: row.source,
      sourceUrl: row.source_url,
      occurredAt: row.occurred_at,
      type: row.event_type,
      severity: row.severity,
      distanceKm: Math.round((row.distance_m / 1000) * 10) / 10,
    }));

    const riskLevel = events.some((event: any) =>
      ["severe", "catastrophic"].includes(event.severity),
    )
      ? "high"
      : events.length > 0
        ? "elevated"
        : "low";

    const responseData = { ok: true, riskLevel, events };

    // P1-4: Cache the response
    await cacheStore.set(cacheKey, responseData, RISK_CACHE_TTL);

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": `public, max-age=${RISK_CACHE_TTL}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`,
        ETag: currentETag,
        "X-RateLimit-Limit": RATE_LIMIT_CONFIG.limit.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": new Date(rateLimitResult.resetAt).toISOString(),
      },
    });
  } catch (error) {
    // Fallback to external API if database fails
    const disasters = await getRecentDisasters(300);
    const events = disasters
      .map((disaster) => ({
        ...disaster,
        distanceKm: haversineDistance(
          lat,
          lon,
          disaster.location.lat,
          disaster.location.lng,
        ),
      }))
      .filter((disaster) => disaster.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 20);

    const riskLevel = events.some((event) =>
      ["emergency", "catastrophic"].includes(event.severity),
    )
      ? "high"
      : events.length > 0
        ? "elevated"
        : "low";

    return NextResponse.json(
      {
        ok: true,
        riskLevel,
        events: events.map((event) => ({
          id: event.id,
          title: event.title,
          source: event.source,
          sourceUrl: event.sourceUrl,
          occurredAt: event.startDate,
          type: event.type,
          severity: event.severity,
          distanceKm: Math.round(event.distanceKm * 10) / 10,
        })),
        fallback: true,
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
}
