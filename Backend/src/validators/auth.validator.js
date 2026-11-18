import { ApiError } from '../utils/ApiError.js';

const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

/**
 * Validate user registration request body
 */
export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters long');
  } else if (name.trim().length > 60) {
    errors.push('Name cannot exceed 60 characters');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  next();
};

/**
 * Validate login request body
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  next();
};

/**
 * Validate Google OAuth token exchange request
 */
export const validateGoogleAuth = (req, res, next) => {
  const idToken = req.body?.idToken || req.body?.token || req.body?.credential;

  if (!idToken || typeof idToken !== 'string' || idToken.trim().length === 0) {
    return next(
      new ApiError(400, 'Google ID token (idToken or credential) is required')
    );
  }

  // Normalize to req.body.idToken
  req.body.idToken = idToken.trim();
  next();
};

/**
 * Validate profile update request
 */
export const validateProfileUpdate = (req, res, next) => {
  const { name, profileImage, preferences } = req.body || {};
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    } else if (name.trim().length > 60) {
      errors.push('Name cannot exceed 60 characters');
    }
  }

  if (profileImage !== undefined && typeof profileImage !== 'string') {
    errors.push('Profile image must be a valid string URL');
  }

  if (preferences !== undefined && (typeof preferences !== 'object' || preferences === null)) {
    errors.push('Preferences must be a valid object');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  next();
};

/**
 * Validate change password request
 */
export const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body || {};
  const errors = [];

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    errors.push('New password is required and must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  next();
};

export default {
  validateRegister,
  validateLogin,
  validateGoogleAuth,
  validateProfileUpdate,
  validateChangePassword,
};

