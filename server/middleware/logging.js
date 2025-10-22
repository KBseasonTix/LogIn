// middleware/logging.js - Request Logging Middleware

const morgan = require('morgan');
const logger = require('../config/logger');

// Create custom Morgan tokens
morgan.token('user-id', (req) => req.user?.id || 'anonymous');
morgan.token('request-id', (req) => req.id || '-');

// Define Morgan format
const morganFormat = process.env.NODE_ENV === 'production'
  ? ':request-id :method :url :status :res[content-length] - :response-time ms - user: :user-id'
  : ':method :url :status :response-time ms - user: :user-id';

// Create Morgan middleware
const requestLogger = morgan(morganFormat, {
  stream: logger.stream,
  skip: (req) => {
    // Skip health check logs in production
    if (process.env.NODE_ENV === 'production' && req.path === '/health') {
      return true;
    }
    return false;
  },
});

module.exports = {
  requestLogger,
};
