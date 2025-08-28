// components/BadgeGiftingModal.js - Enhanced badge gifting system
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input } from './index';
import { Colors, Typography, Spacing, BorderRadius } from '../utils/designSystem';

const BadgeGiftingModal = ({ visible, targetUser, onClose }) => {
  const { user, giftBadge } = useAuth();
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState('select'); // 'select' or 'message'

  if (!visible) return null;

  // Predefined badges that users can gift
  const giftableBadges = [
    {
      id: 'motivator',
      name: 'Motivator',
      description: 'For being incredibly motivating',
      icon: 'trending-up',
      color: Colors.success[500],
      cost: 50
    },
    {
      id: 'helpful',
      name: 'Super Helper',
      description: 'Always there to help others',
      icon: 'hand-right',
      color: Colors.primary[500],
      cost: 30
    },
    {
      id: 'inspiring',
      name: 'Inspiring',
      description: 'Your journey inspires others',
      icon: 'bulb',
      color: Colors.warning[500],
      cost: 40
    },
    {
      id: 'consistent',
      name: 'Consistency King',
      description: 'Never gives up, always shows up',
      icon: 'checkmark-done-circle',
      color: Colors.success[600],
      cost: 60
    },
    {
      id: 'creative',
      name: 'Creative Genius',
      description: 'Thinks outside the box',
      icon: 'color-palette',
      color: Colors.secondary[500],
      cost: 45
    },
    {
      id: 'supportive',
      name: 'Community Supporter',
      description: 'Always lifting others up',
      icon: 'people',
      color: Colors.primary[600],
      cost: 35
    },
    {
      id: 'dedicated',
      name: 'Dedicated Achiever',
      description: 'Laser-focused on goals',
      icon: 'target',
      color: Colors.error[500],
      cost: 55
    },
    {
      id: 'wise',
      name: 'Wise Mentor',
      description: 'Shares valuable wisdom',
      icon: 'library',
      color: Colors.neutral[600],
      cost: 70
    }
  ];

  const handleBadgeSelect = (badge) => {
    if (user.points < badge.cost) {
      Alert.alert('Insufficient Points', `You need ${badge.cost} points to gift this badge. You have ${user.points} points.`);
      return;
    }
    setSelectedBadge(badge);
    setStep('message');
  };

  const handleSendGift = () => {
    if (!message.trim()) {
      Alert.alert('Message Required', 'Please add a personal message with your gift.');
      return;
    }

    giftBadge(targetUser.username, selectedBadge.name, message.trim(), selectedBadge.cost);
    
    Alert.alert(
      'Badge Sent! 🎉',
      `You gifted "${selectedBadge.name}" to @${targetUser.username} for ${selectedBadge.cost} points.`,
      [{ text: 'Great!', onPress: onClose }]
    );
  };

  const BadgeOption = ({ badge }) => {
    const canAfford = user.points >= badge.cost;
    
    return (
      <TouchableOpacity
        style={[styles.badgeOption, !canAfford && styles.badgeOptionDisabled]}
        onPress={() => handleBadgeSelect(badge)}
        disabled={!canAfford}
      >
        <Card style={[styles.badgeCard, !canAfford && styles.badgeCardDisabled]}>
          <View style={[styles.badgeIcon, { backgroundColor: `${badge.color}20` }]}>
            <Ionicons name={badge.icon} size={32} color={badge.color} />
          </View>
          
          <View style={styles.badgeInfo}>
            <Text style={[styles.badgeName, !canAfford && styles.badgeNameDisabled]}>
              {badge.name}
            </Text>
            <Text style={styles.badgeDescription}>{badge.description}</Text>
            
            <View style={styles.badgeCost}>
              <Ionicons name="diamond" size={14} color={Colors.primary[500]} />
              <Text style={[styles.costText, !canAfford && styles.costTextDisabled]}>
                {badge.cost} points
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.overlay}>
      <Card style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {step === 'select' ? 'Choose a Badge' : 'Add a Message'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {step === 'select' && (
          <>
            <Text style={styles.subtitle}>
              Gift a badge to @{targetUser.username} to show your appreciation!
            </Text>
            
            <View style={styles.pointsInfo}>
              <Ionicons name="diamond" size={16} color={Colors.primary[500]} />
              <Text style={styles.pointsText}>You have {user.points} points</Text>
            </View>

            <ScrollView style={styles.badgesContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.badgesGrid}>
                {giftableBadges.map(badge => (
                  <BadgeOption key={badge.id} badge={badge} />
                ))}
              </View>
            </ScrollView>
          </>
        )}

        {step === 'message' && selectedBadge && (
          <>
            <View style={styles.selectedBadgePreview}>
              <View style={[styles.selectedBadgeIcon, { backgroundColor: `${selectedBadge.color}20` }]}>
                <Ionicons name={selectedBadge.icon} size={40} color={selectedBadge.color} />
              </View>
              <View style={styles.selectedBadgeInfo}>
                <Text style={styles.selectedBadgeName}>{selectedBadge.name}</Text>
                <Text style={styles.selectedBadgeRecipient}>For @{targetUser.username}</Text>
              </View>
            </View>

            <Input
              label="Personal Message"
              placeholder="Write an encouraging message..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              maxLength={200}
              style={styles.messageInput}
            />

            <View style={styles.actions}>
              <Button
                title="Back"
                variant="outline"
                onPress={() => {
                  setStep('select');
                  setSelectedBadge(null);
                  setMessage('');
                }}
                style={styles.actionButton}
              />
              <Button
                title={`Send (${selectedBadge.cost} pts)`}
                onPress={handleSendGift}
                disabled={!message.trim()}
                style={styles.actionButton}
              />
            </View>
          </>
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    zIndex: 1000,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: Spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.styles.h3,
  },
  subtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  pointsText: {
    ...Typography.styles.body,
    color: Colors.primary[700],
    fontWeight: Typography.fontWeight.semibold,
  },
  badgesContainer: {
    maxHeight: 300,
  },
  badgesGrid: {
    gap: Spacing.md,
  },
  badgeOption: {
    marginBottom: Spacing.sm,
  },
  badgeOptionDisabled: {
    opacity: 0.5,
  },
  badgeCard: {
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  badgeCardDisabled: {
    backgroundColor: Colors.neutral[50],
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  badgeNameDisabled: {
    color: Colors.text.tertiary,
  },
  badgeDescription: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  badgeCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  costText: {
    ...Typography.styles.caption,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.semibold,
  },
  costTextDisabled: {
    color: Colors.text.tertiary,
  },
  selectedBadgePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.accent,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing['2xl'],
  },
  selectedBadgeIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  selectedBadgeInfo: {
    flex: 1,
  },
  selectedBadgeName: {
    ...Typography.styles.h4,
    marginBottom: Spacing.xs,
  },
  selectedBadgeRecipient: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
  },
  messageInput: {
    marginBottom: Spacing['2xl'],
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});

export default BadgeGiftingModal;