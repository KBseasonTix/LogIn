// screens/CommunitiesScreen.js - Modern redesigned communities screen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Avatar, Input } from '../components';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/designSystem';

const CommunitiesScreen = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const mockCommunities = [
    { 
      id: '1', 
      name: 'Daily Coding LockIn', 
      description: 'Code every day and build amazing projects together. Share your progress, get feedback, and stay motivated with fellow developers.', 
      members: 1247,
      category: 'tech',
      joined: user?.joinedCommunities?.includes('1'),
      trending: true,
      weeklyPosts: 156,
      icon: 'code-slash',
      color: Colors.primary[500]
    },
    { 
      id: '2', 
      name: 'Business Builders', 
      description: 'Build businesses and achieve entrepreneurial goals. Connect with entrepreneurs, share strategies, and grow together.', 
      members: 892,
      category: 'business',
      joined: user?.joinedCommunities?.includes('2'),
      trending: false,
      weeklyPosts: 89,
      icon: 'briefcase',
      color: Colors.primary[600]
    },
    { 
      id: '3', 
      name: 'Learning Masters', 
      description: 'Master new skills through daily practice. Whether it\'s languages, instruments, or crafts - we learn together.', 
      members: 2156,
      category: 'education',
      joined: user?.joinedCommunities?.includes('3'),
      trending: true,
      weeklyPosts: 234,
      icon: 'school',
      color: Colors.success[500]
    },
    { 
      id: '4', 
      name: 'Fitness Warriors', 
      description: 'Transform your body and mind through consistent fitness. Share workouts, track progress, and motivate each other.', 
      members: 3421,
      category: 'fitness',
      joined: false,
      trending: true,
      weeklyPosts: 445,
      icon: 'fitness',
      color: Colors.accent[500]
    },
    { 
      id: '5', 
      name: 'Creative Minds', 
      description: 'Express your creativity daily. Artists, writers, designers - showcase your work and get inspired by others.', 
      members: 1834,
      category: 'creative',
      joined: false,
      trending: false,
      weeklyPosts: 178,
      icon: 'color-palette',
      color: Colors.secondary[500]
    },
  ];

  const categories = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'tech', name: 'Tech', icon: 'code-slash' },
    { id: 'business', name: 'Business', icon: 'briefcase' },
    { id: 'education', name: 'Education', icon: 'school' },
    { id: 'fitness', name: 'Fitness', icon: 'fitness' },
    { id: 'creative', name: 'Creative', icon: 'color-palette' },
  ];

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setCommunities(mockCommunities);
      } catch (error) {
        Alert.alert('Error', 'Failed to load communities');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  const filteredCommunities = communities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || community.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const trendingCommunities = communities.filter(c => c.trending).slice(0, 3);

  const handleJoinCommunity = (communityId, communityName) => {
    Alert.alert(
      'Join Community', 
      `Would you like to join "${communityName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Join', 
          onPress: () => {
            setCommunities(prev => prev.map(c => 
              c.id === communityId ? { ...c, joined: true, members: c.members + 1 } : c
            ));
            Alert.alert('Success!', `Welcome to ${communityName}!`);
          }
        }
      ]
    );
  };

  const CategoryFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categoryFilter}
      contentContainerStyle={styles.categoryFilterContent}
    >
      {categories.map(category => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryButton,
            selectedCategory === category.id && styles.categoryButtonActive
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <Ionicons 
            name={category.icon} 
            size={18} 
            color={selectedCategory === category.id ? Colors.text.inverse : Colors.text.secondary} 
          />
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === category.id && styles.categoryButtonTextActive
          ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const TrendingCard = ({ community }) => (
    <Card style={styles.trendingCard} shadow="sm">
      <View style={[styles.trendingIcon, { backgroundColor: `${community.color}20` }]}>
        <Ionicons name={community.icon} size={24} color={community.color} />
      </View>
      <View style={styles.trendingContent}>
        <Text style={styles.trendingName}>{community.name}</Text>
        <Text style={styles.trendingMembers}>{community.members.toLocaleString()} members</Text>
      </View>
      <View style={styles.trendingBadge}>
        <Ionicons name="trending-up" size={16} color={Colors.success[500]} />
      </View>
    </Card>
  );

  const CommunityCard = ({ community }) => (
    <Card style={styles.communityCard} shadow="sm">
      <View style={styles.communityHeader}>
        <View style={styles.communityHeaderLeft}>
          <View style={[styles.communityIcon, { backgroundColor: `${community.color}20` }]}>
            <Ionicons name={community.icon} size={28} color={community.color} />
          </View>
          <View style={styles.communityTitleContainer}>
            <View style={styles.communityTitleRow}>
              <Text style={styles.communityName}>{community.name}</Text>
              {community.trending && (
                <View style={styles.trendingIndicator}>
                  <Ionicons name="trending-up" size={12} color={Colors.success[500]} />
                  <Text style={styles.trendingText}>Trending</Text>
                </View>
              )}
            </View>
            <View style={styles.communityStats}>
              <View style={styles.communityStatItem}>
                <Ionicons name="people" size={14} color={Colors.text.tertiary} />
                <Text style={styles.communityStatText}>
                  {community.members.toLocaleString()} members
                </Text>
              </View>
              <View style={styles.communityStatItem}>
                <Ionicons name="chatbubbles" size={14} color={Colors.text.tertiary} />
                <Text style={styles.communityStatText}>
                  {community.weeklyPosts} posts/week
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      
      <Text style={styles.communityDescription}>{community.description}</Text>
      
      <View style={styles.communityActions}>
        <Button
          title={community.joined ? 'Joined' : 'Join Community'}
          variant={community.joined ? 'outline' : 'primary'}
          size="small"
          onPress={() => !community.joined && handleJoinCommunity(community.id, community.name)}
          style={[styles.joinButton, community.joined && styles.joinedButton]}
          disabled={community.joined}
        />
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => Alert.alert('Feature Coming Soon', 'Community details will be available soon')}
        >
          <Ionicons name="arrow-forward" size={18} color={Colors.primary[500]} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <Text style={styles.header}>Communities</Text>
          <TouchableOpacity style={styles.createButton}>
            <Ionicons name="add" size={20} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>
        
        <Input
          placeholder="Search communities..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search" size={20} color={Colors.text.tertiary} />}
          style={styles.searchInput}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Trending Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Now</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingScroll}
          >
            {trendingCommunities.map(community => (
              <TouchableOpacity
                key={community.id}
                onPress={() => handleJoinCommunity(community.id, community.name)}
              >
                <TrendingCard community={community} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Categories Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <CategoryFilter />
        </View>

        {/* Communities List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? 'All Communities' : 
               categories.find(c => c.id === selectedCategory)?.name + ' Communities'}
            </Text>
            <Text style={styles.resultsCount}>
              {filteredCommunities.length} communities
            </Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="sync" size={24} color={Colors.primary[500]} />
              <Text style={styles.loadingText}>Loading communities...</Text>
            </View>
          ) : filteredCommunities.length === 0 ? (
            <Card style={styles.emptyState} shadow="sm">
              <Ionicons name="search" size={48} color={Colors.text.tertiary} />
              <Text style={styles.emptyStateTitle}>No communities found</Text>
              <Text style={styles.emptyStateText}>
                Try adjusting your search or category filter
              </Text>
            </Card>
          ) : (
            <View style={styles.communitiesList}>
              {filteredCommunities.map(community => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
    marginBottom: Spacing.lg,
  },
  header: {
    ...Typography.styles.h2,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    marginBottom: 0,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.styles.h3,
  },
  sectionAction: {
    ...Typography.styles.bodySmall,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.medium,
  },
  resultsCount: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
  },
  trendingScroll: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  trendingCard: {
    width: 200,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  trendingContent: {
    flex: 1,
  },
  trendingName: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  trendingMembers: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
  },
  trendingBadge: {
    padding: Spacing.xs,
  },
  categoryFilter: {
    marginTop: Spacing.md,
  },
  categoryFilterContent: {
    paddingRight: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  categoryButtonText: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  categoryButtonTextActive: {
    color: Colors.text.inverse,
  },
  communitiesList: {
    gap: Spacing.lg,
    paddingBottom: Spacing['6xl'],
  },
  communityCard: {
    paddingVertical: Spacing.xl,
  },
  communityHeader: {
    marginBottom: Spacing.lg,
  },
  communityHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  communityIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  communityTitleContainer: {
    flex: 1,
  },
  communityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  communityName: {
    ...Typography.styles.h4,
    flex: 1,
    marginRight: Spacing.sm,
  },
  trendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  trendingText: {
    ...Typography.styles.caption,
    color: Colors.success[600],
    fontWeight: Typography.fontWeight.medium,
    marginLeft: Spacing.xs,
  },
  communityStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  communityStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityStatText: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
    marginLeft: Spacing.xs,
  },
  communityDescription: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    marginBottom: Spacing.xl,
  },
  communityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  joinButton: {
    flex: 1,
    marginRight: Spacing.md,
  },
  joinedButton: {
    opacity: 0.7,
  },
  viewButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  loadingText: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    marginLeft: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyStateTitle: {
    ...Typography.styles.h4,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export default CommunitiesScreen;