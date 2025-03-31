const rateLimit = require("express-rate-limit")
const RedisStore = require("rate-limit-redis")
const { getRedisClient } = require("../config/redis")
const logger = require("../config/logger")

// Create rate limiter with Redis store if available
const createRateLimiter = (options = {}) => {
  const redisClient = getRedisClient()

  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: "Too many requests, please try again later.",
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`)
      res.status(options.statusCode).json({
        message: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000),
      })
    },
  }

  const limiterOptions = { ...defaultOptions, ...options }

  // Use Redis store if available
  if (redisClient) {
    limiterOptions.store = new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    })
  }

  return rateLimit(limiterOptions)
}

// API rate limiter
const apiLimiter = createRateLimiter()

// More strict limiter for authentication routes
const authLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: "Too many authentication attempts, please try again later.",
})

// Limiter for AI endpoints
const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: "AI request rate limit exceeded. Please try again later.",
})

module.exports = {
  apiLimiter,
  authLimiter,
  aiLimiter,
}

