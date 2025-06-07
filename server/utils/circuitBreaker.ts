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

// Function type that supports optional abort signal for cancellation
type CancellableFunction<T> = (signal?: AbortSignal) => Promise<T>;

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttempt: number = Date.now();
  private halfOpenCalls: number = 0;
  private inHalfOpenProbe: boolean = false; // Flag to prevent race conditions
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
   * @param fn The function to execute, may accept an AbortSignal for cancellation
   * @param fallback Optional fallback function if circuit is open or call fails
   * @returns The result of fn or fallback
   */
  async execute<T>(fn: CancellableFunction<T>, fallback?: CancellableFunction<T>): Promise<T> {
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

  private async executeWithTimeout<T>(fn: (signal?: AbortSignal) => Promise<T>): Promise<T> {
    if (!this.options.timeout) {
      return fn();
    }

    // Create an AbortController to enable cancellation
    const abortController = new AbortController();
    const { signal } = abortController;
    
    // Set up the timeout
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, this.options.timeout);
    
    try {
      // Pass the abort signal to the function if it supports it
      const result = await Promise.race([
        fn(signal),
        // This promise rejects when abort() is called or when the timeout occurs
        new Promise<T>((_, reject) => {
          // Listen for abort signal
          signal.addEventListener('abort', () => {
            reject(new Error(`Circuit ${this.name}: Operation timed out after ${this.options.timeout}ms`));
          });
        })
      ]);
      
      return result;
    } finally {
      // Clean up regardless of success or failure
      clearTimeout(timeoutId);
    }
  }

  private isOpen(): boolean {
    return this.state === CircuitState.OPEN || this.state === CircuitState.HALF_OPEN;
  }

  private canTry(): boolean {
    // Use atomic flag to prevent multiple concurrent transitions
    if (this.state === CircuitState.OPEN && Date.now() > this.nextAttempt && !this.inHalfOpenProbe) {
      this.inHalfOpenProbe = true; // Set flag to block other requests
      this.state = CircuitState.HALF_OPEN;
      this.halfOpenCalls = 0;
      return true;
    }

    // Only allow additional attempts if we're not exceeding the limit
    return this.state === CircuitState.HALF_OPEN && 
           this.halfOpenCalls < this.options.maxHalfOpenCalls &&
           !this.inHalfOpenProbe;
  }

private async tryHalfOpen<T>(fn: CancellableFunction<T>, fallback?: CancellableFunction<T>): Promise<T> {
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
        this.inHalfOpenProbe = false; // Release the lock when circuit closes
      } else {
        // Release the probe lock after success to allow another attempt
        this.inHalfOpenProbe = false;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;

    if ((this.state === CircuitState.CLOSED && this.failureCount >= this.options.failureThreshold) ||
        this.state === CircuitState.HALF_OPEN) {
      this.trip();
      // Release the half open probe lock on failure
      this.inHalfOpenProbe = false;
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
    this.inHalfOpenProbe = false; // Reset the atomic flag
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
