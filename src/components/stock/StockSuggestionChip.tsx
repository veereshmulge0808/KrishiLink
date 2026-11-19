import React from 'react';
import { Sparkles } from 'lucide-react';
import { StockStatus } from '../../types';
import { useTranslation } from 'react-i18next';

interface StockSuggestionChipProps {
  suggested: StockStatus;
  current: StockStatus;
  className?: string;
}

export const StockSuggestionChip: React.FC<StockSuggestionChipProps> = ({
  suggested,
  current,
  className = '',
}) => {
  const { t } = useTranslation();
  if (suggested === current) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800 font-medium ${className}`}
      title={`AI Suggestion: ${t(`stock.${suggested}`)}`}
    >
      <Sparkles className="h-3 w-3 text-blue-600" />
      <span>{t('stock.suggested')}: {suggested}</span>
    </span>
  );
};
