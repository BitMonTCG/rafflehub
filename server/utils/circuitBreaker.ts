/**
 * A simple circuit breaker implementation for external service calls
 * 
 * Helps prevent cascading failures when external dependencies are unavailable
 * by failing fast and providing controlled fallback behavior.
 */

// Circuit states
enum CircuitState {
  CLOSED, // Normal operation - requests pass through
  OPEN,   // Failing - requests are immediately rejected
  HALF_OPEN // Testing - allowing limited requests to test recovery
}

interface CircuitBreakerOptions {
  failureThreshold: number;    // Number of failures before opening circuit
  resetTimeout: number;        // Time in ms to wait before trying again (HALF_OPEN)
  maxHalfOpenCalls: number;    // Max calls allowed in HALF_OPEN state
  timeout?: number;            // Optional timeout for function calls in ms
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttempt: number = Date.now();
  private halfOpenCalls: number = 0;
  private readonly options: CircuitBreakerOptions;
  private readonly name: string;

  constructor(name: string, options: Partial<CircuitBreakerOptions> = {}) {
    this.name = name;
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 30000, // 30 seconds
      maxHalfOpenCalls: options.maxHalfOpenCalls || 1,
      timeout: options.timeout
    };
  }

  /**
   * Executes a function with circuit breaker protection
   * @param fn The function to execute
   * @param fallback Optional fallback function if circuit is open or call fails
   * @returns The result of fn or fallback
   */
  async execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      if (this.canTry()) {
        return this.tryHalfOpen(fn, fallback);
      }
      return this.handleRejection(fallback);
    }

    try {
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.options.timeout) {
      return fn();
    }

    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(`Circuit ${this.name}: Operation timed out after ${this.options.timeout}ms`)), 
          this.options.timeout);
      })
    ]);
  }

  private isOpen(): boolean {
    return this.state === CircuitState.OPEN || this.state === CircuitState.HALF_OPEN;
  }

  private canTry(): boolean {
    if (this.state === CircuitState.OPEN && Date.now() > this.nextAttempt) {
      this.state = CircuitState.HALF_OPEN;
      this.halfOpenCalls = 0;
      return true;
    }

    return this.state === CircuitState.HALF_OPEN && 
           this.halfOpenCalls < this.options.maxHalfOpenCalls;
  }

  private async tryHalfOpen<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    this.halfOpenCalls++;

    try {
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      return this.handleRejection(fallback);
    }
  }

  private async handleRejection<T>(fallback?: () => Promise<T>): Promise<T> {
    if (fallback) {
      return fallback();
    }
    throw new Error(`Circuit ${this.name}: Service unavailable (circuit open)`);
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.maxHalfOpenCalls) {
        this.reset();
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;

    if ((this.state === CircuitState.CLOSED && this.failureCount >= this.options.failureThreshold) ||
        this.state === CircuitState.HALF_OPEN) {
      this.trip();
    }
  }

  private trip(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.options.resetTimeout;
    console.warn(`Circuit ${this.name}: OPEN until ${new Date(this.nextAttempt).toISOString()}`);
  }

  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    console.info(`Circuit ${this.name}: CLOSED - service recovered`);
  }

  /**
   * Get the current state of the circuit breaker
   * @returns The circuit state as a string
   */
  getState(): string {
    return CircuitState[this.state];
  }
}
