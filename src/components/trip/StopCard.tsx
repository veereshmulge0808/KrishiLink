import React from 'react';
import { TripStop } from '../../types';
import { MapPin, Navigation } from 'lucide-react';
import { CallButton } from '../call/CallButton';
import { Button } from '../ui/button';
import { useTranslation } from 'react-i18next';

interface StopCardProps {
  stop: TripStop;
  isCurrent?: boolean;
  onSelect?: () => void;
  className?: string;
}

export const StopCard: React.FC<StopCardProps> = ({
  stop,
  isCurrent = false,
  onSelect,
  className = '',
}) => {
  const { t } = useTranslation();

  const isPickup = stop.type === 'PICKUP';
  const isDelivery = stop.type === 'DELIVERY';

  const typeConfig = {
    PICKUP: {
      badge: '🌾 Farmer Pickup',
      color: 'border-l-emerald-600',
    },
    DELIVERY: {
      badge: '🏢 Buyer Delivery',
      color: 'border-l-blue-600',
    },
    HUB: {
      badge: '🏬 Hub',
      color: 'border-l-purple-600',
    },
  }[stop.type];

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${stop.location.lat},${stop.location.lng}`,
      '_blank'
    );
  };

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl border bg-white p-4 transition-all shadow-sm dark:bg-slate-900 border-l-4 ${typeConfig.color} ${
        isCurrent
          ? 'ring-2 ring-primary border-slate-200 dark:border-slate-700 bg-primary-50/20'
          : 'border-slate-200 dark:border-slate-800'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-black text-slate-800 dark:text-slate-100">
            {stop.seq}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                {typeConfig.badge}
              </span>
              {stop.status === 'COMPLETED' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  ✓ Done
                </span>
              )}
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {stop.name}
            </h4>
            <p className="text-xs text-slate-500 line-clamp-1">{stop.address}</p>
          </div>
        </div>

        {/* Expected payload */}
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-slate-900 dark:text-white">
            {stop.actual_kg ? `${stop.actual_kg} kg` : `${stop.expected_kg} kg`}
          </p>
          {stop.eta && (
            <p className="text-xs font-bold text-emerald-600">ETA {stop.eta}</p>
          )}
        </div>
      </div>

      {/* Action buttons bar */}
      <div className="mt-3.5 flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleNavigate}
            className="text-xs font-semibold"
          >
            <Navigation className="h-3.5 w-3.5 mr-1 text-blue-600" />
            <span>{t('common.navigate')}</span>
          </Button>

          {stop.phone && (
            <CallButton
              size="sm"
              variant="outline"
              target={isPickup ? 'farmer' : 'buyer'}
              targetName={stop.name}
              targetPhone={stop.phone}
            />
          )}
        </div>

        {stop.distance_km && (
          <span className="text-xs text-slate-400 font-medium">
            {stop.distance_km} km
          </span>
        )}
      </div>
    </div>
  );
};
