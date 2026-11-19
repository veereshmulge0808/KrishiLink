export const APP_NAME = 'KrishiLink';
export const APP_NAME_KN = 'ಕೃಷಿಲಿಂಕ್';
export const APP_TAGLINE = 'Karnataka Farm-to-Buyer Fresh Logistics Network';

export const STOCK_STATUS = {
  OUT: 'OUT',
  LOW: 'LOW',
  SUFFICIENT: 'SUFFICIENT',
} as const;

export const STOCK_COLORS = {
  OUT: '#DC2626', // Red
  LOW: '#F59E0B', // Amber
  SUFFICIENT: '#16A34A', // Green
} as const;

export const STOCK_LABELS = {
  en: {
    OUT: 'Out of Stock',
    LOW: 'Low Stock',
    SUFFICIENT: 'Sufficient',
  },
  kn: {
    OUT: 'ಖಾಲಿಯಾಗಿದೆ',
    LOW: 'ಕಡಿಮೆ ಇದೆ',
    SUFFICIENT: 'ಸಾಕಷ್ಟಿದೆ',
  },
} as const;

export const TRIP_STATUS_LABELS = {
  ASSIGNED: 'Assigned',
  ACKNOWLEDGED: 'Acknowledged',
  STARTED: 'Started',
  AT_HUB: 'At Hub',
  RETURNED: 'Returned',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
  INCIDENT: 'Incident Reported',
} as const;

export const BENGALURU_COORDS = {
  lat: 13.0285,
  lng: 77.5400,
};

export const CUTOFFS = {
  FARMER_LISTING_TIME: '18:00', // D-1 18:00
  BUYER_ORDER_TIME: '20:00',   // D-1 20:00
  DISPATCH_PLAN_TIME: '22:00', // D-1 22:00
  FIRST_MILE_START: '03:30',
  DELIVERY_DEADLINE: '10:00',
};

export const DEFAULT_THRESHOLDS = {
  MIN_FARMER_KG: 20,
  MIN_ROUTE_PAYLOAD_KG: 150,
  VARIANCE_TOLERANCE_PERCENT: 2.0,
  FARMER_WAIT_TIME_MINUTES: 10,
};
