export type MerchantType = 'retail' | 'restaurant';
export type PaymentMethod = 'cash' | 'esewa' | 'fonepay' | 'khalti' | 'khata';
export type TransactionStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export interface Merchant {
  id: string;
  name: string;
  phone: string;
  address?: string;
  type: MerchantType;
  phone_verified: boolean;
}

export interface Product {
  id: string;
  merchant_id: string;
  name: string;
  price: number;       // paisa
  barcode?: string;
  stock_qty?: number;
  category?: string;
  is_active: boolean;
}

export interface SaleItem {
  product_id: string;
  product_name: string;
  qty: number;
  unit_price: number;  // paisa
}

export interface Transaction {
  id: string;
  merchant_id: string;
  total_amount: number;
  discount_amount: number;
  payment_method: PaymentMethod;
  payment_status: TransactionStatus;
  customer_phone?: string;
  receipt_url?: string;
  items: SaleItem[];
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

// Offline sync queue entry
export interface SyncQueueItem {
  id: string;
  action: 'create_transaction';
  payload: string;  // JSON
  created_at: number;
  retries: number;
}
