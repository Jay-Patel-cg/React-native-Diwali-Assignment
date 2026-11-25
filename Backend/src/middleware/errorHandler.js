import { ApiError } from '../utils/ApiError.js';

/**
 * Centralized Error Handling Middleware
 * Catches all operational and unexpected errors, transforms them into
 * a standard JSON format, and returns the appropriate HTTP status code.
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle malformed JSON request body from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new ApiError(
      400,
      'Malformed JSON in request body. Please check your request syntax.'
    );
  }

  // Handle oversized request payloads
  if (err.type === 'entity.too.large' || err.status === 413) {
    error = new ApiError(
      413,
      'Request payload exceeds the maximum allowed size.'
    );
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

  // Handle MongoDB connectivity / server selection failures gracefully
  if (
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongooseServerSelectionError' ||
    (typeof err.message === 'string' &&
      err.message.includes('Client must be connected before running operations'))
  ) {
    error = new ApiError(
      503,
      'Database service is temporarily unavailable. Please try again shortly.'
    );
  }

  // Handle JWT Malformed / Invalid
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authentication token. Please log in again.');
  }

  // Handle JWT Expired
  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authentication token has expired. Please log in again.');
  }

  // Convert remaining non-ApiError instances to ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error.status || 500;
    const isProd = process.env.NODE_ENV === 'production';
    const message =
      statusCode >= 500 && isProd
        ? 'Internal Server Error'
        : error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
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
