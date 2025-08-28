// AdMob Configuration for LogIn App
import { Platform } from 'react-native';

export const AdMobConfig = {
  // App IDs
  appIds: {
    ios: 'ca-app-pub-2058319813855923~4856464524',
    android: 'ca-app-pub-2058319813855923~9410501796'
  },

  // Ad Unit IDs
  adUnitIds: {
    // Android Ad Units
    android: {
      banner: 'ca-app-pub-2058319813855923/7538468182',
      rewarded: 'ca-app-pub-2058319813855923/8991699395',
      // Note: You provided banner ID as unit ID, using rewarded for consistency
    },
    
    // iOS Ad Units  
    ios: {
      rewarded: 'ca-app-pub-2058319813855923/6042102421',
      interstitial: 'ca-app-pub-2058319813855923/7008502069'
    }
  },

  // Test Ad Unit IDs (use during development)
  testAdUnitIds: {
    android: {
      banner: 'ca-app-pub-3940256099942544/6300978111',
      rewarded: 'ca-app-pub-3940256099942544/5224354917',
      interstitial: 'ca-app-pub-3940256099942544/1033173712'
    },
    ios: {
      banner: 'ca-app-pub-3940256099942544/2934735716', 
      rewarded: 'ca-app-pub-3940256099942544/1712485313',
      interstitial: 'ca-app-pub-3940256099942544/4411468910'
    }
  },

  // Helper functions
  getBannerAdUnitId: (useTestAds = __DEV__) => {
    const platform = Platform.OS;
    if (useTestAds) {
      return AdMobConfig.testAdUnitIds[platform]?.banner;
    }
    return AdMobConfig.adUnitIds[platform]?.banner;
  },

  getRewardedAdUnitId: (useTestAds = __DEV__) => {
    const platform = Platform.OS;
    if (useTestAds) {
      return AdMobConfig.testAdUnitIds[platform]?.rewarded;
    }
    return AdMobConfig.adUnitIds[platform]?.rewarded;
  },

  getInterstitialAdUnitId: (useTestAds = __DEV__) => {
    const platform = Platform.OS;
    if (useTestAds) {
      return AdMobConfig.testAdUnitIds[platform]?.interstitial;
    }
    return AdMobConfig.adUnitIds[platform]?.interstitial;
  },

  // Rewarded ad settings
  rewardedAdSettings: {
    pointsPerAd: 100,
    maxAdsPerDay: 10,
    cooldownMinutes: 5
  }
};

export default AdMobConfig;