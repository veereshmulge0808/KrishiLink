import React, { useState } from 'react';
import { mockDb } from '../../lib/api/mock/db';
import { DataTable, Column } from '../../components/common/DataTable';
import { BuyerProfile } from '../../types';
import { Button } from '../../components/ui/button';
import { formatPaiseToRupees } from '../../lib/format';
import { Store, Plus, ShieldCheck } from 'lucide-react';

export const Buyers: React.FC = () => {
  const [buyers] = useState<BuyerProfile[]>(mockDb.buyers);

  const columns: Column<BuyerProfile>[] = [
    {
      header: 'Business Name',
      accessorKey: 'business_name',
      cell: (b) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{b.business_name}</p>
          <p className="text-[11px] text-slate-400 capitalize">{b.business_type} · GSTIN: {b.gstin || 'Unregistered'}</p>
        </div>
      ),
      sortable: true,
    },
    {
      header: 'Delivery Address',
      accessorKey: 'address',
      cell: (b) => <span className="text-xs font-medium text-slate-600 dark:text-slate-300 line-clamp-1">{b.address}</span>,
    },
    {
      header: 'Credit Limit',
      accessorKey: 'credit_limit',
      cell: (b) => (
        <span className="font-black text-slate-900 dark:text-white">
          {formatPaiseToRupees(b.credit_limit)}
        </span>
      ),
      sortable: true,
    },
    {
      header: 'Current Due',
      accessorKey: 'credit_due',
      cell: (b) => (
        <span className="font-bold text-amber-600">
          {formatPaiseToRupees(b.credit_due || 0)}
        </span>
      ),
      sortable: true,
    },
    {
      header: 'Assigned City Hub',
      cell: (b) => {
        const hub = mockDb.hubs.find((h) => h.id === b.delivery_hub_id);
        return <span className="text-xs font-semibold">{hub?.name || 'City Hub'}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Wholesale Commercial Buyers
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Bulk restaurants, catering kitchens, and institutional mess accounts across Bengaluru.
          </p>
        </div>
      </div>

      <DataTable
        data={buyers}
        columns={columns}
        searchKey="business_name"
        searchPlaceholder="Search buyer business name..."
        filename="buyers_directory.csv"
      />
    </div>
  );
};
