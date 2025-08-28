// server/models/Achievement.js
const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['daily_streak', 'goal_progress', 'community_engagement', 'special'],
    required: true
  },
  type: {
    type: String,
    enum: ['streak', 'goal', 'community', 'milestone', 'special'],
    required: true
  },
  requirements: {
    type: {
      type: String,
      enum: ['streak_days', 'goal_completion_percentage', 'posts_count', 'reactions_received', 'comments_made', 'manual'],
      required: true
    },
    value: {
      type: Number,
      required: function() { return this.requirements.type !== 'manual'; }
    },
    additionalCriteria: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  rewards: {
    points: {
      type: Number,
      required: true,
      min: 25,
      max: 2000
    },
    badges: [{
      badgeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badge'
      },
      count: {
        type: Number,
        default: 1
      }
    }]
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isRepeatable: {
    type: Boolean,
    default: false
  },
  maxCompletions: {
    type: Number,
    default: 1
  },
  order: {
    type: Number,
    default: 0
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

// Indexes for efficient querying
achievementSchema.index({ category: 1, isActive: 1 });
achievementSchema.index({ type: 1, isActive: 1 });
achievementSchema.index({ 'requirements.type': 1, 'requirements.value': 1 });

module.exports = mongoose.model('Achievement', achievementSchema);