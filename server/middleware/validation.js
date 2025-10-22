// server/middleware/validation.js - Request Validation Middleware

const Joi = require('joi');
const { LIMITS } = require('../config/constants');

/**
 * Validation schemas for different request types
 */
const schemas = {
  // Authentication
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'Username must only contain alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must not exceed 30 characters',
        'any.required': 'Username is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'any.required': 'Password is required'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  // Community
  joinCommunity: Joi.object({
    userId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid user ID format',
        'any.required': 'User ID is required'
      }),
    communityId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid community ID format',
        'any.required': 'Community ID is required'
      })
  }),

  // Posts
  createPost: Joi.object({
    userId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid user ID format',
        'any.required': 'User ID is required'
      }),
    communityId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid community ID format',
        'any.required': 'Community ID is required'
      }),
    content: Joi.string()
      .max(LIMITS.POST_CONTENT_MAX_LENGTH)
      .required()
      .messages({
        'string.max': `Content must not exceed ${LIMITS.POST_CONTENT_MAX_LENGTH} characters`,
        'any.required': 'Content is required'
      }),
    picture: Joi.string()
      .uri()
      .allow('')
      .optional()
      .messages({
        'string.uri': 'Picture must be a valid URI'
      }),
    timezone: Joi.string()
      .optional()
  }),

  markPost: Joi.object({
    userId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid user ID format',
        'any.required': 'User ID is required'
      }),
    type: Joi.string()
      .valid('positive', 'negative')
      .required()
      .messages({
        'any.only': 'Type must be either positive or negative',
        'any.required': 'Type is required'
      })
  }),

  // Badges
  redeemBadge: Joi.object({
    userId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid user ID format',
        'any.required': 'User ID is required'
      }),
    badgeId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid badge ID format',
        'any.required': 'Badge ID is required'
      })
  }),

  // Subscriptions
  createCheckoutSession: Joi.object({
    userId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid user ID format',
        'any.required': 'User ID is required'
      }),
    priceId: Joi.string()
      .required()
      .messages({
        'any.required': 'Price ID is required'
      })
  }),

  // MongoDB ObjectId param
  objectIdParam: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid ID format'
      })
  })
};

/**
 * Middleware factory to validate request body against a schema
 */
const validateBody = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];

    if (!schema) {
      console.error(`Validation schema '${schemaName}' not found`);
      return next();
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }

    // Replace req.body with sanitized values
    req.body = value;
    next();
  };
};

/**
 * Middleware to validate URL parameters
 */
const validateParams = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];

    if (!schema) {
      console.error(`Validation schema '${schemaName}' not found`);
      return next();
    }

    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }

    req.params = value;
    next();
  };
};

module.exports = {
  validateBody,
  validateParams,
  schemas
};
