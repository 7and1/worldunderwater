/**
 * Request Debouncer
 *
 * Additional Scalability Improvement #5
 * - Debounce frequent identical requests
 * - Cache in-progress requests
 * - Prevent thundering herd
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
  refCount: number;
}

interface DebouncerOptions {
  ttlMs?: number;
  maxCacheSize?: number;
  cleanupIntervalMs?: number;
}

export class RequestDebouncer {
  private pending: Map<string, PendingRequest<unknown>> = new Map();
  private completed: Map<string, { result: unknown; timestamp: number }> =
    new Map();
  private readonly ttlMs: number;
  private readonly maxCacheSize: number;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: DebouncerOptions = {}) {
    this.ttlMs = options.ttlMs ?? 5000;
    this.maxCacheSize = options.maxCacheSize ?? 1000;

    this.cleanupTimer = setInterval(
      () => this.cleanup(),
      options.cleanupIntervalMs ?? 60000,
    ).unref();
  }

  async execute<T>(
    key: string,
    fn: () => Promise<T>,
    options: { skipCache?: boolean; ttlMs?: number } = {},
  ): Promise<T> {
    if (!options.skipCache) {
      const cached = this.completed.get(key);
      const ttl = options.ttlMs ?? this.ttlMs;
      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.result as T;
      }
    }

    const existing = this.pending.get(key);
    if (existing && Date.now() - existing.timestamp < this.ttlMs) {
      existing.refCount++;
      return existing.promise as Promise<T>;
    }

    const promise = fn()
      .then((result) => {
        this.cacheResult(key, result);
        this.pending.delete(key);
        return result;
      })
      .catch((error) => {
        this.pending.delete(key);
        throw error;
      });

    this.pending.set(key, {
      promise,
      timestamp: Date.now(),
      refCount: 1,
    });

    this.enforceMaxSize();

    return promise;
  }

  private cacheResult(key: string, result: unknown): void {
    this.completed.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  private cleanup(): void {
    const now = Date.now();

    for (const [key, value] of this.pending.entries()) {
      if (now - value.timestamp > this.ttlMs && value.refCount <= 1) {
        this.pending.delete(key);
      }
    }

    for (const [key, value] of this.completed.entries()) {
      if (now - value.timestamp > this.ttlMs) {
        this.completed.delete(key);
      }
    }
  }

  private enforceMaxSize(): void {
    if (this.completed.size <= this.maxCacheSize) return;

    const entries = Array.from(this.completed.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp,
    );

    const toRemove = entries.slice(0, this.completed.size - this.maxCacheSize);
    for (const [key] of toRemove) {
      this.completed.delete(key);
    }
  }

  clear(): void {
    this.pending.clear();
    this.completed.clear();
  }

  invalidate(key: string): void {
    this.pending.delete(key);
    this.completed.delete(key);
  }

  invalidatePattern(pattern: RegExp): void {
    for (const key of this.pending.keys()) {
      if (pattern.test(key)) {
        this.pending.delete(key);
      }
    }
    for (const key of this.completed.keys()) {
      if (pattern.test(key)) {
        this.completed.delete(key);
      }
    }
  }

  getStats() {
    return {
      pending: this.pending.size,
      completed: this.completed.size,
      ttlMs: this.ttlMs,
    };
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}

let globalDebouncer: RequestDebouncer | null = null;

export function getGlobalDebouncer(): RequestDebouncer {
  if (!globalDebouncer) {
    globalDebouncer = new RequestDebouncer();
  }
  return globalDebouncer;
}

export function destroyGlobalDebouncer(): void {
  if (globalDebouncer) {
    globalDebouncer.destroy();
    globalDebouncer = null;
  }
}
