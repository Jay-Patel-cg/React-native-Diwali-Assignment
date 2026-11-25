import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import routes from './routes/index.js';
import { getHealthStatus } from './controllers/health.controller.js';
import { connectDB } from './config/db.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ApiError } from './utils/ApiError.js';
import { ApiResponse } from './utils/ApiResponse.js';

const app = express();

// Trust first reverse proxy hop (required on Render/cloud hosting for accurate req.ip & rate limiting)
app.set('trust proxy', 1);

// ==========================================
// 1. Defensive Security Headers
// ==========================================
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// ==========================================
// 2. CORS Configuration
// ==========================================
const parseAllowedOrigins = () => {
  if (!process.env.CLIENT_URL) {
    return [];
  }
  return process.env.CLIENT_URL.split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
};

const isDefaultExpoOrLocalOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin) ||
  /^exp:\/\//i.test(origin) ||
  /^https:\/\/[a-z0-9-]+\.exp\.direct(:\d+)?$/i.test(origin);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server, curl, Postman, and React Native / Expo mobile clients with no Origin header
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/+$/, '');
    const allowedOrigins = parseAllowedOrigins();

    if (
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(normalizedOrigin) ||
      process.env.NODE_ENV === 'development' ||
      (allowedOrigins.length === 0 && isDefaultExpoOrLocalOrigin(normalizedOrigin))
    ) {
      return callback(null, true);
    }

    return callback(new ApiError(403, `CORS origin '${origin}' is not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// ==========================================
// 3. Request Parsing Middleware
// ==========================================
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ==========================================
// 4. Root & Health Check Endpoints
// ==========================================
app.get('/', (req, res) => {
  res.status(200).json(
    new ApiResponse(
      200,
      {
        name: 'Samundar Ke Sath API',
        version: '1.0.0',
        description: 'Production-ready REST API for Samundar Ke Sath Travel App',
        healthCheck: '/health',
        apiHealthCheck: '/api/health',
      },
      'Welcome to Samundar Ke Sath API'
    )
  );
});

app.get('/health', getHealthStatus);

// ==========================================
// 5. Serverless-Safe Database Connection Guard
// Ensures MongoDB is connected on Vercel cold starts before hitting DB routes
// ==========================================
app.use('/api', async (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }

  if (mongoose.connection.readyState === 1) {
    return next();
  }

  try {
    await connectDB();
    return next();
  } catch (err) {
    return next(
      new ApiError(
        503,
        'Database service is currently unavailable. Please try again shortly.'
      )
    );
  }
});

// ==========================================
// 6. API Routes
// ==========================================
app.use('/api', routes);

// ==========================================
// 7. Error Handlers
// ==========================================
// Handle unmapped routes (404)
app.use(notFound);

// Centralized error handling
app.use(errorHandler);

export default app;
