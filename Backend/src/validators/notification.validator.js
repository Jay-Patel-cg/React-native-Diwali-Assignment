import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { NOTIFICATION_TYPES } from '../models/Notification.js';

/**
 * Validates query parameters for GET /api/notifications
 */
export const validateNotificationQuery = (req, res, next) => {
  const { page, limit, isRead, type, relatedTrip } = req.query || {};
  const errors = [];

  if (page !== undefined) {
    const p = parseInt(page, 10);
    if (isNaN(p) || p < 1) errors.push('page must be a positive integer');
  }

  if (limit !== undefined) {
    const l = parseInt(limit, 10);
    if (isNaN(l) || l < 1 || l > 100) {
      errors.push('limit must be an integer between 1 and 100');
    }
  }

  if (isRead !== undefined && isRead !== 'true' && isRead !== 'false') {
    errors.push('isRead filter must be either "true" or "false"');
  }

  if (type !== undefined && !NOTIFICATION_TYPES.includes(String(type))) {
    errors.push(
      `Invalid notification type. Allowed: ${NOTIFICATION_TYPES.join(', ')}`
    );
  }

  if (relatedTrip !== undefined && !mongoose.Types.ObjectId.isValid(relatedTrip)) {
    errors.push('relatedTrip must be a valid ObjectId');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  next();
};

/**
 * Validates :notificationId parameter
 */
export const validateNotificationId = (req, res, next) => {
  const { notificationId } = req.params;
  if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
    return next(new ApiError(400, 'Invalid notification ID format'));
  }
  next();
};

export default {
  validateNotificationQuery,
  validateNotificationId,
};

