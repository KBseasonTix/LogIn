// server/routes/analytics.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const BadgeGift = require('../models/BadgeGift');
const StreakTracker = require('../models/StreakTracker');
const Transaction = require('../models/Transaction');
const Post = require('../models/Post');

// Get achievement engagement analytics
router.get('/achievements/engagement', async (req, res) => {
  try {
    const { period } = req.query; // 'day', 'week', 'month', 'year'
    
    let dateRange = new Date();
    switch (period) {
      case 'day':
        dateRange.setDate(dateRange.getDate() - 1);
        break;
      case 'week':
        dateRange.setDate(dateRange.getDate() - 7);
        break;
      case 'month':
        dateRange.setMonth(dateRange.getMonth() - 1);
        break;
      case 'year':
        dateRange.setFullYear(dateRange.getFullYear() - 1);
        break;
      default:
        dateRange.setDate(dateRange.getDate() - 7); // Default to week
    }

    // Achievement completion rates
    const totalAchievements = await Achievement.countDocuments({ isActive: true });
    const completedInPeriod = await UserAchievement.countDocuments({
      completedAt: { $gte: dateRange },
      isCompleted: true
    });

    // Most popular achievements
    const popularAchievements = await UserAchievement.aggregate([
      {
        $match: { 
          completedAt: { $gte: dateRange },
          isCompleted: true
        }
      },
      {
        $group: {
          _id: '$achievementId',
          completionCount: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $lookup: {
          from: 'achievements',
          localField: '_id',
          foreignField: '_id',
          as: 'achievement'
        }
      },
      {
        $unwind: '$achievement'
      },
      {
        $project: {
          achievement: '$achievement',
          completionCount: 1,
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      },
      {
        $sort: { completionCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Achievement categories performance
    const categoryPerformance = await UserAchievement.aggregate([
      {
        $match: { 
          completedAt: { $gte: dateRange },
          isCompleted: true
        }
      },
      {
        $lookup: {
          from: 'achievements',
          localField: 'achievementId',
          foreignField: '_id',
          as: 'achievement'
        }
      },
      {
        $unwind: '$achievement'
      },
      {
        $group: {
          _id: '$achievement.category',
          completions: { $sum: 1 },
          averageProgress: { $avg: '$progress.percentage' }
        }
      },
      {
        $sort: { completions: -1 }
      }
    ]);

    // User engagement levels
    const userEngagement = await UserAchievement.aggregate([
      {
        $group: {
          _id: '$userId',
          totalAchievements: { $sum: { $cond: ['$isCompleted', 1, 0] } },
          inProgressAchievements: { $sum: { $cond: ['$isCompleted', 0, 1] } }
        }
      },
      {
        $group: {
          _id: null,
          highlyEngaged: { $sum: { $cond: [{ $gte: ['$totalAchievements', 10] }, 1, 0] } },
          moderatelyEngaged: { $sum: { $cond: [{ $and: [{ $gte: ['$totalAchievements', 3] }, { $lt: ['$totalAchievements', 10] }] }, 1, 0] } },
          lowEngaged: { $sum: { $cond: [{ $lt: ['$totalAchievements', 3] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      period,
      totalAchievements,
      completedInPeriod,
      completionRate: totalAchievements > 0 ? Math.round((completedInPeriod / totalAchievements) * 100) : 0,
      popularAchievements,
      categoryPerformance,
      userEngagement: userEngagement[0] || { highlyEngaged: 0, moderatelyEngaged: 0, lowEngaged: 0 },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user retention analytics
router.get('/retention', async (req, res) => {
  try {
    const { cohortPeriod } = req.query; // 'day', 'week', 'month'
    
    // Calculate retention based on achievement activity
    const retentionData = await UserAchievement.aggregate([
      {
        $group: {
          _id: {
            userId: '$userId',
            week: { $week: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          firstAchievement: { $min: '$createdAt' },
          lastActivity: { $max: '$updatedAt' }
        }
      },
      {
        $group: {
          _id: {
            week: '$_id.week',
            year: '$_id.year'
          },
          newUsers: { $sum: 1 },
          activeUsers: { 
            $sum: { 
              $cond: [
                { 
                  $gte: [
                    '$lastActivity', 
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ] 
                }, 
                1, 
                0
              ] 
            }
          }
        }
      },
      {
        $project: {
          period: { $concat: [{ $toString: '$_id.year' }, '-W', { $toString: '$_id.week' }] },
          newUsers: 1,
          activeUsers: 1,
          retentionRate: { 
            $round: [
              { $multiply: [{ $divide: ['$activeUsers', '$newUsers'] }, 100] }, 
              2
            ]
          }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.week': -1 }
      },
      {
        $limit: 12
      }
    ]);

    // Achievement-driven retention
    const achievementRetention = await User.aggregate([
      {
        $project: {
          totalAchievements: 1,
          createdAt: 1,
          lastActive: 1,
          isRecentlyActive: {
            $gte: ['$lastActive', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]
          }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $eq: ['$totalAchievements', 0] }, then: 'no_achievements' },
                { case: { $lte: ['$totalAchievements', 3] }, then: 'low_achievers' },
                { case: { $lte: ['$totalAchievements', 10] }, then: 'moderate_achievers' },
                { case: { $gt: ['$totalAchievements', 10] }, then: 'high_achievers' }
              ],
              default: 'unknown'
            }
          },
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isRecentlyActive', 1, 0] } }
        }
      },
      {
        $project: {
          segment: '$_id',
          totalUsers: 1,
          activeUsers: 1,
          retentionRate: { 
            $round: [
              { $multiply: [{ $divide: ['$activeUsers', '$totalUsers'] }, 100] }, 
              2
            ]
          }
        }
      }
    ]);

    res.json({
      retentionData,
      achievementRetention,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get badge gifting analytics
router.get('/badge-gifting', async (req, res) => {
  try {
    const { period } = req.query;
    
    let dateRange = new Date();
    switch (period) {
      case 'day':
        dateRange.setDate(dateRange.getDate() - 1);
        break;
      case 'week':
        dateRange.setDate(dateRange.getDate() - 7);
        break;
      case 'month':
        dateRange.setMonth(dateRange.getMonth() - 1);
        break;
      default:
        dateRange.setDate(dateRange.getDate() - 7);
    }

    // Gift volume and trends
    const giftingTrends = await BadgeGift.aggregate([
      {
        $match: { sentAt: { $gte: dateRange } }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$sentAt" }
          },
          giftsCount: { $sum: 1 },
          totalPointsSpent: { $sum: '$pointsCost' },
          uniqueGifters: { $addToSet: '$fromUserId' },
          uniqueReceivers: { $addToSet: '$toUserId' }
        }
      },
      {
        $project: {
          date: '$_id',
          giftsCount: 1,
          totalPointsSpent: 1,
          uniqueGiftersCount: { $size: '$uniqueGifters' },
          uniqueReceiversCount: { $size: '$uniqueReceivers' }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    // Top gifted badges
    const popularBadges = await BadgeGift.aggregate([
      {
        $match: { sentAt: { $gte: dateRange } }
      },
      {
        $group: {
          _id: '$badgeId',
          giftCount: { $sum: 1 },
          totalPointsSpent: { $sum: '$pointsCost' }
        }
      },
      {
        $lookup: {
          from: 'badges',
          localField: '_id',
          foreignField: '_id',
          as: 'badge'
        }
      },
      {
        $unwind: '$badge'
      },
      {
        $sort: { giftCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Gifting occasions
    const occasionStats = await BadgeGift.aggregate([
      {
        $match: { sentAt: { $gte: dateRange } }
      },
      {
        $group: {
          _id: '$metadata.occasion',
          count: { $sum: 1 },
          averagePointCost: { $avg: '$pointsCost' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Community impact
    const totalUsers = await User.countDocuments({});
    const giftingUsers = await BadgeGift.distinct('fromUserId', { sentAt: { $gte: dateRange } });
    const receivingUsers = await BadgeGift.distinct('toUserId', { sentAt: { $gte: dateRange } });

    res.json({
      period,
      giftingTrends,
      popularBadges,
      occasionStats,
      communityImpact: {
        totalUsers,
        giftingUsers: giftingUsers.length,
        receivingUsers: receivingUsers.length,
        giftingParticipation: Math.round((giftingUsers.length / totalUsers) * 100),
        receivingParticipation: Math.round((receivingUsers.length / totalUsers) * 100)
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get streak analytics
router.get('/streaks', async (req, res) => {
  try {
    // Streak distribution
    const streakDistribution = await StreakTracker.aggregate([
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $eq: ['$currentStreak', 0] }, then: 'no_streak' },
                { case: { $lte: ['$currentStreak', 7] }, then: '1-7_days' },
                { case: { $lte: ['$currentStreak', 30] }, then: '8-30_days' },
                { case: { $lte: ['$currentStreak', 100] }, then: '31-100_days' },
                { case: { $gt: ['$currentStreak', 100] }, then: '100+_days' }
              ],
              default: 'unknown'
            }
          },
          count: { $sum: 1 },
          averageStreak: { $avg: '$currentStreak' }
        }
      }
    ]);

    // Streak milestone achievements
    const milestoneAchievements = await StreakTracker.aggregate([
      {
        $group: {
          _id: null,
          streak7Achievers: { $sum: { $cond: ['$achievements.streak7', 1, 0] } },
          streak30Achievers: { $sum: { $cond: ['$achievements.streak30', 1, 0] } },
          streak100Achievers: { $sum: { $cond: ['$achievements.streak100', 1, 0] } }
        }
      }
    ]);

    // Streak trends over time
    const streakTrends = await StreakTracker.aggregate([
      {
        $unwind: '$streakHistory'
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$streakHistory.date" }
          },
          activeStreakUsers: { $sum: 1 },
          averageStreakDay: { $avg: '$streakHistory.streakDay' },
          totalPosts: { $sum: '$streakHistory.postsCount' }
        }
      },
      {
        $sort: { _id: -1 }
      },
      {
        $limit: 30
      }
    ]);

    res.json({
      streakDistribution,
      milestoneAchievements: milestoneAchievements[0] || {},
      streakTrends,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get comprehensive dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const { period } = req.query;
    
    let dateRange = new Date();
    switch (period) {
      case 'day':
        dateRange.setDate(dateRange.getDate() - 1);
        break;
      case 'week':
        dateRange.setDate(dateRange.getDate() - 7);
        break;
      case 'month':
        dateRange.setMonth(dateRange.getMonth() - 1);
        break;
      default:
        dateRange.setDate(dateRange.getDate() - 7);
    }

    // Key metrics
    const [
      totalUsers,
      activeUsers,
      totalAchievements,
      achievementsUnlocked,
      totalBadgeGifts,
      activeStreaks,
      totalPosts
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ lastActive: { $gte: dateRange } }),
      Achievement.countDocuments({ isActive: true }),
      UserAchievement.countDocuments({ 
        completedAt: { $gte: dateRange },
        isCompleted: true 
      }),
      BadgeGift.countDocuments({ sentAt: { $gte: dateRange } }),
      StreakTracker.countDocuments({ currentStreak: { $gt: 0 } }),
      Post.countDocuments({ createdAt: { $gte: dateRange } })
    ]);

    // Engagement metrics
    const engagementMetrics = {
      userRetention: Math.round((activeUsers / totalUsers) * 100),
      achievementEngagement: Math.round((achievementsUnlocked / totalAchievements) * 100),
      communityEngagement: Math.round((totalBadgeGifts / activeUsers) * 100),
      streakParticipation: Math.round((activeStreaks / totalUsers) * 100)
    };

    // Growth trends
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          newUsers: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      },
      {
        $limit: 30
      }
    ]);

    res.json({
      period,
      keyMetrics: {
        totalUsers,
        activeUsers,
        totalAchievements,
        achievementsUnlocked,
        totalBadgeGifts,
        activeStreaks,
        totalPosts
      },
      engagementMetrics,
      userGrowth,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;