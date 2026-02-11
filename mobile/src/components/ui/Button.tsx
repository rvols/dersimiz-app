import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../theme';

type Variant = 'primary' | 'secondary' | 'student' | 'tutor' | 'outline' | 'destructive' | 'ghost';
type Size = 'small' | 'medium' | 'large';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
}

const sizeStyles: Record<Size, { container: ViewStyle; text: TextStyle }> = {
  small: {
    container: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      minHeight: 40,
    },
    text: { fontSize: 13 },
  },
  medium: {
    container: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      minHeight: 52,
    },
    text: { fontSize: 15 },
  },
  large: {
    container: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      minHeight: 60,
    },
    text: { fontSize: 17 },
  },
};

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: colors.electricAzure,
      ...shadows.buttonPrimary,
    },
    text: { color: colors.cleanWhite, fontWeight: '600' },
  },
  secondary: {
    container: {
      backgroundColor: colors.mistBlue,
      borderWidth: 0,
    },
    text: { color: colors.electricAzure, fontWeight: '600' },
  },
  student: {
    container: {
      backgroundColor: colors.sparkOrange,
      ...shadows.studentAccent,
    },
    text: { color: colors.cleanWhite, fontWeight: '700' },
  },
  tutor: {
    container: {
      backgroundColor: colors.calmTeal,
      ...shadows.tutorAccent,
    },
    text: { color: colors.cleanWhite, fontWeight: '600' },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.electricAzure,
    },
    text: { color: colors.electricAzure, fontWeight: '600' },
  },
  destructive: {
    container: {
      backgroundColor: colors.alertCoral,
      shadowColor: colors.alertCoral,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    text: { color: colors.cleanWhite, fontWeight: '600' },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
    },
    text: { color: colors.electricAzure, fontWeight: '600' },
  },
};

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  disabled,
  loading,
  style,
  textStyle,
  fullWidth,
  icon,
  iconPosition = 'left',
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const iconColor = v.text.color;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.base,
        s.container,
        v.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={20} color={iconColor} style={styles.iconLeft} />
          )}
          <Text style={[styles.text, s.text, v.text, textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={20} color={iconColor} style={styles.iconRight} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.label,
    color: colors.carbonText,
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
});
