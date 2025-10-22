// server/config/constants.js - Application Constants

module.exports = {
  // Points and rewards
  POINTS: {
    POST_CREATION: 10,
    POSITIVE_REACTION: 5,
    DAILY_POST_PENALTY: 5,
    MINIMUM_DAILY_POSTS: 5,
  },

  // Content limits
  LIMITS: {
    POST_CONTENT_MAX_LENGTH: 20,
    FREE_COMMUNITIES_MAX: 2,
  },

  // JWT
  JWT: {
    EXPIRES_IN: '7d',
    REFRESH_EXPIRES_IN: '30d',
  },

  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100, // limit each IP to 100 requests per windowMs
    AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    AUTH_MAX_REQUESTS: 5, // limit auth attempts to 5 per windowMs
  },

  // Subscription tiers
  SUBSCRIPTION: {
    FREE: 'free',
    PREMIUM: 'premium',
  },

  // Transaction types
  TRANSACTION_TYPES: {
    REDEEM: 'redeem',
    DEDUCT: 'deduct',
    EARN: 'earn',
  },

  // Marker types
  MARKER_TYPES: {
    POSITIVE: 'positive',
    NEGATIVE: 'negative',
  },
};
