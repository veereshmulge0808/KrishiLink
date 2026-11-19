import React, { useState } from 'react';
import {
  useAdminSettlements,
  useApproveSettlement,
  useTriggerPayouts,
} from '../../features/payments/hooks';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/ui/button';
import { FarmerSettlement } from '../../types';
import { formatPaiseToRupees, formatDate } from '../../lib/format';
import { Check, Send, IndianRupee, Clock, ArrowUpRight } from 'lucide-react';
import { KpiCard } from '../../components/admin/KpiCard';

export const Payments: React.FC = () => {
  const { data: settlements = [], isLoading } = useAdminSettlements();
  const approveMutation = useApproveSettlement();
  const triggerPayoutsMutation = useTriggerPayouts();
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleTriggerPayouts = async () => {
    const res = await triggerPayoutsMutation.mutateAsync();
    setSuccessToast(`Triggered instant payouts for ${res.count} farmer settlements via UPI!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const columns: Column<FarmerSettlement>[] = [
    {
      header: 'Settlement ID',
      accessorKey: 'id',
      cell: (s) => <span className="font-mono font-bold">#{s.id}</span>,
    },
    {
      header: 'Farmer Name',
      accessorKey: 'farmer_name',
      cell: (s) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{s.farmer_name}</p>
          <p className="text-[11px] text-slate-400">{formatDate(s.date)}</p>
        </div>
      ),
      sortable: true,
    },
    {
      header: 'Accepted kg',
      accessorKey: 'accepted_kg',
      cell: (s) => <span className="font-black">{s.accepted_kg} kg</span>,
      sortable: true,
    },
    {
      header: 'Gross Amount',
      accessorKey: 'gross_amount',
      cell: (s) => <span>{formatPaiseToRupees(s.gross_amount)}</span>,
    },
    {
      header: 'Platform Fee (6%)',
      accessorKey: 'commission_amount',
      cell: (s) => <span className="text-red-500 font-bold">- {formatPaiseToRupees(s.commission_amount)}</span>,
    },
    {
      header: 'Logistics Share',
      accessorKey: 'logistics_share',
      cell: (s) => <span className="text-red-500 font-bold">- {formatPaiseToRupees(s.logistics_share)}</span>,
    },
    {
      header: 'Net Payable',
      accessorKey: 'net_amount',
      cell: (s) => (
        <span className="font-black text-primary text-base">
          {formatPaiseToRupees(s.net_amount)}
        </span>
      ),
      sortable: true,
    },
    {
      header: 'Status',
      cell: (s) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            s.status === 'PAID'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          {s.status === 'PAID' ? 'Paid ✓' : 'Due (D+1)'}
        </span>
      ),
    },
    {
      header: 'Action',
      cell: (s) => (
        <div>
          {s.status === 'DUE' ? (
            <Button
              size="sm"
              onClick={() => approveMutation.mutate(s.id)}
              className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Approve
            </Button>
          ) : (
            <span className="text-[11px] font-mono text-slate-400">{s.utr?.slice(0, 15)}...</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg animate-in slide-in-from-top">
          <Check className="h-5 w-5" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Settlements, Payouts & Receivables
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Automated D+1 farmer settlements and wholesale buyer credit tracking.
          </p>
        </div>

        <Button
          onClick={handleTriggerPayouts}
          disabled={triggerPayoutsMutation.isPending}
          className="font-bold bg-primary hover:bg-primary-700 text-white flex items-center gap-2 shadow"
        >
          <Send className="h-4 w-4" />
          <span>Trigger D+1 UPI Payout Run</span>
        </Button>
      </div>

      {/* Buyer Receivables Ageing Buckets */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
          Buyer Receivables Ageing Buckets
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
            <span className="text-xs text-slate-500 font-bold block">Current (0–7 Days)</span>
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
              {formatPaiseToRupees(8900000)}
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800">
            <span className="text-xs text-slate-500 font-bold block">8–15 Days</span>
            <span className="text-xl font-black text-blue-700 dark:text-blue-300">
              {formatPaiseToRupees(4250000)}
            </span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800">
            <span className="text-xs text-slate-500 font-bold block">16–30 Days</span>
            <span className="text-xl font-black text-amber-700 dark:text-amber-300">
              {formatPaiseToRupees(1200000)}
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 font-bold block">&gt; 30 Days (Overdue)</span>
            <span className="text-xl font-black text-slate-700 dark:text-slate-300">₹0</span>
          </div>
        </div>
      </div>

      {/* Farmer Settlements Table */}
      <DataTable
        data={settlements}
        columns={columns}
        searchKey="farmer_name"
        searchPlaceholder="Search farmer settlement..."
        filename="farmer_settlements.csv"
      />
    </div>
  );
};
