const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
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
  icon: String,
  cost: {
    type: Number,
    required: true,
    default: 100
  },
  category: {
    type: String,
    enum: ['achievement', 'community', 'milestone', 'special'],
    default: 'achievement'
  },
  requirements: {
    type: String,
    enum: ['posts', 'progress', 'time', 'points'],
    default: 'points'
  },
  requirementValue: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Badge', badgeSchema);