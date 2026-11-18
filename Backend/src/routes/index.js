import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import tripRoutes from './trip.routes.js';

const router = Router();

// Health Check Routes (mounted at /api/health)
router.use('/', healthRoutes);

// Authentication Routes (mounted at /api/auth)
router.use('/auth', authRoutes);

// Trip Management Routes (mounted at /api/trips)
router.use('/trips', tripRoutes);

// Modular feature routes to be mounted in upcoming phases:
// router.use('/expenses', expenseRoutes);
// router.use('/ai', aiRoutes);

export default router;
