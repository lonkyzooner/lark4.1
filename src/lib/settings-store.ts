import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface UserSettings {
  officerName: string
  wakeWordEnabled: boolean
  commandCacheEnabled: boolean
  voicePreferences: {
    voiceId: string
    speed: number
    volume: number
    urgencyLevels: boolean
    adaptiveSpeed: boolean
    audioFeedback: boolean
    synthesisMethod: "livekit" | "browser" | "auto"
  }
  offlineMode: {
    enableCache: boolean
    cacheStatutes: boolean
    cacheMiranda: boolean
    maxCacheSize: number
  }
  commandContext: {
    enableChaining: boolean
    contextTimeout: number
    maxContextLength: number
  }
}

const defaultSettings: UserSettings = {
  officerName: "",
  wakeWordEnabled: true,
  commandCacheEnabled: true,
  voicePreferences: {
    voiceId: "alloy", // OpenAI default voice
    speed: 1.0,
    volume: 1.0,
    urgencyLevels: true,
    adaptiveSpeed: true,
    audioFeedback: true,
    synthesisMethod: "auto", // Default to auto which uses LiveKit with browser fallback
  },
  offlineMode: {
    enableCache: true,
    cacheStatutes: true,
    cacheMiranda: true,
    maxCacheSize: 100, // MB
  },
  commandContext: {
    enableChaining: true,
    contextTimeout: 300, // seconds
    maxContextLength: 5, // commands
  },
}

// Function to ensure officer name is properly saved in both zustand and localStorage for redundancy
const saveOfficerNameToAllStorages = (name: string) => {
  try {
    // Always save to localStorage as a backup
    localStorage.setItem("lark-officer-name", name)
    console.log("Officer name saved to localStorage:", name)

    // Try to save to IndexedDB if available (for future offline capability)
    try {
      const db = window.indexedDB.open("lark-db", 1)
      db.onsuccess = (event) => {
        const database = (event.target as IDBOpenDBRequest).result
        const transaction = database.transaction(["settings"], "readwrite")
        const store = transaction.objectStore("settings")
        store.put({ key: "officerName", value: name })
        console.log("Officer name saved to IndexedDB:", name)
      }
    } catch (e) {
      console.log("Could not save to IndexedDB, falling back to localStorage only")
    }
  } catch (e) {
    console.error("Error saving officer name:", e)
  }
}

// Function to load officer name from all possible storage locations
const getOfficerNameFromAllStorages = (): string => {
  try {
    // Try to get from localStorage first (fastest)
    const lsName = localStorage.getItem("lark-officer-name")
    if (lsName) return lsName

    // If not in localStorage, the persist middleware should handle it
    return ""
  } catch (e) {
    console.error("Error getting officer name:", e)
    return ""
  }
}

export const useSettings = create(
  persist<{
    settings: UserSettings
    updateSettings: (settings: Partial<UserSettings>) => void
    updateOfficerName: (name: string) => void
    updateVoicePreferences: (prefs: Partial<UserSettings["voicePreferences"]>) => void
    updateOfflineMode: (prefs: Partial<UserSettings["offlineMode"]>) => void
    updateCommandContext: (prefs: Partial<UserSettings["commandContext"]>) => void
    getOfficerName: () => string
  }>(
    (set, get) => ({
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      updateOfficerName: (name) => {
        // Save to all storage options for redundancy
        saveOfficerNameToAllStorages(name)

        set((state) => ({
          settings: { ...state.settings, officerName: name },
        }))
      },

      // New getter method that checks all storage locations
      getOfficerName: () => {
        const state = get()
        // First check the Zustand store
        if (state.settings.officerName) {
          return state.settings.officerName
        }

        // Then check other storage options
        return getOfficerNameFromAllStorages()
      },
      updateVoicePreferences: (prefs) =>
        set((state) => ({
          settings: {
            ...state.settings,
            voicePreferences: { ...state.settings.voicePreferences, ...prefs },
          },
        })),
      updateOfflineMode: (prefs) =>
        set((state) => ({
          settings: {
            ...state.settings,
            offlineMode: { ...state.settings.offlineMode, ...prefs },
          },
        })),
      updateCommandContext: (prefs) =>
        set((state) => ({
          settings: {
            ...state.settings,
            commandContext: { ...state.settings.commandContext, ...prefs },
          },
        })),
    }),
    {
      name: "lark-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        updateSettings: state.updateSettings,
        updateOfficerName: state.updateOfficerName,
        updateVoicePreferences: state.updateVoicePreferences,
        updateOfflineMode: state.updateOfflineMode,
        updateCommandContext: state.updateCommandContext,
        getOfficerName: state.getOfficerName,
      }),
      onRehydrateStorage: (state) => {
        // When store rehydrates, ensure we also set the officer name in localStorage for backup
        return (rehydratedState, error) => {
          if (error) {
            console.error("Error rehydrating settings:", error)
          } else if (rehydratedState?.settings?.officerName) {
            saveOfficerNameToAllStorages(rehydratedState.settings.officerName)
          }

          // Initialize IndexedDB for settings if needed
          try {
            const request = window.indexedDB.open("lark-db", 1)
            request.onupgradeneeded = (event) => {
              const db = (event.target as IDBOpenDBRequest).result
              if (!db.objectStoreNames.contains("settings")) {
                db.createObjectStore("settings", { keyPath: "key" })
                console.log("Created settings store in IndexedDB")
              }
            }
          } catch (e) {
            console.log("IndexedDB not available, using localStorage only")
          }
        }
      },
    },
  ),
)

