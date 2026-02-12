import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { create } from 'zustand';
import { api } from '../services/api';

interface SupportUnreadState {
  count: number;
  isOnSupportScreen: boolean;
  fetchCount: () => Promise<void>;
  markRead: () => Promise<void>;
  setOnSupportScreen: (value: boolean) => void;
}

export const useSupportUnreadStore = create<SupportUnreadState>((set) => ({
  isOnSupportScreen: false,
  count: 0,

  fetchCount: async () => {
    try {
      const { data } = await api.get<{ data: { count: number } }>('/support/unread-count');
      set({ count: data?.data?.count ?? 0 });
    } catch {
      set({ count: 0 });
    }
  },

  markRead: async () => {
    try {
      await api.post('/support/conversation/mark-read');
      set({ count: 0 });
    } catch {
      // ignore
    }
  },

  setOnSupportScreen: (value: boolean) => set({ isOnSupportScreen: value }),
}));

export function useSupportUnreadRefresh() {
  const fetchCount = useSupportUnreadStore((s) => s.fetchCount);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') fetchCount();
    });
    return () => sub.remove();
  }, [fetchCount]);
}

export function useSupportUnreadPoll() {
  const fetchCount = useSupportUnreadStore((s) => s.fetchCount);
  const isOnSupportScreen = useSupportUnreadStore((s) => s.isOnSupportScreen);
  useEffect(() => {
    if (isOnSupportScreen) return;
    const interval = setInterval(fetchCount, 20000);
    return () => clearInterval(interval);
  }, [isOnSupportScreen, fetchCount]);
}
