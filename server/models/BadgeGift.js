// server/models/BadgeGift.js
const mongoose = require('mongoose');

const badgeGiftSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  badgeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge',
    required: true
  },
  message: {
    type: String,
    maxlength: 200,
    required: true
  },
  pointsCost: {
    type: Number,
    required: true,
    min: 30,
    max: 70
  },
  status: {
    type: String,
    enum: ['sent', 'received', 'declined'],
    default: 'sent'
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  receivedAt: {
    type: Date,
    default: null
  },
  metadata: {
    occasion: {
      type: String,
      enum: ['congratulations', 'encouragement', 'thank_you', 'milestone', 'other'],
      default: 'other'
    },
    isAnonymous: {
      type: Boolean,
      default: false
    }
  }
});

// Indexes for efficient querying
badgeGiftSchema.index({ toUserId: 1, status: 1 });
badgeGiftSchema.index({ fromUserId: 1, sentAt: -1 });
badgeGiftSchema.index({ toUserId: 1, receivedAt: -1 });

module.exports = mongoose.model('BadgeGift', badgeGiftSchema);