import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useDriverTrip,
  useSubmitPickupReceipt,
  useSubmitDelivery,
  useSkipStop,
} from '../../features/trips/hooks';
import { useCrops } from '../../features/catalog/hooks';
import { ReceiptForm } from '../../components/trip/ReceiptForm';
import { Button } from '../../components/ui/button';
import { OtpInput } from '../../components/forms/OtpInput';
import { ArrowLeft, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const DriverStop: React.FC = () => {
  const { id: tripId, stopId } = useParams<{ id: string; stopId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: trip, isLoading } = useDriverTrip(tripId || '');
  const { data: crops = [] } = useCrops();

  const submitPickupMutation = useSubmitPickupReceipt();
  const submitDeliveryMutation = useSubmitDelivery();
  const skipStopMutation = useSkipStop();

  const [buyerOtp, setBuyerOtp] = useState('4829');
  const [deliverySuccess, setDeliverySuccess] = useState(false);

  if (isLoading || !trip) {
    return <div className="p-8 text-center text-slate-400">Loading stop details...</div>;
  }

  const stop = trip.stops.find((s) => s.id === stopId) || trip.stops[0];
  const isPickup = stop.type === 'PICKUP';
  const isDelivery = stop.type === 'DELIVERY';

  const handlePickupSubmit = async (data: any) => {
    await submitPickupMutation.mutateAsync({
      tripId: trip.id,
      stopId: stop.id,
      data,
    });
    navigate(`/driver/trip/${trip.id}`);
  };

  const handleDeliverySubmit = async () => {
    if (buyerOtp.length < 4) return;
    await submitDeliveryMutation.mutateAsync({
      tripId: trip.id,
      stopId: stop.id,
      data: { otp: buyerOtp },
    });
    setDeliverySuccess(true);
    setTimeout(() => {
      navigate(`/driver/trip/${trip.id}`);
    }, 1500);
  };

  const handleSkip = async (reason: string) => {
    await skipStopMutation.mutateAsync({
      tripId: trip.id,
      stopId: stop.id,
      reason,
    });
    navigate(`/driver/trip/${trip.id}`);
  };

  return (
    <div className="flex flex-col gap-4 p-4 min-h-[calc(100vh-64px)] bg-slate-50 text-slate-900">
      {/* Top back button */}
      <div>
        <button
          onClick={() => navigate(`/driver/trip/${trip.id}`)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Route Map</span>
        </button>
      </div>

      <div>
        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider inline-block">
          Stop #{stop.seq} · {isPickup ? 'Farmer Collection' : 'Buyer Drop-off'}
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{stop.name}</h2>
        <p className="text-xs text-slate-500">{stop.address}</p>
      </div>

      {/* Pickup vs Delivery Screen */}
      {isPickup ? (
        <ReceiptForm
          stopId={stop.id}
          tripId={trip.id}
          crops={crops}
          vehicleCapacityKg={trip.vehicle?.capacity_kg || 1000}
          currentTripKg={trip.total_actual_kg || 0}
          onSubmit={handlePickupSubmit}
          onSkip={handleSkip}
          onCancel={() => navigate(`/driver/trip/${trip.id}`)}
        />
      ) : isDelivery ? (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5 text-center max-w-md mx-auto">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 text-3xl">
            📦
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-900">Confirm Buyer Delivery</h3>
            <p className="text-xs text-slate-500 mt-1">
              Ask buyer to enter the 4-digit verification OTP provided on their screen
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <OtpInput value={buyerOtp} length={4} onChange={setBuyerOtp} />

            <div className="p-3 rounded-xl bg-slate-100 text-xs text-slate-600 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Mock OTP: <strong>4829</strong> (Buyer Udupi Upahar)</span>
            </div>

            <Button
              onClick={handleDeliverySubmit}
              disabled={buyerOtp.length < 4 || submitDeliveryMutation.isPending}
              size="xl"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-lg"
            >
              <CheckCircle2 className="h-6 w-6 mr-2" />
              <span>Confirm Handover</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm text-center">
          <h3 className="text-lg font-bold text-slate-900">Hub Consolidation Point</h3>
          <p className="text-xs text-slate-500 mt-1">
            Produce will be weighed and verified by hub operations staff.
          </p>
          <Button
            onClick={() => navigate(`/driver/trip/${trip.id}`)}
            className="mt-4 font-bold"
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
};
