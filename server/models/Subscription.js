const mongoose = require("mongoose")

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
    },
    stripeSubscriptionId: {
      type: String,
      required: true,
    },
    stripePriceId: {
      type: String,
      required: true,
    },
    tier: {
      type: String,
      enum: ["free", "standard", "premium", "enterprise"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "canceled", "past_due", "unpaid", "incomplete", "incomplete_expired", "trialing"],
      default: "active",
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    limits: {
      aiQueries: {
        type: Number,
        default: 100,
      },
      mirandaUsage: {
        type: Number,
        default: 100,
      },
      statuteQueries: {
        type: Number,
        default: 100,
      },
      livekitMinutes: {
        type: Number,
        default: 60,
      },
    },
    features: {
      advancedAi: {
        type: Boolean,
        default: false,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
      customIntegrations: {
        type: Boolean,
        default: false,
      },
      dataExport: {
        type: Boolean,
        default: false,
      },
    },
    paymentMethod: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function () {
  return this.status === "active" || this.status === "trialing"
}

// Method to check if feature is available
subscriptionSchema.methods.hasFeature = function (feature) {
  return this.features[feature] === true
}

// Method to check if user has reached usage limit
subscriptionSchema.methods.hasReachedLimit = function (type, currentUsage) {
  return currentUsage >= this.limits[type]
}

// Method to get days remaining in current period
subscriptionSchema.methods.getDaysRemaining = function () {
  const now = new Date()
  const end = new Date(this.currentPeriodEnd)
  const diffTime = Math.abs(end - now)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const Subscription = mongoose.model("Subscription", subscriptionSchema)

module.exports = Subscription

