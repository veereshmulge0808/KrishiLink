import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Role } from '../types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, role } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(role)) {
    // Redirect to user's assigned dashboard
    const defaultPaths: Record<Role, string> = {
      buyer: '/buyer',
      farmer: '/farmer',
      driver: '/driver',
      admin: '/admin',
      hub_staff: '/admin/hubs',
    };
    return <Navigate to={defaultPaths[role] || '/buyer'} replace />;
  }

  return <>{children}</>;
};
