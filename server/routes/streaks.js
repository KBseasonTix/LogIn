// server/routes/streaks.js
const express = require('express');
const router = express.Router();
const StreakService = require('../services/StreakService');
const StreakTracker = require('../models/StreakTracker');
const User = require('../models/User');

// Get user's streak information
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const streakStats = await StreakService.getUserStreakStats(userId);
    
    if (!streakStats) {
      return res.status(404).json({ message: 'Streak data not found' });
    }

    const percentile = await StreakService.calculateStreakPercentile(userId);

    res.json({
      ...streakStats,
      percentile,
      user: {
        id: user._id,
        username: user.username,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user's streak (called when user posts)
router.post('/user/:userId/update', async (req, res) => {
  try {
    const { userId } = req.params;
    const { timezone } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const streakResult = await StreakService.updateUserStreak(userId, timezone);
    
    res.json(streakResult);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get streak leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const leaderboard = await StreakService.getStreakLeaderboard(limit);
    
    res.json({
      leaderboard,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get streak statistics across all users
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await StreakTracker.countDocuments({});
    const activeStreaks = await StreakTracker.countDocuments({
      currentStreak: { $gt: 0 }
    });

    const streakDistribution = await StreakTracker.aggregate([
      {
        $group: {
          _id: null,
          averageStreak: { $avg: '$currentStreak' },
          maxStreak: { $max: '$currentStreak' },
          totalStreaksOver7: {
            $sum: { $cond: [{ $gte: ['$currentStreak', 7] }, 1, 0] }
          },
          totalStreaksOver30: {
            $sum: { $cond: [{ $gte: ['$currentStreak', 30] }, 1, 0] }
          },
          totalStreaksOver100: {
            $sum: { $cond: [{ $gte: ['$currentStreak', 100] }, 1, 0] }
          }
        }
      }
    ]);

    const milestoneAchievers = await StreakTracker.aggregate([
      {
        $group: {
          _id: null,
          streak7Achievers: {
            $sum: { $cond: ['$achievements.streak7', 1, 0] }
          },
          streak30Achievers: {
            $sum: { $cond: ['$achievements.streak30', 1, 0] }
          },
          streak100Achievers: {
            $sum: { $cond: ['$achievements.streak100', 1, 0] }
          }
        }
      }
    ]);

    const stats = streakDistribution[0] || {};
    const milestones = milestoneAchievers[0] || {};

    res.json({
      totalUsers,
      activeStreaks,
      inactiveStreaks: totalUsers - activeStreaks,
      averageStreak: Math.round(stats.averageStreak || 0),
      maxStreak: stats.maxStreak || 0,
      streakDistribution: {
        over7Days: stats.totalStreaksOver7 || 0,
        over30Days: stats.totalStreaksOver30 || 0,
        over100Days: stats.totalStreaksOver100 || 0
      },
      milestoneAchievers: {
        streak7: milestones.streak7Achievers || 0,
        streak30: milestones.streak30Achievers || 0,
        streak100: milestones.streak100Achievers || 0
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's streak history
router.get('/user/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days) || 30;
    
    const streakTracker = await StreakTracker.findOne({ userId });
    if (!streakTracker) {
      return res.status(404).json({ message: 'Streak data not found' });
    }

    // Get recent history
    const history = streakTracker.streakHistory
      .slice(-days)
      .map(entry => ({
        date: entry.date,
        postsCount: entry.postsCount,
        streakDay: entry.streakDay
      }));

    res.json({
      history,
      totalDays: streakTracker.streakHistory.length,
      currentStreak: streakTracker.currentStreak,
      longestStreak: streakTracker.longestStreak
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset broken streaks (admin endpoint)
router.post('/reset-broken', async (req, res) => {
  try {
    // This endpoint should be protected with admin authentication in a real app
    const resetCount = await StreakService.resetBrokenStreaks();
    
    res.json({
      message: 'Broken streaks reset successfully',
      resetCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get community streak stats
router.get('/community/:communityId', async (req, res) => {
  try {
    const { communityId } = req.params;
    
    // Get users in this community with streak data
    const users = await User.find({
      joinedCommunities: communityId
    }).select('_id username profilePic currentStreak longestStreak');

    const userIds = users.map(u => u._id);
    
    const streakTrackers = await StreakTracker.find({
      userId: { $in: userIds }
    });

    // Combine user data with streak data
    const communityStreaks = users.map(user => {
      const streakData = streakTrackers.find(
        st => st.userId.toString() === user._id.toString()
      );
      
      return {
        user: {
          id: user._id,
          username: user.username,
          profilePic: user.profilePic
        },
        currentStreak: streakData ? streakData.currentStreak : 0,
        longestStreak: streakData ? streakData.longestStreak : 0
      };
    }).sort((a, b) => b.currentStreak - a.currentStreak);

    const stats = {
      totalMembers: users.length,
      activeStreaks: communityStreaks.filter(cs => cs.currentStreak > 0).length,
      averageStreak: communityStreaks.reduce((sum, cs) => sum + cs.currentStreak, 0) / users.length,
      topStreaks: communityStreaks.slice(0, 10)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;