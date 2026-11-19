import React from 'react';
import { Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OrganicToggleProps {
  isOrganicOnly: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}

export const OrganicToggle: React.FC<OrganicToggleProps> = ({
  isOrganicOnly,
  onChange,
  className = '',
}) => {
  const { t } = useTranslation();

  return (
    <button
      onClick={() => onChange(!isOrganicOnly)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
        isOrganicOnly
          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
      } ${className}`}
    >
      <Leaf className={`h-3.5 w-3.5 ${isOrganicOnly ? 'text-white' : 'text-emerald-600'}`} />
      <span>{t('buyer.organicOnly')}</span>
    </button>
  );
};
