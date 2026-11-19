import React, { useState } from 'react';
import { Phone, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { useTranslation } from 'react-i18next';
import { requestMaskedCall } from '../../lib/api';

interface CallButtonProps {
  tripId?: string;
  orderId?: string;
  target?: 'driver' | 'farmer' | 'buyer' | 'ops';
  targetName?: string;
  targetPhone?: string;
  label?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const CallButton: React.FC<CallButtonProps> = ({
  tripId,
  orderId,
  target = 'driver',
  targetName = 'Driver Suresh Kumar',
  targetPhone = '+919876543203',
  label,
  variant = 'default',
  size = 'default',
  className = '',
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [bridgeReady, setBridgeReady] = useState(false);
  const [bridgeNumber, setBridgeNumber] = useState('');

  const handleStartCall = async () => {
    setConnecting(true);
    try {
      const res = await requestMaskedCall({
        trip_id: tripId,
        order_id: orderId,
        target,
      });
      setBridgeNumber(res.bridge_number);
      setBridgeReady(true);
    } catch (e) {
      console.error(e);
    } finally {
      setConnecting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setConnecting(false);
    setBridgeReady(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={`font-semibold min-h-[44px] ${className}`}
        aria-label={`Call ${targetName}`}
      >
        <Phone className="h-4 w-4 mr-1.5 text-current" />
        <span>{label || t('common.call')}</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Privacy Protected
            </span>
          </div>
          <DialogTitle>{t('common.callMaskedTitle')}</DialogTitle>
          <DialogDescription>{t('common.callMaskedDesc')}</DialogDescription>
        </DialogHeader>

        <div className="my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Calling: <span className="font-bold text-slate-900 dark:text-white">{targetName}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1 capitalize">Role: {target}</p>

          {bridgeReady && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200 text-sm">
              <p className="font-bold">Bridge Connected! 📞</p>
              <p className="text-xs mt-1">
                An incoming call is connecting your phone with {targetName} via IVR {bridgeNumber}.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {!bridgeReady ? (
            <Button
              onClick={handleStartCall}
              disabled={connecting}
              className="w-full sm:w-auto font-bold h-12 px-6"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.calling')}
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Start Masked Call
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleClose} className="w-full sm:w-auto font-bold">
              Done
            </Button>
          )}

          {/* Emergency direct fallback */}
          <a
            href={`tel:${targetPhone}`}
            className="text-xs text-center text-slate-500 hover:text-slate-700 underline py-2 block dark:text-slate-400"
          >
            {t('common.callDirectFallback')}
          </a>
        </DialogFooter>
      </Dialog>
    </>
  );
};
