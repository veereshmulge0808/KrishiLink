import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { BuyerLayout } from '../layouts/BuyerLayout';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { DriverLayout } from '../layouts/DriverLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Role Guard
import { RoleGuard } from './RoleGuard';

// Landing Page
import { LandingPage } from '../pages/LandingPage';

// Auth Pages
import { Login } from '../pages/auth/Login';
import { VerifyOtp } from '../pages/auth/VerifyOtp';
import { Onboarding } from '../pages/auth/Onboarding';

// Buyer Pages
import { BuyerHome } from '../pages/buyer/BuyerHome';
import { CropDetail } from '../pages/buyer/CropDetail';
import { Cart } from '../pages/buyer/Cart';
import { Checkout } from '../pages/buyer/Checkout';
import { Orders as BuyerOrders } from '../pages/buyer/Orders';
import { OrderTracking } from '../pages/buyer/OrderTracking';
import { BuyerAccount } from '../pages/buyer/BuyerAccount';

// Farmer Pages
import { FarmerToday } from '../pages/farmer/FarmerToday';
import { FarmerThreshold } from '../pages/farmer/FarmerThreshold';
import { FarmerPickup } from '../pages/farmer/FarmerPickup';
import { FarmerPayments } from '../pages/farmer/FarmerPayments';
import { FarmerProfile } from '../pages/farmer/FarmerProfile';

// Driver Pages
import { DriverTrips } from '../pages/driver/DriverTrips';
import { DriverTrip } from '../pages/driver/DriverTrip';
import { DriverStop } from '../pages/driver/DriverStop';
import { DriverHistory } from '../pages/driver/DriverHistory';
import { DriverProfile } from '../pages/driver/DriverProfile';

// Lazy Loaded Admin Pages for Mobile Optimization
const ControlTower = lazy(() => import('../pages/admin/ControlTower').then(m => ({ default: m.ControlTower })));
const Hubs = lazy(() => import('../pages/admin/Hubs').then(m => ({ default: m.Hubs })));
const HubDetail = lazy(() => import('../pages/admin/HubDetail').then(m => ({ default: m.HubDetail })));
const Transfers = lazy(() => import('../pages/admin/Transfers').then(m => ({ default: m.Transfers })));
const Dispatch = lazy(() => import('../pages/admin/Dispatch').then(m => ({ default: m.Dispatch })));
const AdminTrips = lazy(() => import('../pages/admin/Trips').then(m => ({ default: m.Trips })));
const AdminTripDetail = lazy(() => import('../pages/admin/TripDetail').then(m => ({ default: m.TripDetail })));
const AdminOrders = lazy(() => import('../pages/admin/Orders').then(m => ({ default: m.Orders })));
const Farmers = lazy(() => import('../pages/admin/Farmers').then(m => ({ default: m.Farmers })));
const Buyers = lazy(() => import('../pages/admin/Buyers').then(m => ({ default: m.Buyers })));
const Drivers = lazy(() => import('../pages/admin/Drivers').then(m => ({ default: m.Drivers })));
const Pricing = lazy(() => import('../pages/admin/Pricing').then(m => ({ default: m.Pricing })));
const Forecasts = lazy(() => import('../pages/admin/Forecasts').then(m => ({ default: m.Forecasts })));
const AdminPayments = lazy(() => import('../pages/admin/Payments').then(m => ({ default: m.Payments })));
const Settings = lazy(() => import('../pages/admin/Settings').then(m => ({ default: m.Settings })));

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400">Loading module...</div>}>
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  // Landing page
  {
    path: '/',
    element: <LandingPage />,
  },

  // Auth routes
  {
    path: '/auth/login',
    element: <Login />,
  },
  {
    path: '/auth/verify',
    element: <VerifyOtp />,
  },
  {
    path: '/auth/onboarding',
    element: <Onboarding />,
  },

  // 1. BUYER DASHBOARD
  {
    path: '/buyer',
    element: (
      <RoleGuard allowedRoles={['buyer', 'admin']}>
        <BuyerLayout />
      </RoleGuard>
    ),
    children: [
      { index: true, element: <BuyerHome /> },
      { path: 'crop/:id', element: <CropDetail /> },
      { path: 'cart', element: <Cart /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'orders', element: <BuyerOrders /> },
      { path: 'orders/:id', element: <OrderTracking /> },
      { path: 'account', element: <BuyerAccount /> },
    ],
  },

  // 2. FARMER DASHBOARD
  {
    path: '/farmer',
    element: (
      <RoleGuard allowedRoles={['farmer', 'admin']}>
        <FarmerLayout />
      </RoleGuard>
    ),
    children: [
      { index: true, element: <FarmerToday /> },
      { path: 'threshold', element: <FarmerThreshold /> },
      { path: 'pickup', element: <FarmerPickup /> },
      { path: 'payments', element: <FarmerPayments /> },
      { path: 'profile', element: <FarmerProfile /> },
    ],
  },

  // 3. DRIVER DASHBOARD
  {
    path: '/driver',
    element: (
      <RoleGuard allowedRoles={['driver', 'admin']}>
        <DriverLayout />
      </RoleGuard>
    ),
    children: [
      { index: true, element: <DriverTrips /> },
      { path: 'trip/:id', element: <DriverTrip /> },
      { path: 'trip/:id/stop/:stopId', element: <DriverStop /> },
      { path: 'history', element: <DriverHistory /> },
      { path: 'profile', element: <DriverProfile /> },
    ],
  },

  // 4. ADMIN DASHBOARD
  {
    path: '/admin',
    element: (
      <RoleGuard allowedRoles={['admin', 'hub_staff']}>
        <AdminLayout />
      </RoleGuard>
    ),
    children: [
      { index: true, element: <SuspenseWrapper><ControlTower /></SuspenseWrapper> },
      { path: 'hubs', element: <SuspenseWrapper><Hubs /></SuspenseWrapper> },
      { path: 'hubs/:id', element: <SuspenseWrapper><HubDetail /></SuspenseWrapper> },
      { path: 'transfers', element: <SuspenseWrapper><Transfers /></SuspenseWrapper> },
      { path: 'dispatch', element: <SuspenseWrapper><Dispatch /></SuspenseWrapper> },
      { path: 'trips', element: <SuspenseWrapper><AdminTrips /></SuspenseWrapper> },
      { path: 'trips/:id', element: <SuspenseWrapper><AdminTripDetail /></SuspenseWrapper> },
      { path: 'orders', element: <SuspenseWrapper><AdminOrders /></SuspenseWrapper> },
      { path: 'farmers', element: <SuspenseWrapper><Farmers /></SuspenseWrapper> },
      { path: 'buyers', element: <SuspenseWrapper><Buyers /></SuspenseWrapper> },
      { path: 'drivers', element: <SuspenseWrapper><Drivers /></SuspenseWrapper> },
      { path: 'pricing', element: <SuspenseWrapper><Pricing /></SuspenseWrapper> },
      { path: 'forecasts', element: <SuspenseWrapper><Forecasts /></SuspenseWrapper> },
      { path: 'payments', element: <SuspenseWrapper><AdminPayments /></SuspenseWrapper> },
      { path: 'settings', element: <SuspenseWrapper><Settings /></SuspenseWrapper> },
    ],
  },

  // Fallback 404 -> redirect to buyer
  {
    path: '*',
    element: <Navigate to="/buyer" replace />,
  },
]);
