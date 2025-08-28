import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, ComponentStyles, Spacing, BorderRadius } from '../utils/designSystem';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  style = {},
  inputStyle = {},
  disabled = false,
  variant = 'default',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const getInputContainerStyle = () => {
    let baseStyle = { ...ComponentStyles.input };
    
    // Focus state
    if (isFocused) {
      baseStyle.borderColor = Colors.primary[500];
      baseStyle.borderWidth = 2;
    }
    
    // Error state
    if (error) {
      baseStyle.borderColor = Colors.error[500];
      baseStyle.borderWidth = 2;
    }
    
    // Disabled state
    if (disabled) {
      baseStyle.backgroundColor = Colors.neutral[100];
      baseStyle.opacity = 0.6;
    }
    
    // Variant styles
    switch (variant) {
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        break;
      case 'filled':
        baseStyle.backgroundColor = Colors.neutral[50];
        baseStyle.borderColor = 'transparent';
        break;
      case 'underline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 0;
        baseStyle.borderBottomWidth = 1;
        baseStyle.borderRadius = 0;
        baseStyle.paddingHorizontal = 0;
        break;
      default:
        // Keep default styling
        break;
    }
    
    // Multiline adjustments
    if (multiline) {
      baseStyle.height = undefined;
      baseStyle.textAlignVertical = 'top';
      baseStyle.paddingTop = Spacing.md;
    }
    
    return baseStyle;
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const renderRightIcon = () => {
    if (secureTextEntry) {
      return (
        <TouchableOpacity onPress={togglePasswordVisibility} style={styles.iconContainer}>
          <Ionicons 
            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
            size={20} 
            color={Colors.text.tertiary} 
          />
        </TouchableOpacity>
      );
    }
    
    if (rightIcon) {
      return (
        <TouchableOpacity onPress={onRightIconPress} style={styles.iconContainer}>
          {rightIcon}
        </TouchableOpacity>
      );
    }
    
    return null;
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, error && styles.errorLabel]}>
          {label}
        </Text>
      )}
      
      <View style={[getInputContainerStyle(), inputStyle]}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[styles.input, leftIcon && styles.inputWithLeftIcon]}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.tertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={!disabled}
          {...props}
        />
        
        {renderRightIcon()}
      </View>
      
      {maxLength && (
        <Text style={styles.charCount}>
          {value?.length || 0}/{maxLength}
        </Text>
      )}
      
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
      
      {helperText && !error && (
        <Text style={styles.helperText}>
          {helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.styles.label,
    marginBottom: Spacing.xs,
  },
  errorLabel: {
    color: Colors.error[500],
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    padding: 0, // Remove default padding to control it via container
  },
  inputWithLeftIcon: {
    marginLeft: Spacing.sm,
  },
  leftIconContainer: {
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    padding: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charCount: {
    ...Typography.styles.caption,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  errorText: {
    ...Typography.styles.caption,
    color: Colors.error[500],
    marginTop: Spacing.xs,
  },
  helperText: {
    ...Typography.styles.caption,
    marginTop: Spacing.xs,
  },
});

export default Input;