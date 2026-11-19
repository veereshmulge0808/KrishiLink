import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  MapPin, 
  Truck, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  Thermometer, 
  Phone, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function BuyerDashboard() {
  const { user, apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' or 'orders'
  const [catalog, setCatalog] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [searchCrop, setSearchCrop] = useState('');

  // Checkout modal state
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [orderQty, setOrderQty] = useState(100);
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  // Tracking modal / view state
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState(null);
  const [trackingData, setTrackingData] = useState(null);

  const fetchCatalogAndOrders = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedCategory !== 'all') queryParams.append('category', selectedCategory);
      if (selectedZone !== 'all') queryParams.append('zone', selectedZone);
      if (selectedGrade !== 'all') queryParams.append('quality_grade', selectedGrade);
      if (searchCrop) queryParams.append('crop_name', searchCrop);

      const [catData, ordData] = await Promise.all([
        apiFetch(`/api/buyer/catalog?${queryParams.toString()}`),
        apiFetch('/api/buyer/orders')
      ]);
      setCatalog(catData);
      setOrders(ordData);
    } catch (err) {
      setError(err.message || 'Failed to load buyer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogAndOrders();
  }, [selectedCategory, selectedZone, selectedGrade, searchCrop]);

  const handleOpenCheckout = (catalogEntry) => {
    setCheckoutItem(catalogEntry);
    setOrderQty(Math.min(100, catalogEntry.item.available_quantity_kg));
    setDeliveryAddress(user?.address || 'K.R. Market Wholesale Depot, Bengaluru');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!checkoutItem) return;
    try {
      setCheckoutLoading(true);
      const res = await apiFetch('/api/buyer/orders', {
        method: 'POST',
        body: JSON.stringify({
          produce_id: checkoutItem.item.id,
          quantity_kg: parseFloat(orderQty),
          delivery_date: deliveryDate,
          delivery_address: deliveryAddress
        })
      });
      setSuccessOrder(res.order);
      setCheckoutItem(null);
      fetchCatalogAndOrders();
      setActiveTab('orders');
    } catch (err) {
      alert(err.message || 'Failed to place order');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleViewTracking = async (orderId) => {
    try {
      const data = await apiFetch(`/api/buyer/orders/${orderId}/tracking`);
      setTrackingData(data);
      setSelectedTrackingOrder(orderId);
    } catch (err) {
      alert(err.message || 'Failed to fetch tracking data');
    }
  };

  // Cost calculations in checkout
  const cropCost = checkoutItem ? Math.round(orderQty * checkoutItem.item.price_per_kg) : 0;
  const distKm = checkoutItem ? checkoutItem.distance_km : 15;
  const estimatedFreight = Math.round(150 + distKm * 18 + Math.max(0, orderQty - 50) * 1.5);
  const totalAmount = cropCost + estimatedFreight;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-panel p-6 rounded-2xl border-amber-900/40">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span>Commercial Wholesale Procurement • {user?.zone} Facility</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Buyer Dashboard — {user?.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Source verified farm-gate produce with transparent logistics fee calculation and live milestone tracking.
          </p>
        </div>

        <button
          onClick={fetchCatalogAndOrders}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition flex items-center space-x-2 text-xs"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Marketplace</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'catalog'
              ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Marketplace Catalog ({catalog.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'orders'
              ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>My Orders & Live Tracking ({orders.length})</span>
        </button>
      </div>

      {/* Tab 1: Marketplace Catalog */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="glass-panel p-4 rounded-xl border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Category */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                {['all', 'Vegetable', 'Fruit'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition capitalize ${
                      selectedCategory === cat
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Zone Filter */}
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Zones</option>
                <option value="Hoskote">Hoskote</option>
                <option value="Nelamangala">Nelamangala</option>
                <option value="Bengaluru North">Bengaluru North</option>
                <option value="Bengaluru South">Bengaluru South</option>
                <option value="Bengaluru East">Bengaluru East</option>
              </select>

              {/* Grade Filter */}
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Grades</option>
                <option value="Grade A">Grade A (Premium)</option>
                <option value="Grade B">Grade B (Standard)</option>
                <option value="FAQ">FAQ</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search crops..."
                value={searchCrop}
                onChange={(e) => setSearchCrop(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-44"
              />
            </div>
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalog.map(({ item, distance_km, estimated_logistics_fee_per_100kg }) => (
              <div key={item.id} className="glass-panel rounded-2xl overflow-hidden border-slate-800 hover:border-amber-700/50 transition group flex flex-col justify-between">
                <div>
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'}
                      alt={item.crop_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-3 left-3 flex space-x-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.quality_grade === 'Grade A' ? 'badge-grade-a' : (item.quality_grade === 'Grade B' ? 'badge-grade-b' : 'badge-faq')
                      }`}>
                        {item.quality_grade}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-950/80 text-slate-300 border border-slate-700">
                        {item.category}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-slate-300">
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 text-emerald-400 mr-1" />
                        {item.zone} ({distance_km} km)
                      </span>
                      <span className="font-semibold text-emerald-300">
                        {item.available_quantity_kg} kg available
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display font-bold text-lg text-white">{item.crop_name}</h3>
                        <p className="text-xs text-slate-400">Farm Gate: <strong className="text-slate-300">{item.farmer_name}</strong></p>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-display font-extrabold text-white">₹{item.price_per_kg}</span>
                        <span className="text-xs text-slate-400 block font-normal">/kg</span>
                      </div>
                    </div>

                    {/* Mandi benchmark reference badge */}
                    {item.market_price_p50 > 0 && (
                      <div className="text-[11px] p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 flex items-center justify-between">
                        <span>Wholesale Mandi Median:</span>
                        <span className="font-semibold text-slate-200">₹{item.market_price_p50}/kg</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => handleOpenCheckout({ item, distance_km })}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-950/60"
                  >
                    <span>Procure Produce</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Orders & Live Tracking */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="px-1 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Commercial Procurement Orders</h2>
            <span className="text-xs text-slate-400">Click any order to inspect real-time fleet telemetry</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {orders.map(({ order, shipment }) => (
              <div
                key={order.id}
                className="glass-panel p-5 rounded-2xl border-slate-800 hover:border-amber-700/50 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-display font-bold text-lg text-white">{order.crop_name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
                        {order.quantity_kg} kg
                      </span>
                      <span className="text-xs font-mono text-slate-500">#{order.id}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Farmer: <strong className="text-slate-300">{order.farmer_name}</strong> • Delivery Date: {order.delivery_date}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-extrabold text-white">₹{order.total_amount_rs}</span>
                    <span className="text-xs text-slate-400 block">
                      (Produce ₹{order.crop_subtotal_rs} + Freight ₹{order.logistics_fee_rs})
                    </span>
                  </div>
                </div>

                {/* Tracking Progress Bar */}
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Fulfillment Status: <strong className="text-emerald-400">{shipment?.current_milestone || order.status}</strong></span>
                    {shipment?.eta_minutes > 0 && (
                      <span className="text-blue-400 font-mono flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" /> ETA: ~{shipment.eta_minutes} mins
                      </span>
                    )}
                  </div>

                  {/* 5-Step Visual Progress Bar */}
                  <div className="relative flex items-center justify-between text-[11px] text-slate-400 pt-2">
                    {['PLACED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].map((ms, idx) => {
                      const currentMs = shipment?.current_milestone || order.status;
                      const milestones = ['PLACED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                      const activeIdx = milestones.indexOf(currentMs);
                      const stepIdx = milestones.indexOf(ms);
                      const isComplete = activeIdx >= stepIdx;

                      return (
                        <div key={ms} className="flex flex-col items-center flex-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition ${
                            isComplete ? 'bg-emerald-500 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className={`text-[10px] text-center capitalize ${
                            isComplete ? 'text-slate-200 font-semibold' : 'text-slate-600'
                          }`}>
                            {ms.replace('_', ' ').toLowerCase()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs text-slate-400">
                    {shipment?.driver_name ? (
                      <span>Carrier: <strong className="text-slate-200">{shipment.driver_name}</strong> ({shipment.vehicle_number || shipment.vehicle_type})</span>
                    ) : (
                      <span>Carrier: <span className="text-amber-400">Awaiting carrier dispatch</span></span>
                    )}
                  </div>

                  <button
                    onClick={() => handleViewTracking(order.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center space-x-1.5"
                  >
                    <span>View Live Map & Telemetry</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setCheckoutItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl"
            >
              ×
            </button>

            <h3 className="text-xl font-display font-bold text-white mb-1">Procurement Checkout</h3>
            <p className="text-xs text-slate-400 mb-6">
              Crop: <strong className="text-white">{checkoutItem.item.crop_name}</strong> ({checkoutItem.item.quality_grade}) • Origin: {checkoutItem.item.farmer_name} ({checkoutItem.item.zone})
            </p>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Procurement Quantity (kg) • Available: {checkoutItem.item.available_quantity_kg} kg
                </label>
                <input
                  type="number"
                  min="10"
                  max={checkoutItem.item.available_quantity_kg}
                  required
                  value={orderQty}
                  onChange={(e) => setOrderQty(Math.max(10, Math.min(checkoutItem.item.available_quantity_kg, parseFloat(e.target.value) || 10)))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Delivery Destination Address</label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Requested Delivery Date</label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              {/* Transparent Cost Breakdown */}
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="font-semibold text-slate-300 block mb-1">Transparent Cost Breakdown</span>
                <div className="flex justify-between text-slate-400">
                  <span>Crop Subtotal ({orderQty} kg × ₹{checkoutItem.item.price_per_kg}/kg):</span>
                  <span className="font-semibold text-white">₹{cropCost}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Logistics Transportation Fee ({distKm} km):</span>
                  <span className="font-semibold text-white">₹{estimatedFreight}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm">
                  <span className="font-bold text-slate-200">Total Payable Amount:</span>
                  <span className="font-extrabold text-amber-400 text-base">₹{totalAmount}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={checkoutLoading}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition shadow-lg shadow-amber-950/60 flex items-center justify-center space-x-2"
              >
                {checkoutLoading ? 'Dispatching Order...' : 'Confirm & Dispatch Logistics Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tracking Modal with Live Route Trajectory */}
      {selectedTrackingOrder && trackingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-2xl p-6 rounded-2xl border border-slate-700 shadow-2xl relative space-y-5">
            <button
              onClick={() => { setSelectedTrackingOrder(null); setTrackingData(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl"
            >
              ×
            </button>

            <div>
              <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Live Fleet Telemetry & Order Status</span>
              <h3 className="text-xl font-display font-bold text-white">
                {trackingData.order.crop_name} ({trackingData.order.quantity_kg} kg) • Order #{trackingData.order.id}
              </h3>
              <p className="text-xs text-slate-400">
                Destination: {trackingData.order.delivery_address}
              </p>
            </div>

            {/* Stepper */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                {trackingData.milestone_steps.map((step, idx) => {
                  const isPast = idx <= trackingData.milestone_index;
                  return (
                    <div key={step.key} className="flex flex-col items-center flex-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                        isPast ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className={`text-[10px] text-center ${isPast ? 'text-white font-semibold' : 'text-slate-600'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Driver & Telemetry */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-semibold mb-1">Carrier Details</span>
                <div>Driver: <strong className="text-white">{trackingData.carrier_details.driver_name || 'Assigned Driver'}</strong></div>
                <div>Phone: <strong className="text-white">{trackingData.carrier_details.driver_phone || '+91-9845011101'}</strong></div>
                <div>Vehicle: <strong className="text-white">{trackingData.carrier_details.vehicle_type} ({trackingData.carrier_details.vehicle_number || 'KA-01-AB-1001'})</strong></div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-semibold mb-1">Live Cargo Metrics</span>
                <div>ETA: <strong className="text-blue-400">{trackingData.carrier_details.eta_minutes || 15} minutes</strong></div>
                <div>Cargo Temp: <strong className="text-amber-400">{trackingData.carrier_details.ambient_temp_c || 28.5}°C</strong></div>
                <div>Perishability Index: <strong className="text-emerald-400">{trackingData.carrier_details.perishability_score || 25}% (Fresh)</strong></div>
              </div>
            </div>

            {/* Simulated Road Trajectory Route */}
            <div className="h-40 bg-slate-950 rounded-xl border border-slate-800 p-4 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 500 100">
                <path
                  d="M 40,50 Q 250,15 460,50"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeDasharray="8 6"
                />
                <circle cx="40" cy="50" r="8" fill="#10b981" />
                <text x="40" y="80" fill="#a7f3d0" fontSize="11" textAnchor="middle">Farm Origin</text>
                
                <circle cx="270" cy="30" r="10" fill="#3b82f6" />
                <text x="270" y="15" fill="#93c5fd" fontSize="11" textAnchor="middle">Vehicle in Transit</text>
                
                <circle cx="460" cy="50" r="8" fill="#f59e0b" />
                <text x="460" y="80" fill="#fde68a" fontSize="11" textAnchor="middle">Buyer Facility</text>
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
