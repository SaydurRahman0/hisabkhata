import { getDatabaseStatus } from '../config/database.js';

/**
 * Health and Readiness Controllers.
 * Provides operational diagnostic status without disclosing secrets or stack traces.
 */

/**
 * Liveness Probe: Verifies the Node.js / Express process is responding.
 * GET /api/health
 */
export function getLiveness(req, res) {
  res.status(200).json({
    status: 'ok',
    phase: '02',
    service: 'HisabKhata Backend API',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
}

/**
 * Readiness Probe: Verifies if the required database is connected and ready to process traffic.
 * GET /api/health/ready
 */
export function getReadiness(req, res) {
  const dbStatus = getDatabaseStatus();

  if (dbStatus.isConnected) {
    return res.status(200).json({
      status: 'ready',
      phase: '02',
      service: 'HisabKhata Backend API',
      database: {
        status: 'connected',
        readyState: dbStatus.readyState
      },
      timestamp: new Date().toISOString()
    });
  }

  // Database is disconnected or unavailable -> Return 503 Service Unavailable
  return res.status(503).json({
    status: 'not_ready',
    phase: '02',
    service: 'HisabKhata Backend API',
    database: {
      status: 'disconnected',
      readyState: dbStatus.readyState
    },
    message: 'Database connection is not available. Ensure MONGODB_URI is configured and reachable.',
    timestamp: new Date().toISOString()
  });
}
