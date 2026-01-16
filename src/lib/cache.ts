/**
 * P1-4: Simple in-memory cache with TTL support
 * For production with multiple instances, consider using Redis or Vercel KV
 */

interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

// Clean up expired entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of cache.entries()) {
      if (entry.expiresAt < now) {
        cache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.debug(`[Cache] Cleaned up ${cleaned} expired entries`);
    }
  }, CLEANUP_INTERVAL);
}

// Start cleanup on module load
if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
  startCleanup();
}

export const cacheStore = {
  get<T = unknown>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;

    if (entry.expiresAt < Date.now()) {
      cache.delete(key);
      return null;
    }

    return entry.value as T;
  },

  set<T = unknown>(key: string, value: T, ttlSeconds: number): void {
    cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  delete(key: string): void {
    cache.delete(key);
  },

  clear(): void {
    cache.clear();
  },

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: cache.size,
      keys: Array.from(cache.keys()),
    };
  },

  // Check if a key exists and is not expired
  has(key: string): boolean {
    const entry = cache.get(key);
    if (!entry) return false;
    if (entry.expiresAt < Date.now()) {
      cache.delete(key);
      return false;
    }
    return true;
  },
};

// Re-export as named export "cache" for compatibility
// Note: Use cacheStore directly to avoid naming conflicts

// Cleanup on shutdown
if (typeof process !== "undefined") {
  process.on("beforeExit", () => {
    if (cleanupTimer) {
      clearInterval(cleanupTimer);
    }
  });
}
