import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
// import { RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { useAuth } from '../context/AuthContext';
import { AdMobConfig } from '../config/admob';
import { designSystem } from '../utils/designSystem';

const RewardedAdButton = ({ onRewardEarned, buttonText = "Watch Ad for 100 Points", disabled = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [rewardedAd, setRewardedAd] = useState(null);
  const { user, updateUserPoints } = useAuth();

  useEffect(() => {
    // Temporarily disable AdMob for initial testing
    // setTimeout(() => setAdLoaded(true), 1000);
  }, []);

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

  const showRewardedAd = async () => {
    try {
      setIsLoading(true);

      if (!adLoaded || !rewardedAd) {
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

      // Demo mode - simulate ad watch
      Alert.alert(
        '🎬 Demo Ad Played',
        'In production, this would show a real rewarded ad!',
        [{ 
          text: 'Collect Reward', 
          onPress: () => {
            handleRewardEarned({ type: 'demo', amount: 100 });
          }
        }]
      );

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
  
  // For demo, always show as loaded
  const demoAdLoaded = true;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.adButton,
          (disabled || !canWatchAds || !demoAdLoaded) && styles.disabledButton,
          isLoading && styles.loadingButton
        ]}
        onPress={showRewardedAd}
        disabled={disabled || isLoading || !canWatchAds}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.adButtonText}>{buttonText}</Text>
            {!demoAdLoaded && (
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