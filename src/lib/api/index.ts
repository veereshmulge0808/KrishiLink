import { mockDb } from './mock/db';
import { delay, ApiError } from './client';
import { mockRealtime } from '../realtime/mockRealtime';
import {
  Crop,
  Order,
  FarmerListing,
  Trip,
  Hub,
  StockStatus,
  TransferRequest,
  MLPriceForecast,
  MLDemandForecast,
  FarmerSettlement,
  AlertItem,
} from '../../types';

// ==================== 1. CATALOG & CROPS ====================

export async function getCrops(params?: {
  query?: string;
  category?: string;
  organic?: boolean;
}): Promise<Crop[]> {
  await delay(180);
  let list = [...mockDb.crops];
  if (params?.query) {
    const q = params.query.toLowerCase();
    list = list.filter(
      (c) =>
        c.name_en.toLowerCase().includes(q) ||
        c.name_kn.toLowerCase().includes(q)
    );
  }
  if (params?.category && params.category !== 'all') {
    list = list.filter((c) => c.category === params.category);
  }
  if (params?.organic !== undefined) {
    list = list.filter((c) => !!c.is_organic === params.organic);
  }
  return list;
}

export async function getCropById(id: string): Promise<Crop> {
  await delay(120);
  const crop = mockDb.crops.find((c) => c.id === id);
  if (!crop) throw new ApiError('NOT_FOUND', 'Crop not found');
  return crop;
}

export async function getTodayPrices(): Promise<{ crop_id: string; price: any }[]> {
  await delay(150);
  return mockDb.crops.map((c) => ({
    crop_id: c.id,
    price: c.price,
  }));
}

// ==================== 2. BUYER ENDPOINTS ====================

export async function createOrder(data: {
  delivery_date: string;
  slot: string;
  payment_mode: 'PREPAID' | 'CREDIT' | 'UPI';
  items: { crop_id: string; qty_kg: number }[];
  address?: string;
  buyer_id?: string;
}): Promise<Order> {
  await delay(350);

  let totalPaise = 0;
  const processedItems = data.items.map((it) => {
    const crop = mockDb.crops.find((c) => c.id === it.crop_id);
    if (!crop) throw new ApiError('NOT_FOUND', `Crop ${it.crop_id} not found`);

    // Lock price at confirmation: min(high, low + margin)
    const lockedPrice = crop.price.low + Math.round((crop.price.high - crop.price.low) * 0.4);
    totalPaise += lockedPrice * it.qty_kg;

    // Simulate occasional partial fulfillment for French beans
    let note: 'FULL' | 'PARTIAL' = 'FULL';
    let confirmedKg = it.qty_kg;
    let substitutes: string[] | undefined;

    if (crop.id === 'c_beans' && it.qty_kg > 20) {
      note = 'PARTIAL';
      confirmedKg = Math.round(it.qty_kg * 0.7);
      substitutes = ['c_capsicum', 'c_cabbage'];
    }

    return {
      crop_id: it.crop_id,
      qty_kg: it.qty_kg,
      confirmed_kg: confirmedKg,
      price_per_kg_locked: lockedPrice,
      note,
      substitute_suggestions: substitutes,
      crop,
    };
  });

  const orderId = 'order_' + Math.floor(100 + Math.random() * 900);
  const newOrder: Order = {
    id: orderId,
    buyer_id: data.buyer_id || 'u_buyer_1',
    delivery_date: data.delivery_date,
    slot: data.slot,
    payment_mode: data.payment_mode,
    payment_status: 'SUCCESS',
    status: 'CONFIRMED',
    items: processedItems,
    total: totalPaise,
    address: data.address || 'Udupi Upahar, 14th Main, HSR Layout, Bengaluru',
    location: { lat: 12.9116, lng: 77.6389 },
    created_at: new Date().toISOString(),
    delivery_otp: Math.floor(1000 + Math.random() * 9000).toString(),
  };

  mockDb.orders.unshift(newOrder);

  // Broadcast to admin:live
  mockRealtime.broadcast('admin:live', 'alert', {
    id: 'alt_' + Date.now(),
    type: 'NEW_ORDER',
    severity: 'low',
    title: `New bulk order: ${orderId}`,
    message: `${newOrder.items.length} items ordered for tomorrow morning delivery.`,
    timestamp: new Date().toISOString(),
  });

  return newOrder;
}

export async function getOrders(status?: string): Promise<Order[]> {
  await delay(180);
  if (status) {
    return mockDb.orders.filter((o) => o.status === status);
  }
  return [...mockDb.orders];
}

export async function getOrderById(id: string): Promise<Order> {
  await delay(120);
  const order = mockDb.orders.find((o) => o.id === id);
  if (!order) throw new ApiError('NOT_FOUND', 'Order not found');
  return order;
}

export async function cancelOrder(id: string): Promise<{ success: boolean }> {
  await delay(200);
  const order = mockDb.orders.find((o) => o.id === id);
  if (!order) throw new ApiError('NOT_FOUND', 'Order not found');
  order.status = 'CANCELLED';
  return { success: true };
}

export async function getOrderTracking(id: string) {
  await delay(200);
  const order = mockDb.orders.find((o) => o.id === id);
  if (!order) throw new ApiError('NOT_FOUND', 'Order not found');

  // Find linked trip or default last mile trip
  const trip = mockDb.trips.find((t) => t.id === order.trip_id) || mockDb.trips[2];

  return {
    order_id: order.id,
    status: order.status,
    driver: trip.driver
      ? { name: trip.driver.name, phone: trip.driver.phone, vehicle_no: trip.vehicle?.reg_no }
      : { name: 'Suresh Kumar', phone: '+919876543203', vehicle_no: 'KA 03 D 9012' },
    vehicle: trip.current_location || { lat: 12.915, lng: 77.634, heading: 330, speed_kmh: 24 },
    destination: order.location,
    eta_minutes: trip.eta_minutes || 14,
    route_polyline: trip.route_polyline,
    delivery_otp: order.delivery_otp,
    trip_id: trip.id,
  };
}

export async function confirmDelivery(
  orderId: string,
  data: { otp: string; items: any[]; feedback?: string }
): Promise<{ success: boolean; status: string }> {
  await delay(300);
  const order = mockDb.orders.find((o) => o.id === orderId);
  if (!order) throw new ApiError('NOT_FOUND', 'Order not found');

  order.status = 'DELIVERED';
  return { success: true, status: 'DELIVERED' };
}

export async function requestMaskedCall(data: {
  order_id?: string;
  trip_id?: string;
  target: 'driver' | 'farmer' | 'buyer' | 'ops';
}): Promise<{ call_id: string; status: string; bridge_number: string }> {
  await delay(400);
  return {
    call_id: 'call_' + Math.random().toString(36).substring(2, 8),
    status: 'CONNECTING',
    bridge_number: '+918045678900',
  };
}

// ==================== 3. FARMER ENDPOINTS ====================

export async function getFarmerThreshold(farmerId = 'u_farmer_1') {
  await delay(120);
  const farmer = mockDb.farmers.find((f) => f.user_id === farmerId);
  return {
    default_min_kg: farmer?.default_min_kg || 30,
    crop_thresholds: farmer?.crop_thresholds || {},
  };
}

export async function updateFarmerThreshold(
  farmerId = 'u_farmer_1',
  data: { default_min_kg: number; per_crop?: Record<string, number> }
) {
  await delay(250);
  const farmer = mockDb.farmers.find((f) => f.user_id === farmerId);
  if (farmer) {
    farmer.default_min_kg = data.default_min_kg;
    if (data.per_crop) farmer.crop_thresholds = data.per_crop;
  }
  return { success: true, default_min_kg: data.default_min_kg };
}

export async function getFarmerListings(farmerId = 'u_farmer_1'): Promise<FarmerListing[]> {
  await delay(180);
  return mockDb.listings.filter((l) => l.farmer_id === farmerId);
}

export async function createFarmerListing(data: {
  farmer_id?: string;
  crop_id: string;
  est_kg: number;
  ready_by: string;
  listing_date?: string;
}): Promise<FarmerListing> {
  await delay(300);
  const farmerId = data.farmer_id || 'u_farmer_1';
  const farmer = mockDb.farmers.find((f) => f.user_id === farmerId);
  const crop = mockDb.crops.find((c) => c.id === data.crop_id);

  const minKg = farmer?.crop_thresholds?.[data.crop_id] || farmer?.default_min_kg || 25;
  const isEligible = data.est_kg >= minKg;

  const newListing: FarmerListing = {
    id: 'list_' + Math.floor(100 + Math.random() * 900),
    farmer_id: farmerId,
    crop_id: data.crop_id,
    est_kg: data.est_kg,
    ready_by: data.ready_by,
    listing_date: data.listing_date || '2026-11-20',
    status: isEligible ? 'ELIGIBLE' : 'INELIGIBLE',
    min_kg_applied: minKg,
    message_en: isEligible
      ? 'Registered and eligible for morning pickup vehicle.'
      : `Quantity is below your minimum threshold of ${minKg} kg. May be grouped by admin.`,
    message_kn: isEligible
      ? 'ಬೆಳೆ ದಾಖಲಾಗಿದೆ ಮತ್ತು ಬೆಳಗಿನ ಪಿಕಪ್ ವಾಹನಕ್ಕೆ ಅರ್ಹವಾಗಿದೆ.'
      : `ಪ್ರಮಾಣವು ನಿಮ್ಮ ಕನಿಷ್ಠ ಮಿತಿಯಾದ ${minKg} ಕೆಜಿಗಿಂತ ಕಡಿಮೆಯಿದೆ. ಅಡ್ಮಿನ್ ಒಗ್ಗೂಡಿಸಬಹುದು.`,
    cutoff_at: '2026-11-19T18:00:00Z',
    created_at: new Date().toISOString(),
    crop,
  };

  mockDb.listings.unshift(newListing);

  // Broadcast if ineligible alert
  if (!isEligible) {
    mockRealtime.emitNewAlert({
      id: 'alt_' + Date.now(),
      type: 'THRESHOLD_WARNING',
      severity: 'low',
      title: `Sub-threshold listing: ${newListing.id}`,
      title_kn: `ಕನಿಷ್ಠ ಮಿತಿಗಿಂತ ಕಡಿಮೆ ಬೆಳೆ: ${newListing.id}`,
      message: `${crop?.name_en} (${data.est_kg} kg) submitted below ${minKg} kg threshold.`,
      timestamp: new Date().toISOString(),
      entity_id: newListing.id,
      entity_type: 'farmer',
      action_label: 'View in Dispatch',
      action_route: '/admin/dispatch',
    });
  }

  return newListing;
}

export async function deleteFarmerListing(id: string): Promise<{ success: boolean }> {
  await delay(180);
  mockDb.listings = mockDb.listings.filter((l) => l.id !== id);
  return { success: true };
}

export async function getFarmerPickup(farmerId = 'u_farmer_1') {
  await delay(180);
  // Find trip 1 which picks up from farmer 1
  const trip = mockDb.trips[0];
  const stop = trip.stops.find((s) => s.farmer_id === farmerId);

  return {
    trip_id: trip.id,
    trip_status: trip.status,
    driver: trip.driver,
    vehicle: trip.vehicle,
    driver_location: trip.current_location,
    eta_minutes: trip.eta_minutes,
    stop,
    route_polyline: trip.route_polyline,
  };
}

export async function getFarmerPayments(farmerId = 'u_farmer_1'): Promise<FarmerSettlement[]> {
  await delay(180);
  return mockDb.settlements.filter((s) => s.farmer_id === farmerId);
}

// ==================== 4. DRIVER ENDPOINTS ====================

export async function getDriverTrips(driverId = 'u_driver_1'): Promise<Trip[]> {
  await delay(200);
  return mockDb.trips.filter((t) => t.driver_id === driverId);
}

export async function getDriverTripById(id: string): Promise<Trip> {
  await delay(150);
  const trip = mockDb.trips.find((t) => t.id === id);
  if (!trip) throw new ApiError('NOT_FOUND', 'Trip not found');
  return trip;
}

export async function acknowledgeTrip(id: string): Promise<{ status: string }> {
  await delay(200);
  const trip = mockDb.trips.find((t) => t.id === id);
  if (!trip) throw new ApiError('NOT_FOUND', 'Trip not found');
  trip.status = 'ACKNOWLEDGED';
  mockRealtime.broadcast(`trip:${id}`, 'status', { status: 'ACKNOWLEDGED' });
  return { status: 'ACKNOWLEDGED' };
}

export async function startTrip(id: string): Promise<{ status: string }> {
  await delay(250);
  const trip = mockDb.trips.find((t) => t.id === id);
  if (!trip) throw new ApiError('NOT_FOUND', 'Trip not found');
  trip.status = 'STARTED';
  mockRealtime.broadcast(`trip:${id}`, 'status', { status: 'STARTED' });
  mockRealtime.broadcast('admin:live', 'trip_status', { trip_id: id, status: 'STARTED' });
  return { status: 'STARTED' };
}

export async function arriveAtStop(
  tripId: string,
  stopId: string,
  _coords?: { lat: number; lng: number }
): Promise<{ stop_status: string }> {
  await delay(200);
  const trip = mockDb.trips.find((t) => t.id === tripId);
  const stop = trip?.stops.find((s) => s.id === stopId);
  if (stop) {
    stop.status = 'ARRIVED';
    stop.arrived_at = new Date().toISOString();
  }
  return { stop_status: 'ARRIVED' };
}

export async function submitPickupReceipt(
  tripId: string,
  stopId: string,
  data: { lines: any[]; farmer_confirmation: { method: string } }
) {
  await delay(350);
  const trip = mockDb.trips.find((t) => t.id === tripId);
  const stop = trip?.stops.find((s) => s.id === stopId);
  if (stop) {
    stop.status = 'COMPLETED';
    stop.completed_at = new Date().toISOString();
    stop.farmer_confirmed = true;
    stop.receipt_lines = data.lines;
    const totalActual = data.lines.reduce((s: number, l: any) => s + Number(l.kg_received || 0), 0);
    stop.actual_kg = totalActual;

    // Advance next stop to EN_ROUTE
    const nextStop = trip?.stops.find((s) => s.seq === stop.seq + 1);
    if (nextStop) nextStop.status = 'EN_ROUTE';
  }

  mockRealtime.broadcast(`trip:${tripId}`, 'status', { stop_id: stopId, status: 'COMPLETED' });
  return { success: true, stop_status: 'COMPLETED' };
}

export async function submitDelivery(
  tripId: string,
  stopId: string,
  _data: { otp: string; rejected_kg?: number; reason?: string }
) {
  await delay(300);
  const trip = mockDb.trips.find((t) => t.id === tripId);
  const stop = trip?.stops.find((s) => s.id === stopId);
  if (stop) {
    stop.status = 'COMPLETED';
    stop.buyer_confirmed = true;
    stop.completed_at = new Date().toISOString();
  }
  return { success: true, stop_status: 'COMPLETED' };
}

export async function skipStop(tripId: string, stopId: string, data: { reason: string }) {
  await delay(200);
  const trip = mockDb.trips.find((t) => t.id === tripId);
  const stop = trip?.stops.find((s) => s.id === stopId);
  if (stop) {
    stop.status = 'SKIPPED';
    stop.skipped_reason = data.reason;
  }
  return { success: true, stop_status: 'SKIPPED' };
}

export async function reachedHub(tripId: string) {
  await delay(250);
  const trip = mockDb.trips.find((t) => t.id === tripId);
  if (trip) {
    trip.status = 'AT_HUB';
  }
  mockRealtime.broadcast(`trip:${tripId}`, 'status', { status: 'AT_HUB' });
  mockRealtime.broadcast('admin:live', 'trip_status', { trip_id: tripId, status: 'AT_HUB' });
  return { status: 'AT_HUB' };
}

export async function returnTrip(tripId: string) {
  await delay(250);
  const trip = mockDb.trips.find((t) => t.id === tripId);
  if (trip) {
    trip.status = 'RETURNED';
  }
  mockRealtime.broadcast(`trip:${tripId}`, 'status', { status: 'RETURNED' });
  mockRealtime.broadcast('admin:live', 'trip_status', { trip_id: tripId, status: 'RETURNED' });
  return { status: 'RETURNED' };
}

// ==================== 5. HUBS & STOCK MATRIX ====================

export async function getHubs(): Promise<Hub[]> {
  await delay(150);
  return [...mockDb.hubs];
}

export async function getHubById(id: string): Promise<Hub> {
  await delay(120);
  const hub = mockDb.hubs.find((h) => h.id === id);
  if (!hub) throw new ApiError('NOT_FOUND', 'Hub not found');
  return hub;
}

export async function getStockMatrix() {
  await delay(200);
  return {
    hubs: mockDb.hubs,
    crops: mockDb.crops,
    matrix: mockDb.stockMatrix,
  };
}

export async function updateStockStatus(
  hubId: string,
  cropId: string,
  status: StockStatus,
  setterName = 'Admin'
) {
  await delay(200);
  if (!mockDb.stockMatrix[hubId]) mockDb.stockMatrix[hubId] = {};
  mockDb.stockMatrix[hubId][cropId] = {
    ...mockDb.stockMatrix[hubId][cropId],
    status,
    set_by: setterName,
    set_at: new Date().toISOString(),
  };

  mockRealtime.emitStockStatusChange(hubId, cropId, status);
  return mockDb.stockMatrix[hubId][cropId];
}

// ==================== 6. TRANSFERS ====================

export async function getTransfers(status?: string): Promise<TransferRequest[]> {
  await delay(180);
  if (status) return mockDb.transfers.filter((t) => t.status === status);
  return [...mockDb.transfers];
}

export async function createTransfer(data: {
  from_hub_id: string;
  to_hub_id: string;
  crop_id: string;
  requested_kg: number;
  urgency?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
}): Promise<TransferRequest> {
  await delay(300);
  const fromHub = mockDb.hubs.find((h) => h.id === data.from_hub_id);
  const toHub = mockDb.hubs.find((h) => h.id === data.to_hub_id);
  const crop = mockDb.crops.find((c) => c.id === data.crop_id);

  const newTransfer: TransferRequest = {
    id: 'tr_' + Math.floor(100 + Math.random() * 900),
    from_hub_id: data.from_hub_id,
    to_hub_id: data.to_hub_id,
    crop_id: data.crop_id,
    requested_kg: data.requested_kg,
    status: 'REQUESTED',
    urgency: data.urgency || 'HIGH',
    created_at: new Date().toISOString(),
    distance_km: 55,
    eta_hours: 1.8,
    from_hub: fromHub,
    to_hub: toHub,
    crop,
  };

  mockDb.transfers.unshift(newTransfer);

  mockRealtime.broadcast('admin:live', 'transfer', newTransfer);
  return newTransfer;
}

export async function updateTransferStatus(id: string, status: any) {
  await delay(200);
  const tr = mockDb.transfers.find((t) => t.id === id);
  if (tr) {
    tr.status = status;
    if (status === 'APPROVED') tr.approved_at = new Date().toISOString();
  }
  return tr;
}

// ==================== 7. ADMIN DISPATCH & FLEET ====================

export async function getDispatchPool() {
  await delay(220);
  return {
    farmer_pickups: mockDb.listings.filter((l) => l.status === 'ELIGIBLE'),
    ineligible_pickups: mockDb.listings.filter((l) => l.status === 'INELIGIBLE'),
    buyer_deliveries: mockDb.orders.filter((o) => o.status === 'CONFIRMED'),
    pending_transfers: mockDb.transfers.filter(
      (t) => t.status === 'APPROVED' || t.status === 'REQUESTED'
    ),
  };
}

export async function assignTrip(data: {
  driver_id: string;
  vehicle_id: string;
  hub_id: string;
  stops: any[];
  type?: any;
}): Promise<Trip> {
  await delay(400);
  const driver = mockDb.users.find((u) => u.id === data.driver_id);
  const vehicle = mockDb.vehicles.find((v) => v.id === data.vehicle_id);

  const newTrip: Trip = {
    id: 'trip_' + Math.floor(1000 + Math.random() * 9000),
    type: data.type || 'FIRST_MILE',
    status: 'ASSIGNED',
    driver_id: data.driver_id,
    vehicle_id: data.vehicle_id,
    hub_id: data.hub_id,
    date: '2026-11-20',
    total_planned_kg: data.stops.reduce((acc, s) => acc + (s.expected_kg || 0), 0),
    stops: data.stops.map((s, idx) => ({
      ...s,
      seq: idx + 1,
      status: 'PLANNED',
    })),
    route_polyline: [
      { lat: 13.0285, lng: 77.54 },
      ...data.stops.map((s) => s.location),
      { lat: 13.0285, lng: 77.54 },
    ],
    driver: driver ? { ...driver, phone: driver.phone } : undefined,
    vehicle,
    eta_minutes: 45,
  };

  mockDb.trips.unshift(newTrip);

  // Notify driver channel
  mockRealtime.broadcast(`driver:${data.driver_id}`, 'assignment', newTrip);
  mockRealtime.broadcast('admin:live', 'trip_status', { trip_id: newTrip.id, status: 'ASSIGNED' });

  return newTrip;
}

export async function getAdminTrips(): Promise<Trip[]> {
  await delay(200);
  return [...mockDb.trips];
}

export async function getAdminTripById(id: string): Promise<Trip> {
  await delay(150);
  const trip = mockDb.trips.find((t) => t.id === id);
  if (!trip) throw new ApiError('NOT_FOUND', 'Trip not found');
  return trip;
}

export async function getAvailableDrivers() {
  await delay(150);
  return mockDb.drivers.map((d) => {
    const user = mockDb.users.find((u) => u.id === d.user_id);
    const vehicle = mockDb.vehicles.find((v) => v.id === d.vehicle_id);
    return {
      ...d,
      name: user?.name || 'Driver',
      phone: user?.phone,
      vehicle,
    };
  });
}

// ==================== 8. PRICING & FORECASTS ====================

export async function getPricingForecasts(): Promise<MLPriceForecast[]> {
  await delay(200);
  return [...mockDb.priceForecasts];
}

export async function publishPrices(
  items: { crop_id: string; low: number; high: number; override_reason?: string }[]
) {
  await delay(350);
  for (const item of items) {
    const crop = mockDb.crops.find((c) => c.id === item.crop_id);
    if (crop) {
      crop.price.low = item.low;
      crop.price.high = item.high;
    }
    const forecast = mockDb.priceForecasts.find((f) => f.crop_id === item.crop_id);
    if (forecast) {
      forecast.current_published_low = item.low;
      forecast.current_published_high = item.high;
      if (item.override_reason) forecast.override_reason = item.override_reason;
    }
  }
  return { success: true };
}

export async function getDemandForecasts(): Promise<MLDemandForecast[]> {
  await delay(200);
  return [...mockDb.demandForecasts];
}

// ==================== 9. SETTLEMENTS & ADMIN REPORTS ====================

export async function getAdminSettlements(): Promise<FarmerSettlement[]> {
  await delay(180);
  return [...mockDb.settlements];
}

export async function approveSettlement(id: string) {
  await delay(250);
  const s = mockDb.settlements.find((item) => item.id === id);
  if (s) s.status = 'APPROVED';
  return s;
}

export async function triggerPayouts() {
  await delay(400);
  mockDb.settlements.forEach((s) => {
    if (s.status === 'APPROVED' || s.status === 'DUE') {
      s.status = 'PAID';
      s.paid_at = new Date().toISOString();
      s.utr = 'UPI/' + Math.floor(100000000000 + Math.random() * 900000000000);
    }
  });
  return { success: true, count: mockDb.settlements.length };
}

export async function getAlerts(): Promise<AlertItem[]> {
  await delay(120);
  return [...mockDb.alerts];
}

export async function getSettings() {
  await delay(150);
  return {
    farmer_cutoff: '18:00',
    buyer_cutoff: '20:00',
    min_route_payload_kg: 150,
    default_farmer_min_kg: 20,
    variance_tolerance_percent: 2.0,
    farmer_wait_minutes: 10,
  };
}

export async function getFarmersList() {
  await delay(150);
  return [...mockDb.farmers];
}

export async function getBuyersList() {
  await delay(150);
  return [...mockDb.buyers];
}

export async function getDriversList() {
  await delay(150);
  return [...mockDb.drivers];
}

export async function parseVoiceListing(text: string) {
  await delay(400);
  // Mock LLM parsing Kannada or English input like "200 kg tomato"
  return {
    crop_id: 'c_tomato',
    crop_name_en: 'Tomato',
    crop_name_kn: 'ಟೊಮೆಟೊ',
    est_kg: 200,
    ready_by: '06:00',
    confidence: 0.96,
  };
}
