import { getTokenManager } from "../../server/utils/tokenManager"
import { getErrorReporting } from "../../server/utils/errorReporting"
import { connectToDatabase } from "../../server/utils/database"

/**
 * Refresh token handler for serverless environment
 * Implements token rotation for enhanced security
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    // Get refresh token from request
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" })
    }

    // Get token manager
    const tokenManager = getTokenManager()

    // Decrypt and validate the refresh token
    let tokenData
    try {
      tokenData = tokenManager.decryptRefreshToken(refreshToken)
      tokenManager.validateRefreshToken(tokenData)
    } catch (error) {
      return res.status(401).json({ error: "Invalid refresh token" })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Find the refresh token in the database
    const storedToken = await db.collection("refresh_tokens").findOne({
      userId: tokenData.userId,
      deviceId: tokenData.deviceId,
      token: tokenData.token,
    })

    if (!storedToken) {
      return res.status(401).json({ error: "Refresh token not found or revoked" })
    }

    // Check if token has been used (token rotation)
    if (storedToken.used) {
      // Token reuse detected! Revoke all tokens for this user's device
      await db
        .collection("refresh_tokens")
        .updateMany(
          { userId: tokenData.userId, deviceId: tokenData.deviceId },
          { $set: { revoked: true, revokedAt: new Date() } },
        )

      // Report potential token theft
      getErrorReporting().captureMessage(
        "Refresh token reuse detected",
        { userId: tokenData.userId, deviceId: tokenData.deviceId },
        "warning",
      )

      return res.status(401).json({ error: "Token compromised, please login again" })
    }

    // Mark the current token as used
    await db
      .collection("refresh_tokens")
      .updateOne({ _id: storedToken._id }, { $set: { used: true, usedAt: new Date() } })

    // Find the user
    const user = await db.collection("users").findOne({ _id: tokenData.userId })

    if (!user) {
      return res.status(401).json({ error: "User not found" })
    }

    // Generate new tokens
    const newAccessToken = tokenManager.generateAccessToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    const newRefreshToken = tokenManager.generateRefreshToken()

    // Encrypt the new refresh token
    const encryptedRefreshToken = tokenManager.encryptRefreshToken(
      newRefreshToken,
      user._id.toString(),
      tokenData.deviceId,
    )

    // Store the new refresh token
    await db.collection("refresh_tokens").insertOne({
      userId: user._id,
      deviceId: tokenData.deviceId,
      token: newRefreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + tokenManager.parseTimeToMs(tokenManager.refreshTokenExpiresIn)),
      used: false,
    })

    // Return the new tokens
    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: encryptedRefreshToken,
    })
  } catch (error) {
    // Log the error
    getErrorReporting().captureException(error)

    // Return error response
    return res.status(500).json({ error: "Internal server error" })
  }
}

