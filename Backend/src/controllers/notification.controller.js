import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as notificationService from '../services/notification.service.js';

/**
 * @desc    Get paginated notifications for the authenticated user
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req, res) => {
  // Opportunistically generate idempotent reminders for upcoming trips (within 7 days)
  if (req.query.includeReminders !== 'false') {
    await notificationService.generateUpcomingTripReminders(req.user._id, 7);
  }

  const result = await notificationService.getUserNotifications(
    req.user._id,
    req.query
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, result, 'Notifications retrieved successfully')
    );
});

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:notificationId/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationAsRead(
    req.user._id,
    req.params.notificationId
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, notification, 'Notification marked as read')
    );
});

/**
 * @desc    Mark all notifications as read for the authenticated user
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllNotificationsAsRead(
    req.user._id
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, result, 'All notifications marked as read')
    );
});

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
};

