import React, { useState } from 'react';
import { Hub, Crop, StockStatus } from '../../types';
import { StockStatusButtons } from './StockStatusButtons';
import { StockSuggestionChip } from './StockSuggestionChip';
import { Sheet, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Button } from '../ui/button';
import { ArrowRight, Send, Filter, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { calculateDistanceKm } from '../../lib/geo';

interface HubStockMatrixProps {
  hubs: Hub[];
  crops: Crop[];
  matrix: Record<string, Record<string, { status: StockStatus; suggested: StockStatus; set_by: string; set_at: string; exact_kg?: number }>>;
  onUpdateStatus: (hubId: string, cropId: string, status: StockStatus) => void;
  onRequestTransfer: (data: { from_hub_id: string; to_hub_id: string; crop_id: string; requested_kg: number }) => void;
}

export const HubStockMatrix: React.FC<HubStockMatrixProps> = ({
  hubs,
  crops,
  matrix,
  onUpdateStatus,
  onRequestTransfer,
}) => {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [hubTypeFilter, setHubTypeFilter] = useState<'all' | 'main' | 'village' | 'city'>('all');
  const [cropCategoryFilter, setCropCategoryFilter] = useState<string>('all');

  // Request stock side panel state
  const [selectedCell, setSelectedCell] = useState<{
    hub: Hub;
    crop: Crop;
    currentStatus: StockStatus;
  } | null>(null);
  const [selectedDonorHubId, setSelectedDonorHubId] = useState<string>('');
  const [requestKg, setRequestKg] = useState<number>(200);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const filteredHubs = hubs.filter(
    (h) => hubTypeFilter === 'all' || h.type === hubTypeFilter
  );
  const filteredCrops = crops.filter(
    (c) => cropCategoryFilter === 'all' || c.category === cropCategoryFilter
  );

  // Find candidate donor hubs that have SUFFICIENT stock for this crop
  const donorCandidates = selectedCell
    ? hubs
        .filter((h) => {
          if (h.id === selectedCell.hub.id) return false;
          const status = matrix[h.id]?.[selectedCell.crop.id]?.status;
          return status === 'SUFFICIENT';
        })
        .map((donor) => {
          const dist = calculateDistanceKm(selectedCell.hub.location, donor.location);
          return {
            hub: donor,
            distanceKm: dist,
            etaHours: Math.round((dist / 35) * 10) / 10,
          };
        })
        .sort((a, b) => a.distanceKm - b.distanceKm)
    : [];

  const handleCellClick = (hub: Hub, crop: Crop, status: StockStatus) => {
    if (status === 'LOW' || status === 'OUT') {
      setSelectedCell({ hub, crop, currentStatus: status });
      setRequestSuccess(false);
      // Preselect nearest donor if available
      const potentialDonors = hubs.filter(
        (h) => h.id !== hub.id && matrix[h.id]?.[crop.id]?.status === 'SUFFICIENT'
      );
      if (potentialDonors.length > 0) {
        setSelectedDonorHubId(potentialDonors[0].id);
      }
    }
  };

  const handleSendTransferRequest = () => {
    if (!selectedCell || !selectedDonorHubId) return;
    onRequestTransfer({
      from_hub_id: selectedDonorHubId,
      to_hub_id: selectedCell.hub.id,
      crop_id: selectedCell.crop.id,
      requested_kg: requestKg,
    });
    setRequestSuccess(true);
    setTimeout(() => {
      setSelectedCell(null);
      setRequestSuccess(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            Filters:
          </span>
          <div className="flex gap-1">
            {(['all', 'main', 'village', 'city'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setHubTypeFilter(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  hubTypeFilter === type
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={cropCategoryFilter}
            onChange={(e) => setCropCategoryFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Crop Categories</option>
            <option value="fruit_veg">Fruit Vegetables</option>
            <option value="roots">Roots & Tubers</option>
            <option value="leafy">Leafy Greens</option>
            <option value="herbs">Herbs</option>
          </select>
        </div>
      </div>

      {/* Stock Matrix Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 sticky top-0 z-10 backdrop-blur-sm">
              <th className="p-3.5 min-w-[200px] sticky left-0 bg-slate-50 dark:bg-slate-800 z-20">
                Logistics Hub
              </th>
              {filteredCrops.map((crop) => (
                <th key={crop.id} className="p-3 min-w-[150px] text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-xl">{crop.image_emoji}</span>
                    <span className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {isKn ? crop.name_kn : crop.name_en}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredHubs.map((hub) => (
              <tr key={hub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                {/* Hub name column */}
                <td className="p-3.5 sticky left-0 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-slate-100 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
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
                    <div>
                      <p className="text-sm font-bold leading-tight">{hub.name}</p>
                      <p className="text-[11px] text-slate-400 capitalize font-normal">
                        {hub.type} hub · {hub.capacity_kg.toLocaleString()} kg
                      </p>
                    </div>
                  </div>
                </td>

                {/* Crop status cells */}
                {filteredCrops.map((crop) => {
                  const cell = matrix[hub.id]?.[crop.id] || {
                    status: 'SUFFICIENT',
                    suggested: 'SUFFICIENT',
                    set_by: 'System',
                    set_at: '',
                  };

                  const isLowOrOut = cell.status === 'LOW' || cell.status === 'OUT';

                  return (
                    <td
                      key={crop.id}
                      className="p-2.5 text-center align-middle"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <StockStatusButtons
                          value={cell.status}
                          suggested={cell.suggested}
                          size="sm"
                          onChange={(newStatus) => onUpdateStatus(hub.id, crop.id, newStatus)}
                        />
                        <div className="flex items-center gap-1">
                          <StockSuggestionChip
                            suggested={cell.suggested}
                            current={cell.status}
                          />
                          {isLowOrOut && (
                            <button
                              onClick={() => handleCellClick(hub, crop, cell.status)}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5 dark:text-blue-400"
                            >
                              Request <ArrowRight className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stock Request Side Sheet */}
      <Sheet
        open={!!selectedCell}
        onOpenChange={(open) => !open && setSelectedCell(null)}
        side="right"
      >
        {selectedCell && (
          <div className="flex flex-col h-full justify-between">
            <div>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span>{selectedCell.crop.image_emoji}</span>
                  <span>{t('stock.requestStockTitle')}</span>
                </SheetTitle>
                <SheetDescription>
                  Request produce for <strong>{selectedCell.hub.name}</strong> from donor hubs with sufficient stock.
                </SheetDescription>
              </SheetHeader>

              {requestSuccess ? (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <CheckCircle2 className="h-16 w-16 text-emerald-600 mb-2 animate-bounce" />
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">Transfer Requested!</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    Created transfer request for {requestKg} kg {selectedCell.crop.name_en}. Visible on Transfers board.
                  </p>
                </div>
              ) : (
                <div className="space-y-5 mt-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Crop & Destination Hub
                    </label>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {isKn ? selectedCell.crop.name_kn : selectedCell.crop.name_en}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 font-bold">
                        Current: {selectedCell.currentStatus}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Select Donor Hub (Sorted by Distance)
                    </label>
                    {donorCandidates.length === 0 ? (
                      <p className="text-xs text-red-500 p-3 bg-red-50 rounded-xl">
                        No other hubs currently report SUFFICIENT stock for this crop.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {donorCandidates.map(({ hub: donor, distanceKm, etaHours }) => (
                          <div
                            key={donor.id}
                            onClick={() => setSelectedDonorHubId(donor.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              selectedDonorHubId === donor.id
                                ? 'border-primary bg-primary-50 dark:bg-emerald-950/40 ring-1 ring-primary'
                                : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div>
                              <p className="font-bold text-sm text-slate-900 dark:text-white">
                                {donor.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {distanceKm} km away · ~{etaHours}h transit
                              </p>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                              🟢 SUFFICIENT
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Quantity to Request (kg)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={50}
                        step={50}
                        value={requestKg}
                        onChange={(e) => setRequestKg(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      />
                      <span className="font-semibold text-slate-500">kg</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!requestSuccess && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-6">
                <Button
                  onClick={handleSendTransferRequest}
                  disabled={!selectedDonorHubId || donorCandidates.length === 0}
                  className="w-full py-3 h-12 flex items-center justify-center gap-2 font-bold"
                >
                  <Send className="h-4 w-4" />
                  <span>{t('stock.createRequest')}</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
};
