import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, Typography, ComponentStyles, BorderRadius } from '../utils/designSystem';

const Avatar = ({ 
  size = 'medium',
  source,
  name,
  fallbackText,
  variant = 'default',
  style = {},
  textStyle = {},
  showBadge = false,
  badgeColor = Colors.success[500],
  badgePosition = 'bottom-right',
  ...props 
}) => {
  const getSizeStyles = () => {
    const sizes = {
      xs: { width: 24, height: 24, borderRadius: 12 },
      sm: { width: 32, height: 32, borderRadius: 16 },
      medium: { width: 48, height: 48, borderRadius: 24 },
      lg: { width: 64, height: 64, borderRadius: 32 },
      xl: { width: 80, height: 80, borderRadius: 40 },
      '2xl': { width: 96, height: 96, borderRadius: 48 },
    };
    return sizes[size] || sizes.medium;
  };

  const getTextSize = () => {
    const textSizes = {
      xs: 10,
      sm: 12,
      medium: 18,
      lg: 24,
      xl: 30,
      '2xl': 36,
    };
    return textSizes[size] || textSizes.medium;
  };

  const getInitials = (text) => {
    if (!text) return '?';
    const words = text.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const getAvatarStyle = () => {
    let baseStyle = { 
      ...ComponentStyles.avatar, 
      ...getSizeStyles() 
    };
    
    // Variant styles
    switch (variant) {
      case 'square':
        baseStyle.borderRadius = BorderRadius.lg;
        break;
      case 'rounded':
        baseStyle.borderRadius = BorderRadius.xl;
        break;
      case 'outline':
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = Colors.primary[500];
        break;
      default:
        // Keep default circular style
        break;
    }
    
    return baseStyle;
  };

  const getBadgeStyle = () => {
    const sizeValue = getSizeStyles().width;
    const badgeSize = Math.max(8, sizeValue * 0.25);
    
    let baseStyle = {
      position: 'absolute',
      width: badgeSize,
      height: badgeSize,
      borderRadius: badgeSize / 2,
      backgroundColor: badgeColor,
      borderWidth: 2,
      borderColor: Colors.background.primary,
    };

    // Position the badge
    switch (badgePosition) {
      case 'top-right':
        baseStyle.top = 0;
        baseStyle.right = 0;
        break;
      case 'top-left':
        baseStyle.top = 0;
        baseStyle.left = 0;
        break;
      case 'bottom-left':
        baseStyle.bottom = 0;
        baseStyle.left = 0;
        break;
      default: // bottom-right
        baseStyle.bottom = 0;
        baseStyle.right = 0;
        break;
    }

    return baseStyle;
  };

  const displayText = fallbackText || getInitials(name);

  return (
    <View style={styles.container}>
      <View style={[getAvatarStyle(), style]} {...props}>
        {source ? (
          <Image 
            source={source} 
            style={[getSizeStyles(), { borderRadius: getAvatarStyle().borderRadius }]}
            resizeMode="cover"
          />
        ) : (
          <Text style={[
            {
              fontSize: getTextSize(),
              fontWeight: Typography.fontWeight.semibold,
              color: Colors.text.inverse,
            },
            textStyle
          ]}>
            {displayText}
          </Text>
        )}
      </View>
      
      {showBadge && (
        <View style={getBadgeStyle()} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});

export default Avatar;