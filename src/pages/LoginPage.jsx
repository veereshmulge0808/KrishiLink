import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sprout, 
  Truck, 
  ShoppingBag, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function LoginPage() {
  const { login, register, loading } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [selectedRole, setSelectedRole] = useState('FARMER'); // 'FARMER', 'LOGISTICS', 'BUYER'
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState('');

  // Form Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [zone, setZone] = useState('Hoskote');
  const [address, setAddress] = useState('');

  const roles = [
    {
      id: 'FARMER',
      title: 'Farmer',
      subtitle: 'Farm-Gate Producer',
      desc: 'Declare harvests, get ML yield calibrations & fair wholesale market bounds.',
      icon: Sprout,
      color: 'emerald',
      demoEmail: 'farmer@agriflow.io',
      demoPass: 'farmer123',
      defaultZone: 'Hoskote',
      borderActive: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
      tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'LOGISTICS',
      title: 'Logistics Provider',
      subtitle: 'Commercial Carrier',
      desc: 'Accept transport jobs, optimize 1,000kg fleet routes & manage milestones.',
      icon: Truck,
      color: 'blue',
      demoEmail: 'logistics@agriflow.io',
      demoPass: 'logistics123',
      defaultZone: 'Bengaluru North',
      borderActive: 'border-blue-500 bg-blue-950/40 text-blue-300',
      tagColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    {
      id: 'BUYER',
      title: 'Wholesale Buyer',
      subtitle: 'HoReCa & Retail Aggregator',
      desc: 'Procure bulk farm-fresh produce with dynamic freight and live tracking.',
      icon: ShoppingBag,
      color: 'amber',
      demoEmail: 'buyer@agriflow.io',
      demoPass: 'buyer123',
      defaultZone: 'Bengaluru South',
      borderActive: 'border-amber-500 bg-amber-950/40 text-amber-300',
      tagColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    }
  ];

  const currentRoleConfig = roles.find(r => r.id === selectedRole) || roles[0];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setError('');
    const targetRole = roles.find(r => r.id === roleId);
    if (targetRole) {
      setZone(targetRole.defaultZone);
    }
  };

  const handleDemoAutofill = (roleId) => {
    handleRoleSelect(roleId);
    setAuthMode('login');
    const target = roles.find(r => r.id === roleId);
    if (target) {
      setEmail(target.demoEmail);
      setPassword(target.demoPass);
      setSuccessInfo(`Loaded demo credentials for ${target.title}. Click "Sign In" below.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessInfo('');

    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }

    try {
      if (authMode === 'login') {
        // Authenticate existing credentials against database
        await login(email, password);
      } else {
        // Register new account and store permanently in database
        if (!name || !phone) {
          setError('Please provide your name and phone number.');
          return;
        }
        await register({
          email,
          password,
          role: selectedRole,
          name,
          phone,
          zone,
          address: address || `${zone} Agricultural Zone, Bengaluru`
        });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-15%] left-[20%] w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[20%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-4xl space-y-8 relative z-10">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Role-Based Agricultural Logistics & Market Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
            Sign In to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400">AgriFlow</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Choose your authorized stakeholder role to access your dedicated operational workspace.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleSelect(r.id)}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 relative group flex flex-col justify-between ${
                  isSelected
                    ? `${r.borderActive} shadow-xl scale-[1.02]`
                    : 'glass-panel border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? (r.id === 'FARMER' ? 'bg-emerald-600 text-white' : (r.id === 'LOGISTICS' ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'))
                        : 'bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-white'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-base text-white">{r.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{r.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className={`px-2 py-0.5 rounded font-semibold border ${r.tagColor}`}>
                    {r.subtitle}
                  </span>
                  <span className="text-slate-500 group-hover:text-slate-300 font-medium">Select →</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Auth Form Box */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 mb-6 max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setError(''); setSuccessInfo(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                authMode === 'login'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setError(''); setSuccessInfo(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                authMode === 'register'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Role Summary Banner */}
          <div className="mb-6 p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Target Workspace:</span>
              <span className={`font-bold px-2 py-0.5 rounded border ${currentRoleConfig.tagColor}`}>
                {currentRoleConfig.title} Interface
              </span>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Strict RBAC: Confined to {currentRoleConfig.title} tools
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successInfo && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successInfo}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Additional Fields for Registration */}
            {authMode === 'register' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Full Name / Farm / Firm Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={selectedRole === 'FARMER' ? 'Rajesh Gowda' : (selectedRole === 'LOGISTICS' ? 'VRL Transports' : 'Fresh Mart B2B')}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91-9845011100"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Operating Zone (Bengaluru Region)
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <select
                        value={zone}
                        onChange={(e) => setZone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Hoskote">Hoskote (East Agri Zone)</option>
                        <option value="Nelamangala">Nelamangala (North-West)</option>
                        <option value="Bengaluru North">Bengaluru North (Yeshwanthpur APMC)</option>
                        <option value="Bengaluru South">Bengaluru South (K.R. Market Wholesale)</option>
                        <option value="Bengaluru East">Bengaluru East (Whitefield Belt)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Farm / Fleet / Facility Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={selectedRole === 'FARMER' ? 'Survey 42, Malur Road, Hoskote' : 'Yard Gate 3, APMC Depot'}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Email & Password (Common to both Login and Register) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@agriflow.io"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-9 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-sm transition shadow-lg shadow-emerald-950/60 flex items-center justify-center space-x-2 mt-4"
            >
              {loading ? (
                <span>Processing Authentication...</span>
              ) : (
                <>
                  <span>{authMode === 'login' ? `Sign In as ${currentRoleConfig.title}` : `Create & Store ${currentRoleConfig.title} Account`}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Autofill Section for Testing */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-400 flex items-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mr-1.5" />
                Pre-Configured Demo Accounts (1-Click Fill):
              </span>
              <span className="text-[11px] text-slate-500">Instant credential population</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoAutofill('FARMER')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-700/50 text-left transition flex items-center space-x-2.5 group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Sprout className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-semibold text-white block truncate">Farmer Demo</span>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">farmer@agriflow.io</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoAutofill('LOGISTICS')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-blue-950/50 border border-slate-800 hover:border-blue-700/50 text-left transition flex items-center space-x-2.5 group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-950 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-semibold text-white block truncate">Logistics Demo</span>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">logistics@agriflow.io</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoAutofill('BUYER')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-amber-950/50 border border-slate-800 hover:border-amber-700/50 text-left transition flex items-center space-x-2.5 group"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-950 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-semibold text-white block truncate">Buyer Demo</span>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">buyer@agriflow.io</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
