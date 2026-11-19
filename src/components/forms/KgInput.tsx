import React from 'react';
import { Delete, RotateCcw } from 'lucide-react';

interface KgInputProps {
  value: number;
  onChange: (val: number) => void;
  max?: number;
  className?: string;
}

export const KgInput: React.FC<KgInputProps> = ({
  value,
  onChange,
  max = 10000,
  className = '',
}) => {
  const handleDigit = (digit: string) => {
    const currentStr = value === 0 ? '' : value.toString();
    const nextStr = currentStr + digit;
    const nextVal = parseInt(nextStr, 10);
    if (!isNaN(nextVal) && nextVal <= max) {
      onChange(nextVal);
    }
  };

  const handleBackspace = () => {
    const currentStr = value.toString();
    if (currentStr.length <= 1) {
      onChange(0);
    } else {
      onChange(parseInt(currentStr.slice(0, -1), 10));
    }
  };

  const handleClear = () => {
    onChange(0);
  };

  const handleAdd = (amount: number) => {
    onChange(Math.min(max, value + amount));
  };

  return (
    <div className={`flex flex-col items-center w-full max-w-sm mx-auto ${className}`}>
      {/* Big Display */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 text-center mb-3 border border-slate-200 dark:border-slate-700">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {value.toLocaleString()}
          </span>
          <span className="text-xl font-bold text-slate-500">kg</span>
        </div>
      </div>

      {/* Quick Add Chips */}
      <div className="flex items-center justify-center gap-2 mb-3 w-full">
        {[10, 25, 50, 100].map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => handleAdd(amt)}
            className="flex-1 py-2 px-1 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 transition-colors active:scale-95 min-h-[44px]"
          >
            +{amt}
          </button>
        ))}
      </div>

      {/* Large 3x4 Touch Keypad */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="h-14 sm:h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-2xl font-black text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 active:scale-95 transition-all flex items-center justify-center min-h-[50px]"
          >
            {digit}
          </button>
        ))}

        <button
          type="button"
          onClick={handleClear}
          className="h-14 sm:h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center min-h-[50px]"
          aria-label="Clear input"
        >
          <RotateCcw className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-14 sm:h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-2xl font-black text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 active:scale-95 transition-all flex items-center justify-center min-h-[50px]"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          className="h-14 sm:h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center min-h-[50px]"
          aria-label="Backspace"
        >
          <Delete className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};
