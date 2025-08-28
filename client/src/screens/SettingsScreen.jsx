import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/designSystem';

const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { 
    subscriptionTier, 
    effectiveTier, 
    trialStatus, 
    subscriptionData,
    currentLimits,
    remainingUsage,
    cancelSubscription
  } = useSubscription();
  
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const handleUpgrade = () => {
    navigation?.navigate('Subscription');
  };

  const handleManageSubscription = () => {
    Alert.alert(
      'Manage Subscription',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View Details', onPress: () => navigation?.navigate('Subscription') },
        { 
          text: 'Cancel Subscription', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Cancel Subscription',
              'Are you sure you want to cancel your Premium subscription? You\'ll lose access to premium features.',
              [
                { text: 'Keep Premium', style: 'cancel' },
                { 
                  text: 'Cancel Subscription', 
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await cancelSubscription();
                    } catch (error) {
                      Alert.alert('Error', 'Failed to cancel subscription');
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const SettingsItem = ({ icon, title, subtitle, onPress, rightComponent }) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsIcon}>
        <Ionicons name={icon} size={24} color={Colors.primary[500]} />
      </View>
      <View style={styles.settingsContent}>
        <Text style={styles.settingsTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent || <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      {user && (
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={[
              styles.subscriptionBadge, 
              subscriptionTier === 'premium' && styles.premiumBadge
            ]}>
              <Ionicons 
                name={subscriptionTier === 'premium' ? 'diamond' : effectiveTier === 'free_plus' ? 'play' : 'person'} 
                size={14} 
                color={Colors.text.inverse} 
              />
              <Text style={styles.subscriptionText}>
                {subscriptionTier === 'premium' ? 'Premium' : 
                 effectiveTier === 'free_plus' ? 'Free+' : 'Free'}
              </Text>
              {trialStatus.isInTrial && (
                <Text style={styles.trialText}>
                  • {trialStatus.daysRemaining}d left
                </Text>
              )}
            </View>
            
            {/* Usage Stats */}
            {subscriptionTier !== 'premium' && (
              <View style={styles.usageStats}>
                <Text style={styles.usageStatsText}>
                  {remainingUsage.posts} posts, {remainingUsage.communities} communities left today
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <SettingsItem
          icon="person-outline"
          title="Edit Profile"
          subtitle="Update your personal information"
          onPress={() => Alert.alert('Feature Coming Soon', 'Profile editing will be available soon')}
        />
        
        {/* Subscription Management */}
        {subscriptionTier === 'premium' ? (
          <SettingsItem
            icon="diamond"
            title="Premium Subscription"
            subtitle={
              trialStatus.isInTrial 
                ? `Free trial • ${trialStatus.daysRemaining} days remaining`
                : subscriptionData.cancelAtPeriodEnd 
                ? 'Cancelled • Active until end of period'
                : 'Active subscription'
            }
            onPress={handleManageSubscription}
          />
        ) : (
          <SettingsItem
            icon="star-outline"
            title="Upgrade to Premium"
            subtitle="Unlimited posts, communities, and ad-free experience"
            onPress={handleUpgrade}
          />
        )}
        
        {/* Current Plan Details */}
        <SettingsItem
          icon="information-circle-outline"
          title="Current Plan Details"
          subtitle={`${effectiveTier === 'premium' ? 'Premium' : effectiveTier === 'free_plus' ? 'Free+' : 'Free'} • ${subscriptionTier === 'premium' ? 'Unlimited everything' : `${currentLimits.dailyPosts} daily posts, ${currentLimits.maxCommunities} communities`}`}
          onPress={() => navigation?.navigate('Subscription')}
        />
        
        <SettingsItem
          icon="shield-checkmark-outline"
          title="Privacy & Security"
          subtitle="Manage your privacy settings"
          onPress={() => Alert.alert('Feature Coming Soon', 'Privacy settings will be available soon')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <SettingsItem
          icon="notifications-outline"
          title="Push Notifications"
          subtitle="Get notified about community updates"
          rightComponent={
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              thumbColor={Colors.primary[500]}
            />
          }
        />
        
        <SettingsItem
          icon="moon-outline"
          title="Dark Mode"
          subtitle="Toggle dark theme"
          rightComponent={
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              thumbColor={Colors.primary[500]}
            />
          }
        />
        
        <SettingsItem
          icon="sync-outline"
          title="Auto Sync"
          subtitle="Automatically sync your progress"
          rightComponent={
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              thumbColor={Colors.primary[500]}
            />
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <SettingsItem
          icon="help-circle-outline"
          title="Help & FAQ"
          subtitle="Get help and find answers"
          onPress={() => Alert.alert('Feature Coming Soon', 'Help center will be available soon')}
        />
        
        <SettingsItem
          icon="chatbubble-outline"
          title="Contact Support"
          subtitle="Get in touch with our team"
          onPress={() => Alert.alert('Feature Coming Soon', 'Contact support will be available soon')}
        />
        
        <SettingsItem
          icon="information-circle-outline"
          title="About"
          subtitle="App version and information"
          onPress={() => Alert.alert('About', 'Fitness Goal Tracker v1.0.0\n\nA community-based goal tracking app to help you achieve your fitness and personal goals.')}
        />
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={Colors.error[500]} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    paddingTop: 50,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    ...Typography.styles.h2,
    marginBottom: Spacing.xl,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  avatarText: {
    ...Typography.styles.h3,
    color: Colors.text.inverse,
  },
  username: {
    ...Typography.styles.h4,
  },
  email: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
  },
  subscriptionText: {
    ...Typography.styles.caption,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.semibold,
    marginLeft: Spacing.xs,
  },
  premiumBadge: {
    backgroundColor: Colors.accent[500],
  },
  trialText: {
    ...Typography.styles.caption,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.normal,
    marginLeft: Spacing.xs,
  },
  usageStats: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  usageStatsText: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
  },
  section: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  sectionTitle: {
    ...Typography.styles.h4,
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  settingsIcon: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
  },
  settingsSubtitle: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.error[500],
    ...Shadows.sm,
  },
  logoutText: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.error[500],
    marginLeft: Spacing.sm,
  },
});

export default SettingsScreen;