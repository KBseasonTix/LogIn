// server/jobs/BackgroundJobs.js
const cron = require('node-cron');
const AchievementEngine = require('../services/AchievementEngine');
const StreakService = require('../services/StreakService');
const NotificationService = require('../services/NotificationService');
const CacheService = require('../services/CacheService');
const User = require('../models/User');
const Post = require('../models/Post');

class BackgroundJobs {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('Background jobs already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting background jobs...');

    // Job 1: Daily streak calculations (runs at midnight UTC)
    this.jobs.set('daily-streak-reset', cron.schedule('0 0 * * *', async () => {
      console.log('Running daily streak reset job...');
      try {
        const resetCount = await StreakService.resetBrokenStreaks();
        console.log(`Daily streak reset completed. Reset ${resetCount} broken streaks.`);
        
        // Invalidate streak-related caches
        CacheService.invalidateLeaderboards();
        
      } catch (error) {
        console.error('Daily streak reset job failed:', error);
      }
    }, { scheduled: false }));

    // Job 2: Achievement recalculation for active users (runs every 6 hours)
    this.jobs.set('achievement-recalc', cron.schedule('0 */6 * * *', async () => {
      console.log('Running achievement recalculation job...');
      try {
        // Get users active in the last 24 hours
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const activeUsers = await User.find({
          lastActive: { $gte: yesterday }
        }).select('_id').limit(100); // Limit to prevent overload

        let processedCount = 0;
        for (const user of activeUsers) {
          await AchievementEngine.recalculateAllUserAchievements(user._id);
          processedCount++;
          
          // Small delay to prevent database overload
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`Achievement recalculation completed for ${processedCount} active users.`);
        
        // Invalidate achievement-related caches
        CacheService.invalidateAchievementStats();
        
      } catch (error) {
        console.error('Achievement recalculation job failed:', error);
      }
    }, { scheduled: false }));

    // Job 3: Update user statistics (runs every hour)
    this.jobs.set('user-stats-update', cron.schedule('0 * * * *', async () => {
      console.log('Running user statistics update job...');
      try {
        // Update total posts, reactions, etc. for users with recent activity
        const recentUsers = await User.find({
          lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).select('_id');

        let updatedCount = 0;
        for (const user of recentUsers) {
          // Count posts
          const totalPosts = await Post.countDocuments({ userId: user._id });
          
          // Count reactions given
          const totalReactionsGiven = await Post.aggregate([
            { $match: { 'markedBy.userId': user._id } },
            { $unwind: '$markedBy' },
            { $match: { 'markedBy.userId': user._id, 'markedBy.type': 'positive' } },
            { $count: 'total' }
          ]);

          // Count reactions received
          const totalReactionsReceived = await Post.aggregate([
            { $match: { userId: user._id } },
            { $group: { _id: null, total: { $sum: '$positiveMarkers' } } }
          ]);

          // Update user record
          await User.findByIdAndUpdate(user._id, {
            totalPosts,
            totalReactionsGiven: totalReactionsGiven[0]?.total || 0,
            totalReactionsReceived: totalReactionsReceived[0]?.total || 0
          });

          updatedCount++;
        }

        console.log(`User statistics updated for ${updatedCount} users.`);
        
      } catch (error) {
        console.error('User statistics update job failed:', error);
      }
    }, { scheduled: false }));

    // Job 4: Clean up old notifications (runs daily at 2 AM)
    this.jobs.set('cleanup-notifications', cron.schedule('0 2 * * *', async () => {
      console.log('Running notification cleanup job...');
      try {
        const deletedCount = await NotificationService.deleteOldNotifications(30);
        console.log(`Notification cleanup completed. Deleted ${deletedCount} old notifications.`);
      } catch (error) {
        console.error('Notification cleanup job failed:', error);
      }
    }, { scheduled: false }));

    // Job 5: Cache prewarming for leaderboards (runs every 15 minutes during peak hours)
    this.jobs.set('cache-prewarm', cron.schedule('*/15 8-22 * * *', async () => {
      console.log('Running cache prewarming job...');
      try {
        // Prewarm leaderboard caches
        const leaderboardTypes = ['points', 'achievements', 'streak', 'posts'];
        
        for (const type of leaderboardTypes) {
          const leaderboard = await AchievementEngine.getLeaderboard(type, 50);
          CacheService.cacheLeaderboard(type, leaderboard, 900); // Cache for 15 minutes
        }

        // Prewarm streak leaderboard
        const streakLeaderboard = await StreakService.getStreakLeaderboard(50);
        CacheService.cacheLeaderboard('streak_dedicated', streakLeaderboard, 900);

        console.log('Cache prewarming completed for all leaderboards.');
        
      } catch (error) {
        console.error('Cache prewarming job failed:', error);
      }
    }, { scheduled: false }));

    // Job 6: Update leaderboard ranks (runs every 30 minutes)
    this.jobs.set('leaderboard-ranks', cron.schedule('*/30 * * * *', async () => {
      console.log('Running leaderboard rank update job...');
      try {
        // Update user ranks in the database
        const users = await User.find({}).sort({ points: -1 });
        
        for (let i = 0; i < users.length; i++) {
          await User.findByIdAndUpdate(users[i]._id, {
            leaderboardRank: i + 1
          });
        }

        console.log(`Leaderboard ranks updated for ${users.length} users.`);
        
        // Invalidate leaderboard caches to force refresh
        CacheService.invalidateLeaderboards();
        
      } catch (error) {
        console.error('Leaderboard rank update job failed:', error);
      }
    }, { scheduled: false }));

    // Job 7: Achievement milestone checks (runs every 4 hours)
    this.jobs.set('milestone-check', cron.schedule('0 */4 * * *', async () => {
      console.log('Running achievement milestone check job...');
      try {
        // Check for users who might have missed milestone achievements
        const users = await User.find({
          lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }).select('_id currentStreak totalPosts totalReactionsReceived');

        let checkedCount = 0;
        for (const user of users) {
          // Check streak milestones
          if (user.currentStreak >= 7 || user.currentStreak >= 30 || user.currentStreak >= 100) {
            await AchievementEngine.checkAndAwardAchievements(user._id, 'streak_updated', {
              currentStreak: user.currentStreak
            });
          }

          // Check post count milestones
          if (user.totalPosts > 0) {
            await AchievementEngine.checkAndAwardAchievements(user._id, 'post_created');
          }

          // Check reaction milestones
          if (user.totalReactionsReceived > 0) {
            await AchievementEngine.checkAndAwardAchievements(user._id, 'reaction_received');
          }

          checkedCount++;
          
          // Small delay to prevent overload
          if (checkedCount % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        console.log(`Milestone check completed for ${checkedCount} users.`);
        
      } catch (error) {
        console.error('Milestone check job failed:', error);
      }
    }, { scheduled: false }));

    // Start all jobs
    this.jobs.forEach((job, name) => {
      job.start();
      console.log(`Started job: ${name}`);
    });

    console.log(`Started ${this.jobs.size} background jobs`);
  }

  stop() {
    if (!this.isRunning) {
      console.log('Background jobs are not running');
      return;
    }

    console.log('Stopping background jobs...');
    
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped job: ${name}`);
    });

    this.isRunning = false;
    console.log('All background jobs stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      jobCount: this.jobs.size,
      jobs: Array.from(this.jobs.keys())
    };
  }

  // Manual trigger methods for testing
  async triggerStreakReset() {
    console.log('Manually triggering streak reset...');
    try {
      const resetCount = await StreakService.resetBrokenStreaks();
      console.log(`Manual streak reset completed. Reset ${resetCount} broken streaks.`);
      return resetCount;
    } catch (error) {
      console.error('Manual streak reset failed:', error);
      throw error;
    }
  }

  async triggerCachePrewarm() {
    console.log('Manually triggering cache prewarming...');
    try {
      const leaderboardTypes = ['points', 'achievements', 'streak', 'posts'];
      
      for (const type of leaderboardTypes) {
        const leaderboard = await AchievementEngine.getLeaderboard(type, 50);
        CacheService.cacheLeaderboard(type, leaderboard, 900);
      }

      console.log('Manual cache prewarming completed.');
      return true;
    } catch (error) {
      console.error('Manual cache prewarming failed:', error);
      throw error;
    }
  }
}

module.exports = new BackgroundJobs();