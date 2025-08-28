// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Simulate auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simulate API call to check auth status
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // For demo, create a mock user with enhanced achievements system
        const mockUser = {
          id: 'user1',
          username: 'alex_dev',
          email: 'alex@example.com',
          profilePic: null,
          points: 1250,
          subscriptionStatus: 'free',
          joinedCommunities: ['1', '2'],
          dailyAds: {}, // Track daily ad views
          currentStreak: 12,
          longestStreak: 28,
          totalPosts: 45,
          goals: [
            { 
              id: '1', 
              description: 'Build a mobile app', 
              category: 'coding',
              timeframe: '90days',
              targetDate: '2024-06-30', 
              currentProgress: 75,
              createdAt: '2024-03-01T00:00:00Z'
            },
            { 
              id: '2', 
              description: 'Learn React Native', 
              category: 'learning',
              timeframe: '30days',
              targetDate: '2024-04-01', 
              currentProgress: 95,
              createdAt: '2024-03-01T00:00:00Z'
            },
          ],
          achievements: {
            streaks: [
              { id: 'streak_7', name: '7 Day Streak', description: 'Posted for 7 consecutive days', earned: true, earnedDate: '2024-03-15T00:00:00Z', icon: 'flame' },
              { id: 'streak_30', name: '30 Day Streak', description: 'Posted for 30 consecutive days', earned: false, progress: 12, target: 30, icon: 'flame' },
              { id: 'streak_100', name: '100 Day Streak', description: 'Posted for 100 consecutive days', earned: false, progress: 12, target: 100, icon: 'flame' }
            ],
            goals: [
              { id: 'goal_bronze', name: 'Getting Started', description: 'Reach 25% progress on any goal', earned: true, earnedDate: '2024-03-10T00:00:00Z', icon: 'medal', tier: 'bronze' },
              { id: 'goal_silver', name: 'Half Way There', description: 'Reach 50% progress on any goal', earned: true, earnedDate: '2024-03-20T00:00:00Z', icon: 'medal', tier: 'silver' },
              { id: 'goal_gold', name: 'Almost Done', description: 'Reach 75% progress on any goal', earned: true, earnedDate: '2024-03-25T00:00:00Z', icon: 'medal', tier: 'gold' },
              { id: 'goal_platinum', name: 'Goal Master', description: 'Complete any goal 100%', earned: false, progress: 95, target: 100, icon: 'trophy', tier: 'platinum' }
            ],
            community: [
              { id: 'first_post', name: 'First Steps', description: 'Made your first post', earned: true, earnedDate: '2024-03-01T00:00:00Z', icon: 'create' },
              { id: 'helper', name: 'Community Helper', description: 'Gave 25 positive reactions', earned: true, earnedDate: '2024-03-18T00:00:00Z', icon: 'heart', progress: 47, target: 25 },
              { id: 'mentor', name: 'Mentor', description: 'Helped others achieve their goals', earned: false, progress: 3, target: 10, icon: 'people' },
              { id: 'encourager', name: 'The Encourager', description: 'Left 50 supportive comments', earned: false, progress: 23, target: 50, icon: 'chatbubble-ellipses' }
            ],
            special: [
              { id: 'goal_setter', name: 'Goal Setter', description: 'Set your first goals', earned: true, earnedDate: '2024-03-01T00:00:00Z', icon: 'target' },
              { id: 'consistency_master', name: 'Consistency Master', description: 'Never missed more than 2 days in a month', earned: false, progress: 0.8, target: 1, icon: 'checkmark-circle' },
              { id: 'community_champion', name: 'Community Champion', description: 'Active in multiple communities', earned: true, earnedDate: '2024-03-15T00:00:00Z', icon: 'star' }
            ]
          },
          giftedBadges: [
            { id: 'gb1', from: 'sarah_fit', badge: 'Motivator', message: 'Thanks for the encouragement!', receivedDate: '2024-03-20T00:00:00Z' },
            { id: 'gb2', from: 'mike_save', badge: 'Code Helper', message: 'Your React tips were amazing!', receivedDate: '2024-03-22T00:00:00Z' }
          ]
        };
        
        // Mock posts with comments
        const mockPosts = [
          { 
            id: '1', 
            userId: 'user1', 
            username: 'alex_dev', 
            communityId: '2', 
            content: 'Finished the login authentication system today! Used JWT tokens and bcrypt for security. Really proud of how clean the code turned out.', 
            picture: null, 
            positiveMarkers: 12, 
            negativeMarkers: 2, 
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            comments: [
              {
                id: 'c1',
                userId: 'user2',
                username: 'sarah_fit',
                content: 'Nice work! Security is so important.',
                createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
                likes: 3
              },
              {
                id: 'c2',
                userId: 'user3',
                username: 'mike_save',
                content: 'JWT is a great choice! 🔐',
                createdAt: new Date(Date.now() - 30 * 60 * 1000),
                likes: 1
              }
            ]
          },
          { 
            id: '2', 
            userId: 'user2', 
            username: 'sarah_fit', 
            communityId: '1', 
            content: 'Completed a 10km run this morning! New personal best: 52 minutes. The sunrise was absolutely beautiful.', 
            picture: null, 
            positiveMarkers: 15, 
            negativeMarkers: 0, 
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            comments: [
              {
                id: 'c3',
                userId: 'user1',
                username: 'alex_dev',
                content: 'Amazing! Inspiring me to get back to running.',
                createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
                likes: 2
              }
            ]
          },
          { 
            id: '3', 
            userId: 'user3', 
            username: 'mike_save', 
            communityId: '3', 
            content: 'Saved $75 today by meal prepping instead of ordering takeout. Week 3 of my savings challenge!', 
            picture: null, 
            positiveMarkers: 8, 
            negativeMarkers: 0, 
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            comments: []
          },
        ];
        
        setUser(mockUser);
        setPosts(mockPosts);
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const login = async (email, password) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = {
        id: 'user1',
        username: email.split('@')[0],
        email,
        profilePic: null,
        points: 0,
        subscriptionStatus: 'free',
        joinedCommunities: [],
        currentStreak: 0,
        longestStreak: 0,
        totalPosts: 0,
        goals: [],
        achievements: {
          streaks: [
            { id: 'streak_7', name: '7 Day Streak', description: 'Post for 7 consecutive days', earned: false, progress: 0, target: 7, icon: 'flame' },
            { id: 'streak_30', name: '30 Day Streak', description: 'Post for 30 consecutive days', earned: false, progress: 0, target: 30, icon: 'flame' },
            { id: 'streak_100', name: '100 Day Streak', description: 'Post for 100 consecutive days', earned: false, progress: 0, target: 100, icon: 'flame' }
          ],
          goals: [
            { id: 'goal_bronze', name: 'Getting Started', description: 'Reach 25% progress on any goal', earned: false, progress: 0, target: 25, icon: 'medal', tier: 'bronze' },
            { id: 'goal_silver', name: 'Half Way There', description: 'Reach 50% progress on any goal', earned: false, progress: 0, target: 50, icon: 'medal', tier: 'silver' },
            { id: 'goal_gold', name: 'Almost Done', description: 'Reach 75% progress on any goal', earned: false, progress: 0, target: 75, icon: 'medal', tier: 'gold' },
            { id: 'goal_platinum', name: 'Goal Master', description: 'Complete any goal 100%', earned: false, progress: 0, target: 100, icon: 'trophy', tier: 'platinum' }
          ],
          community: [
            { id: 'first_post', name: 'First Steps', description: 'Make your first post', earned: false, progress: 0, target: 1, icon: 'create' },
            { id: 'helper', name: 'Community Helper', description: 'Give 25 positive reactions', earned: false, progress: 0, target: 25, icon: 'heart' },
            { id: 'mentor', name: 'Mentor', description: 'Help others achieve their goals', earned: false, progress: 0, target: 10, icon: 'people' },
            { id: 'encourager', name: 'The Encourager', description: 'Leave 50 supportive comments', earned: false, progress: 0, target: 50, icon: 'chatbubble-ellipses' }
          ],
          special: [
            { id: 'goal_setter', name: 'Goal Setter', description: 'Set your first goals', earned: false, progress: 0, target: 1, icon: 'target' },
            { id: 'consistency_master', name: 'Consistency Master', description: 'Never miss more than 2 days in a month', earned: false, progress: 0, target: 1, icon: 'checkmark-circle' },
            { id: 'community_champion', name: 'Community Champion', description: 'Be active in multiple communities', earned: false, progress: 0, target: 2, icon: 'star' }
          ]
        },
        giftedBadges: []
      };
      
      setUser(mockUser);
      return true;
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid email or password');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Post and comment functions
  const addPost = (postData) => {
    const newPost = {
      id: Date.now().toString(),
      userId: user?.id || 'current_user',
      username: user?.username || 'current_user',
      ...postData,
      positiveMarkers: 0,
      negativeMarkers: 0,
      comments: [],
      createdAt: new Date()
    };
    setPosts(prev => [newPost, ...prev]);
    
    // Update user stats and check achievements
    if (user) {
      setUser(prev => {
        const updatedUser = {
          ...prev,
          totalPosts: prev.totalPosts + 1,
          points: prev.points + 10 // Base points for posting
        };
        
        // Check for first post achievement
        if (updatedUser.totalPosts === 1) {
          setTimeout(() => awardAchievement('first_post'), 100);
        }
        
        return updatedUser;
      });
    }
    
    return newPost;
  };

  const updatePostMarkers = (postId, type) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const markerType = type === 'positive' ? 'positiveMarkers' : 'negativeMarkers';
        return {
          ...post,
          [markerType]: post[markerType] + 1
        };
      }
      return post;
    }));
    
    // Award points and update achievements for giving positive reactions
    if (type === 'positive' && user) {
      setUser(prev => ({
        ...prev,
        points: prev.points + 5
      }));
      
      // Update helper achievement progress
      setTimeout(() => {
        const helperAchievement = user.achievements.community.find(a => a.id === 'helper');
        if (helperAchievement && !helperAchievement.earned) {
          updateAchievementProgress('helper', (helperAchievement.progress || 0) + 1);
        }
      }, 100);
    }
  };

  const addComment = (postId, content) => {
    const newComment = {
      id: `c${Date.now()}`,
      userId: user?.id || 'current_user',
      username: user?.username || 'current_user',
      content,
      createdAt: new Date(),
      likes: 0
    };

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    }));
    
    // Award points and update achievements for commenting
    if (user) {
      setUser(prev => ({
        ...prev,
        points: prev.points + 5
      }));
      
      // Update encourager achievement progress
      setTimeout(() => {
        const encouragerAchievement = user.achievements.community.find(a => a.id === 'encourager');
        if (encouragerAchievement && !encouragerAchievement.earned) {
          updateAchievementProgress('encourager', (encouragerAchievement.progress || 0) + 1);
        }
      }, 100);
    }

    return newComment;
  };

  const likeComment = (postId, commentId) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.map(comment => {
            if (comment.id === commentId) {
              return { ...comment, likes: comment.likes + 1 };
            }
            return comment;
          })
        };
      }
      return post;
    }));
  };

  const awardAchievement = (achievementId) => {
    setUser(prev => {
      const achievements = { ...prev.achievements };
      let found = false;
      let achievementName = '';
      
      // Check all achievement categories
      Object.keys(achievements).forEach(category => {
        achievements[category] = achievements[category].map(achievement => {
          if (achievement.id === achievementId && !achievement.earned) {
            found = true;
            achievementName = achievement.name;
            return {
              ...achievement,
              earned: true,
              earnedDate: new Date().toISOString()
            };
          }
          return achievement;
        });
      });
      
      if (found) {
        // Show celebration notification
        setTimeout(() => {
          Alert.alert('🎉 Achievement Unlocked!', achievementName);
        }, 500);
        
        return {
          ...prev,
          achievements,
          points: prev.points + getPointsForAchievement(achievementId)
        };
      }
      
      return prev;
    });
  };
  
  const value = {
    user,
    posts,
    loading,
    login,
    logout,
    updateProfile: (updates) => setUser(prev => ({ ...prev, ...updates })),
    updateGoalProgress: (goalId, progress) => {
      setUser(prev => {
        const updatedUser = {
          ...prev,
          goals: prev.goals.map(goal => {
            if (goal.id === goalId) {
              const newProgress = Math.min(progress, 100);
              
              // Check for goal completion achievements
              if (newProgress >= 25 && prev.achievements.goals.find(a => a.id === 'goal_bronze' && !a.earned)) {
                setTimeout(() => awardAchievement('goal_bronze'), 100);
              }
              if (newProgress >= 50 && prev.achievements.goals.find(a => a.id === 'goal_silver' && !a.earned)) {
                setTimeout(() => awardAchievement('goal_silver'), 100);
              }
              if (newProgress >= 75 && prev.achievements.goals.find(a => a.id === 'goal_gold' && !a.earned)) {
                setTimeout(() => awardAchievement('goal_gold'), 100);
              }
              if (newProgress >= 100 && prev.achievements.goals.find(a => a.id === 'goal_platinum' && !a.earned)) {
                setTimeout(() => awardAchievement('goal_platinum'), 100);
              }
              
              return { ...goal, currentProgress: newProgress };
            }
            return goal;
          })
        };
        
        return updatedUser;
      });
    },
    // Post and comment functions
    addPost,
    updatePostMarkers,
    addComment,
    likeComment,
    // Onboarding functions
    completeOnboarding: (onboardingData) => {
      setUser(prev => ({
        ...prev,
        username: onboardingData.username,
        goals: onboardingData.goals,
        joinedCommunities: onboardingData.selectedCommunities,
        preferences: onboardingData.preferences,
        onboardingComplete: true
      }));
      
      // Award initial achievements
      if (onboardingData.goals.length > 0) {
        awardAchievement('goal_setter');
      }
      if (onboardingData.selectedCommunities.length >= 2) {
        awardAchievement('community_champion');
      }
    },
    
    // Achievement functions
    awardAchievement: (achievementId) => {
      setUser(prev => {
        const achievements = { ...prev.achievements };
        let found = false;
        
        // Check all achievement categories
        Object.keys(achievements).forEach(category => {
          achievements[category] = achievements[category].map(achievement => {
            if (achievement.id === achievementId && !achievement.earned) {
              found = true;
              return {
                ...achievement,
                earned: true,
                earnedDate: new Date().toISOString()
              };
            }
            return achievement;
          });
        });
        
        if (found) {
          // Show celebration notification
          Alert.alert('Achievement Unlocked!', `You earned: ${achievementId}`);
          
          return {
            ...prev,
            achievements,
            points: prev.points + getPointsForAchievement(achievementId)
          };
        }
        
        return prev;
      });
    },
    
    updateStreak: (newStreak) => {
      setUser(prev => {
        const updatedUser = {
          ...prev,
          currentStreak: newStreak,
          longestStreak: Math.max(prev.longestStreak, newStreak)
        };
        
        // Check for streak achievements
        if (newStreak >= 7 && !prev.achievements.streaks.find(s => s.id === 'streak_7')?.earned) {
          setTimeout(() => awardAchievement('streak_7'), 100);
        }
        if (newStreak >= 30 && !prev.achievements.streaks.find(s => s.id === 'streak_30')?.earned) {
          setTimeout(() => awardAchievement('streak_30'), 100);
        }
        if (newStreak >= 100 && !prev.achievements.streaks.find(s => s.id === 'streak_100')?.earned) {
          setTimeout(() => awardAchievement('streak_100'), 100);
        }
        
        return updatedUser;
      });
    },
    
    giftBadge: (toUserId, badgeName, message) => {
      // In a real app, this would send to the recipient
      Alert.alert('Badge Gifted!', `You sent "${badgeName}" badge with message: "${message}"`);
      
      setUser(prev => ({
        ...prev,
        points: prev.points + 10 // Award points for gifting
      }));
    },
    
    updateAchievementProgress: (achievementId, progress) => {
      setUser(prev => {
        const achievements = { ...prev.achievements };
        
        Object.keys(achievements).forEach(category => {
          achievements[category] = achievements[category].map(achievement => {
            if (achievement.id === achievementId) {
              const newProgress = Math.min(progress, achievement.target);
              const shouldAward = newProgress >= achievement.target && !achievement.earned;
              
              if (shouldAward) {
                setTimeout(() => awardAchievement(achievementId), 100);
              }
              
              return {
                ...achievement,
                progress: newProgress
              };
            }
            return achievement;
          });
        });
        
        return { ...prev, achievements };
      });
    },

    // Points and ads management
    updateUserPoints: async (pointsToAdd) => {
      const today = new Date().toDateString();
      
      setUser(prev => {
        // Update daily ad count
        const dailyAds = { ...prev.dailyAds };
        if (pointsToAdd > 0 && pointsToAdd === 100) { // Assumes 100 points = rewarded ad
          dailyAds[today] = (dailyAds[today] || 0) + 1;
        }

        return {
          ...prev,
          points: prev.points + pointsToAdd,
          dailyAds
        };
      });
      
      return { success: true };
    },

    spendPoints: (pointsToSpend, reason = 'purchase') => {
      setUser(prev => {
        if (prev.points < pointsToSpend) {
          return prev; // Not enough points
        }
        
        return {
          ...prev,
          points: prev.points - pointsToSpend
        };
      });
      
      return { success: true };
    },

    giftBadge: (recipientUserId, badgeType, message = '', pointsCost = 50) => {
      if (user.points < pointsCost) {
        return { success: false, error: 'Not enough points' };
      }

      // Spend points
      setUser(prev => ({
        ...prev,
        points: prev.points - pointsCost
      }));

      // In a real app, this would make an API call
      Alert.alert(
        '🎁 Badge Gifted!',
        `You've gifted a ${badgeType} badge! The recipient will be notified.`,
        [{ text: 'Great!' }]
      );

      return { success: true };
    }
  };
  
  // Helper function to get points for achievements
  const getPointsForAchievement = (achievementId) => {
    const pointMap = {
      // Streak achievements
      'streak_7': 100,
      'streak_30': 500,
      'streak_100': 2000,
      // Goal achievements
      'goal_bronze': 50,
      'goal_silver': 100,
      'goal_gold': 200,
      'goal_platinum': 500,
      // Community achievements
      'first_post': 25,
      'helper': 150,
      'mentor': 300,
      'encourager': 200,
      // Special achievements
      'goal_setter': 50,
      'consistency_master': 400,
      'community_champion': 250
    };
    
    return pointMap[achievementId] || 25;
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};