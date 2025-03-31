const puppeteer = require("puppeteer")
const { generateToken } = require("../../utils/auth")
const User = require("../../models/User")
const { expect } = require("@jest/globals") // Import expect

describe("Subscription Flow", () => {
  let browser
  let page
  let testUser

  beforeAll(async () => {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    // Create test user
    testUser = await User.create({
      email: "e2e-test@example.com",
      password: "Password123!",
      name: "E2E Test User",
      role: "user",
    })

    // Generate auth token
    testUser.token = generateToken(testUser)
  })

  afterAll(async () => {
    await browser.close()
    await User.deleteOne({ email: "e2e-test@example.com" })
  })

  beforeEach(async () => {
    page = await browser.newPage()

    // Set viewport
    await page.setViewport({ width: 1280, height: 800 })

    // Set auth token in localStorage
    await page.evaluateOnNewDocument((token) => {
      localStorage.setItem("auth_token", token)
    }, testUser.token)
  })

  afterEach(async () => {
    await page.close()
  })

  test("User can view subscription plans", async () => {
    await page.goto("http://localhost:3000/pricing")

    // Wait for pricing page to load
    await page.waitForSelector(".pricing-plans")

    // Check if plans are displayed
    const plansCount = await page.$$eval(".pricing-plan", (plans) => plans.length)
    expect(plansCount).toBeGreaterThanOrEqual(3)

    // Check if plan details are displayed
    const standardPlanExists = await page.evaluate(() => {
      return document.querySelector(".pricing-plan:nth-child(2) h3").innerText.includes("Standard")
    })

    expect(standardPlanExists).toBeTruthy()
  })

  test("User can navigate to checkout", async () => {
    await page.goto("http://localhost:3000/pricing")

    // Click on subscribe button for standard plan
    await page.click(".pricing-plan:nth-child(2) .subscribe-button")

    // Wait for checkout page
    await page.waitForSelector("#checkout-form")

    // Verify we're on checkout page
    const pageTitle = await page.$eval("h1", (el) => el.innerText)
    expect(pageTitle).toContain("Checkout")
  })
})

