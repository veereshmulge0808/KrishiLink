import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Thermometer, 
  Phone, 
  Navigation, 
  ArrowRight,
  ShieldAlert,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function LogisticsDashboard() {
  const { user, apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' or 'trips'
  const [stats, setStats] = useState(null);
  const [marketplace, setMarketplace] = useState([]);
  const [myTrips, setMyTrips] = useState([]);
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Accept job modal state
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('V_KA01_AB_1001');

  // Selected trip for telemetry & details
  const [activeTripDetail, setActiveTripDetail] = useState(null);

  const fetchLogisticsData = async () => {
    try {
      setLoading(true);
      const [statsData, marketData, tripsData, fleetData] = await Promise.all([
        apiFetch('/api/logistics/stats'),
        apiFetch('/api/logistics/marketplace'),
        apiFetch('/api/logistics/my-trips'),
        apiFetch('/api/logistics/fleet')
      ]);
      setStats(statsData);
      setMarketplace(marketData);
      setMyTrips(tripsData);
      setFleetVehicles(fleetData);
      if (tripsData.length > 0 && !activeTripDetail) {
        setActiveTripDetail(tripsData[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load logistics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogisticsData();
  }, []);

  const handleAcceptShipment = async (e) => {
    e.preventDefault();
    if (!selectedShipment) return;
    try {
      await apiFetch(`/api/logistics/shipments/${selectedShipment.id}/accept`, {
        method: 'POST',
        body: JSON.stringify({ vehicle_id: selectedVehicleId })
      });
      setSelectedShipment(null);
      fetchLogisticsData();
      setActiveTab('trips');
    } catch (err) {
      alert(err.message || 'Failed to accept shipment');
    }
  };

  const handleMilestoneUpdate = async (shipmentId, newMilestone) => {
    try {
      const res = await apiFetch(`/api/logistics/shipments/${shipmentId}/milestone`, {
        method: 'POST',
        body: JSON.stringify({ milestone: newMilestone })
      });
      setActiveTripDetail(res.shipment);
      fetchLogisticsData();
    } catch (err) {
      alert(err.message || 'Failed to update milestone');
    }
  };

  const handleTelemetryUpdate = async (shipmentId, temp, eta) => {
    try {
      const res = await apiFetch(`/api/logistics/shipments/${shipmentId}/telemetry`, {
        method: 'POST',
        body: JSON.stringify({
          current_lat: activeTripDetail.current_lat || 12.9716,
          current_lng: activeTripDetail.current_lng || 77.5946,
          ambient_temp_c: parseFloat(temp),
          eta_minutes: parseInt(eta)
        })
      });
      setActiveTripDetail(res.shipment);
      fetchLogisticsData();
    } catch (err) {
      alert(err.message || 'Failed to update telemetry');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-panel p-6 rounded-2xl border-blue-900/40">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" />
            <span>Fleet Logistics Mission Control • {user?.zone} Depot</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Logistics Provider — {user?.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Direct multi-stop pickup and delivery using 1,000kg small commercial vehicle fleet.
          </p>
        </div>

        <button
          onClick={fetchLogisticsData}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition flex items-center space-x-2 text-xs"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Fleet Status</span>
        </button>
      </div>

      {/* Fleet KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl border-blue-900/30">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Fleet Vehicles</span>
              <Truck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.fleet_vehicles_count} <span className="text-xs font-normal text-slate-400">units</span></div>
            <div className="text-[11px] text-blue-400/80 mt-1">
              Tata Ace Gold, Bolero, Dost
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border-blue-900/30">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Payload Capacity</span>
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.total_payload_capacity_kg.toLocaleString()} <span className="text-xs font-normal text-slate-400">kg</span></div>
            <div className="text-[11px] text-slate-400 mt-1">
              1,000 kg standard payload/van
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border-blue-900/30">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Marketplace Job Requests</span>
              <Package className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{stats.pending_shipment_requests} <span className="text-xs font-normal text-slate-400">waiting</span></div>
            <div className="text-[11px] text-amber-400/80 mt-1">
              Available for immediate pickup
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border-blue-900/30">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Active Dispatches</span>
              <Navigation className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{stats.active_deliveries} <span className="text-xs font-normal text-slate-400">on road</span></div>
            <div className="text-[11px] text-emerald-400/80 mt-1">
              Completed: {stats.completed_deliveries} deliveries
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'marketplace'
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Shipment Marketplace Pool ({marketplace.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('trips')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'trips'
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Active Trips & Fleet Manager ({myTrips.length})</span>
        </button>
      </div>

      {/* Tab 1: Marketplace Request Pool */}
      {activeTab === 'marketplace' && (
        <div className="space-y-4">
          <div className="px-1 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Pending Transport Requests from Farmers & Buyers</h2>
            <span className="text-xs text-slate-400">Accept and assign to available fleet vehicles</span>
          </div>

          {marketplace.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center text-slate-500 text-sm">
              No unassigned shipment requests in the marketplace right now. Place a new order in the Buyer portal to spawn a transport task!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketplace.map(({ shipment, estimated_payout_rs, spoilage_risk_score }) => (
                <div key={shipment.id} className="glass-panel p-5 rounded-2xl border-slate-800 hover:border-blue-700/50 transition space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-display font-bold text-lg text-white">{shipment.crop_name}</span>
                      <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
                        {shipment.load_weight_kg} kg
                      </span>
                      <p className="text-xs text-slate-400 mt-1 font-mono">Job #{shipment.id}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-extrabold text-emerald-400">₹{estimated_payout_rs}</span>
                      <span className="block text-[11px] text-slate-400 font-medium">Estimated Carrier Payout</span>
                    </div>
                  </div>

                  {/* Route points */}
                  <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800/70 space-y-2 text-xs">
                    <div className="flex items-start space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                      <div>
                        <span className="text-slate-400">Pickup Origin: </span>
                        <span className="font-semibold text-white">{shipment.farmer_name}</span>
                        <p className="text-[11px] text-slate-400">{shipment.pickup_address}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                      <div>
                        <span className="text-slate-400">Delivery Destination: </span>
                        <span className="font-semibold text-white">{shipment.buyer_name}</span>
                        <p className="text-[11px] text-slate-400">{shipment.delivery_address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Operational indicators */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center">
                        <Navigation className="w-3.5 h-3.5 text-blue-400 mr-1" />
                        {shipment.distance_km} km
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 text-slate-400 mr-1" />
                        ~{shipment.eta_minutes} mins
                      </span>
                    </div>

                    {/* Spoilage Risk Badge */}
                    <div className="flex items-center space-x-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center space-x-1 ${
                        spoilage_risk_score > 60
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        <Thermometer className="w-3 h-3 mr-0.5" />
                        <span>Perishability Risk: {spoilage_risk_score}%</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedShipment(shipment);
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center justify-center space-x-1.5 shadow-lg shadow-blue-950/60"
                  >
                    <span>Accept Job & Assign Fleet Vehicle</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Active Trips & Fleet Manager */}
      {activeTab === 'trips' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Trips List Column */}
          <div className="lg:col-span-5 space-y-3">
            <h2 className="text-base font-bold text-white px-1">Active Fleet Deliveries</h2>
            
            {myTrips.length === 0 ? (
              <div className="glass-panel p-6 rounded-2xl text-center text-slate-500 text-xs">
                No active trips. Accept a shipment from the Marketplace pool.
              </div>
            ) : (
              myTrips.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setActiveTripDetail(s)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    activeTripDetail?.id === s.id
                      ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-950/50'
                      : 'glass-panel border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-sm">{s.crop_name} ({s.load_weight_kg} kg)</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      s.current_milestone === 'DELIVERED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}>
                      {s.current_milestone}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-2">
                    {s.farmer_name} → {s.buyer_name}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Vehicle: {s.vehicle_number || s.vehicle_type}</span>
                    <span>ETA: {s.eta_minutes} mins</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Active Trip Detail & Milestone Manager Column */}
          <div className="lg:col-span-7">
            {activeTripDetail ? (
              <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-bold text-white">Trip Management & Milestones</h2>
                    <span className="text-xs font-mono text-blue-400">Shipment #{activeTripDetail.id}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Vehicle: <strong className="text-slate-200">{activeTripDetail.vehicle_type} ({activeTripDetail.vehicle_number})</strong> • Driver: {activeTripDetail.driver_name}
                  </p>
                </div>

                {/* Interactive Milestone Stepper */}
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 block mb-3">Update Current Milestone Stage</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { key: 'ASSIGNED', label: '1. Assigned' },
                      { key: 'PICKED_UP', label: '2. Picked Up' },
                      { key: 'IN_TRANSIT', label: '3. In Transit' },
                      { key: 'OUT_FOR_DELIVERY', label: '4. Out for Deliv' },
                      { key: 'DELIVERED', label: '5. Delivered' }
                    ].map((step) => (
                      <button
                        key={step.key}
                        onClick={() => handleMilestoneUpdate(activeTripDetail.id, step.key)}
                        className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition border ${
                          activeTripDetail.current_milestone === step.key
                            ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {step.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    *Advancing milestone automatically updates the Order status for both Farmer and Buyer in real-time.
                  </p>
                </div>

                {/* Telemetry Control Panel */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
                  <span className="text-xs font-semibold text-slate-300 block">Live Telemetry & Cargo Conditions</span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Ambient Cargo Temp (°C)</label>
                      <div className="flex items-center space-x-2">
                        <Thermometer className="w-4 h-4 text-amber-400" />
                        <input
                          type="number"
                          step="0.5"
                          value={activeTripDetail.ambient_temp_c || 28.5}
                          onChange={(e) => handleTelemetryUpdate(activeTripDetail.id, e.target.value, activeTripDetail.eta_minutes)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Estimated Arrival (Minutes)</label>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <input
                          type="number"
                          value={activeTripDetail.eta_minutes || 20}
                          onChange={(e) => handleTelemetryUpdate(activeTripDetail.id, activeTripDetail.ambient_temp_c, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Current Spoilage Risk Score:</span>
                    <span className="font-bold text-emerald-400">{activeTripDetail.perishability_score}% (Low Risk)</span>
                  </div>
                </div>

                {/* Route Visualizer */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 block mb-2">Road Route Trajectory</span>
                  <div className="h-32 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/20 via-blue-950/20 to-purple-950/20" />
                    <svg className="w-full h-full p-4" viewBox="0 0 400 80">
                      {/* Path */}
                      <path
                        d="M 30,40 Q 200,10 370,40"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeDasharray="6 4"
                      />
                      {/* Origin Pin */}
                      <circle cx="30" cy="40" r="7" fill="#10b981" />
                      <text x="30" y="65" fill="#a7f3d0" fontSize="10" textAnchor="middle">Farm Origin</text>
                      
                      {/* Vehicle Current Position */}
                      <circle cx="210" cy="24" r="9" fill="#3b82f6" />
                      <text x="210" y="10" fill="#93c5fd" fontSize="10" textAnchor="middle">Van V-1001</text>
                      
                      {/* Destination Pin */}
                      <circle cx="370" cy="40" r="7" fill="#f59e0b" />
                      <text x="370" y="65" fill="#fde68a" fontSize="10" textAnchor="middle">Buyer Depot</text>
                    </svg>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>Pickup: {activeTripDetail.pickup_address}</span>
                    <span>Drop: {activeTripDetail.delivery_address}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-8 rounded-2xl text-center text-slate-500 text-sm">
                Select a trip from the left panel to manage milestones and telemetry.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accept Job Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setSelectedShipment(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl"
            >
              ×
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Assign Fleet Vehicle & Accept Job</h3>
            <p className="text-xs text-slate-400 mb-4">
              Select an available vehicle from your fleet specification ({selectedShipment.load_weight_kg} kg payload required).
            </p>

            <form onSubmit={handleAcceptShipment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Available Fleet Vehicles (1000kg standard)</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {fleetVehicles.map((v) => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.vehicle_type} ({v.vehicle_id}) • Driver: {v.driver_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Cargo:</span>
                  <span className="font-semibold text-white">{selectedShipment.crop_name} ({selectedShipment.load_weight_kg} kg)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Route Distance:</span>
                  <span className="font-semibold text-white">{selectedShipment.distance_km} km</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Payout:</span>
                  <span className="font-bold text-emerald-400">₹{Math.round(selectedShipment.distance_km * 18 + 150)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-950/60"
              >
                Confirm Job Assignment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
