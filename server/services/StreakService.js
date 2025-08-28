// server/services/StreakService.js
const StreakTracker = require('../models/StreakTracker');
const User = require('../models/User');
const Post = require('../models/Post');
const AchievementEngine = require('./AchievementEngine');
const NotificationService = require('./NotificationService');

class StreakService {
  constructor() {
    this.STREAK_MILESTONES = [7, 30, 100];
  }

  async updateUserStreak(userId, timezone = 'UTC') {
    try {
      let streakTracker = await StreakTracker.findOne({ userId });
      
      if (!streakTracker) {
        streakTracker = new StreakTracker({
          userId,
          timezone,
          currentStreak: 0,
          longestStreak: 0
        });
      }

      const now = new Date();
      const previousStreak = streakTracker.currentStreak;

      // Update streak based on current post
      streakTracker.updateStreak(now, timezone);
      await streakTracker.save();

      // Update user's streak fields
      const user = await User.findById(userId);
      if (user) {
        user.currentStreak = streakTracker.currentStreak;
        user.longestStreak = streakTracker.longestStreak;
        await user.save();
      }

      // Check for streak milestones
      if (streakTracker.currentStreak > previousStreak) {
        await this.checkStreakMilestones(userId, streakTracker.currentStreak, previousStreak);
      }

      // Trigger achievement engine
      await AchievementEngine.checkAndAwardAchievements(userId, 'streak_updated', {
        currentStreak: streakTracker.currentStreak,
        previousStreak
      });

      return {
        currentStreak: streakTracker.currentStreak,
        longestStreak: streakTracker.longestStreak,
        streakStartDate: streakTracker.streakStartDate,
        milestoneReached: this.STREAK_MILESTONES.includes(streakTracker.currentStreak)
      };

    } catch (error) {
      console.error('Error updating user streak:', error);
      throw error;
    }
  }

  async checkStreakMilestones(userId, currentStreak, previousStreak) {
    try {
      const milestonesReached = this.STREAK_MILESTONES.filter(
        milestone => currentStreak >= milestone && previousStreak < milestone
      );

      for (const milestone of milestonesReached) {
        // Send notification
        await NotificationService.createStreakMilestoneNotification(userId, milestone);

        // Update streak tracker achievements
        const streakTracker = await StreakTracker.findOne({ userId });
        if (streakTracker) {
          if (milestone === 7) streakTracker.achievements.streak7 = true;
          if (milestone === 30) streakTracker.achievements.streak30 = true;
          if (milestone === 100) streakTracker.achievements.streak100 = true;
          await streakTracker.save();
        }

        console.log(`Streak milestone reached: ${milestone} days for user ${userId}`);
      }
    } catch (error) {
      console.error('Error checking streak milestones:', error);
    }
  }

  async resetBrokenStreaks() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all users with current streaks > 0
      const activeStreakUsers = await StreakTracker.find({
        currentStreak: { $gt: 0 }
      });

      let brokensStreaks = 0;

      for (const streakTracker of activeStreakUsers) {
        const userTimezone = streakTracker.timezone || 'UTC';
        const userYesterday = new Date(yesterday.toLocaleString("en-US", {timeZone: userTimezone}));
        userYesterday.setHours(0, 0, 0, 0);

        const userToday = new Date(today.toLocaleString("en-US", {timeZone: userTimezone}));
        userToday.setHours(0, 0, 0, 0);

        // Check if user posted yesterday
        const yesterdayPosts = await Post.countDocuments({
          userId: streakTracker.userId,
          createdAt: {
            $gte: userYesterday,
            $lt: userToday
          }
        });

        // If no posts yesterday and streak tracker shows they should have posted
        if (yesterdayPosts === 0) {
          const lastPostDate = streakTracker.lastPostDate;
          if (lastPostDate) {
            const lastPostUserDate = new Date(lastPostDate.toLocaleString("en-US", {timeZone: userTimezone}));
            const daysSinceLastPost = Math.floor((userToday - lastPostUserDate) / (1000 * 60 * 60 * 24));
            
            if (daysSinceLastPost > 1) {
              // Streak is broken
              streakTracker.currentStreak = 0;
              streakTracker.streakStartDate = null;
              await streakTracker.save();

              // Update user record
              const user = await User.findById(streakTracker.userId);
              if (user) {
                user.currentStreak = 0;
                await user.save();
              }

              brokensStreaks++;
              console.log(`Streak reset for user ${streakTracker.userId} (${daysSinceLastPost} days since last post)`);
            }
          }
        }
      }

      console.log(`Reset ${brokensStreaks} broken streaks`);
      return brokensStreaks;

    } catch (error) {
      console.error('Error resetting broken streaks:', error);
      return 0;
    }
  }

  async getUserStreakStats(userId) {
    try {
      const streakTracker = await StreakTracker.findOne({ userId });
      
      if (!streakTracker) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          streakStartDate: null,
          totalDaysTracked: 0,
          achievements: {
            streak7: false,
            streak30: false,
            streak100: false
          }
        };
      }

      return {
        currentStreak: streakTracker.currentStreak,
        longestStreak: streakTracker.longestStreak,
        streakStartDate: streakTracker.streakStartDate,
        totalDaysTracked: streakTracker.streakHistory.length,
        achievements: streakTracker.achievements,
        recentHistory: streakTracker.streakHistory.slice(-30) // Last 30 days
      };

    } catch (error) {
      console.error('Error getting user streak stats:', error);
      return null;
    }
  }

  async getStreakLeaderboard(limit = 50) {
    try {
      const leaderboard = await StreakTracker.find({
        currentStreak: { $gt: 0 }
      })
      .populate('userId', 'username profilePic')
      .sort({ currentStreak: -1, longestStreak: -1 })
      .limit(limit);

      return leaderboard.map((entry, index) => ({
        rank: index + 1,
        user: entry.userId,
        currentStreak: entry.currentStreak,
        longestStreak: entry.longestStreak,
        streakStartDate: entry.streakStartDate
      }));

    } catch (error) {
      console.error('Error getting streak leaderboard:', error);
      return [];
    }
  }

  async calculateStreakPercentile(userId) {
    try {
      const userStreak = await StreakTracker.findOne({ userId });
      if (!userStreak || userStreak.currentStreak === 0) {
        return 0;
      }

      const totalUsers = await StreakTracker.countDocuments({});
      const usersWithLowerStreak = await StreakTracker.countDocuments({
        currentStreak: { $lt: userStreak.currentStreak }
      });

      const percentile = Math.round((usersWithLowerStreak / totalUsers) * 100);
      return percentile;

    } catch (error) {
      console.error('Error calculating streak percentile:', error);
      return 0;
    }
  }
}

module.exports = new StreakService();