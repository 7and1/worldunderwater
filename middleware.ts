import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "wuw_ab";

/**
 * SECURITY HEADERS CONFIGURATION
 * These headers protect against XSS, clickjacking, and other attacks
 */
const SECURITY_HEADERS = {
  // Content Security Policy - Restricts sources for content to prevent XSS
  // Allows same-origin, inline scripts for Next.js, and common external services
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.usefathom.com https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.usefathom.com https://static.cloudflareinsights.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),

  // Prevents clickjacking attacks
  "X-Frame-Options": "DENY",

  // Prevents MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Controls referrer information sent on navigation
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Restricts browser features and APIs
  "Permissions-Policy": [
    "camera=()",
    "microphone=()",
    "geolocation=(self)",
    "payment=()",
  ].join(", "),

  // HTTPS enforcement (only applied on HTTPS connections)
  // max-age of 1 year with includeSubDomains for full coverage
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

  // Cross-origin policies
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
    // Only apply HSTS on HTTPS connections
    if (
      header === "Strict-Transport-Security" &&
      request.headers.get("x-forwarded-proto") !== "https"
    ) {
      return;
    }
    response.headers.set(header, value);
  });

  // A/B testing cookie
  const existing = request.cookies.get(COOKIE_NAME)?.value;

  if (!existing) {
    const variant = Math.random() < 0.5 ? "A" : "B";
    response.cookies.set(COOKIE_NAME, variant, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*|api).*)"],
};
