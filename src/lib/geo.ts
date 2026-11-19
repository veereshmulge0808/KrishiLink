import { LatLng } from '../types';

/**
 * Calculates Haversine distance in kilometers between two points
 */
export function calculateDistanceKm(from: LatLng, to: LatLng): number {
  const R = 6371; // Earth radius in km
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Linearly interpolates between two LatLng points
 */
export function interpolateLatLng(p1: LatLng, p2: LatLng, t: number): LatLng {
  return {
    lat: p1.lat + (p2.lat - p1.lat) * t,
    lng: p1.lng + (p2.lng - p1.lng) * t,
  };
}

/**
 * Calculates bearing / heading in degrees (0 = North, 90 = East)
 */
export function calculateBearing(start: LatLng, end: LatLng): number {
  const lat1 = (start.lat * Math.PI) / 180;
  const lat2 = (end.lat * Math.PI) / 180;
  const dLng = ((end.lng - start.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Computes bounding box for an array of coordinates
 */
export function getBoundingBox(points: LatLng[]): [[number, number], [number, number]] {
  if (points.length === 0) {
    return [[12.8, 77.4], [13.4, 78.2]];
  }
  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }

  // Add small padding
  const pad = 0.02;
  return [
    [minLat - pad, minLng - pad],
    [maxLat + pad, maxLng + pad],
  ];
}
