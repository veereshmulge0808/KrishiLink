import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/button';
import { Store, CreditCard, ShieldCheck, LogOut, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatPaiseToRupees } from '../../lib/format';
import { useTranslation } from 'react-i18next';

export const BuyerAccount: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5">
      <h2 className="text-xl font-black text-slate-900 dark:text-white">
        {t('buyer.accountTitle')}
      </h2>

      {/* Profile Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
        <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 flex items-center justify-center text-2xl font-bold">
          🏨
        </div>
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            {user?.name || 'Udupi Upahar Veg Restaurant'}
          </h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <Phone className="h-3 w-3" />
            <span>{user?.phone || '+91 98765 43201'}</span>
          </p>
          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Verified Wholesale Buyer ✓
          </span>
        </div>
      </div>

      {/* Credit Summary Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Wholesale Credit Line
          </span>
          <CreditCard className="h-5 w-5 text-emerald-400" />
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xs text-slate-400 block">{t('buyer.creditAvailable')}</span>
            <span className="text-2xl font-black text-emerald-400">
              {formatPaiseToRupees(10750000)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">{t('buyer.creditLimit')}</span>
            <span className="text-sm font-bold text-slate-200">
              {formatPaiseToRupees(15000000)}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-700 text-xs text-slate-400 flex justify-between">
          <span>Current Due: {formatPaiseToRupees(4250000)}</span>
          <span className="text-slate-300">Term: 7 Days</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-2">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full text-red-600 hover:bg-red-50 font-bold flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
};
