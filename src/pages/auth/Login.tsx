import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { PhoneInput } from '../../components/forms/PhoneInput';
import { Button } from '../../components/ui/button';
import { RoleSwitcher } from '../../routes/RoleSwitcher';
import { APP_NAME, APP_TAGLINE, APP_NAME_KN } from '../../lib/constants';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitch } from '../../components/common/LanguageSwitch';
import { Logo } from '../../components/common/Logo';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithPhone } = useAuthStore();
  const { i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [phone, setPhone] = useState('9876543201');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setLoading(true);
    const reqId = await loginWithPhone(phone);
    setLoading(false);
    navigate(`/auth/verify?req=${reqId}&phone=${phone}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 dark:from-slate-950 dark:to-slate-900 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Logo size="sm" showSubtitle={false} />
        <LanguageSwitch />
      </div>

      {/* Login Card */}
      <div className="my-auto py-8">
        <div className="text-center mb-8 flex flex-col items-center">
          <img
            src="/logo.png"
            alt="KrishiLink"
            className="h-28 w-auto object-contain mb-3 drop-shadow-md"
          />
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isKn ? 'ಕೃಷಿಲಿಂಕ್‌ಗೆ ಸುಸ್ವಾಗತ' : 'Welcome to KrishiLink'}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isKn
              ? 'ರೈತರು, ಚಾಲಕರು ಮತ್ತು ಸಗಟು ಖರೀದಿದಾರರ ಸಂಪರ್ಕ ವೇದಿಕೆ'
              : APP_TAGLINE}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-2">
              {isKn ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ' : 'Enter Mobile Phone Number'}
            </label>
            <PhoneInput value={phone} onChange={setPhone} />
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Mock OTP: <strong>123456</strong> will be verified automatically</span>
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || phone.length < 10}
            size="xl"
            className="w-full font-bold flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Sending OTP...' : isKn ? 'ಮುಂದುವರಿಯಿರಿ' : 'Get OTP'}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        {/* Quick Demo Switcher Prompt */}
        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Instant Demo Switcher</span>
          </p>
          <div className="flex justify-center">
            <RoleSwitcher />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-3">
        KrishiLink Prototype · Bengaluru & Karnataka Agri Logistics
      </footer>
    </div>
  );
};
