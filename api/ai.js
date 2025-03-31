import { createServer } from "http"
import { parse } from "url"
import { ai } from "../server/routes/ai"

// Create a serverless function for AI routes
export default function handler(req, res) {
  // Parse the URL
  const parsedUrl = parse(req.url, true)
  const { pathname } = parsedUrl

  // Extract the path after /api/ai
  const path = pathname.replace(/^\/api\/ai/, "") || "/"

  // Update the URL in the request object
  req.url = path

  // Create a simple server to handle the request
  const server = createServer((req, res) => {
    ai(req, res)
  })

  // Let the server handle the request
  server.emit("request", req, res)
}

