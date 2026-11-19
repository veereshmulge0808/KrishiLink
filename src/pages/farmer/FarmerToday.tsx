import React, { useState } from 'react';
import { useCrops } from '../../features/catalog/hooks';
import {
  useFarmerListings,
  useCreateFarmerListing,
  useDeleteFarmerListing,
  useFarmerThreshold,
} from '../../features/listings/hooks';
import { Crop, FarmerListing } from '../../types';
import { CropIcon } from '../../components/crop/CropIcon';
import { KgInput } from '../../components/forms/KgInput';
import { Button } from '../../components/ui/button';
import { Sheet, SheetHeader, SheetTitle, SheetDescription } from '../../components/ui/sheet';
import { Mic, Clock, CheckCircle2, AlertTriangle, Trash2, Sparkles, Plus } from 'lucide-react';
import { formatPriceRange } from '../../lib/format';
import { useTranslation } from 'react-i18next';
import { CardSkeleton } from '../../components/common/Skeletons';

export const FarmerToday: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const { data: crops = [], isLoading: cropsLoading } = useCrops();
  const { data: listings = [], isLoading: listingsLoading } = useFarmerListings('u_farmer_1');
  const { data: thresholdData } = useFarmerThreshold('u_farmer_1');
  const createListingMutation = useCreateFarmerListing();
  const deleteListingMutation = useDeleteFarmerListing();

  // Bottom sheet state for entering kg
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [kgValue, setKgValue] = useState<number>(100);
  const [readyByTime, setReadyByTime] = useState<string>('05:30 AM');

  // Confirmation view state
  const [confirmationListing, setConfirmationListing] = useState<FarmerListing | null>(null);

  // Mock voice input state
  const [isListeningVoice, setIsListeningVoice] = useState(false);

  const readyTimes = ['05:00 AM', '05:30 AM', '06:00 AM', '06:30 AM'];

  const handleOpenCropSheet = (crop: Crop) => {
    setSelectedCrop(crop);
    setKgValue(50);
  };

  const handleSubmitHarvest = async () => {
    if (!selectedCrop) return;
    const res = await createListingMutation.mutateAsync({
      farmer_id: 'u_farmer_1',
      crop_id: selectedCrop.id,
      est_kg: kgValue,
      ready_by: readyByTime,
    });
    setSelectedCrop(null);
    setConfirmationListing(res);
  };

  const handleVoiceInputMock = () => {
    setIsListeningVoice(true);
    setTimeout(() => {
      setIsListeningVoice(false);
      // Auto-fill Tomato 200 kg ready at 06:00 AM
      const tomato = crops.find((c) => c.id === 'c_tomato') || crops[0];
      if (tomato) {
        setSelectedCrop(tomato);
        setKgValue(200);
        setReadyByTime('06:00 AM');
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Cutoff & Voice Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          <span>{t('farmer.cutoffCountdown')}</span>
        </div>

        <button
          onClick={handleVoiceInputMock}
          className={`px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-all text-xs ${
            isListeningVoice
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
          }`}
        >
          <Mic className="h-3.5 w-3.5" />
          <span>{isListeningVoice ? t('farmer.voiceListening') : t('farmer.voicePrompt')}</span>
        </button>
      </div>

      {/* Main Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          {t('farmer.todayTitle')}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {isKn
            ? 'ನಿಮ್ಮ ಹೊಲದಲ್ಲಿ ಕಟಾವಿಗೆ ಸಿದ್ಧವಿರುವ ಬೆಳೆಗಳ ಮೇಲೆ ಬೆರಳಿಟ್ಟು ಪ್ರಮಾಣ ತಿಳಿಸಿ'
            : 'Tap any vegetable to declare ready kilograms for morning vehicle collection'}
        </p>
      </div>

      {/* Big Icon Grid of Crops */}
      {cropsLoading ? (
        <CardSkeleton count={8} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {crops.map((crop) => (
            <div
              key={crop.id}
              onClick={() => handleOpenCropSheet(crop)}
              className="p-4 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center select-none active:scale-95 min-h-[140px] justify-between"
            >
              <CropIcon emoji={crop.image_emoji} cropId={crop.id} size="xl" className="mb-1" />
              <div>
                <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                  {isKn ? crop.name_kn : crop.name_en}
                </h4>
                <p className="text-xs text-slate-500 font-semibold">
                  {isKn ? crop.name_en : crop.name_kn}
                </p>
                <span className="text-[11px] font-bold text-emerald-600 block mt-1">
                  {formatPriceRange(crop.price.low, crop.price.high)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Today's Submitted Harvest List */}
      {listings.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            {t('farmer.mySubmissionsToday')} ({listings.length})
          </h3>
          <div className="space-y-2">
            {listings.map((l) => (
              <div
                key={l.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  l.status === 'ELIGIBLE'
                    ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20'
                    : 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CropIcon emoji={l.crop?.image_emoji} size="sm" />
                  <div>
                    <h5 className="font-black text-sm text-slate-900 dark:text-white">
                      {isKn ? l.crop?.name_kn : l.crop?.name_en} · {l.est_kg} kg
                    </h5>
                    <p className="text-xs text-slate-500">
                      Ready by {l.ready_by} ·{' '}
                      <span
                        className={
                          l.status === 'ELIGIBLE'
                            ? 'text-emerald-700 font-bold'
                            : 'text-amber-700 font-bold'
                        }
                      >
                        {l.status === 'ELIGIBLE' ? '✓ Eligible for pickup' : '⚠ Below min threshold'}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => deleteListingMutation.mutate(l.id)}
                  className="p-2 text-slate-400 hover:text-red-500"
                  aria-label="Cancel submission"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Sheet for Kg Entry */}
      <Sheet
        open={!!selectedCrop}
        onOpenChange={(open) => !open && setSelectedCrop(null)}
        side="bottom"
      >
        {selectedCrop && (
          <div className="space-y-4">
            <SheetHeader>
              <div className="flex items-center gap-3">
                <CropIcon emoji={selectedCrop.image_emoji} size="md" />
                <div>
                  <SheetTitle className="text-xl">
                    {isKn ? selectedCrop.name_kn : selectedCrop.name_en}
                  </SheetTitle>
                  <SheetDescription>
                    {t('farmer.enterKg')} · Today's rate: {formatPriceRange(selectedCrop.price.low, selectedCrop.price.high)}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {/* Ready By Chips */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                {t('farmer.readyBy')}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {readyTimes.map((tm) => (
                  <button
                    key={tm}
                    type="button"
                    onClick={() => setReadyByTime(tm)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                      readyByTime === tm
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tm}
                  </button>
                ))}
              </div>
            </div>

            {/* Big Numpad Kg Input */}
            <KgInput value={kgValue} onChange={setKgValue} />

            {/* Submit Harvest Button */}
            <Button
              onClick={handleSubmitHarvest}
              disabled={kgValue <= 0 || createListingMutation.isPending}
              size="xl"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-lg flex items-center justify-center gap-2 min-h-[56px]"
            >
              <CheckCircle2 className="h-6 w-6" />
              <span>{t('farmer.submitHarvest')} ({kgValue} kg)</span>
            </Button>
          </div>
        )}
      </Sheet>

      {/* Confirmation View (Full Screen Modal) */}
      {confirmationListing && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between animate-in zoom-in-95 duration-200">
          <div className="my-auto text-center space-y-4 max-w-sm mx-auto">
            <div
              className={`inline-flex h-24 w-24 items-center justify-center rounded-full text-5xl shadow-lg mb-2 ${
                confirmationListing.status === 'ELIGIBLE'
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-950'
              }`}
            >
              {confirmationListing.status === 'ELIGIBLE' ? '✅' : '⚠️'}
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {confirmationListing.status === 'ELIGIBLE'
                ? t('farmer.eligibleTitle')
                : t('farmer.ineligibleTitle')}
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-400">
              {confirmationListing.status === 'ELIGIBLE'
                ? t('farmer.eligibleDesc')
                : t('farmer.ineligibleDesc', { threshold: confirmationListing.min_kg_applied })}
            </p>

            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-left space-y-1">
              <p>
                <strong>{isKn ? 'ಬೆಳೆ' : 'Crop'}:</strong> {confirmationListing.crop?.name_en} ({confirmationListing.crop?.name_kn})
              </p>
              <p>
                <strong>{isKn ? 'ಪ್ರಮಾಣ' : 'Quantity'}:</strong> {confirmationListing.est_kg} kg
              </p>
              <p>
                <strong>{isKn ? 'ಸಿದ್ಧ ಸಮಯ' : 'Ready by'}:</strong> {confirmationListing.ready_by}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setConfirmationListing(null)}
            size="xl"
            className="w-full font-bold shadow-lg"
          >
            {isKn ? 'ಸರಿ (ಮುಗಿಸಿ)' : 'Done'}
          </Button>
        </div>
      )}
    </div>
  );
};
