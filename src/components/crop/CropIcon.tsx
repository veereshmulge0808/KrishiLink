import React from 'react';

interface CropIconProps {
  emoji?: string;
  cropId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const CROP_EMOJIS: Record<string, string> = {
  c_tomato: '🍅',
  c_tomato_org: '🍅',
  c_onion: '🧅',
  c_potato: '🥔',
  c_carrot: '🥕',
  c_beans: '🫘',
  c_cabbage: '🥬',
  c_cauliflower: '🥦',
  c_brinjal: '🍆',
  c_green_chilli: '🌶️',
  c_capsicum: '🫑',
  c_coriander: '🌿',
  c_spinach: '🥬',
};

export const CropIcon: React.FC<CropIconProps> = ({
  emoji,
  cropId,
  size = 'md',
  className = '',
}) => {
  const iconEmoji = emoji || (cropId ? CROP_EMOJIS[cropId] : '🥬') || '🥬';

  const sizeStyles = {
    sm: 'text-xl w-8 h-8',
    md: 'text-2xl w-10 h-10',
    lg: 'text-4xl w-14 h-14',
    xl: 'text-5xl w-20 h-20',
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl bg-slate-100/80 dark:bg-slate-800 select-none shadow-sm ${sizeStyles[size]} ${className}`}
    >
      <span>{iconEmoji}</span>
    </div>
  );
};
