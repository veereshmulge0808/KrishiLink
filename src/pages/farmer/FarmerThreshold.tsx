import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarmerThreshold, useUpdateFarmerThreshold } from '../../features/listings/hooks';
import { useCrops } from '../../features/catalog/hooks';
import { KgInput } from '../../components/forms/KgInput';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Check, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const FarmerThreshold: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const { data: thresholdData, isLoading } = useFarmerThreshold('u_farmer_1');
  const { data: crops = [] } = useCrops();
  const updateThresholdMutation = useUpdateFarmerThreshold();

  const [minKg, setMinKg] = useState<number>(30);
  const [showOverrides, setShowOverrides] = useState(false);
  const [perCrop, setPerCrop] = useState<Record<string, number>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (thresholdData) {
      setMinKg(thresholdData.default_min_kg);
      setPerCrop(thresholdData.crop_thresholds || {});
    }
  }, [thresholdData]);

  const handleSave = async () => {
    await updateThresholdMutation.mutateAsync({
      farmerId: 'u_farmer_1',
      data: {
        default_min_kg: minKg,
        per_crop: perCrop,
      },
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      navigate('/farmer');
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-5 p-2">
      <div>
        <button
          onClick={() => navigate('/farmer')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('common.back')}</span>
        </button>
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          {t('farmer.thresholdTitle')}
        </h2>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">
          {t('farmer.thresholdSubtitle')}
        </p>
      </div>

      {/* Large visual number input */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <KgInput value={minKg} onChange={setMinKg} />
      </div>

      {/* One-sentence explanation */}
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {t('farmer.thresholdExplanation')}
        </p>
      </div>

      {/* Per-crop overrides toggle */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowOverrides(!showOverrides)}
          className="w-full p-4 text-xs font-bold flex items-center justify-between text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <span>{t('farmer.cropOverrides')} (Optional)</span>
          {showOverrides ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showOverrides && (
          <div className="p-4 pt-0 space-y-3 border-t border-slate-100 dark:border-slate-800">
            {crops.slice(0, 4).map((crop) => (
              <div key={crop.id} className="flex items-center justify-between text-xs">
                <span className="font-bold">{isKn ? crop.name_kn : crop.name_en}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={perCrop[crop.id] || minKg}
                    onChange={(e) =>
                      setPerCrop({ ...perCrop, [crop.id]: Number(e.target.value) })
                    }
                    className="w-20 rounded-xl border border-slate-200 p-2 text-center font-bold dark:bg-slate-800"
                  />
                  <span>kg</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={updateThresholdMutation.isPending}
        size="xl"
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-lg flex items-center justify-center gap-2 mt-2"
      >
        <Check className="h-6 w-6" />
        <span>{savedSuccess ? 'Saved ✓' : t('common.save')}</span>
      </Button>
    </div>
  );
};
