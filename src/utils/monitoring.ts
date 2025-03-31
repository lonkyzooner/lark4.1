import * as Sentry from "@sentry/react"
import { BrowserTracing } from "@sentry/tracing"

export const initializeMonitoring = () => {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 0.2,
      environment: import.meta.env.MODE,
      beforeSend(event) {
        // Don't send PII data
        if (event.user) {
          delete event.user.ip_address
          delete event.user.email
        }
        return event
      },
    })
  }
}

export const captureException = (error: unknown, context?: Record<string, any>) => {
  console.error(error)

  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context,
    })
  }
}

export const setUserContext = (userId: string, role: string) => {
  if (import.meta.env.PROD) {
    Sentry.setUser({
      id: userId,
      role,
    })
  }
}

export const clearUserContext = () => {
  if (import.meta.env.PROD) {
    Sentry.setUser(null)
  }
}

