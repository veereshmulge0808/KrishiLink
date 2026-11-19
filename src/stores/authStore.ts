import { create } from 'zustand';
import { User, Role } from '../types';
import { changeLanguage } from '../i18n';

interface AuthState {
  user: User | null;
  role: Role;
  token: string | null;
  isAuthenticated: boolean;
  setRole: (role: Role) => void;
  setUser: (user: User | null) => void;
  loginWithPhone: (phone: string) => Promise<string>;
  verifyOtp: (requestId: string, otp: string) => Promise<boolean>;
  logout: () => void;
  switchDemoRole: (role: Role) => void;
}

// Pre-seeded demo users for rapid switching
export const DEMO_USERS: Record<Role, User> = {
  buyer: {
    id: 'u_buyer_1',
    phone: '+919876543201',
    role: 'buyer',
    name: 'Udupi Upahar (Kiran Kumar)',
    language: 'en',
  },
  farmer: {
    id: 'u_farmer_1',
    phone: '+919876543202',
    role: 'farmer',
    name: 'Ramesh Gowda (ರಾಮೇಶ್ ಗೌಡ)',
    language: 'kn',
  },
  driver: {
    id: 'u_driver_1',
    phone: '+919876543203',
    role: 'driver',
    name: 'Suresh Kumar',
    language: 'en',
  },
  admin: {
    id: 'u_admin_1',
    phone: '+919876543204',
    role: 'admin',
    name: 'Anita Rao (Ops Tower)',
    language: 'en',
  },
  hub_staff: {
    id: 'u_staff_1',
    phone: '+919876543205',
    role: 'hub_staff',
    name: 'Praveen Nayak (Kolar Mini Hub)',
    language: 'kn',
  },
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: DEMO_USERS.buyer, // Default to buyer for first review
  role: 'buyer',
  token: 'mock_jwt_token_buyer_123',
  isAuthenticated: true,

  setRole: (role: Role) => {
    const demoUser = DEMO_USERS[role] || DEMO_USERS.buyer;
    set({ role, user: demoUser });
    if (role === 'farmer') {
      changeLanguage('kn');
    } else {
      changeLanguage('en');
    }
  },

  setUser: (user: User | null) => {
    set({
      user,
      role: user ? user.role : 'buyer',
      isAuthenticated: !!user,
    });
  },

  loginWithPhone: async (phone: string) => {
    await new Promise((r) => setTimeout(r, 400));
    return 'req_' + Math.random().toString(36).substring(2, 8);
  },

  verifyOtp: async (requestId: string, otp: string) => {
    await new Promise((r) => setTimeout(r, 500));
    // Accept 123456 or any 6-digit OTP for demo
    if (otp === '123456' || otp.length === 6) {
      // Pick based on current role or default buyer
      const user = DEMO_USERS[get().role] || DEMO_USERS.buyer;
      set({
        user,
        isAuthenticated: true,
        token: 'mock_jwt_token_' + user.id,
      });
      return true;
    }
    return false;
  },

  logout: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  switchDemoRole: (role: Role) => {
    const newUser = DEMO_USERS[role];
    set({
      user: newUser,
      role,
      isAuthenticated: true,
      token: 'mock_jwt_' + role,
    });
    if (role === 'farmer') {
      changeLanguage('kn');
    } else {
      changeLanguage('en');
    }
  },
}));
