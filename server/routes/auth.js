// server/routes/auth.js - Authentication Routes

const express = require('express');
const bcrypt = require('bcryptjs');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { catchAsync } = require('../middleware/errorHandler');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  validateBody('register'),
  catchAsync(async (req, res) => {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists'
      });
    }

    // Check if username is taken
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        message: 'Username is already taken'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      points: 0,
      subscriptionStatus: 'free',
      joinedCommunities: []
    });

    await user.save();

    // Create Stripe customer
    try {
      const customer = await stripe.customers.create({
        email: email,
        name: username,
        metadata: {
          userId: user._id.toString()
        }
      });

      user.stripeCustomerId = customer.id;
      await user.save();
    } catch (stripeError) {
      console.error('Stripe customer creation failed:', stripeError.message);
      // Continue registration even if Stripe fails
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        points: user.points,
        subscriptionStatus: user.subscriptionStatus
      }
    });
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return token
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  validateBody('login'),
  catchAsync(async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Update last active
    user.lastActive = new Date();
    await user.save();

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        points: user.points,
        subscriptionStatus: user.subscriptionStatus,
        joinedCommunities: user.joinedCommunities
      }
    });
  })
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token (for checking if user is still logged in)
 * @access  Private
 */
router.get(
  '/verify',
  require('../middleware/auth').authenticateToken,
  catchAsync(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.status(200).json({
      message: 'Token is valid',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        points: user.points,
        subscriptionStatus: user.subscriptionStatus,
        joinedCommunities: user.joinedCommunities
      }
    });
  })
);

module.exports = router;
