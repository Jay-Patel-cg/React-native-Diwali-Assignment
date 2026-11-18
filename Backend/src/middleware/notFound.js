import { ApiError } from '../utils/ApiError.js';

/**
 * 404 Route Not Found Middleware
 * Intercepts requests that match no defined routes and forwards an ApiError to errorHandler.
 */
export const notFound = (req, res, next) => {
  const error = new ApiError(
    404,
    `Route not found: ${req.method} ${req.originalUrl}`
  );
  next(error);
};

export default notFound;

