const jwt = require("jsonwebtoken")
const { expressjwt: expressJwt } = require("express-jwt")
const jwksRsa = require("jwks-rsa")
const User = require("../models/User")

// JWT authentication middleware for our own JWT tokens
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" })
  }

  const token = authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Token missing" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" })
  }
}

// Auth0 authentication middleware
const checkJwt = expressJwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${process.env.AUTH0_ISSUER_BASE_URL}/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: process.env.AUTH0_ISSUER_BASE_URL,
  algorithms: ["RS256"],
})

// Check if user has required role
const checkRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id)

      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      if (user.roles.includes(requiredRole) || user.roles.includes("admin")) {
        next()
      } else {
        return res.status(403).json({ message: "Insufficient permissions" })
      }
    } catch (error) {
      return res.status(500).json({ message: "Server error", error: error.message })
    }
  }
}

// Check subscription status
const checkSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("subscription")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (!user.subscription || user.subscription.status !== "active") {
      return res.status(403).json({ message: "Active subscription required" })
    }

    req.subscription = user.subscription
    next()
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {
  authenticateJWT,
  checkJwt,
  checkRole,
  checkSubscription,
}

