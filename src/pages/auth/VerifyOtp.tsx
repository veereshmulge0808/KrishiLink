import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { OtpInput } from '../../components/forms/OtpInput';
import { Button } from '../../components/ui/button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Logo } from '../../components/common/Logo';

export const VerifyOtp: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reqId = searchParams.get('req') || 'req_demo';
  const phone = searchParams.get('phone') || '9876543210';
  const { verifyOtp, role } = useAuthStore();
  const { i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const [otp, setOtp] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length < 6) return;
    setLoading(true);
    setError(false);
    const success = await verifyOtp(reqId, otp);
    setLoading(false);
    if (success) {
      const destination = {
        buyer: '/buyer',
        farmer: '/farmer',
        driver: '/driver',
        admin: '/admin',
        hub_staff: '/admin/hubs',
      }[role] || '/buyer';
      navigate(destination);
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/auth/login')}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{isKn ? 'ಹಿಂದಕ್ಕೆ' : 'Change Phone'}</span>
        </button>
        <Logo size="xs" showText={false} />
      </div>

      <div className="my-auto text-center py-8">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          {isKn ? 'ಒಟಿಪಿ ನಮೂದಿಸಿ' : 'Verify Mobile OTP'}
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-500">
          Sent 6-digit code to <strong className="text-slate-800 dark:text-slate-200">+91 {phone}</strong>
        </p>

        <form onSubmit={handleVerify} className="mt-8 space-y-6">
          <OtpInput value={otp} onChange={setOtp} />

          {error && (
            <p className="text-xs text-red-600 font-bold">
              Invalid OTP. Try 123456 for prototype demo.
            </p>
          )}

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
            💡 Quick Demo Tip: Default mock OTP is prefilled as <strong>123456</strong>
          </div>

          <Button
            type="submit"
            disabled={loading || otp.length < 6}
            size="xl"
            className="w-full font-bold"
          >
            {loading ? 'Verifying...' : isKn ? 'ದೃಢೀಕರಿಸಿ & ಮುಂದುವರಿಯಿರಿ' : 'Verify & Continue'}
          </Button>
        </form>
      </div>

      <div className="text-center text-xs text-slate-400 py-3">
        Didn't receive SMS? <button className="font-bold text-primary underline">Resend (0:29)</button>
      </div>
    </div>
  );
};
