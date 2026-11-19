import React from 'react';
import { formatPriceRange } from '../../lib/format';

interface PriceRangeBadgeProps {
  low: number; // in paise
  high: number; // in paise
  unit?: string;
  className?: string;
}

export const PriceRangeBadge: React.FC<PriceRangeBadgeProps> = ({
  low,
  high,
  unit = 'kg',
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-baseline font-bold text-slate-900 dark:text-white ${className}`}
    >
      <span className="text-base sm:text-lg">{formatPriceRange(low, high, unit)}</span>
    </div>
  );
};
