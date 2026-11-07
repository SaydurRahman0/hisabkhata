import mongoose from 'mongoose';
import { env, sanitizeMongoUri } from './env.js';

/**
 * MongoDB connection and state management module using Mongoose.
 */

const READY_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

/**
 * Establishes connection to MongoDB.
 * @returns {Promise<boolean>} True if connected, false otherwise.
 */
export async function connectDatabase() {
  if (!env.MONGODB_URI) {
    if (env.isProduction) {
      throw new Error('Database connection failed: MONGODB_URI is not configured in production.');
    }
    console.warn(
      '[HisabKhata DB] Warning: MONGODB_URI is not set. Server running with database disconnected. Configure MONGODB_URI to enable persistent storage.'
    );
    return false;
  }

  const sanitized = sanitizeMongoUri(env.MONGODB_URI);

  try {
    console.log(`[HisabKhata DB] Attempting connection to MongoDB (${sanitized})...`);

    const connectionOptions = {
      dbName: env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      autoIndex: !env.isProduction // Don't auto-build indexes in production
    };

    await mongoose.connect(env.MONGODB_URI, connectionOptions);
    console.log(`[HisabKhata DB] Successfully connected to database: ${env.MONGODB_DB_NAME}`);
    return true;
  } catch (error) {
    // Scrub credentials from error message if any leaked in driver output
    const safeMsg = (error.message || '').replace(/(mongodb(?:\+srv)?:\/\/)([^:@]+):([^@]+)@/i, '$1***:***@');
    console.error(`[HisabKhata DB] Connection failed: ${safeMsg}`);

    if (env.isProduction) {
      throw new Error(`Production database connection failed: ${safeMsg}`);
    }
    return false;
  }
}

/**
 * Closes the MongoDB connection cleanly.
 * @returns {Promise<void>}
 */
export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    try {
      console.log('[HisabKhata DB] Closing MongoDB connection...');
      await mongoose.connection.close(false);
      console.log('[HisabKhata DB] Connection closed gracefully.');
    } catch (err) {
      console.error('[HisabKhata DB] Error while closing connection:', err.message);
    }
  }
}

/**
 * Returns current database health and readiness state.
 * @returns {{ isConnected: boolean, readyState: string, name: string }}
 */
export function getDatabaseStatus() {
  const stateCode = mongoose.connection.readyState;
  const readyState = READY_STATES[stateCode] || 'unknown';
  const isConnected = stateCode === 1;

  return {
    isConnected,
    readyState,
    name: isConnected ? mongoose.connection.name : ''
  };
}

// Connection event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('[HisabKhata DB] Event: Disconnected from MongoDB.');
});

mongoose.connection.on('error', (err) => {
  const safeMsg = (err.message || '').replace(/(mongodb(?:\+srv)?:\/\/)([^:@]+):([^@]+)@/i, '$1***:***@');
  console.error('[HisabKhata DB] Event: Connection error:', safeMsg);
});
