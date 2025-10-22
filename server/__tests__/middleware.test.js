// Middleware Tests

const jwt = require('jsonwebtoken');
const { authenticateToken, generateToken, requirePremium } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { AppError } = require('../middleware/errorHandler');
const { createTestUser } = require('./helpers/testHelpers');
const { connect, disconnect, clearDatabase } = require('./helpers/testDb');

beforeAll(async () => {
  await connect();
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnect();
});

describe('Authentication Middleware', () => {
  describe('authenticateToken', () => {
    it('should authenticate valid token', async () => {
      const user = await createTestUser();
      const token = generateToken(user);

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      const res = {};
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(user._id.toString());
      expect(req.user.email).toBe(user.email);
    });

    it('should reject request without token', () => {
      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('No token'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid token'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      const user = await createTestUser();

      // Create expired token
      const expiredToken = jwt.sign(
        {
          id: user._id.toString(),
          email: user.email,
          subscriptionStatus: user.subscriptionStatus,
        },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const req = {
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('expired'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle malformed authorization header', () => {
      const req = {
        headers: {
          authorization: 'InvalidFormat',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', async () => {
      const user = await createTestUser();
      const token = generateToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token can be decoded
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(user._id.toString());
      expect(decoded.email).toBe(user.email);
      expect(decoded.subscriptionStatus).toBe(user.subscriptionStatus);
    });

    it('should include expiration in token', async () => {
      const user = await createTestUser();
      const token = generateToken(user);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
    });
  });

  describe('requirePremium', () => {
    it('should allow premium users', () => {
      const req = {
        user: {
          subscriptionStatus: 'premium',
        },
      };
      const res = {};
      const next = jest.fn();

      requirePremium(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject free users', () => {
      const req = {
        user: {
          subscriptionStatus: 'free',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      requirePremium(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('premium'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});

describe('Validation Middleware', () => {
  describe('validateBody', () => {
    it('should validate valid registration data', () => {
      const validator = validateBody('register');

      const req = {
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'Test1234',
        },
      };
      const res = {};
      const next = jest.fn();

      validator(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid email', () => {
      const validator = validateBody('register');

      const req = {
        body: {
          username: 'testuser',
          email: 'not-an-email',
          password: 'Test1234',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      validator(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
            }),
          ]),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject weak password', () => {
      const validator = validateBody('register');

      const req = {
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'weak',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      validator(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'password',
            }),
          ]),
        })
      );
    });

    it('should reject missing required fields', () => {
      const validator = validateBody('register');

      const req = {
        body: {
          username: 'testuser',
          // Missing email and password
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      validator(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
          errors: expect.any(Array),
        })
      );
    });

    it('should strip unknown fields', () => {
      const validator = validateBody('login');

      const req = {
        body: {
          email: 'test@example.com',
          password: 'Test1234',
          unknownField: 'should be removed',
        },
      };
      const res = {};
      const next = jest.fn();

      validator(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).not.toHaveProperty('unknownField');
      expect(req.body).toHaveProperty('email');
      expect(req.body).toHaveProperty('password');
    });

    it('should validate MongoDB ObjectId format', () => {
      const validator = validateBody('joinCommunity');

      const req = {
        body: {
          userId: '507f1f77bcf86cd799439011',
          communityId: '507f1f77bcf86cd799439012',
        },
      };
      const res = {};
      const next = jest.fn();

      validator(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid ObjectId format', () => {
      const validator = validateBody('joinCommunity');

      const req = {
        body: {
          userId: 'invalid-id',
          communityId: '507f1f77bcf86cd799439012',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      validator(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'userId',
            }),
          ]),
        })
      );
    });
  });
});

describe('Error Handler Middleware', () => {
  describe('AppError', () => {
    it('should create operational error', () => {
      const error = new AppError('Test error', 400);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.status).toBe('fail');
    });

    it('should create error with 500 status', () => {
      const error = new AppError('Server error', 500);

      expect(error.statusCode).toBe(500);
      expect(error.status).toBe('error');
    });

    it('should be instance of Error', () => {
      const error = new AppError('Test', 400);

      expect(error).toBeInstanceOf(Error);
    });
  });
});
