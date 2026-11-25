import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { ApiError } from '../utils/ApiError.js';

let googleClientInstance = null;

/**
 * Returns a singleton instance of OAuth2Client for Google Token Verification
 */
const getGoogleClient = () => {
  if (!googleClientInstance) {
    googleClientInstance = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return googleClientInstance;
};

/**
 * Generate a signed JWT authentication token for a user
 * @param {string} userId - Mongoose User ObjectId
 * @returns {string} Signed JWT token string
 */
export const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables.');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id: userId }, secret, {
    expiresIn,
  });
};

/**
 * Cryptographically verify Google ID Token on the backend
 * Guarantees that user details come strictly from Google's verified payload.
 *
 * @param {string} idToken - The Google ID token sent from the client
 * @returns {Promise<Object>} Verified payload containing sub, email, name, picture
 */
export const verifyGoogleIdToken = async (idToken) => {
  try {
    const rawClientIds = process.env.GOOGLE_CLIENT_ID?.trim();
    if (
      !rawClientIds ||
      rawClientIds === 'your_google_client_id.apps.googleusercontent.com'
    ) {
      throw new ApiError(
        503,
        'Google Sign-In is not configured on the server. Please set a valid GOOGLE_CLIENT_ID.'
      );
    }

    const allowedAudiences = rawClientIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    const client = getGoogleClient();

    const ticket = await client.verifyIdToken({
      idToken,
      audience: allowedAudiences.length === 1 ? allowedAudiences[0] : allowedAudiences,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new ApiError(401, 'Invalid Google ID token payload');
    }

    if (!payload.email_verified) {
      throw new ApiError(401, 'Google account email is not verified');
    }

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name || payload.email.split('@')[0],
      profileImage: payload.picture || '',
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, `Google authentication failed: ${error.message}`);
  }
};

/**
 * Format user document to safely return in API responses
 * @param {Object} user - User Mongoose document or plain object
 * @returns {Object} Sanitized user object without sensitive fields
 */
export const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.__v;
  return userObj;
};

export default {
  generateToken,
  verifyGoogleIdToken,
  sanitizeUser,
};

