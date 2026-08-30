import { RealtimeChannel } from '@supabase/supabase-js';
import {
  Category,
  MenuItem,
  Order,
  OrderStatus,
  PromoCode,
  RestaurantSettings,
  Table,
} from '../types';
import {
  getSupabase,
  getStoredSupabaseConfig,
  dbRowToOrder,
  orderToDbRow,
  dbRowToMenuItem,
  menuItemToDbRow,
  dbRowToTable,
  tableToDbRow,
} from './supabaseService';

// Unique client identifier to avoid echo loops
export const CLIENT_ID = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export type RealtimeEventType =
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_CHANGED'
  | 'ORDER_UPDATED'
  | 'ORDER_DELETED'
  | 'ALL_COMPLETED_ORDERS_CLEARED'
  | 'MENU_ITEM_CREATED'
  | 'MENU_ITEM_UPDATED'
  | 'MENU_ITEM_DELETED'
  | 'MENU_ITEM_STOCK_TOGGLED'
  | 'TABLE_STATUS_CHANGED'
  | 'TABLE_BILL_CLEARED'
  | 'TABLE_GUEST_COUNT_CHANGED'
  | 'CATEGORY_CREATED'
  | 'CATEGORY_UPDATED'
  | 'CATEGORY_DELETED'
  | 'PROMO_CREATED'
  | 'PROMO_TOGGLED'
  | 'PROMO_DELETED'
  | 'PROMO_UPDATED'
  | 'SETTINGS_UPDATED'
  | 'FULL_STATE_PULL_REQUEST'
  | 'FULL_STATE_SYNC';

export interface RealtimeMessage {
  type: RealtimeEventType;
  senderId: string;
  timestamp: string;
  payload: any;
}

export interface RealtimeListenerCallbacks {
  onOrderCreated?: (order: Order) => void;
  onOrderStatusChanged?: (orderId: string, status: OrderStatus, updatedOrder?: Order) => void;
  onOrderUpdated?: (order: Order) => void;
  onOrderDeleted?: (orderId: string) => void;
  onAllCompletedOrdersCleared?: () => void;
  onMenuItemCreated?: (item: MenuItem) => void;
  onMenuItemUpdated?: (item: MenuItem) => void;
  onMenuItemDeleted?: (itemId: string) => void;
  onTableStatusChanged?: (tableId: string, status: Table['status']) => void;
  onTableBillCleared?: (tableIdOrNumber: string) => void;
  onCategoryUpdated?: (categories: Category[]) => void;
  onPromoUpdated?: (promos: PromoCode[]) => void;
  onSettingsUpdated?: (settings: RestaurantSettings) => void;
  onFullStateSync?: (state: {
    orders?: Order[];
    menuItems?: MenuItem[];
    tables?: Table[];
    categories?: Category[];
    promos?: PromoCode[];
    settings?: RestaurantSettings;
  }) => void;
  onConnectionStatusChange?: (status: 'connected' | 'connecting' | 'disconnected' | 'not_configured' | 'error', detail?: string) => void;
}

class RealtimeSyncManager {
  private channel: RealtimeChannel | null = null;
  private localBroadcastChannel: BroadcastChannel | null = null;
  private callbacks: RealtimeListenerCallbacks = {};
  private connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'not_configured' | 'error' = 'not_configured';
  private pingInterval: number | null = null;

  constructor() {
    // Initialize standard Web BroadcastChannel for instant local multi-tab sync
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.localBroadcastChannel = new BroadcastChannel('aroibistro_realtime_local_bus');
        this.localBroadcastChannel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported in this environment:', err);
      }
    }
  }

  public setCallbacks(callbacks: RealtimeListenerCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public getStatus() {
    return this.connectionStatus;
  }

  /**
   * Connect to Supabase Realtime Channels
   */
  public async initRealtime(): Promise<void> {
    const config = getStoredSupabaseConfig();
    const supabase = getSupabase();

    if (!config.url || !config.anonKey || !supabase) {
      this.updateStatus('not_configured', 'ยังไม่ได้ระบุ Supabase URL & Key (ทำงานโหมด Local / Multi-tab)');
      return;
    }

    this.updateStatus('connecting', 'กำลังเชื่อมต่อ Supabase Realtime...');

    // Clean up existing channel if any
    if (this.channel) {
      try {
        await supabase.removeChannel(this.channel);
      } catch (e) {}
      this.channel = null;
    }

    try {
      // 1. Setup multi-device WebSocket Broadcast & Presence Channel
      this.channel = supabase.channel('aroibistro_live_hub', {
        config: {
          broadcast: { self: false, ack: true },
          presence: { key: CLIENT_ID },
        },
      });

      // Listen for Broadcast Events
      this.channel.on('broadcast', { event: 'aroibistro_event' }, (payload) => {
        if (payload?.payload) {
          this.handleIncomingMessage(payload.payload);
        }
      });

      // 2. Listen for direct PostgreSQL DB Changes (if Tables exist in Supabase)
      this.channel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            this.handlePostgresOrderChange(payload);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'menu_items' },
          (payload) => {
            this.handlePostgresMenuChange(payload);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tables' },
          (payload) => {
            this.handlePostgresTableChange(payload);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'settings' },
          (payload) => {
            this.handlePostgresSettingsChange(payload);
          }
        );

      // Subscribe to channel
      this.channel.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          this.updateStatus('connected', 'เชื่อมต่อ Supabase Realtime สำเร็จ (Real-time Live across all devices) 🟢');
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          console.warn('Supabase Realtime status:', status, err);
          this.updateStatus('error', `ไม่สามารถเชื่อมต่อ Realtime: ${err?.message || status}`);
        } else if (status === 'CLOSED') {
          this.updateStatus('disconnected', 'การเชื่อมต่อถูกตัด');
        }
      });

      // Presence tracking
      this.channel.track({
        online_at: new Date().toISOString(),
        client_id: CLIENT_ID,
      });

    } catch (err: any) {
      console.error('Failed to init Supabase realtime channel:', err);
      this.updateStatus('error', err?.message || 'Connection error');
    }
  }

  private updateStatus(status: 'connected' | 'connecting' | 'disconnected' | 'not_configured' | 'error', detail?: string) {
    this.connectionStatus = status;
    if (this.callbacks.onConnectionStatusChange) {
      this.callbacks.onConnectionStatusChange(status, detail);
    }
  }

  /**
   * Broadcast an event to ALL other devices / tabs in real-time
   */
  public broadcast(type: RealtimeEventType, payload: any) {
    const msg: RealtimeMessage = {
      type,
      senderId: CLIENT_ID,
      timestamp: new Date().toISOString(),
      payload,
    };

    // 1. Send via local BroadcastChannel for zero-latency multi-tab sync
    if (this.localBroadcastChannel) {
      try {
        this.localBroadcastChannel.postMessage(msg);
      } catch (e) {
        console.warn('Failed to send to local BroadcastChannel:', e);
      }
    }

    // 2. Send via Supabase WebSocket for cross-device real-time sync
    if (this.channel && this.connectionStatus === 'connected') {
      try {
        this.channel.send({
          type: 'broadcast',
          event: 'aroibistro_event',
          payload: msg,
        });
      } catch (e) {
        console.warn('Failed to send Supabase realtime broadcast:', e);
      }
    }
  }

  /**
   * Process incoming realtime broadcast message
   */
  private handleIncomingMessage(msg: RealtimeMessage) {
    if (!msg || msg.senderId === CLIENT_ID) {
      return; // Ignore our own messages
    }

    const { type, payload } = msg;

    switch (type) {
      case 'ORDER_CREATED':
        if (payload?.order && this.callbacks.onOrderCreated) {
          this.callbacks.onOrderCreated(payload.order);
        }
        break;

      case 'ORDER_STATUS_CHANGED':
        if (payload?.orderId && payload?.status && this.callbacks.onOrderStatusChanged) {
          this.callbacks.onOrderStatusChanged(payload.orderId, payload.status, payload.updatedOrder);
        }
        break;

      case 'ORDER_UPDATED':
        if (payload?.order && this.callbacks.onOrderUpdated) {
          this.callbacks.onOrderUpdated(payload.order);
        }
        break;

      case 'ORDER_DELETED':
        if (payload?.orderId && this.callbacks.onOrderDeleted) {
          this.callbacks.onOrderDeleted(payload.orderId);
        }
        break;

      case 'ALL_COMPLETED_ORDERS_CLEARED':
        if (this.callbacks.onAllCompletedOrdersCleared) {
          this.callbacks.onAllCompletedOrdersCleared();
        }
        break;

      case 'MENU_ITEM_CREATED':
        if (payload?.item && this.callbacks.onMenuItemCreated) {
          this.callbacks.onMenuItemCreated(payload.item);
        }
        break;

      case 'MENU_ITEM_UPDATED':
      case 'MENU_ITEM_STOCK_TOGGLED':
        if (payload?.item && this.callbacks.onMenuItemUpdated) {
          this.callbacks.onMenuItemUpdated(payload.item);
        }
        break;

      case 'MENU_ITEM_DELETED':
        if (payload?.itemId && this.callbacks.onMenuItemDeleted) {
          this.callbacks.onMenuItemDeleted(payload.itemId);
        }
        break;

      case 'TABLE_STATUS_CHANGED':
        if (payload?.tableId && payload?.status && this.callbacks.onTableStatusChanged) {
          this.callbacks.onTableStatusChanged(payload.tableId, payload.status);
        }
        break;

      case 'TABLE_BILL_CLEARED':
        if (payload?.tableIdOrNumber && this.callbacks.onTableBillCleared) {
          this.callbacks.onTableBillCleared(payload.tableIdOrNumber);
        }
        break;

      case 'CATEGORY_UPDATED':
        if (payload?.categories && this.callbacks.onCategoryUpdated) {
          this.callbacks.onCategoryUpdated(payload.categories);
        }
        break;

      case 'PROMO_UPDATED':
        if (payload?.promos && this.callbacks.onPromoUpdated) {
          this.callbacks.onPromoUpdated(payload.promos);
        }
        break;

      case 'SETTINGS_UPDATED':
        if (payload?.settings && this.callbacks.onSettingsUpdated) {
          this.callbacks.onSettingsUpdated(payload.settings);
        }
        break;

      case 'FULL_STATE_SYNC':
        if (payload && this.callbacks.onFullStateSync) {
          this.callbacks.onFullStateSync(payload);
        }
        break;

      default:
        break;
    }
  }

  /**
   * Handle PostgreSQL Postgres Changes on 'orders' table
   */
  private handlePostgresOrderChange(payload: any) {
    if (!payload) return;
    const { eventType, new: newRow, old: oldRow } = payload;

    if (eventType === 'INSERT' && newRow) {
      const order = dbRowToOrder(newRow);
      this.callbacks.onOrderCreated?.(order);
    } else if (eventType === 'UPDATE' && newRow) {
      const order = dbRowToOrder(newRow);
      this.callbacks.onOrderUpdated?.(order);
    } else if (eventType === 'DELETE' && oldRow?.id) {
      this.callbacks.onOrderDeleted?.(oldRow.id);
    }
  }

  /**
   * Handle PostgreSQL Postgres Changes on 'menu_items' table
   */
  private handlePostgresMenuChange(payload: any) {
    if (!payload) return;
    const { eventType, new: newRow, old: oldRow } = payload;

    if (eventType === 'INSERT' && newRow) {
      const item = dbRowToMenuItem(newRow);
      this.callbacks.onMenuItemCreated?.(item);
    } else if (eventType === 'UPDATE' && newRow) {
      const item = dbRowToMenuItem(newRow);
      this.callbacks.onMenuItemUpdated?.(item);
    } else if (eventType === 'DELETE' && oldRow?.id) {
      this.callbacks.onMenuItemDeleted?.(oldRow.id);
    }
  }

  /**
   * Handle PostgreSQL Postgres Changes on 'tables' table
   */
  private handlePostgresTableChange(payload: any) {
    if (!payload) return;
    const { new: newRow } = payload;
    if (newRow) {
      const table = dbRowToTable(newRow);
      this.callbacks.onTableStatusChanged?.(table.id, table.status);
    }
  }

  /**
   * Handle PostgreSQL Postgres Changes on 'settings' table
   */
  private handlePostgresSettingsChange(payload: any) {
    if (!payload) return;
    const { new: newRow } = payload;
    if (newRow?.data) {
      const settings = typeof newRow.data === 'string' ? JSON.parse(newRow.data) : newRow.data;
      this.callbacks.onSettingsUpdated?.(settings);
    }
  }

  /**
   * Async database synchronization methods (Write-through to Supabase)
   */
  public async persistOrder(order: Order): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const row = orderToDbRow(order);
      await supabase.from('orders').upsert(row, { onConflict: 'id' });
    } catch (err) {
      console.warn('Failed to upsert order to Supabase:', err);
    }
  }

  public async deleteOrder(orderId: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      await supabase.from('orders').delete().eq('id', orderId);
    } catch (err) {
      console.warn('Failed to delete order from Supabase:', err);
    }
  }

  public async persistMenuItem(item: MenuItem): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const row = menuItemToDbRow(item);
      await supabase.from('menu_items').upsert(row, { onConflict: 'id' });
    } catch (err) {
      console.warn('Failed to upsert menu item to Supabase:', err);
    }
  }

  public async deleteMenuItem(itemId: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      await supabase.from('menu_items').delete().eq('id', itemId);
    } catch (err) {
      console.warn('Failed to delete menu item from Supabase:', err);
    }
  }

  public async persistTable(table: Table): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const row = tableToDbRow(table);
      await supabase.from('tables').upsert(row, { onConflict: 'id' });
    } catch (err) {
      console.warn('Failed to upsert table to Supabase:', err);
    }
  }

  public async persistAllTables(tables: Table[]): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const rows = tables.map(tableToDbRow);
      await supabase.from('tables').upsert(rows, { onConflict: 'id' });
    } catch (err) {
      console.warn('Failed to upsert tables batch to Supabase:', err);
    }
  }

  public async persistSettings(settings: RestaurantSettings): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      await supabase.from('settings').upsert({
        id: 'current_settings',
        data: settings,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn('Failed to upsert settings to Supabase:', err);
    }
  }

  public async persistCategories(categories: Category[]): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const rows = categories.map((c, idx) => ({
        id: c.id,
        name: c.name,
        name_en: c.nameEn || null,
        icon_name: c.iconName || 'Utensils',
        description: c.description || null,
        display_order: idx,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('categories').upsert(rows, { onConflict: 'id' });
    } catch (err) {
      console.warn('Failed to upsert categories to Supabase:', err);
    }
  }

  public async persistPromos(promos: PromoCode[]): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const rows = promos.map((p) => ({
        code: p.code,
        discount_type: p.discountType,
        value: p.value,
        min_order: p.minOrder,
        max_discount: p.maxDiscount || null,
        active: p.active,
        description: p.description || null,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('promos').upsert(rows, { onConflict: 'code' });
    } catch (err) {
      console.warn('Failed to upsert promos to Supabase:', err);
    }
  }

  /**
   * Pull all initial data from Supabase tables
   */
  public async pullAllFromSupabase(): Promise<{
    orders?: Order[];
    menuItems?: MenuItem[];
    tables?: Table[];
    categories?: Category[];
    promos?: PromoCode[];
    settings?: RestaurantSettings;
  } | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const [
        { data: ordersData },
        { data: menuData },
        { data: tablesData },
        { data: categoriesData },
        { data: promosData },
        { data: settingsData },
      ] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('menu_items').select('*'),
        supabase.from('tables').select('*'),
        supabase.from('categories').select('*').order('display_order', { ascending: true }),
        supabase.from('promos').select('*'),
        supabase.from('settings').select('*').eq('id', 'current_settings').single(),
      ]);

      const result: any = {};

      if (ordersData && ordersData.length > 0) {
        result.orders = ordersData.map(dbRowToOrder);
      }
      if (menuData && menuData.length > 0) {
        result.menuItems = menuData.map(dbRowToMenuItem);
      }
      if (tablesData && tablesData.length > 0) {
        result.tables = tablesData.map(dbRowToTable);
      }
      if (categoriesData && categoriesData.length > 0) {
        result.categories = categoriesData.map((c: any) => ({
          id: c.id,
          name: c.name,
          nameEn: c.name_en || '',
          iconName: c.icon_name || 'Utensils',
          description: c.description || '',
        }));
      }
      if (promosData && promosData.length > 0) {
        result.promos = promosData.map((p: any) => ({
          code: p.code,
          discountType: p.discount_type,
          value: Number(p.value),
          minOrder: Number(p.min_order),
          maxDiscount: p.max_discount ? Number(p.max_discount) : undefined,
          active: p.active !== false,
          description: p.description || '',
        }));
      }
      if (settingsData?.data) {
        result.settings = typeof settingsData.data === 'string' ? JSON.parse(settingsData.data) : settingsData.data;
      }

      return result;
    } catch (err) {
      console.error('Failed to pull data from Supabase:', err);
      return null;
    }
  }

  /**
   * Seed all initial data to Supabase in 1-click
   */
  public async pushAllToSupabase(state: {
    orders: Order[];
    menuItems: MenuItem[];
    tables: Table[];
    categories: Category[];
    promos: PromoCode[];
    settings: RestaurantSettings;
  }): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: 'ยังไม่ได้เชื่อมต่อ Supabase' };
    }

    try {
      // 1. Categories
      const catRows = state.categories.map((c, idx) => ({
        id: c.id,
        name: c.name,
        name_en: c.nameEn || null,
        icon_name: c.iconName || 'Utensils',
        description: c.description || null,
        display_order: idx,
      }));
      await supabase.from('categories').upsert(catRows, { onConflict: 'id' });

      // 2. Menu Items
      const menuRows = state.menuItems.map(menuItemToDbRow);
      await supabase.from('menu_items').upsert(menuRows, { onConflict: 'id' });

      // 3. Tables
      const tableRows = state.tables.map(tableToDbRow);
      await supabase.from('tables').upsert(tableRows, { onConflict: 'id' });

      // 4. Promos
      const promoRows = state.promos.map((p) => ({
        code: p.code,
        discount_type: p.discountType,
        value: p.value,
        min_order: p.minOrder,
        max_discount: p.maxDiscount || null,
        active: p.active,
        description: p.description || null,
      }));
      await supabase.from('promos').upsert(promoRows, { onConflict: 'code' });

      // 5. Orders
      if (state.orders.length > 0) {
        const orderRows = state.orders.map(orderToDbRow);
        await supabase.from('orders').upsert(orderRows, { onConflict: 'id' });
      }

      // 6. Settings
      await supabase.from('settings').upsert({
        id: 'current_settings',
        data: state.settings,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      // Broadcast full sync event
      this.broadcast('FULL_STATE_SYNC', state);

      return { success: true, message: 'อัปโหลดข้อมูลทั้งหมดขึ้นสู่ Supabase สำเร็จแล้ว! 🚀' };
    } catch (err: any) {
      console.error('Failed to push all data to Supabase:', err);
      return { success: false, message: `เกิดข้อผิดพลาด: ${err?.message || err}` };
    }
  }
}

export const realtimeManager = new RealtimeSyncManager();
