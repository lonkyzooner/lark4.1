const nodemailer = require("nodemailer")
const fs = require("fs").promises
const path = require("path")
const handlebars = require("handlebars")
const logger = require("../config/logger")

// Create reusable transporter
let transporter

// Initialize email transporter
const initTransporter = () => {
  if (transporter) return transporter

  // Check if email service is configured
  if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    logger.warn("Email service not configured properly. Email functionality will be disabled.")
    return null
  }

  // Create transporter object
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  })

  // Verify connection
  transporter.verify((error) => {
    if (error) {
      logger.error("Email service connection error:", error)
    } else {
      logger.info("Email service ready to send messages")
    }
  })

  return transporter
}

// Load email template
const loadTemplate = async (templateName) => {
  try {
    const filePath = path.join(__dirname, "../templates/emails", `${templateName}.html`)
    const template = await fs.readFile(filePath, "utf-8")
    return handlebars.compile(template)
  } catch (error) {
    logger.error(`Failed to load email template ${templateName}:`, error)
    throw error
  }
}

// Send email
const sendEmail = async (options) => {
  try {
    // Initialize transporter if not already done
    const emailTransporter = initTransporter()

    if (!emailTransporter) {
      logger.error("Email service not available")
      return false
    }

    // Set default from address if not provided
    const from = options.from || process.env.EMAIL_FROM || "noreply@larkapp.com"

    // Compile template if provided
    let html = options.html
    if (options.template) {
      const template = await loadTemplate(options.template)
      html = template(options.context || {})
    }

    // Send mail
    const info = await emailTransporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html,
    })

    logger.info(`Email sent: ${info.messageId}`)
    return true
  } catch (error) {
    logger.error("Error sending email:", error)
    return false
  }
}

module.exports = {
  sendEmail,
  loadTemplate,
}

