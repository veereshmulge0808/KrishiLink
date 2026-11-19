import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import FarmerDashboard from './pages/FarmerDashboard';
import LogisticsDashboard from './pages/LogisticsDashboard';
import BuyerDashboard from './pages/BuyerDashboard';

function MainApp() {
  const { user } = useAuth();

  // Strict RBAC routing: users are exclusively directed to their designated role portal
  const renderDashboard = () => {
    if (!user) {
      return <LoginPage />;
    }

    const role = (user.role || '').toUpperCase();

    switch (role) {
      case 'FARMER':
        return <FarmerDashboard />;
      case 'LOGISTICS':
        return <LogisticsDashboard />;
      case 'BUYER':
        return <BuyerDashboard />;
      default:
        return <FarmerDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#060d0a] text-slate-100 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        {renderDashboard()}
      </main>
      <footer className="border-t border-slate-900/80 py-6 text-center text-xs text-slate-400 glass-panel">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 AgriFlow. Data-Driven Agricultural Logistics & Market Intelligence Platform.</p>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>XGBoost ML Models</span>
            <span>•</span>
            <span>Strict Role-Based Portals</span>
            <span>•</span>
            <span>Single-Source State Sync</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
