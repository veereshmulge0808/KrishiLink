import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import kn from './kn.json';

const savedLang = typeof window !== 'undefined' ? localStorage.getItem('krishilink_lang') : null;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    kn: { translation: kn },
  },
  lng: savedLang || 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export const changeLanguage = (lang: 'en' | 'kn') => {
  i18n.changeLanguage(lang);
  if (typeof window !== 'undefined') {
    localStorage.setItem('krishilink_lang', lang);
  }
};

export default i18n;
