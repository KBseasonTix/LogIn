// server/routes/posts.js - Post Routes

const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const { authenticateToken } = require('../middleware/auth');
const { validateBody, validateParams } = require('../middleware/validation');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { postLimiter } = require('../middleware/rateLimiter');
const AchievementEngine = require('../services/AchievementEngine');
const StreakService = require('../services/StreakService');
const { POINTS, MARKER_TYPES } = require('../config/constants');
const { withTransaction } = require('../utils/transactions');

const router = express.Router();

/**
 * @route   GET /api/posts
 * @desc    Get posts (optionally filtered by community)
 * @access  Private
 */
router.get(
  '/',
  authenticateToken,
  catchAsync(async (req, res) => {
    const { communityId, userId } = req.query;
    const filter = {};

    if (communityId) {
      filter.communityId = communityId;
    }

    if (userId) {
      filter.userId = userId;
    }

    const posts = await Post.find(filter)
      .populate('userId', 'username points')
      .populate('communityId', 'name')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      count: posts.length,
      data: posts,
    });
  })
);

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private
 */
router.post(
  '/',
  authenticateToken,
  postLimiter,
  validateBody('createPost'),
  catchAsync(async (req, res) => {
    const { communityId, content, picture, timezone } = req.body;
    const userId = req.user.id;

    // Verify user exists and is member of community
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.joinedCommunities.includes(communityId)) {
      throw new AppError('You must be a member of this community to post', 403);
    }

    // Create post
    const post = new Post({
      userId,
      communityId,
      content,
      picture,
      positiveMarkers: 0,
      negativeMarkers: 0,
    });

    await post.save();

    // Award points and update user stats
    user.points += POINTS.POST_CREATION;
    user.totalPosts = (user.totalPosts || 0) + 1;
    user.lastActive = new Date();
    await user.save();

    // Update streak and trigger achievements
    let streakResult = null;
    try {
      streakResult = await StreakService.updateUserStreak(userId, timezone);
      await AchievementEngine.checkAndAwardAchievements(userId, 'post_created', {
        totalPosts: user.totalPosts,
        streakResult,
      });
    } catch (error) {
      console.error('Streak/Achievement update failed:', error.message);
      // Don't fail the post creation if streak/achievement fails
    }

    // Populate post data for response
    await post.populate([
      { path: 'userId', select: 'username points' },
      { path: 'communityId', select: 'name' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post,
        points: user.points,
        streak: streakResult,
      },
    });
  })
);

/**
 * @route   POST /api/posts/:id/mark
 * @desc    Add positive/negative marker to a post
 * @access  Private
 */
router.post(
  '/:id/mark',
  authenticateToken,
  validateParams('objectIdParam'),
  validateBody('markPost'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { type } = req.body;
    const userId = req.user.id;

    // Find post
    const post = await Post.findById(id);
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // Update marker count
    if (type === MARKER_TYPES.POSITIVE) {
      post.positiveMarkers += 1;
    } else if (type === MARKER_TYPES.NEGATIVE) {
      post.negativeMarkers += 1;
    }

    await post.save();

    // Award points for positive reactions (not on own post)
    if (type === MARKER_TYPES.POSITIVE && post.userId.toString() !== userId) {
      try {
        // Use transaction to ensure atomicity of multi-user update
        await withTransaction(async session => {
          const [postOwner, reactor] = await Promise.all([
            User.findById(post.userId).session(session),
            User.findById(userId).session(session),
          ]);

          if (postOwner && reactor) {
            // Award points to post owner
            postOwner.points += POINTS.POSITIVE_REACTION;
            postOwner.totalReactionsReceived = (postOwner.totalReactionsReceived || 0) + 1;

            // Update reactor stats
            reactor.totalReactionsGiven = (reactor.totalReactionsGiven || 0) + 1;

            // Save both users atomically
            await postOwner.save({ session });
            await reactor.save({ session });

            // Trigger achievements for both users (outside transaction to avoid blocking)
            setImmediate(() => {
              Promise.all([
                AchievementEngine.checkAndAwardAchievements(postOwner._id, 'reaction_received', {
                  totalReactionsReceived: postOwner.totalReactionsReceived,
                }),
                AchievementEngine.checkAndAwardAchievements(reactor._id, 'reaction_given', {
                  totalReactionsGiven: reactor.totalReactionsGiven,
                }),
              ]).catch(err => console.error('Achievement update failed:', err.message));
            });
          }
        });
      } catch (error) {
        console.error('Error awarding points for reaction:', error.message);
        // Don't fail the marker update if points/achievements fail
      }
    }

    res.json({
      success: true,
      message: 'Marker updated successfully',
      data: {
        positiveMarkers: post.positiveMarkers,
        negativeMarkers: post.negativeMarkers,
      },
    });
  })
);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post (only post owner)
 * @access  Private
 */
router.delete(
  '/:id',
  authenticateToken,
  validateParams('objectIdParam'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // Only post owner can delete
    if (post.userId.toString() !== userId) {
      throw new AppError('You can only delete your own posts', 403);
    }

    await post.deleteOne();

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  })
);

module.exports = router;
