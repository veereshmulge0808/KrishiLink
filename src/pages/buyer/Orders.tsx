import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../features/orders/hooks';
import { useCartStore } from '../../stores/cartStore';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TableSkeleton } from '../../components/common/Skeletons';
import { formatPaiseToRupees, formatDate } from '../../lib/format';
import { Navigation, RotateCcw, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { data: orders = [], isLoading } = useOrders();
  const { addItem } = useCartStore();
  const { t } = useTranslation();

  const handleReorder = (order: any) => {
    order.items.forEach((it: any) => {
      if (it.crop) {
        addItem(it.crop, it.qty_kg);
      }
    });
    navigate('/buyer/cart');
  };

  if (isLoading) {
    return <TableSkeleton rows={4} />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5">
      <h2 className="text-xl font-black text-slate-900 dark:text-white">
        {t('buyer.ordersTitle')}
      </h2>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Package className="h-12 w-12 mx-auto text-slate-300 mb-2" />
          <p className="font-bold">No orders placed yet</p>
          <Button onClick={() => navigate('/buyer')} className="mt-4 font-bold">
            Start First Order
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';
            const totalKg = order.items.reduce((sum, it) => sum + it.qty_kg, 0);

            return (
              <div
                key={order.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-slate-400 font-bold block">
                      #{order.id}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDate(order.created_at)} · Slot: {order.slot}
                    </span>
                  </div>
                  <StatusBadge
                    status={order.status}
                    variant={
                      isOutForDelivery ? 'info' : order.status === 'DELIVERED' ? 'success' : 'neutral'
                    }
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span>{order.items.length} Vegetables ({totalKg} kg)</span>
                    <span className="text-primary font-black">
                      {formatPaiseToRupees(order.total)}
                    </span>
                  </div>
                  <p className="text-slate-500 line-clamp-1">
                    {order.items.map((i) => i.crop?.name_en || i.crop_id).join(', ')}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReorder(order)}
                    className="text-xs font-bold"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    <span>{t('buyer.reorder')}</span>
                  </Button>

                  {isOutForDelivery && (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/buyer/orders/${order.id}`)}
                      className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-sm"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>{t('buyer.trackOrder')}</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
