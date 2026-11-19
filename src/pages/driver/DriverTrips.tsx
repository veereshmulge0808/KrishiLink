import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriverTrips, useAcknowledgeTrip } from '../../features/trips/hooks';
import { TripStatusPill } from '../../components/trip/TripStatusPill';
import { Button } from '../../components/ui/button';
import { Truck, MapPin, Clock, ArrowRight, Check } from 'lucide-react';
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
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white">
          {t('driver.tripsTitle')}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">{t('driver.assignedByAdmin')}</p>
      </div>

      <div className="space-y-3">
        {trips.map((trip) => {
          const isAssigned = trip.status === 'ASSIGNED';
          const isStarted = trip.status === 'STARTED';

          return (
            <div
              key={trip.id}
              onClick={() => navigate(`/driver/trip/${trip.id}`)}
              className="p-4 rounded-3xl bg-slate-800/90 border border-slate-700/80 shadow-lg hover:border-blue-500 cursor-pointer transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-400 font-mono">
                  {trip.type.replace('_', ' ')}
                </span>
                <TripStatusPill status={trip.status} />
              </div>

              <div>
                <h4 className="text-lg font-black text-white">
                  Trip #{trip.id.replace('trip_', '')}
                </h4>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  <span>Scheduled Shift: {trip.date}</span>
                </p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-900/80 text-xs">
                <div>
                  <span className="text-slate-500 block">Planned Payload</span>
                  <span className="text-base font-black text-emerald-400">
                    {trip.total_planned_kg} kg
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Stops En Route</span>
                  <span className="text-base font-black text-white">
                    {trip.stops.length} Stops
                  </span>
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
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs font-bold"
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
                  className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-md"
                >
                  <span>Open Route Map</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
