import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  value: number;
  min?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  min = 5,
  step = 5,
  unit = 'kg',
  onChange,
  className = '',
  size = 'default',
}) => {
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value <= min) {
      onChange(0); // Removing from cart if reduced below min
    } else {
      onChange(Math.max(min, value - step));
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value === 0) {
      onChange(min);
    } else {
      onChange(value + step);
    }
  };

  if (value === 0) {
    return (
      <button
        onClick={handleIncrement}
        className={`w-full py-2 px-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-700 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 min-h-[44px] ${className}`}
      >
        <Plus className="h-4 w-4" />
        <span>ADD</span>
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-between border-2 border-primary bg-primary-50 dark:bg-emerald-950/40 rounded-xl overflow-hidden p-0.5 w-full min-h-[44px] ${className}`}
    >
      <button
        onClick={handleDecrement}
        className="p-2 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>

      <div className="flex flex-col items-center justify-center px-2">
        <span className="font-bold text-sm sm:text-base text-primary-700 dark:text-primary-300">
          {value} <span className="text-xs font-medium">{unit}</span>
        </span>
      </div>

      <button
        onClick={handleIncrement}
        className="p-2 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
};
