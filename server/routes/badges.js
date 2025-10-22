// server/routes/badges.js - Badge Routes

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Community = require('../models/Community');
const Badge = require('../models/Badge');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');
const { validateBody, validateParams } = require('../middleware/validation');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { TRANSACTION_TYPES } = require('../config/constants');

/**
 * @route   GET /api/badges
 * @desc    Get all available badges
 * @access  Private
 */
router.get(
  '/',
  authenticateToken,
  catchAsync(async (req, res) => {
    const badges = await Badge.find().lean();

    res.json({
      success: true,
      count: badges.length,
      data: badges
    });
  })
);

/**
 * @route   GET /api/badges/user
 * @desc    Get badges owned by authenticated user
 * @access  Private
 */
router.get(
  '/user',
  authenticateToken,
  catchAsync(async (req, res) => {
    const user = await User.findById(req.user.id).select('badges');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get badges user can gift (count > 0)
    const giftableBadges = user.badges.filter(badge => badge.count > 0);

    res.json({
      success: true,
      data: {
        allBadges: user.badges,
        giftableBadges
      }
    });
  })
);

/**
 * @route   POST /api/badges/redeem
 * @desc    Redeem a badge using points
 * @access  Private
 */
router.post(
  '/redeem',
  authenticateToken,
  validateBody('redeemBadge'),
  catchAsync(async (req, res) => {
    const { badgeId } = req.body;
    const userId = req.user.id;

    const [user, badge] = await Promise.all([
      User.findById(userId),
      Badge.findById(badgeId)
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!badge) {
      throw new AppError('Badge not found', 404);
    }

    // Check if user has enough points
    if (user.points < badge.cost) {
      return res.status(400).json({
        success: false,
        message: 'Not enough points to redeem this badge',
        required: badge.cost,
        current: user.points
      });
    }

    // Deduct points
    user.points -= badge.cost;

    // Add or increment badge in user's collection
    const existingBadge = user.badges.find(
      b => b.badgeId && b.badgeId.toString() === badgeId
    );

    if (existingBadge) {
      existingBadge.count += 1;
    } else {
      user.badges.push({ badgeId, count: 1 });
    }

    await user.save();

    // Record transaction
    const transaction = new Transaction({
      userId,
      type: TRANSACTION_TYPES.REDEEM,
      amount: badge.cost,
      badgeId
    });
    await transaction.save();

    res.json({
      success: true,
      message: 'Badge redeemed successfully',
      data: {
        points: user.points,
        badges: user.badges
      }
    });
  })
);

/**
 * @route   POST /api/badges/gift
 * @desc    Gift a badge to another user
 * @access  Private
 */
router.post(
  '/gift',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { recipientId, badgeId, message } = req.body;
    const senderId = req.user.id;

    // Prevent self-gifting
    if (senderId === recipientId) {
      throw new AppError('You cannot gift a badge to yourself', 400);
    }

    const [sender, recipient] = await Promise.all([
      User.findById(senderId),
      User.findById(recipientId)
    ]);

    if (!sender) {
      throw new AppError('Sender not found', 404);
    }

    if (!recipient) {
      throw new AppError('Recipient not found', 404);
    }

    // Find the badge in sender's collection
    const badgeIndex = sender.badges.findIndex(
      b => b.badgeId && b.badgeId.toString() === badgeId
    );

    if (badgeIndex === -1 || sender.badges[badgeIndex].count <= 0) {
      throw new AppError('You don\'t have this badge to gift', 400);
    }

    // Decrement sender's badge count
    sender.badges[badgeIndex].count -= 1;
    if (sender.badges[badgeIndex].count === 0) {
      sender.badges.splice(badgeIndex, 1);
    }

    // Add badge to recipient
    const recipientBadgeIndex = recipient.badges.findIndex(
      b => b.badgeId && b.badgeId.toString() === badgeId
    );

    if (recipientBadgeIndex !== -1) {
      recipient.badges[recipientBadgeIndex].count += 1;
    } else {
      recipient.badges.push({
        badgeId,
        count: 1
      });
    }

    await Promise.all([
      sender.save(),
      recipient.save()
    ]);

    // Create notification for recipient
    const notification = new Notification({
      userId: recipientId,
      message: `${sender.username} gifted you a badge${message ? ': ' + message : ''}`,
      type: 'badge-gift',
      read: false
    });
    await notification.save();

    res.json({
      success: true,
      message: 'Badge gifted successfully',
      data: {
        senderBadges: sender.badges,
        recipientBadges: recipient.badges
      }
    });
  })
);

/**
 * @route   GET /api/badges/community/:communityId
 * @desc    Get badges for a specific community
 * @access  Private
 */
router.get(
  '/community/:communityId',
  authenticateToken,
  validateParams('objectIdParam'),
  catchAsync(async (req, res) => {
    const community = await Community.findById(req.params.communityId).select('badges');

    if (!community) {
      throw new AppError('Community not found', 404);
    }

    res.json({
      success: true,
      data: community.badges || []
    });
  })
);

module.exports = router;