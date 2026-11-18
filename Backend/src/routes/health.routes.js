import { Router } from 'express';
import { getHealthStatus } from '../controllers/health.controller.js';

const router = Router();

/**
 * Health check route
 * Endpoint: GET /api/health
 */
router.route('/health').get(getHealthStatus);

export default router;

