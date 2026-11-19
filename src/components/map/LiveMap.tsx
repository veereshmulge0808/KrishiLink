import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LatLng, StopType, Hub } from '../../types';
import { BENGALURU_COORDS } from '../../lib/constants';

// Fix Leaflet's missing default icon paths in bundled environments
const defaultMarkerSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 24 24" fill="%2316A34A" stroke="%23ffffff" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="%23ffffff"/></svg>`;

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

interface LiveMapProps {
  center?: LatLng;
  zoom?: number;
  vehicles?: MapVehicle[];
  stops?: MapStop[];
  hubs?: Hub[];
  routePolyline?: LatLng[];
  highlightId?: string;
  className?: string;
  followVehicle?: boolean;
  showLayerControls?: boolean;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  center = BENGALURU_COORDS,
  zoom = 11,
  vehicles = [],
  stops = [],
  hubs = [],
  routePolyline = [],
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
        <div className="absolute top-3 right-3 z-[1000] flex flex-wrap gap-1 bg-white/90 p-1.5 rounded-xl shadow-md backdrop-blur-sm text-xs font-medium dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setLayers((l) => ({ ...l, vehicles: !l.vehicles }))}
            className={`px-2 py-1 rounded-lg ${layers.vehicles ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            🚚 Fleet
          </button>
          <button
            onClick={() => setLayers((l) => ({ ...l, stops: !l.stops }))}
            className={`px-2 py-1 rounded-lg ${layers.stops ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            📍 Stops
          </button>
          <button
            onClick={() => setLayers((l) => ({ ...l, hubs: !l.hubs }))}
            className={`px-2 py-1 rounded-lg ${layers.hubs ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            🏢 Hubs
          </button>
        </div>
      )}

      <MapContainer
        center={activeCenter}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full z-0"
      >
        <ChangeMapView center={activeCenter} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route Polyline */}
        {layers.route && routePolyline.length > 1 && (
          <Polyline
            positions={routePolyline.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: '#16A34A', weight: 4, dashArray: '8, 8', opacity: 0.85 }}
          />
        )}

        {/* Stops */}
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
