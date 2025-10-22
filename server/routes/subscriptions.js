// server/routes/subscriptions.js - Subscription Routes

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { catchAsync, AppError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   POST /api/subscriptions/create-checkout-session
 * @desc    Create Stripe checkout session for subscription
 * @access  Private
 */
router.post(
  '/create-checkout-session',
  authenticateToken,
  validateBody('createCheckoutSession'),
  catchAsync(async (req, res) => {
    const { priceId } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Ensure user has a Stripe customer ID
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: {
          userId: user._id.toString(),
        },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      metadata: {
        userId: user._id.toString(),
      },
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  })
);

/**
 * @route   POST /api/subscriptions/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (but verified by Stripe signature)
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  catchAsync(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set');
      return res.status(500).send('Webhook secret not configured');
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle different event types
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const customerId = session.customer;

          // Update user subscription status
          const user = await User.findOne({ stripeCustomerId: customerId });
          if (user) {
            user.subscriptionStatus = 'premium';
            user.stripeSubscriptionId = session.subscription;
            await user.save();
            console.log(`User ${user.email} upgraded to premium`);
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          const customerId = subscription.customer;

          const user = await User.findOne({ stripeCustomerId: customerId });
          if (user) {
            // Update subscription status based on Stripe status
            if (subscription.status === 'active') {
              user.subscriptionStatus = 'premium';
            } else if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
              user.subscriptionStatus = 'free';
            }
            await user.save();
            console.log(`User ${user.email} subscription status: ${subscription.status}`);
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          const customerId = subscription.customer;

          // Downgrade user to free
          const user = await User.findOne({ stripeCustomerId: customerId });
          if (user) {
            user.subscriptionStatus = 'free';
            user.stripeSubscriptionId = null;
            await user.save();
            console.log(`User ${user.email} downgraded to free`);
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          const customerId = invoice.customer;

          const user = await User.findOne({ stripeCustomerId: customerId });
          if (user) {
            console.log(`Payment failed for user ${user.email}`);
            // Optionally send notification to user
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).send('Webhook processing failed');
    }

    res.send({ received: true });
  })
);

/**
 * @route   GET /api/subscriptions/status
 * @desc    Get current subscription status
 * @access  Private
 */
router.get(
  '/status',
  authenticateToken,
  catchAsync(async (req, res) => {
    const userId = req.user.id;
    const user = await User.findById(userId).select('subscriptionStatus stripeCustomerId');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    let subscriptionDetails = null;

    // If user has a Stripe subscription, get details
    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        subscriptionDetails = {
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        };
      } catch (error) {
        console.error('Error fetching subscription details:', error.message);
      }
    }

    res.json({
      success: true,
      data: {
        subscriptionStatus: user.subscriptionStatus,
        subscriptionDetails,
      },
    });
  })
);

/**
 * @route   POST /api/subscriptions/cancel
 * @desc    Cancel subscription
 * @access  Private
 */
router.post(
  '/cancel',
  authenticateToken,
  catchAsync(async (req, res) => {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.stripeSubscriptionId) {
      throw new AppError('No active subscription found', 400);
    }

    // Cancel subscription at period end
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      data: {
        cancelAt: new Date(subscription.current_period_end * 1000),
      },
    });
  })
);

module.exports = router;
