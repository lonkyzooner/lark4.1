import * as Sentry from "@sentry/node"
import { ProfilingIntegration } from "@sentry/profiling-node"

/**
 * Error reporting and monitoring utility
 * Integrates with Sentry for error tracking and performance monitoring
 */
class ErrorReporting {
  constructor() {
    this.initialized = false
  }

  /**
   * Initialize error reporting
   */
  init() {
    if (this.initialized) return

    const dsn = process.env.SENTRY_DSN
    if (!dsn) {
      console.warn("Sentry DSN not provided, error reporting disabled")
      return
    }

    try {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || "development",
        integrations: [
          // Enable HTTP calls tracing
          new Sentry.Integrations.Http({ tracing: true }),
          // Enable Express.js middleware tracing
          new Sentry.Integrations.Express(),
          // Enable profiling
          new ProfilingIntegration(),
        ],
        // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        // Set profilesSampleRate to 1.0 to profile all transactions
        profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      })

      this.initialized = true
    } catch (error) {
      console.error("Failed to initialize Sentry:", error)
    }
  }

  /**
   * Capture an exception
   * @param {Error} error - Error to capture
   * @param {Object} context - Additional context
   */
  captureException(error, context = {}) {
    if (!this.initialized) return

    Sentry.withScope((scope) => {
      // Add additional context
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })

      // Capture the exception
      Sentry.captureException(error)
    })
  }

  /**
   * Capture a message
   * @param {string} message - Message to capture
   * @param {Object} context - Additional context
   * @param {string} level - Log level (info, warning, error)
   */
  captureMessage(message, context = {}, level = "info") {
    if (!this.initialized) return

    Sentry.withScope((scope) => {
      // Add additional context
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })

      // Set the level
      scope.setLevel(level)

      // Capture the message
      Sentry.captureMessage(message)
    })
  }

  /**
   * Start a performance transaction
   * @param {string} name - Transaction name
   * @param {string} op - Operation type
   * @returns {Transaction} - Sentry transaction
   */
  startTransaction(name, op) {
    if (!this.initialized) return { finish: () => {} }

    return Sentry.startTransaction({
      name,
      op,
    })
  }

  /**
   * Get Express middleware for request handling
   * @returns {Array} - Array of middleware functions
   */
  getExpressMiddleware() {
    if (!this.initialized) {
      return [(req, res, next) => next()]
    }

    return [
      // RequestHandler creates a separate execution context using domains
      Sentry.Handlers.requestHandler(),
      // TracingHandler creates a trace for every incoming request
      Sentry.Handlers.tracingHandler(),
    ]
  }

  /**
   * Get Express error handler middleware
   * @returns {Function} - Error handler middleware
   */
  getErrorHandler() {
    if (!this.initialized) {
      return (err, req, res, next) => next(err)
    }

    return Sentry.Handlers.errorHandler()
  }

  /**
   * Set user information for the current scope
   * @param {Object} user - User information
   */
  setUser(user) {
    if (!this.initialized) return

    Sentry.setUser(user)
  }

  /**
   * Clear user information from the current scope
   */
  clearUser() {
    if (!this.initialized) return

    Sentry.setUser(null)
  }
}

// Create singleton instance
let errorReportingInstance = null

/**
 * Get the error reporting instance
 * @returns {ErrorReporting} - Error reporting instance
 */
export const getErrorReporting = () => {
  if (!errorReportingInstance) {
    errorReportingInstance = new ErrorReporting()
    errorReportingInstance.init()
  }
  return errorReportingInstance
}

