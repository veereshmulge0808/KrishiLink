import React from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../i18n';
import { Languages } from 'lucide-react';

interface LanguageSwitchProps {
  className?: string;
}

export const LanguageSwitch: React.FC<LanguageSwitchProps> = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const next = currentLang === 'kn' ? 'en' : 'kn';
    changeLanguage(next);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white/90 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 active:scale-95 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 select-none min-h-[38px] ${className}`}
      aria-label="Switch Language"
    >
      <Languages className="h-4 w-4 text-primary" />
      <span>{currentLang === 'kn' ? 'English' : 'ಕನ್ನಡ'}</span>
    </button>
  );
};
