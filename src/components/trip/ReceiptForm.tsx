import React, { useState, useEffect } from 'react';
import { Crop, Grade } from '../../types';
import { Button } from '../ui/button';
import { KgInput } from '../forms/KgInput';
import { CropIcon } from '../crop/CropIcon';
import { Plus, Trash2, Camera, Check, AlertTriangle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { offlineQueue } from '../../lib/offlineQueue';

interface ReceiptLineDraft {
  crop_id: string;
  kg_received: number;
  grade: Grade;
  photo_url?: string;
}

interface ReceiptFormProps {
  stopId: string;
  tripId: string;
  crops: Crop[];
  vehicleCapacityKg?: number;
  currentTripKg?: number;
  onSubmit: (data: { lines: ReceiptLineDraft[]; farmer_confirmation: { method: string } }) => void;
  onSkip?: (reason: string) => void;
  onCancel?: () => void;
}

export const ReceiptForm: React.FC<ReceiptFormProps> = ({
  stopId,
  tripId,
  crops,
  vehicleCapacityKg = 1000,
  currentTripKg = 0,
  onSubmit,
  onSkip,
  onCancel,
}) => {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [lines, setLines] = useState<ReceiptLineDraft[]>([
    { crop_id: crops[0]?.id || 'c_tomato', kg_received: 50, grade: 'A' },
  ]);
  const [activeLineIdx, setActiveLineIdx] = useState<number>(0);
  const [farmerConfirmed, setFarmerConfirmed] = useState(false);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [skipTimer, setSkipTimer] = useState<number>(600); // 10 minutes in seconds
  const [isPhotoAttached, setIsPhotoAttached] = useState(false);

  // Countdown timer for farmer unavailable
  useEffect(() => {
    let interval: any;
    if (showUnavailable && skipTimer > 0) {
      interval = setInterval(() => {
        setSkipTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showUnavailable, skipTimer]);

  const currentLine = lines[activeLineIdx] || lines[0];

  const totalReceiptKg = lines.reduce((sum, l) => sum + (l.kg_received || 0), 0);
  const totalProjectedKg = currentTripKg + totalReceiptKg;
  const capacityPercent = Math.min(100, Math.round((totalProjectedKg / vehicleCapacityKg) * 100));

  const handleAddLine = () => {
    const nextIdx = lines.length;
    setLines([...lines, { crop_id: crops[nextIdx % crops.length].id, kg_received: 25, grade: 'A' }]);
    setActiveLineIdx(nextIdx);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 1) return;
    const next = lines.filter((_, i) => i !== idx);
    setLines(next);
    setActiveLineIdx(Math.max(0, idx - 1));
  };

  const handleSaveReceipt = () => {
    if (!farmerConfirmed) return;
    const payload = {
      lines,
      farmer_confirmation: { method: 'TAP' },
    };

    // If offline, enqueue
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      offlineQueue.enqueue({
        type: 'PICKUP_RECEIPT',
        endpoint: `/trips/${tripId}/stops/${stopId}/receipt`,
        method: 'POST',
        payload,
      });
    }

    onSubmit(payload);
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto">
      {/* Capacity Progress Bar */}
      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between text-xs font-bold mb-1.5">
          <span className="text-slate-700 dark:text-slate-300">
            {t('driver.capacityBar', { current: totalProjectedKg, max: vehicleCapacityKg })}
          </span>
          <span className={capacityPercent > 90 ? 'text-red-600 font-extrabold' : 'text-primary'}>
            {capacityPercent}%
          </span>
        </div>
        <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              capacityPercent > 90 ? 'bg-red-500' : 'bg-primary'
            }`}
            style={{ width: `${capacityPercent}%` }}
          />
        </div>
      </div>

      {/* Multiple Lines Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {lines.map((line, idx) => {
          const crop = crops.find((c) => c.id === line.crop_id);
          const isSelected = activeLineIdx === idx;
          return (
            <div
              key={idx}
              onClick={() => setActiveLineIdx(idx)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer shrink-0 transition-all ${
                isSelected
                  ? 'border-primary bg-primary-50 dark:bg-emerald-950/40 ring-1 ring-primary'
                  : 'border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800'
              }`}
            >
              <CropIcon emoji={crop?.image_emoji} size="sm" />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {isKn ? crop?.name_kn : crop?.name_en}
                </p>
                <p className="text-xs text-primary font-semibold">{line.kg_received} kg</p>
              </div>
              {lines.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveLine(idx);
                  }}
                  className="text-slate-400 hover:text-red-500 ml-1 p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAddLine}
          className="shrink-0 rounded-xl font-bold flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          <span>{t('driver.addAnotherCrop')}</span>
        </Button>
      </div>

      {/* Active Line Crop Selector */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
          Select Vegetable for Line #{activeLineIdx + 1}
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {crops.map((crop) => {
            const isSelected = currentLine.crop_id === crop.id;
            return (
              <button
                key={crop.id}
                type="button"
                onClick={() => {
                  const updated = [...lines];
                  updated[activeLineIdx].crop_id = crop.id;
                  setLines(updated);
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-primary bg-primary-50 dark:bg-emerald-950/40 shadow-sm ring-1 ring-primary'
                    : 'border-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="text-2xl">{crop.image_emoji}</span>
                <span className="text-[11px] font-bold mt-1 text-slate-800 dark:text-slate-200 line-clamp-1">
                  {isKn ? crop.name_kn : crop.name_en}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grade Toggle & Optional Photo */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500">Quality Grade:</span>
          {(['A', 'B'] as Grade[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                const updated = [...lines];
                updated[activeLineIdx].grade = g;
                setLines(updated);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                currentLine.grade === g
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Grade {g}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsPhotoAttached(!isPhotoAttached)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
            isPhotoAttached
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700'
          }`}
        >
          <Camera className="h-4 w-4" />
          <span>{isPhotoAttached ? 'Photo Attached ✓' : t('driver.photoOptional')}</span>
        </button>
      </div>

      {/* Big Kg Input Keypad for active line */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <KgInput
          value={currentLine.kg_received}
          onChange={(val) => {
            const updated = [...lines];
            updated[activeLineIdx].kg_received = val;
            setLines(updated);
          }}
        />
      </div>

      {/* Farmer Confirmation Checkbox/Tap Button */}
      <div
        onClick={() => setFarmerConfirmed(!farmerConfirmed)}
        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between select-none ${
          farmerConfirmed
            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100'
            : 'border-slate-300 bg-slate-50 dark:bg-slate-800 text-slate-700 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`h-7 w-7 rounded-full flex items-center justify-center transition-all ${
              farmerConfirmed ? 'bg-emerald-600 text-white' : 'border-2 border-slate-400'
            }`}
          >
            {farmerConfirmed && <Check className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-bold text-sm sm:text-base">{t('driver.farmerConfirmTap')}</p>
            <p className="text-xs text-slate-500">Farmer witnessed weighing on scale</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSaveReceipt}
        disabled={!farmerConfirmed || totalReceiptKg === 0}
        size="xl"
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-lg flex items-center justify-center gap-2"
      >
        <Check className="h-6 w-6" />
        <span>{t('driver.saveReceipt')} ({totalReceiptKg} kg)</span>
      </Button>

      {/* Farmer Unavailable Escape Hatch */}
      {!showUnavailable ? (
        <button
          type="button"
          onClick={() => setShowUnavailable(true)}
          className="text-xs text-center text-slate-400 hover:text-red-500 py-1 transition-colors"
        >
          {t('driver.farmerUnavailable')}?
        </button>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-left space-y-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{t('driver.farmerWaitNotice')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-700 dark:text-amber-400">
            <Clock className="h-4 w-4 animate-spin" />
            <span>
              Wait timer: {Math.floor(skipTimer / 60)}:{(skipTimer % 60).toString().padStart(2, '0')} remaining
            </span>
          </div>

          <Button
            size="sm"
            variant="destructive"
            disabled={skipTimer > 0}
            onClick={() => onSkip && onSkip('FARMER_UNAVAILABLE')}
            className="w-full font-bold"
          >
            {skipTimer > 0 ? 'Wait required before skipping' : t('driver.skipStop')}
          </Button>
        </div>
      )}
    </div>
  );
};
