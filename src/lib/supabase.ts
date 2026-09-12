import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, DailyLog, Voucher, VoucherItem, DailyLogWithSummary } from '../types';

// ==================== UUID UTILITIES ====================
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isValidUUID(str: string | undefined | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// Get configured Supabase Client
const getStoredSupabaseConfig = () => {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL;
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey) {
    return { url: envUrl, key: envKey };
  }
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('shopflow_supabase_url') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('shopflow_supabase_anon_key') : null;
  if (localUrl && localKey) {
    return { url: localUrl, key: localKey };
  }
  return null;
};

const config = getStoredSupabaseConfig();
export const isLiveSupabase = Boolean(config?.url && config?.key);

export const supabase: SupabaseClient = config?.url && config?.key
  ? createClient(config.url, config.key)
  : createClient('https://mock-instance.supabase.co', 'mock-anon-key');

// Storage keys for local persistence & offline fallback
const STORAGE_KEYS = {
  PRODUCTS: 'shopflow_db_products',
  DAILY_LOGS: 'shopflow_db_daily_logs',
  VOUCHERS: 'shopflow_db_vouchers',
  VOUCHER_ITEMS: 'shopflow_db_voucher_items',
  OWNER_PIN: 'shopflow_owner_pin',
};

// Owner Security PIN Management (Default: 1234)
export const DEFAULT_OWNER_PIN = '1234';

export function getStoredOwnerPin(): string {
  if (typeof window === 'undefined') return DEFAULT_OWNER_PIN;
  return localStorage.getItem(STORAGE_KEYS.OWNER_PIN) || DEFAULT_OWNER_PIN;
}

export function setStoredOwnerPin(newPin: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.OWNER_PIN, newPin.trim());
  }
}

export function verifyOwnerPin(inputPin: string): boolean {
  if (!inputPin) return false;
  return inputPin.trim() === getStoredOwnerPin();
}

// Initial Seed Data with valid UUIDs
const DEFAULT_PRODUCTS: Product[] = [
  { id: '11111111-1111-4111-a111-111111111101', name: 'Organic Matcha Green Tea 100g', selling_price: 14.50, stock_quantity: 42, category: 'Beverages', sku: 'TEA-MAT-01' },
  { id: '11111111-1111-4111-a111-111111111102', name: 'Artisan Sourdough Loaf 750g', selling_price: 6.80, stock_quantity: 18, category: 'Bakery', sku: 'BAK-SOU-02' },
  { id: '11111111-1111-4111-a111-111111111103', name: 'Single Origin Espresso Beans 250g', selling_price: 12.00, stock_quantity: 35, category: 'Beverages', sku: 'COF-ESP-03' },
  { id: '11111111-1111-4111-a111-111111111104', name: 'Dark Chocolate Almond Bark 150g', selling_price: 7.25, stock_quantity: 26, category: 'Snacks', sku: 'SNK-CHO-04' },
  { id: '11111111-1111-4111-a111-111111111105', name: 'Cold Pressed Olive Oil 500ml', selling_price: 18.90, stock_quantity: 12, category: 'Pantry', sku: 'PAN-OIL-05' },
  { id: '11111111-1111-4111-a111-111111111106', name: 'Natural Raw Wildflower Honey 300g', selling_price: 9.50, stock_quantity: 20, category: 'Pantry', sku: 'PAN-HON-06' },
  { id: '11111111-1111-4111-a111-111111111107', name: 'Sea Salt & Rosemary Crackers', selling_price: 4.80, stock_quantity: 0, category: 'Snacks', sku: 'SNK-CRA-07' },
  { id: '11111111-1111-4111-a111-111111111108', name: 'Almond Milk Barista Edition 1L', selling_price: 3.95, stock_quantity: 50, category: 'Beverages', sku: 'DRK-MLK-08' },
  { id: '11111111-1111-4111-a111-111111111109', name: 'Organic Rolled Oats 1kg', selling_price: 5.50, stock_quantity: 24, category: 'Grains', sku: 'GRN-OAT-09' },
  { id: '11111111-1111-4111-a111-111111111110', name: 'Bamboo Fibre Travel Tumbler 400ml', selling_price: 16.00, stock_quantity: 8, category: 'Merchandise', sku: 'MER-TUM-10' },
  { id: '11111111-1111-4111-a111-111111111111', name: 'Handcrafted Lavender Soy Candle', selling_price: 15.00, stock_quantity: 14, category: 'Home', sku: 'HOM-CND-11' },
  { id: '11111111-1111-4111-a111-111111111112', name: 'Sparkling Mineral Water 330ml', selling_price: 2.20, stock_quantity: 60, category: 'Beverages', sku: 'DRK-WAT-12' },
];

export const getMonthName = (monthIndex: number): string => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[monthIndex] || 'August';
};

export const getDayLabel = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = shortMonths[date.getMonth()];
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Local storage seed initialization
const initializeLocalStorage = () => {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.DAILY_LOGS)) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatYMD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const logTodayId = generateUUID();
    const logYestId = generateUUID();

    const sampleLogs: DailyLog[] = [
      {
        id: logTodayId,
        log_date: formatYMD(today),
        year: today.getFullYear(),
        month: getMonthName(today.getMonth()),
        day_label: getDayLabel(today),
      },
      {
        id: logYestId,
        log_date: formatYMD(yesterday),
        year: yesterday.getFullYear(),
        month: getMonthName(yesterday.getMonth()),
        day_label: getDayLabel(yesterday),
      },
    ];

    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(sampleLogs));

    const vch1Id = generateUUID();
    const vch2Id = generateUUID();

    const sampleVouchers: Voucher[] = [
      {
        id: vch1Id,
        daily_log_id: logYestId,
        voucher_number: `VCH-${yesterday.getFullYear()}0823-101`,
        total_amount: 33.40,
        status: 'completed',
        created_at: new Date(yesterday.getTime() + 10 * 3600000).toISOString(),
      },
      {
        id: vch2Id,
        daily_log_id: logTodayId,
        voucher_number: `VCH-${today.getFullYear()}0824-102`,
        total_amount: 26.50,
        status: 'completed',
        created_at: new Date(today.getTime() - 2 * 3600000).toISOString(),
      },
    ];

    const sampleItems: VoucherItem[] = [
      {
        id: generateUUID(),
        voucher_id: vch1Id,
        product_id: DEFAULT_PRODUCTS[0].id,
        product_name: DEFAULT_PRODUCTS[0].name,
        quantity: 1,
        unit_price: 14.50,
        subtotal: 14.50,
      },
      {
        id: generateUUID(),
        voucher_id: vch1Id,
        product_id: DEFAULT_PRODUCTS[4].id,
        product_name: DEFAULT_PRODUCTS[4].name,
        quantity: 1,
        unit_price: 18.90,
        subtotal: 18.90,
      },
      {
        id: generateUUID(),
        voucher_id: vch2Id,
        product_id: DEFAULT_PRODUCTS[2].id,
        product_name: DEFAULT_PRODUCTS[2].name,
        quantity: 1,
        unit_price: 12.00,
        subtotal: 12.00,
      },
      {
        id: generateUUID(),
        voucher_id: vch2Id,
        product_id: DEFAULT_PRODUCTS[0].id,
        product_name: DEFAULT_PRODUCTS[0].name,
        quantity: 1,
        unit_price: 14.50,
        subtotal: 14.50,
      },
    ];

    localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(sampleVouchers));
    localStorage.setItem(STORAGE_KEYS.VOUCHER_ITEMS, JSON.stringify(sampleItems));
  }
};

initializeLocalStorage();

// ==================== DB SERVICE ====================
export const dbService = {
  // ----------------------------------------------------
  // 1. PRODUCTS MANAGEMENT (VIEW & LIVE STOCK)
  // ----------------------------------------------------
  async getProducts(): Promise<Product[]> {
    if (isLiveSupabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, selling_price, stock_quantity')
          .order('name');
        
        if (!error && data) {
          const mapped: Product[] = data.map(p => ({
            id: p.id,
            name: p.name,
            selling_price: Number(p.selling_price) || 0,
            stock_quantity: Number(p.stock_quantity) || 0,
          }));
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(mapped));
          return mapped;
        }
        if (error) {
          console.warn('Supabase getProducts returned error:', error.message);
        }
      } catch (err) {
        console.warn('Supabase live fetch error, fallback local:', err);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return raw ? JSON.parse(raw) : DEFAULT_PRODUCTS;
  },

  async addProduct(product: { name: string; selling_price: number; stock_quantity: number; category?: string; sku?: string }): Promise<Product> {
    const payload = {
      name: product.name.trim(),
      selling_price: Number(product.selling_price),
      stock_quantity: Number(product.stock_quantity),
    };

    if (isLiveSupabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert([payload])
          .select('id, name, selling_price, stock_quantity')
          .single();

        if (!error && data) {
          const created: Product = {
            id: data.id,
            name: data.name,
            selling_price: Number(data.selling_price),
            stock_quantity: Number(data.stock_quantity),
            category: product.category,
            sku: product.sku,
          };
          await this.getProducts();
          return created;
        }
        if (error) {
          console.error('Supabase addProduct insert error:', error);
          throw new Error(error.message);
        }
      } catch (err: any) {
        console.warn('Supabase product insert error, writing locally:', err);
        throw err;
      }
    }

    const localProduct: Product = {
      id: generateUUID(),
      ...payload,
      category: product.category,
      sku: product.sku,
    };
    const products = await this.getProducts();
    const updated = [localProduct, ...products];
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    return localProduct;
  },

  async updateProduct(product: { id: string; name: string; selling_price: number; stock_quantity: number; category?: string; sku?: string }): Promise<Product> {
    const payload = {
      name: product.name.trim(),
      selling_price: Number(product.selling_price),
      stock_quantity: Number(product.stock_quantity),
    };

    if (isLiveSupabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', product.id)
          .select('id, name, selling_price, stock_quantity')
          .single();

        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            selling_price: Number(data.selling_price),
            stock_quantity: Number(data.stock_quantity),
            category: product.category,
            sku: product.sku,
          };
        }
        if (error) {
          console.error('Supabase updateProduct error:', error);
          throw new Error(error.message);
        }
      } catch (err: any) {
        console.warn('Supabase update error:', err);
        throw err;
      }
    }

    const products = await this.getProducts();
    const idx = products.findIndex(p => p.id === product.id);
    const updatedProd: Product = { id: product.id, ...payload, category: product.category, sku: product.sku };
    if (idx !== -1) {
      products[idx] = updatedProd;
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    }
    return updatedProd;
  },

  async updateStock(productId: string, deltaQuantity: number): Promise<number> {
    const products = await this.getProducts();
    const target = products.find(p => p.id === productId);
    if (!target) return 0;

    const newStock = Math.max(0, target.stock_quantity + deltaQuantity);

    if (isLiveSupabase) {
      try {
        await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', productId);
      } catch (err) {
        console.warn('Supabase updateStock error:', err);
      }
    }

    target.stock_quantity = newStock;
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return newStock;
  },

  async deleteProduct(productId: string): Promise<boolean> {
    if (isLiveSupabase) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);

        if (error) {
          console.error('Supabase deleteProduct error:', error);
          throw new Error(error.message);
        }
      } catch (err: any) {
        console.warn('Supabase delete error:', err);
        throw err;
      }
    }

    const products = await this.getProducts();
    const filtered = products.filter(p => p.id !== productId);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
    return true;
  },

  // ----------------------------------------------------
  // 2. DAILY LOGS MANAGEMENT
  // ----------------------------------------------------
  async getDailyLogs(): Promise<DailyLog[]> {
    if (isLiveSupabase) {
      try {
        const { data, error } = await supabase
          .from('daily_logs')
          .select('id, log_date, year, month, day_label')
          .order('log_date', { ascending: false });

        if (!error && data) {
          localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(data));
          return data as DailyLog[];
        }
      } catch (err) {
        console.warn('Supabase getDailyLogs error:', err);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
    const logs: DailyLog[] = raw ? JSON.parse(raw) : [];
    return logs.sort((a, b) => b.log_date.localeCompare(a.log_date));
  },

  async getOrCreateTodayLog(): Promise<DailyLog> {
    const todayStr = getTodayDateString();
    const todayDate = new Date();

    if (isLiveSupabase) {
      try {
        // 1. Check if today's record exists in daily_logs
        const { data: existing, error: findError } = await supabase
          .from('daily_logs')
          .select('id, log_date, year, month, day_label')
          .eq('log_date', todayStr)
          .maybeSingle();

        if (!findError && existing) {
          return existing as DailyLog;
        }

        // 2. If not, insert into daily_logs and retrieve its id (uuid)
        const newPayload = {
          log_date: todayStr,
          year: todayDate.getFullYear(),
          month: getMonthName(todayDate.getMonth()),
          day_label: getDayLabel(todayDate),
        };

        const { data: created, error: insertError } = await supabase
          .from('daily_logs')
          .insert([newPayload])
          .select('id, log_date, year, month, day_label')
          .single();

        if (!insertError && created) {
          const logs = await this.getDailyLogs();
          localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify([created, ...logs.filter(l => l.id !== created.id)]));
          return created as DailyLog;
        }
      } catch (err) {
        console.warn('Supabase getOrCreateTodayLog error:', err);
      }
    }

    const logs = await this.getDailyLogs();
    const existingLocal = logs.find(l => l.log_date === todayStr);
    if (existingLocal) return existingLocal;

    const newLog: DailyLog = {
      id: generateUUID(),
      log_date: todayStr,
      year: todayDate.getFullYear(),
      month: getMonthName(todayDate.getMonth()),
      day_label: getDayLabel(todayDate),
    };

    const updatedLogs = [newLog, ...logs];
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(updatedLogs));
    return newLog;
  },

  async createCustomDailyLog(dateStr: string): Promise<DailyLog> {
    const todayStr = getTodayDateString();
    if (dateStr > todayStr) {
      throw new Error(`Cannot create a daily log for future date (${dateStr}). Maximum allowed date is today (${todayStr}).`);
    }

    const [y, m, d] = dateStr.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d, 12, 0, 0);

    if (isLiveSupabase) {
      try {
        const { data: existing } = await supabase
          .from('daily_logs')
          .select('id, log_date, year, month, day_label')
          .eq('log_date', dateStr)
          .maybeSingle();

        if (existing) return existing as DailyLog;

        const newPayload = {
          log_date: dateStr,
          year: targetDate.getFullYear(),
          month: getMonthName(targetDate.getMonth()),
          day_label: getDayLabel(targetDate),
        };

        const { data: created, error } = await supabase
          .from('daily_logs')
          .insert([newPayload])
          .select('id, log_date, year, month, day_label')
          .single();

        if (!error && created) {
          return created as DailyLog;
        }
      } catch (err) {
        console.warn('Supabase createCustomDailyLog error:', err);
      }
    }

    const logs = await this.getDailyLogs();
    const existing = logs.find(l => l.log_date === dateStr);
    if (existing) return existing;

    const newLog: DailyLog = {
      id: generateUUID(),
      log_date: dateStr,
      year: targetDate.getFullYear(),
      month: getMonthName(targetDate.getMonth()),
      day_label: getDayLabel(targetDate),
    };

    const updatedLogs = [newLog, ...logs];
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(updatedLogs));
    return newLog;
  },

  async deleteDailyLog(dailyLogId: string): Promise<boolean> {
    if (isLiveSupabase) {
      try {
        // Cascade delete child vouchers and voucher_items
        const { data: vchs } = await supabase.from('vouchers').select('id').eq('daily_log_id', dailyLogId);
        if (vchs && vchs.length > 0) {
          const vchIds = vchs.map(v => v.id);
          await supabase.from('voucher_items').delete().in('voucher_id', vchIds);
          await supabase.from('vouchers').delete().eq('daily_log_id', dailyLogId);
        }

        const { error } = await supabase.from('daily_logs').delete().eq('id', dailyLogId);
        if (error) {
          console.error('Supabase deleteDailyLog error:', error);
          throw new Error(error.message);
        }
      } catch (err: any) {
        console.warn('Supabase deleteDailyLog error:', err);
        throw err;
      }
    }

    const logs = await this.getDailyLogs();
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs.filter(l => l.id !== dailyLogId)));

    const vouchers = await this.getVouchers();
    const deletedVoucherIds = vouchers.filter(v => v.daily_log_id === dailyLogId).map(v => v.id);
    localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(vouchers.filter(v => v.daily_log_id !== dailyLogId)));

    const items = await this.getVoucherItems();
    localStorage.setItem(STORAGE_KEYS.VOUCHER_ITEMS, JSON.stringify(items.filter(i => !deletedVoucherIds.includes(i.voucher_id))));

    return true;
  },

  // ----------------------------------------------------
  // 3. FIXED VOUCHER CREATION FLOW (NO FRONTEND STOCK DEDUCTION)
  // ----------------------------------------------------
  async createVoucherWithItems(params: {
    dailyLogId?: string;
    totalAmount: number;
    items: {
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[];
    paymentMethod?: 'Cash' | 'Card' | 'Transfer' | 'PromptPay' | 'Other';
    customerName?: string;
    staffName?: string;
    notes?: string;
  }): Promise<{ voucher: Voucher; items: VoucherItem[] }> {
    // 1. Ensure active daily log exists (check if today's record exists in daily_logs, insert if missing)
    let targetDailyLogId = params.dailyLogId;
    if (!targetDailyLogId) {
      const todayLog = await this.getOrCreateTodayLog();
      targetDailyLogId = todayLog.id;
    }

    const now = new Date();
    const dateFormatted = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const voucherNumber = `VCH-${dateFormatted}-${randomSeq}`;
    const cleanTotalAmount = Number(params.totalAmount.toFixed(2));

    let createdVoucherId = generateUUID();

    if (isLiveSupabase) {
      try {
        // 2. Insert into vouchers passing ONLY: daily_log_id, voucher_number, total_amount, status
        // and retrieve generated voucher id (uuid) using .select()
        const voucherPayload = {
          daily_log_id: targetDailyLogId,
          voucher_number: voucherNumber,
          total_amount: cleanTotalAmount,
          status: 'completed',
        };

        const { data: voucherData, error: voucherError } = await supabase
          .from('vouchers')
          .insert([voucherPayload])
          .select('id, daily_log_id, voucher_number, total_amount, status')
          .single();

        if (voucherError) {
          // If status column doesn't exist yet on remote schema, fall back without status
          if (voucherError.message?.includes('status')) {
            const fallbackPayload = {
              daily_log_id: targetDailyLogId,
              voucher_number: voucherNumber,
              total_amount: cleanTotalAmount,
            };
            const { data: retryData, error: retryError } = await supabase
              .from('vouchers')
              .insert([fallbackPayload])
              .select('id, daily_log_id, voucher_number, total_amount')
              .single();

            if (retryError) {
              console.error('Supabase voucher insert fallback error:', retryError);
              throw new Error(`Failed to insert voucher: ${retryError.message}`);
            }
            if (retryData && retryData.id) {
              createdVoucherId = retryData.id;
            }
          } else {
            console.error('Supabase voucher insert error:', voucherError);
            throw new Error(`Failed to insert voucher: ${voucherError.message}`);
          }
        } else if (voucherData && voucherData.id) {
          createdVoucherId = voucherData.id;
        }

        // 3. Insert line items into voucher_items using: voucher_id, product_id, product_name, quantity, unit_price, subtotal
        // CRITICAL: The Supabase PostgreSQL trigger `trigger_deduct_stock_on_voucher_item` automatically
        // deducts product stock. FRONTEND DOES NOT EXECUTE ANY MANUAL UPDATE ON PRODUCTS!
        const itemsPayload = params.items.map(item => ({
          voucher_id: createdVoucherId,
          product_id: isValidUUID(item.productId) ? item.productId : null,
          product_name: item.productName,
          quantity: Number(item.quantity),
          unit_price: Number(item.unitPrice.toFixed(2)),
          subtotal: Number(item.subtotal.toFixed(2)),
        }));

        const { error: itemsError } = await supabase
          .from('voucher_items')
          .insert(itemsPayload);

        if (itemsError) {
          console.error('Supabase voucher_items insert error:', itemsError);
          throw new Error(`Failed to insert voucher items: ${itemsError.message}`);
        }

        // Re-fetch products from Supabase to sync live trigger-updated stock values
        await this.getProducts();
      } catch (err: any) {
        console.error('Supabase createVoucherWithItems error:', err);
        throw err;
      }
    }

    const generatedItems: VoucherItem[] = params.items.map((item) => ({
      id: generateUUID(),
      voucher_id: createdVoucherId,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: Number(item.unitPrice.toFixed(2)),
      subtotal: Number(item.subtotal.toFixed(2)),
    }));

    const finalVoucher: Voucher = {
      id: createdVoucherId,
      daily_log_id: targetDailyLogId,
      voucher_number: voucherNumber,
      total_amount: cleanTotalAmount,
      status: 'completed',
      payment_method: params.paymentMethod || 'Cash',
      customer_name: params.customerName || 'Walk-in Customer',
      staff_name: params.staffName || 'Staff',
      notes: params.notes,
      created_at: now.toISOString(),
      items: generatedItems,
    };

    // Update local mirror for immediate offline and UI access
    const vouchers = await this.getVouchers();
    localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify([finalVoucher, ...vouchers]));

    const allItems = await this.getVoucherItems();
    localStorage.setItem(STORAGE_KEYS.VOUCHER_ITEMS, JSON.stringify([...generatedItems, ...allItems]));

    // Offline simulation stock update ONLY when not connected to live Supabase triggers
    if (!isLiveSupabase) {
      const products = await this.getProducts();
      for (const item of params.items) {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          prod.stock_quantity = Math.max(0, prod.stock_quantity - item.quantity);
        }
      }
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    }

    return {
      voucher: finalVoucher,
      items: generatedItems,
    };
  },

  // ----------------------------------------------------
  // 4. VOID WORKFLOW (STAFF REQUEST & OWNER APPROVAL)
  // ----------------------------------------------------
  async requestVoid(voucherId: string, voidReason?: string): Promise<boolean> {
    const reasonText = voidReason?.trim() || 'Void requested by staff';
    // 1. Update Supabase live database if connected
    if (isLiveSupabase) {
      try {
        const { data, error } = await supabase
          .from('vouchers')
          .update({ 
            status: 'void_pending',
            void_reason: reasonText
          })
          .eq('id', voucherId)
          .select();

        if (error) {
          console.error('Void request failed:', error);
          alert('Failed to request void: ' + error.message);
          throw new Error(error.message);
        }
      } catch (err: any) {
        console.error('Supabase requestVoid error:', err);
        throw err;
      }
    }

    // 2. Update local storage cache
    const vouchers = await this.getVouchers();
    const idx = vouchers.findIndex(v => v.id === voucherId);
    if (idx !== -1) {
      vouchers[idx].status = 'void_pending';
      vouchers[idx].void_reason = reasonText;
      localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(vouchers));
    }

    return true;
  },

  async approveVoid(voucherId: string): Promise<boolean> {
    // 1. If live Supabase is connected, ONLY execute the status update on the 'vouchers' table.
    // The PostgreSQL trigger `trigger_restore_stock_on_voucher_void` handles adding stock back to public.products automatically.
    // FRONTEND DOES NOT MANIPULATE STOCK QUANTITIES.
    if (isLiveSupabase) {
      try {
        const { error: vError } = await supabase
          .from('vouchers')
          .update({ status: 'voided' })
          .eq('id', voucherId);

        if (vError) {
          console.error('Approve void failed:', vError);
          alert('Failed to approve void in database: ' + vError.message);
          throw new Error(vError.message);
        }

        // Immediately re-fetch products from Supabase to sync live trigger-restored stock values (+1 accurately)
        await this.getProducts();
      } catch (err: any) {
        console.error('Supabase approveVoid error:', err);
        throw err;
      }
    }

    // 2. Update local cache: Mark voucher as voided
    const vouchers = await this.getVouchers();
    const vIdx = vouchers.findIndex(v => v.id === voucherId);
    if (vIdx !== -1) {
      vouchers[vIdx].status = 'voided';
      localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(vouchers));
    }

    // Offline simulation stock update ONLY when not connected to live Supabase triggers
    if (!isLiveSupabase) {
      const voucherItems = await this.getVoucherItems(voucherId);
      const products = await this.getProducts();
      for (const item of voucherItems) {
        const prod = products.find(p => p.id === item.product_id);
        if (prod) {
          prod.stock_quantity = Number(prod.stock_quantity) + Number(item.quantity || 1);
        }
      }
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    }

    return true;
  },

  async rejectVoid(voucherId: string): Promise<boolean> {
    // 1. Update live Supabase
    if (isLiveSupabase) {
      try {
        const { error } = await supabase
          .from('vouchers')
          .update({ status: 'completed' })
          .eq('id', voucherId);

        if (error) {
          console.error('Supabase rejectVoid error:', error);
          alert('Failed to reject void in database: ' + error.message);
          throw new Error(error.message);
        }
      } catch (err: any) {
        console.error('Supabase rejectVoid error:', err);
        throw err;
      }
    }

    // 2. Update local cache
    const vouchers = await this.getVouchers();
    const idx = vouchers.findIndex(v => v.id === voucherId);
    if (idx !== -1) {
      vouchers[idx].status = 'completed';
      localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(vouchers));
    }

    return true;
  },

  async getPendingVoids(): Promise<(Voucher & { items: VoucherItem[]; daily_log_label?: string })[]> {
    let pendingVouchers: Voucher[] = [];
    let allItems: VoucherItem[] = [];
    let allLogs: DailyLog[] = [];

    if (isLiveSupabase) {
      try {
        // Query vouchers without complex embedded joins to avoid PostgREST schema cache errors
        const { data: vData, error: vError } = await supabase
          .from('vouchers')
          .select('id, daily_log_id, voucher_number, total_amount, status, created_at, customer_name, staff_name, void_reason')
          .eq('status', 'void_pending');

        if (!vError && vData && vData.length > 0) {
          pendingVouchers = vData.map(v => ({
            id: v.id,
            daily_log_id: v.daily_log_id,
            voucher_number: v.voucher_number,
            total_amount: Number(v.total_amount) || 0,
            status: 'void_pending',
            created_at: v.created_at || new Date().toISOString(),
            customer_name: v.customer_name,
            staff_name: v.staff_name,
            void_reason: v.void_reason || undefined,
          }));

          const voucherIds = pendingVouchers.map(v => v.id);
          const { data: itemsData } = await supabase
            .from('voucher_items')
            .select('id, voucher_id, product_id, product_name, quantity, unit_price, subtotal')
            .in('voucher_id', voucherIds);

          if (itemsData) {
            allItems = itemsData.map(i => ({
              id: i.id,
              voucher_id: i.voucher_id,
              product_id: i.product_id,
              product_name: i.product_name,
              quantity: Number(i.quantity) || 0,
              unit_price: Number(i.unit_price) || 0,
              subtotal: Number(i.subtotal) || 0,
            }));
          }

          const { data: logsData } = await supabase
            .from('daily_logs')
            .select('id, log_date, year, month, day_label');
          if (logsData) {
            allLogs = logsData as DailyLog[];
          }
        }
      } catch (err) {
        console.warn('Supabase getPendingVoids error:', err);
      }
    }

    // Merge with local storage cache
    const localVouchers = await this.getVouchers();
    const localLogs = await this.getDailyLogs();
    const localItems = await this.getVoucherItems();

    const voucherMap = new Map<string, Voucher>();
    pendingVouchers.forEach(v => voucherMap.set(v.id, v));
    localVouchers.filter(v => v.status === 'void_pending').forEach(v => {
      if (!voucherMap.has(v.id)) {
        voucherMap.set(v.id, v);
      }
    });

    const mergedPending = Array.from(voucherMap.values());

    return mergedPending.map(v => {
      const log = allLogs.find(l => l.id === v.daily_log_id) || localLogs.find(l => l.id === v.daily_log_id);
      const items = allItems.filter(i => i.voucher_id === v.id).length > 0
        ? allItems.filter(i => i.voucher_id === v.id)
        : localItems.filter(i => i.voucher_id === v.id);

      return {
        ...v,
        daily_log_label: log?.day_label,
        items,
      };
    });
  },

  async deleteVoucher(voucherId: string): Promise<boolean> {
    if (isLiveSupabase) {
      try {
        await supabase.from('voucher_items').delete().eq('voucher_id', voucherId);
        const { error } = await supabase.from('vouchers').delete().eq('id', voucherId);
        if (error) {
          console.error('Supabase deleteVoucher error:', error);
          throw new Error(error.message);
        }
      } catch (err: any) {
        console.warn('Supabase deleteVoucher error:', err);
        throw err;
      }
    }

    const vouchers = await this.getVouchers();
    localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(vouchers.filter(v => v.id !== voucherId)));

    const items = await this.getVoucherItems();
    localStorage.setItem(STORAGE_KEYS.VOUCHER_ITEMS, JSON.stringify(items.filter(i => i.voucher_id !== voucherId)));

    return true;
  },

  async getVouchers(dailyLogId?: string): Promise<Voucher[]> {
    if (isLiveSupabase) {
      try {
        let query = supabase.from('vouchers').select('id, daily_log_id, voucher_number, total_amount, status, created_at, customer_name, staff_name, void_reason');
        if (dailyLogId) query = query.eq('daily_log_id', dailyLogId);
        const { data, error } = await query;
        if (!error && data) {
          return data.map(v => ({
            ...v,
            status: v.status || 'completed',
          })) as Voucher[];
        }
      } catch (err) {
        console.warn('Supabase getVouchers error:', err);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.VOUCHERS);
    const vouchers: Voucher[] = raw ? JSON.parse(raw) : [];
    if (dailyLogId) {
      return vouchers.filter(v => v.daily_log_id === dailyLogId);
    }
    return vouchers;
  },

  async getVoucherItems(voucherId?: string): Promise<VoucherItem[]> {
    if (isLiveSupabase) {
      try {
        let query = supabase.from('voucher_items').select('id, voucher_id, product_id, product_name, quantity, unit_price, subtotal');
        if (voucherId) query = query.eq('voucher_id', voucherId);
        const { data, error } = await query;
        if (!error && data) {
          return data as VoucherItem[];
        }
      } catch (err) {
        console.warn('Supabase getVoucherItems error:', err);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.VOUCHER_ITEMS);
    const items: VoucherItem[] = raw ? JSON.parse(raw) : [];
    if (voucherId) {
      return items.filter(i => i.voucher_id === voucherId);
    }
    return items;
  },

  // ----------------------------------------------------
  // 5. NOTION-STYLE ARCHIVE & METRICS (JOIN & SUM(quantity))
  // Pending void requests remain in metrics. ONLY Owner-approved 'voided' vouchers are deducted.
  // ----------------------------------------------------
  async getArchiveTree(): Promise<DailyLogWithSummary[]> {
    let logs: DailyLog[] = [];
    let vouchersWithItems: (Voucher & { items: VoucherItem[] })[] = [];

    if (isLiveSupabase) {
      try {
        const { data: logsData, error: logsError } = await supabase
          .from('daily_logs')
          .select('id, log_date, year, month, day_label')
          .order('log_date', { ascending: false });

        if (!logsError && logsData) {
          logs = logsData as DailyLog[];
          localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
        }

        // Fetch vouchers and items with fallback to separate queries for bulletproof PostgREST compatibility
        const { data: vchsData, error: vchsError } = await supabase
          .from('vouchers')
          .select('id, daily_log_id, voucher_number, total_amount, status, created_at, customer_name, staff_name, void_reason');

        if (!vchsError && vchsData) {
          const voucherIds = vchsData.map(v => v.id);
          let allVoucherItems: VoucherItem[] = [];

          if (voucherIds.length > 0) {
            const { data: itemsData } = await supabase
              .from('voucher_items')
              .select('id, voucher_id, product_id, product_name, quantity, unit_price, subtotal')
              .in('voucher_id', voucherIds);

            if (itemsData) {
              allVoucherItems = itemsData.map(item => ({
                id: item.id,
                voucher_id: item.voucher_id,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: Number(item.quantity) || 0,
                unit_price: Number(item.unit_price) || 0,
                subtotal: Number(item.subtotal) || 0,
              }));
            }
          }

          vouchersWithItems = vchsData.map(v => ({
            id: v.id,
            daily_log_id: v.daily_log_id,
            voucher_number: v.voucher_number,
            total_amount: Number(v.total_amount) || 0,
            status: v.status || 'completed',
            customer_name: v.customer_name,
            staff_name: v.staff_name,
            void_reason: v.void_reason || undefined,
            created_at: v.created_at || new Date().toISOString(),
            items: allVoucherItems.filter(i => i.voucher_id === v.id),
          }));
        }
      } catch (err) {
        console.warn('Supabase getArchiveTree error, reading fallback:', err);
      }
    }

    if (logs.length === 0) {
      logs = await this.getDailyLogs();
    }

    if (vouchersWithItems.length === 0) {
      const vchs = await this.getVouchers();
      const allItems = await this.getVoucherItems();
      vouchersWithItems = vchs.map(v => ({
        ...v,
        status: v.status || 'completed',
        total_amount: Number(v.total_amount) || 0,
        created_at: v.created_at || new Date().toISOString(),
        items: allItems
          .filter(i => i.voucher_id === v.id)
          .map(item => ({
            ...item,
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
            subtotal: Number(item.subtotal) || 0,
          })),
      }));
    }

    return logs.map(log => {
      const logVouchers = vouchersWithItems.filter(v => v.daily_log_id === log.id);

      // Active transactions include 'completed' and 'void_pending'
      // ONLY 'voided' vouchers (accepted/approved by Owner) are excluded from revenue and items sold metrics!
      const activeVouchers = logVouchers.filter(v => v.status !== 'voided');

      const totalRevenue = activeVouchers.reduce((acc, v) => acc + (Number(v.total_amount) || 0), 0);

      // Calculate "Items Sold" by summing the quantity field across all active voucher items
      const totalItemsSold = activeVouchers.reduce((acc, v) => {
        const itemsTotal = (v.items || []).reduce((iAcc, item) => iAcc + (Number(item.quantity) || 0), 0);
        return acc + itemsTotal;
      }, 0);

      return {
        ...log,
        vouchersCount: activeVouchers.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalItemsSold,
        vouchers: logVouchers, // Keep all in array so UI displays pending & voided cards
      };
    });
  },

  // Direct fetch for specific daily log session vouchers with nested items
  async getDailyLogVouchersWithItems(dailyLogId: string): Promise<(Voucher & { items: VoucherItem[] })[]> {
    if (isLiveSupabase) {
      try {
        const { data: vData, error: vError } = await supabase
          .from('vouchers')
          .select('id, daily_log_id, voucher_number, total_amount, status, created_at')
          .eq('daily_log_id', dailyLogId);

        if (!vError && vData) {
          const voucherIds = vData.map(v => v.id);
          let items: VoucherItem[] = [];
          if (voucherIds.length > 0) {
            const { data: itemsData } = await supabase
              .from('voucher_items')
              .select('id, voucher_id, product_id, product_name, quantity, unit_price, subtotal')
              .in('voucher_id', voucherIds);
            if (itemsData) items = itemsData as VoucherItem[];
          }

          return vData.map(v => ({
            id: v.id,
            daily_log_id: v.daily_log_id,
            voucher_number: v.voucher_number,
            total_amount: Number(v.total_amount) || 0,
            status: v.status || 'completed',
            created_at: v.created_at || new Date().toISOString(),
            items: items.filter(i => i.voucher_id === v.id),
          }));
        }
      } catch (err) {
        console.warn('Supabase getDailyLogVouchersWithItems error:', err);
      }
    }

    const allVouchers = await this.getVouchers(dailyLogId);
    const allItems = await this.getVoucherItems();
    return allVouchers.map(v => ({
      ...v,
      status: v.status || 'completed',
      total_amount: Number(v.total_amount) || 0,
      created_at: v.created_at || new Date().toISOString(),
      items: allItems.filter(i => i.voucher_id === v.id),
    }));
  },

  resetToDefaultSeed() {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.DAILY_LOGS);
    localStorage.removeItem(STORAGE_KEYS.VOUCHERS);
    localStorage.removeItem(STORAGE_KEYS.VOUCHER_ITEMS);
    initializeLocalStorage();
  },
};

// PostgreSQL Schema SQL Query generation for Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- Supabase PostgreSQL Schema for ShopFlow POS
-- Exact Active Schema:
-- 1. products (id: uuid, name: text, selling_price: numeric, stock_quantity: integer)
-- 2. daily_logs (id: uuid, log_date: date, year: integer, month: text, day_label: text)
-- 3. vouchers (id: uuid, daily_log_id: uuid, voucher_number: text, total_amount: numeric, status: text)
-- 4. voucher_items (id: uuid, voucher_id: uuid, product_id: uuid, product_name: text, quantity: integer, unit_price: numeric, subtotal: numeric)
-- ==========================================

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  stock_quantity INTEGER NOT NULL DEFAULT 0
);

-- 2. Create Daily Logs Table
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date DATE NOT NULL UNIQUE,
  year INTEGER NOT NULL,
  month TEXT NOT NULL,
  day_label TEXT NOT NULL
);

-- 3. Create Vouchers Table
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
  voucher_number TEXT NOT NULL UNIQUE,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'completed' -- 'completed' | 'void_pending' | 'voided'
);

-- Ensure status column exists if updating existing table
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- 4. Create Voucher Items Table
CREATE TABLE IF NOT EXISTS public.voucher_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

-- 5. Stock Deduction Trigger on Voucher Item Insert
CREATE OR REPLACE FUNCTION public.deduct_stock_on_voucher_item()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products
    SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity)
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deduct_stock_on_voucher_item ON public.voucher_items;
CREATE TRIGGER trigger_deduct_stock_on_voucher_item
AFTER INSERT ON public.voucher_items
FOR EACH ROW EXECUTE FUNCTION public.deduct_stock_on_voucher_item();

-- 6. Stock Restore Trigger on Voucher Void
CREATE OR REPLACE FUNCTION public.restore_stock_on_voucher_void()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'voided' AND OLD.status != 'voided' THEN
    UPDATE public.products p
    SET stock_quantity = p.stock_quantity + vi.quantity
    FROM public.voucher_items vi
    WHERE vi.voucher_id = NEW.id AND vi.product_id = p.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_restore_stock_on_voucher_void ON public.vouchers;
CREATE TRIGGER trigger_restore_stock_on_voucher_void
AFTER UPDATE ON public.vouchers
FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_voucher_void();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vouchers_daily_log_id ON public.vouchers(daily_log_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON public.vouchers(status);
CREATE INDEX IF NOT EXISTS idx_voucher_items_voucher_id ON public.voucher_items(voucher_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_log_date ON public.daily_logs(log_date);

-- Enable RLS & Allow public access for POS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all products" ON public.products;
DROP POLICY IF EXISTS "Allow public all daily_logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Allow public all vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Allow public all voucher_items" ON public.voucher_items;

CREATE POLICY "Allow public all products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all daily_logs" ON public.daily_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all vouchers" ON public.vouchers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all voucher_items" ON public.voucher_items FOR ALL USING (true) WITH CHECK (true);
`;

export default supabase;
