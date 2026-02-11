/**
 * Dersimiz Design System - Typography
 * Outfit for display (H1, H2, stats); Inter/Public Sans for body
 */

import { Platform } from 'react-native';

const fontFamilyDisplay = Platform.select({
  ios: 'Outfit',
  android: 'Outfit',
  default: 'System',
});

const fontFamilyBody = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const typography = {
  // Display - Outfit Bold/SemiBold
  h1: {
    fontFamily: fontFamilyDisplay,
    fontWeight: '700' as const,
    fontSize: 28,
    lineHeight: 34,
  },
  h2: {
    fontFamily: fontFamilyDisplay,
    fontWeight: '600' as const,
    fontSize: 22,
    lineHeight: 28,
  },
  h3: {
    fontFamily: fontFamilyDisplay,
    fontWeight: '600' as const,
    fontSize: 18,
    lineHeight: 24,
  },
  stats: {
    fontFamily: fontFamilyDisplay,
    fontWeight: '700' as const,
    fontSize: 24,
    lineHeight: 30,
  },

  // Body - Inter/Public Sans
  bodyLarge: {
    fontFamily: fontFamilyBody,
    fontWeight: '400' as const,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamilyBody,
    fontWeight: '400' as const,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: fontFamilyBody,
    fontWeight: '400' as const,
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontFamily: fontFamilyBody,
    fontWeight: '500' as const,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamilyBody,
    fontWeight: '400' as const,
    fontSize: 12,
    lineHeight: 16,
  },
  /** Section headers above card groups (e.g. "Quick stats") */
  sectionTitle: {
    fontFamily: fontFamilyDisplay,
    fontWeight: '600' as const,
    fontSize: 16,
    lineHeight: 22,
  },
};

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
