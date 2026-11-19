import React from 'react';
import { useDriverTrips } from '../../features/trips/hooks';
import { formatDate } from '../../lib/format';
import { CheckCircle2, History, Clock } from 'lucide-react';

export const DriverHistory: React.FC = () => {
  const { data: trips = [] } = useDriverTrips('u_driver_1');

  const historyTrips = [
    {
      id: 'trip_1089',
      date: '2026-11-19',
      type: 'FIRST_MILE',
      stops: 4,
      total_kg: 810,
      duration: '2h 15m',
    },
    {
      id: 'trip_1074',
      date: '2026-11-18',
      type: 'FIRST_MILE',
      stops: 5,
      total_kg: 920,
      duration: '2h 40m',
    },
    {
      id: 'trip_1052',
      date: '2026-11-17',
      type: 'FIRST_MILE',
      stops: 3,
      total_kg: 640,
      duration: '1h 50m',
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 text-white">
      <div>
        <h2 className="text-xl sm:text-2xl font-black">Completed Trip History</h2>
        <p className="text-xs text-slate-400 mt-0.5">Logs of delivered and returned routes</p>
      </div>

      <div className="space-y-3">
        {historyTrips.map((h) => (
          <div
            key={h.id}
            className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-blue-400">#{h.id}</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-base font-black">{formatDate(h.date)}</span>
              <span className="text-lg font-black text-emerald-400">{h.total_kg} kg</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-700/60">
              <span>{h.stops} Stops Visited</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{h.duration}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
