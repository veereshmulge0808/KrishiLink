import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../stores/cartStore';
import { CropIcon } from '../../components/crop/CropIcon';
import { QuantityStepper } from '../../components/crop/QuantityStepper';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Clock, MapPin, Trash2, ShieldCheck, ArrowRight, Edit3, Check, Building } from 'lucide-react';
import { formatPaiseToRupees, formatPriceRange } from '../../lib/format';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../components/common/EmptyState';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    updateQty,
    removeItem,
    clearCart,
    deliverySlot,
    setDeliverySlot,
    getTotalPaise,
    getTotalKg,
    deliveryAddress,
    setDeliveryAddress,
  } = useCartStore();
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState(deliveryAddress);

  const cartList = Object.values(items);
  const totalKg = getTotalKg();
  const totalPaise = getTotalPaise();

  const slots = [
    { id: '05:30-06:30', label: '5:30 AM – 6:30 AM', tag: 'Early Wholesale Dispatch' },
    { id: '06:30-07:30', label: '6:30 AM – 7:30 AM', tag: 'Hotel Kitchen Shift' },
    { id: '07:00-08:00', label: '7:00 AM – 8:00 AM', tag: 'Fastest Morning' },
    { id: '08:00-09:00', label: '8:00 AM – 9:00 AM', tag: 'Popular for Cafes' },
    { id: '09:00-10:00', label: '9:00 AM – 10:00 AM', tag: 'Caterer Shift' },
    { id: '11:00-12:30', label: '11:00 AM – 12:30 PM', tag: 'Midday Restock' },
    { id: '16:00-17:30', label: '4:00 PM – 5:30 PM', tag: 'Evening Service Prep' },
  ];

  const addressPresets = [
    'Udupi Upahar, 14th Main, HSR Layout Sector 4, Bengaluru - 560102',
    'Udupi Upahar (Branch 2), 100ft Road, Indiranagar, Bengaluru - 560038',
    'Central Cloud Kitchen, Yeshwanthpur Industrial Area, Bengaluru - 560022',
  ];

  const handleSaveAddress = () => {
    if (addressInput.trim()) {
      setDeliveryAddress(addressInput.trim());
      setIsEditingAddress(false);
    }
  };

  if (cartList.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-xl mx-auto">
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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto flex flex-col gap-5">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/buyer')}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Continue Shopping</span>
        </button>

        <button
          onClick={clearCart}
          className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
        >
          Clear Basket
        </button>
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
        {t('buyer.cartTitle')} ({cartList.length} items)
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Col: Cart Items */}
        <div className="lg:col-span-7 space-y-3">
          {cartList.map(({ crop, qty_kg }) => {
            const itemLow = crop.price.low * qty_kg;
            const itemHigh = crop.price.high * qty_kg;

            return (
              <div
                key={crop.id}
                className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                    <CropIcon emoji={crop.image_emoji} cropId={crop.id} size="md" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
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

        {/* Right Col: Slot, Address & Bill Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          {/* Delivery Slot Selection */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                <span>{t('buyer.deliverySlot')}</span>
              </label>
              <span className="text-[11px] font-bold text-emerald-600">Next-Day Morning</span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {slots.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setDeliverySlot(s.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    deliverySlot === s.id
                      ? 'border-primary bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-primary'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700'
                  }`}
                >
                  <div>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      {s.label}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">{s.tag}</p>
                  </div>
                  <input
                    type="radio"
                    name="slot"
                    checked={deliverySlot === s.id}
                    onChange={() => setDeliverySlot(s.id)}
                    className="h-4 w-4 text-primary accent-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address Card with INLINE EDITING */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{t('buyer.deliveryAddress')}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddressInput(deliveryAddress);
                  setIsEditingAddress(!isEditingAddress);
                }}
                className="text-xs font-extrabold text-primary hover:text-primary-700 flex items-center gap-1 hover:underline"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{isEditingAddress ? 'Cancel' : 'Change Address'}</span>
              </button>
            </div>

            {!isEditingAddress ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                  {deliveryAddress}
                </p>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Edit Destination Address / Landmark:
                  </label>
                  <textarea
                    rows={2}
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    placeholder="Enter store/restaurant address, street, landmark, pincode..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 text-xs font-semibold text-slate-900 dark:text-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Quick saved address presets */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Saved Restaurant Branches:
                  </span>
                  <div className="space-y-1.5">
                    {addressPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAddressInput(preset)}
                        className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-colors"
                      >
                        <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{preset}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSaveAddress}
                  className="w-full bg-primary hover:bg-primary-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>Update Delivery Address</span>
                </Button>
              </div>
            )}
          </div>

          {/* Bill Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs shadow-sm">
            <div className="flex justify-between font-semibold text-slate-600 dark:text-slate-400">
              <span>Total Produce Weight</span>
              <span className="font-extrabold text-slate-900 dark:text-white">{totalKg} kg</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-600 dark:text-slate-400">
              <span>Estimated Subtotal</span>
              <span>{formatPaiseToRupees(totalPaise.low)} – {formatPaiseToRupees(totalPaise.high)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-600 dark:text-slate-400">
              <span>Direct Village Logistics</span>
              <span className="text-emerald-600 font-extrabold">Included (Free)</span>
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
            className="w-full font-black text-base shadow-lg flex items-center justify-center gap-2"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
