import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHubDetail, useStockMatrix } from '../../features/hubs/hooks';
import { useAdminTrips } from '../../features/trips/hooks';
import { StockStatusButtons } from '../../components/stock/StockStatusButtons';
import { LiveMap } from '../../components/map/LiveMap';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Warehouse, Users, Truck, History } from 'lucide-react';
import { TableSkeleton } from '../../components/common/Skeletons';

export const HubDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: hub, isLoading: hubLoading } = useHubDetail(id || '');
  const { data: matrixData } = useStockMatrix();
  const { data: trips = [] } = useAdminTrips();

  if (hubLoading || !hub) {
    return <TableSkeleton rows={4} />;
  }

  const hubTrips = trips.filter((t) => t.hub_id === hub.id);

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/admin/hubs')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Hubs</span>
        </button>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {hub.name}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">{hub.address}</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-bold uppercase">Classification</span>
          <p className="text-base font-black text-slate-900 dark:text-white mt-1 capitalize">
            {hub.type} hub
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-bold uppercase">Capacity</span>
          <p className="text-base font-black text-slate-900 dark:text-white mt-1">
            {hub.capacity_kg.toLocaleString()} kg
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-bold uppercase">Cold Storage</span>
          <p className="text-base font-black text-emerald-600 mt-1">
            {hub.has_cold_room ? 'Available ✓' : 'Ambient Only'}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-bold uppercase">Scheduled Trips</span>
          <p className="text-base font-black text-blue-600 mt-1">{hubTrips.length} Trips</p>
        </div>
      </div>

      {/* Hub Map */}
      <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white">
        <LiveMap center={hub.location} zoom={12} hubs={[hub]} className="h-64 w-full" />
      </div>

      {/* Stock Status for this hub */}
      {matrixData && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Current Produce Inventory Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {matrixData.crops.map((crop) => {
              const cell = matrixData.matrix[hub.id]?.[crop.id] || { status: 'SUFFICIENT' };
              return (
                <div
                  key={crop.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{crop.image_emoji}</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {crop.name_en}
                    </span>
                  </div>
                  <StockStatusButtons
                    value={cell.status}
                    size="sm"
                    onChange={() => {}}
                    disabled={true}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
