// server/models/Community.js (Updated)
const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  members: [{
    userId: String,
    joinedDate: Date,
    role: {
      type: String,
      default: 'member',
      enum: ['member', 'moderator', 'admin']
    }
  }],
  badges: [{
    id: String,
    name: String,
    description: String,
    icon: String,
    pointsRequired: Number,
    communitySpecific: Boolean,
    requirements: {
      type: String,
      enum: ['posts', 'progress', 'time'],
      default: 'posts'
    },
    requirementValue: Number
  }],
  goalProgression: [{
    // For compounded productivity
    baseGoal: String,
    nextGoal: String,
    progressRequired: Number,
    bonusPoints: Number,
    badgeReward: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Community', communitySchema);