import React, { useState } from 'react';
import { useSettings } from '../../features/pricing/hooks';
import { mockDb } from '../../lib/api/mock/db';
import { Button } from '../../components/ui/button';
import { CropIcon } from '../../components/crop/CropIcon';
import { Check, Settings as SettingsIcon } from 'lucide-react';

export const Settings: React.FC = () => {
  const { data: settings } = useSettings();
  const [crops] = useState(mockDb.crops);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [farmerCutoff, setFarmerCutoff] = useState('18:00');
  const [buyerCutoff, setBuyerCutoff] = useState('20:00');
  const [minPayload, setMinPayload] = useState(150);
  const [minFarmerKg, setMinFarmerKg] = useState(20);
  const [varianceTolerance, setVarianceTolerance] = useState(2.0);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg animate-in slide-in-from-top">
          <Check className="h-5 w-5" />
          <span>System configuration parameters saved and updated across all dashboards!</span>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          System Rules & Operations Settings
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Master cutoff timings, minimum logistics economic thresholds, and crop master catalog.
        </p>
      </div>

      {/* Operations Timing Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Cutoff Timings (D-1)
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Farmer Harvest Listing Cutoff (Default 18:00 D-1)
              </label>
              <input
                type="time"
                value={farmerCutoff}
                onChange={(e) => setFarmerCutoff(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-bold dark:bg-slate-800 dark:border-slate-700"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Farmers cannot edit/add listings after this cutoff without admin approval.
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Buyer Next-Day Order Cutoff (Default 20:00 D-1)
              </label>
              <input
                type="time"
                value={buyerCutoff}
                onChange={(e) => setBuyerCutoff(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-bold dark:bg-slate-800 dark:border-slate-700"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Orders placed after 20:00 require sufficient hub buffer stock.
              </span>
            </div>
          </div>
        </div>

        {/* Economic Thresholds */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Logistics & Variance Rules
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Minimum Route Payload (kg)
              </label>
              <input
                type="number"
                value={minPayload}
                onChange={(e) => setMinPayload(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-bold dark:bg-slate-800 dark:border-slate-700"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Routes below 150 kg will trigger a BELOW_MIN_PAYLOAD warning.
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Hub-vs-Driver Scale Variance Tolerance (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={varianceTolerance}
                onChange={(e) => setVarianceTolerance(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-bold dark:bg-slate-800 dark:border-slate-700"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Weight variance above 2.0% triggers an operational alert.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Crop Master Table */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
          Crop Master Catalog ({crops.length} crops)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                <th className="p-3">Icon</th>
                <th className="p-3">English Name</th>
                <th className="p-3">Kannada Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Min Order (kg)</th>
                <th className="p-3">Shelf Life</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {crops.map((c) => (
                <tr key={c.id}>
                  <td className="p-3 text-xl">{c.image_emoji}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{c.name_en}</td>
                  <td className="p-3 font-semibold text-emerald-700 dark:text-emerald-300">
                    {c.name_kn}
                  </td>
                  <td className="p-3 capitalize">{c.category}</td>
                  <td className="p-3 font-bold">{c.min_order_kg} kg</td>
                  <td className="p-3">{c.shelf_life_days} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Button onClick={handleSave} size="lg" className="font-bold bg-primary hover:bg-primary-700">
        Save Operational Rules
      </Button>
    </div>
  );
};
