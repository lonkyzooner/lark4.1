/**
 * Environment variable validation utility
 * Ensures all required environment variables are present and valid
 */
class EnvValidator {
  constructor() {
    this.validations = {}
    this.errors = []
  }

  /**
   * Add a validation rule for an environment variable
   * @param {string} name - Environment variable name
   * @param {Object} options - Validation options
   * @returns {EnvValidator} - This instance for chaining
   */
  add(name, options = {}) {
    this.validations[name] = {
      required: options.required !== false,
      type: options.type || "string",
      pattern: options.pattern,
      validator: options.validator,
      default: options.default,
      description: options.description || "",
      secret: options.secret === true,
    }

    return this
  }

  /**
   * Validate all environment variables
   * @returns {Object} - Validation result
   */
  validate() {
    this.errors = []
    const validated = {}

    // Check each validation rule
    Object.entries(this.validations).forEach(([name, options]) => {
      let value = process.env[name]

      // Check if required
      if (options.required && value === undefined) {
        if (options.default !== undefined) {
          value = options.default
        } else {
          this.errors.push(`Missing required environment variable: ${name}`)
          return
        }
      }

      // Skip validation if value is undefined (not required)
      if (value === undefined) {
        return
      }

      // Validate type
      if (options.type) {
        switch (options.type) {
          case "number":
            const num = Number(value)
            if (isNaN(num)) {
              this.errors.push(`Environment variable ${name} must be a number`)
              return
            }
            value = num
            break

          case "boolean":
            if (value.toLowerCase() === "true") {
              value = true
            } else if (value.toLowerCase() === "false") {
              value = false
            } else {
              this.errors.push(`Environment variable ${name} must be a boolean (true/false)`)
              return
            }
            break

          case "json":
            try {
              value = JSON.parse(value)
            } catch (error) {
              this.errors.push(`Environment variable ${name} must be valid JSON`)
              return
            }
            break

          case "url":
            try {
              new URL(value)
            } catch (error) {
              this.errors.push(`Environment variable ${name} must be a valid URL`)
              return
            }
            break
        }
      }

      // Validate pattern
      if (options.pattern && !options.pattern.test(value)) {
        this.errors.push(`Environment variable ${name} does not match required pattern`)
        return
      }

      // Validate with custom validator
      if (options.validator && typeof options.validator === "function") {
        try {
          const result = options.validator(value)
          if (result !== true) {
            this.errors.push(`Environment variable ${name} is invalid: ${result || "failed validation"}`)
            return
          }
        } catch (error) {
          this.errors.push(`Environment variable ${name} validation error: ${error.message}`)
          return
        }
      }

      // Add to validated values
      validated[name] = value
    })

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      values: validated,
    }
  }

  /**
   * Generate a template .env file
   * @returns {string} - Template .env file content
   */
  generateTemplate() {
    let template = "# Environment Variables\n\n"

    Object.entries(this.validations).forEach(([name, options]) => {
      // Add description as comment
      if (options.description) {
        template += `# ${options.description}\n`
      }

      // Add the variable with default or example value
      if (options.default !== undefined) {
        template += `${name}=${options.default}\n`
      } else {
        template += `${name}=\n`
      }

      // Add empty line after each variable
      template += "\n"
    })

    return template
  }

  /**
   * Get all validation errors
   * @returns {Array} - Array of error messages
   */
  getErrors() {
    return this.errors
  }
}

// Create and configure the validator
const envValidator = new EnvValidator()

// Add validation rules for all environment variables
envValidator
  // Database
  .add("MONGODB_URI", {
    required: true,
    type: "string",
    description: "MongoDB connection URI",
  })

  // Authentication
  .add("JWT_SECRET", {
    required: true,
    type: "string",
    description: "Secret key for JWT tokens",
    secret: true,
  })
  .add("JWT_EXPIRES_IN", {
    required: false,
    type: "string",
    default: "15m",
    pattern: /^\d+[smhdw]$/,
    description: "JWT token expiration time (e.g., 15m, 1h, 7d)",
  })
  .add("REFRESH_TOKEN_EXPIRES_IN", {
    required: false,
    type: "string",
    default: "7d",
    pattern: /^\d+[smhdw]$/,
    description: "Refresh token expiration time (e.g., 7d, 30d)",
  })
  .add("ENCRYPTION_KEY", {
    required: true,
    type: "string",
    description: "Encryption key for sensitive data (32 bytes)",
    secret: true,
  })

  // Auth0
  .add("AUTH0_AUDIENCE", {
    required: true,
    type: "string",
    description: "Auth0 API audience",
  })
  .add("AUTH0_ISSUER_BASE_URL", {
    required: true,
    type: "url",
    description: "Auth0 issuer base URL",
  })
  .add("AUTH0_MANAGEMENT_CLIENT_ID", {
    required: true,
    type: "string",
    description: "Auth0 management API client ID",
    secret: true,
  })
  .add("AUTH0_MANAGEMENT_CLIENT_SECRET", {
    required: true,
    type: "string",
    description: "Auth0 management API client secret",
    secret: true,
  })

  // Stripe
  .add("STRIPE_SECRET_KEY", {
    required: true,
    type: "string",
    pattern: /^sk_/,
    description: "Stripe secret key",
    secret: true,
  })
  .add("STRIPE_WEBHOOK_SECRET", {
    required: true,
    type: "string",
    description: "Stripe webhook signing secret",
    secret: true,
  })
  .add("STRIPE_PRICE_STANDARD_MONTHLY", {
    required: true,
    type: "string",
    pattern: /^price_/,
    description: "Stripe price ID for standard monthly plan",
  })
  .add("STRIPE_PRICE_STANDARD_ANNUAL", {
    required: true,
    type: "string",
    pattern: /^price_/,
    description: "Stripe price ID for standard annual plan",
  })
  .add("STRIPE_PRICE_PREMIUM_MONTHLY", {
    required: true,
    type: "string",
    pattern: /^price_/,
    description: "Stripe price ID for premium monthly plan",
  })
  .add("STRIPE_PRICE_PREMIUM_ANNUAL", {
    required: true,
    type: "string",
    pattern: /^price_/,
    description: "Stripe price ID for premium annual plan",
  })
  .add("STRIPE_PRICE_ENTERPRISE_MONTHLY", {
    required: true,
    type: "string",
    pattern: /^price_/,
    description: "Stripe price ID for enterprise monthly plan",
  })
  .add("STRIPE_PRICE_ENTERPRISE_ANNUAL", {
    required: true,
    type: "string",
    pattern: /^price_/,
    description: "Stripe price ID for enterprise annual plan",
  })

  // Email
  .add("EMAIL_SERVICE", {
    required: true,
    type: "string",
    description: "Email service provider (e.g., gmail, sendgrid)",
  })
  .add("EMAIL_USER", {
    required: true,
    type: "string",
    description: "Email service username or API key",
  })
  .add("EMAIL_PASSWORD", {
    required: true,
    type: "string",
    description: "Email service password or API secret",
    secret: true,
  })
  .add("EMAIL_FROM", {
    required: true,
    type: "string",
    description: "Email sender address",
  })

  // LiveKit
  .add("LIVEKIT_API_KEY", {
    required: true,
    type: "string",
    description: "LiveKit API key",
    secret: true,
  })
  .add("LIVEKIT_API_SECRET", {
    required: true,
    type: "string",
    description: "LiveKit API secret",
    secret: true,
  })
  .add("VITE_LIVEKIT_URL", {
    required: true,
    type: "url",
    description: "LiveKit server URL",
  })

  // AI Services
  .add("VITE_OPENAI_API_KEY", {
    required: true,
    type: "string",
    pattern: /^sk-/,
    description: "OpenAI API key",
    secret: true,
  })
  .add("VITE_GROQ_API_KEY", {
    required: false,
    type: "string",
    description: "Groq API key",
    secret: true,
  })
  .add("VITE_HUGGINGFACE_API_KEY", {
    required: false,
    type: "string",
    description: "HuggingFace API key",
    secret: true,
  })

  // Frontend
  .add("FRONTEND_URL", {
    required: true,
    type: "url",
    description: "Frontend application URL",
  })

  // Server
  .add("PORT", {
    required: false,
    type: "number",
    default: 5000,
    description: "Server port",
  })
  .add("ALLOWED_ORIGINS", {
    required: false,
    type: "string",
    default: "*",
    description: "Comma-separated list of allowed CORS origins",
  })

  // Monitoring
  .add("VITE_SENTRY_DSN", {
    required: false,
    type: "string",
    description: "Sentry DSN for error tracking",
  })

// Export the validator
export default envValidator

