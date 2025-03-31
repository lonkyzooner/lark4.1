import jwt from "jsonwebtoken"
import { randomBytes } from "crypto"
import { getEncryption } from "./encryption"

/**
 * Token manager for handling JWT tokens and refresh tokens
 * Implements refresh token rotation for enhanced security
 */
class TokenManager {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || "15m"
    this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d"

    // Validate required environment variables
    if (!this.jwtSecret) {
      throw new Error("JWT_SECRET environment variable is required")
    }
  }

  /**
   * Generate a JWT access token
   * @param {Object} payload - Token payload
   * @returns {string} - JWT token
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    })
  }

  /**
   * Generate a refresh token
   * @returns {string} - Refresh token
   */
  generateRefreshToken() {
    return randomBytes(40).toString("hex")
  }

  /**
   * Verify a JWT access token
   * @param {string} token - JWT token to verify
   * @returns {Object} - Decoded token payload
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret)
    } catch (error) {
      throw new Error(`Invalid token: ${error.message}`)
    }
  }

  /**
   * Encrypt a refresh token for storage
   * @param {string} token - Refresh token
   * @param {string} userId - User ID
   * @param {string} deviceId - Device ID
   * @returns {string} - Encrypted token
   */
  encryptRefreshToken(token, userId, deviceId) {
    const encryption = getEncryption()

    const payload = {
      token,
      userId,
      deviceId,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.parseTimeToMs(this.refreshTokenExpiresIn),
    }

    return encryption.encrypt(payload)
  }

  /**
   * Decrypt a refresh token
   * @param {string} encryptedToken - Encrypted refresh token
   * @returns {Object} - Decrypted token payload
   */
  decryptRefreshToken(encryptedToken) {
    try {
      const encryption = getEncryption()
      return encryption.decrypt(encryptedToken)
    } catch (error) {
      throw new Error(`Invalid refresh token: ${error.message}`)
    }
  }

  /**
   * Validate a refresh token
   * @param {Object} tokenData - Decrypted token data
   * @returns {boolean} - Whether the token is valid
   */
  validateRefreshToken(tokenData) {
    // Check if token has expired
    if (Date.now() > tokenData.expiresAt) {
      throw new Error("Refresh token has expired")
    }

    return true
  }

  /**
   * Parse time string to milliseconds
   * @param {string} timeString - Time string (e.g., '7d', '15m')
   * @returns {number} - Time in milliseconds
   */
  parseTimeToMs(timeString) {
    const match = timeString.match(/^(\d+)([smhdw])$/)
    if (!match) {
      throw new Error(`Invalid time format: ${timeString}`)
    }

    const [, value, unit] = match
    const valueNum = Number.parseInt(value, 10)

    switch (unit) {
      case "s":
        return valueNum * 1000
      case "m":
        return valueNum * 60 * 1000
      case "h":
        return valueNum * 60 * 60 * 1000
      case "d":
        return valueNum * 24 * 60 * 60 * 1000
      case "w":
        return valueNum * 7 * 24 * 60 * 60 * 1000
      default:
        throw new Error(`Unknown time unit: ${unit}`)
    }
  }
}

// Create singleton instance
let tokenManagerInstance = null

/**
 * Get the token manager instance
 * @returns {TokenManager} - Token manager instance
 */
export const getTokenManager = () => {
  if (!tokenManagerInstance) {
    tokenManagerInstance = new TokenManager()
  }
  return tokenManagerInstance
}

