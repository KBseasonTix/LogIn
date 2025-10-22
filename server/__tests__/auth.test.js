// Authentication Tests

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const { connect, disconnect, clearDatabase } = require('./helpers/testDb');
const { createTestUser, getAuthToken } = require('./helpers/testHelpers');

// Connect to test database before all tests
beforeAll(async () => {
  await connect();
});

// Clear database before each test
beforeEach(async () => {
  await clearDatabase();
});

// Disconnect after all tests
afterAll(async () => {
  await disconnect();
});

describe('POST /api/auth/register', () => {
  it('should register a new user with valid data', async () => {
    const userData = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'Test1234',
    };

    const response = await request(app).post('/api/auth/register').send(userData).expect(201);

    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.username).toBe(userData.username);
    expect(response.body.user.email).toBe(userData.email);
    expect(response.body.user).not.toHaveProperty('password');

    // Verify user was created in database
    const user = await User.findOne({ email: userData.email });
    expect(user).toBeTruthy();
    expect(user.username).toBe(userData.username);

    // Verify password is hashed
    expect(user.password).not.toBe(userData.password);
    const isPasswordValid = await bcrypt.compare(userData.password, user.password);
    expect(isPasswordValid).toBe(true);
  });

  it('should reject registration with weak password', async () => {
    const userData = {
      username: 'weakuser',
      email: 'weak@example.com',
      password: 'weak',
    };

    const response = await request(app).post('/api/auth/register').send(userData).expect(400);

    expect(response.body).toHaveProperty('errors');
    expect(response.body.message).toBe('Validation failed');
  });

  it('should reject registration with invalid email', async () => {
    const userData = {
      username: 'testuser',
      email: 'not-an-email',
      password: 'Test1234',
    };

    const response = await request(app).post('/api/auth/register').send(userData).expect(400);

    expect(response.body).toHaveProperty('errors');
  });

  it('should reject registration with duplicate email', async () => {
    const userData = {
      username: 'user1',
      email: 'duplicate@example.com',
      password: 'Test1234',
    };

    // Register first user
    await request(app).post('/api/auth/register').send(userData).expect(201);

    // Try to register with same email
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...userData, username: 'user2' })
      .expect(400);

    expect(response.body.message).toContain('already exists');
  });

  it('should reject registration with duplicate username', async () => {
    const userData = {
      username: 'duplicateuser',
      email: 'email1@example.com',
      password: 'Test1234',
    };

    // Register first user
    await request(app).post('/api/auth/register').send(userData).expect(201);

    // Try to register with same username
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...userData, email: 'email2@example.com' })
      .expect(400);

    expect(response.body.message).toContain('already taken');
  });

  it('should reject registration with missing fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'incomplete' })
      .expect(400);

    expect(response.body).toHaveProperty('errors');
  });

  it('should return valid JWT token on registration', async () => {
    const userData = {
      username: 'jwtuser',
      email: 'jwt@example.com',
      password: 'Test1234',
    };

    const response = await request(app).post('/api/auth/register').send(userData).expect(201);

    const { token } = response.body;

    // Verify token is valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded).toHaveProperty('id');
    expect(decoded).toHaveProperty('email');
    expect(decoded.email).toBe(userData.email);
  });
});

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    // Create a test user
    const plainPassword = 'Test1234';
    await createTestUser({
      email: 'login@example.com',
      password: plainPassword,
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: plainPassword,
      })
      .expect(200);

    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe('login@example.com');
  });

  it('should reject login with incorrect password', async () => {
    await createTestUser({
      email: 'user@example.com',
      password: 'Test1234',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'WrongPassword123',
      })
      .expect(401);

    expect(response.body.message).toContain('Invalid');
  });

  it('should reject login with non-existent email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'Test1234',
      })
      .expect(401);

    expect(response.body.message).toContain('Invalid');
  });

  it('should reject login with invalid email format', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'not-an-email',
        password: 'Test1234',
      })
      .expect(400);

    expect(response.body).toHaveProperty('errors');
  });

  it('should return valid JWT token on login', async () => {
    const user = await createTestUser({
      email: 'token@example.com',
      password: 'Test1234',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'token@example.com',
        password: 'Test1234',
      })
      .expect(200);

    const { token } = response.body;

    // Verify token is valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(user._id.toString());
    expect(decoded.email).toBe(user.email);
  });

  it('should update lastActive timestamp on login', async () => {
    await createTestUser({
      email: 'active@example.com',
      password: 'Test1234',
    });

    const beforeLogin = new Date();

    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'active@example.com',
        password: 'Test1234',
      })
      .expect(200);

    const user = await User.findOne({ email: 'active@example.com' });
    expect(user.lastActive).toBeDefined();
    expect(new Date(user.lastActive).getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
  });
});

describe('GET /api/auth/verify', () => {
  it('should verify valid JWT token', async () => {
    const user = await createTestUser({
      email: 'verify@example.com',
    });
    const token = getAuthToken(user);

    const response = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(user.email);
  });

  it('should reject request without token', async () => {
    const response = await request(app).get('/api/auth/verify').expect(401);

    expect(response.body.message).toContain('No token');
  });

  it('should reject invalid token', async () => {
    const response = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', 'Bearer invalid-token')
      .expect(403);

    expect(response.body.message).toContain('Invalid token');
  });

  it('should reject expired token', async () => {
    const user = await createTestUser();

    // Create an expired token (expired 1 hour ago)
    const expiredToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
      },
      process.env.JWT_SECRET,
      { expiresIn: '-1h' }
    );

    const response = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(403);

    expect(response.body.message).toContain('expired');
  });
});
