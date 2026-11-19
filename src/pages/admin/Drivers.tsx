import React, { useState } from 'react';
import { mockDb } from '../../lib/api/mock/db';
import { DataTable, Column } from '../../components/common/DataTable';
import { DriverProfile } from '../../types';
import { Button } from '../../components/ui/button';
import { Truck, Navigation, CheckCircle2 } from 'lucide-react';

export const Drivers: React.FC = () => {
  const [drivers] = useState<DriverProfile[]>(mockDb.drivers);

  const columns: Column<DriverProfile>[] = [
    {
      header: 'Driver Name',
      cell: (d) => {
        const u = mockDb.users.find((u) => u.id === d.user_id);
        return (
          <div>
            <p className="font-bold text-slate-900 dark:text-white">{u?.name || 'Driver'}</p>
            <p className="text-[11px] text-slate-400 font-mono">{u?.phone}</p>
          </div>
        );
      },
    },
    {
      header: 'Assigned Vehicle',
      cell: (d) => {
        const v = mockDb.vehicles.find((veh) => veh.id === d.vehicle_id);
        return (
          <div>
            <p className="font-black text-slate-900 dark:text-white font-mono">{v?.reg_no}</p>
            <p className="text-[11px] text-slate-400">{v?.type} ({v?.capacity_kg} kg payload)</p>
          </div>
        );
      },
    },
    {
      header: 'Driving Licence',
      accessorKey: 'licence_no',
      cell: (d) => <span className="font-mono text-xs">{d.licence_no}</span>,
    },
    {
      header: 'Duty Status',
      accessorKey: 'on_duty',
      cell: (d) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            d.on_duty
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {d.on_duty ? '🟢 Active On Duty' : '⚪ Off Duty'}
        </span>
      ),
    },
    {
      header: 'Home Hub',
      cell: (d) => {
        const hub = mockDb.hubs.find((h) => h.id === d.home_hub_id);
        return <span className="text-xs font-semibold">{hub?.name}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Fleet Drivers & Vehicles
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Drivers are directly assigned routes by Admin Control. No marketplace bidding.
          </p>
        </div>
      </div>

      <DataTable
        data={drivers}
        columns={columns}
        filename="fleet_drivers.csv"
      />
    </div>
  );
};
