import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Typography, ComponentStyles, BorderRadius, Spacing } from '../utils/designSystem';

const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  loading = false,
  icon = null,
  style = {},
  textStyle = {},
  ...props 
}) => {
  const getButtonStyle = () => {
    const baseStyle = { ...ComponentStyles.button };
    
    // Size variants
    if (size === 'small') {
      baseStyle.paddingVertical = Spacing.sm;
      baseStyle.paddingHorizontal = Spacing.md;
      baseStyle.borderRadius = BorderRadius.md;
    } else if (size === 'large') {
      baseStyle.paddingVertical = Spacing.lg;
      baseStyle.paddingHorizontal = Spacing['2xl'];
      baseStyle.borderRadius = BorderRadius.xl;
    }
    
    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = Colors.primary[500];
        break;
      case 'secondary':
        baseStyle.backgroundColor = Colors.secondary[500];
        break;
      case 'success':
        baseStyle.backgroundColor = Colors.success[500];
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = Colors.primary[500];
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        break;
      case 'danger':
        baseStyle.backgroundColor = Colors.error[500];
        break;
      default:
        baseStyle.backgroundColor = Colors.primary[500];
    }
    
    // Disabled state
    if (disabled) {
      baseStyle.opacity = 0.5;
    }
    
    return baseStyle;
  };
  
  const getTextStyle = () => {
    const baseTextStyle = size === 'small' ? Typography.styles.buttonSmall : Typography.styles.button;
    
    switch (variant) {
      case 'outline':
        baseTextStyle.color = Colors.primary[500];
        break;
      case 'ghost':
        baseTextStyle.color = Colors.primary[500];
        break;
      default:
        baseTextStyle.color = Colors.text.inverse;
    }
    
    return baseTextStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary[500] : Colors.text.inverse} 
        />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;