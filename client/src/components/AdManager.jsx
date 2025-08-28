// components/AdManager.jsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  AdMobBanner, 
  AdMobInterstitial, 
  AdMobRewarded,
  PublisherBanner,
  setTestDeviceIDAsync
} from 'expo-ads-admob';
import { useSubscription } from '../context/SubscriptionContext';
import { Colors, Typography, Spacing, BorderRadius } from '../utils/designSystem';

// Ad Unit IDs - Replace with your actual Ad Unit IDs
const AD_UNIT_IDS = {
  banner: Platform.select({
    ios: 'ca-app-pub-3940256099942544/2934735716', // Test ID
    android: 'ca-app-pub-3940256099942544/6300978111', // Test ID
  }),
  interstitial: Platform.select({
    ios: 'ca-app-pub-3940256099942544/4411468910', // Test ID
    android: 'ca-app-pub-3940256099942544/1033173712', // Test ID
  }),
  rewarded: Platform.select({
    ios: 'ca-app-pub-3940256099942544/1712485313', // Test ID
    android: 'ca-app-pub-3940256099942544/5224354917', // Test ID
  }),
};

// Initialize AdMob with test device IDs
const initializeAds = async () => {
  try {
    // Add test device IDs for development
    await setTestDeviceIDAsync('EMULATOR');
  } catch (error) {
    console.error('Error initializing ads:', error);
  }
};

// Banner Ad Component
export const BannerAd = ({ style, size = 'banner' }) => {
  const { currentLimits } = useSubscription();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeAds();
  }, []);

  if (!currentLimits.showAds) {
    return null; // Don't show ads for premium users
  }

  const handleAdLoad = () => {
    setIsLoaded(true);
    setError(null);
  };

  const handleAdError = (error) => {
    console.error('Banner ad error:', error);
    setError(error);
    setIsLoaded(false);
  };

  return (
    <View style={[styles.bannerContainer, style]}>
      {error ? (
        <View style={styles.adError}>
          <Text style={styles.adErrorText}>Ad failed to load</Text>
        </View>
      ) : (
        <AdMobBanner
          bannerSize={size}
          adUnitID={AD_UNIT_IDS.banner}
          onDidFailToReceiveAdWithError={handleAdError}
          onAdViewDidReceiveAd={handleAdLoad}
          style={styles.banner}
        />
      )}
    </View>
  );
};

// Interstitial Ad Manager
export class InterstitialAdManager {
  static isLoaded = false;
  static isLoading = false;

  static async initialize() {
    try {
      await initializeAds();
      AdMobInterstitial.setAdUnitID(AD_UNIT_IDS.interstitial);
      
      AdMobInterstitial.addEventListener('interstitialDidLoad', () => {
        this.isLoaded = true;
        this.isLoading = false;
      });

      AdMobInterstitial.addEventListener('interstitialDidFailToLoad', () => {
        this.isLoaded = false;
        this.isLoading = false;
      });

      AdMobInterstitial.addEventListener('interstitialDidOpen', () => {
        // Track ad impression
      });

      AdMobInterstitial.addEventListener('interstitialDidClose', () => {
        this.isLoaded = false;
        this.preload(); // Preload next ad
      });

      this.preload();
    } catch (error) {
      console.error('Error initializing interstitial ads:', error);
    }
  }

  static async preload() {
    if (this.isLoading || this.isLoaded) return;
    
    try {
      this.isLoading = true;
      await AdMobInterstitial.requestAdAsync();
    } catch (error) {
      console.error('Error preloading interstitial ad:', error);
      this.isLoading = false;
    }
  }

  static async show() {
    try {
      if (this.isLoaded) {
        await AdMobInterstitial.showAdAsync();
        return true;
      } else {
        console.warn('Interstitial ad not loaded');
        return false;
      }
    } catch (error) {
      console.error('Error showing interstitial ad:', error);
      return false;
    }
  }

  static removeAllListeners() {
    AdMobInterstitial.removeAllListeners();
  }
}

// Rewarded Video Ad Component
export const RewardedAdButton = ({ onReward, style, children, title = "Watch Ad for Reward" }) => {
  const { currentLimits, watchRewardedAd } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    initializeRewardedAd();
    return () => {
      AdMobRewarded.removeAllListeners();
    };
  }, []);

  const initializeRewardedAd = async () => {
    try {
      await initializeAds();
      AdMobRewarded.setAdUnitID(AD_UNIT_IDS.rewarded);

      AdMobRewarded.addEventListener('rewardedVideoDidRewardUser', handleAdRewarded);
      AdMobRewarded.addEventListener('rewardedVideoDidLoad', () => setIsAdLoaded(true));
      AdMobRewarded.addEventListener('rewardedVideoDidFailToLoad', () => setIsAdLoaded(false));
      AdMobRewarded.addEventListener('rewardedVideoDidClose', () => {
        setIsAdLoaded(false);
        preloadAd(); // Preload next ad
      });

      preloadAd();
    } catch (error) {
      console.error('Error initializing rewarded ad:', error);
    }
  };

  const preloadAd = async () => {
    try {
      await AdMobRewarded.requestAdAsync();
    } catch (error) {
      console.error('Error preloading rewarded ad:', error);
    }
  };

  const handleAdRewarded = async (reward) => {
    try {
      // Use the subscription context to handle the reward
      const result = await watchRewardedAd();
      if (result.success && onReward) {
        onReward(reward);
      }
    } catch (error) {
      console.error('Error handling ad reward:', error);
    }
  };

  const handleWatchAd = async () => {
    if (!currentLimits.canWatchRewardedAds) {
      Alert.alert('Not Available', 'Rewarded ads are not available for your current plan.');
      return;
    }

    if (!isAdLoaded) {
      Alert.alert('Ad Not Ready', 'Please try again in a moment.');
      return;
    }

    setIsLoading(true);
    try {
      await AdMobRewarded.showAdAsync();
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      Alert.alert('Error', 'Failed to show ad. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentLimits.canWatchRewardedAds) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.rewardedButton, style]}
      onPress={handleWatchAd}
      disabled={isLoading || !isAdLoaded}
      activeOpacity={0.7}
    >
      <View style={styles.rewardedButtonContent}>
        <Ionicons 
          name="play" 
          size={20} 
          color={isAdLoaded ? Colors.primary[500] : Colors.text.tertiary} 
        />
        <Text style={[
          styles.rewardedButtonText,
          !isAdLoaded && styles.rewardedButtonTextDisabled
        ]}>
          {isLoading ? 'Loading...' : (isAdLoaded ? title : 'Ad Loading...')}
        </Text>
      </View>
      {children}
    </TouchableOpacity>
  );
};

// Smart Ad Placement Component
export const AdPlacement = ({ type = 'banner', placement, onAdShown, ...props }) => {
  const { currentLimits } = useSubscription();

  // Don't show ads for premium users
  if (!currentLimits.showAds) {
    return null;
  }

  switch (type) {
    case 'banner':
      return <BannerAd {...props} />;
    case 'rewarded':
      return <RewardedAdButton {...props} />;
    default:
      return null;
  }
};

// Ad-Free Upgrade Prompt
export const AdFreeUpgradePrompt = ({ onUpgrade, style }) => {
  const { currentLimits } = useSubscription();

  if (!currentLimits.showAds) {
    return null;
  }

  return (
    <View style={[styles.upgradePrompt, style]}>
      <View style={styles.upgradePromptContent}>
        <Ionicons name="diamond" size={24} color={Colors.accent[500]} />
        <View style={styles.upgradePromptText}>
          <Text style={styles.upgradePromptTitle}>Go Ad-Free</Text>
          <Text style={styles.upgradePromptSubtitle}>
            Remove ads and unlock unlimited features with Premium
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.upgradePromptButton}
          onPress={onUpgrade}
        >
          <Text style={styles.upgradePromptButtonText}>Upgrade</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral[50],
    minHeight: 50,
  },
  banner: {
    width: '100%',
  },
  adError: {
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adErrorText: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
  },
  rewardedButton: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  rewardedButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardedButtonText: {
    ...Typography.styles.bodyMedium,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.semibold,
    marginLeft: Spacing.sm,
  },
  rewardedButtonTextDisabled: {
    color: Colors.text.tertiary,
  },
  upgradePrompt: {
    backgroundColor: Colors.accent[25],
    borderWidth: 1,
    borderColor: Colors.accent[200],
    borderRadius: BorderRadius.md,
    margin: Spacing.lg,
    padding: Spacing.lg,
  },
  upgradePromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradePromptText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  upgradePromptTitle: {
    ...Typography.styles.bodyMedium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.accent[700],
    marginBottom: Spacing.xs,
  },
  upgradePromptSubtitle: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
  },
  upgradePromptButton: {
    backgroundColor: Colors.accent[500],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  upgradePromptButtonText: {
    ...Typography.styles.bodySmall,
    color: Colors.background.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
});

export default {
  BannerAd,
  RewardedAdButton,
  AdPlacement,
  AdFreeUpgradePrompt,
  InterstitialAdManager
};