import { randomBytes } from "crypto"
import { getEncryption } from "../utils/encryption"

/**
 * CSRF protection middleware
 * Implements Double Submit Cookie pattern with encrypted tokens
 */
export const csrfProtection = {
  /**
   * Generate a CSRF token and set it in a cookie
   */
  generateToken: (req, res) => {
    try {
      // Generate a random token
      const csrfToken = randomBytes(32).toString("hex")

      // Get current timestamp
      const timestamp = Date.now()

      // Create token payload with timestamp for expiration
      const tokenPayload = {
        token: csrfToken,
        timestamp,
      }

      // Encrypt the token payload
      const encryption = getEncryption()
      const encryptedToken = encryption.encrypt(tokenPayload)

      // Set the token as a cookie (HTTP only, secure in production)
      const isProduction = process.env.NODE_ENV === "production"
      res.cookie("csrf_token", encryptedToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        maxAge: 3600000, // 1 hour
        path: "/",
      })

      // Return the token to be sent in the response
      return csrfToken
    } catch (error) {
      console.error("Error generating CSRF token:", error)
      throw new Error("Failed to generate CSRF token")
    }
  },

  /**
   * Middleware to validate CSRF token
   */
  validateToken: (req, res, next) => {
    // Skip validation for GET, HEAD, OPTIONS requests
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      return next()
    }

    try {
      // Get the token from the request header
      const headerToken = req.headers["x-csrf-token"]

      // Get the encrypted token from the cookie
      const cookieToken = req.cookies.csrf_token

      if (!headerToken || !cookieToken) {
        return res.status(403).json({ error: "CSRF token missing" })
      }

      // Decrypt the cookie token
      const encryption = getEncryption()
      const decryptedCookie = encryption.decrypt(cookieToken)

      // Check if token has expired (1 hour validity)
      const now = Date.now()
      if (now - decryptedCookie.timestamp > 3600000) {
        return res.status(403).json({ error: "CSRF token expired" })
      }

      // Compare the tokens
      if (headerToken !== decryptedCookie.token) {
        return res.status(403).json({ error: "CSRF token invalid" })
      }

      // Token is valid, proceed
      next()
    } catch (error) {
      console.error("CSRF validation error:", error)
      return res.status(403).json({ error: "CSRF validation failed" })
    }
  },
}

