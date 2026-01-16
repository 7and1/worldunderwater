import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

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

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function containsSpamKeywords(text: string): boolean {
  const spamKeywords = [
    "viagra",
    "cialis",
    "casino",
    "bitcoin",
    "crypto",
    "loan",
    "lottery",
    "winner",
    "porn",
    "xxx",
    "seo",
    "buy now",
    "click here",
    "act now",
    "limited time",
    "100% free",
  ];
  const lowerText = text.toLowerCase();
  return spamKeywords.some((keyword) => lowerText.includes(keyword));
}

async function sendContactNotification(
  data: ContactRequest & { ip?: string; userAgent?: string },
): Promise<{ success: boolean; error?: string }> {
  const siteUrl =
    process.env.PAYLOAD_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // TODO: Integrate with email provider (Resend, SendGrid, etc.)
  // For now, log the email that would be sent
  console.log(`
[EMAIL] New Contact Form Submission
To: hello@worldunderwater.org
Subject: Contact Form: ${data.subject ?? "No subject"}

From: ${data.name} <${data.email}>

${data.message}

---
Submitted from: ${siteUrl}
IP: ${data.ip ?? "unknown"}
  `);

  return { success: true };
}

async function logContactSubmission(
  data: ContactRequest & { ip?: string; userAgent?: string },
): Promise<void> {
  try {
    await query(
      `INSERT INTO contact_submissions (name, email, subject, message, ip, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        data.name,
        data.email,
        data.subject ?? null,
        data.message,
        data.ip ?? null,
        data.userAgent ?? null,
      ],
    );
  } catch (error) {
    // Log error but don't fail the request
    console.error("Failed to log contact submission:", error);
  }
}

interface ContactRequest {
  name: string;
  email: string;
  subject?: string;
  message: string;
  honeypot?: string;
  botCheck?: string;
  ip?: string;
  userAgent?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") ?? undefined;

  try {
    const body: ContactRequest = await request.json();
    body.ip = ip;
    body.userAgent = userAgent;

    // Honeypot check - if filled, it's a bot
    if (body.honeypot && body.honeypot.length > 0) {
      return NextResponse.json(
        { success: true, message: "Thank you for your message!" },
        { status: 200 },
      );
    }

    // Bot check - if "botCheck" is not empty, it's likely a bot
    if (body.botCheck && body.botCheck.length > 0) {
      return NextResponse.json(
        { success: true, message: "Thank you for your message!" },
        { status: 200 },
      );
    }

    // Validate required fields
    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Name must be at least 2 characters" },
        { status: 400 },
      );
    }

    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 },
      );
    }

    if (!body.message || body.message.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Message must be at least 10 characters" },
        { status: 400 },
      );
    }

    if (body.message.length > 5000) {
      return NextResponse.json(
        { success: false, error: "Message is too long (max 5000 characters)" },
        { status: 400 },
      );
    }

    // Spam detection
    if (
      containsSpamKeywords(body.message) ||
      containsSpamKeywords(body.subject ?? "")
    ) {
      // Silently reject spam attempts
      return NextResponse.json(
        { success: true, message: "Thank you for your message!" },
        { status: 200 },
      );
    }

    // Rate limit: 5 requests per day per IP
    const rateLimitResult = await checkRateLimit(
      `contact:${ip}`,
      5,
      24 * 60 * 60 * 1000,
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many messages sent. Please try again later.",
          resetAt: rateLimitResult.resetAt?.toISOString(),
        },
        { status: 429 },
      );
    }

    // Send email notification
    const emailResult = await sendContactNotification(body);
    if (!emailResult.success) {
      console.error("Failed to send contact notification:", emailResult.error);
    }

    // Log submission to database
    await logContactSubmission(body);

    const duration = Date.now() - startTime;
    console.log(
      `Contact form submission processed in ${duration}ms for ${body.email}`,
    );

    return NextResponse.json({
      success: true,
      message:
        "Thank you for your message! We will get back to you within 2 business days.",
    });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Create the contact_submissions table if it doesn't exist
async function ensureTableExists() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS contact_submissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        ip INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        INDEX idx_email (email),
        INDEX idx_created_at (created_at)
      )
    `);
  } catch (error) {
    console.error("Failed to create contact_submissions table:", error);
  }
}

// Initialize table on module load
ensureTableExists().catch(console.error);
