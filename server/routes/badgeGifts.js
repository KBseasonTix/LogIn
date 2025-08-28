// server/routes/badgeGifts.js
const express = require('express');
const router = express.Router();
const BadgeGift = require('../models/BadgeGift');
const User = require('../models/User');
const Badge = require('../models/Badge');
const Transaction = require('../models/Transaction');
const NotificationService = require('../services/NotificationService');

// Send a badge gift
router.post('/send', async (req, res) => {
  try {
    const { fromUserId, toUserId, badgeId, message, pointsCost, occasion, isAnonymous } = req.body;

    // Validate input
    if (!fromUserId || !toUserId || !badgeId || !message || !pointsCost) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (pointsCost < 30 || pointsCost > 70) {
      return res.status(400).json({ message: 'Points cost must be between 30 and 70' });
    }

    if (message.length > 200) {
      return res.status(400).json({ message: 'Message must be 200 characters or less' });
    }

    // Get users and badge
    const [fromUser, toUser, badge] = await Promise.all([
      User.findById(fromUserId),
      User.findById(toUserId),
      Badge.findById(badgeId)
    ]);

    if (!fromUser || !toUser || !badge) {
      return res.status(404).json({ message: 'User or badge not found' });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({ message: 'Cannot gift badge to yourself' });
    }

    // Check if sender has enough points
    if (fromUser.points < pointsCost) {
      return res.status(400).json({ 
        message: 'Not enough points',
        required: pointsCost,
        current: fromUser.points
      });
    }

    // Create transaction for points deduction
    const transaction = new Transaction({
      userId: fromUserId,
      type: 'gift_sent',
      amount: -pointsCost,
      reason: `Badge gift to ${toUser.username}`,
      badgeId,
      relatedUserId: toUserId
    });

    // Create badge gift record
    const badgeGift = new BadgeGift({
      fromUserId,
      toUserId,
      badgeId,
      message,
      pointsCost,
      transactionId: transaction._id,
      metadata: {
        occasion: occasion || 'other',
        isAnonymous: isAnonymous || false
      }
    });

    // Update sender's points and badge gifted count
    fromUser.points -= pointsCost;
    fromUser.badgesGifted += 1;

    // Add badge to recipient
    const existingBadge = toUser.badges.find(
      b => b.badgeId.toString() === badgeId.toString()
    );

    if (existingBadge) {
      existingBadge.count += 1;
    } else {
      toUser.badges.push({
        badgeId,
        count: 1
      });
    }

    toUser.badgesReceived += 1;

    // Save all changes
    await Promise.all([
      transaction.save(),
      badgeGift.save(),
      fromUser.save(),
      toUser.save()
    ]);

    // Update badge gift with transaction ID
    badgeGift.transactionId = transaction._id;
    await badgeGift.save();

    // Send notification to recipient
    await NotificationService.createBadgeGiftNotification(badgeGift);

    res.status(201).json({
      message: 'Badge gift sent successfully',
      badgeGift: {
        id: badgeGift._id,
        badge,
        message: badgeGift.message,
        pointsCost: badgeGift.pointsCost,
        sentAt: badgeGift.sentAt,
        occasion: badgeGift.metadata.occasion
      },
      senderPoints: fromUser.points
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get badge gifts received by user
router.get('/received/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const badgeGifts = await BadgeGift.find({ toUserId: userId })
      .populate('fromUserId', 'username profilePic')
      .populate('badgeId', 'name icon description')
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BadgeGift.countDocuments({ toUserId: userId });

    const gifts = badgeGifts.map(gift => ({
      id: gift._id,
      from: gift.metadata.isAnonymous ? null : gift.fromUserId,
      badge: gift.badgeId,
      message: gift.message,
      pointsCost: gift.pointsCost,
      occasion: gift.metadata.occasion,
      isAnonymous: gift.metadata.isAnonymous,
      sentAt: gift.sentAt,
      status: gift.status
    }));

    res.json({
      gifts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get badge gifts sent by user
router.get('/sent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const badgeGifts = await BadgeGift.find({ fromUserId: userId })
      .populate('toUserId', 'username profilePic')
      .populate('badgeId', 'name icon description')
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BadgeGift.countDocuments({ fromUserId: userId });

    const gifts = badgeGifts.map(gift => ({
      id: gift._id,
      to: gift.toUserId,
      badge: gift.badgeId,
      message: gift.message,
      pointsCost: gift.pointsCost,
      occasion: gift.metadata.occasion,
      sentAt: gift.sentAt,
      status: gift.status
    }));

    res.json({
      gifts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get badge gifting statistics
router.get('/stats', async (req, res) => {
  try {
    const totalGifts = await BadgeGift.countDocuments({});
    const totalPointsSpent = await BadgeGift.aggregate([
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$pointsCost' }
        }
      }
    ]);

    const topGifters = await BadgeGift.aggregate([
      {
        $group: {
          _id: '$fromUserId',
          giftsGiven: { $sum: 1 },
          pointsSpent: { $sum: '$pointsCost' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user: {
            username: '$user.username',
            profilePic: '$user.profilePic'
          },
          giftsGiven: 1,
          pointsSpent: 1
        }
      },
      {
        $sort: { giftsGiven: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const topReceivers = await BadgeGift.aggregate([
      {
        $group: {
          _id: '$toUserId',
          giftsReceived: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user: {
            username: '$user.username',
            profilePic: '$user.profilePic'
          },
          giftsReceived: 1
        }
      },
      {
        $sort: { giftsReceived: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const occasionStats = await BadgeGift.aggregate([
      {
        $group: {
          _id: '$metadata.occasion',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      totalGifts,
      totalPointsSpent: totalPointsSpent[0]?.totalPoints || 0,
      averagePointsPerGift: totalGifts > 0 ? Math.round((totalPointsSpent[0]?.totalPoints || 0) / totalGifts) : 0,
      topGifters,
      topReceivers,
      occasionStats,
      timestamp: new Date()
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available badges for gifting (user's owned badges)
router.get('/available/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('badges.badgeId', 'name icon description cost');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter badges that can be gifted (user owns and has count > 0)
    const giftableBadges = user.badges
      .filter(badge => badge.count > 0)
      .map(badge => ({
        badgeId: badge.badgeId._id,
        name: badge.badgeId.name,
        icon: badge.badgeId.icon,
        description: badge.badgeId.description,
        ownedCount: badge.count,
        suggestedPointCost: Math.max(30, Math.min(70, Math.floor(badge.badgeId.cost * 0.5)))
      }));

    res.json({
      giftableBadges,
      userPoints: user.points
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;