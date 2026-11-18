/**
 * Standardized API Response Structure
 * Guarantees a predictable contract for API consumers (React Native app, Postman, etc.)
 */
export class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {*} data - Response data payload
   * @param {string} message - Success message
   */
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export default ApiResponse;

