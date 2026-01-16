/**
 * Circuit Breaker Pattern
 *
 * Additional Scalability Improvement #6
 * - For external API calls
 * - Open circuit after N failures
 * - Half-open state for testing recovery
 * - Auto-close after success
 */

export enum CircuitState {
  CLOSED = "closed",
  OPEN = "open",
  HALF_OPEN = "half_open",
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  successThreshold?: number;
  timeoutMs?: number;
  halfOpenMaxCalls?: number;
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  lastStateChange?: Date;
  rejectionCount: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: Date;
  private lastStateChange: Date = new Date();
  private rejectionCount: number = 0;
  private halfOpenCalls: number = 0;

  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly timeoutMs: number;
  private readonly halfOpenMaxCalls: number;
  private readonly onStateChange?: (
    from: CircuitState,
    to: CircuitState,
  ) => void;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.successThreshold = options.successThreshold ?? 2;
    this.timeoutMs = options.timeoutMs ?? 60000; // 1 minute
    this.halfOpenMaxCalls = options.halfOpenMaxCalls ?? 3;
    this.onStateChange = options.onStateChange;
  }

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        this.rejectionCount++;
        throw new CircuitBreakerOpenError(
          "Circuit breaker is OPEN. Rejecting request.",
          this.getStats(),
        );
      }
    }

    if (
      this.state === CircuitState.HALF_OPEN &&
      this.halfOpenCalls >= this.halfOpenMaxCalls
    ) {
      this.rejectionCount++;
      throw new CircuitBreakerOpenError(
        "Circuit breaker is HALF_OPEN and at max calls. Rejecting request.",
        this.getStats(),
      );
    }

    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCalls++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
        this.successCount = 0;
        this.halfOpenCalls = 0;
      }
    } else if (this.state === CircuitState.CLOSED) {
      this.successCount++;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
      this.halfOpenCalls = 0;
    } else if (
      this.state === CircuitState.CLOSED &&
      this.failureCount >= this.failureThreshold
    ) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  /**
   * Check if we should attempt to reset the circuit
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.timeoutMs;
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.lastStateChange = new Date();
      console.log(
        `[CircuitBreaker] State transition: ${oldState} -> ${newState}`,
      );
      this.onStateChange?.(oldState, newState);
    }
  }

  /**
   * Get current circuit breaker stats
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
      rejectionCount: this.rejectionCount,
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.transitionTo(CircuitState.CLOSED);
    this.failureCount = 0;
    this.successCount = 0;
    this.rejectionCount = 0;
    this.halfOpenCalls = 0;
    this.lastFailureTime = undefined;
  }

  /**
   * Manually open the circuit breaker
   */
  open(): void {
    this.transitionTo(CircuitState.OPEN);
  }
}

export class CircuitBreakerOpenError extends Error {
  public readonly stats: CircuitBreakerStats;

  constructor(message: string, stats: CircuitBreakerStats) {
    super(message);
    this.name = "CircuitBreakerOpenError";
    this.stats = stats;
  }
}

/**
 * Create a circuit breaker for a specific service
 */
export function createCircuitBreaker(
  name: string,
  options: CircuitBreakerOptions = {},
): CircuitBreaker {
  const breaker = new CircuitBreaker({
    ...options,
    onStateChange: (from, to) => {
      console.log(`[CircuitBreaker:${name}] State changed: ${from} -> ${to}`);
      options.onStateChange?.(from, to);
    },
  });
  return breaker;
}
