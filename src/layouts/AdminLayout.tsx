import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Warehouse,
  ArrowLeftRight,
  Send,
  Truck,
  ShoppingCart,
  Users,
  Store,
  Navigation,
  TrendingUp,
  LineChart,
  IndianRupee,
  Settings,
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  User as UserIcon,
  ShieldCheck,
  Monitor,
} from 'lucide-react';
import { RoleSwitcher } from '../routes/RoleSwitcher';
import { LanguageSwitch } from '../components/common/LanguageSwitch';
import { useUiStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useAlerts } from '../features/pricing/hooks';
import { APP_NAME, APP_TAGLINE } from '../lib/constants';
import { useTranslation } from 'react-i18next';
import { Logo } from '../components/common/Logo';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode, sidebarOpen, toggleSidebar } = useUiStore();
  const { user, setUser } = useAuthStore();
  const { data: alerts = [] } = useAlerts();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Admin profile state
  const [adminName, setAdminName] = useState(user?.name || 'Anita Rao');
  const [adminEmail, setAdminEmail] = useState('ops.tower@krishilink.in');
  const [adminPhone, setAdminPhone] = useState(user?.phone || '+91 98765 43204');
  const [adminRoleTitle, setAdminRoleTitle] = useState('Senior Logistics Control Tower Lead');

  const handleSaveProfile = () => {
    if (user) {
      setUser({ ...user, name: adminName, phone: adminPhone });
    }
    setProfileOpen(false);
  };

  const navSections = [
    {
      title: 'Operations Tower',
      items: [
        { label: t('admin.controlTower'), path: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: t('admin.hubs'), path: '/admin/hubs', icon: <Warehouse className="h-4 w-4" /> },
        { label: t('admin.transfers'), path: '/admin/transfers', icon: <ArrowLeftRight className="h-4 w-4" /> },
        { label: t('admin.dispatch'), path: '/admin/dispatch', icon: <Send className="h-4 w-4" /> },
        { label: t('admin.trips'), path: '/admin/trips', icon: <Truck className="h-4 w-4" /> },
      ],
    },
    {
      title: 'Commercial & Network',
      items: [
        { label: t('admin.orders'), path: '/admin/orders', icon: <ShoppingCart className="h-4 w-4" /> },
        { label: t('admin.farmers'), path: '/admin/farmers', icon: <Users className="h-4 w-4" /> },
        { label: t('admin.buyers'), path: '/admin/buyers', icon: <Store className="h-4 w-4" /> },
        { label: t('admin.drivers'), path: '/admin/drivers', icon: <Navigation className="h-4 w-4" /> },
      ],
    },
    {
      title: 'Intelligence & Finance',
      items: [
        { label: t('admin.pricing'), path: '/admin/pricing', icon: <TrendingUp className="h-4 w-4" /> },
        { label: t('admin.forecasts'), path: '/admin/forecasts', icon: <LineChart className="h-4 w-4" /> },
        { label: t('admin.payments'), path: '/admin/payments', icon: <IndianRupee className="h-4 w-4" /> },
        { label: t('admin.settings'), path: '/admin/settings', icon: <Settings className="h-4 w-4" /> },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-all duration-200 z-30 sticky top-0 h-screen ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Brand */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="KrishiLink"
              className="h-10 w-auto object-contain shrink-0 drop-shadow-sm"
            />
            {sidebarOpen && (
              <div>
                <h2 className="font-extrabold text-base tracking-tight leading-none text-slate-900 dark:text-white">
                  {APP_NAME}
                </h2>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider mt-0.5">
                  Ops Control Tower
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {navSections.map((sec, sIdx) => (
            <div key={sIdx}>
              {sidebarOpen && (
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {sec.title}
                </p>
              )}
              <div className="space-y-1">
                {sec.items.map((item) => {
                  const isActive =
                    item.path === '/admin'
                      ? location.pathname === '/admin'
                      : location.pathname.startsWith(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                      }`}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      {item.icon}
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          {sidebarOpen && <span>Bengaluru Hub (v1.0)</span>}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Date Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
              <span>📅 Operations Date:</span>
              <span className="text-primary font-black">20 Nov 2026</span>
            </div>

            {/* Global Search */}
            <div className="relative hidden lg:block w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search trip, farmer, order..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Right Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Demo Role Switcher */}
            <RoleSwitcher />

            <LanguageSwitch />

            {/* Alerts Bell */}
            <button
              onClick={() => navigate('/admin')}
              className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              aria-label="Alerts"
            >
              <Bell className="h-4 w-4" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white animate-pulse">
                  {alerts.length}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Admin Profile Button */}
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Admin Account Profile"
            >
              <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                AR
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-bold leading-tight text-slate-900 dark:text-white">{adminName}</p>
                <p className="text-[10px] text-emerald-600 font-extrabold">SUPER ADMIN</p>
              </div>
            </button>
          </div>
        </header>

        {/* Strictly PC Notice Banner for Viewports < 1024px */}
        <div className="lg:hidden bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center gap-2 shadow-sm">
          <Monitor className="h-4 w-4 shrink-0" />
          <span>
            Strictly PC Interface Notice: KrishiLink Operations Control Tower is optimized for desktop PC monitors (≥1024px) for full fleet dispatch & multi-hub telemetry.
          </span>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-2 z-30">
            {navSections.flatMap((s) => s.items).map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>

        {/* Admin Profile & Account Modal */}
        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
          <DialogHeader>
            <DialogTitle>Admin Control Tower Account</DialogTitle>
            <DialogDescription>
              Manage Super Administrator credentials and hub operations dispatch permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-3 text-xs">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center">
                AR
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900 dark:text-white">{adminName}</p>
                <p className="text-slate-500 font-semibold">{adminRoleTitle}</p>
                <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
                  Full Root Ops Privileges ✓
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">Admin Full Name</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-bold dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">Official Email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">Assigned Base Station</label>
                <input
                  type="text"
                  disabled
                  value="Bengaluru Central Ops Hub (Yeshwanthpur)"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-bold bg-slate-100 dark:bg-slate-800/60 text-slate-500"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} className="bg-primary hover:bg-primary-700 text-white font-bold">
              Save Account Profile
            </Button>
          </DialogFooter>
        </Dialog>
      </div>
    </div>
  );
};
