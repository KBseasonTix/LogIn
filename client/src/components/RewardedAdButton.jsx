import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { AdMobRewarded } from 'expo-ads-admob';
import { useAuth } from '../context/AuthContext';
import { AdMobConfig } from '../config/admob';
import { designSystem } from '../utils/designSystem';

const RewardedAdButton = ({ onRewardEarned, buttonText = "Watch Ad for 100 Points", disabled = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const { user, updateUserPoints } = useAuth();

  useEffect(() => {
    loadRewardedAd();
    return () => {
      // Cleanup
      AdMobRewarded.removeAllListeners();
    };
  }, []);

  const loadRewardedAd = async () => {
    try {
      const adUnitId = AdMobConfig.getRewardedAdUnitId();
      
      // Set up event listeners
      AdMobRewarded.addEventListener('rewardedVideoUserDidEarnReward', handleRewardEarned);
      AdMobRewarded.addEventListener('rewardedVideoDidLoad', () => setAdLoaded(true));
      AdMobRewarded.addEventListener('rewardedVideoDidFailToLoad', handleAdFailedToLoad);
      AdMobRewarded.addEventListener('rewardedVideoDidClose', handleAdClosed);

      // Request ad
      await AdMobRewarded.setAdUnitID(adUnitId);
      await AdMobRewarded.requestAdAsync();
      
    } catch (error) {
      console.error('Failed to load rewarded ad:', error);
      handleAdFailedToLoad();
    }
  };

  const handleRewardEarned = async (reward) => {
    try {
      console.log('Reward earned:', reward);
      
      // Add points to user account
      const pointsEarned = AdMobConfig.rewardedAdSettings.pointsPerAd;
      await updateUserPoints(pointsEarned);
      
      // Show success message
      Alert.alert(
        '🎉 Reward Earned!',
        `You earned ${pointsEarned} points! Use them to gift badges to other users.`,
        [{ text: 'Awesome!' }]
      );

      // Notify parent component
      if (onRewardEarned) {
        onRewardEarned(pointsEarned);
      }

      // Reload ad for next time
      setAdLoaded(false);
      loadRewardedAd();
      
    } catch (error) {
      console.error('Failed to process reward:', error);
      Alert.alert('Error', 'Failed to add points. Please try again.');
    }
  };

  const handleAdFailedToLoad = () => {
    console.warn('Rewarded ad failed to load');
    setAdLoaded(false);
    setIsLoading(false);
    
    // Retry loading after delay
    setTimeout(() => {
      loadRewardedAd();
    }, 30000); // Retry after 30 seconds
  };

  const handleAdClosed = () => {
    setIsLoading(false);
    // Ad closed, load new ad for next time
    if (!adLoaded) {
      loadRewardedAd();
    }
  };

  const showRewardedAd = async () => {
    try {
      setIsLoading(true);

      if (!adLoaded) {
        Alert.alert(
          'Ad Not Ready',
          'Please wait a moment while we prepare your ad.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }

      // Check if user has reached daily limit
      const today = new Date().toDateString();
      const userAdData = user.dailyAds || {};
      const todayAds = userAdData[today] || 0;
      
      if (todayAds >= AdMobConfig.rewardedAdSettings.maxAdsPerDay) {
        Alert.alert(
          'Daily Limit Reached',
          `You've watched the maximum ${AdMobConfig.rewardedAdSettings.maxAdsPerDay} ads for today. Come back tomorrow!`,
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }

      // Show the ad
      const isReady = await AdMobRewarded.getIsReadyAsync();
      if (isReady) {
        await AdMobRewarded.showAdAsync();
        setAdLoaded(false); // Mark as used
      } else {
        throw new Error('Ad not ready');
      }

    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
      Alert.alert(
        'Ad Unavailable',
        'Sorry, no ads are available right now. Please try again later.',
        [{ text: 'OK' }]
      );
      setIsLoading(false);
    }
  };

  const getUserAdCount = () => {
    const today = new Date().toDateString();
    const userAdData = user.dailyAds || {};
    return userAdData[today] || 0;
  };

  const remainingAds = AdMobConfig.rewardedAdSettings.maxAdsPerDay - getUserAdCount();
  const canWatchAds = remainingAds > 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.adButton,
          (disabled || !canWatchAds || !adLoaded) && styles.disabledButton,
          isLoading && styles.loadingButton
        ]}
        onPress={showRewardedAd}
        disabled={disabled || isLoading || !canWatchAds || !adLoaded}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.adButtonText}>{buttonText}</Text>
            {!adLoaded && (
              <Text style={styles.loadingText}>Loading ad...</Text>
            )}
          </>
        )}
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {canWatchAds 
            ? `${remainingAds} ads remaining today`
            : 'Daily ad limit reached'
          }
        </Text>
        <Text style={styles.pointsText}>
          Current points: {user.points || 0}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16
  },
  adButton: {
    backgroundColor: designSystem.colors.accent[500],
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  disabledButton: {
    backgroundColor: designSystem.colors.neutral[300],
    opacity: 0.6
  },
  loadingButton: {
    opacity: 0.8
  },
  adButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8
  },
  infoContainer: {
    marginTop: 12,
    alignItems: 'center'
  },
  infoText: {
    fontSize: 14,
    color: designSystem.colors.neutral[600],
    textAlign: 'center'
  },
  pointsText: {
    fontSize: 16,
    color: designSystem.colors.primary[600],
    fontWeight: 'bold',
    marginTop: 4
  }
});

export default RewardedAdButton;