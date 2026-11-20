import React, { useState } from 'react';
import {
  usePricingForecasts,
  usePublishPrices,
  LiveMLPriceForecast,
} from '../../features/pricing/hooks';
import { Button } from '../../components/ui/button';
import { formatPriceRange } from '../../lib/format';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Check, Send, AlertTriangle, Radio } from 'lucide-react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';

export const Pricing: React.FC = () => {
  const { data: forecasts = [], isLoading } = usePricingForecasts();
  const publishPricesMutation = usePublishPrices();

  const [localOverrides, setLocalOverrides] = useState<
    Record<string, { low: number; high: number; reason: string }>
  >({});
  const [overrideModal, setOverrideModal] = useState<LiveMLPriceForecast | null>(null);
  const [overrideLow, setOverrideLow] = useState<number>(20);
  const [overrideHigh, setOverrideHigh] = useState<number>(30);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [publishSuccess, setPublishSuccess] = useState(false);

  const isLiveML = forecasts.length > 0 && forecasts[0].source === 'live_ml';
  const isStale = forecasts.some((f) => f.is_stale);

  const getEffective = (f: LiveMLPriceForecast) => {
    const ov = localOverrides[f.crop_id];
    return {
      low: ov ? ov.low : f.current_published_low,
      high: ov ? ov.high : f.current_published_high,
      reason: ov ? ov.reason : f.override_reason,
    };
  };

  const handleOpenOverride = (f: LiveMLPriceForecast) => {
    const eff = getEffective(f);
    setOverrideModal(f);
    setOverrideLow(Math.round(eff.low / 100));
    setOverrideHigh(Math.round(eff.high / 100));
    setOverrideReason(eff.reason || '');
  };

  const handleSaveOverride = () => {
    if (!overrideModal || !overrideReason) return;
    setLocalOverrides((prev) => ({
      ...prev,
      [overrideModal.crop_id]: {
        low: overrideLow * 100,
        high: overrideHigh * 100,
        reason: overrideReason,
      },
    }));
    setOverrideModal(null);
  };

  const handlePublishAll = async () => {
    const items = forecasts.map((f) => {
      const eff = getEffective(f);
      return {
        crop_id: f.crop_id,
        low: eff.low,
        high: eff.high,
        override_reason: eff.reason,
      };
    });
    await publishPricesMutation.mutateAsync(items);
    setPublishSuccess(true);
    setTimeout(() => setPublishSuccess(false), 3000);
  };

  const formatModeLabel = (mode?: string) => {
    if (mode === 'derived_premium') return 'Derived premium (+35% over Tomato)';
    if (mode === 'baseline_fallback') return 'Baseline fallback';
    return 'ML default';
  };

  return (
    <div className="space-y-6">
      {publishSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg animate-in slide-in-from-top">
          <Check className="h-5 w-5" />
          <span>Tomorrow&apos;s vegetable prices published successfully to Farmers and Buyers!</span>
        </div>
      )}

      {isStale && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Showing last valid price bands (Stale) — latest 6 PM ML run not found for target date.</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Daily ML Price Range Forecasts
            </h2>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                isLiveML
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Radio className="h-3 w-3" />
              {isLiveML ? 'Live ML (localhost:8001)' : 'Demo Fallback'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Conformal-calibrated LightGBM predicts p10 (floor), p50 (expected), p90 (cap) from mandi auctions and weather.
          </p>
        </div>

        <Button
          onClick={handlePublishAll}
          disabled={publishPricesMutation.isPending || isLoading}
          className="font-bold bg-primary hover:bg-primary-700 text-white flex items-center gap-2 self-start shadow-md"
        >
          <Send className="h-4 w-4" />
          <span>Publish Tomorrow&apos;s Prices</span>
        </Button>
      </div>

      {/* Forecast Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forecasts.map((f) => {
          const eff = getEffective(f);
          return (
            <div
              key={f.crop_id}
              className="p-5 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white">
                    {f.crop_name_en}
                  </h4>
                  <p className="text-xs text-slate-500">{f.crop_name_kn}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {Math.round(f.confidence * 100)}% Coverage
                </span>
              </div>

              {/* Range Bar */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">ML Band (p10 – p90):</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatPriceRange(f.p10, f.p90)}
                  </span>
                </div>

                {/* Published Price */}
                <div className="flex justify-between items-baseline pt-1 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-300">
                    Published Target:
                  </span>
                  <span className="text-sm font-black text-primary">
                    {formatPriceRange(eff.low, eff.high)}
                  </span>
                </div>
              </div>

              {/* Trailing 7-day trend sparkline */}
              <div className="h-20 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={f.trend}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, padding: 4 }}
                      formatter={(val: any) => [`₹${(Number(val) / 100).toFixed(1)}/kg`, 'p50']}
                    />
                    <Line
                      type="monotone"
                      dataKey="p50"
                      stroke="#16A34A"
                      strokeWidth={2.5}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Override status & button */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                {eff.reason ? (
                  <span className="text-[10px] text-amber-600 font-bold">
                    Overridden: {eff.reason}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    {formatModeLabel(f.pricing_mode)}
                  </span>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenOverride(f)}
                  className="text-xs font-bold"
                >
                  Override
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Override Dialog */}
      <Dialog open={!!overrideModal} onOpenChange={(open) => !open && setOverrideModal(null)}>
        {overrideModal && (
          <div>
            <DialogHeader>
              <DialogTitle>Admin Price Range Override · {overrideModal.crop_name_en}</DialogTitle>
              <DialogDescription>
                Manual overrides require an audit trail reason to justify variance against ML model predictions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Lower Bound (₹/kg)</label>
                  <input
                    type="number"
                    value={overrideLow}
                    onChange={(e) => setOverrideLow(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Upper Bound (₹/kg)</label>
                  <input
                    type="number"
                    value={overrideHigh}
                    onChange={(e) => setOverrideHigh(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Mandatory Override Reason *</label>
                <textarea
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Heavy rainfall in Kolar damaging early morning harvest..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold dark:bg-slate-800"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleSaveOverride} disabled={!overrideReason} className="font-bold">
                Save Override
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
};