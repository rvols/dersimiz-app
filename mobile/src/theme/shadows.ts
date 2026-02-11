/**
 * Dersimiz Design System - Shadows & Elevation
 * Blue-tinted shadows for depth that feels "alive"
 */

import { colors } from './colors';

// Standard card shadow - subtle blue tint
export const shadows = {
  // Cards and surfaces
  card: {
    shadowColor: colors.electricAzure,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  
  // Hover/Active state - stronger lift
  cardHover: {
    shadowColor: colors.electricAzure,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  
  // Floating elements (FAB, modals)
  floating: {
    shadowColor: colors.electricAzure,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  
  // Primary button glow
  buttonPrimary: {
    shadowColor: colors.electricAzure,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  
  // Student accent glow
  studentAccent: {
    shadowColor: colors.sparkOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  
  // Tutor accent glow
  tutorAccent: {
    shadowColor: colors.calmTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  
  // Subtle elevation
  subtle: {
    shadowColor: colors.electricAzure,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
};

// Glassmorphic effect for tab bar
export const glassmorphic = {
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  borderTopWidth: 1,
  borderTopColor: 'rgba(226, 232, 240, 0.5)',
  ...shadows.subtle,
};
