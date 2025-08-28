// App.js - Main Application Entry Point with Modern Navigation
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from './src/utils/designSystem';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CommunitiesScreen from './src/screens/CommunitiesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';

// Import context
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { AppStripeProvider } from './src/services/StripeService';

const MainApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [navigationParams, setNavigationParams] = useState({});
  const { user } = useAuth();
  
  const navigate = (screenName, params = {}) => {
    setCurrentScreen(screenName);
    setNavigationParams(params);
  };
  const [tabAnimations] = useState({
    home: new Animated.Value(1),
    communities: new Animated.Value(0.6),
    profile: new Animated.Value(0.6),
    settings: new Animated.Value(0.6),
  });
  
  const navigateToScreen = (screenName) => {
    setCurrentScreen(screenName);
    
    // Animate tab transitions
    Object.keys(tabAnimations).forEach(tab => {
      Animated.timing(tabAnimations[tab], {
        toValue: tab === screenName ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const TabButton = ({ screenKey, icon, activeIcon, label, onPress }) => {
    const isActive = currentScreen === screenKey;
    
    return (
      <TouchableOpacity 
        style={styles.tabButton} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Animated.View 
          style={[
            styles.tabIconContainer,
            isActive && styles.tabIconContainerActive,
            {
              transform: [{ scale: tabAnimations[screenKey] }]
            }
          ]}
        >
          <Ionicons 
            name={isActive ? activeIcon : icon} 
            size={22} 
            color={isActive ? Colors.primary[500] : Colors.text.tertiary} 
          />
        </Animated.View>
        
        <Text style={[
          styles.tabLabel, 
          isActive && styles.tabLabelActive
        ]}>
          {label}
        </Text>
        
        {isActive && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
      
      {/* Screen Content */}
      <View style={styles.screenContainer}>
        {currentScreen === 'home' && <HomeScreen navigation={{ navigate }} />}
        {currentScreen === 'profile' && <ProfileScreen navigation={{ navigate }} />}
        {currentScreen === 'communities' && <CommunitiesScreen navigation={{ navigate }} />}
        {currentScreen === 'settings' && <SettingsScreen navigation={{ navigate }} />}
        {currentScreen === 'subscription' && <SubscriptionScreen navigation={{ navigate, goBack: () => navigate('settings') }} />}
      </View>
      
      {/* Modern Bottom Navigation - Hide for subscription screen */}
      {currentScreen !== 'subscription' && (
        <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TabButton
            screenKey="home"
            icon="home-outline"
            activeIcon="home"
            label="Feed"
            onPress={() => navigateToScreen('home')}
          />
          
          <TabButton
            screenKey="communities"
            icon="people-outline"
            activeIcon="people"
            label="Communities"
            onPress={() => navigateToScreen('communities')}
          />
          
          <TabButton
            screenKey="profile"
            icon="person-outline"
            activeIcon="person"
            label="Profile"
            onPress={() => navigateToScreen('profile')}
          />
          
          <TabButton
            screenKey="settings"
            icon="settings-outline"
            activeIcon="settings"
            label="Settings"
            onPress={() => navigateToScreen('settings')}
          />
        </View>
        </View>
      )}
    </View>
  );
};

export default function App() {
  return (
    <AppStripeProvider>
      <NotificationProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <MainApp />
          </SubscriptionProvider>
        </AuthProvider>
      </NotificationProvider>
    </AppStripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  screenContainer: {
    flex: 1,
  },
  bottomNavContainer: {
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    ...Shadows.sm,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    position: 'relative',
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  tabIconContainerActive: {
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.xl,
  },
  tabLabel: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
    fontWeight: Typography.fontWeight.medium,
  },
  tabLabelActive: {
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.semibold,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -Spacing.sm,
    width: 4,
    height: 4,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.primary[500],
  },
});