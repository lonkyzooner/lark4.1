import { NextResponse } from "next/server"

// List of paths that should be cached at the edge
const CACHE_PATHS = ["/api/health", "/api/legal-resources", "/api/faq", "/api/pricing"]

// List of static asset extensions that should be cached
const STATIC_EXTENSIONS = [
  "css",
  "js",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "svg",
  "ico",
  "woff",
  "woff2",
  "ttf",
  "eot",
  "webp",
]

export async function middleware(request) {
  const { pathname } = new URL(request.url)

  // Check if the request is for a static asset
  const isStaticAsset = STATIC_EXTENSIONS.some((ext) => pathname.endsWith(`.${ext}`))

  // Check if the request is for a cacheable API path
  const isCacheablePath = CACHE_PATHS.some((path) => pathname.startsWith(path))

  // Apply caching headers for static assets and cacheable API paths
  if (isStaticAsset || isCacheablePath) {
    const response = NextResponse.next()

    // Cache static assets for 1 week, API responses for 5 minutes
    const maxAge = isStaticAsset ? 60 * 60 * 24 * 7 : 60 * 5

    response.headers.set(
      "Cache-Control",
      `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
    )

    return response
  }

  // Security headers for all responses
  const response = NextResponse.next()

  // Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  // Add CSP header
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net; connect-src 'self' https://api.openai.com https://api.stripe.com https://*.sentry.io; img-src 'self' data: blob: https://*.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src https://js.stripe.com;",
  )

  return response
}

export const config = {
  matcher: [
    // Match all API routes
    "/api/:path*",
    // Match all static files
    "/:path*.{js,css,jpg,jpeg,png,gif,svg,ico,woff,woff2,ttf,eot,webp}",
    // Match all pages except API routes
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}

