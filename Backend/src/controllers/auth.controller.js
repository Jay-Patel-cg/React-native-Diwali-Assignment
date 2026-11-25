import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  generateToken,
  verifyGoogleIdToken,
  sanitizeUser,
} from '../services/auth.service.js';

const ALLOWED_PREFERENCE_FIELDS = [
  'preferredCurrency',
  'travelStyle',
  'dietaryRestrictions',
  'language',
  'notificationsEnabled',
];

const pickPreferences = (raw = {}) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result = {};
  for (const key of ALLOWED_PREFERENCE_FIELDS) {
    if (raw[key] !== undefined) result[key] = raw[key];
  }
  return result;
};

/**
 * @desc    Register a new user with email and password
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, preferences } = req.body;

  const normalizedEmail = email.toLowerCase().trim();

  // Check for existing user
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(
      409,
      'An account with this email address already exists'
    );
  }

  // Create new user (password is automatically hashed by User pre-save hook)
  const newUser = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    preferences: pickPreferences(preferences),
  });

  const token = generateToken(newUser._id);

  res.status(201).json(
    new ApiResponse(
      201,
      {
        user: sanitizeUser(newUser),
        token,
      },
      'User registered successfully'
    )
  );
});

/**
 * @desc    Authenticate user with email and password
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = email.toLowerCase().trim();

  // Explicitly select password field (select: false in schema)
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Handle Google OAuth accounts without set password
  if (!user.password) {
    throw new ApiError(
      401,
      'This account is registered using Google Sign-In. Please sign in with Google.'
    );
  }

  // Verify candidate password against stored bcrypt hash
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user._id);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: sanitizeUser(user),
        token,
      },
      'Login successful'
    )
  );
});

/**
 * @desc    Authenticate or register user with Google OAuth ID token
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  // Cryptographically verify ID token against Google servers
  const googleData = await verifyGoogleIdToken(idToken);

  let user = await User.findOne({
    $or: [{ googleId: googleData.googleId }, { email: googleData.email }],
  });

  if (user) {
    // If user existed with email but had not linked googleId yet, link it
    let modified = false;
    if (!user.googleId) {
      user.googleId = googleData.googleId;
      modified = true;
    }
    if (!user.profileImage && googleData.profileImage) {
      user.profileImage = googleData.profileImage;
      modified = true;
    }
    if (modified) {
      await user.save();
    }
  } else {
    // Register brand new user from verified Google payload
    user = await User.create({
      name: googleData.name,
      email: googleData.email,
      googleId: googleData.googleId,
      profileImage: googleData.profileImage,
    });
  }

  const token = generateToken(user._id);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: sanitizeUser(user),
        token,
      },
      'Google authentication successful'
    )
  );
});

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Private (Protected by JWT)
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(
      200,
      sanitizeUser(req.user),
      'User profile fetched successfully'
    )
  );
});

/**
 * @desc    Update user profile details & preferences
 * @route   PATCH /api/auth/profile
 * @access  Private (Protected by JWT)
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, profileImage, preferences } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (name !== undefined) user.name = name.trim();
  if (profileImage !== undefined) user.profileImage = profileImage;
  if (preferences !== undefined) {
    user.preferences = {
      ...(user.preferences?.toObject ? user.preferences.toObject() : {}),
      ...pickPreferences(preferences),
    };
  }

  await user.save();

  res.status(200).json(
    new ApiResponse(
      200,
      sanitizeUser(user),
      'Profile updated successfully'
    )
  );
});

/**
 * @desc    Change user password
 * @route   PATCH /api/auth/change-password
 * @access  Private (Protected by JWT)
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // If user already has an existing password, verify it first
  if (user.password) {
    if (!currentPassword) {
      throw new ApiError(400, 'Current password is required to set a new password');
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new ApiError(400, 'Current password is incorrect');
    }
  }

  // Set new password (will be hashed by pre-save hook)
  user.password = newPassword;
  await user.save();

  res.status(200).json(
    new ApiResponse(200, null, 'Password updated successfully')
  );
});

/**
 * @desc    Logout user (stateless JWT acknowledgment)
 * @route   POST /api/auth/logout
 * @access  Private (Protected by JWT)
 */
export const logout = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(200, null, 'Logged out successfully. Please clear client-stored tokens.')
  );
});

export default {
  register,
  login,
  googleAuth,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout,
};

