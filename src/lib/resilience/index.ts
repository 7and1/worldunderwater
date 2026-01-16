/**
 * Resilience Patterns Module
 *
 * P1-12 and Additional Scalability #6
 */

export {
  withRetry,
  createRetry,
  isTransientError,
  getRateLimitRetryAfter,
  type RetryOptions,
  type RetryResult,
} from "./retry";

export {
  CircuitBreaker,
  CircuitBreakerOpenError,
  createCircuitBreaker,
  type CircuitBreakerOptions,
  type CircuitBreakerStats,
  type CircuitState,
} from "./circuit-breaker";
