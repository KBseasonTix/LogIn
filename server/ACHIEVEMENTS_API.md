# Achievements System API Documentation

## Overview

The LogIn productivity app achievement system provides comprehensive gamification features including:

- **Achievement Tracking**: Automated achievement detection and awarding
- **Streak System**: Daily posting streaks with timezone support
- **Badge Gifting**: Users can gift badges to each other with personal messages
- **Leaderboards**: Community rankings by points, achievements, streaks, and posts
- **Notifications**: Real-time notifications for achievements and badge gifts
- **Analytics**: Detailed engagement and retention metrics

## Architecture

### Database Models

1. **Achievement**: Achievement definitions and requirements
2. **UserAchievement**: User progress toward achievements
3. **StreakTracker**: Daily posting streaks with history
4. **BadgeGift**: Badge gifting transactions between users
5. **Notification**: System notifications
6. **Enhanced User**: Extended user model with achievement fields
7. **Enhanced Transaction**: Transaction model for points and gifting

### Services

1. **AchievementEngine**: Core logic for achievement detection and awarding
2. **StreakService**: Streak calculation and management
3. **NotificationService**: Notification creation and delivery
4. **CacheService**: In-memory caching for performance
5. **BackgroundJobs**: Automated maintenance and calculations

## API Endpoints

### Achievements

#### GET /api/achievements
Get all available achievements

**Query Parameters:**
- `category` (optional): Filter by category (daily_streak, goal_progress, community_engagement, special)

**Response:**
```json
[
  {
    "id": "streak_7_days",
    "name": "Weekly Warrior",
    "description": "Maintain a 7-day posting streak",
    "icon": "🔥",
    "category": "daily_streak",
    "requirements": {
      "type": "streak_days",
      "value": 7
    },
    "rewards": {
      "points": 100
    },
    "tier": "bronze"
  }
]
```

#### GET /api/achievements/user/:userId
Get user's achievement progress

**Query Parameters:**
- `category` (optional): Filter by category
- `completed` (optional): Filter by completion status

**Response:**
```json
[
  {
    "id": "user_achievement_id",
    "achievement": { /* Achievement object */ },
    "progress": {
      "current": 5,
      "target": 7,
      "percentage": 71
    },
    "isCompleted": false,
    "completedAt": null,
    "completionCount": 0
  }
]
```

#### GET /api/achievements/user/:userId/stats
Get user achievement statistics

**Response:**
```json
{
  "totalAchievements": 15,
  "completedCount": 8,
  "inProgressCount": 5,
  "completionRate": 53,
  "categoryStats": [
    {
      "category": "daily_streak",
      "total": 3,
      "completed": 2,
      "completionRate": 67
    }
  ],
  "totalPoints": 1250,
  "currentStreak": 12,
  "longestStreak": 35
}
```

#### GET /api/achievements/leaderboard/:type
Get leaderboards

**Parameters:**
- `type`: points, achievements, streak, posts

**Query Parameters:**
- `limit` (optional): Number of results (default: 50)

**Response:**
```json
{
  "type": "points",
  "leaderboard": [
    {
      "rank": 1,
      "username": "achiever123",
      "profilePic": "profile.jpg",
      "value": 2500,
      "totalAchievements": 15,
      "currentStreak": 30
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Streaks

#### GET /api/streaks/user/:userId
Get user's streak information

**Response:**
```json
{
  "currentStreak": 12,
  "longestStreak": 35,
  "streakStartDate": "2024-01-03T00:00:00Z",
  "totalDaysTracked": 45,
  "achievements": {
    "streak7": true,
    "streak30": true,
    "streak100": false
  },
  "percentile": 85,
  "user": {
    "id": "user_id",
    "username": "streaker",
    "profilePic": "profile.jpg"
  }
}
```

#### POST /api/streaks/user/:userId/update
Update user's streak (called when user posts)

**Request Body:**
```json
{
  "timezone": "America/New_York"
}
```

**Response:**
```json
{
  "currentStreak": 13,
  "longestStreak": 35,
  "streakStartDate": "2024-01-03T00:00:00Z",
  "milestoneReached": false
}
```

#### GET /api/streaks/leaderboard
Get streak leaderboard

**Query Parameters:**
- `limit` (optional): Number of results (default: 50)

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user": {
        "username": "streak_master",
        "profilePic": "profile.jpg"
      },
      "currentStreak": 156,
      "longestStreak": 200,
      "streakStartDate": "2023-08-15T00:00:00Z"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Badge Gifting

#### POST /api/badge-gifts/send
Send a badge gift to another user

**Request Body:**
```json
{
  "fromUserId": "sender_id",
  "toUserId": "recipient_id",
  "badgeId": "badge_id",
  "message": "Great job on your streak!",
  "pointsCost": 50,
  "occasion": "congratulations",
  "isAnonymous": false
}
```

**Response:**
```json
{
  "message": "Badge gift sent successfully",
  "badgeGift": {
    "id": "gift_id",
    "badge": { /* Badge object */ },
    "message": "Great job on your streak!",
    "pointsCost": 50,
    "sentAt": "2024-01-15T10:30:00Z",
    "occasion": "congratulations"
  },
  "senderPoints": 450
}
```

#### GET /api/badge-gifts/received/:userId
Get badge gifts received by user

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Response:**
```json
{
  "gifts": [
    {
      "id": "gift_id",
      "from": {
        "username": "sender",
        "profilePic": "profile.jpg"
      },
      "badge": {
        "name": "Helper Badge",
        "icon": "🤝",
        "description": "For being helpful"
      },
      "message": "Thanks for your support!",
      "pointsCost": 45,
      "occasion": "thank_you",
      "sentAt": "2024-01-15T09:15:00Z",
      "isAnonymous": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

#### GET /api/badge-gifts/available/:userId
Get badges available for gifting

**Response:**
```json
{
  "giftableBadges": [
    {
      "badgeId": "badge_id",
      "name": "Helper Badge",
      "icon": "🤝",
      "description": "For being helpful to others",
      "ownedCount": 3,
      "suggestedPointCost": 40
    }
  ],
  "userPoints": 500
}
```

### Notifications

#### GET /api/notifications/user/:userId
Get user notifications

**Query Parameters:**
- `limit` (optional): Number of results (default: 20)
- `onlyUnread` (optional): Show only unread notifications

**Response:**
```json
{
  "notifications": [
    {
      "id": "notification_id",
      "type": "achievement_unlocked",
      "title": "Achievement Unlocked!",
      "message": "Congratulations! You've unlocked \"Weekly Warrior\"",
      "data": {
        "achievementId": "achievement_id",
        "points": 100
      },
      "isRead": false,
      "priority": "high",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "unreadCount": 3
}
```

#### PATCH /api/notifications/:notificationId/read
Mark notification as read

**Request Body:**
```json
{
  "userId": "user_id"
}
```

### Analytics

#### GET /api/analytics/achievements/engagement
Get achievement engagement analytics

**Query Parameters:**
- `period` (optional): day, week, month, year

**Response:**
```json
{
  "period": "week",
  "totalAchievements": 15,
  "completedInPeriod": 45,
  "completionRate": 75,
  "popularAchievements": [
    {
      "achievement": { /* Achievement object */ },
      "completionCount": 25,
      "uniqueUserCount": 20
    }
  ],
  "categoryPerformance": [
    {
      "_id": "daily_streak",
      "completions": 30,
      "averageProgress": 65
    }
  ],
  "userEngagement": {
    "highlyEngaged": 15,
    "moderatelyEngaged": 25,
    "lowEngaged": 60
  }
}
```

#### GET /api/analytics/dashboard
Get comprehensive dashboard analytics

**Query Parameters:**
- `period` (optional): day, week, month

**Response:**
```json
{
  "period": "week",
  "keyMetrics": {
    "totalUsers": 500,
    "activeUsers": 325,
    "totalAchievements": 15,
    "achievementsUnlocked": 89,
    "totalBadgeGifts": 23,
    "activeStreaks": 156,
    "totalPosts": 1250
  },
  "engagementMetrics": {
    "userRetention": 65,
    "achievementEngagement": 78,
    "communityEngagement": 45,
    "streakParticipation": 31
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Point System

- **10 points** per post
- **5 points** per positive reaction received
- **5 points** per positive reaction given  
- **25-2000 bonus points** for achievements (varies by tier)
- **30-70 points cost** for badge gifting

## Achievement Categories

1. **Daily Streaks**: 7, 30, 100 day posting streaks
2. **Goal Progress**: Bronze (25%), Silver (50%), Gold (75%), Platinum (100%)
3. **Community Engagement**: Helper badges for reactions/comments
4. **Special**: First post, milestone posts, unique achievements

## Background Jobs

The system runs several automated background jobs:

- **Daily Streak Reset** (midnight UTC): Reset broken streaks
- **Achievement Recalculation** (every 6 hours): Update user progress
- **User Statistics Update** (hourly): Update cached statistics
- **Notification Cleanup** (daily at 2 AM): Remove old notifications
- **Cache Prewarming** (every 15 minutes, 8 AM - 10 PM): Refresh leaderboards
- **Leaderboard Ranks** (every 30 minutes): Update user rankings
- **Milestone Check** (every 4 hours): Check for missed achievements

## Caching Strategy

The system implements intelligent caching:

- **Leaderboards**: 15-minute TTL during peak hours
- **User Achievements**: 5-minute TTL
- **Streak Data**: 5-minute TTL
- **Achievement Stats**: 10-minute TTL
- **Badge Gifts**: 5-minute TTL

## Error Handling

All endpoints include comprehensive error handling with appropriate HTTP status codes:

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **404**: Resource Not Found
- **500**: Internal Server Error

## Security Considerations

- User authentication required for all personal data endpoints
- Badge gifting includes validation to prevent abuse
- Point costs for gifting prevent spam
- Rate limiting should be implemented in production
- Admin endpoints should require admin authentication

## Performance Optimizations

- Database indexes on frequently queried fields
- Efficient aggregation pipelines for analytics
- Caching layer for expensive operations
- Background job processing for heavy calculations
- Batch operations where possible

## Scalability Considerations

- Horizontal scaling through proper database design
- Caching layer can be replaced with Redis for production
- Background jobs can be moved to queue system (Bull, Agenda)
- API pagination for all list endpoints
- Database sharding strategies for large user bases