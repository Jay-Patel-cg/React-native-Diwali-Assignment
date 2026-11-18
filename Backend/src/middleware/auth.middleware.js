import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Authentication Middleware
 * Validates the JWT Bearer token, fetches the associated user,
 * and attaches it to req.user for downstream controllers.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(
      401,
      'Authentication required. No authorization token provided.'
    );
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured on the server.');
  }

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Session expired. Please log in again.');
    }
    throw new ApiError(401, 'Invalid authentication token.');
  }

  // Retrieve user associated with token
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    throw new ApiError(
      401,
      'The user belonging to this token no longer exists.'
    );
  }

  // Attach sanitized user to request
  req.user = currentUser;
  next();
});

export const authMiddleware = protect;
export default protect;

