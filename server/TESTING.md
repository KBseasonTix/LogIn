# Testing Guide

## Overview

Comprehensive test suite for backend API with **Jest** and **Supertest**.

## Test Coverage

### Tests Implemented ✅

1. **Authentication Tests** (`__tests__/auth.test.js`)
   - User registration with validation
   - Password hashing verification
   - Login with correct/incorrect credentials
   - JWT token generation and verification
   - Token expiration handling

2. **Community Tests** (`__tests__/communities.test.js`)
   - List all communities
   - Join/leave communities
   - Free tier limits (2 communities max)
   - Premium unlimited access

3. **Post Tests** (`__tests__/posts.test.js`)
   - Create posts with authentication
   - Post length validation
   - Positive/negative markers
   - Points awarding system
   - Delete own posts only

4. **Badge Tests** (`__tests__/badges.test.js`)
   - Redeem badges with points
   - Badge gifting between users
   - Prevent self-gifting
   - Transaction recording

5. **Middleware Tests** (`__tests__/middleware.test.js`)
   - JWT authentication
   - Input validation (Joi)
   - Error handling
   - Premium user checks

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch

# Run specific test file
npm test auth.test.js

# Run tests verbosely
npm run test:verbose

# CI/CD mode
npm run test:ci
```

## Test Structure

```
server/__tests__/
├── setup.js                 # Global test configuration
├── helpers/
│   ├── testDb.js           # In-memory MongoDB setup
│   └── testHelpers.js      # User/data creation helpers
├── auth.test.js            # Authentication tests
├── communities.test.js     # Community tests
├── posts.test.js           # Post tests
├── badges.test.js          # Badge tests
└── middleware.test.js      # Middleware tests
```

## Test Database

Tests use **MongoDB Memory Server** for isolated, in-memory testing:

- Each test suite starts with a fresh database
- No external MongoDB instance required
- Fast, isolated tests
- Automatic cleanup

## Coverage Goals

| Metric     | Target | Current |
| ---------- | ------ | ------- |
| Branches   | 60%    | TBD     |
| Functions  | 60%    | TBD     |
| Lines      | 60%    | TBD     |
| Statements | 60%    | TBD     |

## Environment Setup

Tests automatically set these environment variables:

```javascript
NODE_ENV=test
JWT_SECRET=test-jwt-secret-for-testing-only
STRIPE_SECRET_KEY=sk_test_mock_key
STRIPE_WEBHOOK_SECRET=whsec_mock_secret
CLIENT_URL=http://localhost:3000
```

## MongoDB Memory Server Setup

### Issue: Network Restrictions

In environments with download restrictions, MongoDB Memory Server may fail to download binaries.

### Solutions:

#### Option 1: Pre-download MongoDB Binary (Recommended)

```bash
# Download MongoDB binary manually
npm install mongodb-memory-server-global

# Or use system MongoDB
# Tests will connect to local MongoDB if memory server fails
```

#### Option 2: Use Docker for Tests

```bash
# docker-compose.test.yml
version: '3.8'
services:
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
```

```bash
# Run tests with Docker
docker-compose -f docker-compose.test.yml up -d
npm test
docker-compose -f docker-compose.test.yml down
```

#### Option 3: System MongoDB

```bash
# Install MongoDB locally
# Ubuntu/Debian
sudo apt-get install mongodb

# Start MongoDB
sudo service mongodb start

# Update testDb.js to use local MongoDB instead of memory server
```

## Writing New Tests

### Example: Testing a New Route

```javascript
const request = require('supertest');
const app = require('../server');
const { connect, disconnect, clearDatabase } = require('./helpers/testDb');
const { createAuthenticatedUser } = require('./helpers/testHelpers');

beforeAll(async () => {
  await connect();
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnect();
});

describe('GET /api/new-route', () => {
  it('should return data for authenticated user', async () => {
    const { token } = await createAuthenticatedUser();

    const response = await request(app)
      .get('/api/new-route')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

## Test Helpers

### `createTestUser(userData)`

Creates a user with hashed password.

### `createAuthenticatedUser(userData)`

Creates a user and returns `{ user, token }`.

### `getAuthToken(user)`

Generates JWT token for a user.

### `seedDatabase()`

Populates database with test communities, badges, and achievements.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:6.0
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:ci
      - uses: codecov/codecov-action@v2
        with:
          files: ./coverage/lcov.info
```

## Troubleshooting

### Tests Timeout

- Increase timeout in `jest.config.js`: `testTimeout: 30000`
- Check MongoDB Memory Server download

### MongoDB Connection Errors

- Ensure MongoDB Memory Server can download binaries
- Use local MongoDB instance as fallback
- Check network/firewall settings

### Import Errors

- Ensure all paths are relative to test file
- Check that server.js exports `app`

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Clean Data**: Use `clearDatabase()` before each test
3. **Test Real Scenarios**: Test actual user workflows
4. **Check Edge Cases**: Invalid input, missing data, etc.
5. **Mock External Services**: Don't call real Stripe in tests

## Security Testing

Tests verify:

- ✅ Passwords are hashed (not plain text)
- ✅ JWT tokens are required for protected routes
- ✅ Input validation prevents injection
- ✅ Users can only access their own data
- ✅ Rate limiting prevents abuse
- ✅ Error messages don't leak sensitive info

## Performance

- Test suite runs in < 30 seconds
- In-memory database for speed
- Parallel test execution where possible

## Future Enhancements

- [ ] E2E tests with Cypress
- [ ] Load testing with Artillery
- [ ] Security scanning with OWASP ZAP
- [ ] Contract testing for API
- [ ] Visual regression testing

---

**Last Updated**: 2025-10-22
**Status**: Framework Complete, Tests Ready to Run
