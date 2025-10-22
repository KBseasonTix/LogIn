// Test Database Helper - In-Memory MongoDB

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Connect to in-memory database
 */
const connect = async () => {
  // Close any existing connections
  await disconnect();

  // Create new in-memory database with specific MongoDB version
  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '6.0.9', // Use a stable, known version
    },
  });
  const mongoUri = mongoServer.getUri();

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
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }

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
  const User = require('../../models/User');
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
      members: []
    },
    {
      name: 'Yoga Lovers',
      description: 'Yoga and meditation community',
      category: 'Wellness',
      icon: '🧘',
      members: []
    },
    {
      name: 'Running Club',
      description: 'Runners unite!',
      category: 'Sports',
      icon: '🏃',
      members: []
    }
  ]);

  // Create test badges
  const badges = await Badge.create([
    {
      name: 'Gold Star',
      description: 'A gold star badge',
      cost: 100,
      icon: '⭐'
    },
    {
      name: 'Trophy',
      description: 'A trophy badge',
      cost: 200,
      icon: '🏆'
    }
  ]);

  // Create test achievements
  const achievements = await Achievement.create([
    {
      name: 'First Post',
      description: 'Create your first post',
      icon: '📝',
      points: 10,
      trigger: 'post_created',
      condition: { field: 'totalPosts', operator: 'gte', value: 1 }
    },
    {
      name: 'Social Butterfly',
      description: 'Receive 10 positive reactions',
      icon: '🦋',
      points: 50,
      trigger: 'reaction_received',
      condition: { field: 'totalReactionsReceived', operator: 'gte', value: 10 }
    }
  ]);

  return { communities, badges, achievements };
};

module.exports = {
  connect,
  disconnect,
  clearDatabase,
  seedDatabase
};
