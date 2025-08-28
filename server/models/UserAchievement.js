// server/models/UserAchievement.js
const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  progress: {
    current: {
      type: Number,
      default: 0
    },
    target: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  completedAt: {
    type: Date,
    default: null
  },
  completionCount: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient user achievement lookup
userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
userAchievementSchema.index({ userId: 1, isCompleted: 1 });
userAchievementSchema.index({ userId: 1, completedAt: -1 });

// Update percentage whenever progress changes
userAchievementSchema.pre('save', function(next) {
  if (this.progress.target > 0) {
    this.progress.percentage = Math.min(100, Math.round((this.progress.current / this.progress.target) * 100));
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('UserAchievement', userAchievementSchema);