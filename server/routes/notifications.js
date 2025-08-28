// server/routes/notifications.js
const express = require('express');
const router = express.Router();
const NotificationService = require('../services/NotificationService');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Get user notifications
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit, onlyUnread } = req.query;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const notifications = await NotificationService.getUserNotifications(
      userId, 
      parseInt(limit) || 20,
      onlyUnread === 'true'
    );

    const unreadCount = await NotificationService.getUnreadCount(userId);

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    const notification = await NotificationService.markNotificationAsRead(notificationId, userId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found or already read' });
    }

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark all notifications as read
router.patch('/user/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await NotificationService.markAllNotificationsAsRead(userId);
    
    res.json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unread notification count
router.get('/user/:userId/unread-count', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const unreadCount = await NotificationService.getUnreadCount(userId);
    
    res.json({
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get notifications by type
router.get('/user/:userId/type/:type', async (req, res) => {
  try {
    const { userId, type } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validTypes = ['achievement_unlocked', 'badge_received', 'streak_milestone', 'goal_progress', 'community_recognition'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid notification type' });
    }

    const notifications = await Notification.find({
      userId,
      type
    })
    .populate('data.fromUserId', 'username profilePic')
    .populate('data.achievementId', 'name icon')
    .populate('data.badgeId', 'name icon')
    .sort({ createdAt: -1 })
    .limit(limit);

    res.json({
      notifications,
      type
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete old notifications (admin endpoint)
router.delete('/cleanup', async (req, res) => {
  try {
    const { daysOld } = req.query;
    
    const deletedCount = await NotificationService.deleteOldNotifications(
      parseInt(daysOld) || 30
    );
    
    res.json({
      message: 'Old notifications cleaned up',
      deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get notification statistics
router.get('/stats', async (req, res) => {
  try {
    const totalNotifications = await Notification.countDocuments({});
    const unreadNotifications = await Notification.countDocuments({ isRead: false });
    
    const typeDistribution = await Notification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const recentActivity = await Notification.aggregate([
      {
        $match: {
          createdAt: { 
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      totalNotifications,
      unreadNotifications,
      readNotifications: totalNotifications - unreadNotifications,
      typeDistribution,
      recentActivity,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;