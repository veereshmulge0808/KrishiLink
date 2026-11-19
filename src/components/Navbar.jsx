import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sprout, 
  Truck, 
  ShoppingBag, 
  LogOut, 
  User as UserIcon,
  MapPin,
  ShieldCheck
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role?.toUpperCase()) {
      case 'FARMER':
        return {
          label: 'Farmer Portal',
          icon: Sprout,
          color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        };
      case 'LOGISTICS':
        return {
          label: 'Logistics Provider',
          icon: Truck,
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        };
      case 'BUYER':
        return {
          label: 'Wholesale Buyer',
          icon: ShoppingBag,
          color: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        };
      default:
        return {
          label: 'AgriFlow Member',
          icon: UserIcon,
          color: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
        };
    }
  };

  const badge = getRoleBadge(user?.role);
  const BadgeIcon = badge.icon;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-emerald-900/30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <Sprout className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display font-bold text-xl tracking-tight text-white">Agri<span className="text-emerald-400">Flow</span></span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">B2B</span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5 font-medium">Smart Agricultural Logistics & Market</p>
          </div>
        </div>

        {/* User Status & Logout */}
        {user ? (
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end space-x-2">
                <span className="text-sm font-semibold text-slate-100">{user.name}</span>
                <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                  <BadgeIcon className="w-3.5 h-3.5 mr-1" />
                  {badge.label}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-end space-x-1 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-500" />
                <span>Zone: {user.zone}</span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-300 text-xs font-medium transition flex items-center space-x-1.5 shadow"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Role-Based Portal</span>
          </div>
        )}
      </div>
    </header>
  );
}
