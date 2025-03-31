"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAuth0 } from "@auth0/auth0-react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"

/**
 * Auth0 Callback Component
 *
 * This component handles the callback from Auth0 after authentication.
 * It processes the authentication result and redirects the user to the appropriate page.
 */
const Auth0Callback: React.FC = () => {
  const { isLoading, isAuthenticated, error } = useAuth0()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // If there's an error, display it
    if (error) {
      console.error("Auth0 callback error:", error)
      setErrorMessage(error.message || "Authentication failed")
      return
    }

    // If authentication is complete and successful
    if (!isLoading) {
      // Get the return URL from the Auth0 state
      const params = new URLSearchParams(window.location.search)
      const state = params.get("state")

      let returnTo = "/dashboard"

      // Try to parse the state to get the returnTo URL
      if (state) {
        try {
          const decodedState = JSON.parse(atob(state))
          if (decodedState.appState && decodedState.appState.returnTo) {
            returnTo = decodedState.appState.returnTo
          }
        } catch (e) {
          console.error("Error parsing Auth0 state:", e)
        }
      }

      // If authenticated, redirect to the return URL
      if (isAuthenticated) {
        navigate(returnTo, { replace: true })
      } else {
        // If not authenticated but no error, redirect to login
        navigate("/login", { replace: true })
      }
    }
  }, [isLoading, isAuthenticated, error, navigate])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      {errorMessage ? (
        <div className="text-center">
          <div className="rounded-full bg-destructive/10 p-6 mx-auto w-fit mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-destructive h-10 w-10"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2">Authentication Error</h3>
          <p className="text-muted-foreground mb-4">{errorMessage}</p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Return to Login
          </button>
        </div>
      ) : (
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-xl font-medium">Completing authentication...</h3>
          <p className="text-muted-foreground mt-2">Please wait while we log you in.</p>
        </div>
      )}
    </div>
  )
}

export default Auth0Callback

