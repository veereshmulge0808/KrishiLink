import { mockDb } from '../api/mock/db';
import { interpolateLatLng } from '../geo';
import { LatLng, StockStatus } from '../../types';

export type EventCallback = (data: any) => void;

class MockRealtimeClient {
  private subscribers: Map<string, Set<EventCallback>> = new Map();
  private timer: any = null;
  private tripProgress: Record<string, number> = {}; // tripId -> progress 0..1

  constructor() {
    this.startSimulation();
  }

  public subscribe(channel: string, callback: EventCallback): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(callback);

    return () => {
      const channelSubs = this.subscribers.get(channel);
      if (channelSubs) {
        channelSubs.delete(callback);
        if (channelSubs.size === 0) {
          this.subscribers.delete(channel);
        }
      }
    };
  }

  public broadcast(channel: string, event: string, data: any) {
    const channelSubs = this.subscribers.get(channel);
    if (channelSubs) {
      channelSubs.forEach((cb) => {
        try {
          cb({ channel, event, data, timestamp: new Date().toISOString() });
        } catch (e) {
          console.error('Error in realtime subscriber', e);
        }
      });
    }
  }

  private startSimulation() {
    if (typeof window === 'undefined') return;

    // Advance vehicle locations along route polyline every 2.5s
    this.timer = setInterval(() => {
      mockDb.trips.forEach((trip) => {
        if (trip.status !== 'STARTED' && trip.status !== 'ASSIGNED') return;
        const poly = trip.route_polyline;
        if (!poly || poly.length < 2) return;

        let p = this.tripProgress[trip.id] || 0.1;
        p += 0.02;
        if (p >= 0.95) p = 0.05; // Loop for demo
        this.tripProgress[trip.id] = p;

        // Find segment
        const totalSegments = poly.length - 1;
        const currentSegmentFloat = p * totalSegments;
        const segmentIdx = Math.floor(currentSegmentFloat);
        const t = currentSegmentFloat - segmentIdx;

        const p1 = poly[segmentIdx];
        const p2 = poly[Math.min(segmentIdx + 1, poly.length - 1)];
        const currentLocation = interpolateLatLng(p1, p2, t);

        const heading = (Math.atan2(p2.lng - p1.lng, p2.lat - p1.lat) * 180) / Math.PI;
        const etaMinutes = Math.max(2, Math.round((1 - p) * 35));

        trip.current_location = {
          ...currentLocation,
          heading: (heading + 360) % 360,
          speed_kmh: 32 + Math.floor(Math.sin(p * 10) * 10),
          updated_at: new Date().toISOString(),
        };
        trip.eta_minutes = etaMinutes;

        // Broadcast to trip:{id}
        this.broadcast(`trip:${trip.id}`, 'location', {
          trip_id: trip.id,
          location: trip.current_location,
          eta_minutes: etaMinutes,
          status: trip.status,
        });

        // Broadcast to admin:live
        this.broadcast('admin:live', 'vehicle_location', {
          trip_id: trip.id,
          vehicle_id: trip.vehicle_id,
          location: trip.current_location,
          eta_minutes: etaMinutes,
          status: trip.status,
        });
      });
    }, 2500);
  }

  // Helper method to simulate external stock status change
  public emitStockStatusChange(hubId: string, cropId: string, status: StockStatus) {
    if (mockDb.stockMatrix[hubId] && mockDb.stockMatrix[hubId][cropId]) {
      mockDb.stockMatrix[hubId][cropId].status = status;
      mockDb.stockMatrix[hubId][cropId].set_at = new Date().toISOString();
    }
    const payload = { hub_id: hubId, crop_id: cropId, status };
    this.broadcast('admin:live', 'stock_status', payload);
    this.broadcast(`hub:${hubId}`, 'stock_status', payload);
  }

  public emitNewAlert(alert: any) {
    mockDb.alerts.unshift(alert);
    this.broadcast('admin:live', 'alert', alert);
  }
}

export const mockRealtime = new MockRealtimeClient();
