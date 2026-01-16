/**
 * Sliding Window Rate Limiter
 * Prevents brute force and DoS attacks on API endpoints
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Sliding window rate limiter using in-memory storage
 * For production, consider using Redis for distributed rate limiting
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const entry = limitStore.get(identifier);

  // Clean up expired entries
  if (entry && now > entry.resetAt) {
    limitStore.delete(identifier);
  }

  const current = limitStore.get(identifier) || {
    count: 0,
    resetAt: now + config.windowMs,
  };

  if (now >= current.resetAt) {
    // Window expired, start fresh
    current.count = 1;
    current.resetAt = now + config.windowMs;
  } else if (current.count >= config.limit) {
    // Rate limit exceeded
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      resetAt: current.resetAt,
    };
  } else {
    current.count++;
  }

  limitStore.set(identifier, current);

  return {
    allowed: true,
    limit: config.limit,
    remaining: config.limit - current.count,
    resetAt: current.resetAt,
  };
}

/**
 * Extract client identifier from request
 * Uses X-Forwarded-For header if available (for proxied requests)
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0].trim() || realIp || "unknown";
  return `ratelimit:${ip}`;
}
