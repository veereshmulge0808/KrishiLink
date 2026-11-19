import React from 'react';

export const MapLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-emerald-600" />
        <span>Farmer Pickup</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-blue-600" />
        <span>Buyer Delivery</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-purple-600" />
        <span>Logistics Hub</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-base">🚚</span>
        <span>Live Vehicle</span>
      </div>
    </div>
  );
};
