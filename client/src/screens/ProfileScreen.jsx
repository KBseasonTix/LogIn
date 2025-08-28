// screens/ProfileScreen.js - Enhanced profile with achievements, streaks, and badge gifting
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Card, Button, Avatar } from '../components';
import BadgeGiftingModal from '../components/BadgeGiftingModal';
import RewardedAdButton from '../components/RewardedAdButton';
import SubscriptionModal from '../components/SubscriptionModal';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/designSystem';

const ProfileScreen = ({ navigation }) => {
  const { user, updateGoalProgress, updateStreak } = useAuth();
  const { subscriptionTier, SUBSCRIPTION_TIERS } = useSubscription();
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showBadgeGifting, setShowBadgeGifting] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
  
  // Calculate overall progress (average of all goals)
  const overallProgress = user.goals.length > 0 
    ? Math.round(user.goals.reduce((sum, goal) => sum + goal.currentProgress, 0) / user.goals.length)
    : 0;
  
  // Calculate daily post count (simulated)
  const dailyPostCount = 3; // Simulated value
  const dailyGoal = 5;
  
  const CircularProgress = ({ progress, size = 120, strokeWidth = 8 }) => {
    const radius = (size / 2) - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    
    return (
      <View style={styles.circularProgressContainer}>
        <Svg width={size} height={size} style={styles.circularProgressSvg}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={Colors.neutral[200]}
            strokeWidth={strokeWidth}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={Colors.primary[500]}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            rotation="-90"
            originX={size / 2}
            originY={size / 2}
            strokeLinecap="round"
          />
        </Svg>
        <View style={styles.circularProgressContent}>
          <Avatar size="xl" name={user.username} />
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>{progress}%</Text>
          </View>
        </View>
      </View>
    );
  };
  
  const GoalCard = ({ goal }) => (
    <Card style={styles.goalCard} shadow="sm">
      <View style={styles.goalHeader}>
        <View style={styles.goalTitleContainer}>
          <Text style={styles.goalTitle}>{goal.description}</Text>
          <Text style={styles.goalProgress}>{goal.currentProgress}% complete</Text>
        </View>
        <TouchableOpacity 
          style={styles.goalEditButton}
          onPress={() => setSelectedGoal(goal)}
        >
          <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${goal.currentProgress}%` }
            ]} 
          />
        </View>
      </View>
      
      <View style={styles.goalStats}>
        <View style={styles.goalStatItem}>
          <Ionicons name="calendar-outline" size={16} color={Colors.primary[500]} />
          <Text style={styles.goalStatText}>
            Due {new Date(goal.targetDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <View style={styles.goalStatItem}>
          <Ionicons name="trending-up-outline" size={16} color={Colors.success[500]} />
          <Text style={styles.goalStatText}>
            {Math.round(goal.currentProgress * 0.7)} days streak
          </Text>
        </View>
      </View>
    </Card>
  );
  
  const getTotalEarnedAchievements = () => {
    if (!user.achievements) return 0;
    return Object.values(user.achievements).flat().filter(a => a.earned).length;
  };
  
  const getRecentAchievements = () => {
    if (!user.achievements) return [];
    const allAchievements = Object.values(user.achievements).flat();
    return allAchievements
      .filter(a => a.earned)
      .sort((a, b) => new Date(b.earnedDate) - new Date(a.earnedDate))
      .slice(0, 5);
  };
  
  const AchievementBadge = ({ achievement }) => {
    const getCategoryColor = (achievementId) => {
      if (achievementId.includes('streak')) return Colors.accent[500];
      if (achievementId.includes('goal')) return Colors.primary[500];
      if (achievementId.includes('community') || achievementId.includes('helper') || achievementId.includes('first_post')) return Colors.success[500];
      return Colors.secondary[500];
    };
    
    const getTierColor = (tier) => {
      const tierColors = {
        bronze: Colors.secondary[600],
        silver: Colors.neutral[400],
        gold: Colors.accent[500],
        platinum: Colors.primary[500]
      };
      return tierColors[tier] || getCategoryColor(achievement.id);
    };
    
    return (
      <Card style={styles.achievementBadge} shadow="sm">
        <View style={[styles.achievementIcon, { backgroundColor: `${getTierColor(achievement.tier) || getCategoryColor(achievement.id)}20` }]}>
          <Ionicons 
            name={achievement.icon} 
            size={24} 
            color={getTierColor(achievement.tier) || getCategoryColor(achievement.id)} 
          />
          {achievement.tier && (
            <View style={[styles.tierBadge, { backgroundColor: getTierColor(achievement.tier) }]}>
              <Text style={styles.tierText}>{achievement.tier.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <Text style={styles.achievementName}>{achievement.name}</Text>
        <Text style={styles.achievementDate}>
          {new Date(achievement.earnedDate).toLocaleDateString()}
        </Text>
      </Card>
    );
  };
  
  const GiftedBadgeCard = ({ badge }) => (
    <Card style={styles.giftedBadgeCard} shadow="sm">
      <View style={styles.giftIcon}>
        <Ionicons name="gift" size={20} color={Colors.secondary[500]} />
      </View>
      <Text style={styles.giftBadgeName}>{badge.badge}</Text>
      <Text style={styles.giftFrom}>@{badge.from}</Text>
    </Card>
  );
  
  const StatCard = ({ icon, value, label, color = Colors.primary[500] }) => (
    <Card style={styles.statCard} shadow="sm">
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <LinearGradient
        colors={Colors.gradient.primaryBlue}
        style={styles.headerGradient}
      >
        <View style={styles.profileHeader}>
          <CircularProgress progress={overallProgress} />
          
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          
          <View style={styles.subscriptionBadge}>
            <Ionicons 
              name={user.subscriptionStatus === 'premium' ? 'diamond' : 'person-outline'} 
              size={16} 
              color={Colors.text.inverse} 
            />
            <Text style={styles.subscriptionText}>
              {user.subscriptionStatus === 'premium' ? 'Premium Member' : 'Free Member'}
            </Text>
          </View>
        </View>
      </LinearGradient>
      
      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <StatCard 
          icon="diamond"
          value={user.points.toLocaleString()}
          label="Points"
          color={Colors.primary[500]}
        />
        <StatCard 
          icon="flame"
          value={user.currentStreak}
          label="Day Streak"
          color={Colors.accent[500]}
        />
        <StatCard 
          icon="trophy"
          value={getTotalEarnedAchievements()}
          label="Achievements"
          color={Colors.success[500]}
        />
      </View>
      
      {/* Points & Rewards Section */}
      {subscriptionTier !== SUBSCRIPTION_TIERS.PREMIUM && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Earn Points</Text>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => setShowSubscriptionModal(true)}
            >
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
          
          <Card style={styles.rewardsCard}>
            <Text style={styles.rewardsTitle}>Watch ads to earn points!</Text>
            <Text style={styles.rewardsSubtitle}>
              Use points to gift badges to other users
            </Text>
            
            <RewardedAdButton 
              onRewardEarned={(points) => {
                console.log(`Earned ${points} points!`);
              }}
            />
          </Card>
        </View>
      )}
      
      {/* Streak Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Current Streak</Text>
          <TouchableOpacity 
            style={styles.sectionAction}
            onPress={() => navigation?.navigate('Achievements')}
          >
            <Text style={styles.sectionActionText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <Card style={styles.streakCard}>
          <View style={styles.streakContent}>
            <View style={styles.streakIcon}>
              <Ionicons name="flame" size={32} color={Colors.accent[500]} />
            </View>
            <View style={styles.streakInfo}>
              <Text style={styles.streakDays}>{user.currentStreak} Days</Text>
              <Text style={styles.streakLabel}>Current Streak</Text>
              <Text style={styles.streakBest}>Best: {user.longestStreak} days</Text>
            </View>
            <TouchableOpacity 
              style={styles.streakUpdateButton}
              onPress={() => {
                updateStreak(user.currentStreak + 1);
                Alert.alert('Streak Updated!', `You're now at ${user.currentStreak + 1} days! 🔥`);
              }}
            >
              <Ionicons name="add-circle" size={24} color={Colors.primary[500]} />
              <Text style={styles.streakUpdateText}>+1 Day</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
      
      {/* Goals Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Goals</Text>
          <TouchableOpacity style={styles.sectionAction}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.goalsContainer}>
          {user.goals.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </View>
      </View>
      
      {/* Achievements Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <TouchableOpacity 
            style={styles.sectionAction}
            onPress={() => navigation?.navigate('Achievements')}
          >
            <Text style={styles.sectionActionText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll}>
          <View style={styles.achievementsContainer}>
            {getRecentAchievements().map((achievement, index) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </ScrollView>
      </View>
      
      {/* Gifted Badges Section */}
      {user.giftedBadges && user.giftedBadges.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gifted Badges</Text>
            <TouchableOpacity 
              style={styles.sectionAction}
              onPress={() => setShowBadgeGifting(true)}
            >
              <Ionicons name="gift" size={20} color={Colors.primary[500]} />
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.giftedBadgesContainer}>
              {user.giftedBadges.slice(0, 3).map(badge => (
                <GiftedBadgeCard key={badge.id} badge={badge} />
              ))}
            </View>
          </ScrollView>
        </View>
      )}
      
      {/* Recent Activity Preview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity style={styles.sectionAction}>
            <Text style={styles.sectionActionText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <Card style={styles.activityCard} shadow="sm">
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success[500]} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Completed daily coding goal</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="trophy" size={16} color={Colors.accent[500]} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Earned "Streak Master" badge</Text>
              <Text style={styles.activityTime}>1 day ago</Text>
            </View>
          </View>
        </Card>
      </View>
      
      {/* Goal Progress Modal */}
      {selectedGoal && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={true}
          onRequestClose={() => setSelectedGoal(null)}
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.modalContent} shadow="xl">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Progress</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedGoal(null)}
                >
                  <Ionicons name="close" size={24} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalSubtitle}>{selectedGoal.description}</Text>
              
              <View style={styles.progressSliderContainer}>
                <Text style={styles.progressSliderLabel}>
                  Current Progress: {selectedGoal.currentProgress}%
                </Text>
                
                <View style={styles.progressSliderTrack}>
                  <View 
                    style={[
                      styles.progressSliderFill, 
                      { width: `${selectedGoal.currentProgress}%` }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.progressSliderThumb, 
                      { left: `calc(${selectedGoal.currentProgress}% - 12px)` }
                    ]} 
                  />
                </View>
                
                <View style={styles.progressSliderLabels}>
                  <Text style={styles.progressSliderLabelText}>0%</Text>
                  <Text style={styles.progressSliderLabelText}>100%</Text>
                </View>
              </View>
              
              <View style={styles.modalActions}>
                <Button 
                  title="Cancel"
                  variant="outline"
                  onPress={() => setSelectedGoal(null)}
                  style={styles.modalCancelButton}
                />
                <Button 
                  title="+5% Progress"
                  onPress={() => {
                    const newProgress = Math.min(100, selectedGoal.currentProgress + 5);
                    updateGoalProgress(selectedGoal.id, newProgress);
                    setSelectedGoal(null);
                    Alert.alert('Progress Updated!', `Your progress is now ${newProgress}%`);
                  }}
                  style={styles.modalUpdateButton}
                />
              </View>
            </Card>
          </View>
        </Modal>
      )}
      
      {/* Badge Gifting Modal */}
      <BadgeGiftingModal
        visible={showBadgeGifting}
        targetUser={{ username: 'friend' }} // This would be passed from another screen
        onClose={() => setShowBadgeGifting(false)}
      />
      
      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: Spacing['4xl'],
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius['3xl'],
    borderBottomRightRadius: BorderRadius['3xl'],
  },
  profileHeader: {
    alignItems: 'center',
  },
  circularProgressContainer: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  circularProgressSvg: {
    position: 'absolute',
  },
  circularProgressContent: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.primary[500],
  },
  progressBadgeText: {
    ...Typography.styles.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary[500],
  },
  username: {
    ...Typography.styles.h2,
    color: Colors.text.inverse,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    ...Typography.styles.body,
    color: Colors.primary[100],
    marginBottom: Spacing.lg,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  subscriptionText: {
    ...Typography.styles.bodySmall,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: Spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    marginTop: -Spacing['2xl'],
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  statValue: {
    ...Typography.styles.h3,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['3xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.styles.h3,
  },
  sectionAction: {
    padding: Spacing.sm,
  },
  sectionActionText: {
    ...Typography.styles.bodySmall,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.medium,
  },
  goalsContainer: {
    gap: Spacing.md,
  },
  goalCard: {
    paddingVertical: Spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalTitle: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  goalProgress: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
  },
  goalEditButton: {
    padding: Spacing.xs,
  },
  progressBarContainer: {
    marginBottom: Spacing.md,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: Colors.neutral[200],
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.sm,
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalStatText: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  badgeCard: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.secondary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeName: {
    ...Typography.styles.bodySmall,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  badgeCount: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
  },
  activityCard: {
    paddingVertical: Spacing.lg,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    ...Typography.styles.body,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  activityTime: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral[100],
  },
  modalTitle: {
    ...Typography.styles.h3,
  },
  modalSubtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    marginBottom: Spacing['2xl'],
    textAlign: 'center',
  },
  progressSliderContainer: {
    marginBottom: Spacing['3xl'],
  },
  progressSliderLabel: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  progressSliderTrack: {
    height: 8,
    backgroundColor: Colors.neutral[200],
    borderRadius: BorderRadius.sm,
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  progressSliderFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.sm,
  },
  progressSliderThumb: {
    position: 'absolute',
    top: -8,
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
    borderWidth: 3,
    borderColor: Colors.background.primary,
    ...Shadows.md,
  },
  progressSliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressSliderLabelText: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalUpdateButton: {
    flex: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  loadingText: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
  },
  // Streak Section Styles
  streakCard: {
    padding: Spacing.xl,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.accent[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  streakInfo: {
    flex: 1,
  },
  streakDays: {
    ...Typography.styles.h2,
    color: Colors.accent[500],
    fontWeight: Typography.fontWeight.bold,
  },
  streakLabel: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  streakBest: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
  },
  streakUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  streakUpdateText: {
    ...Typography.styles.bodySmall,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.semibold,
  },
  // Achievement Badge Styles
  achievementsScroll: {
    flexGrow: 0,
  },
  achievementsContainer: {
    flexDirection: 'row',
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  achievementBadge: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    width: 120,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  tierBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierText: {
    ...Typography.styles.caption,
    color: Colors.text.inverse,
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
  },
  achievementName: {
    ...Typography.styles.bodySmall,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  achievementDate: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  // Gifted Badges Styles
  giftedBadgesContainer: {
    flexDirection: 'row',
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  giftedBadgeCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    width: 100,
    backgroundColor: Colors.background.accent,
    borderWidth: 1,
    borderColor: Colors.secondary[200],
  },
  giftIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.secondary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  giftBadgeName: {
    ...Typography.styles.bodySmall,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
    color: Colors.primary[700],
    marginBottom: Spacing.xs,
  },
  giftFrom: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  // Rewards section styles
  rewardsCard: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  rewardsTitle: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  rewardsSubtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
  },
  upgradeButtonText: {
    ...Typography.styles.bodySmall,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.bold,
  },
});

export default ProfileScreen;