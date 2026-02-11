/**
 * Global toast (snackbar) for error and success messages.
 * Design system: Alert Coral for errors, Neon Lime for success.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../theme';

type ToastType = 'error' | 'success';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION = 4500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<ToastState>({ visible: false, message: '', type: 'error' });
  const [fade] = useState(() => new Animated.Value(0));

  const showError = useCallback((message: string) => {
    setState({ visible: true, message, type: 'error' });
  }, []);

  const showSuccess = useCallback((message: string) => {
    setState({ visible: true, message, type: 'success' });
  }, []);

  useEffect(() => {
    if (!state.visible) return;
    Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setState((s) => ({ ...s, visible: false }));
      });
    }, TOAST_DURATION);
    return () => clearTimeout(t);
  }, [state.visible, state.message]);

  return (
    <ToastContext.Provider value={{ showError, showSuccess }}>
      {children}
      {state.visible && (
        <Animated.View
          style={[
            styles.wrap,
            { top: insets.top + spacing.xs },
            { opacity: fade },
          ]}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.toast,
              state.type === 'error' ? styles.toastError : styles.toastSuccess,
            ]}
          >
            <Text
              style={[styles.message, state.type === 'success' && styles.toastSuccessMessage]}
              numberOfLines={3}
            >
              {state.message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    maxWidth: width - spacing.md * 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  toastError: {
    backgroundColor: colors.alertCoral,
  },
  toastSuccess: {
    backgroundColor: colors.neonLime,
  },
  message: {
    ...typography.body,
    color: colors.cleanWhite,
    fontWeight: '500',
  },
  toastSuccessMessage: {
    color: colors.carbonText,
  },
});
