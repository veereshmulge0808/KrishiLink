import {
  Hub,
  Crop,
  User,
  FarmerProfile,
  BuyerProfile,
  DriverProfile,
  Vehicle,
  Trip,
  Order,
  FarmerListing,
  TransferRequest,
  HubStockCell,
  MLPriceForecast,
  MLDemandForecast,
  FarmerSettlement,
  AlertItem,
  StockStatus,
} from '../../../types';
import {
  SEED_HUBS,
  SEED_CROPS,
  SEED_USERS,
  SEED_VEHICLES,
  SEED_FARMERS,
  SEED_BUYERS,
  SEED_DRIVERS,
} from './seed';

class MockDatabase {
  public hubs: Hub[] = [...SEED_HUBS];
  public crops: Crop[] = [...SEED_CROPS];
  public users: User[] = [...SEED_USERS];
  public vehicles: Vehicle[] = [...SEED_VEHICLES];
  public farmers: FarmerProfile[] = [...SEED_FARMERS];
  public buyers: BuyerProfile[] = [...SEED_BUYERS];
  public drivers: DriverProfile[] = [...SEED_DRIVERS];

  // Stock Matrix: hubId -> cropId -> HubStockCell
  public stockMatrix: Record<string, Record<string, HubStockCell>> = {};

  // Trips
  public trips: Trip[] = [];

  // Orders
  public orders: Order[] = [];

  // Farmer listings
  public listings: FarmerListing[] = [];

  // Inter-hub Transfers
  public transfers: TransferRequest[] = [];

  // ML Price Forecasts
  public priceForecasts: MLPriceForecast[] = [];

  // ML Demand Forecasts
  public demandForecasts: MLDemandForecast[] = [];

  // Settlements
  public settlements: FarmerSettlement[] = [];

  // Alerts
  public alerts: AlertItem[] = [];

  constructor() {
    this.initStockMatrix();
    this.initTrips();
    this.initOrders();
    this.initListings();
    this.initTransfers();
    this.initForecasts();
    this.initSettlements();
    this.initAlerts();
  }

  private initStockMatrix() {
    for (const hub of this.hubs) {
      this.stockMatrix[hub.id] = {};
      for (const crop of this.crops) {
        let status: StockStatus = 'SUFFICIENT';
        let suggested: StockStatus = 'SUFFICIENT';

        // Provide realistic demo variations:
        if (hub.id === 'h_hsr' && crop.id === 'c_tomato') {
          status = 'LOW';
          suggested = 'OUT';
        } else if (hub.id === 'h_whitefield' && crop.id === 'c_beans') {
          status = 'OUT';
          suggested = 'OUT';
        } else if (hub.id === 'h_jayanagar' && crop.id === 'c_onion') {
          status = 'LOW';
          suggested = 'LOW';
        } else if (hub.id === 'h_malleshwaram' && crop.id === 'c_capsicum') {
          status = 'OUT';
          suggested = 'LOW';
        } else if (hub.id === 'h_kolar' && crop.id === 'c_tomato') {
          status = 'SUFFICIENT';
          suggested = 'SUFFICIENT';
        } else if (hub.id === 'h_doddaballapur' && crop.id === 'c_beans') {
          status = 'SUFFICIENT';
          suggested = 'SUFFICIENT';
        } else if (hub.id === 'h_chikkaballapur' && crop.id === 'c_onion') {
          status = 'SUFFICIENT';
          suggested = 'SUFFICIENT';
        } else if (Math.random() < 0.15) {
          status = 'LOW';
          suggested = 'SUFFICIENT';
        }

        this.stockMatrix[hub.id][crop.id] = {
          crop_id: crop.id,
          status,
          suggested,
          set_by: hub.type === 'village' ? 'Praveen (Hub Staff)' : 'Anita (Admin)',
          set_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          exact_kg: status === 'OUT' ? 0 : status === 'LOW' ? 120 : 850,
        };
      }
    }
  }

  private initTrips() {
    // 1. FIRST_MILE Trip (Kolar rural farmer pickups -> Kolar Hub)
    const trip1: Trip = {
      id: 'trip_first_mile_1',
      type: 'FIRST_MILE',
      status: 'STARTED',
      driver_id: 'u_driver_1',
      vehicle_id: 'v_1',
      hub_id: 'h_kolar',
      date: '2026-11-20',
      start_time: '2026-11-20T04:00:00Z',
      total_planned_kg: 840,
      total_actual_kg: 520,
      stops: [
        {
          id: 'stop_1_1',
          trip_id: 'trip_first_mile_1',
          seq: 1,
          type: 'PICKUP',
          status: 'COMPLETED',
          location: { lat: 13.1672, lng: 78.0821 }, // Ramesh Gowda
          name: 'Ramesh Gowda Farm (ರಾಮೇಶ್ ಗೌಡ)',
          address: 'Vemgal Village, Kolar',
          phone: '+919876543202',
          expected_kg: 200,
          actual_kg: 210,
          eta: '04:20',
          distance_km: 14.5,
          farmer_id: 'u_farmer_1',
          farmer_confirmed: true,
          arrived_at: '2026-11-20T04:18:00Z',
          completed_at: '2026-11-20T04:32:00Z',
          receipt_lines: [
            { crop_id: 'c_tomato', kg_received: 150, grade: 'A' },
            { crop_id: 'c_capsicum', kg_received: 60, grade: 'A' },
          ],
        },
        {
          id: 'stop_1_2',
          trip_id: 'trip_first_mile_1',
          seq: 2,
          type: 'PICKUP',
          status: 'EN_ROUTE',
          location: { lat: 13.1189, lng: 78.148 }, // Muniyappa
          name: 'Muniyappa Farm (ಮುನಿಯಪ್ಪ)',
          address: 'Sugatur Village, Kolar',
          phone: '+919876543211',
          expected_kg: 320,
          eta: '05:05',
          distance_km: 9.8,
          farmer_id: 'u_farmer_2',
        },
        {
          id: 'stop_1_3',
          trip_id: 'trip_first_mile_1',
          seq: 3,
          type: 'PICKUP',
          status: 'PLANNED',
          location: { lat: 13.1495, lng: 78.0163 }, // Narayanappa
          name: 'Narayanappa Farm (ನಾರಾಯಣಪ್ಪ)',
          address: 'Narasapura, Kolar',
          phone: '+919876543212',
          expected_kg: 320,
          eta: '05:45',
          distance_km: 16.2,
          farmer_id: 'u_farmer_3',
        },
        {
          id: 'stop_1_4',
          trip_id: 'trip_first_mile_1',
          seq: 4,
          type: 'HUB',
          status: 'PLANNED',
          location: { lat: 13.136, lng: 78.129 }, // Kolar Hub
          name: 'Kolar Village Mini Hub',
          address: 'Mandi Road, Kolar Rural',
          phone: '+919876543205',
          expected_kg: 840,
          eta: '06:30',
          hub_id: 'h_kolar',
        },
      ],
      route_polyline: [
        { lat: 13.136, lng: 78.129 },
        { lat: 13.145, lng: 78.105 },
        { lat: 13.1672, lng: 78.0821 },
        { lat: 13.155, lng: 78.115 },
        { lat: 13.1189, lng: 78.148 },
        { lat: 13.135, lng: 78.08 },
        { lat: 13.1495, lng: 78.0163 },
        { lat: 13.136, lng: 78.129 },
      ],
      current_location: {
        lat: 13.142,
        lng: 78.118,
        heading: 145,
        speed_kmh: 38,
        updated_at: new Date().toISOString(),
      },
      eta_minutes: 18,
      driver: { ...this.users.find((u) => u.id === 'u_driver_1')!, phone: '+919876543203' },
      vehicle: this.vehicles.find((v) => v.id === 'v_1'),
    };

    // 2. MIDDLE_MILE Trip (Kolar Hub -> Yeshwanthpur Main Hub)
    const trip2: Trip = {
      id: 'trip_middle_mile_1',
      type: 'MIDDLE_MILE',
      status: 'STARTED',
      driver_id: 'u_driver_2',
      vehicle_id: 'v_4',
      hub_id: 'h_main',
      date: '2026-11-20',
      start_time: '2026-11-20T06:15:00Z',
      total_planned_kg: 2200,
      total_actual_kg: 2180,
      hub_weighed_kg: 2170,
      variance_percent: -0.46,
      stops: [
        {
          id: 'stop_2_1',
          trip_id: 'trip_middle_mile_1',
          seq: 1,
          type: 'HUB',
          status: 'COMPLETED',
          location: { lat: 13.136, lng: 78.129 },
          name: 'Kolar Village Mini Hub (Origin)',
          address: 'Mandi Road, Kolar',
          expected_kg: 2200,
          actual_kg: 2180,
          eta: '06:15',
          hub_id: 'h_kolar',
        },
        {
          id: 'stop_2_2',
          trip_id: 'trip_middle_mile_1',
          seq: 2,
          type: 'HUB',
          status: 'EN_ROUTE',
          location: { lat: 13.0285, lng: 77.54 },
          name: 'Bengaluru Main Hub (Destination)',
          address: 'APMC Yard, Yeshwanthpur',
          expected_kg: 2200,
          eta: '07:30',
          hub_id: 'h_main',
        },
      ],
      route_polyline: [
        { lat: 13.136, lng: 78.129 },
        { lat: 13.0707, lng: 77.7982 }, // via Hoskote
        { lat: 13.0035, lng: 77.5647 },
        { lat: 13.0285, lng: 77.54 },
      ],
      current_location: {
        lat: 13.065,
        lng: 77.75,
        heading: 260,
        speed_kmh: 55,
        updated_at: new Date().toISOString(),
      },
      eta_minutes: 32,
      driver: { ...this.users.find((u) => u.id === 'u_driver_2')!, phone: '+919876543207' },
      vehicle: this.vehicles.find((v) => v.id === 'v_4'),
    };

    // 3. LAST_MILE Trip (HSR Hub -> Udupi Upahar, Pai Hostel, Meghana Foods)
    const trip3: Trip = {
      id: 'trip_last_mile_1',
      type: 'LAST_MILE',
      status: 'STARTED',
      driver_id: 'u_driver_3',
      vehicle_id: 'v_3',
      hub_id: 'h_hsr',
      date: '2026-11-20',
      start_time: '2026-11-20T07:45:00Z',
      total_planned_kg: 680,
      stops: [
        {
          id: 'stop_3_1',
          trip_id: 'trip_last_mile_1',
          seq: 1,
          type: 'HUB',
          status: 'COMPLETED',
          location: { lat: 12.9116, lng: 77.6389 },
          name: 'HSR Layout City Mini Hub',
          address: 'Sector 2, HSR',
          expected_kg: 680,
          eta: '07:45',
          hub_id: 'h_hsr',
        },
        {
          id: 'stop_3_2',
          trip_id: 'trip_last_mile_1',
          seq: 2,
          type: 'DELIVERY',
          status: 'EN_ROUTE',
          location: { lat: 12.9116, lng: 77.6389 },
          name: 'Udupi Upahar Veg Restaurant',
          address: '14th Main, HSR Layout Sector 4',
          phone: '+919876543201',
          expected_kg: 180,
          eta: '08:15',
          distance_km: 2.1,
          buyer_id: 'u_buyer_1',
          order_id: 'order_101',
        },
        {
          id: 'stop_3_3',
          trip_id: 'trip_last_mile_1',
          seq: 3,
          type: 'DELIVERY',
          status: 'PLANNED',
          location: { lat: 12.9352, lng: 77.6245 },
          name: 'Pai Comforts Hostel Mess',
          address: 'Koramangala 5th Block',
          phone: '+919876543233',
          expected_kg: 250,
          eta: '08:50',
          distance_km: 4.8,
          buyer_id: 'u_buyer_4',
          order_id: 'order_104',
        },
        {
          id: 'stop_3_4',
          trip_id: 'trip_last_mile_1',
          seq: 4,
          type: 'DELIVERY',
          status: 'PLANNED',
          location: { lat: 12.9325, lng: 77.631 },
          name: 'Meghana Foods Koramangala',
          address: 'Koramangala 4th Block',
          phone: '+919876543236',
          expected_kg: 250,
          eta: '09:20',
          distance_km: 2.3,
          buyer_id: 'u_buyer_7',
          order_id: 'order_107',
        },
      ],
      route_polyline: [
        { lat: 12.9116, lng: 77.6389 },
        { lat: 12.918, lng: 77.63 },
        { lat: 12.924, lng: 77.628 },
        { lat: 12.9352, lng: 77.6245 },
        { lat: 12.9325, lng: 77.631 },
      ],
      current_location: {
        lat: 12.915,
        lng: 77.634,
        heading: 330,
        speed_kmh: 24,
        updated_at: new Date().toISOString(),
      },
      eta_minutes: 14,
      driver: { ...this.users.find((u) => u.id === 'u_driver_3')!, phone: '+919876543208' },
      vehicle: this.vehicles.find((v) => v.id === 'v_3'),
    };

    this.trips = [trip1, trip2, trip3];
  }

  private initOrders() {
    this.orders = [
      {
        id: 'order_101',
        buyer_id: 'u_buyer_1',
        delivery_date: '2026-11-20',
        slot: '07:00-08:00',
        payment_mode: 'PREPAID',
        payment_status: 'SUCCESS',
        status: 'OUT_FOR_DELIVERY',
        items: [
          {
            crop_id: 'c_tomato',
            qty_kg: 50,
            confirmed_kg: 50,
            price_per_kg_locked: 2600, // ₹26/kg
            note: 'FULL',
            crop: this.crops.find((c) => c.id === 'c_tomato'),
          },
          {
            crop_id: 'c_onion',
            qty_kg: 60,
            confirmed_kg: 60,
            price_per_kg_locked: 3100, // ₹31/kg
            note: 'FULL',
            crop: this.crops.find((c) => c.id === 'c_onion'),
          },
          {
            crop_id: 'c_beans',
            qty_kg: 30,
            confirmed_kg: 20,
            price_per_kg_locked: 4800, // ₹48/kg
            note: 'PARTIAL',
            substitute_suggestions: ['c_capsicum', 'c_cabbage'],
            crop: this.crops.find((c) => c.id === 'c_beans'),
          },
          {
            crop_id: 'c_coriander',
            qty_kg: 10,
            confirmed_kg: 10,
            price_per_kg_locked: 4000,
            note: 'FULL',
            crop: this.crops.find((c) => c.id === 'c_coriander'),
          },
        ],
        total: 452000, // ₹4,520 in paise
        address: 'Udupi Upahar, 14th Main, HSR Layout Sector 4, Bengaluru 560102',
        location: { lat: 12.9116, lng: 77.6389 },
        created_at: '2026-11-19T18:45:00Z',
        delivery_otp: '4829',
        trip_id: 'trip_last_mile_1',
        buyer: {
          ...this.buyers.find((b) => b.user_id === 'u_buyer_1')!,
          name: 'Kiran Kumar',
          phone: '+919876543201',
        },
      },
      {
        id: 'order_102',
        buyer_id: 'u_buyer_2',
        delivery_date: '2026-11-20',
        slot: '08:00-09:00',
        payment_mode: 'CREDIT',
        payment_status: 'SUCCESS',
        status: 'CONFIRMED',
        items: [
          { crop_id: 'c_tomato', qty_kg: 80, confirmed_kg: 80, price_per_kg_locked: 2500, crop: this.crops.find((c) => c.id === 'c_tomato') },
          { crop_id: 'c_green_chilli', qty_kg: 15, confirmed_kg: 15, price_per_kg_locked: 5800, crop: this.crops.find((c) => c.id === 'c_green_chilli') },
          { crop_id: 'c_carrot', qty_kg: 40, confirmed_kg: 40, price_per_kg_locked: 3800, crop: this.crops.find((c) => c.id === 'c_carrot') },
        ],
        total: 439000,
        address: '100ft Road, HAL 2nd Stage, Indiranagar',
        location: { lat: 12.9719, lng: 77.6412 },
        created_at: '2026-11-19T19:10:00Z',
        delivery_otp: '7391',
        buyer: {
          ...this.buyers.find((b) => b.user_id === 'u_buyer_2')!,
          name: 'Nagarjuna Indiranagar',
          phone: '+919876543231',
        },
      },
    ];
  }

  private initListings() {
    this.listings = [
      {
        id: 'list_1',
        farmer_id: 'u_farmer_1', // Ramesh Gowda (min threshold: 30kg)
        crop_id: 'c_tomato',
        est_kg: 200,
        ready_by: '05:30 AM',
        listing_date: '2026-11-20',
        status: 'ELIGIBLE',
        min_kg_applied: 30,
        message_en: 'Eligible for morning pickup route.',
        message_kn: 'ಬೆಳಗಿನ ಪಿಕಪ್ ಮಾರ್ಗಕ್ಕೆ ಅರ್ಹವಾಗಿದೆ.',
        cutoff_at: '2026-11-19T18:00:00Z',
        created_at: '2026-11-19T14:30:00Z',
        crop: this.crops.find((c) => c.id === 'c_tomato'),
      },
      {
        id: 'list_2',
        farmer_id: 'u_farmer_1',
        crop_id: 'c_beans',
        est_kg: 15, // Below Ramesh's 30kg threshold!
        ready_by: '06:00 AM',
        listing_date: '2026-11-20',
        status: 'INELIGIBLE',
        min_kg_applied: 30,
        message_en: 'Quantity below minimum threshold of 30 kg for separate vehicle visit.',
        message_kn: 'ಪ್ರತ್ಯೇಕ ವಾಹನ ಭೇಟಿಗಾಗಿ ಕನಿಷ್ಠ ಮಿತಿಯಾದ 30 ಕೆಜಿಗಿಂತ ಕಡಿಮೆ ಪ್ರಮಾಣವಿದೆ.',
        cutoff_at: '2026-11-19T18:00:00Z',
        created_at: '2026-11-19T15:10:00Z',
        crop: this.crops.find((c) => c.id === 'c_beans'),
      },
      {
        id: 'list_3',
        farmer_id: 'u_farmer_2', // Muniyappa
        crop_id: 'c_onion',
        est_kg: 320,
        ready_by: '05:00 AM',
        listing_date: '2026-11-20',
        status: 'ELIGIBLE',
        min_kg_applied: 20,
        cutoff_at: '2026-11-19T18:00:00Z',
        created_at: '2026-11-19T16:00:00Z',
        crop: this.crops.find((c) => c.id === 'c_onion'),
      },
      {
        id: 'list_4',
        farmer_id: 'u_farmer_7', // Tubagere Doddaballapur
        crop_id: 'c_beans',
        est_kg: 450,
        ready_by: '04:30 AM',
        listing_date: '2026-11-20',
        status: 'ELIGIBLE',
        min_kg_applied: 35,
        cutoff_at: '2026-11-19T18:00:00Z',
        created_at: '2026-11-19T16:40:00Z',
        crop: this.crops.find((c) => c.id === 'c_beans'),
      },
    ];
  }

  private initTransfers() {
    this.transfers = [
      {
        id: 'tr_1',
        from_hub_id: 'h_kolar',
        to_hub_id: 'h_hsr',
        crop_id: 'c_tomato',
        requested_kg: 400,
        status: 'REQUESTED',
        urgency: 'HIGH',
        created_at: '2026-11-19T20:15:00Z',
        distance_km: 68.4,
        eta_hours: 2.1,
        from_hub: this.hubs.find((h) => h.id === 'h_kolar'),
        to_hub: this.hubs.find((h) => h.id === 'h_hsr'),
        crop: this.crops.find((c) => c.id === 'c_tomato'),
      },
      {
        id: 'tr_2',
        from_hub_id: 'h_doddaballapur',
        to_hub_id: 'h_whitefield',
        crop_id: 'c_beans',
        requested_kg: 250,
        status: 'APPROVED',
        urgency: 'CRITICAL',
        created_at: '2026-11-19T19:40:00Z',
        approved_at: '2026-11-19T20:00:00Z',
        distance_km: 54.2,
        eta_hours: 1.8,
        from_hub: this.hubs.find((h) => h.id === 'h_doddaballapur'),
        to_hub: this.hubs.find((h) => h.id === 'h_whitefield'),
        crop: this.crops.find((c) => c.id === 'c_beans'),
      },
      {
        id: 'tr_3',
        from_hub_id: 'h_chikkaballapur',
        to_hub_id: 'h_jayanagar',
        crop_id: 'c_onion',
        requested_kg: 600,
        status: 'IN_TRANSIT',
        urgency: 'NORMAL',
        created_at: '2026-11-19T18:20:00Z',
        approved_at: '2026-11-19T19:00:00Z',
        driver_id: 'u_driver_4',
        vehicle_id: 'v_4',
        trip_id: 'trip_middle_mile_1',
        distance_km: 72.0,
        eta_hours: 2.3,
        from_hub: this.hubs.find((h) => h.id === 'h_chikkaballapur'),
        to_hub: this.hubs.find((h) => h.id === 'h_jayanagar'),
        crop: this.crops.find((c) => c.id === 'c_onion'),
      },
    ];
  }

  private initForecasts() {
    this.priceForecasts = this.crops.map((crop) => ({
      crop_id: crop.id,
      crop_name_en: crop.name_en,
      crop_name_kn: crop.name_kn,
      date: '2026-11-20',
      p10: Math.round(crop.price.low * 0.95),
      p50: Math.round((crop.price.low + crop.price.high) / 2),
      p90: Math.round(crop.price.high * 1.05),
      current_published_low: crop.price.low,
      current_published_high: crop.price.high,
      confidence: 0.92,
      trend: [
        { date: '16 Nov', p50: crop.price.low + 100, actual: crop.price.low + 50 },
        { date: '17 Nov', p50: crop.price.low + 150, actual: crop.price.low + 180 },
        { date: '18 Nov', p50: crop.price.low + 200, actual: crop.price.low + 220 },
        { date: '19 Nov', p50: crop.price.low + 250, actual: crop.price.low + 260 },
        { date: '20 Nov', p50: Math.round((crop.price.low + crop.price.high) / 2) },
      ],
    }));

    this.demandForecasts = [
      {
        hub_id: 'h_main',
        crop_id: 'c_tomato',
        date: '2026-11-20',
        q10_kg: 2800,
        q50_kg: 3400,
        q90_kg: 4100,
        suggested_procure_kg: 3550,
        historical_accuracy: 0.94,
      },
      {
        hub_id: 'h_hsr',
        crop_id: 'c_onion',
        date: '2026-11-20',
        q10_kg: 1200,
        q50_kg: 1600,
        q90_kg: 2000,
        suggested_procure_kg: 1680,
        historical_accuracy: 0.91,
      },
    ];
  }

  private initSettlements() {
    this.settlements = [
      {
        id: 'set_1',
        farmer_id: 'u_farmer_1',
        farmer_name: 'Ramesh Gowda',
        date: '2026-11-19',
        accepted_kg: 210,
        gross_amount: 546000, // ₹5,460
        commission_amount: 32760, // 6% = ₹327.60
        logistics_share: 21000, // ₹1/kg = ₹210
        net_amount: 492240, // ₹4,922.40
        status: 'PAID',
        paid_at: '2026-11-20T09:30:00Z',
        utr: 'UPI/632190881234/YESB',
      },
      {
        id: 'set_2',
        farmer_id: 'u_farmer_2',
        farmer_name: 'Muniyappa K',
        date: '2026-11-19',
        accepted_kg: 320,
        gross_amount: 896000,
        commission_amount: 53760,
        logistics_share: 32000,
        net_amount: 810240,
        status: 'DUE',
      },
      {
        id: 'set_3',
        farmer_id: 'u_farmer_3',
        farmer_name: 'Narayanappa',
        date: '2026-11-18',
        accepted_kg: 280,
        gross_amount: 728000,
        commission_amount: 43680,
        logistics_share: 28000,
        net_amount: 656320,
        status: 'PAID',
        paid_at: '2026-11-19T10:15:00Z',
        utr: 'UPI/632011492019/SBIN',
      },
    ];
  }

  private initAlerts() {
    this.alerts = [
      {
        id: 'alt_1',
        type: 'STOCK_OUT',
        severity: 'critical',
        title: 'Whitefield Hub: French Beans OUT OF STOCK',
        title_kn: 'ವೈಟ್‌ಫೀಲ್ಡ್ ಹಬ್: ಬೀನ್ಸ್ ದಾಸ್ತಾನು ಖಾಲಿಯಾಗಿದೆ',
        message: 'Whitefield City Hub has 0 kg French Beans with 180 kg pending buyer orders.',
        message_kn: 'ವೈಟ್‌ಫೀಲ್ಡ್ ಹಬ್‌ನಲ್ಲಿ ಬೀನ್ಸ್ ದಾಸ್ತಾನು ಖಾಲಿಯಾಗಿದೆ, 180 ಕೆಜಿ ಆರ್ಡರ್ ಬಾಕಿ ಇದೆ.',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        entity_id: 'h_whitefield',
        entity_type: 'hub',
        action_label: 'Request Stock',
        action_route: '/admin/hubs',
      },
      {
        id: 'alt_2',
        type: 'DELAY',
        severity: 'medium',
        title: 'Trip #trip_first_mile_1 delayed by 12 mins',
        title_kn: 'ಟ್ರಿಪ್ #1 ಸುಮಾರು 12 ನಿಮಿಷ ತಡವಾಗಿದೆ',
        message: 'Driver Suresh Kumar slowed down near Vemgal Cross due to rural road work.',
        timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
        entity_id: 'trip_first_mile_1',
        entity_type: 'trip',
        action_label: 'View Live Trip',
        action_route: '/admin/trips/trip_first_mile_1',
      },
      {
        id: 'alt_3',
        type: 'THRESHOLD_WARNING',
        severity: 'low',
        title: 'Ineligible Listing: Ramesh Gowda (15 kg Beans)',
        title_kn: 'ಕನಿಷ್ಠ ಮಿತಿಗಿಂತ ಕಡಿಮೆ ಬೆಳೆ: ರಾಮೇಶ್ ಗೌಡ (15 ಕೆಜಿ ಬೀನ್ಸ್)',
        message: 'Listing is below 30 kg minimum threshold. Suggested action: merge with adjacent pickup.',
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        entity_id: 'list_2',
        entity_type: 'farmer',
        action_label: 'View in Dispatch',
        action_route: '/admin/dispatch',
      },
    ];
  }
}

export const mockDb = new MockDatabase();
