// middleware/requestId.js - Request ID Tracking

const crypto = require('crypto');

/**
 * Generate a unique request ID and attach to request
 * This helps trace requests through logs
 */
const requestId = (req, res, next) => {
  // Check if request ID already exists (from load balancer/proxy)
  const existingId = req.headers['x-request-id'] || req.headers['x-correlation-id'];

  // Generate or use existing ID
  req.id = existingId || crypto.randomBytes(16).toString('hex');

  // Set response header for client
  res.setHeader('X-Request-ID', req.id);

  next();
};

module.exports = { requestId };
