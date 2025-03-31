/**
 * Image optimization utilities for better performance
 */

/**
 * Generate a responsive srcSet for images
 * @param {string} baseUrl - Base URL of the image
 * @param {Array} sizes - Array of sizes to generate
 * @returns {string} - srcSet attribute value
 */
export const generateSrcSet = (baseUrl, sizes = [320, 640, 960, 1280, 1920]) => {
  // Parse the URL to extract path and query parameters
  const url = new URL(baseUrl, window.location.origin)
  const path = url.pathname
  const params = new URLSearchParams(url.search)

  // Generate srcSet for each size
  return sizes
    .map((size) => {
      // Clone the params
      const sizeParams = new URLSearchParams(params)

      // Add or update width parameter
      sizeParams.set("w", size.toString())

      // Construct the URL for this size
      const sizeUrl = `${path}?${sizeParams.toString()}`

      // Return the srcSet entry
      return `${sizeUrl} ${size}w`
    })
    .join(", ")
}

/**
 * Calculate the sizes attribute for responsive images
 * @param {Object} breakpoints - Breakpoint configuration
 * @returns {string} - sizes attribute value
 */
export const calculateSizes = (
  breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  },
) => {
  return Object.entries(breakpoints)
    .sort(([, a], [, b]) => b - a) // Sort by breakpoint size descending
    .map(([key, size], index, arr) => {
      // For the smallest breakpoint, don't add a media query
      if (index === arr.length - 1) {
        return "100vw"
      }

      // For other breakpoints, add a media query
      return `(max-width: ${size}px) ${100 / (index + 1)}vw`
    })
    .join(", ")
}

/**
 * Lazy load images with Intersection Observer
 * @param {string} selector - CSS selector for images to lazy load
 */
export const setupLazyLoading = (selector = "img[data-lazy]") => {
  // Check if Intersection Observer is supported
  if (!("IntersectionObserver" in window)) {
    // Fallback for browsers that don't support Intersection Observer
    document.querySelectorAll(selector).forEach((img) => {
      if (img.dataset.src) {
        img.src = img.dataset.src
      }
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset
      }
    })
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target

          // Load the image
          if (img.dataset.src) {
            img.src = img.dataset.src
          }
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset
          }

          // Remove the observer after loading
          observer.unobserve(img)
        }
      })
    },
    {
      rootMargin: "50px 0px", // Start loading when image is 50px from viewport
      threshold: 0.01, // Trigger when 1% of the image is visible
    },
  )

  // Observe all images with the selector
  document.querySelectorAll(selector).forEach((img) => {
    observer.observe(img)
  })
}

/**
 * Preload critical images
 * @param {Array} urls - Array of image URLs to preload
 */
export const preloadCriticalImages = (urls = []) => {
  urls.forEach((url) => {
    const link = document.createElement("link")
    link.rel = "preload"
    link.as = "image"
    link.href = url
    document.head.appendChild(link)
  })
}

/**
 * Apply LQIP (Low Quality Image Placeholder) technique
 * @param {string} selector - CSS selector for images to apply LQIP
 */
export const applyLQIP = (selector = "img[data-lqip]") => {
  document.querySelectorAll(selector).forEach((img) => {
    // Create a new image element for the high-quality image
    const highQualityImg = new Image()

    // When the high-quality image is loaded
    highQualityImg.onload = () => {
      // Replace the low-quality image with the high-quality one
      img.src = highQualityImg.src

      // Add a class to fade in the high-quality image
      img.classList.add("loaded")

      // Remove the blur effect
      img.style.filter = "none"
    }

    // Set the source of the high-quality image
    if (img.dataset.src) {
      highQualityImg.src = img.dataset.src
    }
  })
}

