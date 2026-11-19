import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminTrips } from '../../features/trips/hooks';
import { DataTable, Column } from '../../components/common/DataTable';
import { TripStatusPill } from '../../components/trip/TripStatusPill';
import { Trip } from '../../types';
import { Button } from '../../components/ui/button';
import { ArrowRight, Clock, AlertTriangle } from 'lucide-react';

export const Trips: React.FC = () => {
  const navigate = useNavigate();
  const { data: trips = [], isLoading } = useAdminTrips();

  const columns: Column<Trip>[] = [
    {
      header: 'Trip ID',
      accessorKey: 'id',
      cell: (trip) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white">
          #{trip.id.replace('trip_', '')}
        </span>
      ),
      sortable: true,
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (trip) => (
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          {trip.type.replace('_', ' ')}
        </span>
      ),
      sortable: true,
    },
    {
      header: 'Driver & Vehicle',
      cell: (trip) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{trip.driver?.name || 'Driver'}</p>
          <p className="text-[11px] text-slate-400 font-mono">{trip.vehicle?.reg_no}</p>
        </div>
      ),
    },
    {
      header: 'Payload (kg)',
      accessorKey: 'total_planned_kg',
      cell: (trip) => (
        <div>
          <span className="font-black text-slate-900 dark:text-white">
            {trip.total_planned_kg} kg
          </span>
          {trip.total_actual_kg && (
            <span className="block text-[10px] text-emerald-600 font-bold">
              Actual: {trip.total_actual_kg} kg
            </span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      header: 'Stops',
      cell: (trip) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {trip.stops.length} stops
        </span>
      ),
    },
    {
      header: 'Status & Delays',
      cell: (trip) => (
        <div className="flex items-center gap-2">
          <TripStatusPill status={trip.status} />
          {trip.id === 'trip_first_mile_1' && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="h-3 w-3" /> +12 min delay
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Action',
      cell: (trip) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/admin/trips/${trip.id}`)}
          className="text-xs font-bold flex items-center gap-1"
        >
          <span>Monitor</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Active Fleet Trips & Routes
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Monitor first-mile collections, inter-hub transfers, and last-mile restaurant drops in real time.
        </p>
      </div>

      <DataTable
        data={trips}
        columns={columns}
        searchKey="id"
        searchPlaceholder="Search trip id, driver..."
        isLoading={isLoading}
        filename="fleet_trips.csv"
      />
    </div>
  );
};
