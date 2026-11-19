import React from 'react';
import { StockStatus } from '../../types';
import { useTranslation } from 'react-i18next';

interface StockBadgeProps {
  status: StockStatus;
  size?: 'sm' | 'default';
  className?: string;
}

export const StockBadge: React.FC<StockBadgeProps> = ({
  status,
  size = 'default',
  className = '',
}) => {
  const { t } = useTranslation();

  const config = {
    OUT: {
      icon: '🔴',
      label: t('stock.OUT'),
      bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900',
    },
    LOW: {
      icon: '🟡',
      label: t('stock.LOW'),
      bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
    },
    SUFFICIENT: {
      icon: '🟢',
      label: t('stock.SUFFICIENT'),
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs sm:text-sm'
      } ${config.bg} ${className}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};
