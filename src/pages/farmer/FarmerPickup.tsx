import React, { useState } from 'react';
import { useFarmerPickup } from '../../features/listings/hooks';
import { useChannel } from '../../lib/realtime/useChannel';
import { LiveMap } from '../../components/map/LiveMap';
import { EtaBadge } from '../../components/map/EtaBadge';
import { CallButton } from '../../components/call/CallButton';
import { EmptyState } from '../../components/common/EmptyState';
import { Truck, CheckCircle2, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const FarmerPickup: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  const { data: pickup, isLoading } = useFarmerPickup('u_farmer_1');
  const [liveLocation, setLiveLocation] = useState<any>(null);
  const [liveEta, setLiveEta] = useState<number | null>(null);

  useChannel(pickup?.trip_id ? `trip:${pickup.trip_id}` : null, (msg) => {
    if (msg.event === 'location' && msg.data?.location) {
      setLiveLocation(msg.data.location);
      if (msg.data.eta_minutes !== undefined) setLiveEta(msg.data.eta_minutes);
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>;
  }

  if (!pickup || !pickup.stop) {
    return (
      <EmptyState
        title={t('farmer.noPickupToday')}
        description={t('farmer.noPickupDesc')}
        icon={<Truck className="h-8 w-8 text-slate-400" />}
      />
    );
  }

  const activeLocation = liveLocation || pickup.driver_location;
  const etaMinutes = liveEta ?? pickup.eta_minutes ?? 18;

  const farmLocation = pickup.stop.location;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {t('farmer.driverApproaching')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Route #1 (Kolar Mini Hub Fleet)</p>
        </div>
        <EtaBadge minutes={etaMinutes} />
      </div>

      {/* Live Map showing driver moving towards farm */}
      <div className="rounded-3xl overflow-hidden shadow border border-slate-200 dark:border-slate-800">
        <LiveMap
          center={farmLocation}
          zoom={13}
          vehicles={[
            {
              id: 'v_pickup_driver',
              name: pickup.driver?.name,
              location: activeLocation,
              speed_kmh: activeLocation?.speed_kmh || 35,
              eta_minutes: etaMinutes,
            },
          ]}
          stops={[
            {
              id: pickup.stop.id,
              type: 'PICKUP',
              name: 'My Farm (ನಿಮ್ಮ ಹೊಲ)',
              location: farmLocation,
              status: pickup.stop.status,
            },
          ]}
          routePolyline={pickup.route_polyline}
          highlightId={pickup.stop.id}
          followVehicle={true}
          className="h-72 w-full"
        />
      </div>

      {/* Driver Card with Big Masked Call Button */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-3xl">
            👨‍🌾
          </div>
          <div>
            <h4 className="font-black text-base text-slate-900 dark:text-white">
              {pickup.driver?.name || 'Suresh Kumar'}
            </h4>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {pickup.vehicle?.type} ({pickup.vehicle?.reg_no})
            </p>
            <span className="inline-block mt-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              🟢 On the way to your farm
            </span>
          </div>
        </div>

        <CallButton
          tripId={pickup.trip_id}
          target="driver"
          targetName={pickup.driver?.name}
          targetPhone={pickup.driver?.phone}
          label={t('farmer.callDriver')}
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md min-h-[52px]"
        />
      </div>

      {/* Pickup Details Card */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
        <div className="flex justify-between font-medium">
          <span className="text-slate-500">{isKn ? 'ನಿರೀಕ್ಷಿತ ತೂಕ' : 'Expected Harvest'}:</span>
          <span className="font-black text-slate-900 dark:text-white">
            {pickup.stop.expected_kg} kg
          </span>
        </div>
        <div className="flex justify-between font-medium">
          <span className="text-slate-500">{isKn ? 'ನಿಮ್ಮ ವಿಳಾಸ' : 'Farm Address'}:</span>
          <span className="font-bold text-slate-900 dark:text-white">{pickup.stop.address}</span>
        </div>
      </div>
    </div>
  );
};
