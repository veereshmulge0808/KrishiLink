import React from 'react';
import { StockStatus } from '../../types';
import { useTranslation } from 'react-i18next';

interface StockStatusButtonsProps {
  value: StockStatus;
  onChange: (status: StockStatus) => void;
  suggested?: StockStatus;
  disabled?: boolean;
  size?: 'sm' | 'default';
  showLabels?: boolean;
  className?: string;
}

export const StockStatusButtons: React.FC<StockStatusButtonsProps> = ({
  value,
  onChange,
  suggested,
  disabled = false,
  size = 'default',
  showLabels = false,
  className = '',
}) => {
  const { t } = useTranslation();

  const options: { status: StockStatus; icon: string; label: string; activeClass: string }[] = [
    {
      status: 'OUT',
      icon: '🔴',
      label: t('stock.OUT'),
      activeClass: 'bg-red-500/20 text-red-700 border-red-500 font-bold dark:text-red-400',
    },
    {
      status: 'LOW',
      icon: '🟡',
      label: t('stock.LOW'),
      activeClass: 'bg-amber-500/20 text-amber-700 border-amber-500 font-bold dark:text-amber-400',
    },
    {
      status: 'SUFFICIENT',
      icon: '🟢',
      label: t('stock.SUFFICIENT'),
      activeClass: 'bg-green-500/20 text-green-700 border-green-500 font-bold dark:text-green-400',
    },
  ];

  return (
    <div className={`inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 ${className}`}>
      {options.map((opt) => {
        const isSelected = value === opt.status;
        const isSuggested = suggested === opt.status;

        return (
          <button
            key={opt.status}
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onChange(opt.status);
            }}
            title={`${opt.label} ${isSuggested ? `(${t('stock.suggested')})` : ''}`}
            aria-label={opt.label}
            className={`relative flex items-center justify-center rounded-lg border transition-all ${
              size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
            } ${
              isSelected
                ? `${opt.activeClass} shadow-sm ring-1 ring-offset-1`
                : 'border-transparent text-slate-500 hover:bg-white/60 hover:text-slate-900 dark:hover:bg-slate-700'
            } disabled:opacity-50`}
          >
            <span className="text-sm select-none">{opt.icon}</span>
            {showLabels && <span className="ml-1.5">{opt.label}</span>}

            {/* Small dot if this status is suggested by ML */}
            {isSuggested && !isSelected && (
              <span
                className="absolute -top-1 -right-1 flex h-2 w-2"
                title={`${t('stock.suggested')}: ${opt.label}`}
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
