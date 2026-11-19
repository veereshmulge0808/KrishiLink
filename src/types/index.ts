export type Role = 'buyer' | 'farmer' | 'driver' | 'admin' | 'hub_staff';

export type StockStatus = 'OUT' | 'LOW' | 'SUFFICIENT';

export type TripStatus =
  | 'ASSIGNED'
  | 'ACKNOWLEDGED'
  | 'STARTED'
  | 'AT_HUB'
  | 'RETURNED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'INCIDENT';

export type TripType = 'FIRST_MILE' | 'MIDDLE_MILE' | 'LAST_MILE' | 'TRANSFER';

export type StopType = 'PICKUP' | 'HUB' | 'DELIVERY';

export type StopStatus =
  | 'PLANNED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED';

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PARTIAL'
  | 'ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type TransferStatus =
  | 'SUGGESTED'
  | 'REQUESTED'
  | 'APPROVED'
  | 'ASSIGNED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'REJECTED'
  | 'CANCELLED';

export type ListingStatus =
  | 'DRAFT'
  | 'INELIGIBLE'
  | 'ELIGIBLE'
  | 'SCHEDULED'
  | 'COLLECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export type Grade = 'A' | 'B' | 'REJECT';

export type HubType = 'main' | 'village' | 'city';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  phone: string;
  role: Role;
  name: string;
  language: 'kn' | 'en';
  needs_onboarding?: boolean;
}

export interface FarmerProfile {
  user_id: string;
  village: string;
  taluk: string;
  district: string;
  location: LatLng;
  nearest_hub_id: string;
  land_acres?: number;
  default_min_kg: number;
  upi_id?: string;
  reliability_score: number;
  crop_thresholds?: Record<string, number>; // crop_id -> min_kg
}

export interface BuyerProfile {
  user_id: string;
  business_name: string;
  business_type: 'restaurant' | 'caterer' | 'hostel' | 'wholesaler' | 'retailer';
  gstin?: string;
  address: string;
  location: LatLng;
  delivery_hub_id: string;
  credit_limit: number; // in paise
  credit_days: number;
  credit_due?: number; // in paise
}

export interface DriverProfile {
  user_id: string;
  licence_no: string;
  vehicle_id: string;
  home_hub_id: string;
  on_duty: boolean;
  vehicle?: Vehicle;
}

export interface Vehicle {
  id: string;
  reg_no: string;
  type: string;
  capacity_kg: number;
  ownership: 'own' | 'rent';
  active: boolean;
}

export interface Hub {
  id: string;
  name: string;
  type: HubType;
  parent_hub_id?: string | null;
  location: LatLng;
  address: string;
  capacity_kg: number;
  has_cold_room: boolean;
  active: boolean;
}

export interface Crop {
  id: string;
  name_en: string;
  name_kn: string;
  category: 'leafy' | 'roots' | 'fruit_veg' | 'gourds' | 'herbs';
  unit: string;
  min_order_kg: number;
  shelf_life_days: number;
  is_organic?: boolean;
  price: {
    low: number; // paise per kg
    high: number; // paise per kg
    currency: string;
    date: string;
  };
  availability?: StockStatus;
  image_emoji: string;
}

export interface FarmerListing {
  id: string;
  farmer_id: string;
  crop_id: string;
  est_kg: number;
  ready_by: string; // ISO timestamp or time string
  listing_date: string;
  status: ListingStatus;
  min_kg_applied: number;
  message_kn?: string;
  message_en?: string;
  cutoff_at: string;
  created_at: string;
  crop?: Crop;
}

export interface OrderItem {
  crop_id: string;
  qty_kg: number;
  confirmed_kg?: number;
  price_per_kg_locked?: number; // paise
  note?: 'FULL' | 'PARTIAL' | 'OUT_OF_STOCK';
  substitute_suggestions?: string[]; // crop_ids
  crop?: Crop;
}

export interface Order {
  id: string;
  buyer_id: string;
  delivery_date: string;
  slot: string; // e.g. "07:00-08:00"
  payment_mode: 'PREPAID' | 'CREDIT' | 'UPI';
  payment_status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  status: OrderStatus;
  items: OrderItem[];
  total: number; // in paise
  address: string;
  location: LatLng;
  created_at: string;
  delivery_otp?: string;
  trip_id?: string;
  buyer?: BuyerProfile & { name: string; phone: string };
}

export interface ReceiptLine {
  id?: string;
  crop_id: string;
  kg_received: number;
  grade: Grade;
  photo_url?: string;
  crop?: Crop;
}

export interface TripStop {
  id: string;
  trip_id: string;
  seq: number;
  type: StopType;
  status: StopStatus;
  location: LatLng;
  name: string;
  address: string;
  phone?: string;
  expected_kg: number;
  actual_kg?: number;
  eta: string;
  distance_km?: number;
  farmer_id?: string;
  buyer_id?: string;
  order_id?: string;
  hub_id?: string;
  receipt_lines?: ReceiptLine[];
  farmer_confirmed?: boolean;
  buyer_confirmed?: boolean;
  skipped_reason?: string;
  arrived_at?: string;
  completed_at?: string;
}

export interface Trip {
  id: string;
  type: TripType;
  status: TripStatus;
  driver_id: string;
  vehicle_id: string;
  hub_id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  total_planned_kg: number;
  total_actual_kg?: number;
  hub_weighed_kg?: number;
  variance_percent?: number;
  stops: TripStop[];
  route_polyline: LatLng[];
  current_location?: LatLng & { heading: number; speed_kmh: number; updated_at: string };
  eta_minutes?: number;
  driver?: User & { phone: string };
  vehicle?: Vehicle;
  incident_notes?: string;
}

export interface HubStockCell {
  crop_id: string;
  status: StockStatus;
  suggested: StockStatus;
  set_by: string;
  set_at: string;
  exact_kg?: number;
}

export interface HubStockRow {
  hub: Hub;
  cells: Record<string, HubStockCell>; // crop_id -> cell
}

export interface TransferRequest {
  id: string;
  from_hub_id: string;
  to_hub_id: string;
  crop_id: string;
  requested_kg: number;
  status: TransferStatus;
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  created_at: string;
  approved_at?: string;
  driver_id?: string;
  vehicle_id?: string;
  trip_id?: string;
  distance_km: number;
  eta_hours: number;
  from_hub?: Hub;
  to_hub?: Hub;
  crop?: Crop;
  rejection_reason?: string;
}

export interface MLPriceForecast {
  crop_id: string;
  crop_name_en: string;
  crop_name_kn: string;
  date: string;
  p10: number; // paise
  p50: number; // paise
  p90: number; // paise
  current_published_low: number;
  current_published_high: number;
  override_reason?: string;
  confidence: number;
  trend: { date: string; p50: number; actual?: number }[];
}

export interface MLDemandForecast {
  hub_id: string;
  crop_id: string;
  date: string;
  q10_kg: number;
  q50_kg: number;
  q90_kg: number;
  suggested_procure_kg: number;
  historical_accuracy: number; // e.g. 0.92
}

export interface FarmerSettlement {
  id: string;
  farmer_id: string;
  farmer_name: string;
  date: string;
  accepted_kg: number;
  gross_amount: number; // paise
  commission_amount: number; // paise
  logistics_share: number; // paise
  net_amount: number; // paise
  status: 'DUE' | 'APPROVED' | 'PAID';
  paid_at?: string;
  utr?: string;
}

export interface AlertItem {
  id: string;
  type: 'DELAY' | 'STOCK_LOW' | 'STOCK_OUT' | 'VARIANCE' | 'INCIDENT' | 'THRESHOLD_WARNING';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  title_kn?: string;
  message: string;
  message_kn?: string;
  timestamp: string;
  entity_id?: string;
  entity_type?: 'trip' | 'hub' | 'order' | 'farmer';
  action_label?: string;
  action_route?: string;
}
