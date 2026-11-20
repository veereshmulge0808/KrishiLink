import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDispatchPool, getAvailableDrivers } from '../../lib/api';
import { useAssignTrip } from '../../features/trips/hooks';
import { useHubs } from '../../features/hubs/hooks';
import { DispatchPool } from '../../components/admin/DispatchPool';
import { RouteSuggestionCard } from '../../components/admin/RouteSuggestionCard';
import { AssignDriverPanel } from '../../components/admin/AssignDriverPanel';
import { LiveMap } from '../../components/map/LiveMap';
import { TripStop } from '../../types';
import { Check, Send } from 'lucide-react';
import { TableSkeleton } from '../../components/common/Skeletons';
import {
  runRouteOptimization,
  type OptimizeRouteResponse,
} from '../../features/pricing/hooks';
import { useRouteSimulation } from '../../hooks/useRouteSimulation';

export const Dispatch: React.FC = () => {
  const { data: pool, isLoading: poolLoading } = useQuery({
    queryKey: ['dispatch_pool'],
    queryFn: getDispatchPool,
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['available_drivers'],
    queryFn: getAvailableDrivers,
  });

  const { data: hubs = [] } = useHubs();
  const assignTripMutation = useAssignTrip();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(['list_1', 'list_3']) // pre-selected for instant demo!
  );
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [routePlan, setRoutePlan] = useState<OptimizeRouteResponse | null>(null);
const [isOptimizing, setIsOptimizing] = useState(false);
const [routeError, setRouteError] = useState<string | null>(null);
const [rainfallMm, setRainfallMm] = useState<number>(10);
const [departureTime, setDepartureTime] = useState<string>('06:30');
const [simPlaying, setSimPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState<number>(5);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const { vehicles: simulatedVehicles, resetSimulation } = useRouteSimulation(
    routePlan?.routes ?? [],
    { baseSpeedKmh: 28, speedMultiplier: simSpeed, isPlaying: simPlaying }
  );

async function handleOptimizeRoutes() {
  setIsOptimizing(true);
  setRouteError(null);
  try {
    const primaryHub = hubs[0];
    const result = await runRouteOptimization({
      hub: {
        id: primaryHub?.id ?? 'hub_blr_main',
        name: primaryHub?.name ?? 'Yeshwanthpur Main Hub',
        lat: (primaryHub as any)?.lat ?? (primaryHub as any)?.latitude ?? 13.0285,
        lon: (primaryHub as any)?.lon ?? (primaryHub as any)?.longitude ?? 77.5409,
      },
      stops: [
        {
          id: 'buyer_1',
          name: 'Indiranagar Hotel',
          lat: 12.9784,
          lon: 77.6408,
          demand_kg: 420,
          window_start: '07:00',
          window_end: '09:00',
        },
        {
          id: 'buyer_2',
          name: 'Koramangala Canteen',
          lat: 12.9352,
          lon: 77.6245,
          demand_kg: 380,
          window_start: '07:00',
          window_end: '09:00',
        },
        {
          id: 'buyer_3',
          name: 'Whitefield Kitchen',
          lat: 12.9698,
          lon: 77.75,
          demand_kg: 510,
          window_start: '07:00',
          window_end: '09:00',
        },
        {
          id: 'buyer_4',
          name: 'Jayanagar Wholesale',
          lat: 12.925,
          lon: 77.5938,
          demand_kg: 340,
          window_start: '07:00',
          window_end: '09:00',
        },
      ],
      vehicles: [
        { id: 'KA-01-TRUCK-1', capacity_kg: 1000 },
        { id: 'KA-01-TRUCK-2', capacity_kg: 1000 },
      ],
      route_kind: 'delivery',
      departure_time: departureTime,
      zone_id: 'bengaluru_central',
      day_of_week: 2,
      rainfall_mm: rainfallMm,
      use_p90_buffer: true,
    });
    setRoutePlan(result);
  } catch (err) {
    setRouteError(err instanceof Error ? err.message : 'Failed to optimize routes');
  } finally {
    setIsOptimizing(false);
  }
}

  // Convert selected pool items into TripStop items
  const stopsForAssignment: TripStop[] = useMemo(() => {
    if (!pool) return [];
    const result: TripStop[] = [];

    // Eligible pickups
    pool.farmer_pickups.forEach((l) => {
      if (selectedIds.has(l.id)) {
        result.push({
          id: `stop_${l.id}`,
          trip_id: '',
          seq: result.length + 1,
          type: 'PICKUP',
          status: 'PLANNED',
          location: { lat: 13.1672, lng: 78.0821 }, // Kolar farm
          name: `Farmer #${l.farmer_id} (${l.crop?.name_en})`,
          address: 'Vemgal Village, Kolar Rural',
          expected_kg: l.est_kg,
          eta: l.ready_by,
          farmer_id: l.farmer_id,
        });
      }
    });

    // Buyer deliveries
    pool.buyer_deliveries.forEach((o) => {
      if (selectedIds.has(o.id)) {
        const kg = o.items.reduce((s, it) => s + it.qty_kg, 0);
        result.push({
          id: `stop_${o.id}`,
          trip_id: '',
          seq: result.length + 1,
          type: 'DELIVERY',
          status: 'PLANNED',
          location: o.location,
          name: o.buyer?.business_name || o.address,
          address: o.address,
          expected_kg: kg,
          eta: o.slot.split('-')[0],
          order_id: o.id,
        });
      }
    });

    return result;
  }, [pool, selectedIds]);

  const totalSelectedKg = stopsForAssignment.reduce((s, st) => s + (st.expected_kg || 0), 0);

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleAssign = async (data: { driver_id: string; vehicle_id: string; stops: TripStop[] }) => {
    await assignTripMutation.mutateAsync({
      driver_id: data.driver_id,
      vehicle_id: data.vehicle_id,
      hub_id: 'h_kolar',
      stops: data.stops,
    });
    setSuccessToast('Trip created & dispatched to driver app! Farmers & buyers notified.');
    setSelectedIds(new Set());
    setTimeout(() => setSuccessToast(null), 4000);
  };

  if (poolLoading || driversLoading || !pool) {
    return <TableSkeleton rows={6} />;
  }

  // Vehicles list
  const vehicles = drivers.flatMap((d) => (d.vehicle ? [d.vehicle] : []));

  return (
    <div className="space-y-6">
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom">
          <Check className="h-5 w-5" />
          <span>{successToast}</span>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Dispatch & Fleet Assignment Console
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Review daily procurement pool, optimize route clusters, and assign vehicles directly to drivers.
        </p>
      </div>

      {/* 3 Panes Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Pane 1 (Left): Pending Pool (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Pending Tasks Pool
          </h3>
          <DispatchPool
            farmerPickups={pool.farmer_pickups}
            ineligiblePickups={pool.ineligible_pickups}
            buyerDeliveries={pool.buyer_deliveries}
            pendingTransfers={pool.pending_transfers}
            selectedStopIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={() => {}}
          />
        </div>

        {/* Pane 2 (Center): Map & Route Suggestion (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Route Cluster Preview
          </h3>

          {/* OR-Tools Optimization + Demo Simulation Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleOptimizeRoutes}
                disabled={isOptimizing}
                className="px-3 py-1.5 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isOptimizing ? 'Optimizing...' : 'Optimize Routes (OR-Tools)'}
              </button>

              {routePlan && routePlan.routes.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setSimPlaying((p) => !p)}
                    className="px-2.5 py-1.5 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {simPlaying ? '⏸ Pause' : '▶ Play'}
                  </button>
                  <button
                    type="button"
                    onClick={resetSimulation}
                    className="px-2 py-1.5 rounded-lg font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    ↺
                  </button>
                  {selectedVehicleId && (
                    <button
                      type="button"
                      onClick={() => setSelectedVehicleId(null)}
                      className="px-2 py-1.5 rounded-lg font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      All
                    </button>
                  )}
                </>
              )}
            </div>

            {routePlan && routePlan.routes.length > 0 && (
              <div className="flex items-center gap-1">
                {[
                  { label: '1x', value: 1 },
                  { label: '5x', value: 5 },
                  { label: '15x', value: 15 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSimSpeed(opt.value)}
                    className={`px-2 py-1 rounded-lg font-semibold border ${
                      simSpeed === opt.value
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {routeError && (
            <p className="text-xs text-red-600 font-medium">{routeError}</p>
          )}

          <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white">
            <LiveMap
              hubs={hubs}
              stops={
                routePlan
                  ? []
                  : stopsForAssignment.map((s) => ({
                      id: s.id,
                      seq: s.seq,
                      type: s.type,
                      name: s.name,
                      location: s.location,
                    }))
              }
              routePolyline={routePlan ? [] : stopsForAssignment.map((s) => s.location)}
              optimizedRoutes={routePlan?.routes ?? []}
              simulatedVehicles={simulatedVehicles}
              selectedVehicleId={selectedVehicleId}
              showLayerControls={true}
              zoom={11}
              className="h-80 w-full"
            />
          </div>

          {/* Clickable OR-Tools Truck Cards */}
          {routePlan && routePlan.routes.length > 0 && (
            <div className="space-y-2.5">
              {routePlan.routes.map((route) => {
                const sim = simulatedVehicles.find((v) => v.vehicle_id === route.vehicle_id);
                const isSelected = selectedVehicleId === route.vehicle_id;
                return (
                  <div
                    key={route.vehicle_id}
                    onClick={() =>
                      setSelectedVehicleId((prev) =>
                        prev === route.vehicle_id ? null : route.vehicle_id
                      )
                    }
                    className={`cursor-pointer rounded-2xl border p-3 shadow-sm space-y-1.5 transition ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">🚚 {route.vehicle_id}</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        {route.total_load_kg}/{route.capacity_kg} kg ({route.utilization_pct}%)
                      </span>
                    </div>
                    {sim && (
                      <p className="text-[11px] font-medium text-blue-700">
                        {sim.is_finished
                          ? '✅ Completed route & returned to hub'
                          : `En route to ${sim.next_stop_name} • ${sim.progress_pct}% (${sim.remaining_km} km left)`}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500">
                      {route.planned_km} km • {route.departure_time} → {route.return_time} • {routePlan.eta_method}
                    </p>
                    <ol className="text-[11px] space-y-1 pt-1 border-t border-slate-100">
                      {route.stops.map((s) => (
                        <li key={s.stop_id} className="flex justify-between">
                          <span>
                            <strong>#{s.sequence}</strong> {s.name} ({s.demand_kg} kg)
                          </span>
                          <span className="font-semibold text-slate-700">ETA {s.eta}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>
          )}

          <RouteSuggestionCard
            totalKg={totalSelectedKg}
            capacityKg={1000}
            distanceKm={38.4}
            durationMin={85}
            stopCount={stopsForAssignment.length}
            unassignedReasons={[
              {
                id: 'list_2',
                label: 'Ramesh Gowda (15 kg Beans)',
                reason: 'BELOW_MIN_PAYLOAD',
              },
            ]}
          />
        </div>
        {/* Pane 3 (Right): Assign Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Driver & Vehicle Assignment
          </h3>
          <AssignDriverPanel
            drivers={drivers}
            vehicles={vehicles}
            stops={stopsForAssignment}
            onOptimize={async () => {
              await handleOptimizeRoutes();
              setSuccessToast('Route sequence re-optimized via OR-Tools + ML ETA.');
              setTimeout(() => setSuccessToast(null), 3000);
            }}
            onAssign={handleAssign}
            isAssigning={assignTripMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
};
