import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Truck, IndianRupee, User, Settings } from 'lucide-react';
import { RoleSwitcher } from '../routes/RoleSwitcher';
import { LanguageSwitch } from '../components/common/LanguageSwitch';
import { APP_NAME_KN, APP_NAME } from '../lib/constants';
import { useTranslation } from 'react-i18next';
import { Logo } from '../components/common/Logo';

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
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      label: isKn ? 'ಪಿಕಪ್' : 'Pickup',
      sub: isKn ? 'ವಾಹನ ಟ್ರ್ಯಾಕಿಂಗ್' : 'Live Driver',
      path: '/farmer/pickup',
      icon: <Truck className="h-5 w-5" />,
    },
    {
      label: isKn ? 'ಹಣ' : 'Money',
      sub: isKn ? 'ಪಾವತಿ ವಿವರ' : 'Payments',
      path: '/farmer/payments',
      icon: <IndianRupee className="h-5 w-5" />,
    },
    {
      label: isKn ? 'ಪ್ರೊಫೈಲ್' : 'Profile',
      sub: isKn ? 'ರೈತರ ವಿವರ' : 'Farmer Info',
      path: '/farmer/profile',
      icon: <User className="h-5 w-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between max-w-md mx-auto shadow-2xl border-x border-slate-200 dark:border-slate-800 relative font-sans">
      {/* Top Header - Mobile Header with KrishiLink Logo */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/farmer')}>
          <Logo size="sm" showSubtitle={true} subtitle={isKn ? 'ರೈತರ ಮೊಬೈಲ್ ಸೇವೆ' : 'Farmer Mobile Portal'} />
        </div>

        <div className="flex items-center gap-1.5">
          <LanguageSwitch />
          <button
            onClick={() => navigate('/farmer/threshold')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
            aria-label="Threshold Settings"
            title="Threshold Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Demo Role Switcher */}
      <div className="bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 flex justify-center border-b border-slate-200 dark:border-slate-700">
        <RoleSwitcher />
      </div>

      {/* Main Outlet */}
      <main className="flex-1 pb-24 p-4 overflow-y-auto">
        <Outlet />
      </main>

      {/* 4 Big Bottom Tabs (Icon + Label, >= 48px tap target) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-2 z-40 grid grid-cols-4 gap-1.5 shadow-2xl">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all min-h-[54px] ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md font-bold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <div className="mb-0.5">{tab.icon}</div>
              <span className="text-xs font-black leading-tight">{tab.label}</span>
              <span className={`text-[9px] ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                {tab.sub}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
