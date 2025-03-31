import NodeCache from "node-cache"

/**
 * API response caching utility
 * Implements in-memory caching with TTL for API responses
 */
class ApiCache {
  constructor(options = {}) {
    this.cache = new NodeCache({
      stdTTL: options.defaultTTL || 300, // 5 minutes default TTL
      checkperiod: options.checkPeriod || 60, // Check for expired keys every 60 seconds
      useClones: false, // Don't clone objects (better performance)
      deleteOnExpire: true, // Automatically delete expired items
    })

    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
    }
  }

  /**
   * Generate a cache key from request parameters
   * @param {string} baseKey - Base key (usually the API endpoint)
   * @param {Object} params - Request parameters
   * @returns {string} - Cache key
   */
  generateKey(baseKey, params = {}) {
    // Sort params to ensure consistent key generation
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key]
        return acc
      }, {})

    return `${baseKey}:${JSON.stringify(sortedParams)}`
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any} - Cached value or undefined if not found
   */
  get(key) {
    const value = this.cache.get(key)

    if (value !== undefined) {
      this.stats.hits++
    } else {
      this.stats.misses++
    }

    return value
  }

  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (optional)
   */
  set(key, value, ttl) {
    this.cache.set(key, value, ttl)
    this.stats.sets++
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.del(key)
  }

  /**
   * Clear the entire cache
   */
  clear() {
    this.cache.flushAll()
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      keys: this.cache.keys().length,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
    }
  }

  /**
   * Middleware for caching API responses
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Function} - Express middleware
   */
  middleware(ttl) {
    return (req, res, next) => {
      // Skip caching for non-GET requests
      if (req.method !== "GET") {
        return next()
      }

      // Generate cache key from URL and query parameters
      const key = this.generateKey(req.originalUrl || req.url, req.query)

      // Try to get from cache
      const cachedResponse = this.get(key)

      if (cachedResponse) {
        // Return cached response
        return res.status(cachedResponse.status).set("X-Cache", "HIT").json(cachedResponse.body)
      }

      // Cache miss, capture the response
      const originalSend = res.json

      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.set(
            key,
            {
              status: res.statusCode,
              body,
            },
            ttl,
          )
        }

        // Set cache header
        res.set("X-Cache", "MISS")

        // Call original method
        return originalSend.call(res, body)
      }

      next()
    }
  }
}

// Create singleton instance
let apiCacheInstance = null

/**
 * Get the API cache instance
 * @returns {ApiCache} - API cache instance
 */
export const getApiCache = () => {
  if (!apiCacheInstance) {
    apiCacheInstance = new ApiCache()
  }
  return apiCacheInstance
}

