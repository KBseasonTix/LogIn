// Test Database Helper - In-Memory MongoDB or CI MongoDB

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Detect if we're running in CI environment
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

/**
 * Connect to database (in-memory or CI MongoDB)
 */
const connect = async () => {
  // Close any existing connections
  await disconnect();

  let mongoUri;

  if (isCI) {
    // In CI: Use the MongoDB service provided by GitHub Actions
    mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitness-tracker-test';
    console.log('Using CI MongoDB service:', mongoUri);
  } else {
    // Local: Try to use MongoMemoryServer, fall back to local MongoDB
    try {
      mongoServer = await MongoMemoryServer.create({
        binary: {
          version: '6.0.9',
        },
      });
      mongoUri = mongoServer.getUri();
      console.log('Using MongoDB Memory Server');
    } catch (error) {
      // If MongoMemoryServer fails (network issues), use local MongoDB
      console.warn('MongoMemoryServer failed, using local MongoDB:', error.message);
      mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db';
    }
  }

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

/**
 * Disconnect from database and stop server
 */
const disconnect = async () => {
  if (mongoose.connection.readyState !== 0) {
    // Only drop database if not in CI (to avoid conflicts with parallel tests)
    if (!isCI) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.connection.close();
  }

  // Stop MongoMemoryServer if it was used
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

/**
 * Clear all collections in database
 */
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
};

/**
 * Seed database with test data
 */
const seedDatabase = async () => {
  const _User = require('../../models/User');
  const Community = require('../../models/Community');
  const Badge = require('../../models/Badge');
  const Achievement = require('../../models/Achievement');

  // Create test communities
  const communities = await Community.create([
    {
      name: 'Fitness Enthusiasts',
      description: 'For people who love fitness',
      category: 'Health',
      icon: '💪',
      members: [],
    },
    {
      name: 'Yoga Lovers',
      description: 'Yoga and meditation community',
      category: 'Wellness',
      icon: '🧘',
      members: [],
    },
    {
      name: 'Running Club',
      description: 'Runners unite!',
      category: 'Sports',
      icon: '🏃',
      members: [],
    },
  ]);

  // Create test badges
  const badges = await Badge.create([
    {
      name: 'Gold Star',
      description: 'A gold star badge',
      cost: 100,
      icon: '⭐',
    },
    {
      name: 'Trophy',
      description: 'A trophy badge',
      cost: 200,
      icon: '🏆',
    },
  ]);

  // Create test achievements
  const achievements = await Achievement.create([
    {
      name: 'First Post',
      description: 'Create your first post',
      icon: '📝',
      points: 10,
      trigger: 'post_created',
      condition: { field: 'totalPosts', operator: 'gte', value: 1 },
    },
    {
      name: 'Social Butterfly',
      description: 'Receive 10 positive reactions',
      icon: '🦋',
      points: 50,
      trigger: 'reaction_received',
      condition: { field: 'totalReactionsReceived', operator: 'gte', value: 10 },
    },
  ]);

  return { communities, badges, achievements };
};

module.exports = {
  connect,
  disconnect,
  clearDatabase,
  seedDatabase,
};
