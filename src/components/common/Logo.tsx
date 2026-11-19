import React from 'react';
import { APP_NAME, APP_TAGLINE } from '../../lib/constants';

interface LogoProps {
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  textColor?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  imageClassName = '',
  showText = true,
  showSubtitle = false,
  subtitle = 'Bulk Fresh Agritech',
  size = 'md',
  textColor,
}) => {
  const sizeMap = {
    xs: { img: 'h-7 w-auto', text: 'text-sm', sub: 'text-[9px]' },
    sm: { img: 'h-9 w-auto', text: 'text-base', sub: 'text-[10px]' },
    md: { img: 'h-11 w-auto', text: 'text-lg', sub: 'text-[11px]' },
    lg: { img: 'h-14 w-auto', text: 'text-xl', sub: 'text-xs' },
    xl: { img: 'h-20 w-auto', text: 'text-2xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <img
        src="/logo.png"
        alt="KrishiLink Logo"
        className={`${currentSize.img} object-contain shrink-0 drop-shadow-sm ${imageClassName}`}
      />
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span
            className={`font-black tracking-tight ${currentSize.text} ${
              textColor || 'text-slate-900 dark:text-white'
            }`}
          >
            {APP_NAME}
          </span>
          {showSubtitle && (
            <span className={`font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-0.5 ${currentSize.sub}`}>
              {subtitle || APP_TAGLINE}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
