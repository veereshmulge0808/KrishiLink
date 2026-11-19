import React from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Home, ShoppingBag, ClipboardList, User, Store, ShieldCheck, MapPin } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { RoleSwitcher } from '../routes/RoleSwitcher';
import { LanguageSwitch } from '../components/common/LanguageSwitch';
import { APP_NAME, APP_NAME_KN } from '../lib/constants';
import { useTranslation } from 'react-i18next';
import { Logo } from '../components/common/Logo';
import { formatPaiseToRupees } from '../lib/format';

export const BuyerLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getItemCount, getTotalPaise } = useCartStore();
  const { i18n } = useTranslation();
  const isKn = i18n.language === 'kn';
  const cartCount = getItemCount();
  const totalPaise = getTotalPaise();

  const navItems = [
    { label: isKn ? 'ಮುಖಪುಟ' : 'Market', path: '/buyer', icon: <Home className="h-5 w-5" /> },
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
      {/* Desktop & Mobile Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Subtitle */}
          <Link to="/buyer" className="hover:opacity-95 transition-opacity">
            <Logo size="sm" showSubtitle={true} subtitle={isKn ? 'ಸಗಟು ತಾಜಾ ಮಾರುಕಟ್ಟೆ' : 'Bulk Fresh Market'} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navItems.map((item) => {
              const isActive =
                item.path === '/buyer'
                  ? location.pathname === '/buyer'
                  : location.pathname.startsWith(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all relative ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {!!item.badge && item.badge > 0 && (
                    <span className="flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-primary text-[11px] font-black text-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Header Right Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Cart Summary Pill */}
            {cartCount > 0 && (
              <button
                onClick={() => navigate('/buyer/cart')}
                className="hidden sm:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>
                  {cartCount} items · {formatPaiseToRupees(totalPaise.low)}
                </span>
              </button>
            )}

            <LanguageSwitch />
          </div>
        </div>
      </header>

      {/* Demo Role Switcher bar */}
      <div className="bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 flex justify-center border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl w-full flex justify-center">
          <RoleSwitcher />
        </div>
      </div>

      {/* Main Container - Responsive for both PC and Mobile */}
      <main className="flex-1 w-full max-w-7xl mx-auto pb-24 md:pb-12 overflow-y-auto">
        <Outlet />
      </main>

      {/* Mobile-Only Bottom Navigation (Blinkit style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-2 px-3 z-40 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const isActive =
            item.path === '/buyer'
              ? location.pathname === '/buyer'
              : location.pathname.startsWith(item.path);

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
