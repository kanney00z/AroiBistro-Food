import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import {
  Category,
  MenuItem,
  Order,
  PromoCode,
  RestaurantSettings,
  Table,
} from '../types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export type RealtimeSyncStatus = 'connected' | 'connecting' | 'disconnected' | 'error' | 'not_configured';

const STORAGE_KEY_URL = 'aroibistro_supabase_url';
const STORAGE_KEY_KEY = 'aroibistro_supabase_key';

/**
 * Retrieve Supabase credentials from Vite environment variables or localStorage.
 */
export function getStoredSupabaseConfig(): SupabaseConfig {
  const metaEnv = (import.meta as any).env || {};
  const envUrl = (metaEnv.VITE_SUPABASE_URL || '').trim();
  const envKey = (metaEnv.VITE_SUPABASE_ANON_KEY || '').trim();

  let localUrl = '';
  let localKey = '';

  try {
    localUrl = (localStorage.getItem(STORAGE_KEY_URL) || '').trim();
    localKey = (localStorage.getItem(STORAGE_KEY_KEY) || '').trim();
  } catch (e) {
    console.error('Failed to read Supabase config from localStorage:', e);
  }

  return {
    url: envUrl || localUrl,
    anonKey: envKey || localKey,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  } catch (e) {
    console.error('Failed to save Supabase config to localStorage:', e);
  }
}

export function clearSupabaseConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
  } catch (e) {
    console.error('Failed to clear Supabase config:', e);
  }
}

let supabaseInstance: SupabaseClient | null = null;
let currentConfigKey = '';

/**
 * Get or initialize the Supabase client.
 */
export function getSupabase(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) {
    supabaseInstance = null;
    return null;
  }

  const newKey = `${config.url}___${config.anonKey}`;
  if (supabaseInstance && currentConfigKey === newKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    });
    currentConfigKey = newKey;
    return supabaseInstance;
  } catch (err) {
    console.error('Error initializing Supabase client:', err);
    supabaseInstance = null;
    return null;
  }
}

/**
 * Test connectivity to Supabase
 */
export async function testSupabaseConnection(config?: SupabaseConfig): Promise<{ success: boolean; message: string; tablesFound?: string[] }> {
  const cfg = config || getStoredSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) {
    return { success: false, message: 'ยังไม่ได้ระบุ Supabase URL หรือ Anon Key' };
  }

  try {
    const tempClient = createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: false },
    });

    // Test a basic select or health probe on orders or menu_items
    const { error: ordersErr } = await tempClient.from('orders').select('id').limit(1);
    
    if (ordersErr) {
      if (ordersErr.code === '42P01') {
        return {
          success: false,
          message: 'เชื่อมต่อกับ Supabase ได้แล้ว แต่ยังไม่ได้สร้าง Table กรุณากดปุ่ม "คัดลอก SQL Setup" ไปรันใน SQL Editor ของ Supabase',
        };
      }
      // If error is permission or key issue
      if (ordersErr.message && ordersErr.message.includes('JWT')) {
        return { success: false, message: `Anon Key ไม่ถูกต้อง: ${ordersErr.message}` };
      }
      return { success: false, message: `เกิดข้อผิดพลาด: ${ordersErr.message}` };
    }

    return { success: true, message: 'เชื่อมต่อ Supabase Realtime สำเร็จสมบูรณ์! 🚀' };
  } catch (err: any) {
    return { success: false, message: `ไม่สามารถเชื่อมต่อได้: ${err?.message || 'Network error'}` };
  }
}

/**
 * SQL Setup script that user can run in Supabase SQL Editor in 1-click
 */
export const SUPABASE_SQL_SETUP_SCRIPT = `-- ==========================================================
-- 🍽️ AroiBistro Restaurant Database & Realtime Setup
-- รันโค้ดนี้ใน Supabase SQL Editor (https://supabase.com/dashboard)
-- ==========================================================

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  icon TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Menu Items Table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  category TEXT NOT NULL,
  image TEXT,
  available BOOLEAN DEFAULT true,
  is_chef_special BOOLEAN DEFAULT false,
  is_spicy BOOLEAN DEFAULT false,
  is_vegetarian BOOLEAN DEFAULT false,
  spicy_level INT DEFAULT 0,
  calories INT,
  prep_time_minutes INT DEFAULT 15,
  rating NUMERIC DEFAULT 4.8,
  reviews_count INT DEFAULT 0,
  options JSONB DEFAULT '[]'::jsonb,
  ingredients JSONB DEFAULT '[]'::jsonb,
  stock_count INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'dine_in',
  table_number TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  promo_code_applied TEXT,
  service_charge NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'promptpay',
  payment_status TEXT NOT NULL DEFAULT 'paid',
  order_status TEXT NOT NULL DEFAULT 'pending',
  slip_image TEXT,
  rounds_count INT DEFAULT 1,
  has_new_items BOOLEAN DEFAULT false,
  notes TEXT,
  estimated_minutes INT DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Tables / Layout Table
CREATE TABLE IF NOT EXISTS public.tables (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 4,
  zone TEXT NOT NULL DEFAULT 'indoor',
  status TEXT NOT NULL DEFAULT 'available',
  current_order_id TEXT,
  guest_count INT DEFAULT 0,
  qr_code_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Promos Table
CREATE TABLE IF NOT EXISTS public.promos (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  value NUMERIC NOT NULL,
  min_order NUMERIC NOT NULL DEFAULT 0,
  max_discount NUMERIC,
  active BOOLEAN DEFAULT true,
  expiry_date TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create Restaurant Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'current_settings',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Create Realtime Events Broadcast Table
CREATE TABLE IF NOT EXISTS public.store_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Enable Row Level Security (RLS) & Allow Anonymous Read/Write for Restaurant App
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Anon Access categories" ON public.categories;
CREATE POLICY "Public Anon Access categories" ON public.categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Anon Access menu_items" ON public.menu_items;
CREATE POLICY "Public Anon Access menu_items" ON public.menu_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Anon Access orders" ON public.orders;
CREATE POLICY "Public Anon Access orders" ON public.orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Anon Access tables" ON public.tables;
CREATE POLICY "Public Anon Access tables" ON public.tables FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Anon Access promos" ON public.promos;
CREATE POLICY "Public Anon Access promos" ON public.promos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Anon Access settings" ON public.settings;
CREATE POLICY "Public Anon Access settings" ON public.settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Anon Access store_events" ON public.store_events;
CREATE POLICY "Public Anon Access store_events" ON public.store_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 9. Enable Replica Identity Full (Required for Realtime UPDATE/DELETE payloads)
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.menu_items REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.tables REPLICA IDENTITY FULL;
ALTER TABLE public.promos REPLICA IDENTITY FULL;
ALTER TABLE public.settings REPLICA IDENTITY FULL;
ALTER TABLE public.store_events REPLICA IDENTITY FULL;

-- 10. Enable Realtime Publications for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.promos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_events;
`;

// Helper: Convert Database snake_case to Order model
export function dbRowToOrder(row: any): Order {
  return {
    id: row.id,
    orderNumber: row.order_number || row.id,
    orderType: row.order_type || 'dine_in',
    tableNumber: row.table_number || undefined,
    customerName: row.customer_name || 'ลูกค้า',
    customerPhone: row.customer_phone || '',
    items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
    subtotal: Number(row.subtotal) || 0,
    discount: Number(row.discount) || 0,
    promoCodeApplied: row.promo_code_applied || undefined,
    serviceCharge: Number(row.service_charge) || 0,
    deliveryFee: Number(row.delivery_fee) || 0,
    total: Number(row.total) || 0,
    paymentMethod: row.payment_method || 'promptpay',
    paymentStatus: row.payment_status || 'paid',
    orderStatus: row.order_status || 'pending',
    slipImage: row.slip_image || undefined,
    roundsCount: Number(row.rounds_count) || 1,
    hasNewItems: Boolean(row.has_new_items),
    notes: row.notes || undefined,
    estimatedMinutes: Number(row.estimated_minutes) || 15,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// Helper: Convert Order model to Database snake_case
export function orderToDbRow(order: Order): any {
  return {
    id: order.id,
    order_number: order.orderNumber,
    order_type: order.orderType,
    table_number: order.tableNumber || null,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    items: order.items,
    subtotal: order.subtotal,
    discount: order.discount,
    promo_code_applied: order.promoCodeApplied || null,
    service_charge: order.serviceCharge,
    delivery_fee: order.deliveryFee || 0,
    total: order.total,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    order_status: order.orderStatus,
    slip_image: order.slipImage || null,
    rounds_count: order.roundsCount || 1,
    has_new_items: Boolean(order.hasNewItems),
    notes: order.notes || null,
    estimated_minutes: order.estimatedMinutes || 15,
    created_at: order.createdAt || new Date().toISOString(),
    updated_at: order.updatedAt || new Date().toISOString(),
  };
}

// Helper: Convert DB row to MenuItem
export function dbRowToMenuItem(row: any): MenuItem {
  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en || '',
    description: row.description || '',
    price: Number(row.price) || 0,
    category: row.category,
    image: row.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    available: row.available !== false,
    isChefSpecial: Boolean(row.is_chef_special),
    isSpicy: Number(row.is_spicy || row.spicy_level || 0),
    isVegetarian: Boolean(row.is_vegetarian),
    calories: row.calories ? Number(row.calories) : undefined,
    prepTimeMinutes: Number(row.prep_time_minutes) || 15,
    rating: Number(row.rating) || 4.8,
    reviewsCount: Number(row.reviews_count) || 0,
    optionGroups: typeof row.option_groups === 'string' ? JSON.parse(row.option_groups) : (row.option_groups || []),
  };
}

// Helper: Convert MenuItem to DB row
export function menuItemToDbRow(item: MenuItem): any {
  return {
    id: item.id,
    name: item.name,
    name_en: item.nameEn || null,
    description: item.description || null,
    price: item.price,
    category: item.category,
    image: item.image,
    available: item.available,
    is_chef_special: Boolean(item.isChefSpecial),
    is_spicy: Number(item.isSpicy || 0),
    is_vegetarian: Boolean(item.isVegetarian),
    spicy_level: Number(item.isSpicy || 0),
    calories: item.calories || null,
    prep_time_minutes: item.prepTimeMinutes || 15,
    rating: item.rating || 4.8,
    reviews_count: item.reviewsCount || 0,
    option_groups: item.optionGroups || [],
    updated_at: new Date().toISOString(),
  };
}

// Helper: Convert Table DB Row
export function dbRowToTable(row: any): Table {
  return {
    id: row.id,
    number: row.number,
    capacity: Number(row.capacity) || 4,
    zone: row.zone || 'Main Hall',
    status: row.status || 'available',
    currentOrderId: row.current_order_id || undefined,
    guestCount: Number(row.guest_count) || 0,
  };
}

export function tableToDbRow(table: Table): any {
  return {
    id: table.id,
    number: table.number,
    capacity: table.capacity,
    zone: table.zone,
    status: table.status,
    current_order_id: table.currentOrderId || null,
    guest_count: table.guestCount || 0,
    updated_at: new Date().toISOString(),
  };
}
