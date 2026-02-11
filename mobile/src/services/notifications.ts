/**
 * Push notifications: permissions, token, and handling notification open.
 * Backend no longer stores device tokens; getPushTokenAndDeviceInfo is not sent to the API.
 * Token may be used for Expo push or a future device-registration endpoint.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// In Expo Go (SDK 53+), push/remote notifications are not fully supported; avoid setting handler to prevent native errors.
const isExpoGo = Constants.appOwnership === 'expo';
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export type NotificationData = {
  type?: string;
  conversation_id?: string;
  sender_id?: string;
  ticket_id?: string;
  [key: string]: unknown;
};

let onNotificationResponse: ((data: NotificationData) => void) | null = null;

export function setOnNotificationResponse(cb: (data: NotificationData) => void) {
  onNotificationResponse = cb;
}

export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getPushTokenAndDeviceInfo(): Promise<{
  device_token: string | null;
  device_info: { platform: string; version: string; model?: string };
}> {
  const device_info = {
    platform: Platform.OS as 'ios' | 'android',
    version: Platform.Version?.toString() ?? '0',
    model: Constants.deviceName ?? undefined,
  };
  if (isExpoGo) return { device_token: null, device_info };
  const granted = await requestPermissions();
  if (!granted) return { device_token: null, device_info };

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId,
    });
    return { device_token: token.data, device_info };
  } catch {
    return { device_token: null, device_info };
  }
}

export function addNotificationResponseListener() {
  if (isExpoGo) return { remove: () => {} };
  try {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      const data = (response.notification.request.content.data || {}) as NotificationData;
      onNotificationResponse?.(data);
    });
  } catch {
    return { remove: () => {} };
  }
}
