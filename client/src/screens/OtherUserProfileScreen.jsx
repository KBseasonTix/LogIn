// screens/OtherUserProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';

const OtherUserProfileScreen = ({ route }) => {
  const { userId } = route.params;
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGiftModal, setShowGiftModal] = useState(false);
  
  // Mock data for demo
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        
        // In real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock user data
        const mockUser = {
          id: 'user2',
          username: 'sarah_fit',
          profilePic: null,
          points: 1850,
          statusTier: 'on-track',
          goals: [
            { 
              id: '1', 
              description: 'Run a 5K', 
              targetDate: '2023-11-30', 
              currentProgress: 75,
              communityId: '1'
            },
            { 
              id: '2', 
              description: 'Improve running pace', 
              targetDate: '2024-01-15', 
              currentProgress: 30,
              communityId: '1'
            }
          ],
          badges: [
            { id: '1', name: 'First 5K', count: 1 },
            { id: '2', name: 'Consistent Runner', count: 2 },
            { id: '3', name: 'Community Helper', count: 1 }
          ],
          joinedCommunities: [
            { 
              communityId: '1', 
              name: 'Weight Loss LockIn', 
              communityPoints: 1200,
              badgesEarned: [
                { badgeId: 'badge1', earnedDate: new Date() },
                { badgeId: 'badge2', earnedDate: new Date() }
              ]
            }
          ]
        };
        
        setProfileUser(mockUser);
      } catch (error) {
        Alert.alert('Error', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [userId]);
  
  const getStatusTierInfo = (tierId) => {
    const tiers = [
      { id: 'just-starting', name: 'Just Getting Started', color: '#4CAF50' },
      { id: 'rookie', name: 'Rookie', color: '#8BC34A' },
      { id: 'on-track', name: 'On The Right Track', color: '#FFC107' },
      { id: 'big-progress', name: 'Big Progress', color: '#FF9800' },
      { id: 'final-hurdle', name: 'Final Hurdle', color: '#F44336' }
    ];
    
    return tiers.find(t => t.id === tierId) || tiers[0];
  };
  
  const CircularProgress = ({ progress, size = 60, strokeWidth = 4, color = '#4CAF50' }) => {
    const radius = (size / 2) - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    
    return (
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
          strokeLinecap="round"
        />
        <Text
          x={size / 2}
          y={size / 2}
          fontSize="12"
          fill="#333"
          textAnchor="middle"
          alignmentBaseline="central"
        >
          {progress}%
        </Text>
      </Svg>
    );
  };
  
  const GiftBadgeModal = ({ visible, onClose, onGift }) => {
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [message, setMessage] = useState('');
    
    if (!currentUser) return null;
    
    const availableBadges = currentUser.badges.filter(badge => badge.count > 0);
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Gift a Badge</Text>
            
            <Text style={styles.modalSubtitle}>Select a badge to gift:</Text>
            
            {availableBadges.length === 0 ? (
              <View style={styles.emptyBadges}>
                <Ionicons name="gift-outline" size={48} color="#666" />
                <Text style={styles.emptyText}>You don't have any badges to gift</Text>
                <Text style={styles.emptySubtext}>Earn badges by completing goals and helping others</Text>
              </View>
            ) : (
              <ScrollView style={styles.badgeList}>
                {availableBadges.map(badge => (
                  <TouchableOpacity
                    key={badge.id}
                    style={[
                      styles.badgeItem,
                      selectedBadge === badge.id && styles.selectedBadge
                    ]}
                    onPress={() => setSelectedBadge(badge.id)}
                  >
                    <View style={styles.badgeIcon}>
                      <Text style={styles.badgeEmoji}>🏆</Text>
                    </View>
                    <View style={styles.badgeInfo}>
                      <Text style={styles.badgeName}>{badge.name}</Text>
                      <Text style={styles.badgeCount}>x{badge.count}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            
            {selectedBadge && (
              <>
                <Text style={styles.modalSubtitle}>Add a message (optional):</Text>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Great job on your progress!"
                  value={message}
                  onChangeText={setMessage}
                  maxLength={50}
                  multiline
                  numberOfLines={3}
                />
                <Text style={styles.charCount}>{message.length}/50</Text>
              </>
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={onClose}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  if (selectedBadge) {
                    onGift(selectedBadge, message);
                    onClose();
                  }
                }}
                disabled={!selectedBadge}
              >
                <Text style={styles.confirmButtonText}>Send Gift</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="sync" size={24} color="#4CAF50" style={styles.loadingIcon} />
        <Text>Loading profile...</Text>
      </View>
    );
  }
  
  if (!profileUser) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF5252" />
        <Text style={styles.errorText}>Profile not found</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {/* Retry logic */}}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const tierInfo = getStatusTierInfo(profileUser.statusTier);
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <CircularProgress 
            progress={Math.round(profileUser.goals.reduce((sum, goal) => sum + goal.currentProgress, 0) / profileUser.goals.length)} 
            size={100} 
            strokeWidth={6} 
            color={tierInfo.color} 
          />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profileUser.username.charAt(0).toUpperCase()}</Text>
          </View>
        </View>
        
        <Text style={styles.username}>{profileUser.username}</Text>
        
        <View style={styles.tierContainer}>
          <View style={[styles.tierBadge, { backgroundColor: tierInfo.color + '20' }]}>
            <Text style={[styles.tierIcon, { color: tierInfo.color }]}>{tierInfo.icon || '🌟'}</Text>
            <Text style={[styles.tierName, { color: tierInfo.color }]}>{tierInfo.name}</Text>
          </View>
          <Text style={styles.pointsText}>{profileUser.points} points</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profileUser.goals.filter(g => g.completed).length}</Text>
            <Text style={styles.statLabel}>Goals Completed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profileUser.badges.length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profileUser.joinedCommunities.length}</Text>
            <Text style={styles.statLabel}>Communities</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goals Progress</Text>
        
        {profileUser.goals.map(goal => (
          <View key={goal.id} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>{goal.description}</Text>
              <View style={styles.goalCommunity}>
                <Ionicons name="people" size={14} color="#666" />
                <Text style={styles.communityName}>
                  {profileUser.joinedCommunities.find(c => c.communityId === goal.communityId)?.name || 'Community'}
                </Text>
              </View>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${goal.currentProgress}%`,
                      backgroundColor: tierInfo.color 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{goal.currentProgress}% complete</Text>
            </View>
            
            <View style={styles.goalStats}>
              <View style={styles.statItem}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.statText}>Ends {new Date(goal.targetDate).toLocaleDateString()}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All ({profileUser.badges.length})</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
          {profileUser.badges.map((badge, index) => (
            <View key={index} style={styles.badgePill}>
              <Text style={styles.badgeEmoji}>🏆</Text>
              <Text style={styles.badgePillText}>{badge.name}</Text>
              <Text style={styles.badgeCountPill}>x{badge.count}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Community Progress</Text>
        
        {profileUser.joinedCommunities.map(community => (
          <View key={community.communityId} style={styles.communityProgressCard}>
            <View style={styles.communityHeader}>
              <Text style={styles.communityName}>{community.name}</Text>
              <Text style={styles.communityPoints}>{community.communityPoints} pts</Text>
            </View>
            
            <View style={styles.communityBadges}>
              <Text style={styles.badgesLabel}>Community Badges:</Text>
              <View style={styles.badgeIcons}>
                {community.badgesEarned.map((badge, index) => (
                  <View key={index} style={styles.communityBadgeIcon}>
                    <Text style={styles.badgeEmoji}>🏅</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </View>
      
      {currentUser.id !== profileUser.id && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Feature Coming Soon', 'Messaging will be available in a future update')}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowGiftModal(true)}
          >
            <Ionicons name="gift-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Gift Badge</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <GiftBadgeModal 
        visible={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        onGift={(badgeId, message) => {
          Alert.alert(
            'Badge Gifted!',
            `You've gifted a badge to ${profileUser.username}!`,
            [{ text: 'OK', onPress: () => setShowGiftModal(false) }]
          );
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  tierContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 4,
  },
  tierIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  tierName: {
    fontSize: 14,
    fontWeight: '600',
  },
  pointsText: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 5,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    color: '#333',
  },
  goalCommunity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  communityName: {
    fontSize: 12,
    color: '#333',
    marginLeft: 4,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  badgesScroll: {
    paddingVertical: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
  },
  badgeEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  badgePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
  badgeCountPill: {
    fontSize: 12,
    color: '#666',
  },
  communityProgressCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  communityPoints: {
    fontWeight: '600',
    color: '#4CAF50',
  },
  communityBadges: {
    marginTop: 8,
  },
  badgesLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  badgeIcons: {
    flexDirection: 'row',
  },
  communityBadgeIcon: {
    marginRight: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 12,
    color: '#333',
  },
  badgeList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  selectedBadge: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeEmoji: {
    fontSize: 20,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  badgeCount: {
    fontSize: 14,
    color: '#666',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#888',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyBadges: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 8,
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    marginBottom: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
    color: '#FF5252',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default OtherUserProfileScreen;