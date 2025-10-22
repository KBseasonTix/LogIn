// Jest Setup File - Runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';  // Will be overridden by MongoMemoryServer
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock_secret';
process.env.CLIENT_URL = 'http://localhost:3000';

// Increase timeout for database operations (MongoDB download can take time first run)
jest.setTimeout(60000);

// Suppress console logs during tests (optional)
// Comment out if you want to see logs during testing
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
};
