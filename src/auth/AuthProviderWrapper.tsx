import type React from "react"
import { Auth0Provider } from "@auth0/auth0-react"
import { isAuth0Configured, auth0Config } from "./auth0-config"
import { StripeAuthProvider } from "./StripeAuthProvider"
import { AuthProvider } from "../contexts/AuthContext"
import { DevAuthProvider } from "../contexts/DevAuthContext"

interface AuthProviderWrapperProps {
  children: React.ReactNode
}

/**
 * Auth Provider Wrapper
 *
 * This component wraps the application with the appropriate authentication provider
 * based on the environment and configuration.
 *
 * It supports:
 * 1. Auth0 authentication in production
 * 2. Stripe authentication as an alternative
 * 3. Development authentication for local testing
 */
export const AuthProviderWrapper: React.FC<AuthProviderWrapperProps> = ({ children }) => {
  const isDevelopment = process.env.NODE_ENV !== "production"

  // Check URL parameters for auth mode override
  const urlParams = new URLSearchParams(window.location.search)
  const authMode = urlParams.get("authMode")

  // Determine which auth provider to use
  const useAuth0 = isAuth0Configured() && (authMode === "auth0" || (!authMode && !isDevelopment))
  const useStripe = authMode === "stripe" || (!useAuth0 && !isDevelopment)
  const useDev = isDevelopment && authMode !== "auth0" && authMode !== "stripe"

  // Log the auth mode being used
  console.log(`[Auth] Using ${useAuth0 ? "Auth0" : useStripe ? "Stripe" : "Development"} authentication`)

  // Auth0 Provider
  if (useAuth0) {
    return (
      <Auth0Provider
        domain={auth0Config.domain}
        clientId={auth0Config.clientId}
        authorizationParams={auth0Config.authorizationParams}
        cacheLocation={auth0Config.cacheLocation}
        useRefreshTokens={auth0Config.useRefreshTokens}
      >
        <AuthProvider>{children}</AuthProvider>
      </Auth0Provider>
    )
  }

  // Stripe Provider
  if (useStripe) {
    return <StripeAuthProvider>{children}</StripeAuthProvider>
  }

  // Development Provider (default for local development)
  return <DevAuthProvider>{children}</DevAuthProvider>
}

export default AuthProviderWrapper

