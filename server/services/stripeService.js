const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const User = require("../models/User")
const Subscription = require("../models/Subscription")
const logger = require("../config/logger")
const { AppError } = require("../utils/errorHandler")

// Create a Stripe customer
const createCustomer = async (user) => {
  try {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user._id.toString(),
      },
    })

    return customer
  } catch (error) {
    logger.error("Error creating Stripe customer:", error)
    throw new AppError("Failed to create customer account", 500)
  }
}

// Create a checkout session
const createCheckoutSession = async (userId, priceId, mode = "subscription") => {
  try {
    // Get user
    const user = await User.findById(userId)
    if (!user) {
      throw new AppError("User not found", 404)
    }

    // Get or create Stripe customer
    let stripeCustomerId
    if (user.subscription) {
      const subscription = await Subscription.findById(user.subscription)
      stripeCustomerId = subscription ? subscription.stripeCustomerId : null
    }

    if (!stripeCustomerId) {
      const customer = await createCustomer(user)
      stripeCustomerId = customer.id
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      metadata: {
        userId: userId.toString(),
      },
    })

    return session
  } catch (error) {
    logger.error("Error creating checkout session:", error)
    throw new AppError("Failed to create checkout session", 500)
  }
}

// Create a customer portal session
const createPortalSession = async (userId) => {
  try {
    // Get user's subscription
    const user = await User.findById(userId).populate("subscription")
    if (!user || !user.subscription) {
      throw new AppError("No active subscription found", 404)
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/account/billing`,
    })

    return session
  } catch (error) {
    logger.error("Error creating portal session:", error)
    throw new AppError("Failed to create customer portal session", 500)
  }
}

// Handle webhook events
const handleWebhookEvent = async (event) => {
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object)
        break

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object)
        break

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object)
        break

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object)
        break

      default:
        logger.info(`Unhandled event type: ${event.type}`)
    }

    return true
  } catch (error) {
    logger.error(`Error handling webhook event ${event.type}:`, error)
    throw error
  }
}

// Handle checkout.session.completed event
const handleCheckoutSessionCompleted = async (session) => {
  try {
    // Get user ID from metadata
    const userId = session.metadata.userId
    if (!userId) {
      logger.error("No userId found in session metadata")
      return
    }

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription)

    // Get price details to determine tier
    const priceId = subscription.items.data[0].price.id
    const tier = getTierFromPriceId(priceId)

    // Update or create subscription in database
    await updateSubscriptionInDatabase(userId, subscription, tier)

    logger.info(`Subscription created for user ${userId}`)
  } catch (error) {
    logger.error("Error handling checkout.session.completed:", error)
    throw error
  }
}

// Handle customer.subscription.updated event
const handleSubscriptionUpdated = async (subscription) => {
  try {
    // Get customer
    const customer = await stripe.customers.retrieve(subscription.customer)
    const userId = customer.metadata.userId

    if (!userId) {
      logger.error("No userId found in customer metadata")
      return
    }

    // Get price details to determine tier
    const priceId = subscription.items.data[0].price.id
    const tier = getTierFromPriceId(priceId)

    // Update subscription in database
    await updateSubscriptionInDatabase(userId, subscription, tier)

    logger.info(`Subscription updated for user ${userId}`)
  } catch (error) {
    logger.error("Error handling customer.subscription.updated:", error)
    throw error
  }
}

// Handle customer.subscription.deleted event
const handleSubscriptionDeleted = async (subscription) => {
  try {
    // Get customer
    const customer = await stripe.customers.retrieve(subscription.customer)
    const userId = customer.metadata.userId

    if (!userId) {
      logger.error("No userId found in customer metadata")
      return
    }

    // Update subscription in database
    const dbSubscription = await Subscription.findOne({ stripeSubscriptionId: subscription.id })
    if (dbSubscription) {
      dbSubscription.status = "canceled"
      await dbSubscription.save()

      logger.info(`Subscription canceled for user ${userId}`)
    }
  } catch (error) {
    logger.error("Error handling customer.subscription.deleted:", error)
    throw error
  }
}

// Handle invoice.payment_succeeded event
const handleInvoicePaymentSucceeded = async (invoice) => {
  try {
    if (invoice.billing_reason === "subscription_create") {
      // Already handled by checkout.session.completed
      return
    }

    // Get subscription
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription)

    // Get customer
    const customer = await stripe.customers.retrieve(invoice.customer)
    const userId = customer.metadata.userId

    if (!userId) {
      logger.error("No userId found in customer metadata")
      return
    }

    // Update subscription in database
    const dbSubscription = await Subscription.findOne({ stripeSubscriptionId: subscription.id })
    if (dbSubscription) {
      dbSubscription.status = subscription.status
      dbSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000)
      dbSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000)
      await dbSubscription.save()

      logger.info(`Subscription renewed for user ${userId}`)
    }
  } catch (error) {
    logger.error("Error handling invoice.payment_succeeded:", error)
    throw error
  }
}

// Handle invoice.payment_failed event
const handleInvoicePaymentFailed = async (invoice) => {
  try {
    // Get customer
    const customer = await stripe.customers.retrieve(invoice.customer)
    const userId = customer.metadata.userId

    if (!userId) {
      logger.error("No userId found in customer metadata")
      return
    }

    // Update subscription in database
    const dbSubscription = await Subscription.findOne({ stripeSubscriptionId: invoice.subscription })
    if (dbSubscription) {
      dbSubscription.status = "past_due"
      await dbSubscription.save()

      logger.info(`Subscription payment failed for user ${userId}`)
    }
  } catch (error) {
    logger.error("Error handling invoice.payment_failed:", error)
    throw error
  }
}

// Helper function to determine tier from price ID
const getTierFromPriceId = (priceId) => {
  const priceTierMap = {
    [process.env.STRIPE_PRICE_STANDARD_MONTHLY]: "standard",
    [process.env.STRIPE_PRICE_STANDARD_ANNUAL]: "standard",
    [process.env.STRIPE_PRICE_PREMIUM_MONTHLY]: "premium",
    [process.env.STRIPE_PRICE_PREMIUM_ANNUAL]: "premium",
    [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY]: "enterprise",
    [process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL]: "enterprise",
  }

  return priceTierMap[priceId] || "standard"
}

// Helper function to update subscription in database
const updateSubscriptionInDatabase = async (userId, stripeSubscription, tier) => {
  try {
    // Find user
    const user = await User.findById(userId)
    if (!user) {
      logger.error(`User ${userId} not found`)
      return
    }

    // Set subscription limits based on tier
    const limits = {
      standard: {
        aiQueries: 100,
        mirandaUsage: 100,
        statuteQueries: 100,
        livekitMinutes: 60,
      },
      premium: {
        aiQueries: 500,
        mirandaUsage: 500,
        statuteQueries: 500,
        livekitMinutes: 300,
      },
      enterprise: {
        aiQueries: 2000,
        mirandaUsage: 2000,
        statuteQueries: 2000,
        livekitMinutes: 1000,
      },
    }

    // Set features based on tier
    const features = {
      standard: {
        advancedAi: false,
        prioritySupport: false,
        customIntegrations: false,
        dataExport: false,
      },
      premium: {
        advancedAi: true,
        prioritySupport: true,
        customIntegrations: false,
        dataExport: true,
      },
      enterprise: {
        advancedAi: true,
        prioritySupport: true,
        customIntegrations: true,
        dataExport: true,
      },
    }

    // Find existing subscription or create new one
    let subscription = await Subscription.findOne({ stripeSubscriptionId: stripeSubscription.id })

    if (!subscription) {
      subscription = new Subscription({
        user: userId,
        stripeCustomerId: stripeSubscription.customer,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: stripeSubscription.items.data[0].price.id,
      })
    }

    // Update subscription details
    subscription.tier = tier
    subscription.status = stripeSubscription.status
    subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000)
    subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000)
    subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end
    subscription.limits = limits[tier]
    subscription.features = features[tier]

    // Save subscription
    await subscription.save()

    // Update user's subscription reference
    user.subscription = subscription._id
    await user.save()

    return subscription
  } catch (error) {
    logger.error("Error updating subscription in database:", error)
    throw error
  }
}

module.exports = {
  createCustomer,
  createCheckoutSession,
  createPortalSession,
  handleWebhookEvent,
}

