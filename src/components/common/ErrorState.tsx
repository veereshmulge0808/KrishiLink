import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading data. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 mb-3">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-red-900 dark:text-red-200">{title}</h3>
      <p className="mt-1 text-xs text-red-700 dark:text-red-300 max-w-sm">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="border-red-300 text-red-800 hover:bg-red-100"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};
