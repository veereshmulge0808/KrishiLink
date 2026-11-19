import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sprout, 
  PlusCircle, 
  Package, 
  TrendingUp, 
  Truck, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Sparkles,
  Info,
  DollarSign,
  Activity,
  ArrowUpRight
} from 'lucide-react';

export default function FarmerDashboard() {
  const { user, apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'post', 'orders'
  const [stats, setStats] = useState(null);
  const [produceList, setProduceList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Post form state
  const [cropName, setCropName] = useState('Tomato');
  const [category, setCategory] = useState('Vegetable');
  const [farmAreaAcres, setFarmAreaAcres] = useState(2.0);
  const [declaredQty, setDeclaredQty] = useState(500);
  const [pricePerKg, setPricePerKg] = useState(24);
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [harvestDate, setHarvestDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80');

  // ML Prediction preview state
  const [mlPreview, setMlPreview] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, produceData, ordersData, commData] = await Promise.all([
        apiFetch('/api/farmer/stats'),
        apiFetch('/api/farmer/produce'),
        apiFetch('/api/farmer/orders'),
        apiFetch('/api/v1/commodities')
      ]);
      setStats(statsData);
      setProduceList(produceData);
      setOrdersList(ordersData);
      setCommodities(commData);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update ML preview whenever key parameters change
  useEffect(() => {
    const fetchMlPreview = async () => {
      if (!cropName || declaredQty <= 0) return;
      try {
        setMlLoading(true);
        const [supplyRes, priceRes] = await Promise.all([
          apiFetch('/api/v1/forecast/supply', {
            method: 'POST',
            body: JSON.stringify({
              crop_name: cropName,
              zone: user?.zone || 'Hoskote',
              farm_area_acres: parseFloat(farmAreaAcres) || 1.0,
              declared_quantity_kg: parseFloat(declaredQty) || 100.0,
              quality_grade: qualityGrade,
              rainfall_14d: 14.0
            })
          }),
          apiFetch(`/api/v1/forecast/price?crop_name=${cropName}&zone=${user?.zone || 'Hoskote'}`)
        ]);
        setMlPreview({
          supply: supplyRes,
          price: priceRes
        });
      } catch (err) {
        console.error('ML preview error:', err);
      } finally {
        setMlLoading(false);
      }
    };

    const timer = setTimeout(fetchMlPreview, 400);
    return () => clearTimeout(timer);
  }, [cropName, declaredQty, farmAreaAcres, qualityGrade]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      await apiFetch('/api/farmer/produce', {
        method: 'POST',
        body: JSON.stringify({
          crop_name: cropName,
          category,
          farm_area_acres: parseFloat(farmAreaAcres),
          declared_quantity_kg: parseFloat(declaredQty),
          price_per_kg: parseFloat(pricePerKg),
          quality_grade: qualityGrade,
          harvest_date: harvestDate,
          image_url: imageUrl
        })
      });
      setSuccessMsg(`Successfully listed ${declaredQty}kg of ${cropName} on the B2B Marketplace!`);
      setActiveTab('inventory');
      fetchDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to post produce listing');
    }
  };

  const handleDeleteProduce = async (id) => {
    if (!confirm('Are you sure you want to remove this listing?')) return;
    try {
      await apiFetch(`/api/farmer/produce/${id}`, { method: 'DELETE' });
      fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to delete listing');
    }
  };

  const handleDispatch = async (orderId) => {
    try {
      await apiFetch(`/api/farmer/orders/${orderId}/dispatch-request`, { method: 'POST' });
      fetchDashboardData();
      alert('Logistics pickup request dispatched to carrier pool!');
    } catch (err) {
      alert(err.message || 'Failed to request dispatch');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-panel p-6 rounded-2xl border-emerald-900/40">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sprout className="w-4 h-4" />
            <span>Farm-Gate Supply Portal • Zone: {user?.zone}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Farmer Dashboard — {user?.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Empowered with XGBoost yield corrections and live wholesale price quantiles.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('post')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center space-x-1.5 shadow-lg shadow-emerald-950/60"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Harvest</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Header */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl border-emerald-900/30">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Listed Produce</span>
              <Package className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.total_listed_kg.toLocaleString()} <span className="text-xs font-normal text-slate-400">kg</span></div>
            <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center">
              <span>Available Stock: {stats.available_stock_kg.toLocaleString()} kg</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border-emerald-900/30">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Active Orders</span>
              <Truck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.active_orders} <span className="text-xs font-normal text-slate-400">in transit</span></div>
            <div className="text-[11px] text-blue-400/80 mt-1 flex items-center">
              <span>Completed: {stats.completed_orders} orders</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border-emerald-900/30">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Realized Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">₹{stats.total_revenue_rs.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-400/80 mt-1">
              <span>Direct B2B Settlements</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border-emerald-900/30">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Crop Diversity</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.total_produce_types} <span className="text-xs font-normal text-slate-400">varieties</span></div>
            <div className="text-[11px] text-amber-400/80 mt-1">
              <span>Standard 22-Crop Registry</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'inventory'
              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Listed Produce Inventory ({produceList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('post')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'post'
              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post Produce Form (Live ML)</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'orders'
              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Orders & Logistics Dispatch ({ordersList.length})</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-xs flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {/* Tab 1: Inventory Table */}
      {activeTab === 'inventory' && (
        <div className="glass-panel rounded-2xl overflow-hidden border-slate-800">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Active Farm Listings</h2>
            <span className="text-xs text-slate-400">Directly synchronized with Wholesale Buyer Catalog</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Produce</th>
                  <th className="px-6 py-3">Stock (Available / Total)</th>
                  <th className="px-6 py-3">AI Realizable Yield</th>
                  <th className="px-6 py-3">Unit Price</th>
                  <th className="px-6 py-3">Quality</th>
                  <th className="px-6 py-3">Harvest Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {produceList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&auto=format&fit=crop&q=80'}
                          alt={item.crop_name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                        />
                        <div>
                          <span className="font-semibold text-white text-sm">{item.crop_name}</span>
                          <span className="block text-[11px] text-slate-400">{item.category} • {item.farm_area_acres} acres</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{item.available_quantity_kg} kg</div>
                      <span className="text-[11px] text-slate-500">Declared: {item.declared_quantity_kg} kg</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 font-semibold text-[11px]">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>{item.predicted_actual_quantity_kg} kg</span>
                      </div>
                      <span className="block text-[10px] text-slate-500 mt-0.5">80% Conf: [{item.lower_bound_10_kg} - {item.upper_bound_90_kg}]</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-sm">₹{item.price_per_kg} <span className="text-[10px] font-normal text-slate-400">/kg</span></div>
                      {item.market_price_p50 > 0 && (
                        <span className="text-[10px] text-slate-500">Mandi Modal: ₹{item.market_price_p50}/kg</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.quality_grade === 'Grade A' ? 'badge-grade-a' : (item.quality_grade === 'Grade B' ? 'badge-grade-b' : 'badge-faq')
                      }`}>
                        {item.quality_grade}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-slate-300">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        <span>{item.harvest_date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.status === 'AVAILABLE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteProduce(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Remove Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Post Produce Form with Live ML */}
      {activeTab === 'post' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border-slate-800">
            <h2 className="text-base font-bold text-white mb-1">Post Produce & Declare Expected Harvest</h2>
            <p className="text-xs text-slate-400 mb-6">
              Input harvest declarations to trigger real-time AI yield calibrations and price recommendations.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handlePostSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Crop Name (22 Standardized)</label>
                  <select
                    value={cropName}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setCropName(selected);
                      const meta = commodities.find(c => c.crop_name === selected);
                      if (meta) setCategory(meta.category);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {commodities.map((c) => (
                      <option key={c.crop_name} value={c.crop_name}>
                        {c.crop_name} ({c.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    disabled
                    value={category}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Farm Area (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={farmAreaAcres}
                    onChange={(e) => setFarmAreaAcres(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Declared Quantity (kg)</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={declaredQty}
                    onChange={(e) => setDeclaredQty(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Asking Price (₹/kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quality Grade</label>
                  <select
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Grade B">Grade B (Standard)</option>
                    <option value="FAQ">FAQ (Fair Average)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Harvest Date</label>
                  <input
                    type="date"
                    required
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Produce Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 text-xs font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-950/60 flex items-center justify-center space-x-2 mt-4"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publish to B2B Buyer Marketplace</span>
              </button>
            </form>
          </div>

          {/* Live ML Intelligence Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel p-6 rounded-2xl border-emerald-700/40 glow-emerald">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Real-Time ML Yield & Price Calibration</span>
                </div>
                {mlLoading && <span className="text-[10px] text-emerald-400 animate-pulse">Running Inference...</span>}
              </div>

              {mlPreview ? (
                <div className="space-y-5">
                  {/* Yield Prediction */}
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-emerald-900/50">
                    <span className="text-[11px] font-medium text-slate-400 block mb-1">Predicted Actual Yield (supply_model.pkl)</span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-display font-extrabold text-white">
                        {mlPreview.supply.predicted_actual_quantity_kg} <span className="text-sm font-normal text-slate-400">kg</span>
                      </span>
                      <span className="text-xs text-emerald-400 font-semibold">
                        ({Math.round((mlPreview.supply.predicted_actual_quantity_kg / declaredQty) * 100)}% of declared)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      80% Confidence Interval: <strong className="text-emerald-300">[{mlPreview.supply.lower_bound_10_kg} kg – {mlPreview.supply.upper_bound_90_kg} kg]</strong>
                    </div>
                  </div>

                  {/* Wholesale Price Quantiles */}
                  {mlPreview.price?.forecast_quantiles && (
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                      <span className="text-[11px] font-medium text-slate-400 block mb-2">Wholesale Price Range (price_model.pkl)</span>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">p10 Floor</span>
                          <span className="text-sm font-bold text-slate-300">₹{mlPreview.price.forecast_quantiles.p10_floor_rs_kg}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60">
                          <span className="text-[10px] text-emerald-400 block">p50 Modal</span>
                          <span className="text-base font-extrabold text-emerald-300">₹{mlPreview.price.forecast_quantiles.p50_modal_rs_kg}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">p90 Ceiling</span>
                          <span className="text-sm font-bold text-slate-300">₹{mlPreview.price.forecast_quantiles.p90_ceiling_rs_kg}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 text-center">
                        Benchmark based on APMC K.R. Market wholesale arrivals.
                      </p>
                    </div>
                  )}

                  {/* SHAP Attributions */}
                  {mlPreview.supply?.top_shap_drivers && (
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block mb-2 flex items-center">
                        <Info className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        Top SHAP Attribution Drivers:
                      </span>
                      <div className="space-y-1.5">
                        {mlPreview.supply.top_shap_drivers.map((drv, i) => (
                          <div key={i} className="text-[11px] p-2 rounded-lg bg-slate-900/50 border border-slate-800/80 flex items-start justify-between">
                            <span className="text-slate-300">{drv.description}</span>
                            <span className={`font-mono font-semibold ml-2 text-right ${
                              drv.impact < 0 ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {drv.impact > 0 ? `+${drv.impact}` : drv.impact}kg
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Fill in crop and acreage parameters to calculate real-time ML calibrations.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Orders & Logistics Dispatch */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="px-1 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Incoming Buyer Orders & Logistics Fulfillment</h2>
            <span className="text-xs text-slate-400">Directly synchronized with carrier vehicle fleets</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {ordersList.map(({ order, shipment }) => (
              <div key={order.id} className="glass-panel p-5 rounded-2xl border-slate-800 hover:border-slate-700 transition">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-base">{order.crop_name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                        {order.quantity_kg} kg
                      </span>
                      <span className="text-xs font-mono text-slate-400">Order #{order.id}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Buyer: <strong className="text-slate-200">{order.buyer_name}</strong> • Destination: {order.delivery_address}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-white">₹{order.crop_subtotal_rs}</span>
                    <span className={`block text-xs font-semibold mt-0.5 ${
                      order.status === 'DELIVERED' ? 'text-emerald-400' : (order.status === 'IN_TRANSIT' ? 'text-blue-400' : 'text-amber-400')
                    }`}>
                      Status: {order.status}
                    </span>
                  </div>
                </div>

                {/* Logistics status banner */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 text-xs">
                  <div>
                    <span className="text-slate-400">Transport Task: </span>
                    {shipment ? (
                      <span className="font-semibold text-slate-200">
                        Milestone: <span className="text-emerald-400 font-bold">{shipment.current_milestone}</span>
                        {shipment.driver_name && ` • Driver: ${shipment.driver_name} (${shipment.vehicle_type} - ${shipment.vehicle_number})`}
                        {shipment.eta_minutes > 0 && ` • ETA: ~${shipment.eta_minutes} mins`}
                      </span>
                    ) : (
                      <span className="text-amber-400 font-medium">Pickup not yet requested</span>
                    )}
                  </div>

                  {!shipment && (
                    <button
                      onClick={() => handleDispatch(order.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition"
                    >
                      Request Logistics Pickup
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
