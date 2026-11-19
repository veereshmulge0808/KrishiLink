import React from 'react';

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 animate-pulse space-y-3"
        >
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
          <div className="h-16 w-16 bg-slate-200 dark:bg-slate-800 rounded-2xl mx-auto" />
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 space-y-3 animate-pulse">
      <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
      ))}
    </div>
  );
};
