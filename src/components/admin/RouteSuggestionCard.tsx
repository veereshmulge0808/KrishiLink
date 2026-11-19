import React from 'react';
import { Truck, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface RouteSuggestionCardProps {
  totalKg: number;
  capacityKg?: number;
  distanceKm: number;
  durationMin: number;
  stopCount: number;
  unassignedReasons?: { id: string; reason: string; label: string }[];
  className?: string;
}

export const RouteSuggestionCard: React.FC<RouteSuggestionCardProps> = ({
  totalKg,
  capacityKg = 1000,
  distanceKm,
  durationMin,
  stopCount,
  unassignedReasons = [],
  className = '',
}) => {
  const capacityPct = Math.min(100, Math.round((totalKg / capacityKg) * 100));

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          <span>Optimized Route Summary (CVRP)</span>
        </h4>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {stopCount} stops
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center mb-3">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Payload</p>
          <p className="text-sm font-black text-slate-900 dark:text-white">{totalKg} kg</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Distance</p>
          <p className="text-sm font-black text-slate-900 dark:text-white">{distanceKm} km</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Est. Duration</p>
          <p className="text-sm font-black text-slate-900 dark:text-white">{durationMin} min</p>
        </div>
      </div>

      {/* Capacity Utilization */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-bold text-slate-500">
          <span>Vehicle Capacity Utilization</span>
          <span className={capacityPct > 90 ? 'text-red-500' : 'text-primary'}>
            {totalKg} / {capacityKg} kg ({capacityPct}%)
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              capacityPct > 90 ? 'bg-red-500' : 'bg-primary'
            }`}
            style={{ width: `${capacityPct}%` }}
          />
        </div>
      </div>

      {/* Unassigned / Threshold Exceptions */}
      {unassignedReasons.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Excluded from Cluster:</span>
          </p>
          {unassignedReasons.map((item) => (
            <div
              key={item.id}
              className="text-[11px] p-2 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex justify-between"
            >
              <span>{item.label}</span>
              <span className="font-mono font-bold text-amber-800">{item.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
