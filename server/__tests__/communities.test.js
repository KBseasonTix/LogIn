// Community Tests

const request = require('supertest');
const app = require('../server');
const Community = require('../models/Community');
const { connect, disconnect, clearDatabase, seedDatabase } = require('./helpers/testDb');
const { createAuthenticatedUser, createTestCommunity } = require('./helpers/testHelpers');

beforeAll(async () => {
  await connect();
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnect();
});

describe('GET /api/communities', () => {
  it('should return all communities for authenticated user', async () => {
    const { token } = await createAuthenticatedUser();
    const { communities } = await seedDatabase();

    const response = await request(app)
      .get('/api/communities')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(communities.length);
    expect(response.body.count).toBe(communities.length);
  });

  it('should reject unauthenticated request', async () => {
    await seedDatabase();

    const response = await request(app)
      .get('/api/communities')
      .expect(401);

    expect(response.body.message).toContain('No token');
  });

  it('should return empty array when no communities exist', async () => {
    const { token } = await createAuthenticatedUser();

    const response = await request(app)
      .get('/api/communities')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data).toHaveLength(0);
  });
});

describe('GET /api/communities/:id', () => {
  it('should return a specific community', async () => {
    const { token } = await createAuthenticatedUser();
    const community = await createTestCommunity(Community, {
      name: 'Specific Community'
    });

    const response = await request(app)
      .get(`/api/communities/${community._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Specific Community');
  });

  it('should return 404 for non-existent community', async () => {
    const { token } = await createAuthenticatedUser();
    const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format

    const response = await request(app)
      .get(`/api/communities/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body.message).toContain('not found');
  });

  it('should reject invalid community ID format', async () => {
    const { token } = await createAuthenticatedUser();

    await request(app)
      .get('/api/communities/invalid-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });
});

describe('POST /api/communities/join', () => {
  it('should allow user to join a community', async () => {
    const { user, token } = await createAuthenticatedUser();
    const community = await createTestCommunity(Community);

    const response = await request(app)
      .post('/api/communities/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ communityId: community._id.toString() })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.userCommunities).toContain(community._id.toString());

    // Verify community members updated
    const updatedCommunity = await Community.findById(community._id);
    expect(updatedCommunity.members).toContainEqual(user._id);
  });

  it('should prevent duplicate joins', async () => {
    const { user, token } = await createAuthenticatedUser();
    const community = await createTestCommunity(Community, {
      members: [user._id]
    });

    // User already in community
    user.joinedCommunities.push(community._id);
    await user.save();

    const response = await request(app)
      .post('/api/communities/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ communityId: community._id.toString() })
      .expect(400);

    expect(response.body.message).toContain('Already a member');
  });

  it('should enforce free tier limit of 2 communities', async () => {
    const { token } = await createAuthenticatedUser({
      subscriptionStatus: 'free',
      joinedCommunities: []
    });

    // Create 3 communities
    const community1 = await createTestCommunity(Community, { name: 'Community 1' });
    const community2 = await createTestCommunity(Community, { name: 'Community 2' });
    const community3 = await createTestCommunity(Community, { name: 'Community 3' });

    // Join first two communities
    await request(app)
      .post('/api/communities/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ communityId: community1._id.toString() })
      .expect(200);

    await request(app)
      .post('/api/communities/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ communityId: community2._id.toString() })
      .expect(200);

    // Third join should fail
    const response = await request(app)
      .post('/api/communities/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ communityId: community3._id.toString() })
      .expect(403);

    expect(response.body.message).toContain('2 communities');
    expect(response.body.upgradeRequired).toBe(true);
  });

  it('should allow premium users to join unlimited communities', async () => {
    const { token } = await createAuthenticatedUser({
      subscriptionStatus: 'premium',
      joinedCommunities: []
    });

    // Create 3 communities
    const communities = await Promise.all([
      createTestCommunity(Community, { name: 'Community 1' }),
      createTestCommunity(Community, { name: 'Community 2' }),
      createTestCommunity(Community, { name: 'Community 3' })
    ]);

    // Join all three communities
    for (const community of communities) {
      await request(app)
        .post('/api/communities/join')
        .set('Authorization', `Bearer ${token}`)
        .send({ communityId: community._id.toString() })
        .expect(200);
    }
  });

  it('should return 404 for non-existent community', async () => {
    const { token } = await createAuthenticatedUser();
    const fakeId = '507f1f77bcf86cd799439011';

    const response = await request(app)
      .post('/api/communities/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ communityId: fakeId })
      .expect(404);

    expect(response.body.message).toContain('not found');
  });

  it('should require authentication', async () => {
    const community = await createTestCommunity(Community);

    await request(app)
      .post('/api/communities/join')
      .send({ communityId: community._id.toString() })
      .expect(401);
  });
});

describe('POST /api/communities/leave', () => {
  it('should allow user to leave a community', async () => {
    const { user, token } = await createAuthenticatedUser();
    const community = await createTestCommunity(Community, {
      members: [user._id]
    });

    user.joinedCommunities.push(community._id);
    await user.save();

    const response = await request(app)
      .post('/api/communities/leave')
      .set('Authorization', `Bearer ${token}`)
      .send({ communityId: community._id.toString() })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.userCommunities).not.toContain(community._id.toString());

    // Verify community members updated
    const updatedCommunity = await Community.findById(community._id);
    expect(updatedCommunity.members).not.toContainEqual(user._id);
  });

  it('should fail if user is not a member', async () => {
    const { token } = await createAuthenticatedUser();
    const community = await createTestCommunity(Community);

    const response = await request(app)
      .post('/api/communities/leave')
      .set('Authorization', `Bearer ${token}`)
      .send({ communityId: community._id.toString() })
      .expect(400);

    expect(response.body.message).toContain('Not a member');
  });

  it('should require authentication', async () => {
    const community = await createTestCommunity(Community);

    await request(app)
      .post('/api/communities/leave')
      .send({ communityId: community._id.toString() })
      .expect(401);
  });
});
