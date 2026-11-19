import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderTracking } from '../../features/tracking/hooks';
import { useChannel } from '../../lib/realtime/useChannel';
import { LiveMap } from '../../components/map/LiveMap';
import { EtaBadge } from '../../components/map/EtaBadge';
import { CallButton } from '../../components/call/CallButton';
import { Button } from '../../components/ui/button';
import { ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle, Camera, Phone } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { useTranslation } from 'react-i18next';

export const OrderTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: tracking, isLoading, refetch } = useOrderTracking(id || 'order_101');
  const [liveLocation, setLiveLocation] = useState<any>(null);
  const [liveEta, setLiveEta] = useState<number | null>(null);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [issueReported, setIssueReported] = useState(false);

  // Subscribe to realtime trip updates
  useChannel(tracking?.trip_id ? `trip:${tracking.trip_id}` : null, (msg) => {
    if (msg.event === 'location' && msg.data?.location) {
      setLiveLocation(msg.data.location);
      if (msg.data.eta_minutes !== undefined) setLiveEta(msg.data.eta_minutes);
    }
  });

  if (isLoading || !tracking) {
    return <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>;
  }

  const activeVehicleLocation = liveLocation || tracking.vehicle;
  const etaMinutes = liveEta ?? tracking.eta_minutes ?? 14;

  const steps = [
    { label: t('buyer.driverAssigned'), done: true },
    { label: t('buyer.driverOnTheWay'), done: tracking.status === 'OUT_FOR_DELIVERY' || tracking.status === 'DELIVERED', active: tracking.status === 'OUT_FOR_DELIVERY' },
    { label: t('buyer.delivered'), done: tracking.status === 'DELIVERED' },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/buyer/orders')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>My Orders</span>
        </button>
        <span className="font-mono text-xs font-bold text-slate-400">Order #{id}</span>
      </div>

      {/* ETA & Status Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Live Tracking</h2>
          <p className="text-xs text-slate-500 mt-0.5">Direct transport from HSR Layout Mini Hub</p>
        </div>
        <EtaBadge minutes={etaMinutes} />
      </div>

      {/* Live Map Display */}
      <div className="rounded-3xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800">
        <LiveMap
          center={activeVehicleLocation}
          zoom={13}
          vehicles={[
            {
              id: 'v_delivery',
              name: tracking.driver?.name,
              location: activeVehicleLocation,
              speed_kmh: activeVehicleLocation.speed_kmh,
              eta_minutes: etaMinutes,
            },
          ]}
          stops={[
            {
              id: 'dest',
              type: 'DELIVERY',
              name: 'Your Delivery Location',
              location: tracking.destination,
              status: 'EN_ROUTE',
            },
          ]}
          routePolyline={tracking.route_polyline}
          followVehicle={true}
          className="h-72 w-full"
        />
      </div>

      {/* Delivery Driver Info & Masked Call Button */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-2xl">
            👨‍✈️
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              {tracking.driver?.name || 'Suresh Kumar'}
            </h4>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Vehicle: {tracking.driver?.vehicle_no || 'KA 03 D 9012'}
            </p>
          </div>
        </div>

        <CallButton
          orderId={id}
          tripId={tracking.trip_id}
          target="driver"
          targetName={tracking.driver?.name}
          targetPhone={tracking.driver?.phone}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        />
      </div>

      {/* Delivery Handover OTP */}
      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
          Delivery Verification OTP
        </span>
        <p className="text-3xl font-black text-blue-900 dark:text-blue-100 tracking-widest font-mono">
          {tracking.delivery_otp || '4829'}
        </p>
        <p className="text-[11px] text-blue-600 dark:text-blue-400">
          Driver will request this 4-digit OTP upon unloading produce
        </p>
      </div>

      {/* Status Stepper */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Dispatch Progress
        </span>
        <div className="flex items-center justify-between relative before:absolute before:left-4 before:right-4 before:top-3 before:h-0.5 before:bg-slate-200 dark:before:bg-slate-700">
          {steps.map((st, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center text-center">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  st.done
                    ? 'bg-emerald-600 text-white'
                    : st.active
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                    : 'bg-white border-2 border-slate-300 text-slate-400 dark:bg-slate-800'
                }`}
              >
                {st.done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className="text-[10px] font-bold mt-1 text-slate-700 dark:text-slate-300 max-w-[80px]">
                {st.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Report Issue Action */}
      <button
        onClick={() => setIssueDialogOpen(true)}
        className="text-xs text-center text-slate-500 hover:text-red-500 font-semibold py-2 underline"
      >
        {t('buyer.reportIssue')}
      </button>

      {/* Report Issue Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span>Report Quality Issue</span>
          </DialogTitle>
          <DialogDescription>
            Submit damaged or wilted produce photos directly to the Ops team for instant credit adjustment.
          </DialogDescription>
        </DialogHeader>

        {issueReported ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
            <p className="font-bold text-sm">Issue Recorded Successfully</p>
            <p className="text-xs text-slate-500">
              Ops will review weight adjustment on confirmation.
            </p>
          </div>
        ) : (
          <div className="space-y-4 my-2">
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                Select Affected Crop
              </label>
              <select className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold dark:bg-slate-800">
                <option>French Beans (Wilted / Broken pods)</option>
                <option>Tomato (Bruised)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                Rejected Weight (kg)
              </label>
              <input
                type="number"
                defaultValue={2}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold dark:bg-slate-800"
              />
            </div>

            <Button
              onClick={() => setIssueReported(true)}
              className="w-full font-bold bg-red-600 hover:bg-red-700 text-white"
            >
              Submit Inspection Claim
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
};
