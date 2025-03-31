#!/usr/bin/env node

/**
 * Serverless function warm-up script
 * Keeps functions warm to reduce cold start latency
 *
 * Usage:
 * - Run manually: node scripts/warmup.js
 * - Schedule with cron: 0 */ 5 * * * node /path/to/scripts/warmup.js
 */

const https = require("https")
const http = require("http")

// Configuration
const config = {
  // Base URL of the application
  baseUrl: process.env.WARMUP_BASE_URL || "https://your-app.vercel.app",

  // Warm-up token (must match the one in the API)
  token: process.env.WARMUP_TOKEN || "your-warmup-token",

  // Endpoints to warm up
  endpoints: ["/api/_warmup", "/api/health", "/api/auth/session"],

  // Interval between requests (ms)
  interval: 1000,

  // Timeout for requests (ms)
  timeout: 5000,
}

/**
 * Make an HTTP request
 * @param {string} url - URL to request
 * @param {Object} options - Request options
 * @returns {Promise} - Promise resolving to response
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const protocol = urlObj.protocol === "https:" ? https : http

    const req = protocol.request(url, options, (res) => {
      let data = ""

      res.on("data", (chunk) => {
        data += chunk
      })

      res.on("end", () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: data.length > 0 ? JSON.parse(data) : null,
          }
          resolve(response)
        } catch (error) {
          reject(error)
        }
      })
    })

    req.on("error", (error) => {
      reject(error)
    })

    req.on("timeout", () => {
      req.destroy()
      reject(new Error(`Request timeout: ${url}`))
    })

    req.setTimeout(config.timeout)
    req.end()
  })
}

/**
 * Warm up a single endpoint
 * @param {string} endpoint - Endpoint to warm up
 * @returns {Promise} - Promise resolving to result
 */
async function warmupEndpoint(endpoint) {
  const url = `${config.baseUrl}${endpoint}`

  try {
    console.log(`Warming up: ${url}`)

    const response = await makeRequest(url, {
      headers: {
        "X-Warmup-Token": config.token,
      },
    })

    return {
      endpoint,
      statusCode: response.statusCode,
      success: response.statusCode >= 200 && response.statusCode < 300,
    }
  } catch (error) {
    return {
      endpoint,
      statusCode: null,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Warm up all endpoints
 */
async function warmupAll() {
  console.log(`Starting warm-up at ${new Date().toISOString()}`)

  const results = []

  for (const endpoint of config.endpoints) {
    const result = await warmupEndpoint(endpoint)
    results.push(result)

    // Wait before next request
    if (config.interval > 0) {
      await new Promise((resolve) => setTimeout(resolve, config.interval))
    }
  }

  // Log results
  console.log("Warm-up results:")
  console.table(results)

  // Check for failures
  const failures = results.filter((result) => !result.success)
  if (failures.length > 0) {
    console.error(`${failures.length} endpoints failed to warm up`)
    process.exit(1)
  } else {
    console.log("All endpoints warmed up successfully")
    process.exit(0)
  }
}

// Run the warm-up
warmupAll().catch((error) => {
  console.error("Warm-up failed:", error)
  process.exit(1)
})

