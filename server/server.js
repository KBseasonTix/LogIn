// server/server.js - Backend Implementation (Security Hardened)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const dotenv = require('dotenv');

// Load environment variables
if (process.env.RAILWAY_ENVIRONMENT) {
  // Railway automatically injects environment variables
} else if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config();
}

// Initialize logger early
const logger = require('./config/logger');

// Validate critical environment variables (skip in test mode)
if (process.env.NODE_ENV !== 'test') {
  const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'STRIPE_SECRET_KEY'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingEnvVars.length > 0) {
    logger.error('Missing required environment variables:', { variables: missingEnvVars });
    process.exit(1);
  }
}

// Log environment info
logger.info('Starting application', {
  environment: process.env.NODE_ENV || 'development',
  railway: process.env.RAILWAY_ENVIRONMENT ? 'yes' : 'no',
  port: process.env.PORT || 3000,
  nodeVersion: process.version,
});

const app = express();
const PORT = process.env.PORT || 3000;

// Request tracking middleware (must be first)
const { requestId } = require('./middleware/requestId');
app.use(requestId);

// Request logging middleware (after request ID)
const { requestLogger } = require('./middleware/logging');
app.use(requestLogger);

// Security Middleware
app.use(helmet()); // Set security HTTP headers
app.use(mongoSanitize()); // Prevent NoSQL injection

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection (skip in test mode - tests use their own in-memory DB)
if (process.env.NODE_ENV !== 'test') {
  if (!process.env.MONGODB_URI) {
    logger.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    const dbName = process.env.MONGODB_URI.split('/')[3]?.split('?')[0];
    logger.info('MongoDB connected successfully', { database: dbName });
  })
  .catch(err => {
    logger.error('MongoDB connection failed', { error: err.message });
    process.exit(1);
  });
}

// Models
const User = require('./models/User');
const Community = require('./models/Community');
const Post = require('./models/Post');
const Badge = require('./models/Badge');
const Transaction = require('./models/Transaction');
const Achievement = require('./models/Achievement');
const UserAchievement = require('./models/UserAchievement');
const StreakTracker = require('./models/StreakTracker');
const BadgeGift = require('./models/BadgeGift');
const Notification = require('./models/Notification');

// Services
const AchievementEngine = require('./services/AchievementEngine');
const StreakService = require('./services/StreakService');
const NotificationService = require('./services/NotificationService');
const CacheService = require('./services/CacheService');
const BackgroundJobs = require('./jobs/BackgroundJobs');
const seedAchievements = require('./data/seedAchievements');

// Initialize achievement system after DB connection (skip in test mode)
if (process.env.NODE_ENV !== 'test') {
  mongoose.connection.once('open', async () => {
    try {
      logger.info('Initializing achievement system');

      // Seed default achievements
      await seedAchievements();

      // Load achievements into engine
      await AchievementEngine.loadAchievements();

      // Start background jobs
      BackgroundJobs.start();

      logger.info('Achievement system initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize achievement system', { error: error.message });
    }
  });
}

// Import middleware
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// API Documentation (Swagger)
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Routes
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const communityRoutes = require('./routes/communities');
const postRoutes = require('./routes/posts');
const badgeRoutes = require('./routes/badges');
const subscriptionRoutes = require('./routes/subscriptions');
const achievementRoutes = require('./routes/achievements');
const streakRoutes = require('./routes/streaks');
const badgeGiftRoutes = require('./routes/badgeGifts');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');

// Mount routes (health check and docs first, no rate limiting)
app.use('/health', healthRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Fitness Tracker API Docs'
}));
app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/streaks', streakRoutes);
app.use('/api/badge-gifts', badgeGiftRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Daily cron job for resetting daily counters
const cron = require('node-cron');
const { POINTS } = require('./config/constants');

cron.schedule('0 0 * * *', async () => {
  try {
    // Reset daily post counters and check for missed posts
    const users = await User.find();

    for (const user of users) {
      // Check if user posted at least the minimum required times today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const postsToday = await Post.countDocuments({
        userId: user._id,
        createdAt: { $gte: today }
      });

      const minimumPosts = POINTS.MINIMUM_DAILY_POSTS;
      if (postsToday < minimumPosts) {
        // Deduct points for missed posts
        const deduction = (minimumPosts - postsToday) * POINTS.DAILY_POST_PENALTY;
        user.points = Math.max(0, user.points - deduction);

        // Record transaction
        const transaction = new Transaction({
          userId: user._id,
          type: 'deduct',
          amount: deduction,
          reason: 'Missed daily posts'
        });
        await transaction.save();
      }

      // Reset any daily counters if needed
      await user.save();
    }

    logger.info('Daily reset completed');
  } catch (error) {
    logger.error('Daily reset failed', { error: error.message, stack: error.stack });
  }
});

// 404 handler - must be after all routes
app.use(notFound);

// Global error handler - must be last
app.use(errorHandler);

// Start server (skip in test mode)
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    logger.info('Server started successfully', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: initiating graceful shutdown');
    server.close(() => {
      logger.info('HTTP server closed');
      mongoose.connection.close(false, () => {
        logger.info('MongoDB connection closed');
        process.exit(0);
      });
    });
  });
}

module.exports = app;