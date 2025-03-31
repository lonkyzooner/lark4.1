"use client"

import type React from "react"
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import App from "../App"
import ProtectedRoute from "../auth/ProtectedRoute"
import SubscriptionPage from "../pages/SubscriptionPage"
import StripePricingPage from "../pages/StripePricingPage"
import LandingPage from "../pages/LandingPage"
import AccountPage from "../pages/AccountPage"
import StripeLoginPage from "../pages/StripeLoginPage"
import DashboardPage from "../pages/DashboardPage"
import Auth0Callback from "../components/auth/Auth0Callback"
import { useAuth } from "../contexts/AuthContext"

// Create a layout component for authenticated pages
const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="min-h-screen">{children}</div>
}

// Define props interface for the App components
interface AppProps {
  initialTab?: string
}

// Redirect component to handle authentication state
const AuthRedirect: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // If we're still loading auth state, show nothing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If user is authenticated and trying to access root, redirect to dashboard
  if (isAuthenticated && location.pathname === "/") {
    return <Navigate to="/dashboard" replace />
  }

  // Otherwise show the landing page
  return <LandingPage />
}

// Main router component
export const AppRouter: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const isDevelopment = process.env.NODE_ENV !== "production"

  // Check for development mode or skip auth query parameter
  const urlParams = new URLSearchParams(window.location.search)
  const skipAuth = isDevelopment && urlParams.get("skipAuth") !== "false" // Default to true in dev unless explicitly set to false

  // Use App component for all cases
  const AppComponent = App as React.ComponentType<AppProps>

  // Create a development version of ProtectedRoute that doesn't require authentication
  const DevProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <>{children}</>
  }

  // Use the appropriate ProtectedRoute component
  const RouteGuard = skipAuth ? DevProtectedRoute : ProtectedRoute

  return (
    <BrowserRouter>
      <Routes>
        {/* Root route with conditional redirect */}
        <Route path="/" element={<AuthRedirect />} />

        {/* Public routes */}
        <Route path="/login" element={<StripeLoginPage />} />
        <Route path="/callback" element={<Auth0Callback />} />
        <Route path="/pricing" element={<StripePricingPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <RouteGuard>
              <AuthenticatedLayout>
                <DashboardPage />
              </AuthenticatedLayout>
            </RouteGuard>
          }
        />

        <Route
          path="/account"
          element={
            <RouteGuard>
              <AuthenticatedLayout>
                <AccountPage />
              </AuthenticatedLayout>
            </RouteGuard>
          }
        />

        <Route
          path="/subscription"
          element={
            <RouteGuard>
              <AuthenticatedLayout>
                <SubscriptionPage />
              </AuthenticatedLayout>
            </RouteGuard>
          }
        />

        {/* Premium features */}
        <Route
          path="/threat-detection"
          element={
            <RouteGuard>
              <AuthenticatedLayout>
                <AppComponent initialTab="threat" />
              </AuthenticatedLayout>
            </RouteGuard>
          }
        />

        <Route
          path="/miranda"
          element={
            <RouteGuard>
              <AuthenticatedLayout>
                <AppComponent initialTab="miranda" />
              </AuthenticatedLayout>
            </RouteGuard>
          }
        />

        <Route
          path="/statutes"
          element={
            <RouteGuard>
              <AuthenticatedLayout>
                <AppComponent initialTab="statutes" />
              </AuthenticatedLayout>
            </RouteGuard>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter

