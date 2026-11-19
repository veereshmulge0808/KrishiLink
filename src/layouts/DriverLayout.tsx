import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Truck, History, WifiOff, RefreshCw, User } from 'lucide-react';
import { RoleSwitcher } from '../routes/RoleSwitcher';
import { LanguageSwitch } from '../components/common/LanguageSwitch';
import { offlineQueue } from '../lib/offlineQueue';
import { Logo } from '../components/common/Logo';

export const DriverLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState<number>(offlineQueue.getPendingCount());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe((count) => {
      setPendingCount(count);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await offlineQueue.processQueue();
    setIsSyncing(false);
  };

  const navItems = [
    {
      label: 'Active Trips',
      path: '/driver',
      icon: <Truck className="h-5 w-5" />,
      matchExact: true,
    },
    {
      label: 'Trip History',
      path: '/driver/history',
      icon: <History className="h-5 w-5" />,
    },
    {
      label: 'Profile',
      path: '/driver/profile',
      icon: <User className="h-5 w-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between max-w-md mx-auto shadow-2xl border-x border-slate-200 relative font-sans">
      {/* Top Bar - Clean Light Theme with KrishiLink Logo */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/driver')}>
          <Logo size="sm" showSubtitle={true} subtitle="Driver Fleet Console" />
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitch />
        </div>
      </header>

      {/* Demo Switcher */}
      <div className="bg-slate-100 px-3 py-1.5 flex justify-center border-b border-slate-200">
        <RoleSwitcher />
      </div>

      {/* Offline / Pending Sync Alert Bar */}
      {(!isOnline || pendingCount > 0) && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between select-none shadow-sm">
          <div className="flex items-center gap-2">
            {!isOnline && <WifiOff className="h-4 w-4" />}
            <span>
              {!isOnline ? 'Offline Mode · ' : ''}
              {pendingCount > 0 ? `Pending Sync (${pendingCount} actions)` : 'Ready'}
            </span>
          </div>
          {pendingCount > 0 && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-2.5 py-1 rounded bg-black text-white font-bold text-[11px] flex items-center gap-1 active:scale-95"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Now</span>
            </button>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-24 p-4 overflow-y-auto">
        <Outlet />
      </main>

      {/* Driver Bottom Navigation (Clean Light Theme with 3 big touch targets) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-3 z-40 grid grid-cols-3 gap-2 shadow-xl">
        {navItems.map((item) => {
          const isActive =
            item.matchExact
              ? location.pathname === item.path || (location.pathname.startsWith('/driver/trip') && !location.pathname.includes('history'))
              : location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl font-black text-xs transition-all min-h-[52px] ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="mb-0.5">{item.icon}</div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
