const { getRedisClient } = require("../config/redis")
const logger = require("../config/logger")

// Cache middleware
const cache = (duration) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== "GET") {
      return next()
    }

    const redisClient = getRedisClient()

    // Skip if Redis is not available
    if (!redisClient) {
      return next()
    }

    // Create a unique key based on the request URL and any query parameters
    const key = `cache:${req.originalUrl || req.url}`

    try {
      const cachedResponse = await redisClient.get(key)

      if (cachedResponse) {
        // Return cached response
        const parsedResponse = JSON.parse(cachedResponse)
        return res.status(200).json(parsedResponse)
      }

      // Override res.json to cache the response before sending
      const originalJson = res.json
      res.json = function (body) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setex(key, duration, JSON.stringify(body)).catch((err) => logger.error("Redis cache error:", err))
        }

        return originalJson.call(this, body)
      }

      next()
    } catch (error) {
      logger.error("Cache middleware error:", error)
      next()
    }
  }
}

// Clear cache for specific patterns
const clearCache = async (pattern) => {
  const redisClient = getRedisClient()

  if (!redisClient) {
    return
  }

  try {
    // Get all keys matching the pattern
    const keys = await redisClient.keys(`cache:${pattern}`)

    if (keys.length > 0) {
      // Delete all matching keys
      await redisClient.del(keys)
      logger.info(`Cleared ${keys.length} cache entries matching: ${pattern}`)
    }
  } catch (error) {
    logger.error("Clear cache error:", error)
  }
}

module.exports = {
  cache,
  clearCache,
}

