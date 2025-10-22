// config/logger.js - Structured Logging Configuration

const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format (colorized for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Define which transports to use based on environment
const transports = [];

// Console transport (always on)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? format : consoleFormat,
  })
);

// File transports (production only)
if (process.env.NODE_ENV === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      format,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      format,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format,
  transports,
  // Don't exit on uncaught errors
  exitOnError: false,
});

// Create a stream object for Morgan (HTTP request logger)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Helper methods for common log patterns
logger.logRequest = (req, message, meta = {}) => {
  logger.http(message, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id,
    ...meta,
  });
};

logger.logError = (error, req, meta = {}) => {
  logger.error(error.message, {
    stack: error.stack,
    method: req?.method,
    path: req?.path,
    userId: req?.user?.id,
    ...meta,
  });
};

logger.logSecurity = (event, req, meta = {}) => {
  logger.warn(`SECURITY: ${event}`, {
    method: req?.method,
    path: req?.path,
    ip: req?.ip,
    userAgent: req?.headers['user-agent'],
    ...meta,
  });
};

// Suppress logs in test environment
if (process.env.NODE_ENV === 'test') {
  logger.transports.forEach((t) => (t.silent = true));
}

module.exports = logger;
