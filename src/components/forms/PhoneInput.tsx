import React from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = '98765 43210',
  className = '',
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep digits only, max 10
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(digits);
  };

  return (
    <div
      className={`flex items-center rounded-2xl border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 ${className}`}
    >
      <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 select-none">
        <span className="text-base">🇮🇳</span>
        <span>+91</span>
      </div>
      <input
        type="tel"
        inputMode="numeric"
        disabled={disabled}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full bg-transparent px-3 py-2 text-base font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
        maxLength={10}
      />
    </div>
  );
};
