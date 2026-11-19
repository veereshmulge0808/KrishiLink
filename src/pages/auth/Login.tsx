import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore, DEMO_USERS } from '../../stores/authStore';
import { mockDb } from '../../lib/api/mock/db';
import { PhoneInput } from '../../components/forms/PhoneInput';
import { Button } from '../../components/ui/button';
import { RoleSwitcher } from '../../routes/RoleSwitcher';
import { APP_NAME, APP_TAGLINE, APP_NAME_KN } from '../../lib/constants';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  User,
  Truck,
  Shield,
  CheckCircle2,
  Building,
  MapPin,
  Sprout,
  FileText,
  BadgeCheck,
  Warehouse,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitch } from '../../components/common/LanguageSwitch';
import { Logo } from '../../components/common/Logo';
import { Role, User as UserType } from '../../types';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const initialRole = (searchParams.get('role') as Role) || 'buyer';

  const { loginWithPhone, setUser, setRole } = useAuthStore();
  const { i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  // Toggle between Sign In and Create Account
  const [authMode, setAuthMode] = useState<'login' | 'register'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole);

  // Sign In state
  const [phone, setPhone] = useState('9876543201');
  const [loading, setLoading] = useState(false);

  // Register Form States
  // Common
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  // Buyer specifics
  const [buyerType, setBusinessType] = useState('Restaurant & Catering');
  const [deliveryAddress, setDeliveryAddress] = useState('14th Main, HSR Layout, Bengaluru');
  const [cityHub, setCityHub] = useState('HSR Layout City Micro Hub');
  // Farmer specifics
  const [farmerNameKn, setFarmerNameKn] = useState('');
  const [village, setVillage] = useState('Vemgal');
  const [taluk, setTaluk] = useState('Kolar');
  const [villageHub, setVillageHub] = useState('Kolar Village Mini Hub');
  const [landAcres, setLandAcres] = useState(3.0);
  const [minThresholdKg, setMinThresholdKg] = useState(25);
  // Driver specifics
  const [vehicleModel, setVehicleModel] = useState('Tata Ace (Chota Hathi)');
  const [vehicleNumber, setVehicleNumber] = useState('KA-01-AB-1234');
  const [dlNumber, setDlNumber] = useState('KA01-2019-0098765');
  const [driverBaseHub, setDriverBaseHub] = useState('Kolar Village Mini Hub');
  // Admin specifics
  const [employeeId, setEmployeeId] = useState('KL-OPS-2026');
  const [adminStation, setAdminStation] = useState('Bengaluru Central Ops Hub (Yeshwanthpur)');

  const [registerSuccess, setRegisterSuccess] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setLoading(true);
    const reqId = await loginWithPhone(phone);
    setLoading(false);
    navigate(`/auth/verify?req=${reqId}&phone=${phone}`);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) return;

    const newUserId = `u_${selectedRole}_${Date.now()}`;
    const newUser: UserType = {
      id: newUserId,
      name: regName.trim(),
      phone: regPhone.trim().startsWith('+91') ? regPhone.trim() : `+91${regPhone.trim()}`,
      role: selectedRole,
      language: selectedRole === 'farmer' ? 'kn' : 'en',
    };

    mockDb.users.push(newUser);

    // Provisions for respective database entries
    if (selectedRole === 'farmer') {
      mockDb.farmers.push({
        id: `farmer_${Date.now()}`,
        user_id: newUserId,
        village: village.trim(),
        taluk: taluk.trim(),
        district: 'Kolar',
        address: `${village}, ${taluk}`,
        nearest_hub_id: 'hub_v_kolar',
        default_min_kg: minThresholdKg,
        reliability_score: 5.0,
        land_acres: landAcres,
      });
    }

    setUser(newUser);
    setRole(selectedRole);
    setRegisterSuccess(true);

    setTimeout(() => {
      const destination = {
        buyer: '/buyer',
        farmer: '/farmer',
        driver: '/driver',
        admin: '/admin',
        hub_staff: '/admin/hubs',
      }[selectedRole] || '/buyer';
      navigate(destination);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-4">
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          <Logo size="sm" showSubtitle={true} subtitle={isKn ? 'ಕರ್ನಾಟಕ ಕೃಷಿ ಲಾಜಿಸ್ಟಿಕ್ಸ್' : 'Karnataka Agri Logistics'} />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="hidden sm:inline-block text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300"
          >
            ← Back to Home
          </button>
          <LanguageSwitch />
        </div>
      </header>

      {/* Main Container - Responsive for both PC and Mobile */}
      <main className="max-w-6xl w-full mx-auto my-auto py-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Hero Pane (PC Only) */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-emerald-800 to-slate-900 text-white p-8 flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 z-10">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 inline-block">
                <img src="/logo.png" alt="KrishiLink" className="h-14 w-auto object-contain drop-shadow" />
              </div>

              <div>
                <span className="text-emerald-400 font-extrabold text-xs uppercase tracking-wider block mb-1">
                  Karnataka Farm-to-Buyer Network
                </span>
                <h2 className="text-2xl xl:text-3xl font-black leading-tight text-white">
                  Empowering smallholder farmers & fresh bulk buyers.
                </h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Direct village mini-hub aggregation, AI-driven vehicle dispatch, guaranteed morning delivery, and transparent mandi-benchmarked payouts.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Warehouse className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-100">9 Active Mini-Hubs</p>
                    <p className="text-[11px] text-slate-400">Kolar, Chikkaballapur, Doddaballapur & Bengaluru</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-100">Smart CVRP Dispatch</p>
                    <p className="text-[11px] text-slate-400">Real-time GPS routing with zero empty return runs</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-100">Guaranteed Fair Payouts</p>
                    <p className="text-[11px] text-slate-400">Next-day direct bank & UPI settlements for farmers</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="z-10 pt-8 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>Bengaluru Operations Hub</span>
              <span className="font-mono text-emerald-400 font-bold">v1.2 Live</span>
            </div>
          </div>

          {/* Right Form Pane (Mobile & PC) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            {registerSuccess && (
              <div className="mb-4 p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg animate-in slide-in-from-top">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>Account registered successfully! Redirecting to your dashboard...</span>
              </div>
            )}

            <div>
              {/* Sign In vs Create Account Toggle */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
                    authMode === 'login'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  {isKn ? 'ಲಾಗಿನ್ (Sign In)' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
                    authMode === 'register'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  {isKn ? 'ಖಾತೆ ರಚಿಸಿ (Create Account)' : 'Create Account'}
                </button>
              </div>

              {/* 1. SIGN IN MODE */}
              {authMode === 'login' ? (
                <div className="space-y-5">
                  <div className="text-center sm:text-left">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {isKn ? 'ಕೃಷಿಲಿಂಕ್‌ಗೆ ಮರಳಿ ಸ್ವಾಗತ' : 'Welcome back to KrishiLink'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {isKn
                        ? 'ನಿಮ್ಮ ನೋಂದಾಯಿತ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ ಲಾಗಿನ್ ಆಗಿ'
                        : 'Sign in to access your farm harvest, bulk orders, or fleet trips'}
                    </p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-2">
                        {isKn ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ' : 'Mobile Phone Number'}
                      </label>
                      <PhoneInput value={phone} onChange={setPhone} />
                      <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        <span>Mock OTP: <strong>123456</strong> is auto-verified in prototype</span>
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || phone.length < 10}
                      size="xl"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg flex items-center justify-center gap-2"
                    >
                      <span>{loading ? 'Sending OTP...' : isKn ? 'ಮುಂದುವರಿಯಿರಿ' : 'Get OTP & Sign In'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              ) : (
                /* 2. CREATE ACCOUNT MODE FOR ALL 4 ROLES */
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      Create Your Account
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Choose your role in Karnataka's farm-to-buyer logistics network:
                    </p>
                  </div>

                  {/* 4 Role Selector Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'buyer', label: 'Buyer', sub: 'Restaurant', icon: <ShoppingBag className="h-4 w-4" /> },
                      { id: 'farmer', label: 'Farmer', sub: 'ರೈತರು', icon: <Sprout className="h-4 w-4" /> },
                      { id: 'driver', label: 'Driver', sub: 'Fleet Pilot', icon: <Truck className="h-4 w-4" /> },
                      { id: 'admin', label: 'Admin', sub: 'Ops Tower', icon: <Shield className="h-4 w-4" /> },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRole(r.id as Role)}
                        className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                          selectedRole === r.id
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20 font-black shadow-sm'
                            : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold'
                        }`}
                      >
                        <div className="mb-1 text-primary">{r.icon}</div>
                        <span className="text-xs">{r.label}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{r.sub}</span>
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-3 pt-1 text-xs">
                    {/* Common Name & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          {selectedRole === 'buyer' ? 'Restaurant / Business Name *' : 'Full Name *'}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={
                            selectedRole === 'buyer'
                              ? 'e.g. Udupi Upahar'
                              : selectedRole === 'farmer'
                              ? 'e.g. Ramesh Gowda'
                              : selectedRole === 'driver'
                              ? 'e.g. Suresh Kumar'
                              : 'e.g. Anita Rao'
                          }
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-bold dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          Mobile Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="9876543201"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Role Specific Fields */}
                    {selectedRole === 'buyer' && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                              Business Type
                            </label>
                            <select
                              value={buyerType}
                              onChange={(e) => setBusinessType(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
                            >
                              <option value="Restaurant & Catering">Restaurant & Catering</option>
                              <option value="Cloud Kitchen Chain">Cloud Kitchen Chain</option>
                              <option value="Hostel / College Mess">Hostel / College Mess</option>
                              <option value="Supermarket / Retail">Supermarket / Retail</option>
                            </select>
                          </div>
                          <div>
                            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                              Nearest City Delivery Hub
                            </label>
                            <select
                              value={cityHub}
                              onChange={(e) => setCityHub(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
                            >
                              <option value="HSR Layout City Micro Hub">HSR Layout City Micro Hub</option>
                              <option value="Whitefield City Hub">Whitefield City Hub</option>
                              <option value="Jayanagar City Hub">Jayanagar City Hub</option>
                              <option value="Malleshwaram Hub">Malleshwaram Hub</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                            Delivery Address in Bengaluru
                          </label>
                          <input
                            type="text"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    {selectedRole === 'farmer' && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                              Village / Grama *
                            </label>
                            <input
                              type="text"
                              value={village}
                              onChange={(e) => setVillage(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                              Assigned Village Mini Hub
                            </label>
                            <select
                              value={villageHub}
                              onChange={(e) => setVillageHub(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
                            >
                              <option value="Kolar Village Mini Hub">Kolar Village Mini Hub</option>
                              <option value="Chikkaballapur Village Hub">Chikkaballapur Village Hub</option>
                              <option value="Doddaballapur Village Hub">Doddaballapur Village Hub</option>
                              <option value="Hoskote Village Mini Hub">Hoskote Village Mini Hub</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                              Landholding (Acres)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              value={landAcres}
                              onChange={(e) => setLandAcres(Number(e.target.value))}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                              Min Pickup Threshold (kg)
                            </label>
                            <input
                              type="number"
                              value={minThresholdKg}
                              onChange={(e) => setMinThresholdKg(Number(e.target.value))}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-bold dark:bg-slate-800"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedRole === 'driver' && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                              Vehicle Registration Number *
                            </label>
                            <input
                              type="text"
                              value={vehicleNumber}
                              onChange={(e) => setVehicleNumber(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-mono font-bold dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                              Vehicle Model
                            </label>
                            <input
                              type="text"
                              value={vehicleModel}
                              onChange={(e) => setVehicleModel(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                              Commercial Driving License No.
                            </label>
                            <input
                              type="text"
                              value={dlNumber}
                              onChange={(e) => setDlNumber(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-mono font-semibold dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                              Assigned Base Hub
                            </label>
                            <select
                              value={driverBaseHub}
                              onChange={(e) => setDriverBaseHub(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
                            >
                              <option value="Kolar Village Mini Hub">Kolar Village Mini Hub</option>
                              <option value="Bengaluru Main Hub">Bengaluru Central Hub</option>
                              <option value="Hoskote Mini Hub">Hoskote Village Hub</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedRole === 'admin' && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                              Employee ID *
                            </label>
                            <input
                              type="text"
                              value={employeeId}
                              onChange={(e) => setEmployeeId(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-mono font-bold dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                              Official Work Email
                            </label>
                            <input
                              type="email"
                              placeholder="admin@krishilink.in"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold dark:bg-slate-800"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                            Control Station
                          </label>
                          <input
                            type="text"
                            disabled
                            value={adminStation}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 font-semibold bg-slate-100 dark:bg-slate-800/60 text-slate-500"
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={!regName.trim() || !regPhone.trim()}
                      size="xl"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg flex items-center justify-center gap-2 mt-2"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Create {selectedRole.toUpperCase()} Account</span>
                    </Button>
                  </form>
                </div>
              )}
            </div>

            {/* Instant Demo Switcher at Bottom */}
            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Instant Prototype Demo Switcher</span>
              </p>
              <div className="flex justify-center">
                <RoleSwitcher />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center pt-4 text-xs text-slate-400">
        KrishiLink Prototype · Bengaluru & Karnataka Agri Logistics Network
      </footer>
    </div>
  );
};
