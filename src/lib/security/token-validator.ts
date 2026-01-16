/**
 * Cryptographically secure token validation utilities
 * Uses timing-safe comparison and HMAC signature verification
 */

import type { NextRequest } from "next/server";

/**
 * Timing-safe string comparison to prevent timing attacks
 * Always compares full length regardless of where the mismatch occurs
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  // Use crypto.subtle for constant-time comparison
  const encoder = new TextEncoder();
  const bufferA = encoder.encode(a);
  const bufferB = encoder.encode(b);

  // XOR all bytes and check if any differ
  let result = 0;
  for (let i = 0; i < bufferA.length; i++) {
    result |= bufferA[i]! ^ bufferB[i]!;
  }

  return result === 0;
}

/**
 * Validates an HMAC-signed token
 * Format: base64(timestamp) + "." + base64(hmac(timestamp + secret))
 *
 * This prevents replay attacks when combined with timestamp checks
 */
export async function validateHMACToken(
  token: string,
  secret: string,
  maxAgeMs: number = 5 * 60 * 1000, // 5 minutes default
): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) {
      return false;
    }

    const [timestampB64, signature] = parts;
    const timestampStr = atob(timestampB64);
    const timestamp = parseInt(timestampStr, 10);

    // Check timestamp isn't too old (replay protection)
    const now = Date.now();
    if (
      isNaN(timestamp) ||
      timestamp < now - maxAgeMs ||
      timestamp > now + maxAgeMs
    ) {
      return false;
    }

    // Verify HMAC signature
    const data = timestampStr;
    const expectedSignature = await crypto.subtle.sign(
      "HMAC",
      await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      ),
      new TextEncoder().encode(data),
    );

    // Convert signature to base64 for comparison
    const expectedB64 = btoa(
      String.fromCharCode.apply(
        null,
        Array.from(new Uint8Array(expectedSignature)),
      ),
    );

    return timingSafeEqual(signature, expectedB64);
  } catch {
    return false;
  }
}

/**
 * Generate an HMAC-signed token for testing/development
 * In production, tokens should be generated server-side with proper secrets
 */
export async function generateHMACToken(secret: string): Promise<string> {
  const timestamp = Date.now().toString();
  const signature = await crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    ),
    new TextEncoder().encode(timestamp),
  );

  const signatureB64 = btoa(
    String.fromCharCode.apply(null, Array.from(new Uint8Array(signature))),
  );

  return `${btoa(timestamp)}.${signatureB64}`;
}

/**
 * Validate request origin against allowed origins
 * Prevents CSRF attacks from unauthorized domains
 */
export function validateOrigin(
  request: NextRequest,
  allowedOrigins: string[] | string,
): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // If no origin/referer, allow for direct API calls (server-to-server)
  if (!origin && !referer) {
    return true;
  }

  const allowed = Array.isArray(allowedOrigins)
    ? allowedOrigins
    : [allowedOrigins];

  // Check origin against allowed list
  if (origin) {
    try {
      const originUrl = new URL(origin);
      return allowed.some((allowed) => {
        if (allowed === "*") return true;
        const allowedUrl = new URL(allowed);
        return originUrl.hostname === allowedUrl.hostname;
      });
    } catch {
      return false;
    }
  }

  // Fallback to referer check
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return allowed.some((allowed) => {
        if (allowed === "*") return true;
        const allowedUrl = new URL(allowed);
        return refererUrl.hostname === allowedUrl.hostname;
      });
    } catch {
      return false;
    }
  }

  return true;
}
