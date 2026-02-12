import React, { useState } from 'react';
import { View, Text, Image, ImageStyle, StyleProp } from 'react-native';
import { colors, typography } from '../theme';

/**
 * Avatar image that falls back to placeholder when the URL fails to load
 * (e.g. localhost URL on a physical device).
 */
export function AvatarImage({
  uri,
  fallbackText,
  style,
}: {
  uri: string | null | undefined;
  fallbackText?: string;
  style?: StyleProp<ImageStyle>;
}) {
  const [loadError, setLoadError] = useState(false);

  if (!uri || loadError) {
    return (
      <View style={[style, { backgroundColor: colors.mistBlue, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[typography.h1, { color: colors.slateText }]}>{fallbackText ?? '?'}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      onError={() => setLoadError(true)}
    />
  );
}
