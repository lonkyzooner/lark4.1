/**
 * Stripe Service for LARK
 *
 * This service handles Stripe payment integrations for the LARK application.
 * It provides functionality for creating checkout sessions, managing subscriptions,
 * and handling webhooks.
 */

import axios from "axios"
import { getCurrentUser } from "./authService"

// API URL from environment variables with fallback
const API_URL = import.meta.env.VITE_API_BASE_URL || "/api"

// Stripe subscription tiers mapped to LARK features
export const SUBSCRIPTION_TIERS = {
  basic: {
    features: ["miranda_rights", "basic_statutes", "voice_activation"],
    apiQuota: 100,
  },
  standard: {
    features: [
      "miranda_rights",
      "advanced_statutes",
      "voice_activation",
      "threat_detection",
      "multilingual",
      "tactical_feedback",
    ],
    apiQuota: 500,
  },
  premium: {
    features: [
      "miranda_rights",
      "advanced_statutes",
      "voice_activation",
      "threat_detection",
      "multilingual",
      "tactical_feedback",
      "training_mode",
      "analytics",
      "department_integrations",
    ],
    apiQuota: 2000,
  },
  enterprise: {
    features: [
      "miranda_rights",
      "advanced_statutes",
      "voice_activation",
      "threat_detection",
      "multilingual",
      "tactical_feedback",
      "training_mode",
      "analytics",
      "department_integrations",
      "custom_solutions",
      "dedicated_support",
    ],
    apiQuota: -1, // Unlimited
  },
}

// Stripe price IDs from environment variables
export const STRIPE_PRICE_IDS = {
  basic_monthly: import.meta.env.VITE_STRIPE_PRICE_BASIC_MONTHLY || "",
  standard_monthly: import.meta.env.VITE_STRIPE_PRICE_STANDARD_MONTHLY || "",
  premium_monthly: import.meta.env.VITE_STRIPE_PRICE_PREMIUM_MONTHLY || "",
  enterprise_monthly: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY || "",
  basic_annual: import.meta.env.VITE_STRIPE_PRICE_BASIC_ANNUAL || "",
  standard_annual: import.meta.env.VITE_STRIPE_PRICE_STANDARD_ANNUAL || "",
  premium_annual: import.meta.env.VITE_STRIPE_PRICE_PREMIUM_ANNUAL || "",
  enterprise_annual: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_ANNUAL || "",
}

// Function to create a checkout session with our backend
export async function createCheckoutSession(priceId: string, successUrl: string, cancelUrl: string) {
  try {
    // Validate inputs
    if (!priceId) throw new Error("Price ID is required")
    if (!successUrl) throw new Error("Success URL is required")
    if (!cancelUrl) throw new Error("Cancel URL is required")

    // Get the current user from our auth service
    const user = getCurrentUser()
    if (!user) throw new Error("User must be authenticated to create a checkout session")

    // Create the checkout session
    const response = await axios.post(
      `${API_URL}/subscription/create-checkout-session`,
      {
        priceId,
        successUrl,
        cancelUrl,
        userId: user.id,
        customerEmail: user.email,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      },
    )

    return response.data
  } catch (error) {
    console.error("Error creating checkout session:", error)
    throw error
  }
}

// Get subscription status from backend
export async function getSubscriptionStatus() {
  try {
    const user = getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const response = await axios.get(`${API_URL}/subscription/status`, {
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
      },
    })

    if (response.data.success) {
      return {
        tier: response.data.subscription.tier,
        status: response.data.subscription.status,
        features: response.data.subscription.features,
        expiresAt: response.data.subscription.expiresAt,
        currentPeriodEnd: response.data.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: response.data.subscription.cancelAtPeriodEnd,
      }
    }

    throw new Error("Failed to get subscription status")
  } catch (error) {
    console.error("Error fetching subscription status:", error)
    throw error
  }
}

// Create customer portal session
export async function createCustomerPortalSession(returnUrl: string) {
  try {
    const user = getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const response = await axios.post(
      `${API_URL}/subscription/create-portal-session`,
      {
        returnUrl,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      },
    )

    return response.data
  } catch (error) {
    console.error("Error creating customer portal session:", error)
    throw error
  }
}

// Cancel subscription
export async function cancelSubscription(atPeriodEnd = true) {
  try {
    const user = getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const response = await axios.post(
      `${API_URL}/subscription/cancel`,
      {
        atPeriodEnd,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      },
    )

    return response.data
  } catch (error) {
    console.error("Error canceling subscription:", error)
    throw error
  }
}

// Update subscription
export async function updateSubscription(priceId: string) {
  try {
    const user = getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const response = await axios.post(
      `${API_URL}/subscription/update`,
      {
        priceId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      },
    )

    return response.data
  } catch (error) {
    console.error("Error updating subscription:", error)
    throw error
  }
}

// Get invoice history
export async function getInvoiceHistory() {
  try {
    const user = getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const response = await axios.get(`${API_URL}/subscription/invoices`, {
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
      },
    })

    return response.data
  } catch (error) {
    console.error("Error fetching invoice history:", error)
    throw error
  }
}

// Get usage data
export async function getUsageData() {
  try {
    const user = getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const response = await axios.get(`${API_URL}/subscription/usage`, {
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
      },
    })

    return response.data
  } catch (error) {
    console.error("Error fetching usage data:", error)
    throw error
  }
}

// Utility function to check if a user has access to a feature based on their subscription
export function hasFeatureAccess(userTier: string, featureName: string): boolean {
  const tier = SUBSCRIPTION_TIERS[userTier as keyof typeof SUBSCRIPTION_TIERS]
  if (!tier) return false

  return tier.features.includes(featureName)
}

// Using the user's actual features from database via authService
export function hasUserFeatureAccess(featureName: string): boolean {
  const user = getCurrentUser()
  if (!user) return false

  return user.features.includes(featureName)
}

// Utility function to get user's API quota based on subscription
export function getApiQuota(userTier: string): number {
  const tier = SUBSCRIPTION_TIERS[userTier as keyof typeof SUBSCRIPTION_TIERS]
  if (!tier) return 0

  return tier.apiQuota
}

// Helper function to get auth token
async function getAuthToken(): Promise<string> {
  // This should be implemented based on your auth provider
  // For Auth0, you might use getAccessTokenSilently()
  // For custom auth, you might get it from localStorage

  // Example implementation:
  try {
    // Try to get from Auth0 if available
    if (window.auth0Client) {
      return await window.auth0Client.getTokenSilently()
    }

    // Fallback to localStorage
    const token = localStorage.getItem("lark_auth_token")
    if (token) return token

    throw new Error("No authentication token available")
  } catch (error) {
    console.error("Error getting auth token:", error)
    throw error
  }
}

