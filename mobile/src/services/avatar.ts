/**
 * Avatar upload: pick image and POST to /profile/avatar (multipart).
 * Uses fetch for FormData (handles multipart correctly in React Native).
 * On Android, content:// URIs can fail to upload — we copy to cache first.
 */

import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { getStoredTokens, getLocale } from './api';
import { useAuthStore } from '../store/useAuthStore';

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1`;

export async function pickAndUploadAvatar(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Photo library permission is required');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]?.uri) return null;

  const asset = result.assets[0];
  let uri = asset.uri;

  // On Android, content:// URIs often fail with FormData upload. Copy to cache for a file:// URI.
  if (Platform.OS === 'android' && uri.startsWith('content://')) {
    const ext = asset.mimeType?.includes('png') ? 'png' : 'jpg';
    const dest = `${FileSystem.cacheDirectory}avatar-${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    uri = dest;
  }

  const rawName = asset.fileName ?? uri.split('/').pop() ?? 'avatar';
  const name = /\.\w+$/.test(rawName) ? rawName : `${rawName}.jpg`;
  const match = /\.(\w+)$/.exec(name);
  const type = asset.mimeType ?? (match ? `image/${match[1].toLowerCase()}` : 'image/jpeg');

  const formData = new FormData();
  formData.append('avatar', { uri, name, type } as unknown as Blob);

  const { accessToken } = await getStoredTokens();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': getLocale(),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  // Do NOT set Content-Type — let fetch add multipart boundary

  try {
    const res = await fetch(`${API_BASE}/profile/avatar`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const json = await res.json().catch(() => ({}));
    const avatarUrl = json?.data?.avatar_url ?? json?.avatar_url ?? null;
    const updatedUser = json?.data?.user ?? json?.user ?? null;

    if (!res.ok) {
      const msg = json?.error?.message ?? json?.message ?? `Upload failed (${res.status})`;
      throw new Error(msg);
    }

    if (updatedUser) {
      useAuthStore.getState().setUser(updatedUser);
    } else if (avatarUrl) {
      const user = useAuthStore.getState().user;
      if (user) useAuthStore.getState().setUser({ ...user, avatar_url: avatarUrl, is_approved: false, is_rejected: false });
    }
    return avatarUrl;
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('Network request failed') || err.message.includes('Failed to fetch')) {
        throw new Error('Network error. Check your connection and that the API URL is correct.');
      }
      throw err;
    }
    throw new Error('Upload failed');
  }
}
