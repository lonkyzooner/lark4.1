/**
 * Standard API response formatter
 */
class ApiResponse {
  /**
   * Success response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Success message
   * @param {*} data - Response data
   * @param {Object} meta - Metadata (pagination, etc.)
   */
  static success(res, statusCode = 200, message = "Success", data = null, meta = {}) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      meta,
    })
  }

  /**
   * Error response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Object} errors - Detailed errors
   */
  static error(res, statusCode = 500, message = "Error", errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    })
  }

  /**
   * Not found response
   * @param {Object} res - Express response object
   * @param {string} message - Not found message
   */
  static notFound(res, message = "Resource not found") {
    return this.error(res, 404, message)
  }

  /**
   * Bad request response
   * @param {Object} res - Express response object
   * @param {string} message - Bad request message
   * @param {Object} errors - Validation errors
   */
  static badRequest(res, message = "Bad request", errors = null) {
    return this.error(res, 400, message, errors)
  }

  /**
   * Unauthorized response
   * @param {Object} res - Express response object
   * @param {string} message - Unauthorized message
   */
  static unauthorized(res, message = "Unauthorized") {
    return this.error(res, 401, message)
  }

  /**
   * Forbidden response
   * @param {Object} res - Express response object
   * @param {string} message - Forbidden message
   */
  static forbidden(res, message = "Forbidden") {
    return this.error(res, 403, message)
  }
}

module.exports = ApiResponse

