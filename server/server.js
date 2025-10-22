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
  console.log('Running on Railway - using injected environment variables');
} else if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config();
}

// Validate critical environment variables (skip in test mode)
if (process.env.NODE_ENV !== 'test') {
  const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'STRIPE_SECRET_KEY'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    console.error('Please set these variables in your environment or .env file');
    process.exit(1);
  }
}

// Debug environment variables (without exposing values)
console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT ? 'YES' : 'NO');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET ✓' : 'UNDEFINED ✗');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET ✓' : 'UNDEFINED ✗');
console.log('PORT:', process.env.PORT || 3000);

const app = express();
const PORT = process.env.PORT || 3000;

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
    console.error('❌ MONGODB_URI environment variable is not set!');
    console.error('Please set MONGODB_URI in Railway dashboard environment variables.');
    process.exit(1);
  }

  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('Database:', process.env.MONGODB_URI.split('/')[3]?.split('?')[0]);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
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
    console.log('Initializing achievement system...');

    // Seed default achievements
    await seedAchievements();

    // Load achievements into engine
    await AchievementEngine.loadAchievements();

    // Start background jobs
    BackgroundJobs.start();

    console.log('Achievement system initialized');
  });
}

// Import middleware
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Routes
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

// Mount routes
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

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

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

    console.log('Daily reset completed');
  } catch (error) {
    console.error('Daily reset failed:', error);
  }
});

// 404 handler - must be after all routes
app.use(notFound);

// Global error handler - must be last
app.use(errorHandler);

// Start server (skip in test mode)
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  });
}

module.exports = app;