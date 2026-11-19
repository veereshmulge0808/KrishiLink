import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sprout, 
  Truck, 
  ShoppingBag, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  MapPin, 
  Layers,
  Lock,
  Mail,
  User,
  Phone
} from 'lucide-react';

export default function LandingPage() {
  const { login, demoLogin, register, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [selectedRole, setSelectedRole] = useState('FARMER');
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [zone, setZone] = useState('Hoskote');
  const [address, setAddress] = useState('');

  const handleDemoClick = async (role) => {
    setError('');
    try {
      await demoLogin(role);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await register({
          email,
          password,
          role: selectedRole,
          name,
          phone,
          zone,
          address: address || `${zone} Market Zone, Bengaluru`
        });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-radial-gradient">
      {/* Background glowing ambient orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[500px] rounded-full bg-amber-600/10 blur-[130px] pointer-events-none" />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Agricultural Supply Chain & Fleet Logistics</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-white mb-6 leading-tight">
            Connecting Farm Gates to Wholesale Markets with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400">Precision Logistics</span>
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed mb-8">
            AgriFlow unites <span className="text-emerald-400 font-semibold">Farmers</span>, <span className="text-blue-400 font-semibold">Logistics Carriers</span>, and <span className="text-amber-400 font-semibold">Wholesale Buyers</span> into a single synchronized workflow. Powered by 3 machine learning models for yield prediction, zone demand, and quantile price forecasting.
          </p>

          {/* Quick 1-Click Demo Section */}
          <div className="glass-panel p-6 rounded-2xl border border-emerald-800/40 glow-emerald max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Select a Role for Immediate 1-Click Demo Evaluation</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleDemoClick('FARMER')}
                disabled={loading}
                className="group p-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/50 transition flex flex-col items-center text-center text-white"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-600/30 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition">
                  <Sprout className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm">Farmer Portal</span>
                <span className="text-[11px] text-emerald-300/80 mt-0.5">Rajesh Gowda (Hoskote)</span>
              </button>

              <button
                onClick={() => handleDemoClick('LOGISTICS')}
                disabled={loading}
                className="group p-3 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 border border-blue-700/50 transition flex flex-col items-center text-center text-white"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-400 mb-2 group-hover:scale-110 transition">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm">Logistics Fleet</span>
                <span className="text-[11px] text-blue-300/80 mt-0.5">VRL AgriTransport (3 Vans)</span>
              </button>

              <button
                onClick={() => handleDemoClick('BUYER')}
                disabled={loading}
                className="group p-3 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-700/50 transition flex flex-col items-center text-center text-white"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-600/30 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm">Wholesale Buyer</span>
                <span className="text-[11px] text-amber-300/80 mt-0.5">Fresh Mart (K.R. Market)</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center space-x-3 text-xs text-slate-400">
              <span>Need custom credentials?</span>
              <button
                onClick={() => { setShowAuthModal(true); setAuthMode('login'); }}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2"
              >
                Sign In with Email
              </button>
              <span>•</span>
              <button
                onClick={() => { setShowAuthModal(true); setAuthMode('register'); }}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>

        {/* Feature Cards Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Card 1: Farmer */}
          <div className="glass-panel p-6 rounded-2xl border border-emerald-900/40 relative group hover:border-emerald-600/40 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-900/40 border border-emerald-700/50 flex items-center justify-center text-emerald-400 mb-4">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Farmer Interface</h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Declare expected harvest, view AI-calibrated yield corrections (<code className="text-emerald-400 font-mono text-xs">supply_model.pkl</code>), check Mandi modal price quantiles, and dispatch sold produce with 1 click.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 mb-6">
              <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" /> Real-time 22-commodity catalog</li>
              <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" /> SHAP feature attribution insights</li>
              <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" /> Live pickup timeline tracking</li>
            </ul>
            <button
              onClick={() => handleDemoClick('FARMER')}
              className="w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold transition flex items-center justify-center space-x-1.5"
            >
              <span>Open Farmer Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Logistics */}
          <div className="glass-panel p-6 rounded-2xl border border-blue-900/40 relative group hover:border-blue-600/40 transition">
            <div className="w-12 h-12 rounded-xl bg-blue-900/40 border border-blue-700/50 flex items-center justify-center text-blue-400 mb-4">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Logistics Provider</h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Access the Shipment Marketplace pool, accept farm-to-buyer transportation tasks, manage 1,000kg capacity vehicles (Tata Ace / Bolero), and update milestones with live telemetry.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 mb-6">
              <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-blue-400 mr-2 flex-shrink-0" /> Perishability Risk Scoring Engine</li>
              <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-blue-400 mr-2 flex-shrink-0" /> Road-network routing with real geometry</li>
              <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-blue-400 mr-2 flex-shrink-0" /> Milestone stepper (Pickup → Transit → Delivered)</li>
            </ul>
            <button
              onClick={() => handleDemoClick('LOGISTICS')}
              className="w-full py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold transition flex items-center justify-center space-x-1.5"
            >
              <span>Open Logistics Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Buyer */}
          <div className="glass-panel p-6 rounded-2xl border border-amber-900/40 relative group hover:border-amber-600/40 transition">
            <div className="w-12 h-12 rounded-xl bg-amber-900/40 border border-amber-700/50 flex items-center justify-center text-amber-400 mb-4">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Wholesale Buyer</h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Explore filterable farm-gate listings across 5 Bengaluru zones, order bulk produce, review transparent freight calculations, and track orders on a real-time progress bar.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 mb-6">
              <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-amber-400 mr-2 flex-shrink-0" /> Direct farm traceability & quality grade badges</li>
              <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-amber-400 mr-2 flex-shrink-0" /> Automated delivery fee estimator</li>
              <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-amber-400 mr-2 flex-shrink-0" /> Real-time 5-stage shipment progression</li>
            </ul>
            <button
              onClick={() => handleDemoClick('BUYER')}
              className="w-full py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-semibold transition flex items-center justify-center space-x-1.5"
            >
              <span>Open Buyer Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Auth Modal for Custom Sign In / Sign Up */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl"
            >
              ×
            </button>

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white font-display">
                {authMode === 'login' ? 'Welcome Back to AgriFlow' : 'Create an AgriFlow Account'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {authMode === 'login' ? 'Sign in to access your role-based dashboard' : 'Choose your role and register your operation'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Select Role</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['FARMER', 'LOGISTICS', 'BUYER'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setSelectedRole(r)}
                          className={`py-2 rounded-xl text-xs font-semibold transition border ${
                            selectedRole === r
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Full Name / Organization</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Rajesh Gowda"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91-9845011100"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Operating Zone (Bengaluru)</label>
                    <select
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Hoskote">Hoskote</option>
                      <option value="Nelamangala">Nelamangala</option>
                      <option value="Bengaluru North">Bengaluru North</option>
                      <option value="Bengaluru South">Bengaluru South</option>
                      <option value="Bengaluru East">Bengaluru East</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-950/50 mt-2"
              >
                {loading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-xs text-slate-400 hover:text-emerald-400 transition"
              >
                {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
