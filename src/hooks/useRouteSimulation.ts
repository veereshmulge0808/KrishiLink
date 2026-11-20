import { useEffect, useMemo, useRef, useState } from 'react';
import type { OptimizedRoute } from '../features/pricing/hooks';

export interface SimulatedVehicleState {
  vehicle_id: string;
  lat: number;
  lon: number;
  heading: number;
  speed_kmh: number;
  progress_pct: number;
  remaining_km: number;
  eta_minutes: number;
  next_stop_name: string;
  next_stop_id: string;
  traveled_positions: [number, number][];
  remaining_positions: [number, number][];
  is_finished: boolean;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function computeBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function useRouteSimulation(
  routes: OptimizedRoute[],
  options?: { baseSpeedKmh?: number; speedMultiplier?: number; isPlaying?: boolean }
) {
  const baseSpeedKmh = options?.baseSpeedKmh ?? 28; // realistic Bengaluru city speed
  const speedMultiplier = options?.speedMultiplier ?? 5; // 5x demo speed (~2.3 km/min)
  const isPlaying = options?.isPlaying ?? true;

  const [elapsedSimSeconds, setElapsedSimSeconds] = useState(0);
  const lastFrameRef = useRef<number | null>(null);

  // Reset clock when new routes arrive
  useEffect(() => {
    setElapsedSimSeconds(0);
    lastFrameRef.current = null;
  }, [routes]);

  useEffect(() => {
    if (!isPlaying || routes.length === 0) {
      lastFrameRef.current = null;
      return;
    }

    let rafId: number;
    const tick = (now: number) => {
      if (lastFrameRef.current !== null) {
        const dtSec = Math.min(0.25, (now - lastFrameRef.current) / 1000);
        setElapsedSimSeconds((prev) => prev + dtSec * speedMultiplier);
      }
      lastFrameRef.current = now;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, speedMultiplier, routes]);

  // Precompute cumulative distances along each OSRM [lon, lat] -> [lat, lon] polyline
  const preparedPaths = useMemo(() => {
    return routes.map((route) => {
      const latLngs: [number, number][] = (route.geometry || []).map(([lon, lat]) => [lat, lon]);
      const cumDist: number[] = [0];
      for (let i = 1; i < latLngs.length; i++) {
        const d = haversineKm(
          latLngs[i - 1][0],
          latLngs[i - 1][1],
          latLngs[i][0],
          latLngs[i][1]
        );
        cumDist.push(cumDist[i - 1] + d);
      }
      const totalKm = cumDist[cumDist.length - 1] || route.planned_km || 1;
      return { route, latLngs, cumDist, totalKm };
    });
  }, [routes]);

  const vehicles: SimulatedVehicleState[] = useMemo(() => {
    const distTraveledKm = (baseSpeedKmh * elapsedSimSeconds) / 3600;

    return preparedPaths.map(({ route, latLngs, cumDist, totalKm }) => {
      if (latLngs.length === 0) {
        return {
          vehicle_id: route.vehicle_id,
          lat: 13.0285,
          lon: 77.5409,
          heading: 0,
          speed_kmh: 0,
          progress_pct: 0,
          remaining_km: 0,
          eta_minutes: 0,
          next_stop_name: 'Hub',
          next_stop_id: 'hub',
          traveled_positions: [],
          remaining_positions: [],
          is_finished: true,
        };
      }

      const clampedDist = Math.min(distTraveledKm, totalKm);
      const isFinished = clampedDist >= totalKm;

      // Binary search for current road segment
      let lo = 0;
      let hi = cumDist.length - 1;
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (cumDist[mid] <= clampedDist) lo = mid;
        else hi = mid;
      }

      const segStart = cumDist[lo];
      const segEnd = cumDist[hi];
      const segLen = Math.max(1e-6, segEnd - segStart);
      const t = Math.min(1, Math.max(0, (clampedDist - segStart) / segLen));

      const [lat1, lon1] = latLngs[lo];
      const [lat2, lon2] = latLngs[hi];
      const curLat = lat1 + (lat2 - lat1) * t;
      const curLon = lon1 + (lon2 - lon1) * t;
      const heading = computeBearing(lat1, lon1, lat2, lon2);

      const progressPct = Math.min(100, Math.round((clampedDist / totalKm) * 100));
      const remainingKm = Math.max(0, totalKm - clampedDist);
      const etaMinutes = Math.max(0, Math.round((remainingKm / baseSpeedKmh) * 60));

      // Estimate next upcoming stop based on route progress
      const stopIdx = Math.min(
        route.stops.length - 1,
        Math.floor((progressPct / 100) * route.stops.length)
      );
      const nextStop = route.stops[stopIdx];

      return {
        vehicle_id: route.vehicle_id,
        lat: curLat,
        lon: curLon,
        heading,
        speed_kmh: isFinished ? 0 : baseSpeedKmh,
        progress_pct: progressPct,
        remaining_km: Number(remainingKm.toFixed(1)),
        eta_minutes: etaMinutes,
        next_stop_name: isFinished ? 'Returned to Hub' : nextStop?.name ?? 'Destination',
        next_stop_id: nextStop?.stop_id ?? '',
        traveled_positions: [...latLngs.slice(0, lo + 1), [curLat, curLon]],
        remaining_positions: [[curLat, curLon], ...latLngs.slice(hi)],
        is_finished: isFinished,
      };
    });
  }, [preparedPaths, elapsedSimSeconds, baseSpeedKmh]);

  return {
    vehicles,
    resetSimulation: () => setElapsedSimSeconds(0),
  };
}