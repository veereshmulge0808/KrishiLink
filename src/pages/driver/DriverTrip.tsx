import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useDriverTrip,
  useStartTrip,
  useArriveAtStop,
  useReachedHub,
  useReturnTrip,
} from '../../features/trips/hooks';
import { useChannel } from '../../lib/realtime/useChannel';
import { LiveMap } from '../../components/map/LiveMap';
import { StatusStepper } from '../../components/trip/StatusStepper';
import { StopCard } from '../../components/trip/StopCard';
import { ArrowLeft, Navigation, Phone, Compass, List } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useTranslation } from 'react-i18next';

export const DriverTrip: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: trip, isLoading, refetch } = useDriverTrip(id || '');
  const startTripMutation = useStartTrip();
  const arriveAtStopMutation = useArriveAtStop();
  const reachedHubMutation = useReachedHub();
  const returnTripMutation = useReturnTrip();

  const [followMode, setFollowMode] = useState(true);
  const [showAllStops, setShowAllStops] = useState(false);
  const [liveLocation, setLiveLocation] = useState<any>(null);

  // Subscribe to real-time location & status updates
  useChannel(id ? `trip:${id}` : null, (msg) => {
    if (msg.event === 'location' && msg.data?.location) {
      setLiveLocation(msg.data.location);
    }
  });

  if (isLoading || !trip) {
    return <div className="p-8 text-center text-slate-400">Loading trip itinerary...</div>;
  }

  // Find active / next stop
  const activeStop =
    trip.stops.find((s) => s.status === 'ARRIVED' || s.status === 'IN_PROGRESS') ||
    trip.stops.find((s) => s.status === 'EN_ROUTE') ||
    trip.stops.find((s) => s.status === 'PLANNED') ||
    trip.stops[trip.stops.length - 1];

  const activeIndex = trip.stops.findIndex((s) => s.id === activeStop?.id);
  const isLastStop = activeIndex === trip.stops.length - 1;

  const currentVehicleLoc = liveLocation || trip.current_location || trip.stops[0].location;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] relative bg-slate-100">
      {/* Floating Top Controls */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <button
          onClick={() => navigate('/driver')}
          className="pointer-events-auto p-2.5 rounded-2xl bg-white/95 backdrop-blur-md text-slate-800 border border-slate-200 shadow-lg active:scale-95 flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit Map</span>
        </button>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setFollowMode(!followMode)}
            className={`p-2.5 rounded-2xl border text-xs font-black shadow-lg flex items-center gap-1.5 transition-all ${
              followMode
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white/95 border-slate-200 text-slate-700'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Follow</span>
          </button>

          <button
            onClick={() => setShowAllStops(!showAllStops)}
            className="p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 shadow-lg active:scale-95 flex items-center gap-1.5 text-xs font-bold"
          >
            <List className="h-4 w-4" />
            <span>Stops ({trip.stops.length})</span>
          </button>
        </div>
      </div>

      {/* Full-screen Leaflet Map */}
      <div className="flex-1 w-full h-full relative">
        <LiveMap
          center={currentVehicleLoc}
          zoom={12}
          vehicles={[
            {
              id: trip.vehicle_id,
              name: trip.driver?.name,
              location: currentVehicleLoc,
              speed_kmh: currentVehicleLoc.speed_kmh,
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
            eta: s.eta,
          }))}
          routePolyline={trip.route_polyline}
          highlightId={activeStop?.id}
          followVehicle={followMode}
          className="h-full w-full rounded-none border-none"
        />
      </div>

      {/* Bottom Sheet Card with Active Stop & Big Status Actions */}
      <div className="z-20 bg-white border-t border-slate-200 p-4 rounded-t-3xl shadow-2xl space-y-3">
        {/* Next Stop Details Card */}
        {activeStop && (
          <StopCard
            stop={activeStop}
            isCurrent={true}
            onSelect={() => navigate(`/driver/trip/${trip.id}/stop/${activeStop.id}`)}
          />
        )}

        {/* Big Sunlight-friendly Status Stepper Action */}
        <StatusStepper
          tripStatus={trip.status}
          currentStopStatus={activeStop?.status}
          isLastStop={isLastStop}
          onStartTrip={() => startTripMutation.mutate(trip.id)}
          onArrive={() =>
            activeStop &&
            arriveAtStopMutation.mutate({ tripId: trip.id, stopId: activeStop.id })
          }
          onOpenReceipt={() =>
            activeStop && navigate(`/driver/trip/${trip.id}/stop/${activeStop.id}`)
          }
          onNextStop={() => {
            // Find next stop and mark arrive
            const nextIdx = activeIndex + 1;
            if (trip.stops[nextIdx]) {
              arriveAtStopMutation.mutate({
                tripId: trip.id,
                stopId: trip.stops[nextIdx].id,
              });
            }
          }}
          onReachedHub={() => reachedHubMutation.mutate(trip.id)}
          onReturnTrip={() => returnTripMutation.mutate(trip.id)}
        />
      </div>
    </div>
  );
};
