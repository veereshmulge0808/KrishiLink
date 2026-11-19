import React, { useState } from 'react';
import { useTransfers, useUpdateTransferStatus } from '../../features/transfers/hooks';
import { TransferRequestCard } from '../../components/admin/TransferRequestCard';
import { TransferStatus } from '../../types';
import { ArrowLeftRight, Check, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';

export const Transfers: React.FC = () => {
  const { data: transfers = [] } = useTransfers();
  const updateStatusMutation = useUpdateTransferStatus();

  const columns: { id: TransferStatus; label: string; color: string }[] = [
    { id: 'REQUESTED', label: 'Requested', color: 'border-t-amber-500' },
    { id: 'APPROVED', label: 'Approved', color: 'border-t-blue-500' },
    { id: 'ASSIGNED', label: 'Assigned Driver', color: 'border-t-indigo-500' },
    { id: 'IN_TRANSIT', label: 'In Transit 🚚', color: 'border-t-purple-500' },
    { id: 'RECEIVED', label: 'Received at Hub ✓', color: 'border-t-emerald-500' },
  ];

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'APPROVED' });
  };

  const handleAssignDriver = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'IN_TRANSIT' });
  };

  const handleReject = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'REJECTED' });
  };

  const handleReceive = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'RECEIVED' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Inter-Hub Stock Transfers
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Lateral produce rebalancing across village and city hubs to avert shortages.
          </p>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colItems = transfers.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className={`rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 p-3 border border-slate-200 dark:border-slate-800 border-t-4 ${col.color} flex flex-col min-h-[480px]`}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {col.label}
                </h4>
                <span className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold flex items-center justify-center text-slate-700 dark:text-slate-200">
                  {colItems.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {colItems.length === 0 ? (
                  <div className="h-28 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-[11px] text-slate-400 font-medium">
                    No requests
                  </div>
                ) : (
                  colItems.map((tr) => (
                    <TransferRequestCard
                      key={tr.id}
                      transfer={tr}
                      onApprove={handleApprove}
                      onAssignDriver={handleAssignDriver}
                      onReject={handleReject}
                      onReceive={handleReceive}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
