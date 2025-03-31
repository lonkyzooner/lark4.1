const express = require("express")
const router = express.Router()
const { auth } = require("express-oauth2-jwt-bearer")
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const NodeCache = require("node-cache")
const { createHmac } = require("crypto")

// Cache for subscription plans (1 hour TTL)
const plansCache = new NodeCache({ stdTTL: 3600 })

// Configure Auth0 middleware
const jwtCheck = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: "RS256",
})

// Rate limiting for subscription endpoints
const rateLimit = require("express-rate-limit")
const subscriptionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many subscription requests from this IP, please try again after 15 minutes",
})

// Apply rate limiting to all subscription routes
router.use(subscriptionLimiter)

// Helper to get Stripe customer ID for a user
const getStripeCustomerId = async (userId) => {
  try {
    // In production, query your database for the customer ID
    const User = require("../models/User")
    const user = await User.findOne({ auth0Id: userId })

    if (user && user.stripeCustomerId) {
      return user.stripeCustomerId
    }

    // If no customer ID exists, create a new customer in Stripe
    const customer = await stripe.customers.create({
      metadata: {
        auth0Id: userId,
      },
    })

    // Save the customer ID to your database
    if (user) {
      user.stripeCustomerId = customer.id
      await user.save()
    } else {
      await User.create({
        auth0Id: userId,
        stripeCustomerId: customer.id,
      })
    }

    return customer.id
  } catch (error) {
    console.error("Error getting Stripe customer ID:", error)
    throw error
  }
}

// Define subscription plans
const getSubscriptionPlans = async () => {
  // Check cache first
  const cachedPlans = plansCache.get("subscription_plans")
  if (cachedPlans) {
    return cachedPlans
  }

  try {
    // In production, fetch these from Stripe
    const products = await stripe.products.list({
      active: true,
      expand: ["data.default_price"],
    })

    const plans = products.data.map((product) => {
      const price = product.default_price
      return {
        id: price.id,
        name: product.name,
        description: product.description,
        features: product.metadata.features ? JSON.parse(product.metadata.features) : [],
        price: price.unit_amount / 100,
        interval: price.recurring ? price.recurring.interval : "month",
        tier: product.metadata.tier || "basic",
        apiQuota: Number.parseInt(product.metadata.api_quota || "500"),
        trialDays: Number.parseInt(product.metadata.trial_days || "14"),
      }
    })

    // Cache the plans
    plansCache.set("subscription_plans", plans)

    return plans
  } catch (error) {
    console.error("Error fetching subscription plans from Stripe:", error)

    // Fallback to hardcoded plans if Stripe fetch fails
    const fallbackPlans = [
      {
        id: process.env.STRIPE_PRICE_BASIC_MONTHLY || "price_basic_monthly",
        name: "Basic",
        description: "Essential features for individual officers",
        features: ["Voice control", "Miranda rights delivery", "Basic statute lookup", "500 API calls per month"],
        price: 9.99,
        interval: "month",
        tier: "basic",
        apiQuota: 500,
        trialDays: 14,
      },
      {
        id: process.env.STRIPE_PRICE_STANDARD_MONTHLY || "price_standard_monthly",
        name: "Standard",
        description: "Complete feature set for active duty officers",
        features: [
          "All Basic features",
          "Threat detection",
          "Advanced statute lookup",
          "Multilingual support",
          "1,000 API calls per month",
        ],
        price: 19.99,
        interval: "month",
        tier: "standard",
        apiQuota: 1000,
        trialDays: 14,
      },
      {
        id: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || "price_premium_monthly",
        name: "Premium",
        description: "Advanced features for specialized units",
        features: [
          "All Standard features",
          "Real-time tactical feedback",
          "Advanced threat detection",
          "Training mode",
          "Unlimited API calls",
        ],
        price: 39.99,
        interval: "month",
        tier: "premium",
        apiQuota: 5000,
        trialDays: 14,
      },
      {
        id: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || "price_enterprise_yearly",
        name: "Enterprise",
        description: "Custom solution for departments",
        features: [
          "All Premium features",
          "Custom integration",
          "Department-wide analytics",
          "Dedicated support",
          "Custom hardware options",
          "Unlimited everything",
        ],
        price: 499.99,
        interval: "year",
        tier: "enterprise",
        apiQuota: -1, // Unlimited
        metadata: {
          contactSales: true,
        },
      },
    ]

    // Cache the fallback plans
    plansCache.set("subscription_plans", fallbackPlans)

    return fallbackPlans
  }
}

// Routes
// Get subscription plans
router.get("/plans", async (req, res) => {
  try {
    const plans = await getSubscriptionPlans()
    res.json(plans)
  } catch (error) {
    console.error("Error getting subscription plans:", error)
    res.status(500).json({ error: "Failed to get subscription plans" })
  }
})

// Get current subscription
router.get("/status", jwtCheck, async (req, res) => {
  try {
    const userId = req.auth.payload.sub
    const customerId = await getStripeCustomerId(userId)

    // Get subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      expand: ["data.default_payment_method", "data.plan.product"],
    })

    if (subscriptions.data.length === 0) {
      return res.json({
        success: true,
        subscription: {
          tier: "free",
          status: "inactive",
          features: [],
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
      })
    }

    // Get the most recent subscription
    const subscription = subscriptions.data[0]
    const product = subscription.plan.product

    // Get features from product metadata
    const features = product.metadata.features ? JSON.parse(product.metadata.features) : []

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        tier: product.metadata.tier || "basic",
        status: subscription.status,
        features: features,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        paymentMethod: subscription.default_payment_method,
      },
    })
  } catch (error) {
    console.error("Error getting current subscription:", error)
    res.status(500).json({ error: "Failed to get current subscription" })
  }
})

// Create checkout session
router.post("/create-checkout-session", jwtCheck, async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl, customerEmail } = req.body
    const userId = req.auth.payload.sub

    if (!priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: "Missing required parameters" })
    }

    // Get customer ID
    const customerId = await getStripeCustomerId(userId)

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        userId: userId,
      },
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
    })

    res.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    res.status(500).json({ error: "Failed to create checkout session" })
  }
})

// Create customer portal session
router.post("/create-portal-session", jwtCheck, async (req, res) => {
  try {
    const { returnUrl } = req.body
    const userId = req.auth.payload.sub

    if (!returnUrl) {
      return res.status(400).json({ error: "Return URL is required" })
    }

    // Get customer ID
    const customerId = await getStripeCustomerId(userId)

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    res.json({ url: session.url })
  } catch (error) {
    console.error("Error creating portal session:", error)
    res.status(500).json({ error: "Failed to create portal session" })
  }
})

// Cancel subscription
router.post("/cancel", jwtCheck, async (req, res) => {
  try {
    const { atPeriodEnd = true } = req.body
    const userId = req.auth.payload.sub

    // Get customer ID
    const customerId = await getStripeCustomerId(userId)

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    })

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: "No active subscription found" })
    }

    const subscription = subscriptions.data[0]

    if (atPeriodEnd) {
      // Cancel at period end
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      })

      res.json({
        success: true,
        canceledAt: "period_end",
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      })
    } else {
      // Cancel immediately
      await stripe.subscriptions.del(subscription.id)

      res.json({
        success: true,
        canceledAt: "now",
      })
    }
  } catch (error) {
    console.error("Error canceling subscription:", error)
    res.status(500).json({ error: "Failed to cancel subscription" })
  }
})

// Update subscription
router.post("/update", jwtCheck, async (req, res) => {
  try {
    const { priceId } = req.body
    const userId = req.auth.payload.sub

    if (!priceId) {
      return res.status(400).json({ error: "Price ID is required" })
    }

    // Get customer ID
    const customerId = await getStripeCustomerId(userId)

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    })

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: "No active subscription found" })
    }

    const subscription = subscriptions.data[0]

    // Update subscription
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
      proration_behavior: "create_prorations",
    })

    res.json({
      success: true,
      updatedPlanId: priceId,
      subscription: updatedSubscription.id,
    })
  } catch (error) {
    console.error("Error updating subscription:", error)
    res.status(500).json({ error: "Failed to update subscription" })
  }
})

// Get usage data
router.get("/usage", jwtCheck, async (req, res) => {
  try {
    const userId = req.auth.payload.sub

    // In a real implementation, you would fetch usage data from your database
    // For now, we'll use mock data
    const User = require("../models/User")
    const user = await User.findOne({ auth0Id: userId })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Get subscription tier to determine quota
    const customerId = await getStripeCustomerId(userId)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      expand: ["data.plan.product"],
    })

    let apiQuota = 100 // Default free tier

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0]
      const product = subscription.plan.product
      apiQuota = Number.parseInt(product.metadata.api_quota || "100")
    }

    // Get usage from database or create default
    const usage = user.apiUsage || {
      used: 0,
      total: apiQuota,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }

    res.json(usage)
  } catch (error) {
    console.error("Error getting usage data:", error)
    res.status(500).json({ error: "Failed to get usage data" })
  }
})

// Get invoice history
router.get("/invoices", jwtCheck, async (req, res) => {
  try {
    const userId = req.auth.payload.sub

    // Get customer ID
    const customerId = await getStripeCustomerId(userId)

    // Get invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10,
    })

    res.json(invoices.data)
  } catch (error) {
    console.error("Error getting invoice history:", error)
    res.status(500).json({ error: "Failed to get invoice history" })
  }
})

// Webhook handler for Stripe events
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"]
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("Stripe webhook secret is not configured")
    return res.status(500).send("Webhook secret not configured")
  }

  try {
    // Verify webhook signature
    let event

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        const subscription = event.data.object
        await handleSubscriptionChange(subscription)
        break
      case "customer.subscription.deleted":
        const canceledSubscription = event.data.object
        await handleSubscriptionCancellation(canceledSubscription)
        break
      case "invoice.payment_succeeded":
        const invoice = event.data.object
        await handleSuccessfulPayment(invoice)
        break
      case "invoice.payment_failed":
        const failedInvoice = event.data.object
        await handleFailedPayment(failedInvoice)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error("Error handling Stripe webhook:", error)
    res.status(400).send(`Webhook Error: ${error.message}`)
  }
})

// Helper functions for webhook handlers
async function handleSubscriptionChange(subscription) {
  try {
    // Get user ID from subscription metadata
    const userId = subscription.metadata.userId
    if (!userId) return

    // Get subscription details
    const expandedSubscription = await stripe.subscriptions.retrieve(subscription.id, {
      expand: ["plan.product"],
    })

    const product = expandedSubscription.plan.product
    const tier = product.metadata.tier || "basic"
    const features = product.metadata.features ? JSON.parse(product.metadata.features) : []

    // Update user in database
    const User = require("../models/User")
    await User.findOneAndUpdate(
      { auth0Id: userId },
      {
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionTier: tier,
        features: features,
        subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      { upsert: true },
    )
  } catch (error) {
    console.error("Error handling subscription change:", error)
  }
}

async function handleSubscriptionCancellation(subscription) {
  try {
    // Get user ID from subscription metadata
    const userId = subscription.metadata.userId
    if (!userId) return

    // Update user in database
    const User = require("../models/User")
    await User.findOneAndUpdate(
      { auth0Id: userId },
      {
        subscriptionStatus: "canceled",
        subscriptionTier: "free",
        features: [],
        cancelAtPeriodEnd: false,
      },
    )
  } catch (error) {
    console.error("Error handling subscription cancellation:", error)
  }
}

async function handleSuccessfulPayment(invoice) {
  try {
    // Get subscription ID from invoice
    const subscriptionId = invoice.subscription
    if (!subscriptionId) return

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const userId = subscription.metadata.userId
    if (!userId) return

    // Log payment in database
    const User = require("../models/User")
    const user = await User.findOne({ auth0Id: userId })

    if (user) {
      // Add payment to history
      if (!user.paymentHistory) user.paymentHistory = []

      user.paymentHistory.push({
        invoiceId: invoice.id,
        amount: invoice.amount_paid / 100,
        date: new Date(invoice.created * 1000),
        status: "paid",
      })

      await user.save()
    }
  } catch (error) {
    console.error("Error handling successful payment:", error)
  }
}

async function handleFailedPayment(invoice) {
  try {
    // Get subscription ID from invoice
    const subscriptionId = invoice.subscription
    if (!subscriptionId) return

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const userId = subscription.metadata.userId
    if (!userId) return

    // Update user in database
    const User = require("../models/User")
    const user = await User.findOne({ auth0Id: userId })

    if (user) {
      // Add failed payment to history
      if (!user.paymentHistory) user.paymentHistory = []

      user.paymentHistory.push({
        invoiceId: invoice.id,
        amount: invoice.amount_due / 100,
        date: new Date(invoice.created * 1000),
        status: "failed",
      })

      // Mark subscription as past_due
      user.subscriptionStatus = "past_due"

      await user.save()
    }
  } catch (error) {
    console.error("Error handling failed payment:", error)
  }
}

module.exports = router

