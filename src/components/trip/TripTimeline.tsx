import React from 'react';
import { TripStop } from '../../types';
import { CheckCircle2, Clock, MapPin } from 'lucide-react';
import { formatTimeOnly } from '../../lib/format';

interface TripTimelineProps {
  stops: TripStop[];
  className?: string;
}

export const TripTimeline: React.FC<TripTimelineProps> = ({ stops, className = '' }) => {
  return (
    <div className={`relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700 ${className}`}>
      {stops.map((stop, idx) => {
        const isDone = stop.status === 'COMPLETED';
        const isArrived = stop.status === 'ARRIVED';
        const isSkipped = stop.status === 'SKIPPED';

        const dotClass = isDone
          ? 'bg-emerald-600 ring-4 ring-emerald-100 text-white'
          : isArrived
          ? 'bg-blue-600 ring-4 ring-blue-100 text-white animate-pulse'
          : isSkipped
          ? 'bg-red-500 text-white'
          : 'bg-white border-2 border-slate-300 text-slate-500';

        return (
          <div key={stop.id} className="relative flex items-start gap-3">
            {/* Timeline node */}
            <div
              className={`absolute -left-[30px] flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${dotClass}`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <span>{stop.seq}</span>
              )}
            </div>

            {/* Content card */}
            <div className="flex-1 rounded-xl bg-slate-50 p-3.5 border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {stop.type}
                </span>
                <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400">
                  {stop.completed_at ? formatTimeOnly(stop.completed_at) : stop.eta ? `ETA ${stop.eta}` : ''}
                </span>
              </div>

              <h4 className="font-bold text-slate-900 dark:text-white mt-1 text-sm">
                {stop.name}
              </h4>
              <p className="text-xs text-slate-500">{stop.address}</p>

              {/* Recorded produce */}
              {stop.receipt_lines && stop.receipt_lines.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-1.5">
                  {stop.receipt_lines.map((line, lIdx) => (
                    <span
                      key={lIdx}
                      className="text-xs px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold"
                    >
                      {line.kg_received} kg ({line.grade})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
