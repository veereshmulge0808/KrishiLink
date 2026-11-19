import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../stores/cartStore';
import { CropIcon } from '../../components/crop/CropIcon';
import { QuantityStepper } from '../../components/crop/QuantityStepper';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Clock, MapPin, Trash2, ShieldCheck, ArrowRight } from 'lucide-react';
import { formatPaiseToRupees, formatPriceRange } from '../../lib/format';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../components/common/EmptyState';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { items, updateQty, removeItem, clearCart, deliverySlot, setDeliverySlot, getTotalPaise, getTotalKg, deliveryAddress } =
    useCartStore();
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const cartList = Object.values(items);
  const totalKg = getTotalKg();
  const totalPaise = getTotalPaise();

  const slots = [
    { id: '07:00-08:00', label: '7:00 AM – 8:00 AM', tag: 'Fastest Morning' },
    { id: '08:00-09:00', label: '8:00 AM – 9:00 AM', tag: 'Popular for Cafes' },
    { id: '09:00-10:00', label: '9:00 AM – 10:00 AM', tag: 'Caterer Shift' },
  ];

  if (cartList.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          title={t('buyer.emptyCartTitle')}
          description={t('buyer.emptyCartDesc')}
          actionLabel="Browse Fresh Produce"
          onAction={() => navigate('/buyer')}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/buyer')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Continue Shopping</span>
        </button>

        <button
          onClick={clearCart}
          className="text-xs font-semibold text-red-500 hover:text-red-700"
        >
          Clear Basket
        </button>
      </div>

      <h2 className="text-xl font-black text-slate-900 dark:text-white">
        {t('buyer.cartTitle')} ({cartList.length} items)
      </h2>

      {/* Cart Items List */}
      <div className="space-y-3">
        {cartList.map(({ crop, qty_kg }) => {
          const itemLow = crop.price.low * qty_kg;
          const itemHigh = crop.price.high * qty_kg;

          return (
            <div
              key={crop.id}
              className="p-3.5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <CropIcon emoji={crop.image_emoji} size="md" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {isKn ? crop.name_kn : crop.name_en}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {formatPriceRange(crop.price.low, crop.price.high)}
                  </p>
                  <p className="text-xs font-black text-primary mt-1">
                    {formatPaiseToRupees(itemLow)} – {formatPaiseToRupees(itemHigh)}
                  </p>
                </div>
              </div>

              <div className="w-28 sm:w-32 shrink-0">
                <QuantityStepper
                  value={qty_kg}
                  min={crop.min_order_kg}
                  step={5}
                  unit={crop.unit}
                  onChange={(val) => updateQty(crop.id, val)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Delivery Slot Selection */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-primary" />
          <span>{t('buyer.deliverySlot')}</span>
        </label>
        <div className="space-y-2">
          {slots.map((s) => (
            <div
              key={s.id}
              onClick={() => setDeliverySlot(s.id)}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                deliverySlot === s.id
                  ? 'border-primary bg-primary-50/50 dark:bg-emerald-950/40 ring-1 ring-primary'
                  : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700'
              }`}
            >
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {s.label}
                </p>
                <p className="text-[11px] text-slate-500">{s.tag}</p>
              </div>
              <input
                type="radio"
                name="slot"
                checked={deliverySlot === s.id}
                onChange={() => setDeliverySlot(s.id)}
                className="text-primary"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Address */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span>{t('buyer.deliveryAddress')}</span>
        </div>
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{deliveryAddress}</p>
      </div>

      {/* Bill Breakdown */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
        <div className="flex justify-between font-medium text-slate-600 dark:text-slate-400">
          <span>Total Payload Weight</span>
          <span className="font-bold text-slate-900 dark:text-white">{totalKg} kg</span>
        </div>
        <div className="flex justify-between font-medium text-slate-600 dark:text-slate-400">
          <span>Estimated Subtotal</span>
          <span>{formatPaiseToRupees(totalPaise.low)} – {formatPaiseToRupees(totalPaise.high)}</span>
        </div>
        <div className="flex justify-between font-medium text-slate-600 dark:text-slate-400">
          <span>Direct Village Logistics</span>
          <span className="text-emerald-600 font-bold">Included (Free)</span>
        </div>
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-black text-slate-900 dark:text-white">
          <span>Target Price Range</span>
          <span className="text-primary">
            {formatPaiseToRupees(totalPaise.low)} – {formatPaiseToRupees(totalPaise.high)}
          </span>
        </div>
      </div>

      <Button
        onClick={() => navigate('/buyer/checkout')}
        size="xl"
        className="w-full font-black text-base shadow-lg flex items-center justify-center gap-2 mt-2"
      >
        <span>Proceed to Checkout</span>
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );
};
