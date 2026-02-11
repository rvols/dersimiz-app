/**
 * API client for Dersimiz backend
 * Base path: /api/v1, Bearer auth, Accept-Language, refresh on 401
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import type { ApiError } from '../types/api';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

const TOKEN_ACCESS = 'dersimiz_access_token';
const TOKEN_REFRESH = 'dersimiz_refresh_token';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

let onUnauthenticated: (() => void) | null = null;
export function setOnUnauthenticated(cb: () => void) {
  onUnauthenticated = cb;
}

export async function getStoredTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_ACCESS),
      SecureStore.getItemAsync(TOKEN_REFRESH),
    ]);
    return { accessToken, refreshToken };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

export async function setStoredTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_ACCESS, accessToken),
    SecureStore.setItemAsync(TOKEN_REFRESH, refreshToken),
  ]);
}

export async function clearStoredTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_ACCESS),
    SecureStore.deleteItemAsync(TOKEN_REFRESH),
  ]);
}

let appLocale = 'en';
export function setApiLocale(locale: string) {
  appLocale = locale;
}
export function getLocale(): string {
  return appLocale;
}

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { accessToken } = await getStoredTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    config.headers['Accept-Language'] = getLocale();
    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<ApiError>) => {
    const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isLogoutRequest = original?.url?.includes('/auth/logout') ?? false;
    if (err.response?.status === 401 && !original._retry && !isLogoutRequest) {
      original._retry = true;
      const { refreshToken } = await getStoredTokens();
      if (refreshToken) {
        try {
          const { data } = await axios.post<{ data: { access_token: string; refresh_token: string } }>(
            `${API_BASE}/auth/refresh`,
            { refresh_token: refreshToken },
            { headers: { 'Accept-Language': getLocale() } }
          );
          if (data?.data?.access_token && data?.data?.refresh_token) {
            await setStoredTokens(data.data.access_token, data.data.refresh_token);
            original.headers.Authorization = `Bearer ${data.data.access_token}`;
            return api(original);
          }
        } catch (_) {
          await clearStoredTokens();
          onUnauthenticated?.();
        }
      } else {
        onUnauthenticated?.();
      }
    }
    return Promise.reject(err);
  }
);

export function isApiError(err: unknown): err is AxiosError<ApiError> {
  return axios.isAxiosError(err) && err.response?.data?.error != null;
}

export function getApiErrorCode(err: unknown): string | undefined {
  if (isApiError(err)) return err.response?.data?.error?.code;
  return undefined;
}

export function getApiErrorMessage(err: unknown): string {
  if (isApiError(err)) return err.response?.data?.error?.message ?? err.message;
  if (err instanceof Error) return err.message;
  return 'An error occurred';
}
