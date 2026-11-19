import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../features/orders/hooks';
import { useCartStore } from '../../stores/cartStore';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TableSkeleton } from '../../components/common/Skeletons';
import { formatPaiseToRupees, formatDate } from '../../lib/format';
import {
  Navigation,
  RotateCcw,
  Package,
  ChevronRight,
  MapPin,
  Clock,
  Phone,
  FileText,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { CropIcon } from '../../components/crop/CropIcon';
import { CallButton } from '../../components/call/CallButton';
import { Order } from '../../types';

export const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { data: orders = [], isLoading } = useOrders();
  const { addItem } = useCartStore();
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleReorder = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    order.items.forEach((it: any) => {
      if (it.crop) {
        addItem(it.crop, it.qty_kg);
      }
    });
    navigate('/buyer/cart');
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <TableSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t('buyer.ordersTitle')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tap on any order card to view itemized breakdown, bill receipt & driver tracking.
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <Package className="h-12 w-12 mx-auto text-slate-300 mb-2" />
          <p className="font-extrabold text-base text-slate-800 dark:text-slate-200">
            No orders placed yet
          </p>
          <p className="text-xs text-slate-400 mt-1">Fresh daily arrivals from Kolar & Hoskote hubs.</p>
          <Button onClick={() => navigate('/buyer')} className="mt-4 font-bold bg-primary hover:bg-primary-700">
            Start First Order
          </Button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {orders.map((order) => {
            const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';
            const totalKg = order.items.reduce((sum, it) => sum + it.qty_kg, 0);

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="group p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all cursor-pointer space-y-3"
              >
                {/* Header: ID, date, status, chevron */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-slate-400 font-extrabold block">
                      #{order.id}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {formatDate(order.created_at)} · Slot: {order.slot}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={order.status}
                      variant={
                        isOutForDelivery ? 'info' : order.status === 'DELIVERED' ? 'success' : 'neutral'
                      }
                    />
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Produce Summary Box */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1.5 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span className="text-xs sm:text-sm">{order.items.length} Vegetables ({totalKg} kg)</span>
                    <span className="text-primary font-black text-sm sm:text-base">
                      {formatPaiseToRupees(order.total)}
                    </span>
                  </div>
                  <p className="text-slate-500 line-clamp-1 font-medium">
                    {order.items.map((i) => (isKn ? i.crop?.name_kn || i.crop?.name_en : i.crop?.name_en) || i.crop_id).join(', ')}
                  </p>
                </div>

                {/* Bottom actions: Reorder & Track */}
                <div className="flex items-center justify-between gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleReorder(order, e)}
                    className="text-xs font-bold flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reorder Items</span>
                  </Button>

                  {isOutForDelivery && (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/buyer/orders/${order.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>Track Order Live</span>
                    </Button>
                  )}

                  {!isOutForDelivery && (
                    <span className="text-xs font-extrabold text-primary group-hover:underline flex items-center gap-1">
                      <span>View Full Order Details</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        {selectedOrder && (
          <div>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-black">
                    Order Details #{selectedOrder.id}
                  </DialogTitle>
                  <DialogDescription>
                    Placed on {formatDate(selectedOrder.created_at)} · Slot: {selectedOrder.slot}
                  </DialogDescription>
                </div>
                <StatusBadge status={selectedOrder.status} />
              </div>
            </DialogHeader>

            <div className="space-y-4 my-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
              {/* Delivery Address */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>Delivery Destination</span>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {selectedOrder.address || 'Udupi Upahar, 14th Main, HSR Layout Sector 4, Bengaluru - 560102'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Delivery Slot: <strong className="text-emerald-700 dark:text-emerald-400">{selectedOrder.slot}</strong>
                </p>
              </div>

              {/* Items Breakdown Table */}
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Produce Items ({selectedOrder.items.length})
                </h4>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedOrder.items.map((item, idx) => {
                    const pricePerKg = item.price_per_kg || item.crop?.price.low || 3000;
                    const itemTotal = (pricePerKg * item.qty_kg);

                    return (
                      <div key={idx} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <CropIcon emoji={item.crop?.image_emoji || '🥦'} size="sm" />
                          <div>
                            <p className="font-bold text-xs text-slate-900 dark:text-white">
                              {isKn ? item.crop?.name_kn || item.crop?.name_en : item.crop?.name_en || item.crop_id}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {item.qty_kg} kg @ {formatPaiseToRupees(pricePerKg)}/kg
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                            {formatPaiseToRupees(itemTotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price & Charges Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Items Subtotal</span>
                  <span>{formatPaiseToRupees(selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Farm Mini-Hub Handling</span>
                  <span className="text-emerald-600 font-bold">₹0.00 (Free)</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Bengaluru City Logistics</span>
                  <span className="text-emerald-600 font-bold">₹0.00 (Free)</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-sm text-slate-900 dark:text-white">
                  <span>Total Amount Paid</span>
                  <span className="text-primary">{formatPaiseToRupees(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Driver / Contact info if assigned or out for delivery */}
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/30 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    🚚
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-white">
                      Delivery Driver: Suresh Kumar
                    </p>
                    <p className="text-[11px] text-slate-500">Tata Ace · KA-01-AB-1234</p>
                  </div>
                </div>
                <CallButton targetName="Driver Suresh Kumar" targetPhone="+919845011223" target="driver" size="sm" />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => handleReorder(selectedOrder)}
                className="font-bold text-xs flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reorder Items</span>
              </Button>

              <Button
                onClick={() => {
                  const id = selectedOrder.id;
                  setSelectedOrder(null);
                  navigate(`/buyer/orders/${id}`);
                }}
                className="bg-primary hover:bg-primary-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Track on Live Map</span>
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
};
