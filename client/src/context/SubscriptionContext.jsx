// context/SubscriptionContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const SubscriptionContext = createContext(null);

// Subscription Tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  FREE_PLUS: 'free_plus', // Unlocked via ads
  PREMIUM: 'premium'
};

// Usage Limits
export const TIER_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: {
    dailyPosts: 1,
    maxCommunities: 1,
    showAds: true,
    canWatchRewardedAds: true
  },
  [SUBSCRIPTION_TIERS.FREE_PLUS]: {
    dailyPosts: 5,
    maxCommunities: 3,
    showAds: true,
    canWatchRewardedAds: true
  },
  [SUBSCRIPTION_TIERS.PREMIUM]: {
    dailyPosts: Infinity,
    maxCommunities: Infinity,
    showAds: false,
    canWatchRewardedAds: false
  }
};

// Trial Configuration
const TRIAL_DURATION_DAYS = 5;
const TRIAL_GRACE_PERIOD_HOURS = 24;

export const SubscriptionProvider = ({ children }) => {
  const [subscriptionTier, setSubscriptionTier] = useState(SUBSCRIPTION_TIERS.FREE);
  const [trialStatus, setTrialStatus] = useState({
    isInTrial: false,
    trialStartDate: null,
    trialEndDate: null,
    hasUsedTrial: false,
    daysRemaining: 0
  });
  
  const [dailyUsage, setDailyUsage] = useState({
    posts: 0,
    joinedCommunities: [],
    lastResetDate: new Date().toDateString(),
    adRewardsUsed: 0,
    freePlusUnlockedUntil: null // Timestamp when free plus expires
  });
  
  const [subscriptionData, setSubscriptionData] = useState({
    stripeCustomerId: null,
    subscriptionId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    paymentMethod: null
  });

  const [loading, setLoading] = useState(true);

  // Initialize subscription data on app start
  useEffect(() => {
    initializeSubscription();
  }, []);

  // Daily usage reset
  useEffect(() => {
    const checkDailyReset = () => {
      const today = new Date().toDateString();
      if (dailyUsage.lastResetDate !== today) {
        resetDailyUsage();
      }
    };

    checkDailyReset();
    const interval = setInterval(checkDailyReset, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [dailyUsage.lastResetDate]);

  // Trial status updates
  useEffect(() => {
    if (trialStatus.isInTrial) {
      updateTrialStatus();
    }
  }, [trialStatus.isInTrial]);

  const initializeSubscription = async () => {
    try {
      // Load subscription data from storage
      const [storedTier, storedTrial, storedUsage, storedSubData] = await Promise.all([
        AsyncStorage.getItem('subscription_tier'),
        AsyncStorage.getItem('trial_status'),
        AsyncStorage.getItem('daily_usage'),
        AsyncStorage.getItem('subscription_data')
      ]);

      if (storedTier) {
        setSubscriptionTier(storedTier);
      }

      if (storedTrial) {
        const trial = JSON.parse(storedTrial);
        setTrialStatus(trial);
      }

      if (storedUsage) {
        const usage = JSON.parse(storedUsage);
        // Check if we need to reset daily usage
        const today = new Date().toDateString();
        if (usage.lastResetDate !== today) {
          resetDailyUsage();
        } else {
          setDailyUsage(usage);
        }
      }

      if (storedSubData) {
        setSubscriptionData(JSON.parse(storedSubData));
      }

    } catch (error) {
      console.error('Error initializing subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetDailyUsage = async () => {
    const newUsage = {
      posts: 0,
      joinedCommunities: dailyUsage.joinedCommunities, // Communities persist
      lastResetDate: new Date().toDateString(),
      adRewardsUsed: 0,
      freePlusUnlockedUntil: dailyUsage.freePlusUnlockedUntil
    };

    setDailyUsage(newUsage);
    await AsyncStorage.setItem('daily_usage', JSON.stringify(newUsage));
  };

  const updateTrialStatus = () => {
    if (!trialStatus.isInTrial || !trialStatus.trialEndDate) return;

    const now = new Date();
    const endDate = new Date(trialStatus.trialEndDate);
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      // Trial expired
      endTrial();
    } else {
      setTrialStatus(prev => ({ ...prev, daysRemaining }));
    }
  };

  const startTrial = async () => {
    if (trialStatus.hasUsedTrial) {
      Alert.alert('Trial Already Used', 'You have already used your free trial period.');
      return false;
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000));

    const newTrialStatus = {
      isInTrial: true,
      trialStartDate: startDate.toISOString(),
      trialEndDate: endDate.toISOString(),
      hasUsedTrial: true,
      daysRemaining: TRIAL_DURATION_DAYS
    };

    setTrialStatus(newTrialStatus);
    setSubscriptionTier(SUBSCRIPTION_TIERS.PREMIUM);

    await Promise.all([
      AsyncStorage.setItem('trial_status', JSON.stringify(newTrialStatus)),
      AsyncStorage.setItem('subscription_tier', SUBSCRIPTION_TIERS.PREMIUM)
    ]);

    Alert.alert(
      'Welcome to Premium!',
      `Your ${TRIAL_DURATION_DAYS}-day free trial has started. Enjoy unlimited posts and communities with no ads!`
    );

    return true;
  };

  const endTrial = async () => {
    const newTrialStatus = {
      ...trialStatus,
      isInTrial: false,
      daysRemaining: 0
    };

    setTrialStatus(newTrialStatus);
    setSubscriptionTier(SUBSCRIPTION_TIERS.FREE);

    await Promise.all([
      AsyncStorage.setItem('trial_status', JSON.stringify(newTrialStatus)),
      AsyncStorage.setItem('subscription_tier', SUBSCRIPTION_TIERS.FREE)
    ]);

    Alert.alert(
      'Trial Expired',
      'Your free trial has ended. Subscribe to Premium to continue enjoying unlimited access!'
    );
  };

  const canPerformAction = (action) => {
    const currentLimits = getCurrentLimits();
    
    switch (action) {
      case 'post':
        return dailyUsage.posts < currentLimits.dailyPosts;
      case 'joinCommunity':
        return dailyUsage.joinedCommunities.length < currentLimits.maxCommunities;
      default:
        return true;
    }
  };

  const performAction = async (action, data = {}) => {
    if (!canPerformAction(action)) {
      return { success: false, reason: 'limit_exceeded' };
    }

    let newUsage = { ...dailyUsage };

    switch (action) {
      case 'post':
        newUsage.posts += 1;
        break;
      case 'joinCommunity':
        if (!newUsage.joinedCommunities.includes(data.communityId)) {
          newUsage.joinedCommunities.push(data.communityId);
        }
        break;
    }

    setDailyUsage(newUsage);
    await AsyncStorage.setItem('daily_usage', JSON.stringify(newUsage));
    return { success: true };
  };

  const getCurrentLimits = () => {
    // Check if free plus is temporarily unlocked
    if (subscriptionTier === SUBSCRIPTION_TIERS.FREE && 
        dailyUsage.freePlusUnlockedUntil && 
        new Date() < new Date(dailyUsage.freePlusUnlockedUntil)) {
      return TIER_LIMITS[SUBSCRIPTION_TIERS.FREE_PLUS];
    }
    
    return TIER_LIMITS[subscriptionTier];
  };

  const getEffectiveTier = () => {
    // Check if free plus is temporarily unlocked
    if (subscriptionTier === SUBSCRIPTION_TIERS.FREE && 
        dailyUsage.freePlusUnlockedUntil && 
        new Date() < new Date(dailyUsage.freePlusUnlockedUntil)) {
      return SUBSCRIPTION_TIERS.FREE_PLUS;
    }
    
    return subscriptionTier;
  };

  const watchRewardedAd = async () => {
    // This would integrate with actual AdMob rewarded video
    // For now, we'll simulate the reward
    
    if (!getCurrentLimits().canWatchRewardedAds) {
      return { success: false, reason: 'not_available' };
    }

    try {
      // Simulate ad watch
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Unlock free plus for 24 hours
      const unlockUntil = new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString();
      
      const newUsage = {
        ...dailyUsage,
        adRewardsUsed: dailyUsage.adRewardsUsed + 1,
        freePlusUnlockedUntil: unlockUntil
      };

      setDailyUsage(newUsage);
      await AsyncStorage.setItem('daily_usage', JSON.stringify(newUsage));

      Alert.alert(
        'Reward Unlocked!',
        'You can now make 5 posts per day and join 3 communities for the next 24 hours!'
      );

      return { success: true, unlockUntil };
    } catch (error) {
      console.error('Error watching rewarded ad:', error);
      return { success: false, reason: 'ad_failed' };
    }
  };

  const upgradeSubscription = async (stripePriceId, planType) => {
    try {
      setLoading(true);
      
      // This would integrate with Stripe API 
      // For demo purposes, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newSubscriptionData = {
        stripeCustomerId: 'cus_demo123',
        subscriptionId: 'sub_demo123',
        currentPeriodEnd: new Date(Date.now() + (planType === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        planType: planType,
        stripePriceId: stripePriceId
      };

      // End trial if active
      if (trialStatus.isInTrial) {
        const newTrialStatus = { ...trialStatus, isInTrial: false };
        setTrialStatus(newTrialStatus);
        await AsyncStorage.setItem('trial_status', JSON.stringify(newTrialStatus));
      }

      setSubscriptionTier(SUBSCRIPTION_TIERS.PREMIUM);
      setSubscriptionData(newSubscriptionData);

      await Promise.all([
        AsyncStorage.setItem('subscription_tier', SUBSCRIPTION_TIERS.PREMIUM),
        AsyncStorage.setItem('subscription_data', JSON.stringify(newSubscriptionData))
      ]);

      return { success: true };
    } catch (error) {
      console.error('Subscription upgrade failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPremium = async (paymentMethodId) => {
    try {
      setLoading(true);
      
      // This would integrate with Stripe API
      // For demo purposes, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newSubscriptionData = {
        stripeCustomerId: 'cus_demo123',
        subscriptionId: 'sub_demo123',
        currentPeriodEnd: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
        cancelAtPeriodEnd: false,
        paymentMethod: paymentMethodId
      };

      // End trial if active
      if (trialStatus.isInTrial) {
        const newTrialStatus = { ...trialStatus, isInTrial: false };
        setTrialStatus(newTrialStatus);
        await AsyncStorage.setItem('trial_status', JSON.stringify(newTrialStatus));
      }

      setSubscriptionTier(SUBSCRIPTION_TIERS.PREMIUM);
      setSubscriptionData(newSubscriptionData);

      await Promise.all([
        AsyncStorage.setItem('subscription_tier', SUBSCRIPTION_TIERS.PREMIUM),
        AsyncStorage.setItem('subscription_data', JSON.stringify(newSubscriptionData))
      ]);

      Alert.alert(
        'Welcome to Premium!',
        'You now have unlimited posts, communities, and an ad-free experience!'
      );

      return { success: true };
    } catch (error) {
      console.error('Error subscribing to premium:', error);
      Alert.alert('Subscription Failed', 'There was an error processing your subscription. Please try again.');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      setLoading(true);
      
      // This would call Stripe API to cancel subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedSubscriptionData = {
        ...subscriptionData,
        cancelAtPeriodEnd: true
      };

      setSubscriptionData(updatedSubscriptionData);
      await AsyncStorage.setItem('subscription_data', JSON.stringify(updatedSubscriptionData));

      Alert.alert(
        'Subscription Cancelled',
        'Your subscription will remain active until the end of your current billing period.'
      );

      return { success: true };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      Alert.alert('Cancellation Failed', 'There was an error cancelling your subscription. Please try again.');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const getRemainingUsage = () => {
    const limits = getCurrentLimits();
    return {
      posts: Math.max(0, limits.dailyPosts - dailyUsage.posts),
      communities: Math.max(0, limits.maxCommunities - dailyUsage.joinedCommunities.length),
      isUnlimited: limits.dailyPosts === Infinity
    };
  };

  const getUpgradePrompt = (action) => {
    const effectiveTier = getEffectiveTier();
    
    if (effectiveTier === SUBSCRIPTION_TIERS.FREE) {
      return {
        title: 'Upgrade to Premium',
        message: 'Get unlimited posts and communities with our Premium subscription for just $5/month. Or watch a quick ad to unlock Free+ features!',
        actions: [
          { text: 'Watch Ad', type: 'ad' },
          { text: 'Start Free Trial', type: 'trial' },
          { text: 'Subscribe Now', type: 'subscribe' }
        ]
      };
    } else if (effectiveTier === SUBSCRIPTION_TIERS.FREE_PLUS) {
      return {
        title: 'Upgrade to Premium',
        message: 'You\'ve reached your Free+ limit. Upgrade to Premium for unlimited access and an ad-free experience!',
        actions: [
          { text: 'Start Free Trial', type: 'trial' },
          { text: 'Subscribe Now', type: 'subscribe' }
        ]
      };
    }
    
    return null;
  };

  const value = {
    // State
    subscriptionTier,
    effectiveTier: getEffectiveTier(),
    trialStatus,
    dailyUsage,
    subscriptionData,
    loading,
    
    // Limits and usage
    currentLimits: getCurrentLimits(),
    remainingUsage: getRemainingUsage(),
    
    // Actions
    canPerformAction,
    performAction,
    watchRewardedAd,
    
    // Subscription management
    startTrial,
    subscribeToPremium,
    upgradeSubscription,
    cancelSubscription,
    
    // Utilities
    getUpgradePrompt,
    
    // Constants
    SUBSCRIPTION_TIERS,
    TIER_LIMITS
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};