# Fitness Goal Tracker

A comprehensive fitness tracking and community platform with gamification features, achievements, and social interactions.

[![CI/CD](https://img.shields.io/badge/CI%2FCD-passing-brightgreen)](https://github.com/yourusername/fitness-tracker/actions)
[![Code Coverage](https://img.shields.io/badge/coverage-60%25-yellow)](coverage/lcov-report)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## 🌟 Features

### Core Features
- **User Authentication** - Secure JWT-based authentication with bcrypt password hashing
- **Community Management** - Create and join fitness communities (free tier: 2 communities, premium: unlimited)
- **Posts & Social Feed** - Share updates, photos, and progress with your community
- **Gamification** - Points, badges, achievements, and streaks to keep users engaged
- **Premium Subscriptions** - Stripe integration for premium features
- **Real-time Notifications** - Stay updated with community activity

### Security Features
- 🔒 JWT authentication with 7-day token expiration
- 🔐 Password hashing with bcrypt (10 salt rounds)
- ✅ Input validation with Joi schemas
- 🚫 Rate limiting (API: 100/15min, Auth: 5/15min, Posts: 10/min)
- 🛡️ Helmet security headers
- 🔍 NoSQL injection prevention
- 🌐 CORS configuration

### Production Ready
- 📊 Winston structured logging (JSON format, file rotation)
- 🩺 Enhanced health check endpoints
- 🔄 MongoDB transactions for atomic operations
- 📝 Comprehensive API documentation (Swagger)
- ✅ 78 automated tests with 60%+ coverage target
- 🚀 CI/CD pipeline with GitHub Actions
- 🎨 Code quality automation (ESLint + Prettier)

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/fitness-tracker.git
cd fitness-tracker

# Install dependencies
cd server && npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB (if running locally)
mongod --dbpath /path/to/data

# Start the development server
npm run dev

# In a new terminal, run tests
npm test
```

**Server will be running at:** `http://localhost:3000`
**API Documentation:** `http://localhost:3000/api-docs`

---

## 💻 Installation

### Prerequisites

- **Node.js** 18.x or 20.x
- **MongoDB** 6.0+
- **npm** 9.x+

### Step-by-Step Setup

1. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:
   ```env
   MONGODB_URI=mongodb://localhost:27017/fitness-tracker
   JWT_SECRET=your-super-secret-key-min-32-chars
   STRIPE_SECRET_KEY=sk_test_your_stripe_key
   NODE_ENV=development
   PORT=3000
   ```

3. **Generate secure JWT secret** (recommended)
   ```bash
   npm run generate-secret
   ```

4. **Start MongoDB**
   ```bash
   # Using Homebrew (macOS)
   brew services start mongodb-community

   # Using systemd (Linux)
   sudo systemctl start mongod

   # Using Docker
   docker run -d -p 27017:27017 mongo:6.0
   ```

5. **Start the application**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `JWT_SECRET` | Yes | - | Secret key for JWT tokens (256+ bits recommended) |
| `STRIPE_SECRET_KEY` | Yes | - | Stripe API secret key |
| `NODE_ENV` | No | `development` | Environment (`development`, `production`, `test`) |
| `PORT` | No | `3000` | Server port |
| `LOG_LEVEL` | No | `info` | Winston log level (`error`, `warn`, `info`, `debug`) |
| `CLIENT_URL` | No | - | Frontend URL for CORS |

### MongoDB Indexes

Recommended indexes for performance:

```javascript
// Users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });

// Posts
db.posts.createIndex({ communityId: 1, createdAt: -1 });
db.posts.createIndex({ userId: 1, createdAt: -1 });

// Communities
db.communities.createIndex({ name: 1 });
```

---

## 📚 API Documentation

### Interactive Documentation

Access the full Swagger API documentation at:
```
http://localhost:3000/api-docs
```

### Quick Reference

#### Authentication

```bash
# Register
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}

# Verify Token
GET /api/auth/verify
Authorization: Bearer <your-jwt-token>
```

#### Communities

```bash
# Get all communities
GET /api/communities
Authorization: Bearer <token>

# Join a community
POST /api/communities/join
Authorization: Bearer <token>
Content-Type: application/json

{
  "communityId": "507f1f77bcf86cd799439011"
}
```

#### Posts

```bash
# Create a post
POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "communityId": "507f1f77bcf86cd799439011",
  "content": "Just completed my morning run!"
}

# Get posts (with filters)
GET /api/posts?communityId=507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

#### Health Checks

```bash
# Basic health check
GET /health

# Detailed health check (includes DB status)
GET /health/detailed

# Kubernetes readiness probe
GET /health/ready

# Kubernetes liveness probe
GET /health/live
```

---

## 🛠️ Development

### Project Structure

```
fitness-tracker/
├── server/
│   ├── __tests__/           # Test files
│   │   ├── auth.test.js     # Authentication tests
│   │   ├── posts.test.js    # Posts tests
│   │   └── helpers/         # Test utilities
│   ├── config/              # Configuration files
│   │   ├── logger.js        # Winston logger
│   │   ├── swagger.js       # API documentation
│   │   └── constants.js     # Application constants
│   ├── middleware/          # Express middleware
│   │   ├── auth.js          # JWT authentication
│   │   ├── validation.js    # Joi validation
│   │   ├── rateLimiter.js   # Rate limiting
│   │   └── errorHandler.js  # Error handling
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   ├── services/            # Business logic services
│   ├── utils/               # Utility functions
│   ├── server.js            # Application entry point
│   └── package.json
├── .github/
│   └── workflows/
│       └── ci.yml           # CI/CD pipeline
├── CONTRIBUTING.md          # Contribution guidelines
├── DEPLOYMENT_CHECKLIST.md  # Deployment guide
└── README.md
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Add tests for new features
   - Update documentation

3. **Run quality checks**
   ```bash
   npm run lint        # Check code quality
   npm run format      # Format code
   npm test            # Run tests
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation
   - `test:` Tests
   - `refactor:` Code refactoring

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Pre-commit Hooks

This project uses Husky for pre-commit hooks. On every commit:
- ✅ ESLint automatically fixes code issues
- ✅ Prettier formats code
- ✅ Only staged files are checked (fast!)

To manually run pre-commit checks:
```bash
npx lint-staged
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests verbosely
npm run test:verbose

# Run tests for CI
npm run test:ci
```

### Test Coverage

Current coverage:
- **Tests:** 78 tests across 5 suites
- **Target:** 60%+ coverage on branches, functions, lines, statements
- **Frameworks:** Jest + Supertest + MongoDB Memory Server

### Writing Tests

```javascript
const request = require('supertest');
const app = require('../server');
const { connect, disconnect, clearDatabase } = require('./helpers/testDb');

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

beforeEach(async () => {
  await clearDatabase();
});

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
  });
});
```

---

## 🚀 Deployment

### Railway Deployment (Recommended)

1. **Connect Repository**
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Configure Environment**
   - Add all required environment variables
   - Set `NODE_ENV=production`
   - Set strong `JWT_SECRET` (use `npm run generate-secret`)

3. **Deploy**
   - Railway auto-deploys on push to `main`
   - Monitor deployment in Railway dashboard

4. **Verify Deployment**
   ```bash
   curl https://your-app.railway.app/health
   ```

For detailed deployment instructions, see [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

### Manual Deployment

```bash
# Build (if applicable)
npm run build

# Start production server
NODE_ENV=production npm start
```

---

## 🏗️ Architecture

### Tech Stack

**Backend:**
- **Runtime:** Node.js 18.x/20.x
- **Framework:** Express.js
- **Database:** MongoDB 6.0+ with Mongoose
- **Authentication:** JWT + bcrypt
- **Payments:** Stripe
- **Logging:** Winston
- **Testing:** Jest + Supertest

**DevOps:**
- **CI/CD:** GitHub Actions
- **Hosting:** Railway
- **Monitoring:** Winston + Morgan
- **Code Quality:** ESLint + Prettier + Husky

### Key Design Patterns

- **Middleware Pattern:** Authentication, validation, error handling
- **Service Layer:** Business logic separated from routes
- **Repository Pattern:** Database operations abstracted
- **Transaction Pattern:** Atomic multi-document operations
- **Factory Pattern:** Test data creation

### Database Schema

```
Users ----< Posts >---- Communities
  |         |
  |         └---- Reactions
  |
  ├---- UserAchievements ----< Achievements
  ├---- StreakTrackers
  ├---- BadgeGifts >---- Badges
  └---- Transactions
```

---

## 🤝 Contributing

We love contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Ensure tests pass (`npm test`)
5. Ensure code quality (`npm run lint && npm run format:check`)
6. Commit your changes (`git commit -m 'feat: add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Documentation:** [API Docs](http://localhost:3000/api-docs)
- **Issues:** [GitHub Issues](https://github.com/yourusername/fitness-tracker/issues)
- **Email:** support@fitnesstracker.com

---

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Database powered by [MongoDB](https://www.mongodb.com/)
- Payments by [Stripe](https://stripe.com/)
- Hosted on [Railway](https://railway.app/)

---

**Made with ❤️ by the Fitness Goal Tracker Team**
