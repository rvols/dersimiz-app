/**
 * Dersimiz Design System - Colors (Light mode only)
 * Primary Blue shared; Student = Spark Orange/Neon Lime; Tutor = Calm Teal/Warm Gold
 */

export const colors = {
  // Primary Brand
  electricAzure: '#2563EB',
  deepOcean: '#1E3A8A',

  // Neutrals
  cleanWhite: '#FFFFFF',
  mistBlue: '#F1F5F9',
  carbonText: '#0F172A',
  slateText: '#64748B',
  outlineGrey: '#E2E8F0',

  // Student persona
  sparkOrange: '#F97316',
  neonLime: '#84CC16',
  alertCoral: '#EF4444',

  // Tutor persona
  calmTeal: '#0D9488',
  warmGold: '#F59E0B',
  softIndigo: '#4F46E5',

  // Semantic
  success: '#84CC16',
  error: '#EF4444',
  warning: '#F59E0B',
} as const;

export type ColorKey = keyof typeof colors;
