import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/common/Logo';
import { LanguageSwitch } from '../components/common/LanguageSwitch';
import { RoleSwitcher } from '../routes/RoleSwitcher';
import { Button } from '../components/ui/button';
import {
  ShoppingBag,
  Sprout,
  Truck,
  Shield,
  ArrowRight,
  Warehouse,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Clock,
  Phone,
  Sparkles,
  ChevronRight,
  Compass,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { APP_NAME, APP_TAGLINE } from '../lib/constants';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const portals = [
    {
      role: 'buyer',
      title: isKn ? 'ಸಗಟು ಖರೀದಿದಾರರ ಮಾರುಕಟ್ಟೆ' : 'Bulk Buyer Portal',
      audience: 'Restaurants · Caterers · Hostels · Supermarkets',
      badge: 'Responsive (Mobile & PC)',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      description:
        'Blinkit/Zepto-style bulk fresh produce purchasing with locked APMC-indexed prices, live vehicle map tracking, and 7 morning delivery slots.',
      features: ['Locked Mandi Price Ranges', 'Live Delivery Truck GPS & ETA', '7 Flexible Time Slots', 'In-Place Address Switching'],
      icon: <ShoppingBag className="h-7 w-7 text-emerald-600" />,
      path: '/buyer',
      cta: 'Enter Buyer Market',
      accentColor: 'hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/20',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      role: 'farmer',
      title: isKn ? 'ರೈತರ ಮೊಬೈಲ್ ಸೇವೆ' : 'Smallholder Farmer Portal',
      audience: 'Village Farmers (Kolar · Chikkaballapur · Hoskote)',
      badge: 'Strictly Mobile First',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      description:
        'Kannada-first icon dashboard for smallholder farmers. Declare harvest quantity in kilograms, select custom ready times, and track mini-hub pickup trucks.',
      features: ['Kannada-First Big Icon UI', 'Custom Harvest Ready Times', 'Direct Pickup Window Alerts', 'Instant UPI / Bank Settlements'],
      icon: <Sprout className="h-7 w-7 text-amber-600" />,
      path: '/farmer',
      cta: 'Open Farmer Portal (ಕೃಷಿ)',
      accentColor: 'hover:border-amber-500 hover:ring-2 hover:ring-amber-500/20',
      btnColor: 'bg-emerald-700 hover:bg-emerald-800 text-white',
    },
    {
      role: 'driver',
      title: isKn ? 'ಚಾಲಕರ ಫ್ಲೀಟ್ ಕನ್ಸೋಲ್' : 'Driver Fleet Console',
      audience: 'First-Mile & Middle-Mile Logistics Pilots',
      badge: 'Strictly Mobile First',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      description:
        'High-contrast sunlight-friendly console for drivers. Full GPS route map, stop-by-stop farmer pickups with digital weight receipts, and buyer OTP handover.',
      features: ['Full GPS Route & Stop Map', 'Digital Weighing Scale Receipt', 'Detailed Stop Locations', 'Offline Queue & Instant Sync'],
      icon: <Truck className="h-7 w-7 text-blue-600" />,
      path: '/driver',
      cta: 'Launch Driver Console',
      accentColor: 'hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20',
      btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      role: 'admin',
      title: isKn ? 'ಆಪರೇಷನ್ಸ್ ಕಂಟ್ರೋಲ್ ಟವರ್' : 'Operations Control Tower',
      audience: 'Hub Managers · Fleet Dispatchers · Ops Admins',
      badge: 'Strictly PC Workstation (≥1024px)',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
      description:
        'Linear/Stripe-style desktop control tower. Live Karnataka hub telemetry, 3-state stock matrix, inter-hub lateral stock transfers, and ML pricing publish.',
      features: ['Live Hub & Fleet Telemetry Map', '3-State Lateral Stock Transfers', 'CVRP Fleet Dispatch Engine', 'Audit Log & ML Price Publish'],
      icon: <Shield className="h-7 w-7 text-purple-600" />,
      path: '/admin',
      cta: 'Open Admin Control Tower',
      accentColor: 'hover:border-purple-500 hover:ring-2 hover:ring-purple-500/20',
      btnColor: 'bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Logo size="md" showSubtitle={true} subtitle={isKn ? 'ಕರ್ನಾಟಕ ಕೃಷಿ ಲಾಜಿಸ್ಟಿಕ್ಸ್' : 'Karnataka Agri Logistics'} />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitch />
            <Button
              variant="outline"
              onClick={() => navigate('/auth/login?mode=login')}
              className="text-xs font-bold hidden sm:flex items-center gap-1"
            >
              <span>Sign In</span>
            </Button>
            <Button
              onClick={() => navigate('/auth/login?mode=register')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
            >
              <span>Create Account</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-10 pb-14 px-4 sm:px-6 max-w-7xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-6 shadow-sm border border-emerald-200/60 dark:border-emerald-800">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>Direct Farm-to-Buyer Agritech Platform</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
          Fresh produce from Karnataka farms directly to bulk buyers.
        </h1>

        <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
          Connecting smallholder vegetable & fruit farmers in <strong>Kolar, Chikkaballapur, and Hoskote</strong> directly to Bengaluru restaurants, caterers, and wholesalers with smart mini-hub aggregation.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Button
            size="xl"
            onClick={() => navigate('/buyer')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base px-6 shadow-lg flex items-center gap-2"
          >
            <ShoppingBag className="h-5 w-5" />
            <span>Explore Buyer Market</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            size="xl"
            variant="outline"
            onClick={() => navigate('/farmer')}
            className="border-slate-300 dark:border-slate-700 font-black text-sm sm:text-base px-6 shadow-sm flex items-center gap-2"
          >
            <Sprout className="h-5 w-5 text-emerald-600" />
            <span>Farmer Portal (ಕೃಷಿ ಸೇವೆ)</span>
          </Button>
        </div>

        {/* Live Operational Metrics Bar */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 block">9 Hubs</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Karnataka Hub Network</span>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white block">100+</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Smallholder Farmers</span>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white block">48 Orders</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Daily Bulk Dispatches</span>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 block">96.2%</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">On-Time Morning Dispatch</span>
          </div>
        </div>
      </section>

      {/* 4 Portals Section - The Core Navigation Cards */}
      <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Four Role-Based Portals in One Unified Platform
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl mx-auto">
            Choose your dedicated workspace tailored specifically for mobile handheld devices or desktop workstations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {portals.map((p) => (
            <div
              key={p.role}
              onClick={() => navigate(p.path)}
              className={`group p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between ${p.accentColor}`}
            >
              <div>
                {/* Header Icon & Tag */}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 shadow-inner group-hover:scale-105 transition-transform">
                    {p.icon}
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                </div>

                <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white leading-tight">
                  {p.title}
                </h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {p.audience}
                </p>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed font-medium">
                  {p.description}
                </p>

                {/* Features Checkpoints */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {p.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-3">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(p.path);
                  }}
                  className={`w-full font-black text-xs sm:text-sm py-2.5 rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95 ${p.btnColor}`}
                >
                  <span>{p.cta}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-14 px-4 sm:px-6 bg-slate-100/60 dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-wider block mb-1">
              End-to-End Agri Logistics
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              How KrishiLink Powers Farm-to-Buyer Delivery
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                Stage 1 · Farm Gate
              </span>
              <h4 className="font-black text-base text-slate-900 dark:text-white">Harvest Declaration</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Farmers declare kilograms ready by 6:00 PM. Routes auto-cluster when meeting the 25 kg minimum payload.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                Stage 2 · Mini-Hub
              </span>
              <h4 className="font-black text-base text-slate-900 dark:text-white">Village Aggregation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Collection vehicles weigh, quality-grade, and aggregate produce at Kolar, Chikkaballapur, Doddaballapur & Hoskote hubs.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full inline-block">
                Stage 3 · Middle Mile
              </span>
              <h4 className="font-black text-base text-slate-900 dark:text-white">Central Hub & Transfers</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Produce moves to Bengaluru Central Hub (Yeshwanthpur) with lateral inter-hub stock balancing to avoid stockouts.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                Stage 4 · Bulk Delivery
              </span>
              <h4 className="font-black text-base text-slate-900 dark:text-white">Morning Kitchen Handover</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bulk buyers receive orders during selected morning slots (5:30–9:00 AM) with digital OTP handover & instant payouts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Demo Role Switcher Bar */}
      <div className="bg-white dark:bg-slate-900 py-3 px-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>Switch Dashboard View Directly:</span>
        </span>
        <RoleSwitcher />
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="KrishiLink" className="h-8 w-auto object-contain brightness-110" />
            <span>© 2026 KrishiLink Technologies · Bengaluru & Karnataka Agricultural Hubs</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/buyer')} className="hover:text-white font-bold">Buyer</button>
            <button onClick={() => navigate('/farmer')} className="hover:text-white font-bold">Farmer</button>
            <button onClick={() => navigate('/driver')} className="hover:text-white font-bold">Driver</button>
            <button onClick={() => navigate('/admin')} className="hover:text-white font-bold">Admin</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
