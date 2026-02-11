import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SafeTopViewProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Wraps content with top safe area padding so it doesn't sit under the status bar or notch/camera.
 */
export function SafeTopView({ children, style }: SafeTopViewProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});
