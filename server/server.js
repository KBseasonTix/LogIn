// server/server.js - Backend Implementation
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables
if (process.env.RAILWAY_ENVIRONMENT) {
  // Railway automatically injects environment variables
  console.log('Running on Railway - using injected environment variables');
} else if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config();
}

// Debug environment variables
console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'UNDEFINED');
console.log('PORT:', process.env.PORT);

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  console.error('Please set MONGODB_URI in Railway dashboard environment variables.');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('Database:', process.env.MONGODB_URI.split('/')[3]?.split('?')[0]);
})
.catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});

// Models
const User = require('./models/User');
const Community = require('./models/Community');
const Post = require('./models/Post');
const Badge = require('./models/Badge');
const Transaction = require('./models/Transaction');
const Achievement = require('./models/Achievement');
const UserAchievement = require('./models/UserAchievement');
const StreakTracker = require('./models/StreakTracker');
const BadgeGift = require('./models/BadgeGift');
const Notification = require('./models/Notification');

// Services
const AchievementEngine = require('./services/AchievementEngine');
const StreakService = require('./services/StreakService');
const NotificationService = require('./services/NotificationService');
const CacheService = require('./services/CacheService');
const BackgroundJobs = require('./jobs/BackgroundJobs');
const seedAchievements = require('./data/seedAchievements');

// Initialize achievement system after DB connection
mongoose.connection.once('open', async () => {
  console.log('Initializing achievement system...');
  
  // Seed default achievements
  await seedAchievements();
  
  // Load achievements into engine
  await AchievementEngine.loadAchievements();
  
  // Start background jobs
  BackgroundJobs.start();
  
  console.log('Achievement system initialized');
});

// Routes
const achievementRoutes = require('./routes/achievements');
const streakRoutes = require('./routes/streaks');
const badgeGiftRoutes = require('./routes/badgeGifts');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/achievements', achievementRoutes);
app.use('/api/streaks', streakRoutes);
app.use('/api/badge-gifts', badgeGiftRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password, // In real app, this would be hashed
      points: 0,
      subscriptionStatus: 'free',
      joinedCommunities: []
    });
    
    await user.save();
    
    // Create stripe customer
    const customer = await stripe.customers.create({
      email: email,
      name: username
    });
    
    user.stripeCustomerId = customer.id;
    await user.save();
    
    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        points: user.points,
        subscriptionStatus: user.subscriptionStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password (in real app, would compare hashed password)
    if (password !== user.password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    res.status(200).json({ 
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        points: user.points,
        subscriptionStatus: user.subscriptionStatus,
        joinedCommunities: user.joinedCommunities
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Community routes
app.get('/api/communities', async (req, res) => {
  try {
    const communities = await Community.find();
    res.json(communities);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/communities/join', async (req, res) => {
  try {
    const { userId, communityId } = req.body;
    
    const user = await User.findById(userId);
    const community = await Community.findById(communityId);
    
    if (!user || !community) {
      return res.status(404).json({ message: 'User or community not found' });
    }
    
    // Check subscription limit
    if (user.subscriptionStatus === 'free' && user.joinedCommunities.length >= 2) {
      return res.status(400).json({ 
        message: 'Free users can only join 2 communities. Upgrade to premium for unlimited access.' 
      });
    }
    
    // Join community
    if (!user.joinedCommunities.includes(communityId)) {
      user.joinedCommunities.push(communityId);
      await user.save();
    }
    
    // Add user to community members
    if (!community.members.includes(userId)) {
      community.members.push(userId);
      await community.save();
    }
    
    res.json({ 
      message: 'Joined community successfully',
      userCommunities: user.joinedCommunities 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Post routes
app.post('/api/posts', async (req, res) => {
  try {
    const { userId, communityId, content, picture } = req.body;
    
    // Validate content length
    if (content.length > 20) {
      return res.status(400).json({ message: 'Content must be 20 characters or less' });
    }
    
    // Check if user is in community
    const user = await User.findById(userId);
    if (!user.joinedCommunities.includes(communityId)) {
      return res.status(403).json({ message: 'User is not a member of this community' });
    }
    
    // Create post
    const post = new Post({
      userId,
      communityId,
      content,
      picture,
      positiveMarkers: 0,
      negativeMarkers: 0
    });
    
    await post.save();
    
    // Award points for posting
    user.points += 10;
    user.totalPosts += 1;
    user.lastActive = new Date();
    await user.save();
    
    // Update streak and trigger achievements
    const streakResult = await StreakService.updateUserStreak(userId, req.body.timezone);
    await AchievementEngine.checkAndAwardAchievements(userId, 'post_created', { 
      totalPosts: user.totalPosts,
      streakResult 
    });
    
    res.status(201).json({ 
      message: 'Post created successfully',
      post,
      points: user.points,
      streak: streakResult
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/posts/:id/mark', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, type } = req.body;
    
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Update markers
    if (type === 'positive') {
      post.positiveMarkers += 1;
    } else if (type === 'negative') {
      post.negativeMarkers += 1;
    }
    
    await post.save();
    
    // Award points for positive marker (only if not self)
    if (type === 'positive' && post.userId.toString() !== userId) {
      const [postOwner, reactor] = await Promise.all([
        User.findById(post.userId),
        User.findById(userId)
      ]);
      
      if (postOwner && reactor) {
        postOwner.points += 5;
        postOwner.totalReactionsReceived += 1;
        reactor.totalReactionsGiven += 1;
        
        await Promise.all([
          postOwner.save(),
          reactor.save()
        ]);
        
        // Trigger achievements for both users
        await Promise.all([
          AchievementEngine.checkAndAwardAchievements(postOwner._id, 'reaction_received', {
            totalReactionsReceived: postOwner.totalReactionsReceived
          }),
          AchievementEngine.checkAndAwardAchievements(reactor._id, 'reaction_given', {
            totalReactionsGiven: reactor.totalReactionsGiven
          })
        ]);
      }
    }
    
    res.json({ 
      message: 'Marker updated',
      positiveMarkers: post.positiveMarkers,
      negativeMarkers: post.negativeMarkers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Badge routes
app.get('/api/badges', async (req, res) => {
  try {
    const badges = await Badge.find();
    res.json(badges);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/badges/redeem', async (req, res) => {
  try {
    const { userId, badgeId } = req.body;
    
    const user = await User.findById(userId);
    const badge = await Badge.findById(badgeId);
    
    if (!user || !badge) {
      return res.status(404).json({ message: 'User or badge not found' });
    }
    
    // Check if user has enough points
    if (user.points < badge.cost) {
      return res.status(400).json({ 
        message: 'Not enough points', 
        required: badge.cost,
        current: user.points
      });
    }
    
    // Deduct points and add badge
    user.points -= badge.cost;
    
    // Check if user already has this badge
    const existingBadge = user.badges.find(b => b.badgeId.toString() === badgeId);
    if (existingBadge) {
      existingBadge.count += 1;
    } else {
      user.badges.push({ badgeId, count: 1 });
    }
    
    await user.save();
    
    // Record transaction
    const transaction = new Transaction({
      userId,
      type: 'redeem',
      amount: badge.cost,
      badgeId
    });
    await transaction.save();
    
    res.json({ 
      message: 'Badge redeemed successfully',
      points: user.points,
      badges: user.badges
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Subscription routes
app.post('/api/subscriptions/create-checkout-session', async (req, res) => {
  try {
    const { userId, priceId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: user.stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });
    
    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/subscriptions/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Get the user ID from the session
    const customerId = session.customer;
    
    try {
      // Update user subscription status
      const user = await User.findOne({ stripeCustomerId: customerId });
      if (user) {
        user.subscriptionStatus = 'premium';
        await user.save();
      }
    } catch (error) {
      console.error('Error updating user subscription:', error);
    }
  }
  
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    
    try {
      // Update user subscription status
      const user = await User.findOne({ stripeCustomerId: subscription.customer });
      if (user) {
        user.subscriptionStatus = 'free';
        await user.save();
      }
    } catch (error) {
      console.error('Error updating user subscription:', error);
    }
  }
  
  res.send({ received: true });
});

// Daily cron job for resetting daily counters
const cron = require('node-cron');

cron.schedule('0 0 * * *', async () => {
  try {
    // Reset daily post counters and check for missed posts
    const users = await User.find();
    
    for (const user of users) {
      // Check if user posted at least 5 times today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const postsToday = await Post.countDocuments({
        userId: user._id,
        createdAt: { $gte: today }
      });
      
      if (postsToday < 5) {
        // Deduct points for missed posts
        const deduction = (5 - postsToday) * 5;
        user.points = Math.max(0, user.points - deduction);
        
        // Record transaction
        const transaction = new Transaction({
          userId: user._id,
          type: 'deduct',
          amount: deduction,
          reason: 'Missed daily posts'
        });
        await transaction.save();
      }
      
      // Reset any daily counters if needed
      await user.save();
    }
    
    console.log('Daily reset completed');
  } catch (error) {
    console.error('Daily reset failed:', error);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;