// screens/CommunityScreen.js (Updated)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const CommunityScreen = ({ route }) => {
  const { communityId } = route.params;
  const { user, updateProfile } = useAuth();
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  
  // Mock data for demo
  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        setLoading(true);
        
        // In real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock community data
        const mockCommunity = {
          id: '1',
          name: 'Weight Loss LockIn',
          description: 'Lose weight together through daily accountability',
          members: 1247,
          rules: [
            'Post at least 5 updates per day',
            'Be supportive and positive',
            'Share genuine progress',
            'Respect others\' journeys'
          ],
          badges: [
            { 
              id: 'badge1', 
              name: 'First 5K', 
              description: 'Completed first 5K run', 
              icon: '🏃‍♂️', 
              pointsRequired: 100,
              requirements: 'progress',
              requirementValue: 100
            },
            { 
              id: 'badge2', 
              name: 'Consistent Runner', 
              description: 'Posted daily for 7 days', 
              icon: '📅', 
              pointsRequired: 200,
              requirements: 'posts',
              requirementValue: 35
            },
            { 
              id: 'badge3', 
              name: 'Weight Loss Warrior', 
              description: 'Lost 10% of body weight', 
              icon: '💪', 
              pointsRequired: 500,
              requirements: 'progress',
              requirementValue: 100
            }
          ],
          goalProgression: [
            {
              baseGoal: 'Run a 5K',
              nextGoal: 'Run a 10K',
              progressRequired: 100,
              bonusPoints: 200,
              badgeReward: 'badge2'
            },
            {
              baseGoal: 'Run a 10K',
              nextGoal: 'Run a Half Marathon',
              progressRequired: 100,
              bonusPoints: 300,
              badgeReward: 'badge3'
            }
          ],
          posts: [
            { 
              id: '1', 
              userId: 'user2', 
              username: 'sarah_fit', 
              content: '5km run completed', 
              positiveMarkers: 8, 
              negativeMarkers: 1, 
              createdAt: new Date()
            },
            { 
              id: '2', 
              userId: 'user3', 
              username: 'mike_save', 
              content: 'Saved $50 today', 
              positiveMarkers: 15, 
              negativeMarkers: 0, 
              createdAt: new Date()
            }
          ]
        };
        
        setCommunity(mockCommunity);
      } catch (error) {
        Alert.alert('Error', 'Failed to load community');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunity();
  }, [communityId]);
  
  const handleJoinCommunity = async () => {
    if (!user) return;
    
    // Check subscription limit
    if (user.subscriptionStatus === 'free' && user.joinedCommunities.length >= 2) {
      Alert.alert(
        'Upgrade Required', 
        'Free users can only join 2 communities. Upgrade to premium for unlimited access.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade', 
            onPress: () => {/* Navigate to upgrade screen */} 
          }
        ]
      );
      return;
    }
    
    // In real app, this would be an API call
    const updatedUser = {
      ...user,
      joinedCommunities: [
        ...user.joinedCommunities,
        {
          communityId,
          joinedDate: new Date(),
          communityPoints: 0,
          badgesEarned: []
        }
      ]
    };
    
    updateProfile(updatedUser);
    setShowJoinModal(false);
    Alert.alert('Success', 'You\'ve joined the community!');
  };
  
  const isUserMember = user?.joinedCommunities.some(c => c.communityId === communityId);
  
  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => navigation.navigate('OtherUserProfile', { userId: item.userId })}>
          <Text style={styles.username}>{item.username}</Text>
        </TouchableOpacity>
        <Text style={styles.timestamp}>
          {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
      
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.markerButton} 
          onPress={() => Alert.alert('Feature Coming Soon', 'Positive markers will be available soon')}
        >
          <Ionicons name="add-circle" size={24} color="#4CAF50" />
          <Text style={styles.markerCount}>{item.positiveMarkers}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.markerButton} 
          onPress={() => Alert.alert('Feature Coming Soon', 'Negative markers will be available soon')}
        >
          <Ionicons name="remove-circle" size={24} color="#FF5252" />
          <Text style={styles.markerCount}>{item.negativeMarkers}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderBadge = (badge, index) => {
    const userHasBadge = user?.joinedCommunities
      .find(c => c.communityId === communityId)
      ?.badgesEarned.some(b => b.badgeId === badge.id);
    
    return (
      <TouchableOpacity 
        key={index} 
        style={styles.badgeCard}
        onPress={() => {
          if (userHasBadge) {
            Alert.alert('You Earned This!', badge.description);
          } else {
            Alert.alert('How to Earn', `Post ${badge.requirementValue} times to earn this badge!`);
          }
        }}
      >
        <View style={[styles.badgeIcon, userHasBadge && styles.badgeEarned]}>
          <Text style={styles.badgeEmoji}>{badge.icon}</Text>
        </View>
        <Text style={styles.badgeName}>{badge.name}</Text>
        <Text style={styles.badgePoints}>{badge.pointsRequired} pts</Text>
        {userHasBadge && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={styles.badgeCheck} />}
      </TouchableOpacity>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="sync" size={24} color="#4CAF50" style={styles.loadingIcon} />
        <Text>Loading community...</Text>
      </View>
    );
  }
  
  if (!community) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF5252" />
        <Text style={styles.errorText}>Community not found</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {/* Retry logic */}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.communityName}>{community.name}</Text>
        <Text style={styles.memberCount}>{community.members.toLocaleString()} members</Text>
      </View>
      
      <View style={styles.description}>
        <Text style={styles.descriptionText}>{community.description}</Text>
      </View>
      
      {!isUserMember ? (
        <TouchableOpacity 
          style={styles.joinButton}
          onPress={() => setShowJoinModal(true)}
        >
          <Text style={styles.joinButtonText}>Join Community</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.memberStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.joinedCommunities.find(c => c.communityId === communityId).communityPoints}</Text>
            <Text style={styles.statLabel}>Community Points</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.joinedCommunities.find(c => c.communityId === communityId).badgesEarned.length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>
      )}
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Community Badges</Text>
          <TouchableOpacity onPress={() => setShowBadgeModal(true)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.badgesScroll}
        >
          {community.badges.map(renderBadge)}
        </ScrollView>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Community Rules</Text>
        <View style={styles.rulesList}>
          {community.rules.map((rule, index) => (
            <View key={index} style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <FlatList
          data={community.posts}
          keyExtractor={item => item.id}
          renderItem={renderPost}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyPosts}>
              <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>Be the first to share your progress!</Text>
            </View>
          }
        />
      </View>
      
      {/* Join Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showJoinModal}
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join {community.name}?</Text>
            <Text style={styles.modalText}>
              By joining this community, you agree to follow the community rules and post at least 5 updates per day.
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowJoinModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.joinConfirmButton]}
                onPress={handleJoinCommunity}
              >
                <Text style={styles.joinConfirmButtonText}>Join Community</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Badges Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showBadgeModal}
        onRequestClose={() => setShowBadgeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.badgesModalContent]}>
            <Text style={styles.modalTitle}>Community Badges</Text>
            
            <ScrollView style={styles.badgeGrid}>
              {community.badges.map((badge, index) => {
                const userHasBadge = user?.joinedCommunities
                  .find(c => c.communityId === communityId)
                  ?.badgesEarned.some(b => b.badgeId === badge.id);
                
                return (
                  <View key={index} style={styles.badgeGridItem}>
                    <View style={[styles.badgeGridIcon, userHasBadge && styles.badgeEarned]}>
                      <Text style={styles.badgeGridEmoji}>{badge.icon}</Text>
                    </View>
                    <Text style={styles.badgeGridName} numberOfLines={1}>{badge.name}</Text>
                    <Text style={styles.badgeGridPoints}>{badge.pointsRequired} pts</Text>
                    {userHasBadge && (
                      <View style={styles.badgeGridStatus}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.badgeGridStatusText}>Earned</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowBadgeModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  communityName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  description: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  joinButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  joinButtonText: {