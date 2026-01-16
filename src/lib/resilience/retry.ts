/**
 * Retry Logic with Exponential Backoff and Jitter
 *
 * P1-12: Ingestion Pipeline Retry Logic
 * - Exponential backoff with jitter
 * - Max retry attempts (configurable 3-5)
 * - Distinguish transient vs permanent errors
 * - Track retry count in logs
 * - Back off when rate limited
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterFactor?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDurationMs: number;
}

export function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const statusCode = extractStatusCode(error);

  const transientPatterns = [
    /econnreset/,
    /etimedout/,
    /enotfound/,
    /eai_again/,
    /econnrefused/,
    /socket hang up/,
    /network error/,
    /fetch failed/,
  ];

  const transientStatusCodes = [408, 429, 500, 502, 503, 504];

  const rateLimitPatterns = [
    /rate limit/i,
    /too many requests/i,
    /throttle/i,
    /quota exceeded/i,
  ];

  if (statusCode && transientStatusCodes.includes(statusCode)) {
    return true;
  }

  if (transientPatterns.some((pattern) => pattern.test(error.message))) {
    return true;
  }

  if (rateLimitPatterns.some((pattern) => pattern.test(message))) {
    return true;
  }

  return false;
}

function extractStatusCode(error: Error): number | null {
  const statusMatch = error.message.match(/status (\d{3})/);
  if (statusMatch) {
    return Number.parseInt(statusMatch[1], 10);
  }

  const err = error as { status?: number; statusCode?: number };
  return err.status ?? err.statusCode ?? null;
}

function calculateDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  jitterFactor: number,
): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
  const jitter = cappedDelay * jitterFactor * (Math.random() * 2 - 1);
  const delay = Math.max(baseDelayMs, cappedDelay + jitter);
  return Math.round(delay);
}

export function getRateLimitRetryAfter(error: Error): number | null {
  const err = error as { headers?: { get?: (name: string) => string | null } };

  const retryAfter = err.headers?.get?.("Retry-After");
  if (retryAfter) {
    const seconds = Number.parseInt(retryAfter, 10);
    if (!Number.isNaN(seconds)) {
      return seconds * 1000;
    }
    const date = new Date(retryAfter);
    if (!Number.isNaN(date.getTime())) {
      return date.getTime() - Date.now();
    }
  }

  const retryMatch = error.message.match(/retry after (\d+)/i);
  if (retryMatch) {
    return Number.parseInt(retryMatch[1], 10) * 1000;
  }

  return null;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<RetryResult<T>> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const maxDelayMs = options.maxDelayMs ?? 30000;
  const jitterFactor = options.jitterFactor ?? 0.25;

  let lastError: Error | undefined;
  const startTime = Date.now();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const data = await fn();
      return {
        success: true,
        data,
        attempts: attempt + 1,
        totalDurationMs: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isTransientError(lastError)) {
        return {
          success: false,
          error: lastError,
          attempts: attempt + 1,
          totalDurationMs: Date.now() - startTime,
        };
      }

      if (attempt >= maxAttempts - 1) {
        return {
          success: false,
          error: new Error(
            "Max retries (" +
              maxAttempts +
              ") exceeded. Last error: " +
              lastError.message,
          ),
          attempts: maxAttempts,
          totalDurationMs: Date.now() - startTime,
        };
      }

      let delayMs = calculateDelay(
        attempt,
        baseDelayMs,
        maxDelayMs,
        jitterFactor,
      );

      const rateLimitDelay = getRateLimitRetryAfter(lastError);
      if (rateLimitDelay !== null) {
        delayMs = Math.max(delayMs, rateLimitDelay);
        console.warn(
          "[Retry] Rate limited. Waiting " + delayMs + "ms before retry.",
        );
      }

      options.onRetry?.(attempt + 1, lastError);

      console.warn(
        "[Retry] Attempt " +
          (attempt + 1) +
          "/" +
          maxAttempts +
          " failed: " +
          lastError.message +
          ". Retrying in " +
          delayMs +
          "ms...",
      );

      await sleep(delayMs);
    }
  }

  return {
    success: false,
    error: lastError ?? new Error("Unknown error"),
    attempts: maxAttempts,
    totalDurationMs: Date.now() - startTime,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createRetry<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  options: RetryOptions = {},
): (...args: T) => Promise<RetryResult<R>> {
  return (...args: T) => withRetry(() => fn(...args), options);
}
