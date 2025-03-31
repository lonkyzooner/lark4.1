// Service Worker for LARK Legal Assistant

const CACHE_NAME = "lark-cache-v1"
const OFFLINE_URL = "/offline.html"

// Assets to cache immediately
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png",
  "/manifest.json",
  "/static/css/main.chunk.css",
  "/static/js/main.chunk.js",
  "/static/js/bundle.js",
]

// Install event - precache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache")
        return cache.addAll(PRECACHE_ASSETS)
      })
      .then(() => self.skipWaiting()),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName)
            }
            return null
          }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests and browser extensions
  if (
    event.request.method !== "GET" ||
    event.request.url.startsWith("chrome-extension") ||
    event.request.url.includes("extension") ||
    event.request.url.includes("__")
  ) {
    return
  }

  // Skip API calls and external resources
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("openai.com") ||
    event.request.url.includes("stripe.com") ||
    event.request.url.includes("auth0.com")
  ) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response
      }

      // Clone the request because it's a one-time use stream
      const fetchRequest = event.request.clone()

      return fetch(fetchRequest)
        .then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response because it's a one-time use stream
          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // If network request fails and it's a navigation, show offline page
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL)
          }

          // For image requests, return a placeholder
          if (event.request.destination === "image") {
            return caches.match("/logo192.png")
          }

          // Return whatever we have in cache or nothing
          return caches.match(event.request)
        })
    }),
  )
})

// Handle push notifications
self.addEventListener("push", (event) => {
  const data = event.data.json()

  const options = {
    body: data.body,
    icon: "/logo192.png",
    badge: "/favicon.ico",
    data: {
      url: data.url || "/",
    },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(clients.openWindow(event.notification.data.url))
})

// Handle background sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-messages") {
    event.waitUntil(syncMessages())
  }
})

// Function to sync messages from IndexedDB to server
async function syncMessages() {
  try {
    // Open IndexedDB
    const db = await openDB("lark-offline-db", 1)

    // Get all pending messages
    const tx = db.transaction("offline-messages", "readwrite")
    const store = tx.objectStore("offline-messages")
    const pendingMessages = await store.getAll()

    // Send each message to the server
    for (const message of pendingMessages) {
      try {
        await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${message.token}`,
          },
          body: JSON.stringify(message.data),
        })

        // If successful, delete from IndexedDB
        await store.delete(message.id)
      } catch (error) {
        console.error("Failed to sync message:", error)
      }
    }

    await tx.complete
  } catch (error) {
    console.error("Sync failed:", error)
  }
}

// Helper function to open IndexedDB
function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains("offline-messages")) {
        db.createObjectStore("offline-messages", { keyPath: "id", autoIncrement: true })
      }
    }
  })
}

