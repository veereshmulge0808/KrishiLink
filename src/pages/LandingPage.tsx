import React from 'react';
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* =========================================================================
          HERO SECTION (Matching Image 2: Aerial Tractor Precision Agri-Tech)
          ========================================================================= */}
      <section className="relative w-full min-h-[95vh] sm:min-h-screen flex flex-col justify-between overflow-hidden bg-slate-950">
        {/* Background Tractor Spraying Crops Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=2400&q=85"
            alt="Cultivating Tomorrow with Precision Agri-Tech"
            className="w-full h-full object-cover object-center scale-105 filter brightness-[0.78] contrast-[1.08] saturate-[1.12]"
          />
          {/* Subtle cinematic gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/80" />
        </div>

        {/* TOP FLOATING PILL NAVBAR (Same like Image 2) */}
        <div className="relative z-20 w-full px-4 sm:px-6 pt-5">
          <header className="max-w-4xl mx-auto rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-2.5 shadow-2xl border border-white/20 flex items-center justify-between gap-3">
            {/* Left: Brand Logo & Leaf Tag */}
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-md">
                <Sprout className="h-4 w-4" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  KrishiLink
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest hidden sm:inline">
                  AGRI-TECH
                </span>
              </div>
            </div>

            {/* Middle Nav Links */}
            <nav className="hidden md:flex items-center gap-5 text-xs font-extrabold text-slate-600 dark:text-slate-300">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-emerald-700 dark:text-emerald-400 font-black hover:text-emerald-800 transition-colors"
              >
                Home
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
                About
              </button>
              <button
                onClick={() => scrollToSection('network')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Hub Network
              </button>
              <button
                onClick={() => scrollToSection('footer')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Contact Us
              </button>
            </nav>

            {/* Right: Language Toggle & Get Started Pill Button */}
            <div className="flex items-center gap-2">
              <LanguageSwitch />
              <button
                onClick={() => navigate('/auth/login')}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                <span>Get Started</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>
        </div>

        {/* CENTER HERO CONTENT (Exact wording & typography from Image 2) */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 my-auto text-center py-12">
          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.12] drop-shadow-lg">
            Cultivating Tomorrow
            <br />
            with Precision Agri-Tech
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-base md:text-lg text-slate-100 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-md">
            Data-driven farming powered by AI insights and bioengineering to grow more, with less.
          </p>

          {/* Center Pill Buttons (Image 2) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
            {/* Primary Green Button */}
            <button
              onClick={() => scrollToSection('solutions')}
              className="px-6 sm:px-7 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              <span>Explore Our Solutions</span>
              <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </button>

            {/* Translucent Frosted Glass Button */}
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="px-6 sm:px-7 py-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white font-bold text-xs sm:text-sm border border-white/30 flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <span>Learn More</span>
            </button>
          </div>
        </div>

        {/* BOTTOM FLOATING OVERLAYS (Exact like Image 2: Avatars on Left, Feature Pills on Right) */}
        <div className="relative z-10 w-full px-4 sm:px-8 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Bottom Left: Already helped over 10K+ clients pill */}
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
            <div className="leading-tight">
              <span className="text-white text-xs font-extrabold block">
                Already helped over 10K+ clients
              </span>
              <span className="text-[10px] text-slate-300 font-medium">
                Karnataka Smallholders & Bengaluru Kitchens
              </span>
            </div>
          </div>

          {/* Bottom Right: Feature Pills (Efficiency, Sustainability, Growth) */}
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
          OPERATIONAL METRICS STRIP
          ========================================================================= */}
      <section id="network" className="py-8 bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">9 Hubs</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Karnataka Hub Network</span>
          </div>
          <div className="text-center p-3">
            <span className="text-2xl sm:text-3xl font-black text-white block">100+</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Village Farmers Connected</span>
          </div>
          <div className="text-center p-3">
            <span className="text-2xl sm:text-3xl font-black text-white block">48 Orders</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Daily Bulk Dispatches</span>
          </div>
          <div className="text-center p-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">96.2%</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">On-Time Morning Delivery</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4 ROLE PORTALS SECTION (Solutions)
          ========================================================================= */}
      <section id="solutions" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Dedicated Workspaces</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Four Role-Based Portals in One Unified Platform
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            Choose your tailored dashboard: mobile-first for field pilots & farmers, desktop workstation for central ops administration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {portals.map((p) => (
            <div
              key={p.role}
              onClick={() => navigate(p.path)}
              className={`group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all cursor-pointer flex flex-col justify-between ${p.accentColor}`}
            >
              <div>
                {/* Header Icon & Tag */}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 shadow-inner group-hover:scale-105 transition-transform">
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

      {/* =========================================================================
          HOW IT WORKS PIPELINE
          ========================================================================= */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-wider block mb-1">
              End-to-End Agri Logistics
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              How KrishiLink Powers Farm-to-Buyer Delivery
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full inline-block">
                Stage 1 · Farm Gate
              </span>
              <h4 className="font-black text-base text-slate-900 dark:text-white">Harvest Declaration</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Farmers declare kilograms ready by 6:00 PM. Routes auto-cluster when meeting the 25 kg minimum payload.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-full inline-block">
                Stage 2 · Mini-Hub
              </span>
              <h4 className="font-black text-base text-slate-900 dark:text-white">Village Aggregation</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Collection vehicles weigh, quality-grade, and aggregate produce at Kolar, Chikkaballapur, Doddaballapur & Hoskote hubs.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-black text-purple-600 bg-purple-50 dark:bg-purple-950 px-2.5 py-0.5 rounded-full inline-block">
                Stage 3 · Middle Mile
              </span>
              <h4 className="font-black text-base text-slate-900 dark:text-white">Central Hub & Transfers</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Produce moves to Bengaluru Central Hub (Yeshwanthpur) with lateral inter-hub stock balancing to avoid stockouts.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full inline-block">
                Stage 4 · Bulk Delivery
              </span>
              <h4 className="font-black text-base text-slate-900 dark:text-white">Morning Kitchen Handover</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Bulk buyers receive orders during selected morning slots (5:30–9:00 AM) with digital OTP handover & instant payouts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Demo Role Switcher Bar */}
      <div className="bg-white dark:bg-slate-900 py-3.5 px-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>Switch Dashboard View Directly:</span>
        </span>
        <RoleSwitcher />
      </div>

      {/* Footer */}
      <footer id="footer" className="bg-slate-950 text-white py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black">
              <Sprout className="h-4 w-4" />
            </div>
            <div>
              <p className="font-black text-white text-sm">KrishiLink Technologies</p>
              <p className="text-[11px] text-slate-500">Karnataka Farm-to-Buyer Agri Logistics Network</p>
            </div>
          </div>

          <div className="flex items-center gap-5 font-bold">
            <button onClick={() => navigate('/buyer')} className="hover:text-emerald-400 transition-colors">Buyer Portal</button>
            <button onClick={() => navigate('/farmer')} className="hover:text-emerald-400 transition-colors">Farmer Portal</button>
            <button onClick={() => navigate('/driver')} className="hover:text-emerald-400 transition-colors">Driver Console</button>
            <button onClick={() => navigate('/admin')} className="hover:text-emerald-400 transition-colors">Operations Tower</button>
            <button onClick={() => navigate('/auth/login')} className="hover:text-white underline">Sign In</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
