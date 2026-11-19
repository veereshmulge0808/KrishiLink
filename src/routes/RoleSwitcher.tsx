import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { Role } from '../types';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Tractor, Truck, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RoleSwitcherProps {
  className?: string;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ className = '' }) => {
  const { role, switchDemoRole } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const roles: { id: Role; label: string; icon: React.ReactNode; route: string; activeColor: string }[] = [
    {
      id: 'buyer',
      label: t('common.roleBuyer'),
      icon: <ShoppingBag className="h-3.5 w-3.5" />,
      route: '/buyer',
      activeColor: 'bg-emerald-600 text-white shadow-sm',
    },
    {
      id: 'farmer',
      label: t('common.roleFarmer'),
      icon: <Tractor className="h-3.5 w-3.5" />,
      route: '/farmer',
      activeColor: 'bg-emerald-700 text-white shadow-sm',
    },
    {
      id: 'driver',
      label: t('common.roleDriver'),
      icon: <Truck className="h-3.5 w-3.5" />,
      route: '/driver',
      activeColor: 'bg-blue-600 text-white shadow-sm',
    },
    {
      id: 'admin',
      label: t('common.roleAdmin'),
      icon: <Shield className="h-3.5 w-3.5" />,
      route: '/admin',
      activeColor: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm',
    },
  ];

  const handleSelectRole = (newRole: Role, targetRoute: string) => {
    switchDemoRole(newRole);
    navigate(targetRoute);
  };

  return (
    <div
      className={`inline-flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 backdrop-blur-sm select-none ${className}`}
    >
      <span className="hidden lg:inline text-[11px] font-bold text-slate-500 uppercase px-2 tracking-wider">
        Demo:
      </span>
      {roles.map((r) => {
        const isActive = role === r.id;
        return (
          <button
            key={r.id}
            onClick={() => handleSelectRole(r.id, r.route)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isActive
                ? r.activeColor
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700'
            }`}
          >
            {r.icon}
            <span>{r.label}</span>
          </button>
        );
      })}
    </div>
  );
};
