export interface Product {
  id: string;
  name: string;
  selling_price: number;
  stock_quantity: number;
  category?: string;
  sku?: string;
  created_at?: string;
}

export interface DailyLog {
  id: string;
  log_date: string; // 'YYYY-MM-DD'
  year: number; // e.g. 2026
  month: string; // e.g. 'August'
  day_label: string; // e.g. '21.Aug.2026'
  created_at?: string;
}

export interface Voucher {
  id: string;
  daily_log_id: string;
  voucher_number: string;
  total_amount: number;
  created_at: string;
  status?: 'completed' | 'void_pending' | 'voided';
  payment_method?: 'Cash' | 'Card' | 'Transfer' | 'PromptPay' | 'Other';
  customer_name?: string;
  staff_name?: string;
  notes?: string;
  void_reason?: string;
  items?: VoucherItem[];
}

export interface VoucherItem {
  id: string;
  voucher_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export type TabType = 'pos' | 'archive' | 'inventory' | 'void_approvals';

export interface DailyLogWithSummary extends DailyLog {
  vouchersCount: number;
  totalRevenue: number;
  totalItemsSold: number;
  vouchers: (Voucher & { items: VoucherItem[] })[];
}

export interface ArchiveYearGroup {
  year: number;
  months: {
    month: string;
    logs: DailyLogWithSummary[];
    totalRevenue: number;
    vouchersCount: number;
  }[];
  totalRevenue: number;
  vouchersCount: number;
}
