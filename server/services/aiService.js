const axios = require("axios")
const User = require("../models/User")
const logger = require("../config/logger")
const { AppError } = require("../utils/errorHandler")
const { cache, clearCache } = require("../middleware/cache")

// OpenAI API client
const openai = axios.create({
  baseURL: "https://api.openai.com/v1",
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  },
})

// Generate AI response
const generateResponse = async (userId, prompt, options = {}) => {
  try {
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
    const currentUsage = user.usageStats.aiQueries.count
    if (user.subscription.hasReachedLimit("aiQueries", currentUsage)) {
      throw new AppError("AI usage limit reached", 403)
    }

    // Determine model based on subscription tier
    let model = "gpt-3.5-turbo"
    if (user.subscription.tier === "premium" || user.subscription.tier === "enterprise") {
      model = "gpt-4"
    }

    // Override with user preference if available
    if (user.preferences.defaultAiModel) {
      model = user.preferences.defaultAiModel
    }

    // Override with options if provided
    if (options.model) {
      model = options.model
    }

    // Prepare request
    const requestData = {
      model,
      messages: [
        {
          role: "system",
          content: options.systemPrompt || "You are a helpful assistant for law enforcement professionals.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
    }

    // Make API request
    const response = await openai.post("/chat/completions", requestData)

    // Increment usage stats
    await user.incrementUsage("aiQueries")

    return {
      response: response.data.choices[0].message.content,
      model: response.data.model,
      usage: response.data.usage,
    }
  } catch (error) {
    logger.error("Error generating AI response:", error)

    // Handle API errors
    if (error.response) {
      throw new AppError(
        `AI service error: ${error.response.data.error.message || "Unknown error"}`,
        error.response.status,
      )
    }

    throw new AppError("Failed to generate AI response", 500)
  }
}

// Analyze statute text
const analyzeStatute = async (userId, statuteText, options = {}) => {
  try {
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
    const currentUsage = user.usageStats.statuteQueries.count
    if (user.subscription.hasReachedLimit("statuteQueries", currentUsage)) {
      throw new AppError("Statute analysis usage limit reached", 403)
    }

    // Prepare system prompt for statute analysis
    const systemPrompt = `
      You are a legal expert assistant for law enforcement professionals.
      Analyze the following statute text and provide:
      1. A plain language summary
      2. Key requirements and prohibitions
      3. Relevant case law references (if applicable)
      4. Practical implications for law enforcement
    `

    // Generate response
    const result = await generateResponse(userId, statuteText, {
      ...options,
      systemPrompt,
    })

    // Increment statute usage stats
    await user.incrementUsage("statuteQueries")

    return result
  } catch (error) {
    logger.error("Error analyzing statute:", error)
    throw error
  }
}

// Generate Miranda warning
const generateMiranda = async (userId, options = {}) => {
  try {
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
    const currentUsage = user.usageStats.mirandaUsage.count
    if (user.subscription.hasReachedLimit("mirandaUsage", currentUsage)) {
      throw new AppError("Miranda usage limit reached", 403)
    }

    // Standard Miranda warning
    const standardMiranda = `
      You have the right to remain silent. Anything you say can and will be used against you in a court of law.
      You have the right to an attorney. If you cannot afford an attorney, one will be provided for you.
      Do you understand the rights I have just read to you? With these rights in mind, do you wish to speak to me?
    `

    // Customize based on options
    let mirandaText = standardMiranda

    if (options.language && options.language !== "en") {
      // Generate translated version
      const translationPrompt = `Translate the following Miranda warning into ${options.language}:\n\n${standardMiranda}`
      const translation = await generateResponse(userId, translationPrompt)
      mirandaText = translation.response
    }

    if (options.simplified) {
      // Generate simplified version
      const simplificationPrompt = `Simplify the following Miranda warning for easier comprehension:\n\n${mirandaText}`
      const simplified = await generateResponse(userId, simplificationPrompt)
      mirandaText = simplified.response
    }

    // Increment Miranda usage stats
    await user.incrementUsage("mirandaUsage")

    return {
      text: mirandaText.trim(),
      language: options.language || "en",
      simplified: options.simplified || false,
    }
  } catch (error) {
    logger.error("Error generating Miranda warning:", error)
    throw error
  }
}

module.exports = {
  generateResponse,
  analyzeStatute,
  generateMiranda,
}

