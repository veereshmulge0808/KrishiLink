import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriverTrips, useAcknowledgeTrip } from '../../features/trips/hooks';
import { TripStatusPill } from '../../components/trip/TripStatusPill';
import { Button } from '../../components/ui/button';
import { Truck, MapPin, Clock, ArrowRight, Check, Navigation, Building } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TableSkeleton } from '../../components/common/Skeletons';

export const DriverTrips: React.FC = () => {
  const navigate = useNavigate();
  const { data: trips = [], isLoading } = useDriverTrips('u_driver_1');
  const acknowledgeMutation = useAcknowledgeTrip();
  const { t } = useTranslation();

  if (isLoading) {
    return <TableSkeleton rows={3} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">
          {t('driver.tripsTitle')}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">{t('driver.assignedByAdmin')}</p>
      </div>

      <div className="space-y-3.5">
        {trips.map((trip) => {
          const isAssigned = trip.status === 'ASSIGNED';
          const isStarted = trip.status === 'STARTED';

          // Derive location summary
          const originStop = trip.stops[0];
          const destStop = trip.stops[trip.stops.length - 1];
          const pickupStops = trip.stops.filter((s) => s.type === 'PICKUP');

          return (
            <div
              key={trip.id}
              onClick={() => navigate(`/driver/trip/${trip.id}`)}
              className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-500 cursor-pointer transition-all space-y-3.5"
            >
              {/* Type & Status Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 font-mono">
                  {trip.type.replace('_', ' ')}
                </span>
                <TripStatusPill status={trip.status} />
              </div>

              {/* Title & Scheduled Shift */}
              <div>
                <h4 className="text-lg font-black text-slate-900">
                  Trip #{trip.id.replace('trip_', '')}
                </h4>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Scheduled Shift: <strong>{trip.date}</strong></span>
                </p>
              </div>

              {/* Payload & Stops Counter */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block">Planned Payload</span>
                  <span className="text-base font-black text-emerald-600">
                    {trip.total_planned_kg} kg
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Stops En Route</span>
                  <span className="text-base font-black text-slate-900">
                    {trip.stops.length} Stops
                  </span>
                </div>
              </div>

              {/* Exact Location Sequence of Trips & Stops */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2 text-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Route Stops & Location Itinerary:
                </span>

                <div className="space-y-1.5">
                  {/* Origin */}
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-purple-100 text-purple-700 font-black text-[10px] flex items-center justify-center shrink-0">
                      H
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        Origin: {originStop?.name || 'Village Mini Hub'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {originStop?.address || 'Kolar Rural Mandi Road'}
                      </p>
                    </div>
                  </div>

                  {/* Pickups */}
                  {pickupStops.slice(0, 3).map((stop, idx) => (
                    <div key={stop.id || idx} className="flex items-center gap-2 pl-1">
                      <span className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-[11px] font-semibold text-slate-700 truncate">
                        {stop.name} · <span className="text-emerald-700 font-bold">{stop.expected_kg} kg</span>
                      </p>
                    </div>
                  ))}

                  {pickupStops.length > 3 && (
                    <p className="text-[10px] text-slate-400 pl-7 font-bold">
                      +{pickupStops.length - 3} more farmer pickup points
                    </p>
                  )}

                  {/* Destination */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                    <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0">
                      🏁
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        Destination: {destStop?.name || 'Bengaluru Central Hub'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {destStop?.address || 'Yeshwanthpur Wholesale APMC'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                {isAssigned && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      acknowledgeMutation.mutate(trip.id);
                    }}
                    className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    <span>{t('driver.acknowledgeTrip')}</span>
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/driver/trip/${trip.id}`);
                  }}
                  className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Open Route Map</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
