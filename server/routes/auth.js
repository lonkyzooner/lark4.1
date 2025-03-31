const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const User = require("../models/User")
const { authenticateJWT, checkJwt } = require("../middleware/auth")
const { authLimiter } = require("../middleware/rateLimiter")
const { sendEmail } = require("../services/emailService")
const { catchAsync, AppError } = require("../utils/errorHandler")
const ApiResponse = require("../utils/apiResponse")

// Apply rate limiting to auth routes
router.use(authLimiter)

// Register new user
router.post(
  "/register",
  catchAsync(async (req, res) => {
    const { email, password, name } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return ApiResponse.badRequest(res, "Email already in use")
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create new user
    const user = new User({
      email,
      password,
      name,
      verificationToken,
      verificationExpires,
    })

    await user.save()

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
    await sendEmail({
      to: email,
      subject: "Verify your email address",
      template: "email-verification",
      context: {
        name,
        verificationUrl,
      },
    })

    // Return success without sensitive data
    return ApiResponse.success(res, 201, "User registered successfully. Please verify your email.", {
      id: user._id,
      email: user.email,
      name: user.name,
    })
  }),
)

// Login
router.post(
  "/login",
  catchAsync(async (req, res) => {
    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return ApiResponse.unauthorized(res, "Invalid email or password")
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return ApiResponse.unauthorized(res, "Invalid email or password")
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return ApiResponse.forbidden(res, "Please verify your email before logging in")
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, email: user.email, roles: user.roles }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    })

    // Update last login
    user.lastLogin = Date.now()
    await user.save()

    // Return token and user data
    return ApiResponse.success(res, 200, "Login successful", {
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    })
  }),
)

// Verify email
router.post(
  "/verify-email",
  catchAsync(async (req, res) => {
    const { token } = req.body

    // Find user with matching token
    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() },
    })

    if (!user) {
      return ApiResponse.badRequest(res, "Invalid or expired verification token")
    }

    // Update user
    user.emailVerified = true
    user.verificationToken = undefined
    user.verificationExpires = undefined
    await user.save()

    return ApiResponse.success(res, 200, "Email verified successfully")
  }),
)

// Forgot password
router.post(
  "/forgot-password",
  catchAsync(async (req, res) => {
    const { email } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      // Don't reveal that the user doesn't exist
      return ApiResponse.success(res, 200, "If your email is registered, you will receive a password reset link")
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000 // 1 hour
    await user.save()

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    await sendEmail({
      to: email,
      subject: "Reset your password",
      template: "password-reset",
      context: {
        name: user.name,
        resetUrl,
      },
    })

    return ApiResponse.success(res, 200, "If your email is registered, you will receive a password reset link")
  }),
)

// Reset password
router.post(
  "/reset-password",
  catchAsync(async (req, res) => {
    const { token, password } = req.body

    // Find user with matching token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return ApiResponse.badRequest(res, "Invalid or expired reset token")
    }

    // Update password
    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: "Your password has been changed",
      template: "password-changed",
      context: {
        name: user.name,
      },
    })

    return ApiResponse.success(res, 200, "Password reset successful")
  }),
)

// Get current user
router.get(
  "/me",
  authenticateJWT,
  catchAsync(async (req, res) => {
    const user = await User.findById(req.user.id).populate("subscription")

    if (!user) {
      return ApiResponse.notFound(res, "User not found")
    }

    return ApiResponse.success(res, 200, "User retrieved successfully", {
      id: user._id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      subscription: user.subscription
        ? {
            tier: user.subscription.tier,
            status: user.subscription.status,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
          }
        : null,
      preferences: user.preferences,
      usageStats: user.usageStats,
    })
  }),
)

// Update user profile
router.put('/profile', authenticateJWT, catchAsync(async (req, res) => {
  const { name, preferences } = req.body;
  
  const user  catchAsync(async (req, res) => {
  const { name, preferences } = req.body;
  
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return ApiResponse.notFound(res, 'User not found');
  }
  
  // Update fields
  if (name) user.name = name;
  if (preferences) {
    user.preferences = {
      ...user.preferences,
      ...preferences
    };
  }
  
  await user.save();
  
  return ApiResponse.success(res, 200, 'Profile updated successfully', {
    id: user._id,
    email: user.email,
    name: user.name,
    preferences: user.preferences
  });
}));

// Change password
router.put('/change-password', authenticateJWT, catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // Find user with password
  const user = await User.findById(req.user.id).select('+password');
  
  if (!user) {
    return ApiResponse.notFound(res, 'User not found');
  }
  
  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return ApiResponse.unauthorized(res, 'Current password is incorrect');
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  // Send confirmation email
  await sendEmail({
    to: user.email,
    subject: 'Your password has been changed',
    template: 'password-changed',
    context: {
      name: user.name
    }
  });
  
  return ApiResponse.success(res, 200, 'Password changed successfully');
}));

// Auth0 callback
router.post('/auth0-callback', checkJwt, catchAsync(async (req, res) => {
  const auth0User = req.user;
  
  // Find or create user
  let user = await User.findOne({ email: auth0User.email });
  
  if (!user) {
    // Create new user
    user = new User({
      email: auth0User.email,
      name: auth0User.name || auth0User.nickname || auth0User.email.split('@')[0],
      authProvider: 'auth0',
      authProviderId: auth0User.sub,
      emailVerified: true // Auth0 verifies emails
    });
    
    await user.save();
  } else if (user.authProvider !== 'auth0') {
    // Link accounts
    user.authProvider = 'auth0';
    user.authProviderId = auth0User.sub;
    await user.save();
  }
  
  // Generate JWT token
  const token = jwt.sign(
    { id: user._id, email: user.email, roles: user.roles },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
  
  // Update last login
  user.lastLogin = Date.now();
  await user.save();
  
  return ApiResponse.success(res, 200, 'Auth0 login successful', {
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      roles: user.roles
    }
  });
}));

module.exports = router;

