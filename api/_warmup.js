import { connectToDatabase } from "../server/utils/database"
import { getApiCache } from "../server/utils/apiCache"

/**
 * Serverless function warm-up handler
 * Keeps functions warm to reduce cold start latency
 */
export default async function handler(req, res) {
  try {
    // Check for warm-up token
    const token = req.headers["x-warmup-token"]

    if (!token || token !== process.env.WARMUP_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    // Perform warm-up tasks
    const tasks = []

    // Warm up database connection
    tasks.push(
      connectToDatabase()
        .then(() => ({ service: "database", status: "ok" }))
        .catch((error) => ({ service: "database", status: "error", message: error.message })),
    )

    // Warm up cache
    tasks.push(
      Promise.resolve()
        .then(() => {
          const cache = getApiCache()
          cache.set("warmup-key", { timestamp: Date.now() }, 60)
          return { service: "cache", status: "ok" }
        })
        .catch((error) => ({ service: "cache", status: "error", message: error.message })),
    )

    // Execute all warm-up tasks
    const results = await Promise.all(tasks)

    // Return results
    return res.status(200).json({
      timestamp: Date.now(),
      results,
    })
  } catch (error) {
    return res.status(500).json({ error: "Warm-up failed", message: error.message })
  }
}

