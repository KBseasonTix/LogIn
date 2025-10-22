// Test Helpers - User creation and token generation

const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { generateToken } = require('../../middleware/auth');

/**
 * Create a test user with hashed password
 */
const createTestUser = async (userData = {}) => {
  const defaultData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test1234',
    points: 100,
    subscriptionStatus: 'free',
    joinedCommunities: [],
    badges: [],
    totalPosts: 0,
    totalReactionsReceived: 0,
    totalReactionsGiven: 0,
  };

  const mergedData = { ...defaultData, ...userData };

  // Hash password if provided
  if (mergedData.password) {
    const salt = await bcrypt.genSalt(10);
    mergedData.password = await bcrypt.hash(mergedData.password, salt);
  }

  const user = await User.create(mergedData);
  return user;
};

/**
 * Create multiple test users
 */
const createTestUsers = async (count = 3) => {
  const users = [];

  for (let i = 1; i <= count; i++) {
    const user = await createTestUser({
      username: `user${i}`,
      email: `user${i}@example.com`,
      password: 'Test1234',
    });
    users.push(user);
  }

  return users;
};

/**
 * Generate JWT token for a user
 */
const getAuthToken = user => {
  return generateToken(user);
};

/**
 * Create user and get auth token in one step
 */
const createAuthenticatedUser = async (userData = {}) => {
  const user = await createTestUser(userData);
  const token = getAuthToken(user);

  return { user, token };
};

/**
 * Create a test post
 */
const createTestPost = async (Post, userId, communityId, content = 'Test post') => {
  const post = await Post.create({
    userId,
    communityId,
    content,
    picture: null,
    positiveMarkers: 0,
    negativeMarkers: 0,
  });

  return post;
};

/**
 * Create a test community
 */
const createTestCommunity = async (Community, data = {}) => {
  const defaultData = {
    name: 'Test Community',
    description: 'A test community',
    category: 'Test',
    icon: '🧪',
    members: [],
  };

  const community = await Community.create({ ...defaultData, ...data });
  return community;
};

/**
 * Create a test badge
 */
const createTestBadge = async (Badge, data = {}) => {
  const defaultData = {
    name: 'Test Badge',
    description: 'A test badge',
    cost: 50,
    icon: '🏅',
  };

  const badge = await Badge.create({ ...defaultData, ...data });
  return badge;
};

/**
 * Wait for a specified time (ms)
 */
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  createTestUser,
  createTestUsers,
  getAuthToken,
  createAuthenticatedUser,
  createTestPost,
  createTestCommunity,
  createTestBadge,
  wait,
};
