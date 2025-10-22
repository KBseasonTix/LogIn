// routes/health.js - Health Check Endpoints

const express = require('express');
const mongoose = require('mongoose');
const logger = require('../config/logger');

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Lightweight health check endpoint for load balancers and monitoring
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Process uptime in seconds
 *                   example: 12345.67
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check - checks all dependencies
 * @access  Public (but should be protected in production by firewall)
 */
router.get('/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('../package.json').version,
    checks: {
      database: {
        status: 'unknown',
        responseTime: 0,
      },
      memory: {
        status: 'healthy',
        usage: process.memoryUsage(),
        heapUsedPercent: 0,
      },
      system: {
        status: 'healthy',
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
      },
    },
  };

  // Check MongoDB connection
  const dbStartTime = Date.now();
  try {
    if (mongoose.connection.readyState === 1) {
      // Ping database
      await mongoose.connection.db.admin().ping();
      health.checks.database.status = 'healthy';
      health.checks.database.responseTime = Date.now() - dbStartTime;
    } else {
      health.checks.database.status = 'unhealthy';
      health.checks.database.error = 'Not connected';
      health.status = 'degraded';
    }
  } catch (error) {
    health.checks.database.status = 'unhealthy';
    health.checks.database.error = error.message;
    health.status = 'unhealthy';
    logger.error('Health check database ping failed:', error);
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  health.checks.memory.heapUsedPercent = Math.round(heapUsedPercent);

  if (heapUsedPercent > 90) {
    health.checks.memory.status = 'critical';
    health.status = 'degraded';
    logger.warn('Memory usage critical:', { heapUsedPercent });
  } else if (heapUsedPercent > 75) {
    health.checks.memory.status = 'warning';
    logger.warn('Memory usage high:', { heapUsedPercent });
  }

  // Set HTTP status based on health
  const statusCode = health.status === 'healthy' ? 200
    : health.status === 'degraded' ? 503
    : 503;

  res.status(statusCode).json(health);
});

/**
 * @route   GET /health/ready
 * @desc    Readiness check - is the service ready to accept traffic?
 * @access  Public (used by Kubernetes/load balancers)
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'not_ready',
        reason: 'Database not connected',
      });
    }

    // Quick ping to ensure database is responsive
    await mongoose.connection.db.admin().ping();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not_ready',
      reason: 'Database not responding',
    });
  }
});

/**
 * @route   GET /health/live
 * @desc    Liveness check - is the service alive?
 * @access  Public (used by Kubernetes/load balancers)
 */
router.get('/live', (req, res) => {
  // Simple check - if we can respond, we're alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
