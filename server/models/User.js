// server/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 15
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profilePic: {
    type: String,
    default: null
  },
  goals: [{
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal'
    },
    description: String,
    targetDate: Date,
    currentProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }],
  joinedCommunities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community'
  }],
  points: {
    type: Number,
    default: 0
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
  }],
  subscriptionStatus: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  stripeCustomerId: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  // Achievement system fields
  achievements: [{
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement'
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    },
    completionCount: {
      type: Number,
      default: 1
    }
  }],
  totalAchievements: {
    type: Number,
    default: 0
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  totalPosts: {
    type: Number,
    default: 0
  },
  totalReactionsGiven: {
    type: Number,
    default: 0
  },
  totalReactionsReceived: {
    type: Number,
    default: 0
  },
  totalCommentsGiven: {
    type: Number,
    default: 0
  },
  badgesGifted: {
    type: Number,
    default: 0
  },
  badgesReceived: {
    type: Number,
    default: 0
  },
  leaderboardRank: {
    type: Number,
    default: null
  },
  timezone: {
    type: String,
    default: 'UTC'
  }
});

module.exports = mongoose.model('User', userSchema);