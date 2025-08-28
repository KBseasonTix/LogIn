// server/services/AchievementEngine.js
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const User = require('../models/User');
const StreakTracker = require('../models/StreakTracker');
const Transaction = require('../models/Transaction');
const NotificationService = require('./NotificationService');

class AchievementEngine {
  constructor() {
    this.achievements = new Map();
    this.loadAchievements();
  }

  async loadAchievements() {
    try {
      const achievements = await Achievement.find({ isActive: true });
      this.achievements.clear();
      achievements.forEach(achievement => {
        this.achievements.set(achievement.id, achievement);
      });
      console.log(`Loaded ${achievements.length} active achievements`);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  }

  async checkAndAwardAchievements(userId, eventType, eventData = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const relevantAchievements = Array.from(this.achievements.values())
        .filter(achievement => this.isRelevantForEvent(achievement, eventType));

      for (const achievement of relevantAchievements) {
        await this.evaluateAchievement(user, achievement, eventData);
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }

  isRelevantForEvent(achievement, eventType) {
    const eventMapping = {
      'post_created': ['posts_count', 'streak_days'],
      'reaction_given': ['reactions_given'],
      'reaction_received': ['reactions_received'],
      'comment_made': ['comments_made'],
      'goal_progress_updated': ['goal_completion_percentage'],
      'streak_updated': ['streak_days'],
      'manual_award': ['manual']
    };

    return eventMapping[eventType]?.includes(achievement.requirements.type);
  }

  async evaluateAchievement(user, achievement, eventData) {
    try {
      // Get or create user achievement record
      let userAchievement = await UserAchievement.findOne({
        userId: user._id,
        achievementId: achievement._id
      });

      if (!userAchievement) {
        userAchievement = new UserAchievement({
          userId: user._id,
          achievementId: achievement._id,
          progress: {
            current: 0,
            target: achievement.requirements.value || 1
          }
        });
      }

      // Skip if already completed and not repeatable
      if (userAchievement.isCompleted && !achievement.isRepeatable) {
        return;
      }

      // Skip if max completions reached
      if (userAchievement.completionCount >= achievement.maxCompletions) {
        return;
      }

      // Calculate current progress based on achievement type
      const currentProgress = await this.calculateProgress(user, achievement, eventData);
      
      // Update progress
      const oldProgress = userAchievement.progress.current;
      userAchievement.progress.current = currentProgress;

      // Check if achievement is completed
      if (currentProgress >= userAchievement.progress.target && !userAchievement.isCompleted) {
        await this.awardAchievement(user, achievement, userAchievement);
      }

      // Save progress if changed
      if (oldProgress !== currentProgress) {
        await userAchievement.save();
      }

    } catch (error) {
      console.error('Error evaluating achievement:', achievement.id, error);
    }
  }

  async calculateProgress(user, achievement, eventData) {
    const { type } = achievement.requirements;

    switch (type) {
      case 'posts_count':
        return user.totalPosts || 0;

      case 'streak_days':
        const streakTracker = await StreakTracker.findOne({ userId: user._id });
        return streakTracker ? streakTracker.currentStreak : 0;

      case 'reactions_received':
        return user.totalReactionsReceived || 0;

      case 'reactions_given':
        return user.totalReactionsGiven || 0;

      case 'comments_made':
        return user.totalCommentsGiven || 0;

      case 'goal_completion_percentage':
        // Calculate average goal progress
        if (user.goals && user.goals.length > 0) {
          const totalProgress = user.goals.reduce((sum, goal) => sum + goal.currentProgress, 0);
          return Math.round(totalProgress / user.goals.length);
        }
        return 0;

      case 'manual':
        return eventData.progress || 0;

      default:
        return 0;
    }
  }

  async awardAchievement(user, achievement, userAchievement) {
    try {
      // Mark as completed
      userAchievement.isCompleted = true;
      userAchievement.completedAt = new Date();
      userAchievement.completionCount += 1;
      
      // Add to user's achievements array
      const existingAchievement = user.achievements.find(
        a => a.achievementId.toString() === achievement._id.toString()
      );

      if (existingAchievement) {
        existingAchievement.completionCount += 1;
      } else {
        user.achievements.push({
          achievementId: achievement._id,
          unlockedAt: new Date(),
          completionCount: 1
        });
      }

      user.totalAchievements += 1;

      // Award points
      user.points += achievement.rewards.points;

      // Award badges if specified
      if (achievement.rewards.badges && achievement.rewards.badges.length > 0) {
        for (const badgeReward of achievement.rewards.badges) {
          const existingBadge = user.badges.find(
            b => b.badgeId.toString() === badgeReward.badgeId.toString()
          );

          if (existingBadge) {
            existingBadge.count += badgeReward.count;
          } else {
            user.badges.push({
              badgeId: badgeReward.badgeId,
              count: badgeReward.count
            });
          }
        }
      }

      // Save changes
      await Promise.all([
        userAchievement.save(),
        user.save()
      ]);

      // Record transaction
      const transaction = new Transaction({
        userId: user._id,
        type: 'achievement_bonus',
        amount: achievement.rewards.points,
        reason: `Achievement unlocked: ${achievement.name}`,
        achievementId: achievement._id
      });
      await transaction.save();

      // Send notification
      await NotificationService.createNotification({
        userId: user._id,
        type: 'achievement_unlocked',
        title: 'Achievement Unlocked!',
        message: `Congratulations! You've unlocked "${achievement.name}"`,
        data: {
          achievementId: achievement._id,
          points: achievement.rewards.points
        },
        priority: 'high'
      });

      console.log(`Achievement awarded: ${achievement.name} to user ${user.username}`);

    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  }

  async recalculateAllUserAchievements(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Trigger all relevant achievement checks
      await Promise.all([
        this.checkAndAwardAchievements(userId, 'post_created'),
        this.checkAndAwardAchievements(userId, 'reaction_given'),
        this.checkAndAwardAchievements(userId, 'reaction_received'),
        this.checkAndAwardAchievements(userId, 'comment_made'),
        this.checkAndAwardAchievements(userId, 'goal_progress_updated'),
        this.checkAndAwardAchievements(userId, 'streak_updated')
      ]);

    } catch (error) {
      console.error('Error recalculating achievements:', error);
    }
  }

  async getAchievementProgress(userId, achievementId = null) {
    try {
      const query = { userId };
      if (achievementId) {
        query.achievementId = achievementId;
      }

      const userAchievements = await UserAchievement.find(query)
        .populate('achievementId')
        .sort({ 'progress.percentage': -1, updatedAt: -1 });

      return userAchievements.map(ua => ({
        achievement: ua.achievementId,
        progress: ua.progress,
        isCompleted: ua.isCompleted,
        completedAt: ua.completedAt,
        completionCount: ua.completionCount
      }));

    } catch (error) {
      console.error('Error getting achievement progress:', error);
      return [];
    }
  }

  async getLeaderboard(type = 'points', limit = 50) {
    try {
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
        default:
          sortField = 'points';
      }

      const users = await User.find({})
        .select(`username profilePic ${sortField} totalAchievements currentStreak`)
        .sort({ [sortField]: -1 })
        .limit(limit);

      return users.map((user, index) => ({
        rank: index + 1,
        username: user.username,
        profilePic: user.profilePic,
        value: user[sortField],
        totalAchievements: user.totalAchievements,
        currentStreak: user.currentStreak
      }));

    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }
}

module.exports = new AchievementEngine();