// screens/AchievementsScreen.js - Display user achievements, badges, and awards
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input } from '../components';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/designSystem';

const AchievementsScreen = () => {
  const { user, giftBadge } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [giftingBadge, setGiftingBadge] = useState(null);
  const [giftRecipient, setGiftRecipient] = useState('');
  const [giftMessage, setGiftMessage] = useState('');

  if (!user) return null;

  const getTotalAchievements = () => {
    const { achievements } = user;
    return Object.values(achievements).flat().filter(a => a.earned).length;
  };

  const getTotalPossibleAchievements = () => {
    const { achievements } = user;
    return Object.values(achievements).flat().length;
  };

  const getAchievementsByCategory = (category) => {
    if (category === 'all') {
      return Object.entries(user.achievements).map(([cat, achievements]) => ({
        category: cat,
        achievements
      }));
    }
    return [{ category, achievements: user.achievements[category] || [] }];
  };

  const getTierColor = (tier) => {
    const tierColors = {
      bronze: Colors.secondary[600],
      silver: Colors.neutral[400],
      gold: Colors.accent[500],
      platinum: Colors.primary[500]
    };
    return tierColors[tier] || Colors.neutral[500];
  };

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      streaks: 'flame',
      goals: 'target',
      community: 'people',
      special: 'star'
    };
    return categoryIcons[category] || 'trophy';
  };

  const getCategoryColor = (category) => {
    const categoryColors = {
      streaks: Colors.accent[500],
      goals: Colors.primary[500],
      community: Colors.success[500],
      special: Colors.secondary[500]
    };
    return categoryColors[category] || Colors.neutral[500];
  };

  const formatCategoryName = (category) => {
    const names = {
      streaks: 'Daily Streaks',
      goals: 'Goal Progress',
      community: 'Community Engagement',
      special: 'Special Achievements'
    };
    return names[category] || category;
  };

  const handleGiftBadge = () => {
    if (!giftRecipient.trim() || !giftMessage.trim()) {
      Alert.alert('Missing Information', 'Please enter both recipient and message.');
      return;
    }

    giftBadge(giftRecipient.trim(), giftingBadge.name, giftMessage.trim());
    setGiftingBadge(null);
    setGiftRecipient('');
    setGiftMessage('');
  };

  const AchievementCard = ({ achievement, category }) => {
    const isEarned = achievement.earned;
    const progress = achievement.progress || 0;
    const target = achievement.target || 1;
    const progressPercent = target > 1 ? (progress / target) * 100 : (isEarned ? 100 : 0);

    return (
      <Card style={[styles.achievementCard, isEarned && styles.achievementCardEarned]}>
        <View style={styles.achievementContent}>
          <View style={[styles.achievementIcon, { backgroundColor: `${getCategoryColor(category)}${isEarned ? '' : '30'}` }]}>
            <Ionicons 
              name={achievement.icon} 
              size={24} 
              color={isEarned ? Colors.text.inverse : getCategoryColor(category)} 
            />
            {achievement.tier && (
              <View style={[styles.tierBadge, { backgroundColor: getTierColor(achievement.tier) }]}>
                <Text style={styles.tierText}>{achievement.tier.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>

          <View style={styles.achievementDetails}>
            <Text style={[styles.achievementName, !isEarned && styles.achievementNameLocked]}>
              {achievement.name}
            </Text>
            <Text style={styles.achievementDescription}>{achievement.description}</Text>
            
            {!isEarned && target > 1 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {progress}/{target}
                </Text>
              </View>
            )}

            {isEarned && (
              <View style={styles.earnedInfo}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success[500]} />
                <Text style={styles.earnedDate}>
                  Earned {new Date(achievement.earnedDate).toLocaleDateString()}
                </Text>
                {achievement.earned && (
                  <TouchableOpacity
                    style={styles.giftButton}
                    onPress={() => setGiftingBadge(achievement)}
                  >
                    <Ionicons name="gift" size={16} color={Colors.primary[500]} />
                    <Text style={styles.giftButtonText}>Gift</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  };

  const GiftedBadgeCard = ({ badge }) => (
    <Card style={styles.giftedBadgeCard}>
      <View style={styles.giftedBadgeContent}>
        <View style={styles.giftedBadgeIcon}>
          <Ionicons name="gift" size={24} color={Colors.secondary[500]} />
        </View>
        <View style={styles.giftedBadgeDetails}>
          <Text style={styles.giftedBadgeName}>{badge.badge}</Text>
          <Text style={styles.giftedBadgeFrom}>From @{badge.from}</Text>
          <Text style={styles.giftedBadgeMessage}>"{badge.message}"</Text>
          <Text style={styles.giftedBadgeDate}>
            {new Date(badge.receivedDate).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </Card>
  );

  const StatsCard = () => (
    <Card style={styles.statsCard}>
      <Text style={styles.statsTitle}>Your Progress</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.points.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{getTotalAchievements()}</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.totalPosts}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.gradient.primaryBlue}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Achievements</Text>
        <Text style={styles.headerSubtitle}>
          {getTotalAchievements()}/{getTotalPossibleAchievements()} unlocked
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <StatsCard />

        <View style={styles.tabContainer}>
          {[
            { id: 'all', label: 'All', icon: 'apps' },
            { id: 'streaks', label: 'Streaks', icon: 'flame' },
            { id: 'goals', label: 'Goals', icon: 'target' },
            { id: 'community', label: 'Community', icon: 'people' },
            { id: 'special', label: 'Special', icon: 'star' }
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons 
                name={tab.icon} 
                size={20} 
                color={activeTab === tab.id ? Colors.primary[500] : Colors.text.secondary} 
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.achievementsContainer}>
          {getAchievementsByCategory(activeTab).map(({ category, achievements }) => (
            <View key={category} style={styles.categorySection}>
              {activeTab === 'all' && (
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(category) }]}>
                    <Ionicons name={getCategoryIcon(category)} size={20} color={Colors.text.inverse} />
                  </View>
                  <Text style={styles.categoryTitle}>{formatCategoryName(category)}</Text>
                </View>
              )}
              
              {achievements.map(achievement => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement} 
                  category={category}
                />
              ))}
            </View>
          ))}
        </View>

        {user.giftedBadges && user.giftedBadges.length > 0 && (
          <View style={styles.giftedBadgesSection}>
            <Text style={styles.sectionTitle}>Gifted Badges</Text>
            {user.giftedBadges.map(badge => (
              <GiftedBadgeCard key={badge.id} badge={badge} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Gift Badge Modal */}
      {giftingBadge && (
        <View style={styles.modalOverlay}>
          <Card style={styles.giftModal}>
            <Text style={styles.giftModalTitle}>Gift "{giftingBadge.name}" Badge</Text>
            <Text style={styles.giftModalDescription}>
              Share this achievement with a friend to encourage them!
            </Text>
            
            <Input
              label="Recipient Username"
              placeholder="Enter username"
              value={giftRecipient}
              onChangeText={setGiftRecipient}
              style={styles.giftInput}
            />
            
            <Input
              label="Message"
              placeholder="Add an encouraging message"
              value={giftMessage}
              onChangeText={setGiftMessage}
              multiline
              numberOfLines={3}
              style={styles.giftInput}
            />

            <View style={styles.giftModalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setGiftingBadge(null);
                  setGiftRecipient('');
                  setGiftMessage('');
                }}
                style={styles.giftModalButton}
              />
              <Button
                title="Send Gift"
                onPress={handleGiftBadge}
                style={styles.giftModalButton}
              />
            </View>
          </Card>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.styles.h2,
    color: Colors.text.inverse,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.styles.body,
    color: Colors.primary[100],
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  statsCard: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statsTitle: {
    ...Typography.styles.h4,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...Typography.styles.h3,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.bold,
  },
  statLabel: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  activeTab: {
    backgroundColor: Colors.primary[50],
  },
  tabText: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  activeTabText: {
    color: Colors.primary[500],
  },
  achievementsContainer: {
    gap: Spacing.lg,
  },
  categorySection: {
    gap: Spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryTitle: {
    ...Typography.styles.h4,
  },
  achievementCard: {
    padding: Spacing.lg,
    opacity: 0.7,
  },
  achievementCardEarned: {
    opacity: 1,
    borderWidth: 2,
    borderColor: Colors.success[200],
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
    position: 'relative',
  },
  tierBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
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
  achievementDetails: {
    flex: 1,
  },
  achievementName: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  achievementNameLocked: {
    color: Colors.text.secondary,
  },
  achievementDescription: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  progressContainer: {
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.neutral[200],
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
  },
  progressText: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
  },
  earnedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  earnedDate: {
    ...Typography.styles.caption,
    color: Colors.success[500],
    flex: 1,
  },
  giftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.md,
  },
  giftButtonText: {
    ...Typography.styles.caption,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.medium,
  },
  giftedBadgesSection: {
    marginTop: Spacing['2xl'],
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    ...Typography.styles.h4,
    marginBottom: Spacing.lg,
  },
  giftedBadgeCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.secondary[25] || Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.secondary[200],
  },
  giftedBadgeContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  giftedBadgeIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.secondary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  giftedBadgeDetails: {
    flex: 1,
  },
  giftedBadgeName: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.secondary[700],
  },
  giftedBadgeFrom: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  giftedBadgeMessage: {
    ...Typography.styles.bodySmall,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  giftedBadgeDate: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  giftModal: {
    width: '100%',
    maxWidth: 400,
    padding: Spacing['2xl'],
  },
  giftModalTitle: {
    ...Typography.styles.h4,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  giftModalDescription: {
    ...Typography.styles.body,
    textAlign: 'center',
    color: Colors.text.secondary,
    marginBottom: Spacing['2xl'],
  },
  giftInput: {
    marginBottom: Spacing.lg,
  },
  giftModalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  giftModalButton: {
    flex: 1,
  },
});

export default AchievementsScreen;