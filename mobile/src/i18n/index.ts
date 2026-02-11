import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Locale } from '../store/useLocaleStore';
import en from './locales/en.json';
import tr from './locales/tr.json';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function changeLanguage(locale: Locale) {
  i18n.changeLanguage(locale);
}

export default i18n;
