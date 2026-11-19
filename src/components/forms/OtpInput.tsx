import React, { useRef } from 'react';

interface OtpInputProps {
  value: string;
  length?: number;
  onChange: (otp: string) => void;
  className?: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  length = 6,
  onChange,
  className = '',
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const char = e.target.value.slice(-1);
    const chars = value.split('');
    chars[index] = char;
    const nextVal = chars.join('').slice(0, length);
    onChange(nextVal);

    if (char && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className={`flex justify-center gap-2 sm:gap-3 ${className}`}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="h-12 w-11 sm:h-14 sm:w-12 rounded-xl border-2 border-slate-200 bg-white text-center text-xl font-bold text-slate-900 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      ))}
    </div>
  );
};
