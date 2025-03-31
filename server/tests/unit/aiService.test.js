const { generateResponse, analyzeStatute, generateMiranda } = require("../../services/aiService")
const User = require("../../models/User")
const mongoose = require("mongoose")

// Mock dependencies
jest.mock("../../models/User")
jest.mock("axios")

describe("AI Service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("generateResponse", () => {
    it("should generate AI response for users with active subscription", async () => {
      // Mock user with active subscription
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        subscription: {
          status: "active",
          tier: "standard",
          hasReachedLimit: jest.fn().mockReturnValue(false),
        },
        usageStats: {
          aiQueries: {
            count: 5,
          },
        },
        preferences: {
          defaultAiModel: null,
        },
        incrementUsage: jest.fn().mockResolvedValue(true),
      }

      User.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser),
      })

      // Mock axios response
      const axios = require("axios")
      axios.post.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: "This is a test response",
              },
            },
          ],
          model: "gpt-3.5-turbo",
          usage: {
            total_tokens: 50,
          },
        },
      })

      const result = await generateResponse("user123", "Test prompt")

      expect(result).toHaveProperty("response", "This is a test response")
      expect(result).toHaveProperty("model", "gpt-3.5-turbo")
      expect(mockUser.incrementUsage).toHaveBeenCalledWith("aiQueries")
    })

    it("should throw error when user has no active subscription", async () => {
      // Mock user with inactive subscription
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        subscription: {
          status: "inactive",
          tier: "standard",
        },
      }

      User.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser),
      })

      await expect(generateResponse("user123", "Test prompt")).rejects.toThrow("Active subscription required")
    })
  })

  // Additional tests for analyzeStatute and generateMiranda would follow a similar pattern
})

