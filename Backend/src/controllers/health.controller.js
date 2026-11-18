import mongoose from 'mongoose';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Get API and Database Health Status
 * @route   GET /api/health
 * @access  Public
 */
export const getHealthStatus = asyncHandler(async (req, res) => {
  const connectionStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbStateCode = mongoose.connection.readyState;
  const dbStatus = connectionStates[dbStateCode] || 'unknown';

  const healthData = {
    service: 'Samundar Ke Sath API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      readyState: dbStateCode,
    },
  };

  return res
    .status(200)
    .json(new ApiResponse(200, healthData, 'System is healthy and operational'));
});

export default { getHealthStatus };

