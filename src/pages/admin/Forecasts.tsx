import React from 'react';
import { useDemandForecasts } from '../../features/pricing/hooks';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LineChart, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react';
import { KpiCard } from '../../components/admin/KpiCard';

export const Forecasts: React.FC = () => {
  const { data: forecasts = [] } = useDemandForecasts();

  const demandBandsData = [
    { hour: '04:00', q10: 800, q50: 1200, q90: 1600 },
    { hour: '06:00', q10: 1800, q50: 2400, q90: 3100 },
    { hour: '08:00', q10: 2600, q50: 3400, q90: 4200 },
    { hour: '10:00', q10: 3000, q50: 3900, q90: 4800 },
    { hour: '12:00', q10: 3100, q50: 4100, q90: 5000 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Demand Forecasts & Suggested Procurement
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Probabilistic quantiles (q10 floor, q50 expected, q90 peak) driving automated Newsvendor buffer procurement.
        </p>
      </div>

      {/* Accuracy KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Price Band Coverage"
          value="94.6%"
          subtitle="Actual mandi prices within p10-p90"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        />
        <KpiCard
          title="Demand WAPE Error"
          value="7.8%"
          subtitle="Weighted Absolute Percent Error (Target <10%)"
          icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
        />
        <KpiCard
          title="Stockout Prevention"
          value="99.1%"
          subtitle="Shortages avoided through lateral transfers"
          icon={<BarChart3 className="h-4 w-4 text-purple-600" />}
        />
      </div>

      {/* Quantile Bands Chart */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Tomorrow's Consolidated Demand Quantiles (q10 – q50 – q90)
            </h3>
            <p className="text-xs text-slate-500">Hourly cumulative demand curve for Bengaluru Hub</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>q50 Expected</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-200" />
              <span>q10–q90 Band</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={demandBandsData}>
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip formatter={(val: any) => [`${val} kg`, 'Demand']} />
              <Area type="monotone" dataKey="q90" stackId="1" stroke="#86efac" fill="#dcfce7" />
              <Area type="monotone" dataKey="q50" stackId="2" stroke="#16a34a" fill="#16a34a" />
              <Area type="monotone" dataKey="q10" stackId="3" stroke="#15803d" fill="#15803d" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Suggested Procurement Table */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-base font-black text-slate-900 dark:text-white">
          Suggested Procurement Targets (Hub × Crop)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                <th className="p-3">Crop</th>
                <th className="p-3">Hub Target</th>
                <th className="p-3">q10 (kg)</th>
                <th className="p-3">q50 Expected (kg)</th>
                <th className="p-3">q90 Peak (kg)</th>
                <th className="p-3 font-black text-primary">Suggested Procurement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              <tr>
                <td className="p-3 font-bold">🍅 Tomato</td>
                <td className="p-3">Bengaluru Main Hub</td>
                <td className="p-3">2,800 kg</td>
                <td className="p-3 font-bold">3,400 kg</td>
                <td className="p-3">4,100 kg</td>
                <td className="p-3 font-black text-primary text-base">3,550 kg</td>
              </tr>
              <tr>
                <td className="p-3 font-bold">🧅 Onion</td>
                <td className="p-3">HSR Layout Mini Hub</td>
                <td className="p-3">1,200 kg</td>
                <td className="p-3 font-bold">1,600 kg</td>
                <td className="p-3">2,000 kg</td>
                <td className="p-3 font-black text-primary text-base">1,680 kg</td>
              </tr>
              <tr>
                <td className="p-3 font-bold">🫘 French Beans</td>
                <td className="p-3">Whitefield Mini Hub</td>
                <td className="p-3">400 kg</td>
                <td className="p-3 font-bold">600 kg</td>
                <td className="p-3">850 kg</td>
                <td className="p-3 font-black text-primary text-base">650 kg</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
