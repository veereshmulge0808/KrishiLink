import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHubs, useStockMatrix, useUpdateStockStatus } from '../../features/hubs/hooks';
import { useCreateTransfer } from '../../features/transfers/hooks';
import { HubStockMatrix } from '../../components/stock/HubStockMatrix';
import { LiveMap } from '../../components/map/LiveMap';
import { Button } from '../../components/ui/button';
import { Warehouse, ArrowRight, Check } from 'lucide-react';
import { TableSkeleton } from '../../components/common/Skeletons';
import { StockStatus } from '../../types';

export const Hubs: React.FC = () => {
  const navigate = useNavigate();
  const { data: hubs = [], isLoading: hubsLoading } = useHubs();
  const { data: matrixData, isLoading: matrixLoading } = useStockMatrix();
  const updateStockMutation = useUpdateStockStatus();
  const createTransferMutation = useCreateTransfer();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleUpdateStatus = (hubId: string, cropId: string, status: StockStatus) => {
    updateStockMutation.mutate({
      hubId,
      cropId,
      status,
      setterName: 'Anita (Admin Control)',
    });
    setToastMessage(`Stock status updated to ${status} and broadcast to hubs.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRequestTransfer = (data: {
    from_hub_id: string;
    to_hub_id: string;
    crop_id: string;
    requested_kg: number;
  }) => {
    createTransferMutation.mutate(data);
    setToastMessage(`Transfer request created for ${data.requested_kg} kg!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (hubsLoading || matrixLoading || !matrixData) {
    return <TableSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Karnataka Hub Network & Stock Matrix
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Village aggregation mini hubs connect to Bengaluru Central Hub and city delivery micro hubs.
        </p>
      </div>

      {/* Network Overview: Hubs List Cards + Quick Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {hubs.map((hub) => (
            <div
              key={hub.id}
              onClick={() => navigate(`/admin/hubs/${hub.id}`)}
              className="p-3.5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-primary cursor-pointer transition-all shadow-sm flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      hub.type === 'main'
                        ? 'bg-purple-600'
                        : hub.type === 'village'
                        ? 'bg-emerald-600'
                        : 'bg-blue-600'
                    }`}
                  />
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {hub.name}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 capitalize">
                  {hub.type} hub · {hub.capacity_kg.toLocaleString()} kg capacity
                </p>
              </div>

              <ArrowRight className="h-4 w-4 text-slate-400" />
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white">
          <LiveMap hubs={hubs} zoom={9} className="h-[360px] w-full" />
        </div>
      </div>

      {/* 3-State Stock Matrix */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Three-State Produce Stock Matrix
            </h3>
            <p className="text-xs text-slate-500">
              🔴 Out of Stock | 🟡 Low Stock | 🟢 Sufficient. Click LOW or OUT to request lateral stock transfers.
            </p>
          </div>
        </div>

        <HubStockMatrix
          hubs={matrixData.hubs}
          crops={matrixData.crops}
          matrix={matrixData.matrix}
          onUpdateStatus={handleUpdateStatus}
          onRequestTransfer={handleRequestTransfer}
        />
      </div>
    </div>
  );
};
