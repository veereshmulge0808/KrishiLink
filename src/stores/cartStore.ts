import { create } from 'zustand';
import { Crop } from '../types';

export interface CartItem {
  crop: Crop;
  qty_kg: number;
}

interface CartState {
  items: Record<string, CartItem>; // crop_id -> CartItem
  deliverySlot: string;
  paymentMode: 'PREPAID' | 'CREDIT' | 'UPI';
  deliveryAddress: string;
  addItem: (crop: Crop, qty?: number) => void;
  updateQty: (cropId: string, qty: number) => void;
  removeItem: (cropId: string) => void;
  clearCart: () => void;
  setDeliverySlot: (slot: string) => void;
  setPaymentMode: (mode: 'PREPAID' | 'CREDIT' | 'UPI') => void;
  setDeliveryAddress: (address: string) => void;
  getTotalPaise: () => { low: number; high: number };
  getItemCount: () => number;
  getTotalKg: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: {},
  deliverySlot: '07:00-08:00',
  paymentMode: 'PREPAID',
  deliveryAddress: 'Udupi Upahar, 14th Main, HSR Layout Sector 4, Bengaluru - 560102',

  addItem: (crop: Crop, qty?: number) => {
    const existing = get().items[crop.id];
    const initialQty = qty || (existing ? existing.qty_kg + 5 : crop.min_order_kg);
    set((state) => ({
      items: {
        ...state.items,
        [crop.id]: {
          crop,
          qty_kg: initialQty,
        },
      },
    }));
  },

  updateQty: (cropId: string, qty: number) => {
    set((state) => {
      const existing = state.items[cropId];
      if (!existing) return state;
      if (qty <= 0) {
        const next = { ...state.items };
        delete next[cropId];
        return { items: next };
      }
      return {
        items: {
          ...state.items,
          [cropId]: { ...existing, qty_kg: qty },
        },
      };
    });
  },

  removeItem: (cropId: string) => {
    set((state) => {
      const next = { ...state.items };
      delete next[cropId];
      return { items: next };
    });
  },

  clearCart: () => {
    set({ items: {} });
  },

  setDeliverySlot: (slot: string) => set({ deliverySlot: slot }),
  setPaymentMode: (paymentMode) => set({ paymentMode }),
  setDeliveryAddress: (deliveryAddress) => set({ deliveryAddress }),

  getTotalPaise: () => {
    const items = Object.values(get().items);
    let low = 0;
    let high = 0;
    for (const item of items) {
      low += item.qty_kg * item.crop.price.low;
      high += item.qty_kg * item.crop.price.high;
    }
    return { low, high };
  },

  getItemCount: () => {
    return Object.keys(get().items).length;
  },

  getTotalKg: () => {
    return Object.values(get().items).reduce((sum, item) => sum + item.qty_kg, 0);
  },
}));
