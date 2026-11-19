import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from '../ui/button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${className}`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 mb-4">
        {icon || <PackageOpen className="h-8 w-8" />}
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button onClick={onAction} className="font-bold">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
