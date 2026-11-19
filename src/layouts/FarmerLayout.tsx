import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Truck, IndianRupee, Settings } from 'lucide-react';
import { RoleSwitcher } from '../routes/RoleSwitcher';
import { LanguageSwitch } from '../components/common/LanguageSwitch';
import { APP_NAME_KN, APP_NAME } from '../lib/constants';
import { useTranslation } from 'react-i18next';

export const FarmerLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const tabs = [
    {
      label: isKn ? 'ಇವತ್ತು' : 'Today',
      sub: isKn ? 'ಬೆಳೆ ಮಾಹಿತಿ' : 'Harvest Ready',
      path: '/farmer',
      icon: <Calendar className="h-6 w-6" />,
    },
    {
      label: isKn ? 'ಪಿಕಪ್' : 'Pickup',
      sub: isKn ? 'ವಾಹನ ಟ್ರ್ಯಾಕಿಂಗ್' : 'Live Driver',
      path: '/farmer/pickup',
      icon: <Truck className="h-6 w-6" />,
    },
    {
      label: isKn ? 'ಹಣ' : 'Money',
      sub: isKn ? 'ಪಾವತಿ ವಿವರ' : 'Payments',
      path: '/farmer/payments',
      icon: <IndianRupee className="h-6 w-6" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between max-w-lg mx-auto shadow-2xl relative">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-xl shadow">
            🌾
          </div>
          <div>
            <h1 className="font-black text-slate-900 dark:text-white text-lg leading-tight">
              {isKn ? APP_NAME_KN : APP_NAME}
            </h1>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
              {isKn ? 'ರೈತರ ಮೊಬೈಲ್ ಸೇವೆ' : 'Farmer Portal'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <button
            onClick={() => navigate('/farmer/threshold')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200"
            aria-label="Threshold Settings"
            title="Threshold Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Demo Role Switcher */}
      <div className="bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 flex justify-center border-b border-slate-200 dark:border-slate-700">
        <RoleSwitcher />
      </div>

      {/* Main Outlet */}
      <main className="flex-1 pb-28 p-4 overflow-y-auto">
        <Outlet />
      </main>

      {/* 3 Big Bottom Tabs (Icon + Label, >= 48px tap target) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-2 z-40 grid grid-cols-3 gap-2 shadow-2xl">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl transition-all min-h-[56px] ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <div className="mb-0.5">{tab.icon}</div>
              <span className="text-sm font-black leading-tight">{tab.label}</span>
              <span className={`text-[10px] ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                {tab.sub}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
