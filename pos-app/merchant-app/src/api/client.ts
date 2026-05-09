import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.189:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
        await SecureStore.setItemAsync('access_token', data.access_token);
        await SecureStore.setItemAsync('refresh_token', data.refresh_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
      }
    }
    return Promise.reject(error);
  }
);

interface MerchantRegisterPayload {
  name: string;
  phone: string;
  password: string;
  address?: string;
  type: 'retail' | 'restaurant';
}

export const authApi = {
  register: (data: MerchantRegisterPayload) => api.post('/auth/register', data),
  login: (phone: string, password: string) => api.post('/auth/login', { phone, password }),
};

export const productsApi = {
  list: () => api.get('/products'),
  create: (data: object) => api.post('/products', data),
  update: (id: string, data: object) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const transactionsApi = {
  create: (data: object) => api.post('/transactions', data),
  get: (id: string) => api.get(`/transactions/${id}`),
  list: (limit = 50) => api.get(`/transactions?limit=${limit}`),
  sendReceipt: (id: string, data: object) => api.post(`/transactions/${id}/receipt`, data),
  dashboard: () => api.get('/dashboard'),
};

export const analyticsApi = {
  get: (period: 'today' | 'week' | 'month') => api.get(`/analytics?period=${period}`),
};

export const storesApi = {
  list: (params?: { lat?: number; lng?: number }) => api.get('/stores', { params }),
  nearby: (lat: number, lng: number, radius_km?: number) =>
    api.get('/stores/nearby', { params: { lat, lng, radius_km: radius_km ?? 5 } }),
  getStore: (storeId: string) => api.get(`/stores/${storeId}`),
  my: () => api.get('/stores/me'),
  updateLocation: (data: { latitude: number; longitude: number; description?: string; is_public: boolean }) =>
    api.put('/stores/me/location', data),
  collectOrders: (status?: string) =>
    api.get('/stores/me/collect-orders', { params: status ? { status_filter: status } : undefined }),
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/stores/me/collect-orders/${id}/status`, null, { params: { new_status: status } }),
  createOffer: (data: object) => api.post('/stores/me/offers', data),
  deleteOffer: (id: string) => api.delete(`/stores/me/offers/${id}`),
  placeCollectOrder: (storeId: string, data: { customer_phone: string; customer_name?: string; items: { product_id: string; qty: number }[]; notes?: string }) =>
    api.post(`/stores/${storeId}/collect`, data),
  rateStore: (storeId: string, rating: number, review?: string) =>
    api.post(`/stores/${storeId}/rate`, { rating, review }),
};

export const customerApi = {
  register: (phone: string, password: string, name?: string) =>
    api.post('/auth/customer/register', { phone, password, name }),
  login: (phone: string, password: string) =>
    api.post('/auth/customer/login', { phone, password }),
  me: () => api.get('/customer/me'),
  updateProfile: (data: { name?: string | null; email?: string | null }) =>
    api.put('/customer/me', data),
  receipts: () => api.get('/customer/receipts'),
  orders: () => api.get('/customer/orders'),
  sendPhoneOtp: () => api.post('/customer/me/verify-phone/send', {}),
  confirmPhoneOtp: (otp: string) => api.post('/customer/me/verify-phone/confirm', { otp }),
  sendEmailOtp: () => api.post('/customer/me/verify-email/send', {}),
  confirmEmailOtp: (otp: string) => api.post('/customer/me/verify-email/confirm', { otp }),
};
