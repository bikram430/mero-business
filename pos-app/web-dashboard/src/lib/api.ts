import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.merobusiness.com.np';

export const api = axios.create({ baseURL: BASE_URL, withCredentials: false });

// ── Request: attach current access token ──────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: silently refresh on 401, retry once ────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

function drainQueue(err: any, token: string | null = null) {
  refreshQueue.forEach(p => err ? p.reject(err) : p.resolve(token!));
  refreshQueue = [];
}

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;

    // Only intercept 401 and only once per request
    if (err.response?.status !== 401 || original._retry) return Promise.reject(err);

    // If a refresh is already in-flight, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then(newToken => {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    const refreshTok = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

    if (!refreshTok) {
      isRefreshing = false;
      return Promise.reject(err);
    }

    try {
      // Call refresh directly (not through `api` to avoid interceptor loop)
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshTok });
      const newAccess: string = data.access_token;

      localStorage.setItem('access_token', newAccess);
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
      api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;

      drainQueue(null, newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (refreshErr) {
      drainQueue(refreshErr, null);
      // Don't redirect here — let the page decide what to do
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

// ── API surfaces ──────────────────────────────────────────────────────────────
export const authApi = {
  login:    (phone: string, password: string) => api.post('/auth/login', { phone, password }),
  register: (data: { name: string; phone: string; password: string; address?: string; type: string }) =>
    api.post('/auth/register', data),
  me:       () => api.get('/auth/me'),
  refresh:  (token: string) => api.post('/auth/refresh', { refresh_token: token }),
};

export const dashboardApi = { get: () => api.get('/dashboard') };

export const productsApi = {
  list:   () => api.get('/products'),
  create: (data: object) => api.post('/products', data),
  update: (id: string, data: object) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const transactionsApi = {
  recent: (limit = 20) => api.get(`/transactions?limit=${limit}`),
  create: (data: object) => api.post('/transactions', data),
};

// Axios instance that attaches customer_access_token instead of merchant token
const customerAuthApi = axios.create({ baseURL: BASE_URL, withCredentials: false });
customerAuthApi.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('customer_access_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const customerApi = {
  login:    (phone: string, password: string) => api.post('/auth/customer/login', { phone, password }),
  register: (phone: string, password: string, name?: string) =>
    api.post('/auth/customer/register', { phone, password, name }),
  receipts: () => customerAuthApi.get('/customer/receipts'),
};

export const storeApi = {
  updateLocation:  (data: object) => api.put('/stores/me/location', data),
  createOffer:     (data: object) => api.post('/stores/me/offers', data),
  deleteOffer:     (id: string)   => api.delete(`/stores/me/offers/${id}`),
  collectOrders:   (statusFilter?: string) =>
    api.get('/stores/me/collect-orders', { params: statusFilter ? { status_filter: statusFilter } : {} }),
  updateOrderStatus: (id: string, newStatus: string) =>
    api.put(`/stores/me/collect-orders/${id}/status`, null, { params: { new_status: newStatus } }),
};

export const khataApi = {
  create:        (data: object) => api.post('/khata', data),
  list:          ()             => api.get('/khata'),
  recordPayment: (id: string, amount: number) => api.post(`/khata/${id}/pay`, { amount_paid: amount }),
};
