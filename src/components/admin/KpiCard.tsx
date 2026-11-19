import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all hover:shadow dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
          {title}
        </span>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight dark:text-white">
          {value}
        </h3>
        {trend && (
          <div
            className={`flex items-center text-xs font-bold ${
              trend.isPositive ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="h-4 w-4 mr-0.5" />
            ) : (
              <ArrowDownRight className="h-4 w-4 mr-0.5" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>
      )}
    </div>
  );
};
