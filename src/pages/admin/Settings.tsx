import React, { useState } from 'react';
import { useSettings } from '../../features/pricing/hooks';
import { mockDb } from '../../lib/api/mock/db';
import { Button } from '../../components/ui/button';
import { CropIcon } from '../../components/crop/CropIcon';
import { Check, Settings as SettingsIcon, Plus, Sprout, Tag } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Crop } from '../../types';

export const Settings: React.FC = () => {
  const { data: settings } = useSettings();
  const [crops, setCrops] = useState<Crop[]>(mockDb.crops);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [addCropDialogOpen, setAddCropDialogOpen] = useState(false);
  const [cropSuccessMsg, setCropSuccessMsg] = useState('');

  // Operations rules state
  const [farmerCutoff, setFarmerCutoff] = useState('18:00');
  const [buyerCutoff, setBuyerCutoff] = useState('20:00');
  const [minPayload, setMinPayload] = useState(150);
  const [minFarmerKg, setMinFarmerKg] = useState(20);
  const [varianceTolerance, setVarianceTolerance] = useState(2.0);

  // New Crop form state
  const [nameEn, setNameEn] = useState('');
  const [nameKn, setNameKn] = useState('');
  const [category, setCategory] = useState<'fruit_veg' | 'roots' | 'leafy' | 'herbs'>('fruit_veg');
  const [imageEmoji, setImageEmoji] = useState('🍅');
  const [minOrderKg, setMinOrderKg] = useState(10);
  const [shelfLifeDays, setShelfLifeDays] = useState(5);
  const [priceLow, setPriceLow] = useState(30);
  const [priceHigh, setPriceHigh] = useState(45);
  const [isOrganic, setIsOrganic] = useState(false);

  const emojiOptions = ['🍅', '🧅', '🥔', '🥕', '🫘', '🥬', '🥦', '🍆', '🌶️', '🫑', '🌿', '🌽', '🥒', '🎃', '🍇', '🥭', '🍋', '🧄'];

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCreateCrop = () => {
    if (!nameEn.trim() || !nameKn.trim()) return;

    const newCrop: Crop = {
      id: `c_${nameEn.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
      name_en: nameEn.trim(),
      name_kn: nameKn.trim(),
      category: category,
      unit: 'kg',
      min_order_kg: minOrderKg,
      price: {
        low: priceLow * 100, // paise
        high: priceHigh * 100,
        currency: 'INR',
        date: '2026-11-20',
      },
      shelf_life_days: shelfLifeDays,
      is_organic: isOrganic,
      image_emoji: imageEmoji,
      availability: 'SUFFICIENT',
    };

    mockDb.crops.push(newCrop);
    setCrops([...mockDb.crops]);
    setCropSuccessMsg(`Added "${nameEn}" to the Master Crop Catalog successfully!`);
    setAddCropDialogOpen(false);

    // Reset form
    setNameEn('');
    setNameKn('');
    setCategory('fruit_veg');
    setImageEmoji('🍅');
    setMinOrderKg(10);
    setShelfLifeDays(5);
    setPriceLow(30);
    setPriceHigh(45);
    setIsOrganic(false);

    setTimeout(() => setCropSuccessMsg(''), 3500);
  };

  return (
    <div className="space-y-6">
      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg animate-in slide-in-from-top">
          <Check className="h-5 w-5" />
          <span>System configuration parameters saved and updated across all dashboards!</span>
        </div>
      )}

      {cropSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg animate-in slide-in-from-top">
          <Check className="h-5 w-5" />
          <span>{cropSuccessMsg}</span>
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
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
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
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
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

      {/* Crop Master Table Section with Add Crop Action */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Crop Master Catalog ({crops.length} crops)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configured agricultural produce available for farmer listings, ML forecasting, and buyer catalogs.
            </p>
          </div>

          <Button
            onClick={() => setAddCropDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 self-start shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Vegetable / Fruit</span>
          </Button>
        </div>

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
                <th className="p-3">Organic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {crops.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 text-2xl">{c.image_emoji}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{c.name_en}</td>
                  <td className="p-3 font-semibold text-emerald-700 dark:text-emerald-300">
                    {c.name_kn}
                  </td>
                  <td className="p-3 capitalize">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs">
                      {c.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 font-bold">{c.min_order_kg} kg</td>
                  <td className="p-3">{c.shelf_life_days} days</td>
                  <td className="p-3">
                    {c.is_organic ? (
                      <span className="text-emerald-600 font-bold text-xs">🌱 Yes</span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Button onClick={handleSave} size="lg" className="font-bold bg-primary hover:bg-primary-700 text-white shadow-md">
        Save Operational Rules
      </Button>

      {/* Add New Crop / Vegetable / Fruit Modal Dialog */}
      <Dialog open={addCropDialogOpen} onOpenChange={setAddCropDialogOpen}>
        <DialogHeader>
          <DialogTitle>Add New Vegetable or Fruit to Master Catalog</DialogTitle>
          <DialogDescription>
            Introduce a new fresh agricultural crop item for farmers, pricing models, and bulk buyers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 my-3 text-xs max-h-[65vh] overflow-y-auto pr-1">
          {/* Icon Selector */}
          <div>
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              Select Crop Emoji / Icon *
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setImageEmoji(emoji)}
                  className={`h-9 w-9 rounded-xl text-xl flex items-center justify-center transition-all ${
                    imageEmoji === emoji
                      ? 'bg-emerald-600 text-white scale-110 shadow-md ring-2 ring-emerald-400'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Produce Name (English) *
              </label>
              <input
                type="text"
                placeholder="e.g. Yellow Capsicum, Mango Alphonso"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-bold dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Produce Name (Kannada / ಕನ್ನಡ) *
              </label>
              <input
                type="text"
                placeholder="ಉದಾ. ಹಳದಿ ದೊಣ್ಣೆ ಮೆಣಸಿನಕಾಯಿ"
                value={nameKn}
                onChange={(e) => setNameKn(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-bold dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
              >
                <option value="fruit_veg">Fruit Vegetables</option>
                <option value="roots">Roots & Tubers</option>
                <option value="leafy">Leafy Greens</option>
                <option value="herbs">Herbs & Seasoning</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Min Order Quantity (kg) *
              </label>
              <input
                type="number"
                value={minOrderKg}
                onChange={(e) => setMinOrderKg(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-bold dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Shelf Life (Days) *
              </label>
              <input
                type="number"
                value={shelfLifeDays}
                onChange={(e) => setShelfLifeDays(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-bold dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Benchmark Price Low (₹/kg) *
              </label>
              <input
                type="number"
                value={priceLow}
                onChange={(e) => setPriceLow(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-bold dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Benchmark Price High (₹/kg) *
              </label>
              <input
                type="number"
                value={priceHigh}
                onChange={(e) => setPriceHigh(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-bold dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="organicToggle"
              checked={isOrganic}
              onChange={(e) => setIsOrganic(e.target.checked)}
              className="h-4 w-4 text-emerald-600 rounded"
            />
            <label htmlFor="organicToggle" className="font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
              🌱 This produce has a certified Organic variant
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setAddCropDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateCrop}
            disabled={!nameEn.trim() || !nameKn.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            Add to Master Catalog
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};
