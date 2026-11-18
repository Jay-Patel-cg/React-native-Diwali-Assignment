import { ApiError } from '../utils/ApiError.js';

/**
 * Centralized Error Handling Middleware
 * Catches all operational and unexpected errors, transforms them into
 * a standard JSON format, and returns the appropriate HTTP status code.
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Convert non-ApiError instances to ApiError
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid ID for field: ${err.path}`;
    error = new ApiError(400, message);
  }

  // Handle Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for '${field}'. Please use another value.`;
    error = new ApiError(409, message);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((val) => val.message);
    const message = `Validation failed: ${messages.join(', ')}`;
    error = new ApiError(400, message, messages);
  }

  // Handle JWT Malformed / Invalid
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token. Please log in again.';
    error = new ApiError(401, message);
  }

  // Handle JWT Expired
  if (err.name === 'TokenExpiredError') {
    const message = 'Authentication token has expired. Please log in again.';
    error = new ApiError(401, message);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(error.statusCode).json(response);
};

export default errorHandler;

