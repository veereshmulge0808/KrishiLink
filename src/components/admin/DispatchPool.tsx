import React, { useState } from 'react';
import { FarmerListing, Order, TransferRequest } from '../../types';
import { CropIcon } from '../crop/CropIcon';
import { Filter, CheckSquare, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DispatchPoolProps {
  farmerPickups: FarmerListing[];
  ineligiblePickups: FarmerListing[];
  buyerDeliveries: Order[];
  pendingTransfers: TransferRequest[];
  selectedStopIds: Set<string>;
  onToggleSelect: (id: string, item: any, type: 'PICKUP' | 'DELIVERY' | 'TRANSFER') => void;
  onSelectAll: (type: 'all' | 'pickups' | 'deliveries') => void;
  className?: string;
}

export const DispatchPool: React.FC<DispatchPoolProps> = ({
  farmerPickups,
  ineligiblePickups,
  buyerDeliveries,
  pendingTransfers,
  selectedStopIds,
  onToggleSelect,
  onSelectAll,
  className = '',
}) => {
  const { i18n } = useTranslation();
  const isKn = i18n.language === 'kn';
  const [activeTab, setActiveTab] = useState<'pickups' | 'deliveries' | 'transfers' | 'ineligible'>('pickups');

  const totalEligibleKg = farmerPickups.reduce((sum, l) => sum + l.est_kg, 0);
  const totalBuyerKg = buyerDeliveries.reduce(
    (sum, o) => sum + o.items.reduce((acc, it) => acc + it.qty_kg, 0),
    0
  );

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col ${className}`}
    >
      {/* Pool Header Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('pickups')}
          className={`flex-1 py-3 text-center transition-all border-b-2 ${
            activeTab === 'pickups'
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Pickups ({farmerPickups.length}) · {totalEligibleKg}kg
        </button>

        <button
          onClick={() => setActiveTab('deliveries')}
          className={`flex-1 py-3 text-center transition-all border-b-2 ${
            activeTab === 'deliveries'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Deliveries ({buyerDeliveries.length}) · {totalBuyerKg}kg
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex-1 py-3 text-center transition-all border-b-2 ${
            activeTab === 'transfers'
              ? 'border-purple-600 text-purple-600 bg-purple-50/50 dark:bg-purple-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Transfers ({pendingTransfers.length})
        </button>

        <button
          onClick={() => setActiveTab('ineligible')}
          className={`flex-1 py-3 text-center transition-all border-b-2 ${
            activeTab === 'ineligible'
              ? 'border-amber-600 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sub-min ({ineligiblePickups.length})
        </button>
      </div>

      {/* List items */}
      <div className="p-3 overflow-y-auto max-h-[500px] space-y-2">
        {activeTab === 'pickups' &&
          farmerPickups.map((listing) => {
            const isSelected = selectedStopIds.has(listing.id);
            return (
              <div
                key={listing.id}
                onClick={() => onToggleSelect(listing.id, listing, 'PICKUP')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-primary bg-primary-50/40 dark:bg-emerald-950/30'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="text-primary">
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <CropIcon emoji={listing.crop?.image_emoji} size="sm" />
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs">
                      {isKn ? listing.crop?.name_kn : listing.crop?.name_en}
                    </h5>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Ready by {listing.ready_by} · Farmer #{listing.farmer_id}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {listing.est_kg} kg
                  </span>
                  <span className="block text-[10px] text-emerald-600 font-bold">
                    ✓ Above {listing.min_kg_applied}kg min
                  </span>
                </div>
              </div>
            );
          })}

        {activeTab === 'deliveries' &&
          buyerDeliveries.map((order) => {
            const isSelected = selectedStopIds.has(order.id);
            const totalKg = order.items.reduce((s, it) => s + it.qty_kg, 0);
            return (
              <div
                key={order.id}
                onClick={() => onToggleSelect(order.id, order, 'DELIVERY')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="text-blue-600">
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs">
                      {order.buyer?.business_name || order.address}
                    </h5>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Slot: {order.slot} · {order.items.length} crops
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {totalKg} kg
                  </span>
                  <span className="block text-[10px] text-blue-600 font-bold">
                    Slot {order.slot.split('-')[0]}
                  </span>
                </div>
              </div>
            );
          })}

        {activeTab === 'ineligible' &&
          ineligiblePickups.map((listing) => (
            <div
              key={listing.id}
              className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <CropIcon emoji={listing.crop?.image_emoji} size="sm" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {isKn ? listing.crop?.name_kn : listing.crop?.name_en}
                  </p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-400">
                    Below min {listing.min_kg_applied} kg threshold
                  </p>
                </div>
              </div>
              <span className="font-bold text-amber-900 dark:text-amber-300">
                {listing.est_kg} kg
              </span>
            </div>
          ))}

        {activeTab === 'transfers' &&
          pendingTransfers.map((tr) => {
            const isSelected = selectedStopIds.has(tr.id);
            return (
              <div
                key={tr.id}
                onClick={() => onToggleSelect(tr.id, tr, 'TRANSFER')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50/40 dark:bg-purple-950/30'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="text-purple-600">
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-white">
                      {tr.from_hub?.name} ➔ {tr.to_hub?.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {tr.crop?.name_en} · {tr.urgency} urgency
                    </p>
                  </div>
                </div>
                <span className="font-bold text-sm text-purple-700">{tr.requested_kg} kg</span>
              </div>
            );
          })}
      </div>
    </div>
  );
};
