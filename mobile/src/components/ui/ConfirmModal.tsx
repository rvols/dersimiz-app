/**
 * In-app confirmation modal (replaces native Alert.alert).
 * Design system: Clean White card, 16px radius, colored shadow.
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Button } from './Button';
import { colors, typography, spacing, cardShadow } from '../../theme';

export interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  variant?: 'primary' | 'destructive';
  loading?: boolean;
}

export function ConfirmModal({
  visible,
  onClose,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onConfirm,
  variant = 'primary',
  loading = false,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    const result = onConfirm();
    if (result instanceof Promise) {
      result.finally(() => {});
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={onClose} />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            <Button title={cancelLabel} variant="outline" onPress={onClose} style={styles.cancelBtn} />
            <Button
              title={confirmLabel}
              variant={variant}
              onPress={handleConfirm}
              loading={loading}
              style={styles.confirmBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    backgroundColor: colors.cleanWhite,
    borderRadius: 16,
    padding: spacing.xl,
    ...cardShadow,
  },
  title: {
    ...typography.h3,
    color: colors.carbonText,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.slateText,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelBtn: { flex: 1 },
  confirmBtn: { flex: 1 },
});
