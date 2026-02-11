/**
 * Avatar upload: pick image and POST to /profile/avatar (multipart).
 */

import * as ImagePicker from 'expo-image-picker';
import { api, getApiErrorMessage } from './api';
import { useAuthStore } from '../store/useAuthStore';

export async function pickAndUploadAvatar(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: [ImagePicker.MediaType.Images],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]?.uri) return null;

  const asset = result.assets[0];
  const uri = asset.uri;
  const formData = new FormData();

  const name = asset.fileName ?? uri.split('/').pop() ?? 'avatar.jpg';
  const match = /\.(\w+)$/.exec(name);
  const type = asset.mimeType ?? (match ? `image/${match[1]}` : 'image/jpeg');

  formData.append('avatar', { uri, name, type } as unknown as Blob);

  try {
    const { data } = await api.post<{ data: { avatar_url: string } }>(
      '/profile/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (d) => d,
      }
    );

    const avatarUrl = data?.data?.avatar_url ?? null;
    if (avatarUrl) {
      const user = useAuthStore.getState().user;
      if (user) useAuthStore.getState().setUser({ ...user, avatar_url: avatarUrl });
    }
    return avatarUrl;
  } catch (err) {
    const message = getApiErrorMessage(err);
    throw new Error(message);
  }
}
