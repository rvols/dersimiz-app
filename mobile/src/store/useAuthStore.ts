import { create } from 'zustand';
import type { User, UserRole } from '../types/api';
import { api, getStoredTokens, clearStoredTokens, setStoredTokens } from '../services/api';

interface AuthState {
  user: User | null;
  isHydrated: boolean;
  setUser: (user: User | null) => void;
  hydrate: () => Promise<void>;
  login: (payload: VerifyOtpPayload) => Promise<LoginResult>;
  logout: () => Promise<void>;
  updateProfile: (data: { full_name?: string; school_name?: string | null; grade_id?: string | null; role?: UserRole }) => Promise<void>;
}

export interface VerifyOtpPayload {
  phone_number: string;
  otp_code: string;
  country_code?: string;
  session_token?: string;
}

export interface LoginResult {
  is_new_user: boolean;
  requires_legal_accept: boolean;
  next_step: string;
  user: User;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isHydrated: false,

  setUser: (user) => set({ user }),

  hydrate: async () => {
    const { accessToken } = await getStoredTokens();
    if (!accessToken) {
      set({ user: null, isHydrated: true });
      return;
    }
    try {
      const { data } = await api.get<{ data: { user: User } }>('/profile');
      if (data?.data?.user) set({ user: data.data.user, isHydrated: true });
      else set({ user: null, isHydrated: true });
    } catch {
      set({ user: null, isHydrated: true });
    }
  },

  login: async (payload) => {
    // Always send session_token when available so verify-otp matches the same session (fixes first-try fail when API uses in-memory store across workers)
    const body = {
      phone_number: payload.phone_number,
      otp_code: payload.otp_code,
      country_code: payload.country_code,
      ...(payload.session_token && { session_token: payload.session_token }),
    };
    const { data } = await api.post<{ data: LoginResult & { access_token: string; refresh_token: string } }>(
      '/auth/verify-otp',
      body
    );
    const d = data?.data ?? data;
    if (!d?.access_token || !d?.refresh_token || !d?.user) {
      throw new Error('Invalid login response');
    }
    await setStoredTokens(d.access_token, d.refresh_token);
    set({ user: d.user });
    return {
      is_new_user: d.is_new_user ?? false,
      requires_legal_accept: d.requires_legal_accept ?? false,
      next_step: d.next_step ?? '',
      user: d.user,
    };
  },

  logout: async () => {
    const { accessToken } = await getStoredTokens();
    if (accessToken) {
      try {
        await api.post('/auth/logout', undefined);
      } catch (_) {}
    }
    await clearStoredTokens();
    set({ user: null });
  },

  updateProfile: async (body) => {
    const res = await api.put<{ success?: boolean; data?: { user?: User } }>('/profile', body);
    const user = res?.data?.data?.user ?? res?.data?.user;
    if (user) set({ user });
    else await get().hydrate();
  },
}));
