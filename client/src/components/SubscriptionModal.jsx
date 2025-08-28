import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useSubscription } from '../context/SubscriptionContext';
import { designSystem } from '../utils/designSystem';

const SubscriptionModal = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const { subscriptionTier, upgradeSubscription } = useSubscription();

  const plans = {
    monthly: {
      id: 'monthly',
      name: 'Monthly Premium',
      price: '$5',
      period: '/month',
      stripePriceId: 'price_monthly_5_usd', // Replace with actual Stripe price ID
      features: [
        'Unlimited communities',
        'No ads',
        'Exclusive badges',
        'Priority support'
      ]
    },
    yearly: {
      id: 'yearly', 
      name: 'Yearly Premium',
      price: '$40',
      period: '/year',
      stripePriceId: 'price_yearly_40_usd', // Replace with actual Stripe price ID
      savings: 'Save 33%!',
      features: [
        'Unlimited communities',
        'No ads', 
        'Exclusive badges',
        'Priority support',
        '2 months FREE!'
      ]
    }
  };

  const handleSubscribe = async (plan) => {
    try {
      setLoading(true);
      
      // Call your subscription service
      const result = await upgradeSubscription(plan.stripePriceId, plan.id);
      
      if (result.success) {
        Alert.alert(
          '🎉 Success!',
          `Welcome to ${plan.name}! Enjoy unlimited communities and no ads.`,
          [{ text: 'Awesome!', onPress: onClose }]
        );
      } else {
        throw new Error(result.error || 'Subscription failed');
      }
      
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert(
        'Subscription Failed', 
        error.message || 'Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const PlanCard = ({ plan, isSelected, onSelect }) => (
    <TouchableOpacity 
      style={[
        styles.planCard,
        isSelected && styles.selectedPlan,
        plan.id === 'yearly' && styles.popularPlan
      ]}
      onPress={() => onSelect(plan.id)}
    >
      {plan.savings && (
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsText}>{plan.savings}</Text>
        </View>
      )}
      
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{plan.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.planPrice}>{plan.price}</Text>
          <Text style={styles.planPeriod}>{plan.period}</Text>
        </View>
      </View>

      <View style={styles.featuresContainer}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  if (subscriptionTier === 'premium') {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.title}>🎉 You're Already Premium!</Text>
            <Text style={styles.subtitle}>
              Enjoy unlimited communities and ad-free experience.
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>
            Unlock unlimited communities and remove ads
          </Text>

          <View style={styles.plansContainer}>
            <PlanCard 
              plan={plans.monthly}
              isSelected={selectedPlan === 'monthly'}
              onSelect={setSelectedPlan}
            />
            
            <PlanCard 
              plan={plans.yearly}
              isSelected={selectedPlan === 'yearly'}
              onSelect={setSelectedPlan}
            />
          </View>

          <TouchableOpacity 
            style={[styles.subscribeButton, loading && styles.disabledButton]}
            onPress={() => handleSubscribe(plans[selectedPlan])}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.subscribeButtonText}>
                Subscribe to {plans[selectedPlan].name}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Cancel anytime. Auto-renews until cancelled.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    position: 'relative'
  },
  closeIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: designSystem.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  },
  closeText: {
    fontSize: 20,
    color: designSystem.colors.neutral[600],
    fontWeight: 'bold'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: designSystem.colors.neutral[900],
    marginBottom: 8,
    marginTop: 16
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: designSystem.colors.neutral[600],
    marginBottom: 24
  },
  plansContainer: {
    gap: 16,
    marginBottom: 24
  },
  planCard: {
    borderWidth: 2,
    borderColor: designSystem.colors.neutral[200],
    borderRadius: 16,
    padding: 20,
    position: 'relative'
  },
  selectedPlan: {
    borderColor: designSystem.colors.primary[500],
    backgroundColor: designSystem.colors.primary[50]
  },
  popularPlan: {
    borderColor: designSystem.colors.accent[500]
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: designSystem.colors.accent[500],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  savingsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: designSystem.colors.neutral[900]
  },
  priceContainer: {
    alignItems: 'flex-end'
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: designSystem.colors.primary[600]
  },
  planPeriod: {
    fontSize: 14,
    color: designSystem.colors.neutral[600]
  },
  featuresContainer: {
    gap: 8
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  checkmark: {
    fontSize: 16,
    color: designSystem.colors.success[500],
    fontWeight: 'bold'
  },
  featureText: {
    fontSize: 16,
    color: designSystem.colors.neutral[700],
    flex: 1
  },
  subscribeButton: {
    backgroundColor: designSystem.colors.primary[600],
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16
  },
  disabledButton: {
    opacity: 0.6
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  closeButton: {
    backgroundColor: designSystem.colors.neutral[200],
    borderRadius: 16,
    padding: 16,
    alignItems: 'center'
  },
  closeButtonText: {
    color: designSystem.colors.neutral[700],
    fontSize: 16,
    fontWeight: '600'
  },
  disclaimer: {
    fontSize: 12,
    color: designSystem.colors.neutral[500],
    textAlign: 'center',
    lineHeight: 16
  }
});

export default SubscriptionModal;