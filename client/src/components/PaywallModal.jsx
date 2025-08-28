// components/PaywallModal.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../context/SubscriptionContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/designSystem';
import { Card, Button } from './';

const PaywallModal = ({ visible, onClose, action = 'post', onSubscribe, onWatchAd, onStartTrial }) => {
  const { getUpgradePrompt, currentLimits, remainingUsage, effectiveTier, trialStatus } = useSubscription();
  const [loading, setLoading] = useState(false);
  
  const upgradePrompt = getUpgradePrompt(action);

  const handleWatchAd = async () => {
    setLoading(true);
    try {
      if (onWatchAd) {
        await onWatchAd();
      }
      onClose();
    } catch (error) {
      console.error('Error watching ad:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    setLoading(true);
    try {
      if (onStartTrial) {
        await onStartTrial();
      }
      onClose();
    } catch (error) {
      console.error('Error starting trial:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      if (onSubscribe) {
        await onSubscribe();
      }
      onClose();
    } catch (error) {
      console.error('Error subscribing:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionText = () => {
    switch (action) {
      case 'post':
        return 'create more posts';
      case 'joinCommunity':
        return 'join more communities';
      default:
        return 'continue';
    }
  };

  const getCurrentUsageText = () => {
    if (action === 'post') {
      return `You've used ${currentLimits.dailyPosts - remainingUsage.posts} of ${currentLimits.dailyPosts === Infinity ? '∞' : currentLimits.dailyPosts} daily posts`;
    } else if (action === 'joinCommunity') {
      return `You've joined ${currentLimits.maxCommunities - remainingUsage.communities} of ${currentLimits.maxCommunities === Infinity ? '∞' : currentLimits.maxCommunities} communities`;
    }
    return '';
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Card style={styles.modal} shadow="xl">
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text.secondary} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header Icon */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="diamond" size={48} color={Colors.primary[500]} />
              </View>
              <Text style={styles.title}>Upgrade to Premium</Text>
              <Text style={styles.subtitle}>
                You've reached your limit. Upgrade to {getActionText()}!
              </Text>
            </View>

            {/* Current Usage */}
            <Card style={styles.usageCard}>
              <View style={styles.usageHeader}>
                <Ionicons name="bar-chart" size={20} color={Colors.text.secondary} />
                <Text style={styles.usageTitle}>Current Usage</Text>
              </View>
              <Text style={styles.usageText}>{getCurrentUsageText()}</Text>
              
              {effectiveTier === 'free_plus' && (
                <View style={styles.freePlusIndicator}>
                  <Ionicons name="time" size={16} color={Colors.accent[500]} />
                  <Text style={styles.freePlusText}>Free+ features unlocked via ads</Text>
                </View>
              )}
            </Card>

            {/* Tier Comparison */}
            <View style={styles.tierComparison}>
              <Text style={styles.sectionTitle}>Choose Your Plan</Text>
              
              {/* Free Tier */}
              <Card style={[styles.tierCard, effectiveTier === 'free' && styles.currentTierCard]}>
                <View style={styles.tierHeader}>
                  <Text style={styles.tierName}>Free</Text>
                  <Text style={styles.tierPrice}>$0</Text>
                </View>
                <View style={styles.tierFeatures}>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color={Colors.success[500]} />
                    <Text style={styles.featureText}>1 post per day</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color={Colors.success[500]} />
                    <Text style={styles.featureText}>1 community</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="close" size={16} color={Colors.secondary[500]} />
                    <Text style={[styles.featureText, styles.disabledFeature]}>Ads shown</Text>
                  </View>
                </View>
                {effectiveTier === 'free' && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>CURRENT</Text>
                  </View>
                )}
              </Card>

              {/* Free+ Tier */}
              <Card style={[styles.tierCard, effectiveTier === 'free_plus' && styles.currentTierCard]}>
                <View style={styles.tierHeader}>
                  <Text style={styles.tierName}>Free+</Text>
                  <Text style={styles.tierPrice}>Watch Ad</Text>
                </View>
                <View style={styles.tierFeatures}>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color={Colors.success[500]} />
                    <Text style={styles.featureText}>5 posts per day</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color={Colors.success[500]} />
                    <Text style={styles.featureText}>3 communities</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="close" size={16} color={Colors.secondary[500]} />
                    <Text style={[styles.featureText, styles.disabledFeature]}>Ads shown</Text>
                  </View>
                </View>
                {effectiveTier === 'free_plus' && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>CURRENT</Text>
                  </View>
                )}
              </Card>

              {/* Premium Tier */}
              <Card style={[styles.tierCard, styles.premiumTierCard]}>
                <View style={styles.tierHeader}>
                  <Text style={styles.tierName}>Premium</Text>
                  <View style={styles.tierPriceContainer}>
                    <Text style={styles.tierPrice}>$5</Text>
                    <Text style={styles.tierPricePeriod}>/month</Text>
                  </View>
                </View>
                <View style={styles.tierFeatures}>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color={Colors.success[500]} />
                    <Text style={styles.featureText}>Unlimited posts</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color={Colors.success[500]} />
                    <Text style={styles.featureText}>Unlimited communities</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="checkmark" size={16} color={Colors.success[500]} />
                    <Text style={styles.featureText}>Ad-free experience</Text>
                  </View>
                  <View style={styles.feature}>
                    <Ionicons name="star" size={16} color={Colors.accent[500]} />
                    <Text style={styles.featureText}>Premium badge</Text>
                  </View>
                </View>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>RECOMMENDED</Text>
                </View>
              </Card>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              {/* Watch Ad Button - Only for free tier */}
              {effectiveTier === 'free' && (
                <Button
                  title="Watch Ad for Free+"
                  variant="outline"
                  onPress={handleWatchAd}
                  loading={loading}
                  style={styles.adButton}
                  leftIcon={<Ionicons name="play" size={16} color={Colors.primary[500]} />}
                />
              )}

              {/* Free Trial Button - Only if trial not used */}
              {!trialStatus.hasUsedTrial && (
                <Button
                  title="Start 5-Day Free Trial"
                  onPress={handleStartTrial}
                  loading={loading}
                  style={styles.trialButton}
                  leftIcon={<Ionicons name="time" size={16} color={Colors.background.primary} />}
                />
              )}

              {/* Subscribe Button */}
              <Button
                title="Subscribe to Premium"
                onPress={handleSubscribe}
                loading={loading}
                style={styles.subscribeButton}
                leftIcon={<Ionicons name="diamond" size={16} color={Colors.background.primary} />}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Premium subscriptions help support the development of LogIn and keep our community thriving.
              </Text>
            </View>
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modal: {
    width: '100%',
    maxHeight: '90%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.styles.h2,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  usageCard: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.secondary[50],
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  usageTitle: {
    ...Typography.styles.bodyMedium,
    fontWeight: Typography.fontWeight.semibold,
    marginLeft: Spacing.sm,
  },
  usageText: {
    ...Typography.styles.body,
    color: Colors.text.primary,
  },
  freePlusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  freePlusText: {
    ...Typography.styles.bodySmall,
    color: Colors.accent[600],
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  tierComparison: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  tierCard: {
    marginBottom: Spacing.md,
    position: 'relative',
  },
  currentTierCard: {
    borderWidth: 2,
    borderColor: Colors.primary[300],
  },
  premiumTierCard: {
    borderWidth: 2,
    borderColor: Colors.accent[300],
    backgroundColor: Colors.accent[25],
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tierName: {
    ...Typography.styles.h4,
  },
  tierPrice: {
    ...Typography.styles.h3,
    color: Colors.primary[600],
  },
  tierPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tierPricePeriod: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  tierFeatures: {
    gap: Spacing.sm,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    ...Typography.styles.body,
    marginLeft: Spacing.sm,
  },
  disabledFeature: {
    color: Colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  currentBadge: {
    position: 'absolute',
    top: -8,
    right: Spacing.md,
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  currentBadgeText: {
    ...Typography.styles.caption,
    color: Colors.background.primary,
    fontWeight: Typography.fontWeight.bold,
  },
  premiumBadge: {
    position: 'absolute',
    top: -8,
    right: Spacing.md,
    backgroundColor: Colors.accent[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  premiumBadgeText: {
    ...Typography.styles.caption,
    color: Colors.background.primary,
    fontWeight: Typography.fontWeight.bold,
  },
  actions: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  adButton: {
    backgroundColor: Colors.background.primary,
    borderColor: Colors.primary[300],
  },
  trialButton: {
    backgroundColor: Colors.secondary[500],
  },
  subscribeButton: {
    backgroundColor: Colors.accent[500],
  },
  footer: {
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  footerText: {
    ...Typography.styles.bodySmall,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
});

export default PaywallModal;