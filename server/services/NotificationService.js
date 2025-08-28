// server/services/NotificationService.js
const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();

      // In a real app, you might also:
      // - Send push notifications
      // - Send email notifications
      // - Emit socket events for real-time updates
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getUserNotifications(userId, limit = 20, onlyUnread = false) {
    try {
      const query = { userId };
      if (onlyUnread) {
        query.isRead = false;
      }

      const notifications = await Notification.find(query)
        .populate('data.fromUserId', 'username profilePic')
        .populate('data.achievementId', 'name icon')
        .populate('data.badgeId', 'name icon')
        .sort({ createdAt: -1 })
        .limit(limit);

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId, isRead: false },
        { isRead: true, readAt: new Date() },
        { new: true }
      );

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId) {
    try {
      await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        userId,
        isRead: false
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async deleteOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
      });

      console.log(`Deleted ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      return 0;
    }
  }

  async createBadgeGiftNotification(badgeGift) {
    try {
      const fromUser = await User.findById(badgeGift.fromUserId).select('username');
      const message = badgeGift.metadata.isAnonymous 
        ? `Someone sent you a badge with a message: "${badgeGift.message}"`
        : `${fromUser.username} sent you a badge with a message: "${badgeGift.message}"`;

      return await this.createNotification({
        userId: badgeGift.toUserId,
        type: 'badge_received',
        title: 'Badge Gift Received!',
        message,
        data: {
          badgeId: badgeGift.badgeId,
          badgeGiftId: badgeGift._id,
          fromUserId: badgeGift.metadata.isAnonymous ? null : badgeGift.fromUserId
        },
        priority: 'normal'
      });
    } catch (error) {
      console.error('Error creating badge gift notification:', error);
      throw error;
    }
  }

  async createStreakMilestoneNotification(userId, streakDays) {
    try {
      let title = 'Streak Milestone!';
      let message = `Congratulations! You've reached a ${streakDays}-day posting streak!`;

      if (streakDays === 7) {
        message = `Amazing! You've maintained a 7-day posting streak! Keep it up!`;
      } else if (streakDays === 30) {
        message = `Incredible! You've achieved a 30-day posting streak! You're on fire!`;
      } else if (streakDays === 100) {
        message = `LEGENDARY! You've reached a 100-day posting streak! You're a consistency master!`;
      }

      return await this.createNotification({
        userId,
        type: 'streak_milestone',
        title,
        message,
        data: {
          streakDays
        },
        priority: streakDays >= 30 ? 'high' : 'normal'
      });
    } catch (error) {
      console.error('Error creating streak milestone notification:', error);
      throw error;
    }
  }

  async createGoalProgressNotification(userId, goalProgress, goalDescription) {
    try {
      let title = 'Goal Progress Update';
      let message = `Great progress! You're ${goalProgress}% towards your goal: "${goalDescription}"`;

      if (goalProgress >= 100) {
        title = 'Goal Completed!';
        message = `Congratulations! You've completed your goal: "${goalDescription}"`;
      } else if (goalProgress >= 75) {
        title = 'Almost There!';
        message = `You're so close! ${goalProgress}% complete on: "${goalDescription}"`;
      }

      return await this.createNotification({
        userId,
        type: 'goal_progress',
        title,
        message,
        data: {
          goalProgress
        },
        priority: goalProgress >= 100 ? 'high' : 'normal'
      });
    } catch (error) {
      console.error('Error creating goal progress notification:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();