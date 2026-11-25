import mongoose from 'mongoose';

/**
 * Global cache object for MongoDB connection across serverless/Vercel
 * function invocations and traditional long-running Node.js processes.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
    listenersAttached: false,
  };
}

/**
 * Connect to MongoDB Atlas with connection pooling and serverless caching.
 * Verifies active readyState so stale connections after disconnects are re-established.
 * @returns {Promise<mongoose.Mongoose>}
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in the environment variables.');
  }

  // Return cached connection only if actively connected
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Attach lifecycle listeners only once per process
  if (!cached.listenersAttached) {
    cached.listenersAttached = true;

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      cached.conn = null;
      cached.promise = null;
      console.warn('MongoDB connection disconnected.');
    });
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }

  return cached.conn;
};

export default connectDB;
