import { NextRequest, NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/data/payload";
import { rateLimit, getClientIdentifier } from "@/lib/security/rate-limiter";

export const runtime = "nodejs";

// SECURITY: Rate limit subscription confirmations to prevent token enumeration attacks
// 10 requests per hour per IP is generous for legitimate users but prevents abuse
const RATE_LIMIT_CONFIG = { limit: 10, windowMs: 60 * 60 * 1000 };

interface ConfirmRequest {
  token: string;
}

export async function GET(request: NextRequest) {
  // SECURITY: Apply rate limiting before processing
  const identifier = getClientIdentifier(request);
  const rateLimitResult = rateLimit(identifier, RATE_LIMIT_CONFIG);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: "Too many confirmation attempts. Please try again later.",
        resetAt: rateLimitResult.resetAt,
      },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing confirmation token" },
        { status: 400 },
      );
    }

    const payload = await getPayloadClient();
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    // Find subscriber with this token
    const result = await payload.find({
      collection: "subscribers",
      where: { confirmationToken: { equals: token } },
      limit: 1,
    });

    if (result.docs.length === 0) {
      return NextResponse.redirect(
        new URL("/subscribe?error=invalid_token", request.url),
      );
    }

    const subscriber = result.docs[0] as { id: string; status: string };

    // Check if already confirmed
    if ((subscriber.status as string) === "active") {
      return NextResponse.redirect(
        new URL("/subscribe?status=already_confirmed", request.url),
      );
    }

    // Confirm subscription
    await payload.update({
      collection: "subscribers",
      id: subscriber.id as string,
      data: {
        status: "active",
        confirmedAt: new Date().toISOString(),
        confirmationToken: null,
      },
    });

    return NextResponse.redirect(
      new URL("/subscribe?status=confirmed", request.url),
    );
  } catch (error) {
    console.error("Confirm subscription error:", error);
    return NextResponse.redirect(
      new URL("/subscribe?error=server_error", request.url),
    );
  }
}
