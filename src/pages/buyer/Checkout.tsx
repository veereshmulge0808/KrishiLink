import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../stores/cartStore';
import { useCreateOrder } from '../../features/orders/hooks';
import { Button } from '../../components/ui/button';
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { formatPaiseToRupees } from '../../lib/format';
import { useTranslation } from 'react-i18next';
import { Order } from '../../types';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, deliverySlot, paymentMode, setPaymentMode, deliveryAddress, getTotalPaise, clearCart } =
    useCartStore();
  const createOrderMutation = useCreateOrder();
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const cartList = Object.values(items);
  const totalPaise = getTotalPaise();
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const handlePlaceOrder = async () => {
    if (cartList.length === 0) return;

    const payload = {
      delivery_date: '2026-11-20',
      slot: deliverySlot,
      payment_mode: paymentMode,
      items: cartList.map((item) => ({
        crop_id: item.crop.id,
        qty_kg: item.qty_kg,
      })),
      address: deliveryAddress,
    };

    const res = await createOrderMutation.mutateAsync(payload);
    setCreatedOrder(res);
    clearCart();
  };

  // If order placed -> Confirmation Screen
  if (createdOrder) {
    const hasPartials = createdOrder.items.some((it) => it.note === 'PARTIAL');

    return (
      <div className="p-4 sm:p-6 text-center space-y-5 animate-in fade-in duration-300">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-2">
          <CheckCircle2 className="h-10 w-10 animate-bounce" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {t('buyer.orderSuccessTitle')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">{t('buyer.orderSuccessSub')}</p>
        </div>

        {/* Locked Price Summary */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">
                Order ID
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                #{createdOrder.id}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">
                Final Locked Total
              </span>
              <span className="text-base font-black text-primary">
                {formatPaiseToRupees(createdOrder.total)}
              </span>
            </div>
          </div>

          {/* Delivery OTP Badge */}
          {createdOrder.delivery_otp && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 block">
                DELIVERY SECURITY OTP
              </span>
              <span className="text-2xl font-black text-blue-900 dark:text-blue-100 tracking-widest">
                {createdOrder.delivery_otp}
              </span>
              <span className="text-[10px] text-blue-600 block mt-0.5">
                Share this with your delivery driver tomorrow morning
              </span>
            </div>
          )}

          {/* Items Locked Breakdown */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Produce Allocation & Prices:
            </span>
            {createdOrder.items.map((it) => (
              <div
                key={it.crop_id}
                className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {it.crop?.name_en || it.crop_id}
                  </span>
                  <span className="text-slate-400 block text-[11px]">
                    Allocated: {it.confirmed_kg} kg of {it.qty_kg} kg
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatPaiseToRupees((it.price_per_kg_locked || 0) * (it.confirmed_kg || 0))}
                  </span>
                  <span className="text-[10px] text-emerald-600 block font-semibold">
                    @{formatPaiseToRupees(it.price_per_kg_locked || 0)}/kg locked
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Partial fill alert if any */}
          {hasPartials && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 text-left">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Harvest Notice: French Beans Partially Filled</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Due to morning harvest volume, French Beans was allocated at 20 kg. Suggested substitutes available for next-day dispatch: Capsicum or Cabbage.
              </p>
            </div>
          )}
        </div>

        {/* Next Action */}
        <div className="space-y-2 pt-3">
          <Button
            onClick={() => navigate(`/buyer/orders/${createdOrder.id}`)}
            size="xl"
            className="w-full bg-primary hover:bg-primary-700 text-white font-bold shadow-lg"
          >
            {t('buyer.trackOrder')}
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/buyer/orders')}
            className="w-full font-semibold"
          >
            View All Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5">
      <div>
        <button
          onClick={() => navigate('/buyer/cart')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Cart</span>
        </button>
      </div>

      <h2 className="text-xl font-black text-slate-900 dark:text-white">Review & Confirm</h2>

      {/* Delivery details summary */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
        <div className="flex justify-between font-medium">
          <span className="text-slate-500">Destination:</span>
          <span className="font-bold text-slate-900 dark:text-white">{deliveryAddress}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span className="text-slate-500">Scheduled Arrival:</span>
          <span className="font-bold text-emerald-600">Tomorrow ({deliverySlot})</span>
        </div>
      </div>

      {/* Payment mode choice */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
          {t('buyer.paymentMethod')}
        </label>
        <div className="space-y-2">
          <div
            onClick={() => setPaymentMode('PREPAID')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
              paymentMode === 'PREPAID'
                ? 'border-primary bg-primary-50/50 dark:bg-emerald-950/40 ring-1 ring-primary'
                : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  UPI / NetBanking / Cards
                </p>
                <p className="text-[11px] text-slate-400">Instant digital settlement</p>
              </div>
            </div>
            <input
              type="radio"
              checked={paymentMode === 'PREPAID'}
              onChange={() => setPaymentMode('PREPAID')}
            />
          </div>

          <div
            onClick={() => setPaymentMode('CREDIT')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
              paymentMode === 'CREDIT'
                ? 'border-primary bg-primary-50/50 dark:bg-emerald-950/40 ring-1 ring-primary'
                : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  7-Day Credit (Approved Wholesaler)
                </p>
                <p className="text-[11px] text-emerald-600 font-semibold">
                  Approved limit: ₹1,50,000 (Available: ₹1,07,500)
                </p>
              </div>
            </div>
            <input
              type="radio"
              checked={paymentMode === 'CREDIT'}
              onChange={() => setPaymentMode('CREDIT')}
            />
          </div>
        </div>
      </div>

      {/* Price Lock Guarantee Note */}
      <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
        <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Price Protection Guarantee</p>
          <p className="text-[11px] mt-0.5 text-emerald-800 dark:text-emerald-300">
            By clicking confirm, your maximum price is strictly capped to the forecast upper bound. You will never be charged above the confirmed range.
          </p>
        </div>
      </div>

      {/* Place Order CTA */}
      <Button
        onClick={handlePlaceOrder}
        disabled={createOrderMutation.isPending}
        size="xl"
        className="w-full font-black text-base shadow-xl mt-3"
      >
        {createOrderMutation.isPending
          ? 'Locking Prices & Placing Order...'
          : `${t('buyer.placeOrder')} (~${formatPaiseToRupees(totalPaise.high)})`}
      </Button>
    </div>
  );
};
