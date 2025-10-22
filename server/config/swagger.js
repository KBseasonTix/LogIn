const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fitness Goal Tracker API',
      version: '1.0.0',
      description:
        'A comprehensive fitness tracking and community platform API with gamification features, achievements, and social interactions.',
      contact: {
        name: 'API Support',
        email: 'support@fitnesstracker.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: process.env.RAILWAY_PUBLIC_DOMAIN
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
          : 'https://your-app.railway.app',
        description: 'Production server (Railway)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /api/auth/login or /api/auth/register',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            username: { type: 'string', example: 'john_doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            points: { type: 'integer', example: 150 },
            isPremium: { type: 'boolean', example: false },
            joinedCommunities: {
              type: 'array',
              items: { type: 'string' },
              example: ['507f1f77bcf86cd799439011'],
            },
            badges: {
              type: 'array',
              items: { type: 'string' },
              example: [],
            },
            streakDays: { type: 'integer', example: 5 },
            totalReactionsGiven: { type: 'integer', example: 10 },
            totalReactionsReceived: { type: 'integer', example: 8 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Community: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Morning Runners' },
            description: { type: 'string', example: 'A community for early morning runners' },
            ownerId: { type: 'string' },
            members: { type: 'array', items: { type: 'string' } },
            postsToday: { type: 'integer', example: 15 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Post: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            content: { type: 'string', example: 'Just completed my 5K run!' },
            userId: { type: 'string' },
            communityId: { type: 'string' },
            reactions: {
              type: 'object',
              properties: {
                thumbsUp: { type: 'integer', example: 5 },
                fire: { type: 'integer', example: 2 },
              },
            },
            isMarker: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Badge: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Early Bird' },
            description: { type: 'string', example: 'Posted before 6 AM' },
            icon: { type: 'string', example: '🌅' },
            pointsCost: { type: 'integer', example: 50 },
            available: { type: 'boolean', example: true },
          },
        },
        Achievement: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'First Post' },
            description: { type: 'string', example: 'Create your first post' },
            type: { type: 'string', enum: ['milestone', 'streak', 'social', 'special'] },
            condition: { type: 'object' },
            pointsReward: { type: 'integer', example: 10 },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Validation failed' },
            statusCode: { type: 'integer', example: 400 },
            errors: {
              type: 'array',
              items: { type: 'string' },
              example: ['Email is required', 'Password must be at least 8 characters'],
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                message: 'Access denied. No token provided.',
                statusCode: 401,
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                message: 'Premium membership required',
                statusCode: 403,
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                message: 'Validation failed',
                statusCode: 400,
                errors: ['Email is required'],
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                message: 'Community not found',
                statusCode: 404,
              },
            },
          },
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                message: 'An unexpected error occurred',
                statusCode: 500,
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and registration endpoints',
      },
      {
        name: 'Communities',
        description: 'Community management and membership operations',
      },
      {
        name: 'Posts',
        description: 'Post creation, reactions, and management',
      },
      {
        name: 'Badges',
        description: 'Badge redemption and gifting',
      },
      {
        name: 'Badge Gifts',
        description: 'Badge gift management',
      },
      {
        name: 'Achievements',
        description: 'Achievement tracking and progress',
      },
      {
        name: 'Leaderboard',
        description: 'User rankings and statistics',
      },
      {
        name: 'Notifications',
        description: 'User notifications',
      },
      {
        name: 'Analytics',
        description: 'Usage statistics and analytics',
      },
      {
        name: 'Health',
        description: 'Health check and system status endpoints',
      },
    ],
  },
  apis: ['./routes/*.js', './server.js'], // Path to the API routes
};

module.exports = swaggerJsdoc(options);
