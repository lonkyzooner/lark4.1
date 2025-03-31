const express = require("express")
const router = express.Router()
const { apiLimiter } = require("../middleware/rateLimiter")
const { authenticateJWT } = require("../middleware/auth")
const ApiResponse = require("../utils/apiResponse")

// Apply rate limiting to all API routes
router.use(apiLimiter)

// API version and status
router.get("/", (req, res) => {
  ApiResponse.success(res, 200, "LARK API is running", {
    version: "1.0.0",
    environment: process.env.NODE_ENV,
  })
})

// Health check endpoint
router.get("/health", (req, res) => {
  ApiResponse.success(res, 200, "Service is healthy")
})

// Protected route example
router.get("/protected", authenticateJWT, (req, res) => {
  ApiResponse.success(res, 200, "You have access to this protected route", {
    user: req.user,
  })
})

module.exports = router

