import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import {
  validateNotificationQuery,
  validateNotificationId,
} from '../validators/notification.validator.js';

const router = Router();

// Protect all notification routes
router.use(protect);

// GET /api/notifications
router.get('/', validateNotificationQuery, getNotifications);

// PATCH /api/notifications/read-all (Declared BEFORE /:notificationId/read)
router.patch('/read-all', markAllAsRead);

// PATCH /api/notifications/:notificationId/read
router.patch('/:notificationId/read', validateNotificationId, markAsRead);

export default router;

