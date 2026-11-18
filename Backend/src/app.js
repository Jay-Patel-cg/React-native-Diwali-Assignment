import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ==========================================
// 1. CORS Configuration
// ==========================================
const parseAllowedOrigins = () => {
  if (!process.env.CLIENT_URL) {
    return ['http://localhost:3000', 'http://localhost:8081'];
  }
  return process.env.CLIENT_URL.split(',').map((origin) => origin.trim());
};

const allowedOrigins = parseAllowedOrigins();

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server, curl, Postman, and mobile clients with no origin header
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV === 'development'
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin '${origin}' not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// ==========================================
// 2. Request Parsing Middleware
// ==========================================
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// ==========================================
// 3. Welcome / Root Endpoint
// ==========================================
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Samundar Ke Sath API',
    version: '1.0.0',
    description: 'Production-ready REST API for Samundar Ke Sath Travel App',
    healthCheck: '/api/health',
  });
});

// ==========================================
// 4. API Routes
// ==========================================
app.use('/api', routes);

// ==========================================
// 5. Error Handlers
// ==========================================
// Handle unmapped routes (404)
app.use(notFound);

// Centralized error handling
app.use(errorHandler);

export default app;
