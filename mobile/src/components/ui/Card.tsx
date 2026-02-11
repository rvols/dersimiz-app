import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { colors, spacing, shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'student' | 'tutor';
  elevated?: boolean;
}

export function Card({ children, style, noPadding, onPress, variant = 'default', elevated }: CardProps) {
  const variantStyle = variant === 'student'
    ? styles.studentCard
    : variant === 'tutor'
      ? styles.tutorCard
      : {};

  const shadowStyle = elevated ? shadows.cardHover : shadows.card;

  const cardStyle = [
    styles.card,
    shadowStyle,
    variantStyle,
    !noPadding && styles.padding,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.outlineGrey,
    borderRadius: 16,
  },
  padding: {
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  studentCard: {
    borderColor: colors.sparkOrange + '20',
    backgroundColor: colors.cleanWhite,
  },
  tutorCard: {
    borderColor: colors.calmTeal + '20',
    backgroundColor: colors.cleanWhite,
  },
});
