import React, { useState } from 'react';
import { User, Vehicle, TripStop } from '../../types';
import { Button } from '../ui/button';
import { Truck, UserCheck, Sparkles, Send, GripVertical, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DriverOption {
  user_id: string;
  name: string;
  phone?: string;
  on_duty: boolean;
  vehicle?: Vehicle;
}

interface AssignDriverPanelProps {
  drivers: DriverOption[];
  vehicles: Vehicle[];
  stops: TripStop[];
  onReorderStops?: (reordered: TripStop[]) => void;
  onOptimize?: () => void;
  onAssign: (data: { driver_id: string; vehicle_id: string; stops: TripStop[] }) => void;
  isAssigning?: boolean;
  className?: string;
}

export const AssignDriverPanel: React.FC<AssignDriverPanelProps> = ({
  drivers,
  vehicles,
  stops,
  onReorderStops,
  onOptimize,
  onAssign,
  isAssigning = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.user_id || '');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [orderedStops, setOrderedStops] = useState<TripStop[]>(stops);

  const selectedDriver = drivers.find((d) => d.user_id === selectedDriverId);
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const totalKg = orderedStops.reduce((s, st) => s + (st.expected_kg || 0), 0);
  const vehicleCapacity = selectedVehicle?.capacity_kg || 1000;
  const isOverCapacity = totalKg > vehicleCapacity;

  // Simple move up / down for manual reordering
  const handleMoveStop = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= orderedStops.length) return;
    const next = [...orderedStops];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    // update seq
    const resequenced = next.map((st, i) => ({ ...st, seq: i + 1 }));
    setOrderedStops(resequenced);
    onReorderStops?.(resequenced);
  };

  const handleAssign = () => {
    if (!selectedDriverId || !selectedVehicleId || orderedStops.length === 0) return;
    onAssign({
      driver_id: selectedDriverId,
      vehicle_id: selectedVehicleId,
      stops: orderedStops,
    });
  };

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <span>{t('admin.assignDriver')}</span>
          </h4>
          {onOptimize && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOptimize}
              className="text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50 flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>{t('admin.optimizeRoutes')}</span>
            </Button>
          )}
        </div>

        {/* Driver Selection */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
            Select Driver (Admin Assignment Only)
          </label>
          <select
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {drivers.map((d) => (
              <option key={d.user_id} value={d.user_id}>
                {d.name} {d.on_duty ? '🟢 (On Duty)' : '⚪ (Available)'}
              </option>
            ))}
          </select>
        </div>

        {/* Vehicle Selection */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
            Vehicle & Payload Capacity
          </label>
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.reg_no} · {v.type} ({v.capacity_kg} kg)
              </option>
            ))}
          </select>
        </div>

        {/* Stop Sequence List (Reorderable) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Trip Stops Sequence ({orderedStops.length})
            </label>
            <span className="text-xs text-slate-400">Drag / Reorder</span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {orderedStops.map((stop, idx) => (
              <div
                key={stop.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                      {stop.name}
                    </p>
                    <p className="text-[10px] text-slate-500">{stop.expected_kg} kg</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveStop(idx, 'up')}
                    className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={idx === orderedStops.length - 1}
                    onClick={() => handleMoveStop(idx, 'down')}
                    className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payload Status & Capacity Bar */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-slate-600 dark:text-slate-300">
              Planned Payload vs Vehicle
            </span>
            <span className={isOverCapacity ? 'text-red-600 font-black' : 'text-primary'}>
              {totalKg} / {vehicleCapacity} kg
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isOverCapacity ? 'bg-red-500' : 'bg-primary'
              }`}
              style={{
                width: `${Math.min(100, Math.round((totalKg / vehicleCapacity) * 100))}%`,
              }}
            />
          </div>
          {isOverCapacity && (
            <p className="text-[11px] text-red-500 font-bold mt-1.5">
              Warning: Selected stops exceed vehicle payload capacity!
            </p>
          )}
        </div>
      </div>

      {/* Big Action Button */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button
          onClick={handleAssign}
          disabled={isAssigning || orderedStops.length === 0}
          size="lg"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 shadow flex items-center justify-center gap-2"
        >
          <Send className="h-4 w-4" />
          <span>Confirm & Assign Trip to {selectedDriver?.name || 'Driver'}</span>
        </Button>
      </div>
    </div>
  );
};
