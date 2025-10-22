// Badge Tests

const request = require('supertest');
const app = require('../server');
const Badge = require('../models/Badge');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { connect, disconnect, clearDatabase, seedDatabase } = require('./helpers/testDb');
const { createAuthenticatedUser, createTestBadge } = require('./helpers/testHelpers');

beforeAll(async () => {
  await connect();
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnect();
});

describe('GET /api/badges', () => {
  it('should return all available badges', async () => {
    const { token } = await createAuthenticatedUser();
    const { badges } = await seedDatabase();

    const response = await request(app)
      .get('/api/badges')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(badges.length);
  });

  it('should require authentication', async () => {
    await request(app).get('/api/badges').expect(401);
  });
});

describe('GET /api/badges/user', () => {
  it('should return user owned badges', async () => {
    const badge = await createTestBadge(Badge);
    const { token } = await createAuthenticatedUser({
      badges: [{ badgeId: badge._id, count: 2 }],
    });

    const response = await request(app)
      .get('/api/badges/user')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.allBadges).toHaveLength(1);
    expect(response.body.data.giftableBadges).toHaveLength(1);
  });

  it('should filter out badges with zero count', async () => {
    const badge = await createTestBadge(Badge);
    const { token } = await createAuthenticatedUser({
      badges: [{ badgeId: badge._id, count: 0 }],
    });

    const response = await request(app)
      .get('/api/badges/user')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data.giftableBadges).toHaveLength(0);
  });

  it('should require authentication', async () => {
    await request(app).get('/api/badges/user').expect(401);
  });
});

describe('POST /api/badges/redeem', () => {
  it('should allow user to redeem badge with sufficient points', async () => {
    const badge = await createTestBadge(Badge, { cost: 50 });
    const { user, token } = await createAuthenticatedUser({ points: 100 });

    const response = await request(app)
      .post('/api/badges/redeem')
      .set('Authorization', `Bearer ${token}`)
      .send({ badgeId: badge._id.toString() })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.points).toBe(50); // 100 - 50
    expect(response.body.data.badges).toHaveLength(1);

    // Verify user points deducted
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.points).toBe(50);
    expect(updatedUser.badges).toHaveLength(1);
    expect(updatedUser.badges[0].count).toBe(1);

    // Verify transaction recorded
    const transaction = await Transaction.findOne({ userId: user._id });
    expect(transaction).toBeTruthy();
    expect(transaction.type).toBe('redeem');
    expect(transaction.amount).toBe(50);
  });

  it('should increment badge count if already owned', async () => {
    const badge = await createTestBadge(Badge, { cost: 50 });
    const { user, token } = await createAuthenticatedUser({
      points: 200,
      badges: [{ badgeId: badge._id, count: 1 }],
    });

    await request(app)
      .post('/api/badges/redeem')
      .set('Authorization', `Bearer ${token}`)
      .send({ badgeId: badge._id.toString() })
      .expect(200);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.badges).toHaveLength(1);
    expect(updatedUser.badges[0].count).toBe(2);
    expect(updatedUser.points).toBe(150); // 200 - 50
  });

  it('should reject redemption with insufficient points', async () => {
    const badge = await createTestBadge(Badge, { cost: 100 });
    const { token } = await createAuthenticatedUser({ points: 50 });

    const response = await request(app)
      .post('/api/badges/redeem')
      .set('Authorization', `Bearer ${token}`)
      .send({ badgeId: badge._id.toString() })
      .expect(400);

    expect(response.body.message).toContain('Not enough points');
    expect(response.body.required).toBe(100);
    expect(response.body.current).toBe(50);
  });

  it('should return 404 for non-existent badge', async () => {
    const { token } = await createAuthenticatedUser({ points: 100 });
    const fakeId = '507f1f77bcf86cd799439011';

    const response = await request(app)
      .post('/api/badges/redeem')
      .set('Authorization', `Bearer ${token}`)
      .send({ badgeId: fakeId })
      .expect(404);

    expect(response.body.message).toContain('not found');
  });

  it('should require authentication', async () => {
    const badge = await createTestBadge(Badge);

    await request(app)
      .post('/api/badges/redeem')
      .send({ badgeId: badge._id.toString() })
      .expect(401);
  });

  it('should validate badge ID format', async () => {
    const { token } = await createAuthenticatedUser({ points: 100 });

    const response = await request(app)
      .post('/api/badges/redeem')
      .set('Authorization', `Bearer ${token}`)
      .send({ badgeId: 'invalid-id' })
      .expect(400);

    expect(response.body).toHaveProperty('errors');
  });
});

describe('POST /api/badges/gift', () => {
  it('should allow user to gift badge to another user', async () => {
    const badge = await createTestBadge(Badge);
    const { user: sender, token: senderToken } = await createAuthenticatedUser({
      email: 'sender@example.com',
      badges: [{ badgeId: badge._id, count: 2 }],
    });
    const { user: recipient } = await createAuthenticatedUser({
      email: 'recipient@example.com',
    });

    const response = await request(app)
      .post('/api/badges/gift')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        recipientId: recipient._id.toString(),
        badgeId: badge._id.toString(),
        message: 'Great job!',
      })
      .expect(200);

    expect(response.body.success).toBe(true);

    // Verify sender badge count decreased
    const updatedSender = await User.findById(sender._id);
    expect(updatedSender.badges[0].count).toBe(1);

    // Verify recipient received badge
    const updatedRecipient = await User.findById(recipient._id);
    expect(updatedRecipient.badges).toHaveLength(1);
    expect(updatedRecipient.badges[0].count).toBe(1);

    // Verify notification created
    const notification = await Notification.findOne({ userId: recipient._id });
    expect(notification).toBeTruthy();
    expect(notification.type).toBe('badge-gift');
    expect(notification.message).toContain('Great job!');
  });

  it('should remove badge from sender if count becomes zero', async () => {
    const badge = await createTestBadge(Badge);
    const { user: sender, token: senderToken } = await createAuthenticatedUser({
      email: 'sender@example.com',
      badges: [{ badgeId: badge._id, count: 1 }],
    });
    const { user: recipient } = await createAuthenticatedUser({
      email: 'recipient@example.com',
    });

    await request(app)
      .post('/api/badges/gift')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        recipientId: recipient._id.toString(),
        badgeId: badge._id.toString(),
      })
      .expect(200);

    const updatedSender = await User.findById(sender._id);
    expect(updatedSender.badges).toHaveLength(0);
  });

  it('should prevent gifting badge user does not own', async () => {
    const badge = await createTestBadge(Badge);
    const { token: senderToken } = await createAuthenticatedUser({
      email: 'sender@example.com',
    });
    const { user: recipient } = await createAuthenticatedUser({
      email: 'recipient@example.com',
    });

    const response = await request(app)
      .post('/api/badges/gift')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        recipientId: recipient._id.toString(),
        badgeId: badge._id.toString(),
      })
      .expect(400);

    expect(response.body.message).toContain("don't have this badge");
  });

  it('should prevent self-gifting', async () => {
    const badge = await createTestBadge(Badge);
    const { user, token } = await createAuthenticatedUser({
      badges: [{ badgeId: badge._id, count: 1 }],
    });

    const response = await request(app)
      .post('/api/badges/gift')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipientId: user._id.toString(),
        badgeId: badge._id.toString(),
      })
      .expect(400);

    expect(response.body.message).toContain('cannot gift a badge to yourself');
  });

  it('should return 404 for non-existent recipient', async () => {
    const badge = await createTestBadge(Badge);
    const { token } = await createAuthenticatedUser({
      badges: [{ badgeId: badge._id, count: 1 }],
    });
    const fakeId = '507f1f77bcf86cd799439011';

    const response = await request(app)
      .post('/api/badges/gift')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipientId: fakeId,
        badgeId: badge._id.toString(),
      })
      .expect(404);

    expect(response.body.message).toContain('not found');
  });

  it('should require authentication', async () => {
    const badge = await createTestBadge(Badge);
    const { user } = await createAuthenticatedUser();

    await request(app)
      .post('/api/badges/gift')
      .send({
        recipientId: user._id.toString(),
        badgeId: badge._id.toString(),
      })
      .expect(401);
  });
});
