import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageSwitch } from '../components/common/LanguageSwitch';
import { RoleSwitcher } from '../routes/RoleSwitcher';
import { Button } from '../components/ui/button';
import {
  ShoppingBag,
  Sprout,
  Truck,
  Shield,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  MapPin,
  Clock,
  Warehouse,
  TrendingUp,
  Scale,
  Zap,
  Leaf,
  Check,
  Star,
  Users,
  Award,
  Layers,
  PhoneCall,
  Activity,
  ArrowLeftRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { APP_NAME, APP_TAGLINE } from '../lib/constants';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [activePortalTab, setActivePortalTab] = useState<'buyer' | 'farmer' | 'driver' | 'admin'>('buyer');

  const portals = [
    {
      role: 'buyer' as const,
      title: isKn ? 'ಸಗಟು ಖರೀದಿದಾರರ ಮಾರುಕಟ್ಟೆ' : 'Bulk Buyer Portal',
      audience: 'Restaurants · Caterers · Hostels · Supermarkets',
      badge: 'Responsive (Mobile & PC)',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      description:
        'Blinkit/Zepto-style bulk fresh produce purchasing with locked APMC-indexed prices, live vehicle map tracking, and 7 morning delivery slots.',
      features: [
        'Locked Mandi Price Ranges',
        'Live Delivery Truck GPS & ETA',
        '7 Flexible Morning Time Slots',
        'In-Place Delivery Address Switching',
      ],
      icon: <ShoppingBag className="h-6 w-6 text-emerald-600" />,
      path: '/buyer',
      cta: 'Enter Buyer Market',
      accentColor: 'border-emerald-500/40 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/20',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      kpi: '₹18-₹45/kg wholesale APMC lock',
    },
    {
      role: 'farmer' as const,
      title: isKn ? 'ರೈತರ ಮೊಬೈಲ್ ಸೇವೆ' : 'Smallholder Farmer Portal',
      audience: 'Village Farmers (Kolar · Chikkaballapur · Hoskote)',
      badge: 'Strictly Mobile First',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      description:
        'Kannada-first icon dashboard for smallholder farmers. Declare harvest quantity in kilograms, select custom ready times, and track mini-hub pickup trucks.',
      features: [
        'Kannada-First Big Icon Touch UI',
        'Custom Harvest Ready Times',
        'Direct Pickup Window Arrival Alerts',
        'Instant UPI / Bank Account Payouts',
      ],
      icon: <Sprout className="h-6 w-6 text-amber-600" />,
      path: '/farmer',
      cta: 'Open Farmer Portal (ಕೃಷಿ)',
      accentColor: 'border-amber-500/40 hover:border-amber-500 hover:ring-2 hover:ring-amber-500/20',
      btnColor: 'bg-emerald-700 hover:bg-emerald-800 text-white',
      kpi: '25 kg minimum payload aggregation',
    },
    {
      role: 'driver' as const,
      title: isKn ? 'ಚಾಲಕರ ಫ್ಲೀಟ್ ಕನ್ಸೋಲ್' : 'Driver Fleet Console',
      audience: 'First-Mile & Middle-Mile Logistics Pilots',
      badge: 'Strictly Mobile First',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      description:
        'High-contrast sunlight-friendly console for drivers. Full GPS route map, stop-by-stop farmer pickups with digital weight receipts, and buyer OTP handover.',
      features: [
        'Full GPS Turn-by-Turn Route Map',
        'Digital Weighing Scale Receipt Generator',
        'Explicit Stop Locations & Contact Calls',
        'Offline Queue & Instant Auto-Sync',
      ],
      icon: <Truck className="h-6 w-6 text-blue-600" />,
      path: '/driver',
      cta: 'Launch Driver Console',
      accentColor: 'border-blue-500/40 hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20',
      btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
      kpi: 'Zero-empty-miles CVRP route optimization',
    },
    {
      role: 'admin' as const,
      title: isKn ? 'ಆಪರೇಷನ್ಸ್ ಕಂಟ್ರೋಲ್ ಟವರ್' : 'Operations Control Tower',
      audience: 'Hub Managers · Fleet Dispatchers · Ops Admins',
      badge: 'Strictly PC Workstation (≥1024px)',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
      description:
        'Linear/Stripe-style desktop control tower. Live Karnataka hub telemetry, 3-state stock matrix, inter-hub lateral stock transfers, and ML pricing publish.',
      features: [
        'Live Hub & Fleet Telemetry Map',
        '3-State Lateral Inter-Hub Stock Transfers',
        'CVRP Fleet Dispatch Engine',
        'Audit Log & ML Price Publish Control',
      ],
      icon: <Shield className="h-6 w-6 text-purple-600" />,
      path: '/admin',
      cta: 'Open Admin Control Tower',
      accentColor: 'border-purple-500/40 hover:border-purple-500 hover:ring-2 hover:ring-purple-500/20',
      btnColor: 'bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900',
      kpi: '9 Karnataka hubs live synchronization',
    },
  ];

  const hubs = [
    { name: 'Kolar Village Mini-Hub', type: 'Village Aggregator', lat: '13.1360', lng: '78.1290', status: 'SUFFICIENT' },
    { name: 'Chikkaballapur Mini-Hub', type: 'Village Aggregator', lat: '13.4355', lng: '77.7315', status: 'SUFFICIENT' },
    { name: 'Doddaballapur Mini-Hub', type: 'Village Aggregator', lat: '13.2257', lng: '77.5750', status: 'LOW' },
    { name: 'Hoskote Mini-Hub', type: 'Village Aggregator', lat: '13.0707', lng: '77.7982', status: 'SUFFICIENT' },
    { name: 'Bengaluru Central Ops Hub (Yeshwanthpur)', type: 'Main Sorting Hub', lat: '13.0285', lng: '77.5400', status: 'SUFFICIENT' },
    { name: 'Whitefield City Micro-Hub', type: 'City Last-Mile', lat: '12.9698', lng: '77.7500', status: 'LOW' },
    { name: 'HSR Layout City Micro-Hub', type: 'City Last-Mile', lat: '12.9116', lng: '77.6389', status: 'SUFFICIENT' },
    { name: 'Jayanagar City Micro-Hub', type: 'City Last-Mile', lat: '12.9308', lng: '77.5838', status: 'OUT' },
    { name: 'Malleshwaram City Hub', type: 'City Last-Mile', lat: '13.0035', lng: '77.5647', status: 'SUFFICIENT' },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white font-sans">
      {/* =========================================================================
          HERO SECTION (Using Uploaded Image 2 as Background)
          ========================================================================= */}
      <section className="relative w-full min-h-[96vh] sm:min-h-screen flex flex-col justify-between overflow-hidden bg-slate-950">
        {/* Background Image: Uploaded Image 2 (Farm with Solar Cart, Farmers, Vegetable Crates & Truck) */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-bg.jpg"
            alt="KrishiLink Farm & Hub Operations"
            className="w-full h-full object-cover object-center filter brightness-[0.68] contrast-[1.12] saturate-[1.15]"
          />
          {/* Subtle cinematic gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/35 to-black/85 pointer-events-none" />
        </div>

        {/* TOP FLOATING PILL NAVBAR (Matching Image 2 Reference) */}
        <div className="relative z-20 w-full px-4 sm:px-6 pt-5">
          <header className="max-w-4xl mx-auto rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-2.5 shadow-2xl border border-white/20 flex items-center justify-between gap-3">
            {/* Left: Brand Logo with Image 1 */}
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <img
                src="/logo.png"
                alt="KrishiLink Logo"
                className="h-8 sm:h-9 w-auto object-contain shrink-0 drop-shadow-sm"
              />
              <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white hidden sm:inline">
                KrishiLink
              </span>
            </div>

            {/* Center Navigation Links */}
            <nav className="hidden md:flex items-center gap-5 text-xs font-extrabold text-slate-600 dark:text-slate-300">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-emerald-700 dark:text-emerald-400 font-black hover:text-emerald-800 transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('solutions')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Solutions
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('network')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Hub Network
              </button>
            </nav>

            {/* Right: Language Switcher & Get Started CTA */}
            <div className="flex items-center gap-2">
              <LanguageSwitch />
              <button
                onClick={() => navigate('/auth/login')}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 sm:px-5 py-2 flex items-center gap-1.5 shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <span>Get Started</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>
        </div>

        {/* CENTER HERO CONTENT */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 my-auto text-center py-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-wider mb-5 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Karnataka Farm-to-Buyer Fresh Agri-Logistics</span>
          </div>

          {/* Main Title (Headline from Image 2 reference) */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.12] drop-shadow-xl">
            Cultivating Tomorrow
            <br />
            with Precision Agri-Tech
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-base md:text-lg text-slate-100 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-md">
            Data-driven farming powered by AI insights and bioengineering to grow more, with less.
            Connecting smallholder vegetable farmers in Kolar & Chikkaballapur directly to Bengaluru bulk buyers.
          </p>

          {/* Center Pill Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
            <button
              onClick={() => scrollToSection('solutions')}
              className="px-6 sm:px-7 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              <span>Explore Our Solutions</span>
              <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </button>

            <button
              onClick={() => scrollToSection('how-it-works')}
              className="px-6 sm:px-7 py-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white font-bold text-xs sm:text-sm border border-white/30 flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <span>Learn More</span>
            </button>
          </div>
        </div>

        {/* BOTTOM FLOATING OVERLAYS (Avatars on Left, Feature Pills on Right) */}
        <div className="relative z-10 w-full px-4 sm:px-8 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Bottom Left Pill */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/55 backdrop-blur-md border border-white/20 text-white shadow-xl">
            <div className="flex -space-x-2 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
                alt="Farmer Partner"
                className="h-7 w-7 rounded-full border-2 border-white object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80"
                alt="Buyer Client"
                className="h-7 w-7 rounded-full border-2 border-white object-cover"
              />
            </div>
            <div className="leading-tight text-left">
              <span className="text-white text-xs font-extrabold block">
                Already helped over 10K+ clients
              </span>
              <span className="text-[10px] text-slate-300 font-medium">
                Karnataka Smallholders & Bengaluru Kitchens
              </span>
            </div>
          </div>

          {/* Bottom Right Pills: Efficiency, Sustainability, Growth */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-center">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg">
              <span className="h-4 w-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                ✓
              </span>
              <span>Efficiency</span>
            </div>

            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg">
              <span className="h-4 w-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                ✓
              </span>
              <span>Sustainability</span>
            </div>

            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg">
              <span className="h-4 w-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                ✓
              </span>
              <span>Growth</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ANIMATED STATS & TRUST RIBBON
          ========================================================================= */}
      <section className="py-8 bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 border-r border-slate-800 last:border-none">
            <span className="text-2xl sm:text-4xl font-black text-emerald-400 block tracking-tight">9 Hubs</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Karnataka Hub Network</span>
          </div>
          <div className="text-center p-3 border-r border-slate-800 last:border-none">
            <span className="text-2xl sm:text-4xl font-black text-white block tracking-tight">100+</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Village Farmers Connected</span>
          </div>
          <div className="text-center p-3 border-r border-slate-800 last:border-none">
            <span className="text-2xl sm:text-4xl font-black text-white block tracking-tight">48 Orders</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Daily Bulk Dispatches</span>
          </div>
          <div className="text-center p-3">
            <span className="text-2xl sm:text-4xl font-black text-emerald-400 block tracking-tight">96.2%</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">On-Time Morning Delivery</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: ABOUT & COMPARISON (Why Precision Agri-Tech Matters)
          ========================================================================= */}
      <section id="about" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">
            The Logistics Revolution
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Transforming Karnataka's Fresh Food Supply Chain
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Traditional mandi routes lose 30–35% of harvested vegetables to spoilage, multiple middlemen commissions, and uncoordinated travel. KrishiLink replaces this with digital aggregation, smart routing, and direct wholesale delivery.
          </p>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Traditional Way */}
          <div className="p-8 rounded-3xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/50 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/60">
                Traditional Mandi Channel
              </span>
              <span className="text-xl">⚠️</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Fragile, Multi-Intermediary Flow</h3>
            <div className="space-y-3.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span><strong>5–7 Middlemen Layers</strong>: Commission agents, loaders, brokers, sub-wholesalers, retailers.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span><strong>30–35% Post-Harvest Waste</strong>: Produce stays in non-refrigerated sacks for up to 48 hours.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span><strong>Delayed Physical Cash</strong>: Farmers wait weeks for final mandi commission slips and payouts.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span><strong>Unpredictable Prices</strong>: High volatile markups for restaurants, rock-bottom rates for growers.</span>
              </div>
            </div>
          </div>

          {/* KrishiLink Precision Way */}
          <div className="p-8 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-500 shadow-xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider px-4 py-1 rounded-bl-2xl">
              KrishiLink Modern Way
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60">
                Direct Farm-to-Buyer Tech
              </span>
              <span className="text-xl">🌱</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Automated Hub & Route Telemetry</h3>
            <div className="space-y-3.5 text-xs font-medium text-slate-700 dark:text-slate-200">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Zero-Intermediary Aggregation</strong>: Electric & diesel fleets collect directly from village mini-hubs.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Under 2% Spoilage</strong>: Temperature-buffered morning transit from Kolar/Chikkaballapur to city.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Same-Day Cashless Settlements</strong>: Direct UPI and bank transfers triggered on delivery OTP scan.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Locked Mandi APMC Index</strong>: Transparent daily price bands locked upon order confirmation.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: SOLUTIONS (Interactive 4-Role Dashboard Switcher)
          ========================================================================= */}
      <section id="solutions" className="py-20 px-4 sm:px-6 bg-white dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Tailored Interfaces</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Four Unified Dashboards in One System
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
              Engineered specifically for each user's context: lightweight mobile-first for rural farmers & drivers, comprehensive workstation view for operations managers.
            </p>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {portals.map((p) => (
              <div
                key={p.role}
                onClick={() => navigate(p.path)}
                className={`group p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all cursor-pointer flex flex-col justify-between ${p.accentColor}`}
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm group-hover:scale-105 transition-transform">
                      {p.icon}
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                  </div>

                  <h3 className="font-black text-xl text-slate-900 dark:text-white leading-tight">
                    {p.title}
                  </h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                    {p.audience}
                  </p>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed font-medium">
                    {p.description}
                  </p>

                  {/* Highlights */}
                  <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-800 space-y-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {p.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer KPI & Button */}
                <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] font-mono font-bold text-slate-400 block mb-2 truncate">
                    {p.kpi}
                  </span>
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
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: KARNATAKA HUB NETWORK & 3-STATE LATERAL TRANSFERS
          ========================================================================= */}
      <section id="network" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">
            Inter-Hub Grid
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Karnataka's 9-Hub Logistics Grid
          </h2>
          <p className="mt-3 text-sm text-slate-500 max-w-2xl mx-auto">
            Our multi-tier network connects village mini-hubs to the central sorting terminal and city micro-hubs with real-time 3-state stock balancing (<strong className="text-emerald-600">SUFFICIENT</strong>, <strong className="text-amber-500">LOW</strong>, <strong className="text-red-500">OUT</strong>).
          </p>
        </div>

        {/* Hubs Grid Showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hubs.map((h, idx) => (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-emerald-600" />
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">{h.name}</span>
                </div>
                <p className="text-[11px] font-bold text-slate-400">{h.type}</p>
                <span className="text-[10px] font-mono text-slate-400">GPS: {h.lat}, {h.lng}</span>
              </div>

              <div className="text-right">
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider ${
                    h.status === 'SUFFICIENT'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : h.status === 'LOW'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                  }`}
                >
                  {h.status}
                </span>
                <span className="block text-[9px] text-slate-400 font-semibold mt-1">Live Telemetry ✓</span>
              </div>
            </div>
          ))}
        </div>

        {/* 3-State Stock Transfer Callout */}
        <div className="mt-8 p-6 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shrink-0">
              <ArrowLeftRight className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-black text-base">Lateral Stock Rebalancing in Action</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                When a city hub hits <span className="text-red-400 font-bold">OUT</span> or <span className="text-amber-400 font-bold">LOW</span>, the admin tower triggers lateral inter-hub transfers from donor hubs with <span className="text-emerald-400 font-bold">SUFFICIENT</span> inventory.
              </p>
            </div>
          </div>

          <Button
            onClick={() => navigate('/admin/transfers')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shrink-0"
          >
            <span>View Transfer Matrix</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: HOW IT WORKS PIPELINE
          ========================================================================= */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-slate-100/70 dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest block mb-2">
              End-to-End Execution
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              How KrishiLink Operates Daily
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
              From farmer declaration in village fields to early morning chef handovers in Bengaluru city.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative group hover:shadow-xl transition-all">
              <span className="absolute -top-3.5 left-6 bg-emerald-600 text-white font-black text-xs px-3 py-0.5 rounded-full shadow-md">
                STEP 01
              </span>
              <div className="mt-3 space-y-2">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">6:00 PM Daily</span>
                <h4 className="font-black text-lg text-slate-900 dark:text-white">Harvest Declaration</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Smallholder farmers use the Kannada mobile app to enter vegetable quantity in kg and specify custom ready times.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative group hover:shadow-xl transition-all">
              <span className="absolute -top-3.5 left-6 bg-blue-600 text-white font-black text-xs px-3 py-0.5 rounded-full shadow-md">
                STEP 02
              </span>
              <div className="mt-3 space-y-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">7:00 PM – 10:00 PM</span>
                <h4 className="font-black text-lg text-slate-900 dark:text-white">Village Mini-Hub Weighing</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Solar & electric collection vans visit farm gates, weigh crates digitally, generate receipts, and aggregate at the mini-hub.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative group hover:shadow-xl transition-all">
              <span className="absolute -top-3.5 left-6 bg-purple-600 text-white font-black text-xs px-3 py-0.5 rounded-full shadow-md">
                STEP 03
              </span>
              <div className="mt-3 space-y-2">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block">11:00 PM – 4:00 AM</span>
                <h4 className="font-black text-lg text-slate-900 dark:text-white">Middle-Mile Sorting</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Heavy trucks transfer aggregated produce to Yeshwanthpur Central Hub. Lateral balancing requests eliminate stockouts.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative group hover:shadow-xl transition-all">
              <span className="absolute -top-3.5 left-6 bg-amber-600 text-white font-black text-xs px-3 py-0.5 rounded-full shadow-md">
                STEP 04
              </span>
              <div className="mt-3 space-y-2">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">5:30 AM – 9:00 AM</span>
                <h4 className="font-black text-lg text-slate-900 dark:text-white">Kitchen Handover & UPI</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Restaurants receive fresh vegetables during their chosen slot. Driver scans OTP; payouts settle instantly to farmers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: VERIFIED TESTIMONIALS
          ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">
            Real Impact
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Loved by Farmers, Drivers & Kitchens
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic font-medium">
              "Before KrishiLink, 30% of my tomato harvest spoiled on the way to market or had arbitrary deductions. Now the pickup vehicle arrives at my farm gate at 7:30 PM with digital weight slips."
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-lg">👨‍🌾</div>
              <div>
                <p className="font-black text-xs text-slate-900 dark:text-white">Ramesh Gowda</p>
                <p className="text-[10px] text-slate-400">Smallholder Farmer · Vemgal, Kolar</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic font-medium">
              "Locked morning prices and guaranteed delivery before 8:00 AM saves us 15% on daily procurements. Having live truck tracking and in-place address change makes catering events seamless."
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-lg">👨‍🍳</div>
              <div>
                <p className="font-black text-xs text-slate-900 dark:text-white">Chef Kiran Kumar</p>
                <p className="text-[10px] text-slate-400">Managing Partner · Udupi Upahar Chain</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic font-medium">
              "The driver app gives me clear farmer pickup coordinates and lets me generate weight receipts offline in rural areas. When I return to the hub, everything syncs instantly."
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-lg">🚚</div>
              <div>
                <p className="font-black text-xs text-slate-900 dark:text-white">Suresh Kumar</p>
                <p className="text-[10px] text-slate-400">First-Mile Logistics Pilot · Chikkaballapur</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: CTA BANNER
          ========================================================================= */}
      <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-2xl text-center md:text-left">
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
              Ready to modernise your fresh produce logistics?
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed">
              Sign up today with your phone number and start trading with locked APMC prices and guaranteed morning dispatches.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              size="xl"
              onClick={() => navigate('/auth/login?mode=register')}
              className="bg-white hover:bg-slate-100 text-emerald-900 font-black text-sm px-6 py-3 rounded-2xl shadow-lg"
            >
              <span>Create Account</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              size="xl"
              variant="outline"
              onClick={() => navigate('/auth/login?mode=login')}
              className="border-white/40 text-white hover:bg-white/10 font-bold text-sm px-6 py-3 rounded-2xl"
            >
              <span>Sign In</span>
            </Button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FLOATING DEMO SWITCHER BAR
          ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 py-3.5 px-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>Switch Dashboard View Directly:</span>
        </span>
        <RoleSwitcher />
      </div>

      {/* =========================================================================
          FOOTER
          ========================================================================= */}
      <footer id="footer" className="bg-slate-950 text-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8 text-xs text-slate-400">
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="KrishiLink" className="h-9 w-auto object-contain" />
              <span className="font-black text-lg text-white">KrishiLink</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bengaluru & Karnataka Farm-to-Buyer Fresh Logistics Network. Empowering smallholder farmers with village mini-hub aggregation and restaurants with guaranteed morning wholesale delivery.
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              APMC Yeshwanthpur · Kolar · Chikkaballapur · Doddaballapur · Hoskote
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="space-y-2">
              <p className="font-bold text-white uppercase text-[11px] tracking-wider">Portals</p>
              <ul className="space-y-1.5 font-medium">
                <li><button onClick={() => navigate('/buyer')} className="hover:text-emerald-400">Buyer Marketplace</button></li>
                <li><button onClick={() => navigate('/farmer')} className="hover:text-emerald-400">Farmer Mobile App</button></li>
                <li><button onClick={() => navigate('/driver')} className="hover:text-emerald-400">Driver Console</button></li>
                <li><button onClick={() => navigate('/admin')} className="hover:text-emerald-400">Control Tower</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-white uppercase text-[11px] tracking-wider">Karnataka Hubs</p>
              <ul className="space-y-1.5 font-medium">
                <li><span>Kolar Village Mini-Hub</span></li>
                <li><span>Chikkaballapur Mini-Hub</span></li>
                <li><span>Yeshwanthpur Central Hub</span></li>
                <li><span>HSR & Whitefield Hubs</span></li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-white uppercase text-[11px] tracking-wider">Account</p>
              <ul className="space-y-1.5 font-medium">
                <li><button onClick={() => navigate('/auth/login?mode=login')} className="hover:text-white">Sign In</button></li>
                <li><button onClick={() => navigate('/auth/login?mode=register')} className="hover:text-white">Create Account</button></li>
                <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white">Back to Top ↑</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <span>© 2026 KrishiLink Technologies Pvt. Ltd. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span className="text-emerald-500 font-bold">100% Cashless Payouts</span>
            <span>·</span>
            <span>Karnataka APMC Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
