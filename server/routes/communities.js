// server/routes/communities.js - Community Routes

const express = require('express');
const User = require('../models/User');
const Community = require('../models/Community');
const { authenticateToken } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { LIMITS } = require('../config/constants');

const router = express.Router();

/**
 * @route   GET /api/communities
 * @desc    Get all communities
 * @access  Private
 */
router.get(
  '/',
  authenticateToken,
  catchAsync(async (req, res) => {
    const communities = await Community.find()
      .select('name description category icon members')
      .lean();

    res.json({
      success: true,
      count: communities.length,
      data: communities
    });
  })
);

/**
 * @route   GET /api/communities/:id
 * @desc    Get a specific community
 * @access  Private
 */
router.get(
  '/:id',
  authenticateToken,
  catchAsync(async (req, res) => {
    const community = await Community.findById(req.params.id)
      .populate('members', 'username points')
      .lean();

    if (!community) {
      throw new AppError('Community not found', 404);
    }

    res.json({
      success: true,
      data: community
    });
  })
);

/**
 * @route   POST /api/communities/join
 * @desc    Join a community
 * @access  Private
 */
router.post(
  '/join',
  authenticateToken,
  validateBody('joinCommunity'),
  catchAsync(async (req, res) => {
    const { communityId } = req.body;
    const userId = req.user.id;

    // Get user and community
    const [user, community] = await Promise.all([
      User.findById(userId),
      Community.findById(communityId)
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!community) {
      throw new AppError('Community not found', 404);
    }

    // Check if already a member
    if (user.joinedCommunities.includes(communityId)) {
      return res.status(400).json({
        success: false,
        message: 'Already a member of this community'
      });
    }

    // Check subscription limits for free users
    if (
      user.subscriptionStatus === 'free' &&
      user.joinedCommunities.length >= LIMITS.FREE_COMMUNITIES_MAX
    ) {
      return res.status(403).json({
        success: false,
        message: `Free users can only join ${LIMITS.FREE_COMMUNITIES_MAX} communities. Upgrade to premium for unlimited access.`,
        upgradeRequired: true
      });
    }

    // Add user to community and community to user
    user.joinedCommunities.push(communityId);
    if (!community.members.includes(userId)) {
      community.members.push(userId);
    }

    await Promise.all([
      user.save(),
      community.save()
    ]);

    res.json({
      success: true,
      message: 'Joined community successfully',
      data: {
        userCommunities: user.joinedCommunities,
        communityMemberCount: community.members.length
      }
    });
  })
);

/**
 * @route   POST /api/communities/leave
 * @desc    Leave a community
 * @access  Private
 */
router.post(
  '/leave',
  authenticateToken,
  validateBody('joinCommunity'),
  catchAsync(async (req, res) => {
    const { communityId } = req.body;
    const userId = req.user.id;

    // Get user and community
    const [user, community] = await Promise.all([
      User.findById(userId),
      Community.findById(communityId)
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!community) {
      throw new AppError('Community not found', 404);
    }

    // Check if user is a member
    if (!user.joinedCommunities.includes(communityId)) {
      return res.status(400).json({
        success: false,
        message: 'Not a member of this community'
      });
    }

    // Remove user from community and community from user
    user.joinedCommunities = user.joinedCommunities.filter(
      id => id.toString() !== communityId
    );
    community.members = community.members.filter(
      id => id.toString() !== userId
    );

    await Promise.all([
      user.save(),
      community.save()
    ]);

    res.json({
      success: true,
      message: 'Left community successfully',
      data: {
        userCommunities: user.joinedCommunities
      }
    });
  })
);

module.exports = router;
