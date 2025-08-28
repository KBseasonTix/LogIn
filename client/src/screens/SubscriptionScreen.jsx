// screens/SubscriptionScreen.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../context/SubscriptionContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/designSystem';
import { Card, Button } from '../components';

const SubscriptionScreen = ({ navigation }) => {
  const {
    subscriptionTier,
    effectiveTier,
    trialStatus,
    currentLimits,
    remainingUsage,
    subscriptionData,
    startTrial,
    subscribeToPremium,
    cancelSubscription,
    watchRewardedAd,
    loading
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [actionLoading, setActionLoading] = useState(null);

  const plans = {
    monthly: {
      id: 'monthly',
      name: 'Monthly',
      price: 5,
      period: 'month',
      savings: null,
      recommended: true
    },
    yearly: {
      id: 'yearly',
      name: 'Annual',
      price: 50,
      period: 'year',
      savings: '17% off',
      recommended: false
    }
  };

  const handleStartTrial = async () => {
    setActionLoading('trial');
    try {
      const success = await startTrial();
      if (success) {
        Alert.alert(
          'Trial Started!',
          'Enjoy 5 days of unlimited access to all premium features.',
          [{ text: 'Get Started', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error starting trial:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubscribe = async () => {
    setActionLoading('subscribe');
    try {
      // In a real app, this would integrate with Stripe
      const success = await subscribeToPremium('pm_demo123');
      if (success) {
        Alert.alert(
          'Subscription Active!',
          'Welcome to Premium! You now have unlimited access to all features.',
          [{ text: 'Continue', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error subscribing:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleWatchAd = async () => {
    setActionLoading('ad');
    try {
      await watchRewardedAd();
    } catch (error) {
      console.error('Error watching ad:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your Premium subscription? You\'ll continue to have access until the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('cancel');
            try {
              await cancelSubscription();
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const renderCurrentPlanCard = () => {
    if (subscriptionTier === 'premium') {
      return (
        <Card style={styles.currentPlanCard}>
          <View style={styles.currentPlanHeader}>
            <View style={styles.premiumBadge}>
              <Ionicons name="diamond" size={20} color={Colors.background.primary} />
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
            {trialStatus.isInTrial && (
              <View style={styles.trialBadge}>
                <Text style={styles.trialBadgeText}>
                  TRIAL · {trialStatus.daysRemaining} days left
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.currentPlanTitle}>Premium Subscription</Text>
          <Text style={styles.currentPlanSubtitle}>
            Unlimited posts, communities, and ad-free experience
          </Text>
          
          {subscriptionData.currentPeriodEnd && !trialStatus.isInTrial && (
            <View style={styles.billingInfo}>
              <Text style={styles.billingText}>
                Next billing: {new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()}
              </Text>
              {subscriptionData.cancelAtPeriodEnd && (
                <Text style={styles.cancelledText}>
                  Subscription cancelled - access until {new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()}
                </Text>
              )}
            </View>
          )}
          
          {!trialStatus.isInTrial && !subscriptionData.cancelAtPeriodEnd && (
            <Button
              title="Manage Subscription"
              variant="outline"
              onPress={handleCancelSubscription}
              loading={actionLoading === 'cancel'}
              style={styles.manageButton}
            />
          )}
        </Card>
      );
    }

    return (
      <Card style={styles.currentPlanCard}>
        <View style={styles.currentPlanHeader}>
          <View style={[styles.tierBadge, effectiveTier === 'free_plus' && styles.freePlusBadge]}>
            <Ionicons 
              name={effectiveTier === 'free_plus' ? 'play' : 'person'} 
              size={16} 
              color={Colors.background.primary} 
            />
            <Text style={styles.tierBadgeText}>
              {effectiveTier === 'free_plus' ? 'FREE+' : 'FREE'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.currentPlanTitle}>
          {effectiveTier === 'free_plus' ? 'Free+ Plan' : 'Free Plan'}
        </Text>
        <Text style={styles.currentPlanSubtitle}>
          {effectiveTier === 'free_plus' 
            ? '5 posts/day, 3 communities (unlocked via ads)'
            : '1 post/day, 1 community'
          }
        </Text>
        
        <View style={styles.usageStats}>
          <View style={styles.usageStat}>
            <Text style={styles.usageStatLabel}>Daily Posts</Text>
            <Text style={styles.usageStatValue}>
              {currentLimits.dailyPosts - remainingUsage.posts} / {currentLimits.dailyPosts === Infinity ? '∞' : currentLimits.dailyPosts}
            </Text>
          </View>
          <View style={styles.usageStat}>
            <Text style={styles.usageStatLabel}>Communities</Text>
            <Text style={styles.usageStatValue}>
              {currentLimits.maxCommunities - remainingUsage.communities} / {currentLimits.maxCommunities === Infinity ? '∞' : currentLimits.maxCommunities}
            </Text>
          </View>
        </View>
        
        {effectiveTier === 'free' && (
          <Button
            title="Watch Ad for Free+"
            variant="outline"
            onPress={handleWatchAd}
            loading={actionLoading === 'ad'}
            style={styles.watchAdButton}
            leftIcon={<Ionicons name="play" size={16} color={Colors.primary[500]} />}
          />
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Plan */}
        {renderCurrentPlanCard()}

        {/* Upgrade Section - Only show if not premium */}
        {subscriptionTier !== 'premium' && (
          <>
            {/* Benefits */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Premium Benefits</Text>
              <Card style={styles.benefitsCard}>
                {[
                  { icon: 'infinite', title: 'Unlimited Posts', desc: 'Share as much as you want' },
                  { icon: 'people', title: 'Unlimited Communities', desc: 'Join all communities that interest you' },
                  { icon: 'close-circle', title: 'Ad-Free Experience', desc: 'Focus without distractions' },
                  { icon: 'star', title: 'Premium Badge', desc: 'Show your supporter status' },
                  { icon: 'shield-checkmark', title: 'Priority Support', desc: 'Get help when you need it' }
                ].map((benefit, index) => (
                  <View key={index} style={styles.benefit}>
                    <View style={styles.benefitIcon}>
                      <Ionicons name={benefit.icon} size={20} color={Colors.primary[500]} />
                    </View>
                    <View style={styles.benefitContent}>
                      <Text style={styles.benefitTitle}>{benefit.title}</Text>
                      <Text style={styles.benefitDesc}>{benefit.desc}</Text>
                    </View>
                  </View>
                ))}
              </Card>
            </View>

            {/* Pricing Plans */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Your Plan</Text>
              
              {Object.values(plans).map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    selectedPlan === plan.id && styles.selectedPlanCard
                  ]}
                  onPress={() => setSelectedPlan(plan.id)}
                >
                  <View style={styles.planHeader}>
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      {plan.savings && (
                        <View style={styles.savingsBadge}>
                          <Text style={styles.savingsText}>{plan.savings}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.planPricing}>
                      <Text style={styles.planPrice}>${plan.price}</Text>
                      <Text style={styles.planPeriod}>/{plan.period}</Text>
                    </View>
                  </View>
                  
                  {plan.id === 'yearly' && (
                    <Text style={styles.planNote}>
                      ${(plan.price / 12).toFixed(2)} per month, billed annually
                    </Text>
                  )}
                  
                  <View style={styles.radioContainer}>
                    <View style={[
                      styles.radio,
                      selectedPlan === plan.id && styles.radioSelected
                    ]}>
                      {selectedPlan === plan.id && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                  </View>
                  
                  {plan.recommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>RECOMMENDED</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              {!trialStatus.hasUsedTrial && (
                <Button
                  title="Start 5-Day Free Trial"
                  onPress={handleStartTrial}
                  loading={actionLoading === 'trial'}
                  style={styles.trialButton}
                  leftIcon={<Ionicons name="time" size={16} color={Colors.background.primary} />}
                />
              )}
              
              <Button
                title={`Subscribe for $${plans[selectedPlan].price}/${plans[selectedPlan].period}`}
                onPress={handleSubscribe}
                loading={actionLoading === 'subscribe'}
                style={styles.subscribeButton}
                leftIcon={<Ionicons name="diamond" size={16} color={Colors.background.primary} />}
              />
            </View>

            {/* Fine Print */}
            <View style={styles.finePrint}>
              <Text style={styles.finePrintText}>
                Subscriptions auto-renew unless cancelled. You can cancel anytime in your account settings. 
                By subscribing, you agree to our Terms of Service and Privacy Policy.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.styles.h2,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  currentPlanCard: {
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent[500],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  premiumBadgeText: {
    ...Typography.styles.caption,
    color: Colors.background.primary,
    fontWeight: Typography.fontWeight.bold,
    marginLeft: Spacing.xs,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary[500],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  freePlusBadge: {
    backgroundColor: Colors.primary[500],
  },
  tierBadgeText: {
    ...Typography.styles.caption,
    color: Colors.background.primary,
    fontWeight: Typography.fontWeight.bold,
    marginLeft: Spacing.xs,
  },
  trialBadge: {
    backgroundColor: Colors.warning[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  trialBadgeText: {
    ...Typography.styles.caption,
    color: Colors.warning[700],
    fontWeight: Typography.fontWeight.semibold,
  },
  currentPlanTitle: {
    ...Typography.styles.h3,
    marginBottom: Spacing.xs,
  },
  currentPlanSubtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  billingInfo: {
    backgroundColor: Colors.neutral[50],
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  billingText: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
  },
  cancelledText: {
    ...Typography.styles.bodySmall,
    color: Colors.warning[600],
    marginTop: Spacing.xs,
  },
  manageButton: {
    backgroundColor: Colors.background.primary,
    borderColor: Colors.secondary[300],
  },
  usageStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  usageStat: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  usageStatLabel: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  usageStatValue: {
    ...Typography.styles.h4,
    color: Colors.text.primary,
  },
  watchAdButton: {
    backgroundColor: Colors.background.primary,
    borderColor: Colors.primary[300],
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    marginBottom: Spacing.lg,
  },
  benefitsCard: {
    gap: Spacing.lg,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    ...Typography.styles.bodyMedium,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  benefitDesc: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
  },
  planCard: {
    backgroundColor: Colors.background.primary,
    borderWidth: 2,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    position: 'relative',
  },
  selectedPlanCard: {
    borderColor: Colors.primary[300],
    backgroundColor: Colors.primary[25],
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  planInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  planName: {
    ...Typography.styles.h4,
    marginRight: Spacing.sm,
  },
  savingsBadge: {
    backgroundColor: Colors.success[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  savingsText: {
    ...Typography.styles.caption,
    color: Colors.success[700],
    fontWeight: Typography.fontWeight.semibold,
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    ...Typography.styles.h2,
    color: Colors.primary[600],
  },
  planPeriod: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
  },
  planNote: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  radioContainer: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary[500],
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    left: Spacing.lg,
    backgroundColor: Colors.accent[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  recommendedText: {
    ...Typography.styles.caption,
    color: Colors.background.primary,
    fontWeight: Typography.fontWeight.bold,
  },
  actions: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  trialButton: {
    backgroundColor: Colors.secondary[500],
  },
  subscribeButton: {
    backgroundColor: Colors.accent[500],
  },
  finePrint: {
    paddingBottom: Spacing['6xl'],
  },
  finePrintText: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.xs,
  },
});

export default SubscriptionScreen;