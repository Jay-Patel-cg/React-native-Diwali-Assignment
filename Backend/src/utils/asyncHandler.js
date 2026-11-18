/**
 * Higher-order function that wraps asynchronous Express route handlers
 * and catches unhandled promise rejections, passing them to next().
 *
 * @param {Function} requestHandler - Asynchronous Express route handler / controller
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler;

