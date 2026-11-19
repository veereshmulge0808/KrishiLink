import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCropDetail } from '../../features/catalog/hooks';
import { useCartStore } from '../../stores/cartStore';
import { CropIcon } from '../../components/crop/CropIcon';
import { PriceRangeBadge } from '../../components/crop/PriceRangeBadge';
import { QuantityStepper } from '../../components/crop/QuantityStepper';
import { ArrowLeft, ShieldCheck, Sparkles, Clock, Leaf } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useTranslation } from 'react-i18next';

export const CropDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const { data: crop, isLoading } = useCropDetail(id || '');
  const { items, addItem, updateQty } = useCartStore();

  if (isLoading || !crop) {
    return <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>;
  }

  const quantityInCart = items[crop.id]?.qty_kg || 0;

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-5">
      {/* Top back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('common.back')}</span>
        </button>
      </div>

      {/* Hero display */}
      <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
        <CropIcon emoji={crop.image_emoji} cropId={crop.id} size="xl" className="mb-3" />
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          {isKn ? crop.name_kn : crop.name_en}
        </h2>
        <p className="text-sm text-slate-500 font-semibold">
          {isKn ? crop.name_en : crop.name_kn}
        </p>

        {crop.is_organic && (
          <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <Leaf className="h-3.5 w-3.5 text-emerald-600" />
            <span>Certified Chemical-Free Organic</span>
          </span>
        )}

        {/* Price range display */}
        <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl w-full">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Today's Target Price Range
          </p>
          <PriceRangeBadge low={crop.price.low} high={crop.price.high} unit={crop.unit} />
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
            Locked at confirmation: min(ML forecast p90, hub spot price)
          </p>
        </div>
      </div>

      {/* Why price is a range explainer */}
      <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span>Why does KrishiLink display a price range?</span>
        </div>
        <p className="leading-relaxed">
          Mandi auction rates fluctuate each morning based on weather and harvest arrivals. We collect directly from farms, locking your final price within this exact range upon dispatch confirmation.
        </p>
      </div>

      {/* Specifications */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-slate-400 block font-semibold">Minimum Order Quantity</span>
          <span className="text-base font-black text-slate-900 dark:text-white mt-1 block">
            {crop.min_order_kg} kg
          </span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-slate-400 block font-semibold">Shelf Life</span>
          <span className="text-base font-black text-slate-900 dark:text-white mt-1 block">
            {crop.shelf_life_days} days fresh
          </span>
        </div>
      </div>

      {/* Stepper bar */}
      <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-500 font-bold block">Order Quantity</span>
          <span className="text-xs text-slate-400">Step: 5 kg increments</span>
        </div>
        <div className="w-44">
          <QuantityStepper
            value={quantityInCart}
            min={crop.min_order_kg}
            step={5}
            unit={crop.unit}
            onChange={(qty) => {
              if (qty === 0) updateQty(crop.id, 0);
              else if (quantityInCart === 0) addItem(crop, qty);
              else updateQty(crop.id, qty);
            }}
          />
        </div>
      </div>

      {quantityInCart > 0 && (
        <Button
          onClick={() => navigate('/buyer/cart')}
          size="xl"
          className="w-full font-bold shadow-lg mt-2"
        >
          {t('buyer.viewCart')} ({quantityInCart} kg)
        </Button>
      )}
    </div>
  );
};
