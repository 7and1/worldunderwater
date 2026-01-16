import { NextRequest, NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/data/payload";
import { headers } from "next/headers";

export const runtime = "nodejs";

// Rate limiting store (in-memory for development, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0].trim() ?? realIp ?? "unknown";
}

async function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ allowed: boolean; resetAt?: Date }> {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, resetAt: new Date(record.resetTime) };
  }

  record.count++;
  return { allowed: true };
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Send confirmation email
async function sendConfirmationEmail(
  email: string,
  token: string,
): Promise<void> {
  const confirmUrl = `${process.env.PAYLOAD_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/subscribe/confirm?token=${token}`;

  // TODO: Integrate with email provider (Resend, SendGrid, etc.)
  // For now, log the email that would be sent
  console.log(`
[EMAIL] Confirmation Email
To: ${email}
Subject: Confirm your subscription to World Under Water

<!DOCTYPE html>
<html>
<body>
  <h1>Confirm Your Subscription</h1>
  <p>Please click the link below to confirm your subscription to World Under Water disaster alerts:</p>
  <a href="${confirmUrl}">Confirm Subscription</a>
  <p>This link will expire in 48 hours.</p>
</body>
</html>
  `);
}

interface SubscribeRequest {
  email: string;
  name?: string;
  honeypot?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SubscribeRequest = await request.json();
    const ip = getClientIp(request);

    // Honeypot check - if filled, it's a bot
    if (body.honeypot && body.honeypot.length > 0) {
      // Return success to bots to not alert them
      return NextResponse.json(
        { success: true, message: "Thank you for subscribing!" },
        { status: 200 },
      );
    }

    // Validate email
    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 },
      );
    }

    // Rate limit: 3 requests per hour per IP
    const rateLimitResult = await checkRateLimit(
      `subscribe:${ip}`,
      3,
      60 * 60 * 1000,
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many subscription attempts. Please try again later.",
          resetAt: rateLimitResult.resetAt?.toISOString(),
        },
        { status: 429 },
      );
    }

    const payload = await getPayloadClient();
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    // Check if subscriber already exists
    const existing = await payload.find({
      collection: "subscribers",
      where: { email: { equals: body.email } },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      const subscriber = existing.docs[0] as { status?: string };
      if (subscriber.status === "active") {
        return NextResponse.json(
          { success: false, error: "Email is already subscribed" },
          { status: 409 },
        );
      }
      if (subscriber.status === "unsubscribed") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Email was previously unsubscribed. Please contact support to re-subscribe.",
          },
          { status: 400 },
        );
      }
      // If pending, resend confirmation
    }

    // Create or update subscriber
    const confirmationToken = crypto.randomUUID();
    const tokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    if (existing.docs.length === 0) {
      await payload.create({
        collection: "subscribers",
        data: {
          email: body.email,
          name: body.name ?? null,
          status: "pending",
          confirmationToken,
        },
      });
    } else {
      await payload.update({
        collection: "subscribers",
        where: { email: { equals: body.email } },
        data: {
          status: "pending",
          confirmationToken,
        },
      });
    }

    // Send confirmation email
    await sendConfirmationEmail(body.email, confirmationToken);

    return NextResponse.json({
      success: true,
      message: "Please check your email to confirm your subscription",
    });
  } catch (error) {
    console.error("Subscribe API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
