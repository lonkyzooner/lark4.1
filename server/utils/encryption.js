import { createDecipheriv, createCipheriv, randomBytes } from "crypto"

/**
 * Utility for encrypting and decrypting sensitive data
 * Uses AES-256-GCM for authenticated encryption
 */
export class Encryption {
  constructor(encryptionKey) {
    if (!encryptionKey || encryptionKey.length !== 32) {
      throw new Error("Encryption key must be 32 bytes (256 bits)")
    }
    this.encryptionKey = Buffer.from(encryptionKey)
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param {string|object} data - Data to encrypt
   * @returns {string} - Encrypted data as base64 string
   */
  encrypt(data) {
    // Convert object to string if needed
    const plaintext = typeof data === "object" ? JSON.stringify(data) : data

    // Generate a random IV for each encryption
    const iv = randomBytes(12)

    // Create cipher
    const cipher = createCipheriv("aes-256-gcm", this.encryptionKey, iv)

    // Encrypt the data
    let encrypted = cipher.update(plaintext, "utf8", "base64")
    encrypted += cipher.final("base64")

    // Get the auth tag
    const authTag = cipher.getAuthTag()

    // Combine IV, encrypted data, and auth tag
    const result = {
      iv: iv.toString("base64"),
      data: encrypted,
      tag: authTag.toString("base64"),
    }

    // Return as base64 encoded JSON
    return Buffer.from(JSON.stringify(result)).toString("base64")
  }

  /**
   * Decrypt data encrypted with encrypt()
   * @param {string} encryptedData - Base64 encoded encrypted data
   * @returns {string|object} - Decrypted data
   */
  decrypt(encryptedData) {
    try {
      // Parse the encrypted data
      const payload = JSON.parse(Buffer.from(encryptedData, "base64").toString())

      // Extract components
      const iv = Buffer.from(payload.iv, "base64")
      const tag = Buffer.from(payload.tag, "base64")
      const encrypted = payload.data

      // Create decipher
      const decipher = createDecipheriv("aes-256-gcm", this.encryptionKey, iv)
      decipher.setAuthTag(tag)

      // Decrypt the data
      let decrypted = decipher.update(encrypted, "base64", "utf8")
      decrypted += decipher.final("utf8")

      // Try to parse as JSON if possible
      try {
        return JSON.parse(decrypted)
      } catch (e) {
        // Return as string if not valid JSON
        return decrypted
      }
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`)
    }
  }
}

// Create singleton instance
let encryptionInstance = null

/**
 * Get the encryption instance
 * @returns {Encryption} - Encryption instance
 */
export const getEncryption = () => {
  if (!encryptionInstance) {
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error("ENCRYPTION_KEY environment variable is required")
    }

    // Ensure key is 32 bytes (256 bits)
    const key = Buffer.from(encryptionKey).slice(0, 32)
    if (key.length < 32) {
      // Pad key if needed
      const paddedKey = Buffer.alloc(32)
      key.copy(paddedKey)
      encryptionInstance = new Encryption(paddedKey)
    } else {
      encryptionInstance = new Encryption(key)
    }
  }

  return encryptionInstance
}

