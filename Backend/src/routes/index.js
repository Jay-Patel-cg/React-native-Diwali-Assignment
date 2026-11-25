import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import tripRoutes from './trip.routes.js';
import aiRoutes from './aiRoutes.js';
import destinationRoutes from './destination.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

// Health Check Routes (mounted at /api/health)
router.use('/', healthRoutes);

// Authentication Routes (mounted at /api/auth)
router.use('/auth', authRoutes);

// Trip Management, Collaboration, Itinerary, Packing List & Expenses (mounted at /api/trips)
router.use('/trips', tripRoutes);

// Destination Discovery Routes (mounted at /api/destinations)
router.use('/destinations', destinationRoutes);

// Notification Inbox Routes (mounted at /api/notifications)
router.use('/notifications', notificationRoutes);

// Google Gemini AI Travel Copilot Routes (mounted at /api/ai)
router.use('/ai', aiRoutes);

export default router;
