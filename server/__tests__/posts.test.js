// Post Tests

const request = require('supertest');
const app = require('../server');
const Post = require('../models/Post');
const User = require('../models/User');
const Community = require('../models/Community');
const { connect, disconnect, clearDatabase } = require('./helpers/testDb');
const {
  createAuthenticatedUser,
  createTestCommunity,
  createTestPost,
} = require('./helpers/testHelpers');
const { POINTS } = require('../config/constants');

beforeAll(async () => {
  await connect();
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnect();
});

describe('POST /api/posts', () => {
  it('should create a post in a community the user has joined', async () => {
    const { user, token } = await createAuthenticatedUser();
    const community = await createTestCommunity(Community, {
      members: [user._id],
    });

    user.joinedCommunities.push(community._id);
    await user.save();

    const initialPoints = user.points;

    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        communityId: community._id.toString(),
        content: 'Test post',
        timezone: 'America/New_York',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.post.content).toBe('Test post');
    expect(response.body.data.points).toBe(initialPoints + POINTS.POST_CREATION);

    // Verify post created in database
    const post = await Post.findById(response.body.data.post._id);
    expect(post).toBeTruthy();
    expect(post.content).toBe('Test post');

    // Verify user points updated
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.points).toBe(initialPoints + POINTS.POST_CREATION);
    expect(updatedUser.totalPosts).toBe(1);
  });

  it('should reject post if user is not a community member', async () => {
    const { token } = await createAuthenticatedUser();
    const community = await createTestCommunity(Community);

    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        communityId: community._id.toString(),
        content: 'Test post',
      })
      .expect(403);

    expect(response.body.message).toContain('must be a member');
  });

  it('should reject post with content exceeding max length', async () => {
    const { user, token } = await createAuthenticatedUser();
    const community = await createTestCommunity(Community, {
      members: [user._id],
    });

    user.joinedCommunities.push(community._id);
    await user.save();

    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        communityId: community._id.toString(),
        content: 'This is a very long post that exceeds twenty characters',
      })
      .expect(400);

    expect(response.body).toHaveProperty('errors');
  });

  it('should require authentication', async () => {
    const community = await createTestCommunity(Community);

    await request(app)
      .post('/api/posts')
      .send({
        communityId: community._id.toString(),
        content: 'Test post',
      })
      .expect(401);
  });

  it('should validate required fields', async () => {
    const { token } = await createAuthenticatedUser();

    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('errors');
  });
});

describe('GET /api/posts', () => {
  it('should return all posts', async () => {
    const { user, token } = await createAuthenticatedUser();
    const community = await createTestCommunity(Community);

    // Create test posts
    await createTestPost(Post, user._id, community._id, 'Post 1');
    await createTestPost(Post, user._id, community._id, 'Post 2');

    const response = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
  });

  it('should filter posts by community', async () => {
    const { user, token } = await createAuthenticatedUser();
    const community1 = await createTestCommunity(Community, { name: 'Community 1' });
    const community2 = await createTestCommunity(Community, { name: 'Community 2' });

    await createTestPost(Post, user._id, community1._id, 'Post in Community 1');
    await createTestPost(Post, user._id, community2._id, 'Post in Community 2');

    const response = await request(app)
      .get(`/api/posts?communityId=${community1._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].content).toBe('Post in Community 1');
  });

  it('should filter posts by user', async () => {
    const { user: user1, token } = await createAuthenticatedUser({
      email: 'user1@example.com',
    });
    const { user: user2 } = await createAuthenticatedUser({
      email: 'user2@example.com',
    });
    const community = await createTestCommunity(Community);

    await createTestPost(Post, user1._id, community._id, 'User 1 post');
    await createTestPost(Post, user2._id, community._id, 'User 2 post');

    const response = await request(app)
      .get(`/api/posts?userId=${user1._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].content).toBe('User 1 post');
  });

  it('should require authentication', async () => {
    await request(app).get('/api/posts').expect(401);
  });
});

describe('POST /api/posts/:id/mark', () => {
  it('should add positive marker to post', async () => {
    const { user: postOwner } = await createAuthenticatedUser({
      email: 'owner@example.com',
    });
    const { token: reactorToken } = await createAuthenticatedUser({
      email: 'reactor@example.com',
    });
    const community = await createTestCommunity(Community);
    const post = await createTestPost(Post, postOwner._id, community._id);

    const response = await request(app)
      .post(`/api/posts/${post._id}/mark`)
      .set('Authorization', `Bearer ${reactorToken}`)
      .send({ type: 'positive' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.positiveMarkers).toBe(1);

    // Verify post updated
    const updatedPost = await Post.findById(post._id);
    expect(updatedPost.positiveMarkers).toBe(1);
  });

  it('should add negative marker to post', async () => {
    const { user: postOwner } = await createAuthenticatedUser({
      email: 'owner@example.com',
    });
    const { token: reactorToken } = await createAuthenticatedUser({
      email: 'reactor@example.com',
    });
    const community = await createTestCommunity(Community);
    const post = await createTestPost(Post, postOwner._id, community._id);

    const response = await request(app)
      .post(`/api/posts/${post._id}/mark`)
      .set('Authorization', `Bearer ${reactorToken}`)
      .send({ type: 'negative' })
      .expect(200);

    expect(response.body.data.negativeMarkers).toBe(1);
  });

  it('should award points to post owner for positive marker', async () => {
    const { user: postOwner } = await createAuthenticatedUser({
      email: 'owner@example.com',
      points: 100,
    });
    const { user: reactor, token: reactorToken } = await createAuthenticatedUser({
      email: 'reactor@example.com',
    });
    const community = await createTestCommunity(Community);
    const post = await createTestPost(Post, postOwner._id, community._id);

    await request(app)
      .post(`/api/posts/${post._id}/mark`)
      .set('Authorization', `Bearer ${reactorToken}`)
      .send({ type: 'positive' })
      .expect(200);

    // Verify post owner received points
    const updatedOwner = await User.findById(postOwner._id);
    expect(updatedOwner.points).toBe(100 + POINTS.POSITIVE_REACTION);
    expect(updatedOwner.totalReactionsReceived).toBe(1);

    // Verify reactor stats updated
    const updatedReactor = await User.findById(reactor._id);
    expect(updatedReactor.totalReactionsGiven).toBe(1);
  });

  it('should not award points for marking own post', async () => {
    const { user, token } = await createAuthenticatedUser({ points: 100 });
    const community = await createTestCommunity(Community);
    const post = await createTestPost(Post, user._id, community._id);

    await request(app)
      .post(`/api/posts/${post._id}/mark`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'positive' })
      .expect(200);

    // Verify no points awarded
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.points).toBe(100); // Unchanged
  });

  it('should return 404 for non-existent post', async () => {
    const { token } = await createAuthenticatedUser();
    const fakeId = '507f1f77bcf86cd799439011';

    const response = await request(app)
      .post(`/api/posts/${fakeId}/mark`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'positive' })
      .expect(404);

    expect(response.body.message).toContain('not found');
  });

  it('should validate marker type', async () => {
    const { user, token } = await createAuthenticatedUser();
    const community = await createTestCommunity(Community);
    const post = await createTestPost(Post, user._id, community._id);

    const response = await request(app)
      .post(`/api/posts/${post._id}/mark`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'invalid' })
      .expect(400);

    expect(response.body).toHaveProperty('errors');
  });

  it('should require authentication', async () => {
    const { user } = await createAuthenticatedUser();
    const community = await createTestCommunity(Community);
    const post = await createTestPost(Post, user._id, community._id);

    await request(app).post(`/api/posts/${post._id}/mark`).send({ type: 'positive' }).expect(401);
  });
});

describe('DELETE /api/posts/:id', () => {
  it('should allow post owner to delete their post', async () => {
    const { user, token } = await createAuthenticatedUser();
    const community = await createTestCommunity(Community);
    const post = await createTestPost(Post, user._id, community._id);

    await request(app)
      .delete(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verify post deleted
    const deletedPost = await Post.findById(post._id);
    expect(deletedPost).toBeNull();
  });

  it('should prevent non-owner from deleting post', async () => {
    const { user: owner } = await createAuthenticatedUser({
      email: 'owner@example.com',
    });
    const { token: otherToken } = await createAuthenticatedUser({
      email: 'other@example.com',
    });
    const community = await createTestCommunity(Community);
    const post = await createTestPost(Post, owner._id, community._id);

    const response = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);

    expect(response.body.message).toContain('only delete your own');

    // Verify post not deleted
    const existingPost = await Post.findById(post._id);
    expect(existingPost).toBeTruthy();
  });

  it('should return 404 for non-existent post', async () => {
    const { token } = await createAuthenticatedUser();
    const fakeId = '507f1f77bcf86cd799439011';

    const response = await request(app)
      .delete(`/api/posts/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body.message).toContain('not found');
  });

  it('should require authentication', async () => {
    const { user } = await createAuthenticatedUser();
    const community = await createTestCommunity(Community);
    const post = await createTestPost(Post, user._id, community._id);

    await request(app).delete(`/api/posts/${post._id}`).expect(401);
  });
});
