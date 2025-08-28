// server/services/CacheService.js
// Simple in-memory caching service for frequently accessed data
// In production, you would use Redis or another caching solution

class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttlMap = new Map();
    
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set(key, value, ttlSeconds = 300) { // Default 5 minutes TTL
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, value);
    this.ttlMap.set(key, expiresAt);
  }

  get(key) {
    const expiresAt = this.ttlMap.get(key);
    
    if (expiresAt && Date.now() > expiresAt) {
      // Cache expired
      this.cache.delete(key);
      this.ttlMap.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.ttlMap.delete(key);
  }

  clear() {
    this.cache.clear();
    this.ttlMap.clear();
  }

  cleanup() {
    const now = Date.now();
    
    for (const [key, expiresAt] of this.ttlMap.entries()) {
      if (now > expiresAt) {
        this.cache.delete(key);
        this.ttlMap.delete(key);
      }
    }
  }

  // Specific caching methods for achievements system
  cacheLeaderboard(type, data, ttlSeconds = 300) {
    const key = `leaderboard:${type}`;
    this.set(key, data, ttlSeconds);
  }

  getLeaderboard(type) {
    const key = `leaderboard:${type}`;
    return this.get(key);
  }

  invalidateLeaderboards() {
    const keys = Array.from(this.cache.keys()).filter(key => key.startsWith('leaderboard:'));
    keys.forEach(key => this.delete(key));
  }

  cacheUserAchievements(userId, data, ttlSeconds = 300) {
    const key = `user_achievements:${userId}`;
    this.set(key, data, ttlSeconds);
  }

  getUserAchievements(userId) {
    const key = `user_achievements:${userId}`;
    return this.get(key);
  }

  invalidateUserAchievements(userId) {
    const key = `user_achievements:${userId}`;
    this.delete(key);
  }

  cacheUserStreak(userId, data, ttlSeconds = 300) {
    const key = `user_streak:${userId}`;
    this.set(key, data, ttlSeconds);
  }

  getUserStreak(userId) {
    const key = `user_streak:${userId}`;
    return this.get(key);
  }

  invalidateUserStreak(userId) {
    const key = `user_streak:${userId}`;
    this.delete(key);
  }

  cacheAchievementStats(data, ttlSeconds = 600) { // Cache for 10 minutes
    const key = 'achievement_stats';
    this.set(key, data, ttlSeconds);
  }

  getAchievementStats() {
    const key = 'achievement_stats';
    return this.get(key);
  }

  invalidateAchievementStats() {
    const key = 'achievement_stats';
    this.delete(key);
  }

  // Badge gifting cache
  cacheBadgeGifts(userId, type, data, ttlSeconds = 300) {
    const key = `badge_gifts:${userId}:${type}`; // type: 'sent' or 'received'
    this.set(key, data, ttlSeconds);
  }

  getBadgeGifts(userId, type) {
    const key = `badge_gifts:${userId}:${type}`;
    return this.get(key);
  }

  invalidateBadgeGifts(userId) {
    const keys = Array.from(this.cache.keys()).filter(
      key => key.startsWith(`badge_gifts:${userId}:`)
    );
    keys.forEach(key => this.delete(key));
  }

  // Cache statistics
  getStats() {
    return {
      cacheSize: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memory: this.getMemoryUsage()
    };
  }

  getMemoryUsage() {
    let totalSize = 0;
    
    for (const [key, value] of this.cache.entries()) {
      totalSize += JSON.stringify(key).length;
      totalSize += JSON.stringify(value).length;
    }
    
    return {
      bytes: totalSize,
      kb: Math.round(totalSize / 1024),
      mb: Math.round(totalSize / (1024 * 1024))
    };
  }
}

module.exports = new CacheService();