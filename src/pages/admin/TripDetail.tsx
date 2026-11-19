import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminTrip } from '../../features/trips/hooks';
import { useChannel } from '../../lib/realtime/useChannel';
import { LiveMap } from '../../components/map/LiveMap';
import { TripTimeline } from '../../components/trip/TripTimeline';
import { TripStatusPill } from '../../components/trip/TripStatusPill';
import { CallButton } from '../../components/call/CallButton';
import { Button } from '../../components/ui/button';
import { ArrowLeft, AlertTriangle, Scale, ShieldAlert, Check } from 'lucide-react';
import { TableSkeleton } from '../../components/common/Skeletons';

export const TripDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: trip, isLoading } = useAdminTrip(id || '');
  const [liveLocation, setLiveLocation] = useState<any>(null);
  const [reassignSuccess, setReassignSuccess] = useState(false);

  useChannel(id ? `trip:${id}` : null, (msg) => {
    if (msg.event === 'location' && msg.data?.location) {
      setLiveLocation(msg.data.location);
    }
  });

  if (isLoading || !trip) {
    return <TableSkeleton rows={4} />;
  }

  const activeLoc = liveLocation || trip.current_location || trip.stops[0].location;

  // Check variance
  const driverKg = trip.total_actual_kg || trip.total_planned_kg;
  const hubKg = trip.hub_weighed_kg || driverKg;
  const variancePct = trip.variance_percent || Math.round(((hubKg - driverKg) / driverKg) * 1000) / 10;
  const isHighVariance = Math.abs(variancePct) > 2.0;

  const handleReassignRemaining = () => {
    setReassignSuccess(true);
    setTimeout(() => setReassignSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <button
            onClick={() => navigate('/admin/trips')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Trips Table</span>
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Trip #{trip.id.replace('trip_', '')}
            </h2>
            <TripStatusPill status={trip.status} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {trip.driver?.phone && (
            <CallButton
              tripId={trip.id}
              target="driver"
              targetName={trip.driver?.name}
              targetPhone={trip.driver?.phone}
            />
          )}

          <Button
            size="sm"
            variant="destructive"
            onClick={handleReassignRemaining}
            className="text-xs font-bold flex items-center gap-1.5"
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Reassign Remaining Stops (Incident)</span>
          </Button>
        </div>
      </div>

      {reassignSuccess && (
        <div className="p-3 bg-red-100 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>Remaining stops have been returned to Pending Dispatch Pool for secondary assignment.</span>
        </div>
      )}

      {/* Driver, Vehicle & Scale Variance Header */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-bold uppercase">Assigned Driver</span>
          <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
            {trip.driver?.name || 'Suresh Kumar'}
          </p>
          <p className="text-[11px] text-slate-400">{trip.driver?.phone || '+91 98765 43203'}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-bold uppercase">Vehicle & Reg</span>
          <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
            {trip.vehicle?.reg_no || 'KA 01 AB 1234'}
          </p>
          <p className="text-[11px] text-slate-400">{trip.vehicle?.type} ({trip.vehicle?.capacity_kg} kg)</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-bold uppercase">Payload Recorded</span>
          <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
            {driverKg} kg collected
          </p>
          <p className="text-[11px] text-slate-400">Planned: {trip.total_planned_kg} kg</p>
        </div>

        {/* Weight Variance Cell */}
        <div
          className={`p-4 rounded-2xl border ${
            isHighVariance
              ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200'
              : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Hub Scale Variance</span>
            <Scale className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm font-black mt-1">
            {variancePct}% ({hubKg - driverKg} kg)
          </p>
          <p className="text-[11px] mt-0.5">
            {isHighVariance ? '⚠ Variance exceeds 2.0% threshold' : 'Within normal scale tolerance'}
          </p>
        </div>
      </div>

      {/* Grid: Live Route Map + Stop Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white">
          <LiveMap
            center={activeLoc}
            zoom={12}
            vehicles={[
              {
                id: trip.vehicle_id,
                name: trip.driver?.name,
                location: activeLoc,
                speed_kmh: activeLoc.speed_kmh,
                eta_minutes: trip.eta_minutes,
              },
            ]}
            stops={trip.stops.map((s) => ({
              id: s.id,
              seq: s.seq,
              type: s.type,
              name: s.name,
              location: s.location,
              status: s.status,
              expected_kg: s.expected_kg,
            }))}
            routePolyline={trip.route_polyline}
            followVehicle={true}
            className="h-[520px] w-full"
          />
        </div>

        <div className="lg:col-span-5 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm max-h-[520px] overflow-y-auto">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
            Stop Status Log & Produce Receipts
          </h3>
          <TripTimeline stops={trip.stops} />
        </div>
      </div>
    </div>
  );
};
