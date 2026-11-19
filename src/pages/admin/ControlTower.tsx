import React from 'react';
import { useAdminTrips } from '../../features/trips/hooks';
import { useHubs } from '../../features/hubs/hooks';
import { useAlerts } from '../../features/pricing/hooks';
import { KpiCard } from '../../components/admin/KpiCard';
import { LiveMap } from '../../components/map/LiveMap';
import { AlertsFeed } from '../../components/admin/AlertsFeed';
import { ShoppingCart, Leaf, Clock, TrendingDown, Truck, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ControlTower: React.FC = () => {
  const { t } = useTranslation();
  const { data: trips = [] } = useAdminTrips();
  const { data: hubs = [] } = useHubs();
  const { data: alerts = [] } = useAlerts();

  const activeVehicles = trips
    .filter((t) => t.status === 'STARTED' && t.current_location)
    .map((t) => ({
      id: t.vehicle_id,
      name: t.driver?.name,
      location: t.current_location!,
      speed_kmh: t.current_location?.speed_kmh,
      eta_minutes: t.eta_minutes,
      trip_id: t.id,
    }));

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {t('admin.controlTower')}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Realtime Karnataka Farm-to-City Agri Supply Chain Monitoring
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          title={t('admin.kpiOrdersToday')}
          value="48"
          subtitle="₹2.84L Gross"
          icon={<ShoppingCart className="h-4 w-4 text-emerald-600" />}
          trend={{ value: '+14%', isPositive: true }}
        />
        <KpiCard
          title={t('admin.kpiKgCollected')}
          value="3,720 kg"
          subtitle="9 Hubs aggregate"
          icon={<Leaf className="h-4 w-4 text-emerald-600" />}
          trend={{ value: '+8%', isPositive: true }}
        />
        <KpiCard
          title={t('admin.kpiOnTime')}
          value="96.2%"
          subtitle="Target ≥ 95%"
          icon={<Clock className="h-4 w-4 text-blue-600" />}
          trend={{ value: '+1.2%', isPositive: true }}
        />
        <KpiCard
          title={t('admin.kpiWastage')}
          value="1.4%"
          subtitle="Tolerance 2.0%"
          icon={<TrendingDown className="h-4 w-4 text-purple-600" />}
          trend={{ value: '-0.3%', isPositive: true }}
        />
        <KpiCard
          title={t('admin.kpiActiveTrips')}
          value={trips.filter((t) => t.status === 'STARTED').length}
          subtitle="4 Assigned Fleet"
          icon={<Truck className="h-4 w-4 text-indigo-600" />}
        />
        <KpiCard
          title={t('admin.kpiAlerts')}
          value={alerts.length}
          subtitle="Requires attention"
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          trend={{ value: 'Active', isPositive: false }}
        />
      </div>

      {/* Main Grid: Large Fleet Map + Alerts Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Map View */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t('admin.liveFleetMap')}
            </h3>
            <span className="text-xs text-slate-400">Updating every 2.5s</span>
          </div>

          <div className="rounded-3xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 bg-white">
            <LiveMap
              zoom={10}
              vehicles={activeVehicles}
              hubs={hubs}
              stops={trips.flatMap((t) => t.stops)}
              showLayerControls={true}
              className="h-[480px] w-full"
            />
          </div>
        </div>

        {/* Operational Alerts Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t('admin.alertsFeed')} ({alerts.length})
            </h3>
            <span className="text-xs text-emerald-600 font-bold">Auto-Sync</span>
          </div>

          <AlertsFeed alerts={alerts} />
        </div>
      </div>
    </div>
  );
};
