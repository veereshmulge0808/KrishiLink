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
import { CheckCircle2, AlertTriangle, Trash2, Clock, Truck, Plus, ChevronRight } from 'lucide-react';
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
  const [kgValue, setKgValue] = useState<number>(50);
  const [readyByTime, setReadyByTime] = useState<string>('06:00 AM');
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState('06:15 AM');

  // Confirmation view state
  const [confirmationListing, setConfirmationListing] = useState<FarmerListing | null>(null);

  const readyTimes = ['05:00 AM', '05:30 AM', '06:00 AM', '06:30 AM', '07:00 AM'];

  const handleOpenCropSheet = (crop: Crop) => {
    setSelectedCrop(crop);
    setKgValue(50);
  };

  const getEffectiveReadyTime = () => {
    return isCustomTime ? customTimeInput || '06:00 AM' : readyByTime;
  };

  // Calculate estimated pickup window (approx 30-45 mins after ready time)
  const calculatePickupWindow = (timeStr: string) => {
    return {
      start: '30 mins after ready time',
      end: '45 mins after ready time',
      windowText: '06:30 AM – 07:15 AM',
    };
  };

  const handleSubmitHarvest = async () => {
    if (!selectedCrop) return;
    const finalReadyTime = getEffectiveReadyTime();
    const res = await createListingMutation.mutateAsync({
      farmer_id: 'u_farmer_1',
      crop_id: selectedCrop.id,
      est_kg: kgValue,
      ready_by: finalReadyTime,
    });
    setSelectedCrop(null);
    setConfirmationListing(res);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Title - Clean without voice banner */}
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

      {/* Today's declared list */}
      {listings.length > 0 && (
        <div className="mt-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              {isKn ? 'ಇಂದಿನ ಕಟಾವು ಪಟ್ಟಿ' : "Today's Harvest Submissions"} ({listings.length})
            </h4>
            <span className="text-xs text-emerald-600 font-bold">
              {listings.reduce((sum, l) => sum + l.est_kg, 0)} kg total
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {listings.map((l) => (
              <div
                key={l.id}
                className="py-3 flex items-center justify-between first:pt-0 last:pb-0"
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

      {/* Bottom Sheet for Kg Entry & Custom Time */}
      <Sheet
        open={!!selectedCrop}
        onOpenChange={(open) => !open && setSelectedCrop(null)}
        side="bottom"
      >
        {selectedCrop && (
          <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
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

            {/* Ready By Custom Time Selector */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span>{isKn ? 'ಕಟಾವು ಯಾವಾಗ ಸಿದ್ಧವಾಗಿರುತ್ತದೆ?' : 'Ready By What Time?'}</span>
              </label>

              {/* Preset buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {readyTimes.map((tm) => (
                  <button
                    key={tm}
                    type="button"
                    onClick={() => {
                      setReadyByTime(tm);
                      setIsCustomTime(false);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                      !isCustomTime && readyByTime === tm
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tm}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setIsCustomTime(true)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                    isCustomTime
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isKn ? 'ಕಸ್ಟಮ್ ಸಮಯ' : 'Custom Time'}
                </button>
              </div>

              {/* Custom Time Input if selected */}
              {isCustomTime && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
                    {isKn ? 'ನಿಮ್ಮ ಸಮಯ ನಮೂದಿಸಿ:' : 'Enter Exact Ready Time:'}
                  </label>
                  <input
                    type="text"
                    value={customTimeInput}
                    onChange={(e) => setCustomTimeInput(e.target.value)}
                    placeholder="e.g. 05:45 AM or 06:15 AM"
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 p-2 text-xs font-bold text-slate-900 dark:text-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Pickup Arrival Notification Alert Box */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 text-xs">
                <Truck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-slate-900 dark:text-white">
                    {isKn ? 'ವಾಹನ ಸಂಗ್ರಹ ಸಮಯ (Pickup Window Notification)' : 'Scheduled Vehicle Pickup Window'}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 font-medium mt-0.5 leading-snug">
                    {isKn ? (
                      <>
                        ನಿಮ್ಮ ಸಿದ್ಧ ಸಮಯ <strong>{getEffectiveReadyTime()}</strong> ಆದ ನಂತರ, ಮಿನಿ ಹಬ್ ಸಂಗ್ರಹ ವಾಹನವು ಸುಮಾರು <strong>30-45 ನಿಮಿಷಗಳಲ್ಲಿ</strong> ನಿಮ್ಮ ಹೊಲಕ್ಕೆ ಬರುತ್ತದೆ. ವಾಹನ ಹೊರಟಾಗ ಲೈವ್ ಮ್ಯಾಪ್ ಲಿಂಕ್ ಬರುತ್ತದೆ.
                      </>
                    ) : (
                      <>
                        Based on ready time <strong>{getEffectiveReadyTime()}</strong>, your village collection truck is scheduled to arrive at your farm between <strong>30–45 mins later</strong> to weigh and load produce.
                      </>
                    )}
                  </p>
                </div>
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
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between animate-in zoom-in-95 duration-200 max-w-md mx-auto">
          <div className="my-auto text-center space-y-4 max-w-sm mx-auto">
            <div
              className={`h-20 w-20 rounded-full mx-auto flex items-center justify-center ${
                confirmationListing.status === 'ELIGIBLE'
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
              }`}
            >
              {confirmationListing.status === 'ELIGIBLE' ? (
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              ) : (
                <AlertTriangle className="h-10 w-10" />
              )}
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {confirmationListing.status === 'ELIGIBLE'
                ? t('farmer.submittedEligibleTitle')
                : t('farmer.submittedIneligibleTitle')}
            </h2>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span>{isKn ? 'ಬೆಳೆ' : 'Crop'}:</span>
                <span>
                  {isKn ? confirmationListing.crop?.name_kn : confirmationListing.crop?.name_en}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>{isKn ? 'ಸಿದ್ಧವಿರುವ ಪ್ರಮಾಣ' : 'Quantity'}:</span>
                <span className="text-emerald-600 text-sm">{confirmationListing.est_kg} kg</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>{isKn ? 'ಸಿದ್ಧ ಸಮಯ' : 'Ready by'}:</span>
                <span>{confirmationListing.ready_by}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>{isKn ? 'ವಾಹನ ಆಗಮನ' : 'Pickup Window'}:</span>
                <span className="text-emerald-600">30-45 mins post ready</span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              {confirmationListing.status === 'ELIGIBLE'
                ? isKn
                  ? 'ನಿಮ್ಮ ಕಟಾವು ಪ್ರಮಾಣವು ವಾಹನ ಕಳುಹಿಸಲು ಸೂಕ್ತವಾಗಿದೆ. ನಾಳೆ ಬೆಳಿಗ್ಗೆ ವಾಹನ ಬರಲಿದೆ.'
                  : 'Eligible for vehicle pickup! Dispatch will schedule collection.'
                : isKn
                  ? 'ಗಮನಿಸಿ: ನಿಮ್ಮ ಕನಿಷ್ಠ ಮಿತಿ 30 ಕೆಜಿಗಿಂತ ಕಡಿಮೆಯಿದೆ. ಒಟ್ಟುಗೂಡಿಸುವಿಕೆ ಅಥವಾ ಮಿತಿ ತಲುಪಿದಾಗ ವಾಹನ ನಿಗದಿಯಾಗುತ್ತದೆ.'
                  : 'Below minimum threshold. Vehicle will be sent if route consolidates nearby farms.'}
            </p>
          </div>

          <Button
            size="xl"
            onClick={() => setConfirmationListing(null)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg"
          >
            {isKn ? 'ಮುಕ್ತಾಯ (Done)' : 'Done'}
          </Button>
        </div>
      )}
    </div>
  );
};
