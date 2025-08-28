// Design System - Professional Silver & Blue Color Palette
export const Colors = {
  // Primary Colors - Professional Blue Palette
  primary: {
    50: '#EBF4FF',
    100: '#D1E7FF',
    200: '#A3CFFF',
    300: '#75B7FF',
    400: '#479FFF',
    500: '#2563EB', // Main professional blue
    600: '#1D4ED8',
    700: '#1E40AF',
    800: '#1E3A8A',
    900: '#1E3A8A',
  },

  // Secondary Colors - Silver/Gray Palette
  secondary: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B', // Main silver
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Accent Colors - Complementary Blue Tones
  accent: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9', // Accent blue
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },

  // Success/Growth Colors - Blue-tinted success
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Success green with blue undertones
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Error Colors
  error: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#F44336',
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
  },

  // Warning Colors
  warning: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FFC107',
    600: '#FFB300',
    700: '#FFA000',
    800: '#FF8F00',
    900: '#FF6F00',
  },

  // Neutral Colors - Professional Silver/Gray Scale
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },

  // Semantic Colors - Silver & Blue Theme
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
    accent: '#EBF4FF',
  },

  text: {
    primary: '#0F172A', // Dark charcoal for readability
    secondary: '#334155', // Medium gray
    tertiary: '#64748B', // Light gray
    inverse: '#FFFFFF',
    link: '#2563EB', // Professional blue
  },

  border: {
    light: '#F1F5F9',
    medium: '#E2E8F0',
    dark: '#CBD5E1',
  },

  // Social interaction colors - Blue theme
  like: '#10B981', // Success blue-green
  dislike: '#64748B', // Neutral silver
  comment: '#2563EB', // Primary blue
  
  // Gradient Colors for Silver-Blue Theme
  gradient: {
    silverBlue: ['#F8FAFC', '#EBF4FF'],
    blueAccent: ['#EBF4FF', '#D1E7FF'],
    silverDark: ['#E2E8F0', '#CBD5E1'],
    primaryBlue: ['#2563EB', '#1D4ED8'],
  },
};

// Typography Scale
export const Typography = {
  // Font Families
  fontFamily: {
    primary: 'System', // Will use system font
    mono: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },

  // Font Weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Font Sizes - Mobile-optimized scale
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },

  // Line Heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Text Styles - Ready-to-use combinations
  styles: {
    h1: {
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 1.25,
      color: Colors.text.primary,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 1.3,
      color: Colors.text.primary,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 1.35,
      color: Colors.text.primary,
    },
    h4: {
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 1.4,
      color: Colors.text.primary,
    },
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.5,
      color: Colors.text.primary,
    },
    body: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 1.5,
      color: Colors.text.primary,
    },
    bodySmall: {
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 1.4,
      color: Colors.text.secondary,
    },
    caption: {
      fontSize: 11,
      fontWeight: '400',
      lineHeight: 1.4,
      color: Colors.text.tertiary,
    },
    button: {
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 1.2,
    },
    buttonSmall: {
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 1.2,
    },
    label: {
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 1.3,
      color: Colors.text.secondary,
    },
  },
};

// Spacing Scale - Based on 4px grid
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '7xl': 80,
  '8xl': 96,
};

// Border Radius Scale
export const BorderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

// Shadow System
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
};

// Layout Breakpoints (for responsive design)
export const Breakpoints = {
  sm: 375,
  md: 768,
  lg: 1024,
  xl: 1280,
};

// Animation Durations
export const Animation = {
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
};

// Common Component Styles
export const ComponentStyles = {
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  
  button: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  input: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    backgroundColor: Colors.background.primary,
    fontSize: Typography.fontSize.base,
  },
  
  avatar: {
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Silver-Blue Gradient Styles
  gradientCard: {
    backgroundColor: Colors.background.accent,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  
  professionalButton: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[500],
    ...Shadows.sm,
  },
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Breakpoints,
  Animation,
  ComponentStyles,
};