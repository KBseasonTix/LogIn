// screens/OnboardingScreen.js - Enhanced user onboarding with username, goals, communities, and tutorials
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Avatar } from '../components';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../utils/designSystem';

const OnboardingScreen = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({
    username: '',
    usernameAvailable: null,
    goals: [],
    selectedCommunities: [],
    suggestedCommunities: [],
    preferences: {
      dailyGoal: 3,
      notificationsEnabled: true,
      privacyLevel: 'public'
    }
  });
  
  const scrollRef = useRef(null);
  const [slideAnimation] = useState(new Animated.Value(0));
  
  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to LogIn!',
      subtitle: 'Your productivity journey starts here',
      component: WelcomeStep
    },
    {
      id: 'username',
      title: 'Choose Your Username',
      subtitle: 'How others will know you in the community',
      component: UsernameStep
    },
    {
      id: 'goals',
      title: 'Set Your Goals',
      subtitle: 'What would you like to achieve?',
      component: GoalsStep
    },
    {
      id: 'communities',
      title: 'Join Communities',
      subtitle: 'Find your tribe and stay motivated',
      component: CommunitiesStep
    },
    {
      id: 'suggestions',
      title: 'Recommended for You',
      subtitle: 'Communities that match your goals',
      component: SuggestionsStep
    },
    {
      id: 'preview',
      title: 'Your Feed Preview',
      subtitle: 'Here\'s what your feed will look like',
      component: PreviewStep
    },
    {
      id: 'tutorial',
      title: 'How to Share Progress',
      subtitle: 'Learn to post daily updates',
      component: TutorialStep
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      subtitle: 'Ready to start your journey?',
      component: CompleteStep
    }
  ];

  const animateToStep = (stepIndex) => {
    Animated.timing(slideAnimation, {
      toValue: stepIndex * -100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      animateToStep(newStep);
      scrollRef.current?.scrollTo({ x: newStep * 400, animated: true });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      animateToStep(newStep);
      scrollRef.current?.scrollTo({ x: newStep * 400, animated: true });
    }
  };

  const updateOnboardingData = (key, value) => {
    setOnboardingData(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Auto-generate community suggestions when goals change
    if (key === 'goals' && value.length > 0) {
      generateCommunitySuggestions(value);
    }
  };

  const generateCommunitySuggestions = (goals) => {
    const allCommunities = [
      { id: '1', name: 'Daily Coding', description: 'Code every day', members: 1247, icon: 'code-slash', color: Colors.primary[500], tags: ['coding', 'programming', 'development', 'tech'] },
      { id: '2', name: 'Business Builders', description: 'Entrepreneurship & startups', members: 892, icon: 'briefcase', color: Colors.secondary[500], tags: ['business', 'entrepreneurship', 'startup', 'marketing'] },
      { id: '3', name: 'Learning Masters', description: 'Continuous skill development', members: 2156, icon: 'school', color: Colors.success[500], tags: ['learning', 'education', 'skills', 'courses'] },
      { id: '4', name: 'Fitness Warriors', description: 'Health & fitness goals', members: 3421, icon: 'fitness', color: Colors.error[500], tags: ['fitness', 'health', 'exercise', 'nutrition'] },
      { id: '5', name: 'Creative Minds', description: 'Art & creative projects', members: 1834, icon: 'color-palette', color: Colors.warning[500], tags: ['creative', 'art', 'design', 'writing'] },
      { id: '6', name: 'Money Masters', description: 'Financial goals & saving', members: 967, icon: 'cash', color: Colors.success[600], tags: ['finance', 'saving', 'investment', 'money'] },
      { id: '7', name: 'Side Hustlers', description: 'Building side projects', members: 1543, icon: 'trending-up', color: Colors.primary[600], tags: ['side-hustle', 'projects', 'income', 'business'] }
    ];
    
    // Simple keyword matching for community suggestions
    const suggestions = allCommunities.filter(community => {
      return goals.some(goal => 
        community.tags.some(tag => 
          goal.description.toLowerCase().includes(tag) || 
          goal.category?.toLowerCase().includes(tag)
        )
      );
    }).slice(0, 3); // Limit to top 3 suggestions
    
    setOnboardingData(prev => ({ ...prev, suggestedCommunities: suggestions }));
  };

  const checkUsernameAvailability = async (username) => {
    // Simulate API call to check username availability
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock taken usernames for demo
    const takenUsernames = ['admin', 'test', 'user', 'alex_dev', 'sarah_fit', 'mike_save', 'john'];
    const isAvailable = !takenUsernames.includes(username.toLowerCase()) && username.length >= 3;
    
    setOnboardingData(prev => ({ 
      ...prev, 
      usernameAvailable: isAvailable 
    }));
    
    return isAvailable;
  };

  const finishOnboarding = () => {
    // Save onboarding data to user context/API
    onComplete(onboardingData);
  };

  const ProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View 
          style={[
            styles.progressFill,
            {
              width: `${((currentStep + 1) / steps.length) * 100}%`
            }
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {currentStep + 1} of {steps.length}
      </Text>
    </View>
  );

  function WelcomeStep() {
    return (
      <View style={styles.stepContainer}>
        <View style={styles.welcomeIcon}>
          <Ionicons name="rocket" size={64} color={Colors.primary[500]} />
        </View>
        
        <Text style={styles.welcomeTitle}>Welcome to LogIn!</Text>
        <Text style={styles.welcomeDescription}>
          Join thousands of people achieving their goals through daily accountability 
          and community support. Let's get you started on your productivity journey.
        </Text>
        
        <View style={styles.featureList}>
          <FeatureItem 
            icon="target" 
            title="Set & Track Goals" 
            description="Define what you want to achieve"
          />
          <FeatureItem 
            icon="people" 
            title="Join Communities" 
            description="Connect with like-minded people"
          />
          <FeatureItem 
            icon="trending-up" 
            title="Daily Progress" 
            description="Share updates and stay motivated"
          />
          <FeatureItem 
            icon="trophy" 
            title="Earn Awards" 
            description="Get recognized for your achievements"
          />
        </View>
      </View>
    );
  }

  function UsernameStep() {
    const [username, setUsername] = useState(onboardingData.username);
    const [isChecking, setIsChecking] = useState(false);
    
    const handleUsernameChange = (text) => {
      // Only allow alphanumeric and underscores
      const cleanUsername = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
      setUsername(cleanUsername);
      updateOnboardingData('username', cleanUsername);
      updateOnboardingData('usernameAvailable', null);
    };
    
    const handleCheckAvailability = async () => {
      if (username.length < 3) {
        Alert.alert('Invalid Username', 'Username must be at least 3 characters long');
        return;
      }
      
      setIsChecking(true);
      await checkUsernameAvailability(username);
      setIsChecking(false);
    };
    
    const getAvailabilityColor = () => {
      if (onboardingData.usernameAvailable === null) return Colors.text.tertiary;
      return onboardingData.usernameAvailable ? Colors.success[500] : Colors.error[500];
    };
    
    const getAvailabilityIcon = () => {
      if (isChecking) return 'ellipsis-horizontal';
      if (onboardingData.usernameAvailable === null) return 'help-circle-outline';
      return onboardingData.usernameAvailable ? 'checkmark-circle' : 'close-circle';
    };
    
    return (
      <View style={styles.stepContainer}>
        <View style={styles.usernameIcon}>
          <Ionicons name="person" size={48} color={Colors.primary[500]} />
        </View>
        
        <Text style={styles.stepTitle}>Choose Your Username</Text>
        <Text style={styles.stepDescription}>
          This is how other community members will know you. Choose something memorable!
        </Text>
        
        <View style={styles.usernameContainer}>
          <Input
            placeholder="Enter username"
            value={username}
            onChangeText={handleUsernameChange}
            maxLength={20}
            style={styles.usernameInput}
            rightIcon={
              <Ionicons 
                name={getAvailabilityIcon()} 
                size={20} 
                color={getAvailabilityColor()} 
              />
            }
          />
          
          <Button
            title="Check Availability"
            onPress={handleCheckAvailability}
            disabled={username.length < 3 || isChecking}
            loading={isChecking}
            variant="outline"
            size="small"
            style={styles.checkButton}
          />
        </View>
        
        {onboardingData.usernameAvailable !== null && (
          <View style={styles.availabilityMessage}>
            <Text style={[styles.availabilityText, {
              color: onboardingData.usernameAvailable ? Colors.success[500] : Colors.error[500]
            }]}>
              {onboardingData.usernameAvailable 
                ? `@${username} is available! 🎉` 
                : `@${username} is already taken. Try another one.`
              }
            </Text>
          </View>
        )}
        
        <View style={styles.usernameRules}>
          <Text style={styles.rulesTitle}>Username Rules:</Text>
          <Text style={styles.rulesText}>• 3-20 characters long</Text>
          <Text style={styles.rulesText}>• Only letters, numbers, and underscores</Text>
          <Text style={styles.rulesText}>• Must be unique</Text>
        </View>
      </View>
    );
  }

  function GoalsStep() {
    const [goalInput, setGoalInput] = useState('');
    const [selectedTimeframe, setSelectedTimeframe] = useState('90days');
    const [selectedCategory, setSelectedCategory] = useState('');
    
    const timeframeOptions = [
      { id: '30days', label: '30 Days', days: 30 },
      { id: '90days', label: '90 Days', days: 90 },
      { id: '1year', label: '1 Year', days: 365 }
    ];
    
    const categoryOptions = [
      { id: 'coding', label: 'Coding', icon: 'code-slash', color: Colors.primary[500] },
      { id: 'business', label: 'Business', icon: 'briefcase', color: Colors.secondary[500] },
      { id: 'fitness', label: 'Fitness', icon: 'fitness', color: Colors.error[500] },
      { id: 'learning', label: 'Learning', icon: 'school', color: Colors.success[500] },
      { id: 'creative', label: 'Creative', icon: 'color-palette', color: Colors.warning[500] },
      { id: 'finance', label: 'Finance', icon: 'cash', color: Colors.success[600] },
      { id: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: Colors.neutral[500] }
    ];

    const addGoal = () => {
      if (goalInput.trim()) {
        if (onboardingData.goals.length >= 5) {
          Alert.alert('Limit Reached', 'You can add up to 5 goals during onboarding. You can add more later!');
          return;
        }
        
        const newGoal = {
          id: Date.now().toString(),
          description: goalInput.trim(),
          category: selectedCategory,
          timeframe: selectedTimeframe,
          targetDate: new Date(Date.now() + (timeframeOptions.find(t => t.id === selectedTimeframe)?.days * 24 * 60 * 60 * 1000)).toISOString(),
          currentProgress: 0,
          createdAt: new Date().toISOString()
        };
        
        updateOnboardingData('goals', [...onboardingData.goals, newGoal]);
        setGoalInput('');
      }
    };

    const removeGoal = (goalId) => {
      updateOnboardingData('goals', onboardingData.goals.filter(g => g.id !== goalId));
    };

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>What are your goals?</Text>
        <Text style={styles.stepDescription}>
          Add 2-5 specific goals you'd like to achieve. Be clear and measurable!
        </Text>
        
        <View style={styles.categorySelector}>
          <Text style={styles.categoryLabel}>Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categoryOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[styles.categoryOption, selectedCategory === option.id && styles.categoryOptionActive]}
                onPress={() => setSelectedCategory(option.id)}
              >
                <Ionicons 
                  name={option.icon} 
                  size={20} 
                  color={selectedCategory === option.id ? Colors.text.inverse : option.color} 
                />
                <Text style={[
                  styles.categoryOptionText,
                  selectedCategory === option.id && styles.categoryOptionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <Input
          placeholder="e.g., Learn React Native, Run a 5K, Save $1000"
          value={goalInput}
          onChangeText={setGoalInput}
          maxLength={100}
          style={styles.goalInput}
        />
        
        <View style={styles.timeframeSelector}>
          <Text style={styles.timeframeLabel}>Timeframe:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {timeframeOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.timeframeOption,
                  selectedTimeframe === option.id && styles.timeframeOptionActive
                ]}
                onPress={() => setSelectedTimeframe(option.id)}
              >
                <Text style={[
                  styles.timeframeOptionText,
                  selectedTimeframe === option.id && styles.timeframeOptionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <Button
          title="Add Goal"
          onPress={addGoal}
          disabled={!goalInput.trim() || !selectedCategory}
          style={styles.addGoalButton}
        />
        
        <Text style={styles.goalsCount}>
          {onboardingData.goals.length}/5 goals added
        </Text>
        
        <View style={styles.goalsList}>
          {onboardingData.goals.map(goal => (
            <Card key={goal.id} style={styles.goalCard}>
              <View style={styles.goalCardContent}>
                <View style={styles.goalCardLeft}>
                  <Text style={styles.goalCardTitle}>{goal.description}</Text>
                  <Text style={styles.goalCardTimeframe}>
                    {timeframeOptions.find(t => t.id === goal.timeframe)?.label}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeGoalButton}
                  onPress={() => removeGoal(goal.id)}
                >
                  <Ionicons name="close" size={20} color={Colors.error[500]} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      </View>
    );
  }

  function CommunitiesStep() {
    const communities = [
      { id: '1', name: 'Daily Coding', description: 'Code every day', members: 1247, icon: 'code-slash', color: Colors.primary[500] },
      { id: '2', name: 'Business Builders', description: 'Entrepreneurship & startups', members: 892, icon: 'briefcase', color: Colors.secondary[500] },
      { id: '3', name: 'Learning Masters', description: 'Continuous skill development', members: 2156, icon: 'school', color: Colors.success[500] },
      { id: '4', name: 'Fitness Warriors', description: 'Health & fitness goals', members: 3421, icon: 'fitness', color: Colors.error[500] },
      { id: '5', name: 'Creative Minds', description: 'Art & creative projects', members: 1834, icon: 'color-palette', color: Colors.warning[500] },
    ];
    
    const maxSelections = 2; // Free tier limit

    const toggleCommunity = (communityId) => {
      const current = onboardingData.selectedCommunities;
      if (current.includes(communityId)) {
        updateOnboardingData('selectedCommunities', current.filter(id => id !== communityId));
      } else {
        updateOnboardingData('selectedCommunities', [...current, communityId]);
      }
    };

    const CommunityCard = ({ community }) => {
      const isSelected = onboardingData.selectedCommunities.includes(community.id);
      const canSelect = onboardingData.selectedCommunities.length < maxSelections || isSelected;
      
      return (
        <TouchableOpacity 
          onPress={() => {
            if (!canSelect && !isSelected) {
              Alert.alert('Selection Limit', `You can join up to ${maxSelections} communities with the free tier. Upgrade later for unlimited access!`);
              return;
            }
            toggleCommunity(community.id);
          }}
          style={!canSelect && !isSelected ? { opacity: 0.5 } : {}}
        >
          <Card style={[styles.communityCard, isSelected && styles.communityCardSelected]}>
            <View style={styles.communityCardContent}>
              <View style={[styles.communityIcon, { backgroundColor: `${community.color}20` }]}>
                <Ionicons name={community.icon} size={24} color={community.color} />
              </View>
              
              <View style={styles.communityInfo}>
                <Text style={styles.communityName}>{community.name}</Text>
                <Text style={styles.communityDescription}>{community.description}</Text>
                <Text style={styles.communityMembers}>{community.members.toLocaleString()} members</Text>
              </View>
              
              <View style={[styles.selectionIndicator, isSelected && styles.selectionIndicatorActive]}>
                {isSelected && <Ionicons name="checkmark" size={16} color={Colors.text.inverse} />}
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Join Communities</Text>
        <Text style={styles.stepDescription}>
          Select communities that align with your goals. You can always join more later!
        </Text>
        
        <View style={styles.communitiesList}>
          {communities.map(community => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </View>
        
        <Text style={styles.selectedCount}>
          {onboardingData.selectedCommunities.length}/{maxSelections} communities selected (Free Tier)
        </Text>
        
        <View style={styles.upgradeHint}>
          <Ionicons name="star" size={16} color={Colors.warning[500]} />
          <Text style={styles.upgradeHintText}>
            Upgrade to Pro for unlimited community access
          </Text>
        </View>
      </View>
    );
  }

  function SuggestionsStep() {
    const suggestedCommunities = onboardingData.suggestedCommunities;
    
    if (suggestedCommunities.length === 0) {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>No Suggestions Yet</Text>
          <Text style={styles.stepDescription}>
            Add some goals first to get personalized community recommendations!
          </Text>
          
          <View style={styles.noSuggestionsIcon}>
            <Ionicons name="bulb-outline" size={64} color={Colors.neutral[400]} />
          </View>
        </View>
      );
    }
    
    const toggleSuggestedCommunity = (communityId) => {
      const current = onboardingData.selectedCommunities;
      const maxSelections = 2;
      
      if (current.includes(communityId)) {
        updateOnboardingData('selectedCommunities', current.filter(id => id !== communityId));
      } else if (current.length < maxSelections) {
        updateOnboardingData('selectedCommunities', [...current, communityId]);
      } else {
        Alert.alert('Selection Limit', 'You can join up to 2 communities with the free tier.');
      }
    };
    
    return (
      <View style={styles.stepContainer}>
        <View style={styles.aiIcon}>
          <Ionicons name="sparkles" size={48} color={Colors.primary[500]} />
        </View>
        
        <Text style={styles.stepTitle}>Perfect Match!</Text>
        <Text style={styles.stepDescription}>
          Based on your goals, we think you'll love these communities:
        </Text>
        
        <View style={styles.suggestedList}>
          {suggestedCommunities.map(community => {
            const isSelected = onboardingData.selectedCommunities.includes(community.id);
            const canSelect = onboardingData.selectedCommunities.length < 2 || isSelected;
            
            return (
              <TouchableOpacity 
                key={community.id}
                onPress={() => toggleSuggestedCommunity(community.id)}
                disabled={!canSelect && !isSelected}
              >
                <Card style={[styles.suggestedCard, isSelected && styles.suggestedCardSelected]}>
                  <View style={styles.suggestedCardContent}>
                    <View style={[styles.communityIcon, { backgroundColor: `${community.color}20` }]}>
                      <Ionicons name={community.icon} size={24} color={community.color} />
                    </View>
                    
                    <View style={styles.communityInfo}>
                      <Text style={styles.communityName}>{community.name}</Text>
                      <Text style={styles.communityDescription}>{community.description}</Text>
                      <Text style={styles.communityMembers}>{community.members.toLocaleString()} members</Text>
                    </View>
                    
                    <View style={styles.suggestionBadge}>
                      <Ionicons name="star" size={16} color={Colors.warning[500]} />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }
  
  function PreviewStep() {
    const selectedCommunityNames = onboardingData.selectedCommunities.map(id => {
      const allCommunities = [
        { id: '1', name: 'Daily Coding' },
        { id: '2', name: 'Business Builders' },
        { id: '3', name: 'Learning Masters' },
        { id: '4', name: 'Fitness Warriors' },
        { id: '5', name: 'Creative Minds' },
        { id: '6', name: 'Money Masters' },
        { id: '7', name: 'Side Hustlers' }
      ];
      return allCommunities.find(c => c.id === id)?.name || 'Unknown';
    });
    
    const mockPosts = [
      {
        id: '1',
        username: 'sarah_codes',
        community: selectedCommunityNames[0] || 'Daily Coding',
        content: 'Finished implementing user authentication today! JWT tokens working perfectly.',
        timeAgo: '2h',
        positiveMarkers: 12
      },
      {
        id: '2',
        username: 'mike_builder',
        community: selectedCommunityNames[1] || 'Business Builders',
        content: 'Launched my MVP today! Got 5 sign-ups in the first hour. So excited!',
        timeAgo: '4h',
        positiveMarkers: 18
      },
      {
        id: '3',
        username: 'alex_learner',
        community: selectedCommunityNames[0] || 'Learning Masters',
        content: 'Completed React fundamentals course. Building my first project tomorrow!',
        timeAgo: '6h',
        positiveMarkers: 9
      }
    ];
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Your Feed Preview</Text>
        <Text style={styles.stepDescription}>
          Here's what your personalized feed will look like based on your community selections:
        </Text>
        
        <View style={styles.feedPreview}>
          {mockPosts.map(post => (
            <Card key={post.id} style={styles.previewPost}>
              <View style={styles.previewPostHeader}>
                <View style={styles.previewAvatar}>
                  <Text style={styles.previewAvatarText}>{post.username[0].toUpperCase()}</Text>
                </View>
                <View style={styles.previewPostMeta}>
                  <Text style={styles.previewUsername}>@{post.username}</Text>
                  <Text style={styles.previewCommunity}>{post.community} • {post.timeAgo}</Text>
                </View>
              </View>
              
              <Text style={styles.previewPostContent}>{post.content}</Text>
              
              <View style={styles.previewPostActions}>
                <View style={styles.previewLikes}>
                  <Ionicons name="heart" size={16} color={Colors.like} />
                  <Text style={styles.previewLikesText}>{post.positiveMarkers}</Text>
                </View>
                <Ionicons name="chatbubble-outline" size={16} color={Colors.comment} />
                <Ionicons name="share-outline" size={16} color={Colors.text.tertiary} />
              </View>
            </Card>
          ))}
        </View>
        
        <Text style={styles.previewNote}>
          Your actual feed will be filled with real updates from your communities!
        </Text>
      </View>
    );
  }
  
  function TutorialStep() {
    const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
    
    const tutorialSteps = [
      {
        title: 'Share Your Progress',
        description: 'Post daily updates about your goals',
        icon: 'create-outline',
        content: 'Tap the "+" button to share what you accomplished today. Be specific about your progress!'
      },
      {
        title: 'Support Others',
        description: 'Encourage your community members',
        icon: 'heart-outline',
        content: 'Give positive markers to celebrate others\' achievements. Your support means everything!'
      },
      {
        title: 'Stay Consistent',
        description: 'Build streaks and earn rewards',
        icon: 'flame',
        content: 'Post daily to build streaks and unlock achievements. Consistency is key to success!'
      }
    ];
    
    const currentStep = tutorialSteps[currentTutorialStep];
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>How to Use LogIn</Text>
        <Text style={styles.stepDescription}>
          Here's everything you need to know to get started:
        </Text>
        
        <View style={styles.tutorialCard}>
          <View style={styles.tutorialIcon}>
            <Ionicons name={currentStep.icon} size={48} color={Colors.primary[500]} />
          </View>
          
          <Text style={styles.tutorialTitle}>{currentStep.title}</Text>
          <Text style={styles.tutorialDescription}>{currentStep.description}</Text>
          <Text style={styles.tutorialContent}>{currentStep.content}</Text>
          
          <View style={styles.tutorialNavigation}>
            {tutorialSteps.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.tutorialDot,
                  index === currentTutorialStep && styles.tutorialDotActive
                ]}
                onPress={() => setCurrentTutorialStep(index)}
              />
            ))}
          </View>
        </View>
        
        <View style={styles.tutorialActions}>
          {currentTutorialStep > 0 && (
            <Button
              title="Previous"
              variant="outline"
              size="small"
              onPress={() => setCurrentTutorialStep(currentTutorialStep - 1)}
              style={styles.tutorialButton}
            />
          )}
          
          {currentTutorialStep < tutorialSteps.length - 1 && (
            <Button
              title="Next"
              size="small"
              onPress={() => setCurrentTutorialStep(currentTutorialStep + 1)}
              style={styles.tutorialButton}
            />
          )}
        </View>
      </View>
    );
  }
  
  function PreferencesStep() {
    const dailyGoalOptions = [1, 2, 3, 5];
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Customize Your Experience</Text>
        <Text style={styles.stepDescription}>
          Set your preferences to get the most out of LogIn.
        </Text>
        
        <Card style={styles.preferenceCard}>
          <Text style={styles.preferenceTitle}>Daily Post Goal</Text>
          <Text style={styles.preferenceDescription}>
            How many progress updates would you like to share daily?
          </Text>
          
          <View style={styles.dailyGoalOptions}>
            {dailyGoalOptions.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.dailyGoalOption,
                  onboardingData.preferences.dailyGoal === option && styles.dailyGoalOptionActive
                ]}
                onPress={() => updateOnboardingData('preferences', {
                  ...onboardingData.preferences,
                  dailyGoal: option
                })}
              >
                <Text style={[
                  styles.dailyGoalOptionText,
                  onboardingData.preferences.dailyGoal === option && styles.dailyGoalOptionTextActive
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
        
        <Card style={styles.preferenceCard}>
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceLeft}>
              <Text style={styles.preferenceTitle}>Enable Notifications</Text>
              <Text style={styles.preferenceDescription}>
                Get reminders to log your daily progress
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                onboardingData.preferences.notificationsEnabled && styles.toggleButtonActive
              ]}
              onPress={() => updateOnboardingData('preferences', {
                ...onboardingData.preferences,
                notificationsEnabled: !onboardingData.preferences.notificationsEnabled
              })}
            >
              <Animated.View style={[
                styles.toggleIndicator,
                onboardingData.preferences.notificationsEnabled && styles.toggleIndicatorActive
              ]} />
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    );
  }

  function CompleteStep() {
    return (
      <View style={styles.stepContainer}>
        <View style={styles.completeIcon}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.success[500]} />
        </View>
        
        <Text style={styles.completeTitle}>You're All Set!</Text>
        <Text style={styles.completeDescription}>
          Welcome to the LogIn community! You've set up {onboardingData.goals.length} goals 
          and joined {onboardingData.selectedCommunities.length} communities.
        </Text>
        
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your Setup Summary</Text>
          
          <View style={styles.summaryItem}>
            <Ionicons name="target" size={20} color={Colors.primary[500]} />
            <Text style={styles.summaryText}>
              {onboardingData.goals.length} goals to achieve
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Ionicons name="people" size={20} color={Colors.secondary[500]} />
            <Text style={styles.summaryText}>
              {onboardingData.selectedCommunities.length} communities joined
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Ionicons name="today" size={20} color={Colors.success[500]} />
            <Text style={styles.summaryText}>
              {onboardingData.preferences.dailyGoal} daily post goal
            </Text>
          </View>
        </Card>
        
        <Text style={styles.motivationText}>
          Ready to start your productivity journey? Let's make progress together! 🚀
        </Text>
      </View>
    );
  }

  const FeatureItem = ({ icon, title, description }) => (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={24} color={Colors.primary[500]} />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.gradient.primaryBlue}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{steps[currentStep].title}</Text>
          <Text style={styles.headerSubtitle}>{steps[currentStep].subtitle}</Text>
          <ProgressBar />
        </View>
      </LinearGradient>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <CurrentStepComponent />
      </ScrollView>
      
      <View style={styles.footer}>
        {currentStep > 0 && (
          <Button
            title="Back"
            variant="outline"
            onPress={prevStep}
            style={styles.backButton}
          />
        )}
        
        {currentStep < steps.length - 1 ? (
          <Button
            title={currentStep === 0 ? "Get Started" : "Continue"}
            onPress={nextStep}
            disabled={
              (currentStep === 1 && (!onboardingData.username || onboardingData.usernameAvailable !== true)) ||
              (currentStep === 2 && onboardingData.goals.length < 2) ||
              (currentStep === 3 && onboardingData.selectedCommunities.length === 0)
            }
            style={styles.nextButton}
          />
        ) : (
          <Button
            title="Start Your Journey"
            onPress={finishOnboarding}
            style={styles.finishButton}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.styles.h2,
    color: Colors.text.inverse,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  headerSubtitle: {
    ...Typography.styles.body,
    color: Colors.primary[100],
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
  },
  progressTrack: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.text.inverse,
    borderRadius: BorderRadius.sm,
  },
  progressText: {
    ...Typography.styles.caption,
    color: Colors.primary[100],
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  stepContainer: {
    paddingVertical: Spacing['2xl'],
    minHeight: 400,
  },
  welcomeIcon: {
    alignSelf: 'center',
    marginBottom: Spacing['2xl'],
  },
  welcomeTitle: {
    ...Typography.styles.h1,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  welcomeDescription: {
    ...Typography.styles.body,
    textAlign: 'center',
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    marginBottom: Spacing['3xl'],
  },
  featureList: {
    gap: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
  },
  stepTitle: {
    ...Typography.styles.h2,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  stepDescription: {
    ...Typography.styles.body,
    textAlign: 'center',
    color: Colors.text.secondary,
    marginBottom: Spacing['2xl'],
  },
  goalInput: {
    marginBottom: Spacing.lg,
  },
  timeframeSelector: {
    marginBottom: Spacing.lg,
  },
  timeframeLabel: {
    ...Typography.styles.label,
    marginBottom: Spacing.md,
  },
  timeframeOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    marginRight: Spacing.md,
  },
  timeframeOptionActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  timeframeOptionText: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  timeframeOptionTextActive: {
    color: Colors.text.inverse,
  },
  addGoalButton: {
    marginBottom: Spacing.lg,
  },
  goalsList: {
    gap: Spacing.md,
  },
  goalCard: {
    padding: Spacing.lg,
  },
  goalCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  goalCardLeft: {
    flex: 1,
  },
  goalCardTitle: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  goalCardTimeframe: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
  },
  removeGoalButton: {
    padding: Spacing.sm,
  },
  communitiesList: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  communityCard: {
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  communityCardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  communityCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  communityDescription: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  communityMembers: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicatorActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  selectedCount: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  preferenceCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  preferenceTitle: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  preferenceDescription: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceLeft: {
    flex: 1,
  },
  dailyGoalOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  dailyGoalOption: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyGoalOptionActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  dailyGoalOptionText: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
  },
  dailyGoalOptionTextActive: {
    color: Colors.text.inverse,
  },
  toggleButton: {
    width: 48,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[300],
    padding: 2,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary[500],
  },
  toggleIndicator: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.primary,
    alignSelf: 'flex-start',
  },
  toggleIndicatorActive: {
    alignSelf: 'flex-end',
  },
  completeIcon: {
    alignSelf: 'center',
    marginBottom: Spacing['2xl'],
  },
  completeTitle: {
    ...Typography.styles.h1,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  completeDescription: {
    ...Typography.styles.body,
    textAlign: 'center',
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    marginBottom: Spacing['3xl'],
  },
  summaryCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    ...Typography.styles.h4,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryText: {
    ...Typography.styles.body,
    marginLeft: Spacing.md,
  },
  motivationText: {
    ...Typography.styles.body,
    textAlign: 'center',
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    gap: Spacing.md,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  finishButton: {
    flex: 1,
  },
  // Username Step Styles
  usernameIcon: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
  },
  usernameContainer: {
    marginBottom: Spacing.lg,
  },
  usernameInput: {
    marginBottom: Spacing.md,
  },
  checkButton: {
    alignSelf: 'center',
  },
  availabilityMessage: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  availabilityText: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.medium,
  },
  usernameRules: {
    backgroundColor: Colors.background.accent,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  rulesTitle: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  rulesText: {
    ...Typography.styles.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  // Enhanced Goals Step Styles
  categorySelector: {
    marginBottom: Spacing.lg,
  },
  categoryLabel: {
    ...Typography.styles.label,
    marginBottom: Spacing.md,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    marginRight: Spacing.sm,
    gap: Spacing.xs,
  },
  categoryOptionActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  categoryOptionText: {
    ...Typography.styles.bodySmall,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  categoryOptionTextActive: {
    color: Colors.text.inverse,
  },
  goalsCount: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  // Community Step Enhancements
  upgradeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.accent[50],
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  upgradeHintText: {
    ...Typography.styles.caption,
    color: Colors.accent[700],
    fontWeight: Typography.fontWeight.medium,
  },
  // Suggestions Step Styles
  aiIcon: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
  },
  suggestedList: {
    gap: Spacing.md,
  },
  suggestedCard: {
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.accent[200],
    backgroundColor: Colors.background.accent,
  },
  suggestedCardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  suggestedCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionBadge: {
    marginLeft: Spacing.sm,
  },
  noSuggestionsIcon: {
    alignSelf: 'center',
    marginTop: Spacing['4xl'],
  },
  // Feed Preview Styles
  feedPreview: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  previewPost: {
    padding: Spacing.lg,
  },
  previewPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  previewAvatarText: {
    ...Typography.styles.body,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.semibold,
  },
  previewPostMeta: {
    flex: 1,
  },
  previewUsername: {
    ...Typography.styles.body,
    fontWeight: Typography.fontWeight.semibold,
  },
  previewCommunity: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
  },
  previewPostContent: {
    ...Typography.styles.body,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    marginBottom: Spacing.md,
  },
  previewPostActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  previewLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  previewLikesText: {
    ...Typography.styles.caption,
    color: Colors.like,
    fontWeight: Typography.fontWeight.medium,
  },
  previewNote: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: Spacing.lg,
    backgroundColor: Colors.background.accent,
    borderRadius: BorderRadius.lg,
  },
  // Tutorial Step Styles
  tutorialCard: {
    alignItems: 'center',
    padding: Spacing['3xl'],
    marginBottom: Spacing.lg,
  },
  tutorialIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  tutorialTitle: {
    ...Typography.styles.h3,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  tutorialDescription: {
    ...Typography.styles.body,
    textAlign: 'center',
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  tutorialContent: {
    ...Typography.styles.body,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    marginBottom: Spacing['2xl'],
  },
  tutorialNavigation: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tutorialDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[300],
  },
  tutorialDotActive: {
    backgroundColor: Colors.primary[500],
    width: 24,
  },
  tutorialActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  tutorialButton: {
    flex: 1,
  },
});

export default OnboardingScreen;