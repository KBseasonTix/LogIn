// server/routes/achievements.js
const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const User = require('../models/User');
const AchievementEngine = require('../services/AchievementEngine');

// Get all available achievements
router.get('/', async (req, res) => {
  try {
    const achievements = await Achievement.find({ isActive: true })
      .sort({ category: 1, order: 1 });
    
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get achievements by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const achievements = await Achievement.find({ 
      category, 
      isActive: true 
    }).sort({ order: 1 });
    
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's achievement progress
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, completed } = req.query;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let query = { userId };
    if (completed !== undefined) {
      query.isCompleted = completed === 'true';
    }

    let userAchievements = await UserAchievement.find(query)
      .populate('achievementId')
      .sort({ isCompleted: 1, 'progress.percentage': -1, updatedAt: -1 });

    // Filter by category if specified
    if (category) {
      userAchievements = userAchievements.filter(
        ua => ua.achievementId && ua.achievementId.category === category
      );
    }

    const result = userAchievements.map(ua => ({
      id: ua._id,
      achievement: ua.achievementId,
      progress: ua.progress,
      isCompleted: ua.isCompleted,
      completedAt: ua.completedAt,
      completionCount: ua.completionCount,
      metadata: ua.metadata
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's completed achievements
router.get('/user/:userId/completed', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const completedAchievements = await UserAchievement.find({
      userId,
      isCompleted: true
    })
    .populate('achievementId')
    .sort({ completedAt: -1 });

    const result = completedAchievements.map(ua => ({
      achievement: ua.achievementId,
      completedAt: ua.completedAt,
      completionCount: ua.completionCount
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get achievement statistics for a user
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const totalAchievements = await Achievement.countDocuments({ isActive: true });
    const completedCount = await UserAchievement.countDocuments({
      userId,
      isCompleted: true
    });

    const inProgressCount = await UserAchievement.countDocuments({
      userId,
      isCompleted: false,
      'progress.current': { $gt: 0 }
    });

    const categoryStats = await UserAchievement.aggregate([
      { $match: { userId: user._id } },
      { $lookup: {
        from: 'achievements',
        localField: 'achievementId',
        foreignField: '_id',
        as: 'achievement'
      }},
      { $unwind: '$achievement' },
      { $group: {
        _id: '$achievement.category',
        total: { $sum: 1 },
        completed: { $sum: { $cond: ['$isCompleted', 1, 0] } }
      }},
      { $project: {
        category: '$_id',
        total: 1,
        completed: 1,
        completionRate: { 
          $round: [{ $multiply: [{ $divide: ['$completed', '$total'] }, 100] }, 1] 
        }
      }}
    ]);

    res.json({
      totalAchievements,
      completedCount,
      inProgressCount,
      completionRate: Math.round((completedCount / totalAchievements) * 100),
      categoryStats,
      totalPoints: user.points,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Manually award achievement (admin only)
router.post('/award', async (req, res) => {
  try {
    const { userId, achievementId, reason } = req.body;
    
    const user = await User.findById(userId);
    const achievement = await Achievement.findById(achievementId);
    
    if (!user || !achievement) {
      return res.status(404).json({ message: 'User or achievement not found' });
    }

    await AchievementEngine.checkAndAwardAchievements(userId, 'manual_award', {
      achievementId,
      progress: achievement.requirements.value || 1,
      reason
    });

    res.json({ message: 'Achievement awarded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Recalculate user achievements
router.post('/user/:userId/recalculate', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await AchievementEngine.recalculateAllUserAchievements(userId);
    
    res.json({ message: 'Achievements recalculated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get achievement leaderboards
router.get('/leaderboard/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const validTypes = ['points', 'achievements', 'streak', 'posts'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid leaderboard type' });
    }

    const leaderboard = await AchievementEngine.getLeaderboard(type, limit);
    
    res.json({
      type,
      leaderboard,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's rank in leaderboard
router.get('/user/:userId/rank/:type', async (req, res) => {
  try {
    const { userId, type } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let sortField = 'points';
    switch (type) {
      case 'achievements':
        sortField = 'totalAchievements';
        break;
      case 'streak':
        sortField = 'longestStreak';
        break;
      case 'posts':
        sortField = 'totalPosts';
        break;
    }

    const userValue = user[sortField] || 0;
    const rank = await User.countDocuments({
      [sortField]: { $gt: userValue }
    }) + 1;

    const totalUsers = await User.countDocuments({});
    const percentile = Math.round(((totalUsers - rank) / totalUsers) * 100);

    res.json({
      rank,
      value: userValue,
      totalUsers,
      percentile,
      type
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;