const request = require("supertest")
const app = require("../../index")
const User = require("../../models/User")
const { generateToken } = require("../../utils/auth")

describe("Authentication API", () => {
  let testUser

  beforeEach(async () => {
    // Create a test user
    testUser = await User.create({
      email: "test@example.com",
      password: "Password123!",
      name: "Test User",
      role: "user",
    })
  })

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "Password123!",
      })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty("token")
      expect(response.body).toHaveProperty("user")
      expect(response.body.user.email).toBe("test@example.com")
    })

    it("should reject invalid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "WrongPassword",
      })

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty("message")
    })
  })

  describe("GET /api/auth/me", () => {
    it("should return user profile with valid token", async () => {
      const token = generateToken(testUser)

      const response = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty("email", "test@example.com")
    })

    it("should reject requests without token", async () => {
      const response = await request(app).get("/api/auth/me")

      expect(response.status).toBe(401)
    })
  })
})

