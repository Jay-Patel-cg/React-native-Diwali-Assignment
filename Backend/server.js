import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

import app from './src/app.js';
import { connectDB } from './src/config/db.js';

const PORT = process.env.PORT || 5000;

/**
 * Start the HTTP server after initializing database connectivity.
 */
const startServer = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.JWT_SECRET) {
        console.warn('[Config] WARNING: JWT_SECRET is not set. Authentication endpoints will fail.');
      }
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        console.warn('[Config] WARNING: GEMINI_API_KEY is not configured. AI endpoints will return 503.');
      }
    }

    // Attempt database connection
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        console.log('[Database] MongoDB connected successfully.');
      } catch (dbError) {
        console.warn(
          `[Database] Initial MongoDB connection failed: ${dbError.message}`
        );
        console.warn(
          '[Database] The server will still run, but database-dependent endpoints will fail until MongoDB is accessible.'
        );
      }
    } else {
      console.warn(
        '[Database] MONGODB_URI not set in environment variables. Running in standalone mode.'
      );
    }

    // Launch HTTP listener (0.0.0.0 binds to all network interfaces for cloud/mobile testing)
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('========================================================');
      console.log(`  Samundar Ke Sath Backend API`);
      console.log(`  Status      : Running`);
      console.log(`  Port        : ${PORT}`);
      console.log(`  Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Local URL   : http://localhost:${PORT}/api`);
      console.log(`  Bind URL    : http://0.0.0.0:${PORT}/api`);
      console.log(`  Health Check: http://localhost:${PORT}/health (and /api/health)`);
      console.log('========================================================');
    });

    // Graceful shutdown handling
    const shutdown = (signal) => {
      console.log(`\n[Server] ${signal} signal received. Closing HTTP server...`);
      server.close(() => {
        console.log('[Server] HTTP server closed gracefully.');
        process.exit(0);
      });

      // Force shutdown after timeout if pending connections hang
      setTimeout(() => {
        console.error('[Server] Forced shutdown due to timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    process.on('unhandledRejection', (reason) => {
      console.error('[Process] Unhandled Promise Rejection:', reason);
    });

    process.on('uncaughtException', (err) => {
      console.error('[Process] Uncaught Exception:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('[Server] Fatal startup failure:', error.message);
    process.exit(1);
  }
};

startServer();
