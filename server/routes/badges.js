// server/routes/badges.js (New)
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Community = require('../models/Community');
const Badge = require('../models/Badge');

// Get available badges for gifting
router.get('/available/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Get badges user can redeem
    const redeemableBadges = user.badges.filter(badge => badge.count > 0);
    
    res.json(redeemableBadges);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Gift a badge to another user
router.post('/gift', async (req, res) => {
  try {
    const { senderId, recipientId, badgeId, message } = req.body;
    
    const sender = await User.findById(senderId);
    const recipient = await User.findById(recipientId);
    
    if (!sender || !recipient) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find the badge in sender's collection
    const badgeIndex = sender.badges.findIndex(b => b.id === badgeId);
    if (badgeIndex === -1 || sender.badges[badgeIndex].count <= 0) {
      return res.status(400).json({ message: 'You don\'t have this badge to gift' });
    }
    
    // Decrement sender's badge count
    sender.badges[badgeIndex].count -= 1;
    if (sender.badges[badgeIndex].count === 0) {
      sender.badges.splice(badgeIndex, 1);
    }
    
    // Add badge to recipient
    const badge = sender.badges.find(b => b.id === badgeId);
    const recipientBadgeIndex = recipient.badges.findIndex(b => b.id === badgeId);
    
    if (recipientBadgeIndex !== -1) {
      recipient.badges[recipientBadgeIndex].count += 1;
      recipient.badges[recipientBadgeIndex].giftedBy.push({ 
        userId: senderId, 
        date: new Date(),
        message 
      });
    } else {
      recipient.badges.push({
        id: badge.id,
        name: badge.name,
        count: 1,
        giftedBy: [{ userId: senderId, date: new Date(), message }]
      });
    }
    
    await sender.save();
    await recipient.save();
    
    // Create notification for recipient
    const notification = new Notification({
      userId: recipientId,
      message: `${sender.username} gifted you a ${badge.name} badge!`,
      type: 'badge-gift',
      read: false,
      createdAt: new Date()
    });
    await notification.save();
    
    res.json({ 
      message: 'Badge gifted successfully',
      senderBadges: sender.badges,
      recipientBadges: recipient.badges
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get community-specific badges
router.get('/community/:communityId', async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    
    res.json(community.badges);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;