const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    password: {
      type: String,
      required: function () {
        // Password is required unless using OAuth
        return !this.authProvider
      },
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // Don't include password in queries by default
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "auth0"],
      default: "local",
    },
    authProviderId: String,
    roles: {
      type: [String],
      default: ["user"],
      enum: ["user", "admin", "moderator"],
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    usageStats: {
      aiQueries: {
        count: { type: Number, default: 0 },
        lastUsed: Date,
      },
      mirandaUsage: {
        count: { type: Number, default: 0 },
        lastUsed: Date,
      },
      statuteQueries: {
        count: { type: Number, default: 0 },
        lastUsed: Date,
      },
      livekitMinutes: {
        count: { type: Number, default: 0 },
        lastUsed: Date,
      },
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
      defaultAiModel: {
        type: String,
        default: "gpt-4",
      },
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
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

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next()

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10)
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Method to get user's subscription tier
userSchema.methods.getSubscriptionTier = async function () {
  await this.populate("subscription")
  return this.subscription ? this.subscription.tier : "free"
}

// Virtual for user's full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`
})

// Method to check if user has specific role
userSchema.methods.hasRole = function (role) {
  return this.roles.includes(role)
}

// Method to increment usage stats
userSchema.methods.incrementUsage = async function (type) {
  if (this.usageStats[type]) {
    this.usageStats[type].count += 1
    this.usageStats[type].lastUsed = new Date()
    await this.save()
  }
}

const User = mongoose.model("User", userSchema)

module.exports = User

