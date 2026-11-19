import React, { useState } from 'react';
import { useOrders } from '../../features/orders/hooks';
import { DataTable, Column } from '../../components/common/DataTable';
import { Order } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { formatPaiseToRupees, formatDate } from '../../lib/format';
import { AlertCircle, Check, Eye } from 'lucide-react';

export const Orders: React.FC = () => {
  const { data: orders = [], isLoading } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [allocationSaved, setAllocationSaved] = useState(false);

  const columns: Column<Order>[] = [
    {
      header: 'Order ID',
      accessorKey: 'id',
      cell: (o) => <span className="font-mono font-bold">#{o.id}</span>,
      sortable: true,
    },
    {
      header: 'Buyer Business',
      cell: (o) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{o.buyer?.business_name || o.address}</p>
          <p className="text-[11px] text-slate-400">{o.slot} · {formatDate(o.created_at)}</p>
        </div>
      ),
    },
    {
      header: 'Items',
      cell: (o) => (
        <span className="font-semibold">
          {o.items.length} crops ({o.items.reduce((s, it) => s + it.qty_kg, 0)} kg)
        </span>
      ),
    },
    {
      header: 'Total Value',
      accessorKey: 'total',
      cell: (o) => <span className="font-black text-primary">{formatPaiseToRupees(o.total)}</span>,
      sortable: true,
    },
    {
      header: 'Payment',
      accessorKey: 'payment_mode',
      cell: (o) => <span className="text-xs font-bold uppercase">{o.payment_mode}</span>,
    },
    {
      header: 'Status',
      cell: (o) => <StatusBadge status={o.status} variant="info" />,
    },
    {
      header: 'Allocation',
      cell: (o) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedOrder(o);
            setAllocationSaved(false);
          }}
          className="text-xs font-bold"
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          <span>Manage Allocation</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Commercial Orders & Produce Allocation
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Review buyer bulk orders, manage substitute suggestions, and confirm daily volume allocations.
        </p>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        searchKey="id"
        searchPlaceholder="Search by order id..."
        isLoading={isLoading}
        filename="orders.csv"
      />

      {/* Allocation & Substitute Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        {selectedOrder && (
          <div>
            <DialogHeader>
              <DialogTitle>Order Produce Allocation · #{selectedOrder.id}</DialogTitle>
              <DialogDescription>
                Compare ordered kg against morning hub harvest arrivals. Substitutes will notify the buyer.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 my-4">
              {selectedOrder.items.map((it) => (
                <div
                  key={it.crop_id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">
                      {it.crop?.name_en || it.crop_id}
                    </h5>
                    <p className="text-slate-500">Ordered: {it.qty_kg} kg</p>
                    {it.substitute_suggestions && (
                      <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
                        Suggested substitutes: {it.substitute_suggestions.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Confirmed kg:</span>
                    <input
                      type="number"
                      defaultValue={it.confirmed_kg || it.qty_kg}
                      className="w-20 rounded-lg border border-slate-300 p-1.5 text-center font-bold dark:bg-slate-800"
                    />
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  setAllocationSaved(true);
                  setTimeout(() => setSelectedOrder(null), 1200);
                }}
                className="w-full sm:w-auto font-bold bg-primary hover:bg-primary-700"
              >
                {allocationSaved ? 'Allocations Confirmed ✓' : 'Save Allocation'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
};
