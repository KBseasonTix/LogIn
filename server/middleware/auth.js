// server/middleware/auth.js - Authentication Middleware

const jwt = require('jsonwebtoken');
const { JWT } = require('../config/constants');

/**
 * Middleware to verify JWT token and authenticate user
 * Expects token in Authorization header: "Bearer <token>"
 */
const authenticateToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: 'Access denied. No token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user info to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      subscriptionStatus: decoded.subscriptionStatus,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        message: 'Invalid token.',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        message: 'Token expired.',
      });
    }
    return res.status(500).json({
      message: 'Authentication failed.',
    });
  }
};

/**
 * Middleware to check if user is premium subscriber
 */
const requirePremium = (req, res, next) => {
  if (req.user.subscriptionStatus !== 'premium') {
    return res.status(403).json({
      message: 'This feature requires a premium subscription.',
    });
  }
  next();
};

/**
 * Generate JWT token for user
 */
const generateToken = user => {
  const payload = {
    id: user._id,
    email: user.email,
    subscriptionStatus: user.subscriptionStatus,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: JWT.EXPIRES_IN,
  });
};

module.exports = {
  authenticateToken,
  requirePremium,
  generateToken,
};
