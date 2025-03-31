import { createServer } from "http"
import { parse } from "url"
import { subscription } from "../server/routes/subscription"

// Create a serverless function for subscription routes
export default function handler(req, res) {
  // Parse the URL
  const parsedUrl = parse(req.url, true)
  const { pathname } = parsedUrl

  // Extract the path after /api/subscription
  const path = pathname.replace(/^\/api\/subscription/, "") || "/"

  // Update the URL in the request object
  req.url = path

  // Create a simple server to handle the request
  const server = createServer((req, res) => {
    subscription(req, res)
  })

  // Let the server handle the request
  server.emit("request", req, res)
}

