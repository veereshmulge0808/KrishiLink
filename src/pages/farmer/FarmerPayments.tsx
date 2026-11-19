import React, { useState } from 'react';
import { useFarmerPayments } from '../../features/payments/hooks';
import { formatPaiseToRupees, formatDate } from '../../lib/format';
import { Sheet, SheetHeader, SheetTitle, SheetDescription } from '../../components/ui/sheet';
import { IndianRupee, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FarmerSettlement } from '../../types';

export const FarmerPayments: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const { data: payments = [], isLoading } = useFarmerPayments('u_farmer_1');
  const [selectedStatement, setSelectedStatement] = useState<FarmerSettlement | null>(null);

  const totalPaid = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.net_amount, 0);

  const totalDue = payments
    .filter((p) => p.status === 'DUE' || p.status === 'APPROVED')
    .reduce((sum, p) => sum + p.net_amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
        {t('farmer.paymentsTitle')}
      </h2>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-3xl bg-emerald-600 text-white shadow-md">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 block">
            {t('farmer.paid')}
          </span>
          <span className="text-2xl font-black block mt-1">
            {formatPaiseToRupees(totalPaid)}
          </span>
          <span className="text-[11px] text-emerald-100 mt-1 block">Transferred to Bank</span>
        </div>

        <div className="p-4 rounded-3xl bg-amber-500 text-slate-950 shadow-md">
          <span className="text-xs font-black uppercase tracking-wider text-amber-900 block">
            {t('farmer.due')}
          </span>
          <span className="text-2xl font-black block mt-1">
            {formatPaiseToRupees(totalDue)}
          </span>
          <span className="text-[11px] text-amber-950 mt-1 block font-semibold">
            Settles by tomorrow
          </span>
        </div>
      </div>

      {/* Settlements List */}
      <div className="space-y-2 mt-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
          Settlement Statements
        </span>

        {payments.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelectedStatement(p)}
            className="p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-base ${
                  p.status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                ₹
              </div>
              <div>
                <p className="font-black text-sm text-slate-900 dark:text-white">
                  {formatDate(p.date)}
                </p>
                <p className="text-xs text-slate-500 font-semibold">
                  {p.accepted_kg} kg Accepted Produce
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="font-black text-base text-slate-900 dark:text-white block">
                  {formatPaiseToRupees(p.net_amount)}
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    p.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {p.status === 'PAID' ? t('farmer.paid') : t('farmer.due')}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Statement Detail Sheet */}
      <Sheet
        open={!!selectedStatement}
        onOpenChange={(open) => !open && setSelectedStatement(null)}
        side="bottom"
      >
        {selectedStatement && (
          <div className="space-y-4">
            <SheetHeader>
              <SheetTitle>
                Settlement Statement · {formatDate(selectedStatement.date)}
              </SheetTitle>
              <SheetDescription>
                Accepted harvest weight and transparent commission breakdown.
              </SheetDescription>
            </SheetHeader>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Gross Harvest Value:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatPaiseToRupees(selectedStatement.gross_amount)}
                </span>
              </div>
              <div className="flex justify-between font-medium text-slate-500">
                <span>Platform Commission (6%):</span>
                <span className="text-red-500 font-bold">
                  - {formatPaiseToRupees(selectedStatement.commission_amount)}
                </span>
              </div>
              <div className="flex justify-between font-medium text-slate-500">
                <span>Farm-Gate Logistics Share:</span>
                <span className="text-red-500 font-bold">
                  - {formatPaiseToRupees(selectedStatement.logistics_share)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-base font-black text-slate-900 dark:text-white">
                <span>{t('farmer.netPayout')}:</span>
                <span className="text-primary">
                  {formatPaiseToRupees(selectedStatement.net_amount)}
                </span>
              </div>
            </div>

            {selectedStatement.utr && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-300">
                <p className="font-bold">Bank Transfer Reference (UTR):</p>
                <p className="font-mono mt-0.5">{selectedStatement.utr}</p>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
};
