import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, ClipboardList, User } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { RoleSwitcher } from '../routes/RoleSwitcher';
import { LanguageSwitch } from '../components/common/LanguageSwitch';
import { APP_NAME, APP_NAME_KN } from '../lib/constants';
import { useTranslation } from 'react-i18next';

export const BuyerLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getItemCount } = useCartStore();
  const { i18n } = useTranslation();
  const isKn = i18n.language === 'kn';
  const cartCount = getItemCount();

  const navItems = [
    { label: isKn ? 'ಮುಖಪುಟ' : 'Home', path: '/buyer', icon: <Home className="h-5 w-5" /> },
    {
      label: isKn ? 'ಬುಟ್ಟಿ' : 'Cart',
      path: '/buyer/cart',
      icon: <ShoppingBag className="h-5 w-5" />,
      badge: cartCount,
    },
    { label: isKn ? 'ಆರ್ಡರ್‌ಗಳು' : 'Orders', path: '/buyer/orders', icon: <ClipboardList className="h-5 w-5" /> },
    { label: isKn ? 'ಖಾತೆ' : 'Account', path: '/buyer/account', icon: <User className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between max-w-lg mx-auto shadow-2xl relative">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-black text-lg shadow-sm">
            🌾
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 dark:text-white text-base leading-none">
              {isKn ? APP_NAME_KN : APP_NAME}
            </h1>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
              Bulk Fresh Market
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitch />
        </div>
      </header>

      {/* Demo Role Switcher bar */}
      <div className="bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 flex justify-center border-b border-slate-200 dark:border-slate-700">
        <RoleSwitcher />
      </div>

      {/* Main Outlet */}
      <main className="flex-1 pb-24 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation (Blinkit style) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-2 px-3 z-40 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center relative py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-primary font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                {item.icon}
                {!!item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
