/**
 * Circuit Breaker implementation for external API calls
 * Prevents cascading failures by failing fast when a service is down
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5
    this.resetTimeout = options.resetTimeout || 30000 // 30 seconds
    this.monitorInterval = options.monitorInterval || 5000 // 5 seconds

    this.state = "CLOSED" // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0
    this.lastFailureTime = null
    this.services = new Map()

    // Start monitoring circuit state
    this.monitor()
  }

  /**
   * Execute a function with circuit breaker protection
   * @param {string} serviceName - Name of the service being called
   * @param {Function} fn - Async function to execute
   * @param {Object} options - Options for this specific call
   * @returns {Promise} - Result of the function call
   */
  async execute(serviceName, fn, options = {}) {
    // Get or create service circuit
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, {
        state: "CLOSED",
        failureCount: 0,
        lastFailureTime: null,
      })
    }

    const circuit = this.services.get(serviceName)

    // Check if circuit is OPEN
    if (circuit.state === "OPEN") {
      // Check if reset timeout has elapsed
      if (Date.now() - circuit.lastFailureTime >= this.resetTimeout) {
        circuit.state = "HALF_OPEN"
      } else {
        throw new Error(`Service ${serviceName} is unavailable (Circuit OPEN)`)
      }
    }

    try {
      // Execute the function
      const result = await fn()

      // Reset on success if in HALF_OPEN state
      if (circuit.state === "HALF_OPEN") {
        this.reset(serviceName)
      }

      return result
    } catch (error) {
      // Record the failure
      this.recordFailure(serviceName)

      // Check if we should open the circuit
      if (circuit.failureCount >= this.failureThreshold) {
        circuit.state = "OPEN"
        circuit.lastFailureTime = Date.now()
      }

      // Rethrow the error
      throw error
    }
  }

  /**
   * Record a failure for a service
   * @param {string} serviceName - Name of the service
   */
  recordFailure(serviceName) {
    const circuit = this.services.get(serviceName)
    circuit.failureCount++
    circuit.lastFailureTime = Date.now()
  }

  /**
   * Reset a service's circuit breaker
   * @param {string} serviceName - Name of the service
   */
  reset(serviceName) {
    const circuit = this.services.get(serviceName)
    circuit.failureCount = 0
    circuit.state = "CLOSED"
  }

  /**
   * Monitor circuit state and reset if needed
   */
  monitor() {
    setInterval(() => {
      for (const [serviceName, circuit] of this.services.entries()) {
        // Check if circuit should be reset from OPEN to HALF_OPEN
        if (circuit.state === "OPEN" && Date.now() - circuit.lastFailureTime >= this.resetTimeout) {
          circuit.state = "HALF_OPEN"
        }
      }
    }, this.monitorInterval)
  }

  /**
   * Get the current state of a service's circuit
   * @param {string} serviceName - Name of the service
   * @returns {Object} - Circuit state information
   */
  getState(serviceName) {
    return (
      this.services.get(serviceName) || {
        state: "CLOSED",
        failureCount: 0,
        lastFailureTime: null,
      }
    )
  }
}

// Create singleton instance
let circuitBreakerInstance = null

/**
 * Get the circuit breaker instance
 * @returns {CircuitBreaker} - Circuit breaker instance
 */
export const getCircuitBreaker = () => {
  if (!circuitBreakerInstance) {
    circuitBreakerInstance = new CircuitBreaker()
  }
  return circuitBreakerInstance
}

