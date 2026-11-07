import http from 'http';
import app from './app.js';
import { env, validateEnv } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

let server = null;
let isShuttingDown = false;

async function startServer() {
  try {
    // 1. Validate environment configuration
    validateEnv();

    // 2. Connect to MongoDB
    const isDbConnected = await connectDatabase();

    // In production, MongoDB is strictly mandatory before accepting traffic
    if (env.isProduction && !isDbConnected) {
      console.error('[HisabKhata Backend] Cannot start server: MongoDB connection is mandatory in production.');
      process.exit(1);
    }

    // 3. Start HTTP server
    server = http.createServer(app);

    server.listen(env.PORT, () => {
      console.log(`[HisabKhata Backend] Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      console.log(`[HisabKhata Backend] Health check: http://localhost:${env.PORT}/api/health`);
      console.log(`[HisabKhata Backend] Readiness check: http://localhost:${env.PORT}/api/health/ready`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[HisabKhata Backend] Fatal: Port ${env.PORT} is already in use. Set BACKEND_PORT to an alternative port.`);
      } else {
        console.error('[HisabKhata Backend] Server error:', err.message);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('[HisabKhata Backend] Startup failure:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown management
async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[HisabKhata Backend] Received ${signal}. Initiating graceful shutdown...`);

  // Close HTTP server to stop accepting new requests
  if (server) {
    await new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          console.error('[HisabKhata Backend] Error closing HTTP server:', err.message);
        } else {
          console.log('[HisabKhata Backend] HTTP server closed.');
        }
        resolve();
      });
    });
  }

  // Close MongoDB connection cleanly
  try {
    await disconnectDatabase();
  } catch (err) {
    console.error('[HisabKhata Backend] Error during database disconnection:', err.message);
  }

  console.log('[HisabKhata Backend] Graceful shutdown completed.');
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Only start the server when run directly (not when imported for testing)
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, startServer, gracefulShutdown };
