import React from 'react';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EtaBadgeProps {
  minutes: number;
  className?: string;
}

export const EtaBadge: React.FC<EtaBadgeProps> = ({ minutes, className = '' }) => {
  const { t } = useTranslation();
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800 font-semibold text-sm shadow-sm ${className}`}
    >
      <Clock className="h-4 w-4 text-emerald-600 animate-pulse" />
      <span>{t('buyer.etaMinutes', { min: minutes })}</span>
    </div>
  );
};
