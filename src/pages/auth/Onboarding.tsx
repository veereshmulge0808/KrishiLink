import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { useAuthStore } from '../../stores/authStore';
import { Check } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [villageOrAddress, setVillageOrAddress] = useState('HSR Layout, Bengaluru');

  const handleFinish = () => {
    navigate(role === 'farmer' ? '/farmer' : role === 'driver' ? '/driver' : role === 'admin' ? '/admin' : '/buyer');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-6 max-w-md mx-auto">
      <div className="my-auto space-y-6">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 2 of 2</span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Profile Onboarding</h2>
          <p className="text-xs text-slate-500 mt-1">Tell us your location to connect with your nearest hub.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 block mb-1">
              Full Name / Business Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold bg-white dark:bg-slate-900 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 block mb-1">
              Location / Village
            </label>
            <input
              type="text"
              value={villageOrAddress}
              onChange={(e) => setVillageOrAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold bg-white dark:bg-slate-900 dark:border-slate-700"
            />
          </div>
        </div>

        <Button onClick={handleFinish} size="xl" className="w-full font-bold">
          <Check className="h-5 w-5 mr-2" />
          Complete & Start
        </Button>
      </div>
    </div>
  );
};
