// server/routes/goals.js (New)
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Community = require('../models/Community');

// Complete a goal
router.post('/complete', async (req, res) => {
  try {
    const { userId, goalId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const goalIndex = user.goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return res.status(404).json({ message: 'Goal not found' });
    
    // Mark goal as completed
    user.goals[goalIndex].completed = true;
    user.goals[goalIndex].completionDate = new Date();
    
    // Find community-specific points
    const communityIndex = user.joinedCommunities.findIndex(
      c => c.communityId === user.goals[goalIndex].communityId
    );
    
    if (communityIndex !== -1) {
      // Award community points
      const pointsAwarded = 50; // Base completion points
      user.joinedCommunities[communityIndex].communityPoints += pointsAwarded;
      
      // Check for compounded productivity
      const community = await Community.findById(user.goals[goalIndex].communityId);
      if (community) {
        const progression = community.goalProgression.find(
          p => p.baseGoal === goalId
        );
        
        if (progression && user.goals[goalIndex].currentProgress >= progression.progressRequired) {
          // Create new goal that builds on previous progress
          const newGoal = {
            id: `goal-${Date.now()}`,
            description: progression.nextGoal,
            targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            currentProgress: 0,
            communityId: user.goals[goalIndex].communityId,
            previousGoalId: goalId
          };
          
          user.goals.push(newGoal);
          
          // Award bonus points
          user.points += progression.bonusPoints;
          
          // Award progression badge if available
          if (progression.badgeReward) {
            const communityBadge = community.badges.find(b => b.id === progression.badgeReward);
            if (communityBadge) {
              user.joinedCommunities[communityIndex].badgesEarned.push({
                badgeId: progression.badgeReward,
                earnedDate: new Date()
              });
              
              // Add to user's main badges
              const badgeIndex = user.badges.findIndex(b => b.id === progression.badgeReward);
              if (badgeIndex !== -1) {
                user.badges[badgeIndex].count += 1;
              } else {
                user.badges.push({
                  id: progression.badgeReward,
                  name: communityBadge.name,
                  count: 1
                });
              }
            }
          }
        }
      }
    }
    
    // Award general points
    user.points += 50;
    
    await user.save();
    
    res.json({
      message: 'Goal completed successfully',
      updatedUser: {
        points: user.points,
        goals: user.goals,
        badges: user.badges,
        statusTier: user.statusTier
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get status tier information
router.get('/status-tiers', (req, res) => {
  const tiers = [
    {
      id: 'just-starting',
      name: 'Just Getting Started',
      pointsRequired: 0,
      description: 'Beginning your journey',
      icon: '🌱',
      color: '#4CAF50'
    },
    {
      id: 'rookie',
      name: 'Rookie',
      pointsRequired: 500,
      description: 'Building momentum',
      icon: '👟',
      color: '#8BC34A'
    },
    {
      id: 'on-track',
      name: 'On The Right Track',
      pointsRequired: 1500,
      description: 'Making consistent progress',
      icon: '🚴',
      color: '#FFC107'
    },
    {
      id: 'big-progress',
      name: 'Big Progress',
      pointsRequired: 3000,
      description: 'Significant achievements',
      icon: '🏆',
      color: '#FF9800'
    },
    {
      id: 'final-hurdle',
      name: 'Final Hurdle',
      pointsRequired: 5000,
      description: 'Almost at your destination',
      icon: '🎯',
      color: '#F44336'
    }
  ];
  
  res.json(tiers);
});

module.exports = router;