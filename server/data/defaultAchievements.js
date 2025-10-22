// server/data/defaultAchievements.js
// Default achievements to be loaded into the system

module.exports = [
  // Daily Streak Achievements
  {
    id: 'streak_7_days',
    name: 'Weekly Warrior',
    description: 'Maintain a 7-day posting streak',
    icon: '🔥',
    category: 'daily_streak',
    type: 'streak',
    requirements: {
      type: 'streak_days',
      value: 7,
    },
    rewards: {
      points: 100,
    },
    tier: 'bronze',
    isActive: true,
    order: 1,
  },
  {
    id: 'streak_30_days',
    name: 'Monthly Master',
    description: 'Maintain a 30-day posting streak',
    icon: '🚀',
    category: 'daily_streak',
    type: 'streak',
    requirements: {
      type: 'streak_days',
      value: 30,
    },
    rewards: {
      points: 500,
    },
    tier: 'silver',
    isActive: true,
    order: 2,
  },
  {
    id: 'streak_100_days',
    name: 'Consistency Master',
    description: 'Maintain a 100-day posting streak',
    icon: '👑',
    category: 'daily_streak',
    type: 'streak',
    requirements: {
      type: 'streak_days',
      value: 100,
    },
    rewards: {
      points: 2000,
    },
    tier: 'platinum',
    isActive: true,
    order: 3,
  },

  // Goal Progress Achievements
  {
    id: 'goal_bronze',
    name: 'Getting Started',
    description: 'Reach 25% progress on any goal',
    icon: '🥉',
    category: 'goal_progress',
    type: 'goal',
    requirements: {
      type: 'goal_completion_percentage',
      value: 25,
    },
    rewards: {
      points: 50,
    },
    tier: 'bronze',
    isActive: true,
    isRepeatable: true,
    maxCompletions: 10,
    order: 1,
  },
  {
    id: 'goal_silver',
    name: 'Halfway Hero',
    description: 'Reach 50% progress on any goal',
    icon: '🥈',
    category: 'goal_progress',
    type: 'goal',
    requirements: {
      type: 'goal_completion_percentage',
      value: 50,
    },
    rewards: {
      points: 100,
    },
    tier: 'silver',
    isActive: true,
    isRepeatable: true,
    maxCompletions: 10,
    order: 2,
  },
  {
    id: 'goal_gold',
    name: 'Almost There',
    description: 'Reach 75% progress on any goal',
    icon: '🥇',
    category: 'goal_progress',
    type: 'goal',
    requirements: {
      type: 'goal_completion_percentage',
      value: 75,
    },
    rewards: {
      points: 200,
    },
    tier: 'gold',
    isActive: true,
    isRepeatable: true,
    maxCompletions: 10,
    order: 3,
  },
  {
    id: 'goal_platinum',
    name: 'Goal Crusher',
    description: 'Complete a goal (100% progress)',
    icon: '💎',
    category: 'goal_progress',
    type: 'goal',
    requirements: {
      type: 'goal_completion_percentage',
      value: 100,
    },
    rewards: {
      points: 500,
    },
    tier: 'platinum',
    isActive: true,
    isRepeatable: true,
    maxCompletions: 50,
    order: 4,
  },

  // Community Engagement Achievements
  {
    id: 'helper_reactions',
    name: 'Supportive Soul',
    description: 'Give 50 positive reactions to others',
    icon: '❤️',
    category: 'community_engagement',
    type: 'community',
    requirements: {
      type: 'reactions_given',
      value: 50,
    },
    rewards: {
      points: 150,
    },
    tier: 'bronze',
    isActive: true,
    order: 1,
  },
  {
    id: 'helper_reactions_pro',
    name: 'Encouragement Expert',
    description: 'Give 200 positive reactions to others',
    icon: '💖',
    category: 'community_engagement',
    type: 'community',
    requirements: {
      type: 'reactions_given',
      value: 200,
    },
    rewards: {
      points: 300,
    },
    tier: 'silver',
    isActive: true,
    order: 2,
  },
  {
    id: 'popular_posts',
    name: 'Crowd Favorite',
    description: 'Receive 100 positive reactions on your posts',
    icon: '⭐',
    category: 'community_engagement',
    type: 'community',
    requirements: {
      type: 'reactions_received',
      value: 100,
    },
    rewards: {
      points: 250,
    },
    tier: 'gold',
    isActive: true,
    order: 3,
  },

  // Special Achievements
  {
    id: 'first_post',
    name: 'First Steps',
    description: 'Create your first post',
    icon: '🌱',
    category: 'special',
    type: 'special',
    requirements: {
      type: 'posts_count',
      value: 1,
    },
    rewards: {
      points: 25,
    },
    tier: 'bronze',
    isActive: true,
    order: 1,
  },
  {
    id: 'prolific_poster',
    name: 'Content Creator',
    description: 'Create 100 posts',
    icon: '📝',
    category: 'special',
    type: 'special',
    requirements: {
      type: 'posts_count',
      value: 100,
    },
    rewards: {
      points: 300,
    },
    tier: 'silver',
    isActive: true,
    order: 2,
  },
  {
    id: 'super_poster',
    name: 'Post Master',
    description: 'Create 500 posts',
    icon: '📚',
    category: 'special',
    type: 'special',
    requirements: {
      type: 'posts_count',
      value: 500,
    },
    rewards: {
      points: 1000,
    },
    tier: 'gold',
    isActive: true,
    order: 3,
  },
];
