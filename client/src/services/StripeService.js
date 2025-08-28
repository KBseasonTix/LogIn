// services/StripeService.js
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_publishable_key_here';

// Replace with your backend API endpoints
const API_BASE_URL = 'https://your-backend-api.com';

class StripeService {
  constructor() {
    this.stripe = null;
  }

  // Initialize Stripe
  async initialize() {
    // This would be called in your main app component
    console.log('Stripe initialized');
  }

  // Create a customer
  async createCustomer(email, name) {
    try {
      const response = await fetch(`${API_BASE_URL}/create-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create customer');
      }

      return data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  // Create subscription
  async createSubscription(customerId, priceId, paymentMethodId) {
    try {
      const response = await fetch(`${API_BASE_URL}/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          priceId,
          paymentMethodId,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      return data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      return data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Get subscription status
  async getSubscriptionStatus(subscriptionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription-status/${subscriptionId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get subscription status');
      }

      return data;
    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw error;
    }
  }

  // Update payment method
  async updatePaymentMethod(customerId, paymentMethodId) {
    try {
      const response = await fetch(`${API_BASE_URL}/update-payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId, paymentMethodId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update payment method');
      }

      return data;
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw error;
    }
  }

  // Create payment intent for one-time purchases
  async createPaymentIntent(amount, currency = 'usd', customerId = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          currency,
          customerId,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      return data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Handle webhook events (for server-side processing)
  async handleWebhookEvent(event) {
    console.log('Webhook event received:', event.type);
    
    switch (event.type) {
      case 'customer.subscription.created':
        // Handle new subscription
        break;
      case 'customer.subscription.updated':
        // Handle subscription update
        break;
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        break;
      case 'invoice.payment_succeeded':
        // Handle successful payment
        break;
      case 'invoice.payment_failed':
        // Handle failed payment
        break;
      default:
        console.log('Unhandled webhook event:', event.type);
    }
  }

  // Store payment method locally (encrypted)
  async storePaymentMethod(paymentMethod) {
    try {
      const encryptedData = JSON.stringify(paymentMethod);
      await AsyncStorage.setItem('payment_method', encryptedData);
    } catch (error) {
      console.error('Error storing payment method:', error);
    }
  }

  // Retrieve stored payment method
  async getStoredPaymentMethod() {
    try {
      const encryptedData = await AsyncStorage.getItem('payment_method');
      return encryptedData ? JSON.parse(encryptedData) : null;
    } catch (error) {
      console.error('Error retrieving payment method:', error);
      return null;
    }
  }

  // Clear stored payment method
  async clearStoredPaymentMethod() {
    try {
      await AsyncStorage.removeItem('payment_method');
    } catch (error) {
      console.error('Error clearing payment method:', error);
    }
  }
}

// React Hook for Stripe operations
export const useStripePayments = () => {
  const { initPaymentSheet, presentPaymentSheet, confirmPayment } = useStripe();

  const setupPaymentSheet = async (customerId, ephemeralKey, paymentIntent, customerConfig) => {
    try {
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'LogIn App',
        customerId: customerId,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: customerConfig.name,
          email: customerConfig.email,
        },
        returnURL: 'login-app://payment-success',
      });

      return { success: !error, error };
    } catch (error) {
      console.error('Error setting up payment sheet:', error);
      return { success: false, error };
    }
  };

  const openPaymentSheet = async () => {
    try {
      const { error } = await presentPaymentSheet();
      
      if (error) {
        console.error('Payment sheet error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error opening payment sheet:', error);
      return { success: false, error: error.message };
    }
  };

  const processPayment = async (paymentIntentClientSecret) => {
    try {
      const { paymentIntent, error } = await confirmPayment(paymentIntentClientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, paymentIntent };
    } catch (error) {
      console.error('Error processing payment:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    setupPaymentSheet,
    openPaymentSheet,
    processPayment,
  };
};

// Stripe Provider Component
export const AppStripeProvider = ({ children }) => {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      {children}
    </StripeProvider>
  );
};

// Price IDs for your products (replace with actual price IDs from Stripe Dashboard)
export const PRICE_IDS = {
  monthly: 'price_1234567890abcdef', // Monthly Premium
  yearly: 'price_0987654321fedcba',  // Yearly Premium (discounted)
};

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  monthly: {
    priceId: PRICE_IDS.monthly,
    name: 'Monthly Premium',
    price: 5,
    interval: 'month',
    currency: 'usd',
  },
  yearly: {
    priceId: PRICE_IDS.yearly,
    name: 'Annual Premium',
    price: 50,
    interval: 'year',
    currency: 'usd',
  },
};

export default new StripeService();