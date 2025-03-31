/**
 * Performance monitoring utilities for frontend
 */

/**
 * Measure and report Core Web Vitals
 */
export const measureWebVitals = () => {
  // Check if the Web Vitals API is available
  if ("web-vitals" in window) {
    import("web-vitals").then(({ getCLS, getFID, getLCP, getFCP, getTTFB }) => {
      getCLS(sendToAnalytics)
      getFID(sendToAnalytics)
      getLCP(sendToAnalytics)
      getFCP(sendToAnalytics)
      getTTFB(sendToAnalytics)
    })
  }
}

/**
 * Send performance metrics to analytics
 * @param {Object} metric - Performance metric
 */
const sendToAnalytics = (metric) => {
  // Clone the metric to avoid mutations
  const metricData = { ...metric }

  // Add the current page URL
  metricData.url = window.location.href

  // Send to analytics endpoint
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/performance", JSON.stringify(metricData))
  } else {
    fetch("/api/analytics/performance", {
      method: "POST",
      body: JSON.stringify(metricData),
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  // Log to console in development
  if (process.env.NODE_ENV !== "production") {
    console.log("Performance metric:", metric.name, metric.value)
  }
}

/**
 * Track resource loading performance
 */
export const trackResourcePerformance = () => {
  // Check if the Performance API is available
  if (!performance || !performance.getEntriesByType) {
    return
  }

  // Wait for the page to fully load
  window.addEventListener("load", () => {
    // Give browser time to finish any post-load tasks
    setTimeout(() => {
      // Get all resource entries
      const resources = performance.getEntriesByType("resource")

      // Filter and analyze resources
      const slowResources = resources.filter((resource) => {
        // Consider resources taking more than 1 second as slow
        return resource.duration > 1000
      })

      // Report slow resources
      if (slowResources.length > 0) {
        console.warn("Slow resources detected:", slowResources)

        // Send to analytics
        fetch("/api/analytics/slow-resources", {
          method: "POST",
          body: JSON.stringify({ resources: slowResources }),
          headers: {
            "Content-Type": "application/json",
          },
        })
      }

      // Clear the performance buffer
      if (performance.clearResourceTimings) {
        performance.clearResourceTimings()
      }
    }, 3000)
  })
}

/**
 * Initialize performance monitoring
 */
export const initPerformanceMonitoring = () => {
  // Measure Core Web Vitals
  measureWebVitals()

  // Track resource loading performance
  trackResourcePerformance()

  // Report JS errors
  window.addEventListener("error", (event) => {
    const errorData = {
      message: event.message,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error ? event.error.stack : "",
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    // Send to error reporting endpoint
    fetch("/api/analytics/error", {
      method: "POST",
      body: JSON.stringify(errorData),
      headers: {
        "Content-Type": "application/json",
      },
    })
  })
}

