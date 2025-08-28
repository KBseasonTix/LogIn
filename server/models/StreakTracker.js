// server/models/StreakTracker.js
const mongoose = require('mongoose');

const streakTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastPostDate: {
    type: Date,
    default: null
  },
  streakStartDate: {
    type: Date,
    default: null
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  streakHistory: [{
    date: {
      type: Date,
      required: true
    },
    postsCount: {
      type: Number,
      default: 0
    },
    streakDay: {
      type: Number,
      required: true
    }
  }],
  achievements: {
    streak7: {
      type: Boolean,
      default: false
    },
    streak30: {
      type: Boolean,
      default: false
    },
    streak100: {
      type: Boolean,
      default: false
    }
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

// Index for efficient querying
streakTrackerSchema.index({ userId: 1 });
streakTrackerSchema.index({ currentStreak: -1 });
streakTrackerSchema.index({ longestStreak: -1 });

// Method to update streak based on post date
streakTrackerSchema.methods.updateStreak = function(postDate, userTimezone = 'UTC') {
  const now = new Date(postDate);
  const userDate = new Date(now.toLocaleString("en-US", {timeZone: userTimezone}));
  const todayStr = userDate.toDateString();
  
  if (!this.lastPostDate) {
    // First post ever
    this.currentStreak = 1;
    this.longestStreak = 1;
    this.streakStartDate = userDate;
    this.lastPostDate = userDate;
    this.streakHistory.push({
      date: userDate,
      postsCount: 1,
      streakDay: 1
    });
  } else {
    const lastPostUserDate = new Date(this.lastPostDate.toLocaleString("en-US", {timeZone: userTimezone}));
    const lastPostStr = lastPostUserDate.toDateString();
    const daysDiff = Math.floor((userDate - lastPostUserDate) / (1000 * 60 * 60 * 24));
    
    if (todayStr === lastPostStr) {
      // Same day, just increment post count
      const todayRecord = this.streakHistory.find(h => h.date.toDateString() === todayStr);
      if (todayRecord) {
        todayRecord.postsCount += 1;
      }
    } else if (daysDiff === 1) {
      // Consecutive day, continue streak
      this.currentStreak += 1;
      this.longestStreak = Math.max(this.longestStreak, this.currentStreak);
      this.lastPostDate = userDate;
      this.streakHistory.push({
        date: userDate,
        postsCount: 1,
        streakDay: this.currentStreak
      });
    } else if (daysDiff > 1) {
      // Streak broken, start new streak
      this.currentStreak = 1;
      this.streakStartDate = userDate;
      this.lastPostDate = userDate;
      this.streakHistory.push({
        date: userDate,
        postsCount: 1,
        streakDay: 1
      });
    }
  }
  
  this.timezone = userTimezone;
  this.updatedAt = new Date();
};

module.exports = mongoose.model('StreakTracker', streakTrackerSchema);