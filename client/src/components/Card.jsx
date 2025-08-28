import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, ComponentStyles, Shadows, BorderRadius, Spacing } from '../utils/designSystem';

const Card = ({ 
  children, 
  style = {}, 
  variant = 'default',
  padding = 'default',
  shadow = 'sm',
  ...props 
}) => {
  const getCardStyle = () => {
    let baseStyle = { ...ComponentStyles.card };
    
    // Padding variants
    switch (padding) {
      case 'none':
        baseStyle.padding = 0;
        break;
      case 'sm':
        baseStyle.padding = Spacing.sm;
        break;
      case 'md':
        baseStyle.padding = Spacing.md;
        break;
      case 'lg':
        baseStyle.padding = Spacing.lg;
        break;
      case 'xl':
        baseStyle.padding = Spacing.xl;
        break;
      default:
        baseStyle.padding = Spacing.lg;
    }
    
    // Shadow variants
    if (shadow && Shadows[shadow]) {
      baseStyle = { ...baseStyle, ...Shadows[shadow] };
    }
    
    // Card variants
    switch (variant) {
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = Colors.border.medium;
        baseStyle.shadowOpacity = 0;
        baseStyle.elevation = 0;
        break;
      case 'elevated':
        baseStyle = { ...baseStyle, ...Shadows.lg };
        break;
      case 'flat':
        baseStyle.shadowOpacity = 0;
        baseStyle.elevation = 0;
        break;
      case 'accent':
        baseStyle.backgroundColor = Colors.background.accent;
        break;
      default:
        // Keep default styling
        break;
    }
    
    return baseStyle;
  };

  return (
    <View style={[getCardStyle(), style]} {...props}>
      {children}
    </View>
  );
};

export default Card;