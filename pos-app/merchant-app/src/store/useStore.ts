import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Merchant, Product, SaleItem } from '../types';
import { Lang } from '../i18n/strings';

interface CustomerInfo { phone: string; name?: string; }

interface AppState {
  lang: Lang;
  role: 'merchant' | 'customer' | null;
  merchant: Merchant | null;
  customer: CustomerInfo | null;
  isOnline: boolean;
  products: Product[];
  cart: SaleItem[];

  setLang: (l: Lang) => void;
  setRole: (r: 'merchant' | 'customer' | null) => void;
  setMerchant: (m: Merchant | null) => void;
  setCustomer: (c: CustomerInfo | null) => void;
  setOnline: (online: boolean) => void;
  setProducts: (products: Product[]) => void;

  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: () => number;

  logout: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  lang: 'en',
  role: null,
  merchant: null,
  customer: null,
  isOnline: true,
  products: [],
  cart: [],

  setLang: (lang) => set({ lang }),
  setRole: (role) => set({ role }),
  setMerchant: (merchant) => set({ merchant }),
  setCustomer: (customer) => set({ customer }),
  setOnline: (isOnline) => set({ isOnline }),
  setProducts: (products) => set({ products }),

  addToCart: (product) => {
    const cart = get().cart;
    const existing = cart.find((i) => i.product_id === product.id);
    if (existing) {
      set({ cart: cart.map((i) => i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i) });
    } else {
      set({ cart: [...cart, { product_id: product.id, product_name: product.name, qty: 1, unit_price: product.price }] });
    }
  },

  removeFromCart: (productId) => set({ cart: get().cart.filter((i) => i.product_id !== productId) }),

  updateQty: (productId, qty) => {
    if (qty <= 0) { get().removeFromCart(productId); return; }
    set({ cart: get().cart.map((i) => i.product_id === productId ? { ...i, qty } : i) });
  },

  clearCart: () => set({ cart: [] }),
  cartTotal: () => get().cart.reduce((sum, i) => sum + i.qty * i.unit_price, 0),

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync('access_token'),
      SecureStore.deleteItemAsync('refresh_token'),
      SecureStore.deleteItemAsync('app_role'),
    ]);
    set({ merchant: null, customer: null, cart: [], role: null });
  },
}));
