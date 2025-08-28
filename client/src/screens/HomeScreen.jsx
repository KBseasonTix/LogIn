// screens/HomeScreen.js - Modern redesigned version with commenting system
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Card, Button, Input, Avatar } from '../components';
import PaywallModal from '../components/PaywallModal';
import { BannerAd, AdFreeUpgradePrompt, InterstitialAdManager } from '../components/AdManager';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/designSystem';

const HomeScreen = ({ navigation }) => {
  const { posts, user, updatePostMarkers, addPost, addComment } = useAuth();
  const { 
    canPerformAction, 
    performAction, 
    watchRewardedAd, 
    startTrial,
    subscribeToPremium,
    currentLimits,
    remainingUsage,
    effectiveTier 
  } = useSubscription();
  
  const [loading, setLoading] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', communityId: '2' });
  const [showPostModal, setShowPostModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [paywallAction, setPaywallAction] = useState('post');
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [commentTexts, setCommentTexts] = useState({});
  const [showAllComments, setShowAllComments] = useState(new Set());
  const [showDailyReminder, setShowDailyReminder] = useState(true);
  const [postCount, setPostCount] = useState(0);

  const getCommunityName = (communityId) => {
    const communities = {
      '1': 'Weight Loss LockIn',
      '2': 'Software Builders', 
      '3': 'Money Savers'
    };
    return communities[communityId] || 'Community';
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const handleCreatePost = () => {
    // Check if user can post
    if (!canPerformAction('post')) {
      setPaywallAction('post');
      setShowPaywallModal(true);
      return;
    }
    setShowPostModal(true);
  };

  const handlePostSubmit = async () => {
    if (newPost.content.trim() === '') return;
    
    // Perform the action through subscription context
    const result = await performAction('post');
    if (!result.success) {
      setPaywallAction('post');
      setShowPaywallModal(true);
      return;
    }
    
    addPost({
      communityId: newPost.communityId,
      content: newPost.content.trim(),
    });
    
    setNewPost({ content: '', communityId: '2' });
    setShowPostModal(false);
    setPostCount(prev => prev + 1);
    
    // Show interstitial ad occasionally for free users
    if (currentLimits.showAds && postCount % 3 === 0) {
      InterstitialAdManager.show();
    }
    
    Alert.alert('Posted!', 'Your update has been shared with the community');
  };

  const handlePaywallWatchAd = async () => {
    try {
      await watchRewardedAd();
      setShowPaywallModal(false);
    } catch (error) {
      console.error('Error watching ad:', error);
    }
  };

  const handlePaywallStartTrial = async () => {
    try {
      await startTrial();
      setShowPaywallModal(false);
    } catch (error) {
      console.error('Error starting trial:', error);
    }
  };

  const handlePaywallSubscribe = () => {
    setShowPaywallModal(false);
    navigation?.navigate('Subscription');
  };

  const handleMarker = (postId, type) => {
    updatePostMarkers(postId, type);
  };

  const toggleComments = (postId) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedComments(newExpanded);
  };

  const handleAddComment = (postId) => {
    const commentText = commentTexts[postId]?.trim();
    if (!commentText) return;
    
    addComment(postId, commentText);
    setCommentTexts({ ...commentTexts, [postId]: '' });
  };

  const toggleShowAllComments = (postId) => {
    const newShowAll = new Set(showAllComments);
    if (newShowAll.has(postId)) {
      newShowAll.delete(postId);
    } else {
      newShowAll.add(postId);
    }
    setShowAllComments(newShowAll);
  };

  const renderComment = (comment, postId) => (
    <View key={comment.id} style={styles.commentItem}>
      <Avatar 
        size="xs" 
        name={comment.username} 
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUsername}>{comment.username}</Text>
          <Text style={styles.commentTime}>{formatTime(comment.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.commentLikeButton}>
            <Ionicons name="heart-outline" size={14} color={Colors.text.tertiary} />
            <Text style={styles.commentLikeCount}>{comment.likes}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPost = ({ item }) => {
    const isCommentsExpanded = expandedComments.has(item.id);
    const shouldShowAllComments = showAllComments.has(item.id);
    const commentsToShow = shouldShowAllComments ? item.comments : item.comments.slice(0, 2);
    const hasMoreComments = item.comments.length > 2 && !shouldShowAllComments;

    return (
      <Card style={styles.postCard} shadow="sm">
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.postHeaderLeft}>
            <Avatar size="sm" name={item.username} />
            <View style={styles.postHeaderInfo}>
              <Text style={styles.username}>{item.username}</Text>
              <View style={styles.postMeta}>
                <Text style={styles.communityName}>{getCommunityName(item.communityId)}</Text>
                <Text style={styles.metaDivider}>•</Text>
                <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Post Content */}
        <Text style={styles.postContent}>{item.content}</Text>

        {/* Interaction Bar */}
        <View style={styles.interactionBar}>
          <View style={styles.postActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.likeButton]} 
              onPress={() => handleMarker(item.id, 'positive')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-up-circle" size={20} color={Colors.success[500]} />
              <Text style={[styles.actionCount, styles.likeCount]}>{item.positiveMarkers}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.dislikeButton]} 
              onPress={() => handleMarker(item.id, 'negative')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-down-circle" size={20} color={Colors.secondary[500]} />
              <Text style={[styles.actionCount, styles.dislikeCount]}>{item.negativeMarkers}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.commentToggle} 
              onPress={() => toggleComments(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="chatbubble-outline" 
                size={18} 
                color={Colors.primary[500]} 
              />
              <Text style={styles.commentToggleText}>
                {item.comments.length} {item.comments.length === 1 ? 'comment' : 'comments'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Section */}
        {isCommentsExpanded && (
          <View style={styles.commentsSection}>
            {commentsToShow.length > 0 && (
              <View style={styles.commentsList}>
                {commentsToShow.map(comment => renderComment(comment, item.id))}
                
                {hasMoreComments && (
                  <TouchableOpacity 
                    style={styles.showMoreComments}
                    onPress={() => toggleShowAllComments(item.id)}
                  >
                    <Text style={styles.showMoreCommentsText}>
                      View {item.comments.length - 2} more comments
                    </Text>
                  </TouchableOpacity>
                )}
                
                {shouldShowAllComments && item.comments.length > 2 && (
                  <TouchableOpacity 
                    style={styles.showMoreComments}
                    onPress={() => toggleShowAllComments(item.id)}
                  >
                    <Text style={styles.showMoreCommentsText}>Show less</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            {/* Add Comment Input */}
            <View style={styles.addCommentSection}>
              <Avatar size="xs" name={user?.username} style={styles.commentInputAvatar} />
              <Input 
                placeholder="Write a comment..."
                value={commentTexts[item.id] || ''}
                onChangeText={(text) => setCommentTexts({ ...commentTexts, [item.id]: text })}
                style={styles.commentInputContainer}
                inputStyle={styles.commentInput}
                maxLength={200}
                multiline
                numberOfLines={2}
              />
              <TouchableOpacity 
                style={styles.commentSubmitButton}
                onPress={() => handleAddComment(item.id)}
                disabled={!commentTexts[item.id]?.trim()}
              >
                <Ionicons 
                  name="send" 
                  size={16} 
                  color={commentTexts[item.id]?.trim() ? Colors.primary[500] : Colors.text.tertiary} 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <Text style={styles.header}>Community Feed</Text>
          <View style={styles.headerRight}>
            <View style={styles.headerStats}>
              <View style={styles.headerStat}>
                <Ionicons name="diamond" size={14} color={Colors.primary[500]} />
                <Text style={styles.headerStatText}>{user?.points?.toLocaleString() || 0}</Text>
              </View>
              <View style={styles.headerStat}>
                <Ionicons name="flame" size={14} color={Colors.accent[500]} />
                <Text style={styles.headerStatText}>{user?.currentStreak || 0}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.createPostButton}
              onPress={handleCreatePost}
            >
              <Ionicons name="add" size={20} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Daily Streak Banner */}
      {showDailyReminder && user?.currentStreak > 0 && (
        <Card style={styles.streakBanner}>
          <TouchableOpacity 
            style={styles.streakBannerClose}
            onPress={() => setShowDailyReminder(false)}
          >
            <Ionicons name="close" size={16} color={Colors.text.secondary} />
          </TouchableOpacity>
          
          <View style={styles.streakBannerContent}>
            <View style={styles.streakBannerIcon}>
              <Ionicons name="flame" size={24} color={Colors.primary[500]} />
            </View>
            <View style={styles.streakBannerText}>
              <Text style={styles.streakBannerTitle}>
                {user.currentStreak} Day Streak! 🔥
              </Text>
              <Text style={styles.streakBannerSubtitle}>
                Keep your momentum going! Share today's progress.
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.streakBannerAction}
              onPress={handleCreatePost}
            >
              <Ionicons name="create" size={20} color={Colors.primary[500]} />
            </TouchableOpacity>
          </View>
        </Card>
      )}
      
      {/* Recent Achievement Banner */}
      {user?.achievements && (() => {
        const recentAchievement = Object.values(user.achievements)
          .flat()
          .filter(a => a.earned)
          .sort((a, b) => new Date(b.earnedDate) - new Date(a.earnedDate))[0];
        
        if (!recentAchievement || 
            (new Date() - new Date(recentAchievement.earnedDate)) > 24 * 60 * 60 * 1000) {
          return null;
        }
        
        return (
          <Card style={styles.achievementBanner}>
            <View style={styles.achievementBannerContent}>
              <View style={styles.achievementBannerIcon}>
                <Ionicons name="trophy" size={24} color={Colors.accent[500]} />
              </View>
              <View style={styles.achievementBannerText}>
                <Text style={styles.achievementBannerTitle}>
                  Achievement Unlocked! 🏆
                </Text>
                <Text style={styles.achievementBannerSubtitle}>
                  You earned "{recentAchievement.name}"
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.achievementBannerAction}
                onPress={() => navigation?.navigate('Achievements')}
              >
                <Text style={styles.achievementBannerActionText}>View</Text>
              </TouchableOpacity>
            </View>
          </Card>
        );
      })()}
      
      {/* Usage Stats Banner */}
      <Card style={styles.usageBanner}>
        <View style={styles.usageBannerContent}>
          <View style={styles.usageBannerLeft}>
            <Text style={styles.usageBannerTitle}>
              {effectiveTier === 'premium' ? 'Premium Account' : 
               effectiveTier === 'free_plus' ? 'Free+ Account' : 'Free Account'}
            </Text>
            <Text style={styles.usageBannerSubtitle}>
              {effectiveTier === 'premium' ? 'Unlimited posts & communities' :
               `${remainingUsage.posts} posts, ${remainingUsage.communities} communities left today`}
            </Text>
          </View>
          <View style={styles.usageBannerRight}>
            <View style={[styles.tierBadge, effectiveTier === 'premium' && styles.premiumBadge]}>
              <Ionicons 
                name={effectiveTier === 'premium' ? 'diamond' : effectiveTier === 'free_plus' ? 'play' : 'person'} 
                size={12} 
                color={Colors.background.primary} 
              />
              <Text style={styles.tierBadgeText}>
                {effectiveTier === 'premium' ? 'PRO' : effectiveTier === 'free_plus' ? 'FREE+' : 'FREE'}
              </Text>
            </View>
          </View>
        </View>
      </Card>
      
      {/* Ad-Free Upgrade Prompt */}
      <AdFreeUpgradePrompt 
        onUpgrade={() => navigation?.navigate('Subscription')} 
      />
      
      {/* Banner Ad */}
      <BannerAd style={styles.bannerAd} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="sync" size={24} color={Colors.primary[500]} style={styles.loadingIcon} />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color={Colors.text.tertiary} />
          <Text style={styles.emptyText}>No posts yet</Text>
          <Text style={styles.emptySubtext}>Join a community and share your first update!</Text>
          <Button 
            title="Create Your First Post"
            onPress={handleCreatePost}
            style={styles.emptyStateButton}
          />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.feedContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.postSeparator} />}
        />
      )}
      
      {/* Post Creation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPostModal}
        onRequestClose={() => setShowPostModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent} shadow="xl">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Your Progress</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowPostModal(false)}
              >
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <Input
              placeholder="What did you accomplish today? Share your progress with the community..."
              value={newPost.content}
              onChangeText={text => setNewPost({...newPost, content: text})}
              maxLength={300}
              multiline
              numberOfLines={4}
              style={styles.postInputContainer}
            />
            
            <View style={styles.modalActions}>
              <Button 
                title="Cancel"
                variant="outline"
                onPress={() => setShowPostModal(false)}
                style={styles.cancelButton}
              />
              <Button 
                title="Share Progress"
                onPress={handlePostSubmit}
                disabled={!newPost.content.trim()}
                style={styles.postSubmitButton}
              />
            </View>
          </Card>
        </View>
      </Modal>
      
      {/* Paywall Modal */}
      <PaywallModal
        visible={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        action={paywallAction}
        onWatchAd={handlePaywallWatchAd}
        onStartTrial={handlePaywallStartTrial}
        onSubscribe={handlePaywallSubscribe}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  headerContainer: {
    backgroundColor: Colors.background.primary,
    paddingTop: 50,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    ...Typography.styles.h2,
  },
  createPostButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },
  postSeparator: {
    height: Spacing.lg,
  },
  postCard: {
    marginBottom: 0,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postHeaderInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  username: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  communityName: {
    ...Typography.styles.bodySmall,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.medium,
  },
  metaDivider: {
    ...Typography.styles.bodySmall,
    color: Colors.text.tertiary,
    marginHorizontal: Spacing.xs,
  },
  timestamp: {
    ...Typography.styles.bodySmall,
    color: Colors.text.tertiary,
  },
  postContent: {
    ...Typography.styles.body,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    marginBottom: Spacing.lg,
    color: Colors.text.primary,
  },
  interactionBar: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing.md,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  likeButton: {
    backgroundColor: Colors.success[50],
  },
  dislikeButton: {
    backgroundColor: Colors.secondary[50],
  },
  actionCount: {
    marginLeft: Spacing.xs,
    ...Typography.styles.bodySmall,
    fontWeight: Typography.fontWeight.semibold,
  },
  likeCount: {
    color: Colors.success[600],
  },
  dislikeCount: {
    color: Colors.secondary[600],
  },
  commentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  commentToggleText: {
    marginLeft: Spacing.xs,
    ...Typography.styles.bodySmall,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.medium,
  },
  commentsSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  commentsList: {
    marginBottom: Spacing.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  commentAvatar: {
    marginTop: Spacing.xs,
  },
  commentContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  commentUsername: {
    ...Typography.styles.bodySmall,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  commentTime: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
    marginLeft: Spacing.sm,
  },
  commentText: {
    ...Typography.styles.bodySmall,
    color: Colors.text.primary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentLikeCount: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
    marginLeft: Spacing.xs,
  },
  showMoreComments: {
    paddingVertical: Spacing.sm,
  },
  showMoreCommentsText: {
    ...Typography.styles.bodySmall,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.medium,
  },
  addCommentSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentInputAvatar: {
    marginTop: Spacing.sm,
  },
  commentInputContainer: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
    marginBottom: 0,
  },
  commentInput: {
    minHeight: 36,
    maxHeight: 80,
  },
  commentSubmitButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[50],
    marginTop: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral[100],
  },
  modalTitle: {
    ...Typography.styles.h3,
  },
  postInputContainer: {
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  postSubmitButton: {
    flex: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing['6xl'],
  },
  loadingIcon: {
    marginBottom: Spacing.md,
  },
  loadingText: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
    paddingTop: -Spacing['6xl'],
  },
  emptyText: {
    ...Typography.styles.h3,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  emptyStateButton: {
    paddingHorizontal: Spacing['3xl'],
  },
  // Header Stats
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  headerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  headerStatText: {
    ...Typography.styles.caption,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  // Banner Styles - Updated for Silver/Blue theme
  streakBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background.accent,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  streakBannerClose: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    zIndex: 1,
    padding: Spacing.xs,
  },
  streakBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  streakBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  streakBannerText: {
    flex: 1,
  },
  streakBannerTitle: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary[700],
    marginBottom: Spacing.xs,
  },
  streakBannerSubtitle: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
  },
  streakBannerAction: {
    padding: Spacing.md,
  },
  // Achievement Banner - Updated for Silver/Blue theme
  achievementBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background.accent,
    borderWidth: 1,
    borderColor: Colors.accent[200],
  },
  achievementBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.accent[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  achievementBannerText: {
    flex: 1,
  },
  achievementBannerTitle: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.accent[700],
    marginBottom: Spacing.xs,
  },
  achievementBannerSubtitle: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
  },
  achievementBannerAction: {
    backgroundColor: Colors.accent[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  achievementBannerActionText: {
    ...Typography.styles.bodySmall,
    color: Colors.accent[700],
    fontWeight: Typography.fontWeight.semibold,
  },
  // Usage Banner Styles
  usageBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  usageBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  usageBannerLeft: {
    flex: 1,
  },
  usageBannerTitle: {
    ...Typography.styles.bodyMedium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  usageBannerSubtitle: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
  },
  usageBannerRight: {
    alignItems: 'flex-end',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  premiumBadge: {
    backgroundColor: Colors.accent[500],
  },
  tierBadgeText: {
    ...Typography.styles.caption,
    color: Colors.background.primary,
    fontWeight: Typography.fontWeight.bold,
    fontSize: 10,
  },
  // Banner Ad Styles
  bannerAd: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
});

export default HomeScreen;