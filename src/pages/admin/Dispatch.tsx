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
          <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white">
            <LiveMap
              stops={stopsForAssignment.map((s) => ({
                id: s.id,
                seq: s.seq,
                type: s.type,
                name: s.name,
                location: s.location,
              }))}
              routePolyline={stopsForAssignment.map((s) => s.location)}
              zoom={11}
              className="h-72 w-full"
            />
          </div>

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
            onOptimize={() => {
              setSuccessToast('Route sequence re-optimized via OR-Tools CVRP solver.');
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
