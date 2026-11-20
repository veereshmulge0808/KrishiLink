import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPricingForecasts,
  publishPrices,
  getDemandForecasts,
  getAlerts,
  getSettings,
} from '../../lib/api';
import { MLPriceForecast } from '../../types';

const ML_API_BASE = (import.meta as any).env?.VITE_ML_API_URL || 'http://localhost:8001';

export type LiveMLPriceForecast = MLPriceForecast & {
  pricing_mode?: 'ml_default' | 'derived_premium' | 'baseline_fallback';
  is_fallback?: boolean;
  is_stale?: boolean;
  source?: 'live_ml' | 'mock';
};

export interface LiveDemandForecastRow {
  hub_id: string;
  hub_name_en: string;
  crop_id: string;
  crop_name_en: string;
  delivery_date: string;
  q10_kg: number;
  q50_kg: number;
  q90_kg: number;
  buffer_lambda: number;
  suggested_procurement_kg: number;
  is_cold_start: boolean;
  model_type: 'v1_baseline' | 'v2_lgbm';
}

export interface LiveDemandCurvePoint {
  hub_id: string;
  delivery_date: string;
  hour_ist: string;
  q10_kg: number;
  q50_kg: number;
  q90_kg: number;
}

export interface LiveDemandDashboardResponse {
  source: 'live_ml' | 'mock';
  delivery_date?: string;
  is_available: boolean;
  forecasts: LiveDemandForecastRow[];
  curve_points: LiveDemandCurvePoint[];
}

async function fetchLivePricingForecasts(): Promise<LiveMLPriceForecast[]> {
  try {
    const res = await fetch(`${ML_API_BASE}/api/v1/pricing/bands?hub_id=hub_blr_main`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    const isStale = Boolean(payload.is_stale);

    return (payload.items || []).map((item: any): LiveMLPriceForecast => ({
      crop_id: item.crop_id,
      crop_name_en: item.crop_name_en,
      crop_name_kn: item.crop_name_kn,
      date: item.delivery_date,
      // Convert INR/kg -> paise to match formatPriceRange & tooltip expectations
      p10: Math.round(Number(item.p10) * 100),
      p50: Math.round(Number(item.p50) * 100),
      p90: Math.round(Number(item.p90) * 100),
      current_published_low: Math.round(Number(item.published_low) * 100),
      current_published_high: Math.round(Number(item.published_high) * 100),
      confidence: Number(item.coverage_pct) / 100,
      override_reason: item.override_reason ?? undefined,
      trend: (item.sparkline_7d || []).map((pt: any) => ({
        date: pt.date,
        p50: Math.round(Number(pt.p50_inr_per_kg) * 100),
      })),
      pricing_mode: item.pricing_mode,
      is_fallback: Boolean(item.is_fallback),
      is_stale: isStale,
      source: 'live_ml',
    }));
  } catch {
    // Graceful fallback to existing prototype mock data when localhost:8001 is off
    const mock = await getPricingForecasts();
    return mock.map((m: MLPriceForecast) => ({ ...m, source: 'mock' }));
  }
}

async function fetchLiveDemandDashboard(): Promise<LiveDemandDashboardResponse> {
  try {
    const res = await fetch(`${ML_API_BASE}/api/v1/demand/dashboard`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    return {
      source: 'live_ml',
      delivery_date: payload.delivery_date,
      is_available: Boolean(payload.is_available),
      forecasts: payload.forecasts || [],
      curve_points: payload.curve_points || [],
    };
  } catch {
    // Fallback if local ML API is not running
    await getDemandForecasts().catch(() => []);
    return {
      source: 'mock',
      is_available: false,
      forecasts: [],
      curve_points: [],
    };
  }
}

export function usePricingForecasts() {
  return useQuery({
    queryKey: ['pricing_forecasts'],
    queryFn: fetchLivePricingForecasts,
  });
}

export function useDemandForecasts() {
  return useQuery({
    queryKey: ['demand_forecasts'],
    queryFn: fetchLiveDemandDashboard,
  });
}

export function usePublishPrices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: publishPrices,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing_forecasts'] });
      qc.invalidateQueries({ queryKey: ['crops'] });
    },
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 5000,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });
}

export interface OptimizedStop {
  sequence: number;
  stop_id: string;
  name: string;
  lat: number;
  lon: number;
  demand_kg: number;
  eta: string;
  window: string;
}

export interface OptimizedRoute {
  vehicle_id: string;
  capacity_kg: number;
  total_load_kg: number;
  utilization_pct: number;
  planned_km: number;
  planned_minutes: number;
  departure_time: string;
  return_time: string;
  stops: OptimizedStop[];
  geometry: [number, number][]; // GeoJSON [lon, lat] from OSRM
}

export interface OptimizeRouteResponse {
  status: 'optimal' | 'partial' | 'infeasible' | 'empty';
  route_kind: string;
  hub_id: string;
  osrm_source: string;
  eta_method: string;
  use_p90_buffer: boolean;
  vehicles_used: number;
  unassigned_stops: string[];
  routes: OptimizedRoute[];
}

export async function runRouteOptimization(payload: {
  hub: { id: string; name: string; lat: number; lon: number };
  stops: {
    id: string;
    name: string;
    lat: number;
    lon: number;
    demand_kg: number;
    window_start: string;
    window_end: string;
  }[];
  vehicles: { id: string; capacity_kg: number }[];
  route_kind?: string;
  departure_time?: string;
  zone_id?: string;
  day_of_week?: number;
  rainfall_mm?: number;
  use_p90_buffer?: boolean;
}): Promise<OptimizeRouteResponse> {
  const res = await fetch('http://localhost:8001/api/v1/routing/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Routing API error: ${res.status}`);
  }
  return res.json();
}