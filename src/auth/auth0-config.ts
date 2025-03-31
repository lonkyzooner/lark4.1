/**
 * Auth0 Configuration
 *
 * This file contains the configuration for Auth0 authentication.
 * Environment variables are loaded from .env file.
 */

// Auth0 domain and client ID from environment variables
export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || "",
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || "",
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || "",
  redirectUri: window.location.origin,

  // Scopes requested during authentication
  scope: "openid profile email offline_access",

  // Caching strategy
  cacheLocation: "localstorage" as const,

  // Use refresh tokens for session renewal
  useRefreshTokens: true,

  // Customize the login experience
  authorizationParams: {
    // Redirect back to the current page after login
    redirect_uri: window.location.origin,

    // Request offline access (refresh tokens)
    // Must be one of: 'none', 'login', 'consent', 'select_account'
    prompt: "login" as const,

    // Custom audience for API access
    audience: import.meta.env.VITE_AUTH0_AUDIENCE || "",

    // Scope for user information
    scope: "openid profile email offline_access",
  },

  // Custom application metadata
  appState: {
    returnTo: window.location.pathname,
    lark_app: "true",
  },
}

// Validate configuration
export const isAuth0Configured = (): boolean => {
  return !!(auth0Config.domain && auth0Config.clientId && auth0Config.audience)
}

// Get login options
export const getLoginOptions = (options?: Record<string, any>) => {
  return {
    authorizationParams: {
      ...auth0Config.authorizationParams,
      ...options,
    },
    appState: {
      returnTo: window.location.pathname,
      ...auth0Config.appState,
    },
  }
}

// Export default config
export default auth0Config

