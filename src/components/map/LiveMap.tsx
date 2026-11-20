import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LatLng, StopType, Hub } from '../../types';
import { BENGALURU_COORDS } from '../../lib/constants';
import type { OptimizedRoute } from '../../features/pricing/hooks';

import type { SimulatedVehicleState } from '../../hooks/useRouteSimulation';

interface LiveMapProps {
  center?: LatLng;
  zoom?: number;
  vehicles?: MapVehicle[];
  stops?: MapStop[];
  hubs?: Hub[];
  routePolyline?: LatLng[];
  optimizedRoutes?: OptimizedRoute[];
  simulatedVehicles?: SimulatedVehicleState[];
  selectedVehicleId?: string | null;
  highlightId?: string;
  className?: string;
  followVehicle?: boolean;
  showLayerControls?: boolean;
}

const ROUTE_COLORS = ['#16A34A', '#2563EB', '#9333EA', '#EA580C', '#0891B2'];

const createCustomIcon = (color: string, label?: string, isVehicle?: boolean) => {
  if (isVehicle) {
    return L.divIcon({
      html: `
        <div style="background-color: #2563EB; width: 36px; height: 36px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 18px;">
          🚚
        </div>
      `,
      className: 'vehicle-leaflet-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }

  return L.divIcon({
    html: `
      <div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
        <span style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 12px;">${label || '•'}</span>
      </div>
    `,
    className: 'custom-pin-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
  });
};

function ChangeMapView({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || map.getZoom());
  }, [center, zoom, map]);
  return null;
}

function CustomZoomControls({ initialCenter, initialZoom }: { initialCenter: [number, number]; initialZoom: number }) {
  const map = useMap();

  return (
    <div
      className="leaflet-top leaflet-right !mt-14 sm:!mt-3 !mr-3"
      style={{ pointerEvents: 'auto', zIndex: 1000 }}
    >
      <div className="flex flex-col gap-1 shadow-xl bg-white/95 dark:bg-slate-900/95 p-1 rounded-2xl border border-slate-200/90 dark:border-slate-700 backdrop-blur-md">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            map.zoomIn();
          }}
          className="h-8 w-8 rounded-xl flex items-center justify-center font-black text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all text-lg select-none"
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          +
        </button>
        <div className="h-px bg-slate-200 dark:bg-slate-700 mx-1" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            map.zoomOut();
          }}
          className="h-8 w-8 rounded-xl flex items-center justify-center font-black text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all text-lg select-none"
          title="Zoom Out (−)"
          aria-label="Zoom Out"
        >
          −
        </button>
        <div className="h-px bg-slate-200 dark:bg-slate-700 mx-1" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            map.setView(initialCenter, initialZoom);
          }}
          className="h-8 w-8 rounded-xl flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all text-xs select-none"
          title="Reset Zoom & Center (⛶)"
          aria-label="Reset View"
        >
          ⛶
        </button>
      </div>
    </div>
  );
}

export interface MapStop {
  id: string;
  seq?: number;
  type: StopType;
  name: string;
  location: LatLng;
  status?: string;
  expected_kg?: number;
  eta?: string;
}

export interface MapVehicle {
  id: string;
  name?: string;
  location: LatLng;
  heading?: number;
  speed_kmh?: number;
  eta_minutes?: number;
  trip_id?: string;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  center = BENGALURU_COORDS,
  zoom = 11,
  vehicles = [],
  stops = [],
  hubs = [],
  routePolyline = [],
  optimizedRoutes = [],
  simulatedVehicles = [],
  selectedVehicleId = null,
  highlightId,
  className = 'h-80 w-full rounded-2xl overflow-hidden',
  followVehicle = false,
  showLayerControls = false,
}) => {
  const [layers, setLayers] = useState({
    vehicles: true,
    stops: true,
    hubs: true,
    route: true,
  });

  const activeCenter: [number, number] =
    followVehicle && vehicles.length > 0
      ? [vehicles[0].location.lat, vehicles[0].location.lng]
      : [center.lat, center.lng];

  return (
    <div className={`relative ${className} border border-slate-200 dark:border-slate-800 shadow-inner`}>
      {showLayerControls && (
        <div
          className="leaflet-top leaflet-left !mt-3 !ml-3 flex flex-wrap gap-1.5"
          style={{ pointerEvents: 'auto', zIndex: 1000 }}
        >
          {(['route', 'stops', 'hubs', 'vehicles'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setLayers((prev) => ({ ...prev, [key]: !prev[key] }))}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                layers[key]
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow'
                  : 'bg-white/90 text-slate-600 border-slate-300'
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      )}

      <MapContainer
        center={activeCenter}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom={false}
        className="h-full w-full z-0"
      >
        <ChangeMapView center={activeCenter} />
        <CustomZoomControls initialCenter={activeCenter} initialZoom={zoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Legacy single routePolyline */}
        {layers.route && routePolyline.length > 1 && (
          <Polyline
            positions={routePolyline.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: '#16A34A', weight: 4, dashArray: '8, 8', opacity: 0.85 }}
          />
        )}

        {/* OR-Tools + OSRM multi-vehicle polylines, highlighted corridor & moving trucks */}
{layers.route &&
  optimizedRoutes.map((route, rIdx) => {
    const color = ROUTE_COLORS[rIdx % ROUTE_COLORS.length];
    const sim = simulatedVehicles?.find((v) => v.vehicle_id === route.vehicle_id);
    const isSelected = !selectedVehicleId || selectedVehicleId === route.vehicle_id;
    const opacity = isSelected ? 0.95 : 0.25;

    const fullPositions: [number, number][] = (route.geometry || []).map(
      ([lon, lat]) => [lat, lon]
    );

    return (
      <React.Fragment key={route.vehicle_id}>
        {/* Outer Highlight Halo for Active/Selected Route */}
        {isSelected && fullPositions.length > 1 && (
          <Polyline
            positions={fullPositions}
            pathOptions={{ color, weight: 11, opacity: 0.2 }}
          />
        )}

        {/* Traveled Road Segment (Muted) vs Remaining Route Ahead (Bold) */}
        {sim ? (
          <>
            {sim.traveled_positions.length > 1 && (
              <Polyline
                positions={sim.traveled_positions}
                pathOptions={{ color: '#94A3B8', weight: 4, opacity: 0.7 }}
              />
            )}
            {sim.remaining_positions.length > 1 && (
              <Polyline
                positions={sim.remaining_positions}
                pathOptions={{ color, weight: 5, opacity }}
              />
            )}
          </>
        ) : (
          fullPositions.length > 1 && (
            <Polyline
              positions={fullPositions}
              pathOptions={{ color, weight: 5, opacity }}
            />
          )
        )}

        {/* Numbered Stops along this route */}
        {layers.stops &&
          route.stops.map((stop) => {
            const isNextStop = sim?.next_stop_id === stop.stop_id && !sim.is_finished;
            return (
              <Marker
                key={`${route.vehicle_id}-${stop.stop_id}`}
                position={[stop.lat, stop.lon]}
                icon={createCustomIcon(
                  isNextStop ? '#DC2626' : color,
                  String(stop.sequence)
                )}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-sm text-slate-900">
                      #{stop.sequence} {stop.name}
                    </p>
                    <p className="text-slate-600">Assigned: {route.vehicle_id}</p>
                    <p className="text-slate-600">Load: {stop.demand_kg} kg</p>
                    <p className="text-emerald-700 font-semibold">
                      ML ETA: {stop.eta} ({stop.window})
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Smooth Road-Snapped Moving Truck Marker */}
        {layers.vehicles && sim && (
          <Marker
            position={[sim.lat, sim.lon]}
            icon={createCustomIcon(color, undefined, true)}
          >
            <Popup>
              <div className="p-1 text-xs">
                <p className="font-bold text-blue-700 text-sm">🚚 {sim.vehicle_id}</p>
                <p>Speed: {sim.speed_kmh} km/h • Progress: {sim.progress_pct}%</p>
                <p>Next: <strong>{sim.next_stop_name}</strong></p>
                <p className="font-semibold text-emerald-600">
                  Remaining: {sim.remaining_km} km ({sim.eta_minutes} min)
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </React.Fragment>
    );
  })}

        {/* Standard Stops */}
        {layers.stops &&
          stops.map((stop) => {
            const isPickup = stop.type === 'PICKUP';
            const color = isPickup ? '#16A34A' : stop.type === 'HUB' ? '#7C3AED' : '#2563EB';
            const isHighlighted = stop.id === highlightId;
            return (
              <Marker
                key={stop.id}
                position={[stop.location.lat, stop.location.lng]}
                icon={createCustomIcon(isHighlighted ? '#DC2626' : color, stop.seq ? `${stop.seq}` : undefined)}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-sm text-slate-900">{stop.name}</p>
                    <p className="text-slate-600">Type: {stop.type}</p>
                    {stop.expected_kg && <p className="text-slate-600">Expected: {stop.expected_kg} kg</p>}
                    {stop.eta && <p className="text-primary font-semibold">ETA: {stop.eta}</p>}
                    {stop.status && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {stop.status}
                      </span>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Hubs */}
        {layers.hubs &&
          hubs.map((hub) => (
            <Marker
              key={hub.id}
              position={[hub.location.lat, hub.location.lng]}
              icon={createCustomIcon('#9333EA', 'H')}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <p className="font-bold text-slate-900">{hub.name}</p>
                  <p className="text-slate-600 capitalize">Type: {hub.type} hub</p>
                  <p className="text-slate-600">Capacity: {hub.capacity_kg} kg</p>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Vehicles */}
        {layers.vehicles &&
          vehicles.map((v) => (
            <Marker
              key={v.id}
              position={[v.location.lat, v.location.lng]}
              icon={createCustomIcon('#2563EB', undefined, true)}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <p className="font-bold text-blue-700 text-sm">🚚 {v.name || 'Vehicle ' + v.id}</p>
                  {v.speed_kmh !== undefined && <p>Speed: {v.speed_kmh} km/h</p>}
                  {v.eta_minutes !== undefined && (
                    <p className="font-semibold text-emerald-600">Arriving in {v.eta_minutes} mins</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
};