import { create } from 'zustand';
import { setApiLocale } from '../services/api';
import * as SecureStore from 'expo-secure-store';

const LOCALE_KEY = 'dersimiz_locale';
export type Locale = 'tr' | 'en';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: 'en',

  setLocale: async (locale) => {
    await SecureStore.setItemAsync(LOCALE_KEY, locale);
    setApiLocale(locale);
    set({ locale });
  },

  hydrate: async () => {
    const stored = await SecureStore.getItemAsync(LOCALE_KEY);
    const locale: Locale = stored === 'tr' ? 'tr' : 'en';
    setApiLocale(locale);
    set({ locale });
  },
}));
