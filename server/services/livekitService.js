const { AccessToken } = require("livekit-server-sdk")
const { v4: uuidv4 } = require("uuid")
const User = require("../models/User")
const logger = require("../config/logger")
const { AppError } = require("../utils/errorHandler")

// Create a LiveKit token
const createToken = async (userId, roomName, options = {}) => {
  try {
    // Check if API keys are configured
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      throw new AppError("LiveKit API keys not configured", 500)
    }

    // Get user
    const user = await User.findById(userId).populate("subscription")
    if (!user) {
      throw new AppError("User not found", 404)
    }

    // Check if user has an active subscription
    if (!user.subscription || user.subscription.status !== "active") {
      throw new AppError("Active subscription required", 403)
    }

    // Check if user has reached usage limit
    const currentUsage = user.usageStats.livekitMinutes.count
    if (user.subscription.hasReachedLimit("livekitMinutes", currentUsage)) {
      throw new AppError("LiveKit usage limit reached", 403)
    }

    // Create token with user identity
    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
      identity: userId,
      name: user.name,
      ...options,
    })

    // Grant permissions to the room
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    // Generate token
    const token = at.toJwt()

    // Increment usage stats
    await user.incrementUsage("livekitMinutes")

    return {
      token,
      room: roomName,
      url: process.env.LIVEKIT_URL,
    }
  } catch (error) {
    logger.error("Error creating LiveKit token:", error)
    throw error
  }
}

// Create a new room
const createRoom = async (userId, options = {}) => {
  try {
    // Generate a unique room name
    const roomName = options.roomName || `room-${uuidv4()}`

    // Create token for the room
    const tokenData = await createToken(userId, roomName, options)

    return {
      ...tokenData,
      roomName,
    }
  } catch (error) {
    logger.error("Error creating LiveKit room:", error)
    throw error
  }
}

module.exports = {
  createToken,
  createRoom,
}

