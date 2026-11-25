import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/authRateLimiter.js';
import {
  validateRegister,
  validateLogin,
  validateGoogleAuth,
  validateProfileUpdate,
  validateChangePassword,
} from '../validators/auth.validator.js';

const router = Router();

// Public Authentication Routes (Defended with brute-force rate limiter)
router.post('/register', authRateLimiter, validateRegister, register);
router.post('/login', authRateLimiter, validateLogin, login);
router.post('/google', authRateLimiter, validateGoogleAuth, googleAuth);

// Protected User Routes (Require valid JWT Bearer token)
router.get('/me', protect, getCurrentUser);
router.patch('/profile', protect, validateProfileUpdate, updateProfile);
router.patch('/change-password', protect, validateChangePassword, changePassword);
router.post('/logout', protect, logout);

export default router;

