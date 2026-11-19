import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Truck, History, WifiOff, RefreshCw } from 'lucide-react';
import { RoleSwitcher } from '../routes/RoleSwitcher';
import { LanguageSwitch } from '../components/common/LanguageSwitch';
import { offlineQueue } from '../lib/offlineQueue';

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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between max-w-lg mx-auto shadow-2xl relative font-sans">
      {/* Top Bar - High Contrast Sunlight Friendly */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-xl shadow">
            🚚
          </div>
          <div>
            <h1 className="font-black text-white text-base leading-tight">Driver Fleet Console</h1>
            <span className="text-xs text-blue-400 font-bold">Admin-Assigned Trips Only</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitch className="bg-slate-800 text-white border-slate-700" />
        </div>
      </header>

      {/* Demo Switcher */}
      <div className="bg-slate-800/90 px-3 py-1.5 flex justify-center border-b border-slate-700">
        <RoleSwitcher />
      </div>

      {/* Offline / Pending Sync Alert Bar */}
      {(!isOnline || pendingCount > 0) && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between select-none">
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
      <main className="flex-1 pb-24 overflow-y-auto">
        <Outlet />
      </main>

      {/* Driver Bottom Navigation (Big touch targets) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-black/95 border-t border-slate-800 py-2 px-4 z-40 grid grid-cols-2 gap-3 shadow-2xl">
        <button
          onClick={() => navigate('/driver')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-sm transition-all min-h-[52px] ${
            location.pathname === '/driver' || location.pathname.startsWith('/driver/trip')
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Truck className="h-5 w-5" />
          <span>Active Trips</span>
        </button>

        <button
          onClick={() => navigate('/driver/history')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-sm transition-all min-h-[52px] ${
            location.pathname === '/driver/history'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <History className="h-5 w-5" />
          <span>Trip History</span>
        </button>
      </nav>
    </div>
  );
};
