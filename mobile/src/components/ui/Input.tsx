import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {/* {label ? <Text style={styles.label}>{label}</Text> : null} - label is handled outside in LessonsScreen usage context, or we can keep it */}
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.slateText}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    ...typography.label,
    color: colors.carbonText,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    fontSize: 16,
    color: colors.carbonText,
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.outlineGrey,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  inputError: { borderColor: colors.alertCoral, borderWidth: 1.5 },
  error: {
    ...typography.caption,
    color: colors.alertCoral,
    marginTop: spacing.xs,
  },
});
