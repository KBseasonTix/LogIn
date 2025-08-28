const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['redeem', 'deduct', 'award', 'gift_sent', 'gift_received', 'achievement_bonus'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  reason: String,
  badgeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge'
  },
  achievementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement'
  },
  relatedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  badgeGiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BadgeGift'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);