import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  MenuItem,
  CartItem,
  Order,
  Table,
  TableStatus,
  PromoCode,
  RestaurantSettings,
  SpecialHoliday,
  StoreStatusInfo,
  OrderType,
  OrderStatus,
  SelectedOption,
  Category,
  DeliveryLocation,
  HeroBannerSettings,
} from '../types';
import {
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_TABLES,
  INITIAL_PROMOS,
  INITIAL_SETTINGS,
  CATEGORIES,
  DEFAULT_HERO_BANNER,
} from '../data/mockData';
import { getStoreStatus } from '../utils/storeHours';
import { safeSaveOrdersToStorage, safeSaveMenuToStorage, safeLocalStorageSet } from '../utils/storage';
import { realtimeManager } from '../services/realtimeSync';
import { audioChime } from '../utils/audioChime';
import {
  sendLineFlexMessage,
  sendOrderLineNotification,
  buildOrderFlexMessage,
  buildTestFlexMessage,
  LineSendResult,
} from '../services/lineNotifyService';

interface CustomerInfo {
  name: string;
  phone: string;
  notes: string;
}

// Haversine distance calculator in KM
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

interface RestaurantContextType {
  // Categories
  categories: Category[];
  addCategory: (cat: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Menu
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  toggleItemAvailability: (id: string) => void;

  // Orders
  orders: Order[];
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  createOrder: (paymentMethod: 'promptpay' | 'credit_card' | 'cash', slipImage?: string) => Order;
  cancelOrder: (orderId: string) => void;
  deleteOrder: (orderId: string) => void;
  clearCompletedOrders: () => void;
  activeCustomerOrder: Order | null;
  setActiveCustomerOrder: (order: Order | null) => void;

  // Tables
  tables: Table[];
  addTable: (tableData: { number: string; name?: string; capacity: number; zone: string; status?: TableStatus }) => void;
  updateTable: (id: string, updates: Partial<Table>) => void;
  deleteTable: (tableId: string) => void;
  updateTableStatus: (tableId: string, status: Table['status']) => void;
  updateTableGuestCount: (tableId: string, count: number) => void;
  clearTableBill: (tableIdOrNumber: string, options?: { markOrderCompleted?: boolean }) => void;

  // Promos
  promos: PromoCode[];
  togglePromoActive: (code: string) => void;
  addPromo: (promo: PromoCode) => void;
  deletePromo: (code: string) => void;
  appliedPromo: PromoCode | null;
  applyPromoCode: (codeStr: string) => { success: boolean; message: string };
  removePromoCode: () => void;

  // Settings & Store Operating Hours / Holidays
  settings: RestaurantSettings;
  updateSettings: (newSettings: Partial<RestaurantSettings>) => void;
  storeStatus: StoreStatusInfo;
  isStoreOpen: boolean;
  toggleWeeklyClosedDay: (dayIndex: number) => void;
  addSpecialHoliday: (holiday: Omit<SpecialHoliday, 'id'>) => void;
  removeSpecialHoliday: (holidayId: string) => void;
  setStoreManualOpen: (isOpen: boolean) => void;

  // Realtime & Supabase Cloud Sync
  realtimeStatus: 'connected' | 'connecting' | 'disconnected' | 'not_configured' | 'error';
  realtimeDetail: string;
  isDatabaseModalOpen: boolean;
  setIsDatabaseModalOpen: (open: boolean) => void;
  reconnectSupabase: () => Promise<void>;
  pushAllToCloud: () => Promise<{ success: boolean; message: string }>;
  pullAllFromCloud: () => Promise<{ success: boolean; message: string }>;

  // LINE Messaging API Notifications
  sendLineTestNotification: (customToken?: string, customTargetId?: string) => Promise<LineSendResult>;

  // Cart & Ordering State
  cart: CartItem[];
  addToCart: (
    item: MenuItem,
    selectedOptions: SelectedOption[],
    quantity: number,
    notes?: string,
    packagingType?: 'dine_in' | 'takeaway',
    excludedIngredients?: string[]
  ) => void;
  addCustomDishToCart: (details: {
    dishName: string;
    description?: string;
    preferences?: string;
    excludedIngredients?: string[];
    quantity: number;
    packagingType?: 'dine_in' | 'takeaway';
    notes?: string;
  }) => void;
  updateOrderItemPrice: (orderId: string, cartItemId: string, newUnitPrice: number) => void;
  updateCartItemQuantity: (cartItemId: string, delta: number) => void;
  updateCartItemPackagingType: (cartItemId: string, packagingType: 'dine_in' | 'takeaway') => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  selectedTable: string;
  setSelectedTable: (tableNum: string) => void;
  isTableScanned: boolean;
  scanTable: (tableNum: string) => void;
  selectTableManually: (tableNum: string) => void;
  clearScannedTable: () => void;
  isTableScannerModalOpen: boolean;
  setIsTableScannerModalOpen: (open: boolean) => void;
  activeTableOrder: Order | null;
  isAddingToExistingOrder: boolean;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  deliveryLocation: DeliveryLocation | null;
  setDeliveryLocation: (location: DeliveryLocation | null) => void;
  isMapPickerOpen: boolean;
  setIsMapPickerOpen: (open: boolean) => void;
  customerInfo: CustomerInfo;
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>;

  // Financial calculations
  cartSubtotal: number;
  cartDiscount: number;
  cartServiceCharge: number;
  cartDeliveryFee: number;
  cartTotal: number;
  cartItemCount: number;
  deliveryDistanceKm: number;
  isDeliveryOutOfRange: boolean;
  isDeliveryFree: boolean;

  // View mode
  isAdminMode: boolean;
  setIsAdminMode: (isAdmin: boolean) => void;
  isAdminAuthModalOpen: boolean;
  setIsAdminAuthModalOpen: (open: boolean) => void;
  adminActiveTab: 'dashboard' | 'orders' | 'menu' | 'tables' | 'promos' | 'settings';
  setAdminActiveTab: (tab: 'dashboard' | 'orders' | 'menu' | 'tables' | 'promos' | 'settings') => void;

  // Hero Banner Customizer
  isHeroCustomizerOpen: boolean;
  setIsHeroCustomizerOpen: (open: boolean) => void;
  updateHeroBannerSettings: (newHero: Partial<HeroBannerSettings>) => void;
  resetHeroBannerToDefault: () => void;

  // Customer UI Modals
  selectedDishForModal: MenuItem | null;
  setSelectedDishForModal: (item: MenuItem | null) => void;
  isCustomDishModalOpen: boolean;
  setIsCustomDishModalOpen: (open: boolean) => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isCheckoutModalOpen: boolean;
  setIsCheckoutModalOpen: (open: boolean) => void;
  isOrderTrackerOpen: boolean;
  setIsOrderTrackerOpen: (open: boolean) => void;

  // Toasts / alerts
  toastMessage: { text: string; type: 'success' | 'info' | 'warning' } | null;
  showToast: (text: string, type?: 'success' | 'info' | 'warning') => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'aroibistro_';

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial states or fallback to mockData
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}categories`);
      return saved ? JSON.parse(saved) : CATEGORIES;
    } catch {
      return CATEGORIES;
    }
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}menu`);
      return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
    } catch {
      return INITIAL_MENU_ITEMS;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}orders`);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [tables, setTables] = useState<Table[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}tables`);
      return saved ? JSON.parse(saved) : INITIAL_TABLES;
    } catch {
      return INITIAL_TABLES;
    }
  });

  const [promos, setPromos] = useState<PromoCode[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}promos`);
      return saved ? JSON.parse(saved) : INITIAL_PROMOS;
    } catch {
      return INITIAL_PROMOS;
    }
  });

  const [settings, setSettings] = useState<RestaurantSettings>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}settings`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          heroBanner: {
            ...DEFAULT_HERO_BANNER,
            ...(parsed.heroBanner || {}),
          },
        };
      }
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [isHeroCustomizerOpen, setIsHeroCustomizerOpen] = useState(false);

  const updateHeroBannerSettings = (newHero: Partial<HeroBannerSettings>) => {
    setSettings((prev) => {
      const currentHero = prev.heroBanner || DEFAULT_HERO_BANNER;
      const updatedHero: HeroBannerSettings = { ...currentHero, ...newHero };
      return { ...prev, heroBanner: updatedHero };
    });
    showToast('บันทึกการปรับแต่งหน้าเมนูเรียบร้อย ✨', 'success');
  };

  const resetHeroBannerToDefault = () => {
    setSettings((prev) => ({
      ...prev,
      heroBanner: { ...DEFAULT_HERO_BANNER },
    }));
    showToast('คืนค่าหน้าเมนูเป็นค่าเริ่มต้นแล้ว', 'info');
  };

  // Real-time store operating status & holiday computation
  const [storeStatus, setStoreStatus] = useState<StoreStatusInfo>(() => getStoreStatus(settings));

  useEffect(() => {
    setStoreStatus(getStoreStatus(settings));
    const interval = setInterval(() => {
      setStoreStatus(getStoreStatus(settings));
    }, 15000);
    return () => clearInterval(interval);
  }, [settings]);

  const toggleWeeklyClosedDay = (dayIndex: number) => {
    const current = settings.weeklyClosedDays || [];
    const updated = current.includes(dayIndex)
      ? current.filter((d) => d !== dayIndex)
      : [...current, dayIndex].sort((a, b) => a - b);
    updateSettings({ weeklyClosedDays: updated });
    showToast('อัปเดตวันหยุดประจำสัปดาห์เรียบร้อยแล้ว', 'info');
  };

  const addSpecialHoliday = (holiday: Omit<SpecialHoliday, 'id'>) => {
    const newHol: SpecialHoliday = {
      ...holiday,
      id: `hol_${Date.now()}`,
    };
    const current = settings.specialHolidays || [];
    updateSettings({ specialHolidays: [...current, newHol] });
    showToast(`เพิ่มวันหยุดพิเศษ "${holiday.title}" (${holiday.date}) สำเร็จ`, 'success');
  };

  const removeSpecialHoliday = (holidayId: string) => {
    const current = settings.specialHolidays || [];
    const removed = current.find((h) => h.id === holidayId);
    updateSettings({ specialHolidays: current.filter((h) => h.id !== holidayId) });
    showToast(`ลบวันหยุดพิเศษ "${removed?.title || ''}" แล้ว`, 'info');
  };

  const setStoreManualOpen = (isOpen: boolean) => {
    updateSettings({ isOpen });
    showToast(
      isOpen ? 'เปิดรับออเดอร์ร้านค้าตามปกติ 🟢' : 'ปิดร้านชั่วคราวแล้ว 🔴',
      isOpen ? 'success' : 'warning'
    );
  };

  // Cart & Ordering
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('dine_in');

  // Table QR scan state
  const [selectedTable, setSelectedTable] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tParam = params.get('table') || params.get('t') || params.get('tableNumber');
        if (tParam) {
          const formatted = tParam.toUpperCase().startsWith('T-')
            ? tParam.toUpperCase()
            : `T-${tParam.padStart(2, '0')}`;
          return formatted;
        }
        const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}scannedTable`);
        return saved || '';
      }
      return '';
    } catch {
      return '';
    }
  });

  const [isTableScanned, setIsTableScanned] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tParam = params.get('table') || params.get('t') || params.get('tableNumber');
        if (tParam) return true;
        const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}scannedTable`);
        return Boolean(saved);
      }
      return false;
    } catch {
      return false;
    }
  });

  const [isTableScannerModalOpen, setIsTableScannerModalOpen] = useState(false);

  const [deliveryAddress, setDeliveryAddress] = useState<string>('สุขุมวิท 55 ซอยทองหล่อ 13 แขวงคลองตันเหนือ กรุงเทพฯ');
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}deliveryLocation`);
      return saved
        ? JSON.parse(saved)
        : {
            lat: 13.7325,
            lng: 100.5822,
            address: 'สุขุมวิท 55 ซอยทองหล่อ 13 แขวงคลองตันเหนือ กรุงเทพฯ',
            buildingDetails: 'คอนโด The Esse ชั้น 12',
            distanceKm: 0.5,
          };
    } catch {
      return {
        lat: 13.7325,
        lng: 100.5822,
        address: 'สุขุมวิท 55 ซอยทองหล่อ 13 แขวงคลองตันเหนือ กรุงเทพฯ',
        buildingDetails: '',
        distanceKm: 0.5,
      };
    }
  });
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: 'คุณลูกค้า',
    phone: '089-123-4567',
    notes: '',
  });

  // Customer Modals
  const [selectedDishForModal, setSelectedDishForModal] = useState<MenuItem | null>(null);
  const [isCustomDishModalOpen, setIsCustomDishModalOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [activeCustomerOrder, setActiveCustomerOrder] = useState<Order | null>(() => {
    try {
      const savedOrderId = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}my_active_order_id`);
      if (savedOrderId) {
        const savedOrders = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}orders`);
        if (savedOrders) {
          const parsedOrders: Order[] = JSON.parse(savedOrders);
          const match = parsedOrders.find(
            (o) => o.id === savedOrderId || o.orderNumber === savedOrderId
          );
          if (match && match.orderStatus !== 'completed' && match.orderStatus !== 'cancelled') {
            return match;
          }
        }
      }
    } catch {
      return null;
    }
    return null;
  });

  // App mode
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState<'dashboard' | 'orders' | 'menu' | 'tables' | 'promos' | 'settings'>('orders');

  // Supabase Realtime Database sync state
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'not_configured' | 'error'>('not_configured');
  const [realtimeDetail, setRealtimeDetail] = useState<string>('');
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState<boolean>(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  }, []);

  // Reconnect / Initialize Supabase Realtime
  const reconnectSupabase = useCallback(async () => {
    await realtimeManager.initRealtime();
  }, []);

  // 1-Click Cloud Sync: Push All Local Data to Supabase
  const pushAllToCloud = useCallback(async () => {
    return await realtimeManager.pushAllToSupabase({
      orders,
      menuItems,
      tables,
      categories,
      promos,
      settings,
    });
  }, [orders, menuItems, tables, categories, promos, settings]);

  // 1-Click Cloud Sync: Pull All Data from Supabase
  const pullAllFromCloud = useCallback(async () => {
    const data = await realtimeManager.pullAllFromSupabase();
    if (!data) {
      return { success: false, message: 'ไม่สามารถดึงข้อมูลจาก Supabase ได้ (กรุณาตรวจสอบการเชื่อมต่อและตาราง)' };
    }

    if (data.categories && data.categories.length > 0) setCategories(data.categories);
    if (data.menuItems && data.menuItems.length > 0) setMenuItems(data.menuItems);
    if (data.tables && data.tables.length > 0) setTables(data.tables);
    if (data.promos && data.promos.length > 0) setPromos(data.promos);
    if (data.orders && data.orders.length > 0) setOrders(data.orders);
    if (data.settings) setSettings(data.settings);

    return { success: true, message: 'ดึงข้อมูลล่าสุดจาก Supabase และอัปเดตหน้าจอสำเร็จแล้ว! 📥' };
  }, []);

  // Mount Realtime Listeners & Hub
  useEffect(() => {
    realtimeManager.setCallbacks({
      onConnectionStatusChange: (status, detail) => {
        setRealtimeStatus(status);
        if (detail) setRealtimeDetail(detail);
      },
      onOrderCreated: (incomingOrder) => {
        setOrders((prev) => {
          if (prev.some((o) => o.id === incomingOrder.id)) return prev;
          return [incomingOrder, ...prev];
        });
        // If dine in, mark table occupied
        if (incomingOrder.orderType === 'dine_in' && incomingOrder.tableNumber) {
          setTables((prev) =>
            prev.map((t) =>
              t.number === incomingOrder.tableNumber
                ? { ...t, status: 'occupied', currentOrderId: incomingOrder.id }
                : t
            )
          );
        }
        audioChime.playNewOrderBell();
        showToast(`🛎️ ออเดอร์ใหม่ #${incomingOrder.orderNumber} (โต๊ะ ${incomingOrder.tableNumber || 'กลับบ้าน'}) เข้าสู่ระบบแบบเรียลไทม์!`, 'success');
      },
      onOrderStatusChanged: (orderId, newStatus, updatedOrder) => {
        setOrders((prev) =>
          prev.map((ord) => (ord.id === orderId ? (updatedOrder ? updatedOrder : { ...ord, orderStatus: newStatus }) : ord))
        );
        setActiveCustomerOrder((prev) => {
          if (prev?.id === orderId) {
            return updatedOrder ? updatedOrder : { ...prev, orderStatus: newStatus };
          }
          return prev;
        });
        audioChime.playStatusChime();
        showToast(`อัปเดตสถานะออเดอร์ #${orderId.slice(-4)} เป็น "${newStatus}" แบบเรียลไทม์`, 'info');
      },
      onOrderUpdated: (incomingOrder) => {
        setOrders((prev) => prev.map((ord) => (ord.id === incomingOrder.id ? incomingOrder : ord)));
        setActiveCustomerOrder((prev) => (prev?.id === incomingOrder.id ? incomingOrder : prev));
      },
      onOrderDeleted: (orderId) => {
        setOrders((prev) => prev.filter((ord) => ord.id !== orderId));
        setActiveCustomerOrder((prev) => (prev?.id === orderId ? null : prev));
      },
      onAllCompletedOrdersCleared: () => {
        setOrders((prev) => prev.filter((o) => o.orderStatus !== 'completed'));
      },
      onMenuItemCreated: (item) => {
        setMenuItems((prev) => {
          if (prev.some((m) => m.id === item.id)) return prev;
          return [item, ...prev];
        });
        showToast(`⚡ เมนูใหม่ "${item.name}" ซิงค์สดเข้าสู่ระบบแล้ว`, 'info');
      },
      onMenuItemUpdated: (item) => {
        setMenuItems((prev) => prev.map((m) => (m.id === item.id ? item : m)));
        showToast(`⚡ ปรับปรุงข้อมูลเมนู "${item.name}" แบบเรียลไทม์`, 'info');
      },
      onMenuItemDeleted: (itemId) => {
        setMenuItems((prev) => prev.filter((m) => m.id !== itemId));
      },
      onTableCreated: (newTable) => {
        setTables((prev) => {
          if (prev.some((t) => t.id === newTable.id)) return prev;
          return [...prev, newTable];
        });
        showToast(`⚡ โต๊ะ "${newTable.number}" เพิ่มเข้าสู่ระบบแล้ว`, 'info');
      },
      onTableUpdated: (updatedTable) => {
        setTables((prev) => prev.map((t) => (t.id === updatedTable.id ? updatedTable : t)));
      },
      onTableDeleted: (tableId) => {
        setTables((prev) => prev.filter((t) => t.id !== tableId));
      },
      onTableStatusChanged: (tableId, status) => {
        setTables((prev) =>
          prev.map((t) => (t.id === tableId ? { ...t, status } : t))
        );
      },
      onTableBillCleared: (tableIdOrNumber) => {
        setTables((prev) =>
          prev.map((t) =>
            t.id === tableIdOrNumber || t.number.toLowerCase() === tableIdOrNumber.toLowerCase()
              ? { ...t, status: 'available', currentOrderId: undefined, guestCount: 0 }
              : t
          )
        );
      },
      onCategoryUpdated: (newCategories) => {
        setCategories(newCategories);
      },
      onCategoryDeleted: (deletedCatId) => {
        setCategories((prev) => prev.filter((c) => c.id !== deletedCatId));
      },
      onPromoUpdated: (newPromos) => {
        setPromos(newPromos);
      },
      onPromoDeleted: (deletedCode) => {
        setPromos((prev) => prev.filter((p) => p.code.toUpperCase() !== deletedCode.toUpperCase()));
      },
      onSettingsUpdated: (newSettings) => {
        setSettings((prev) => ({ ...prev, ...newSettings }));
      },
      onFullStateSync: (fullState) => {
        if (fullState.categories) setCategories(fullState.categories);
        if (fullState.menuItems) setMenuItems(fullState.menuItems);
        if (fullState.tables) setTables(fullState.tables);
        if (fullState.promos) setPromos(fullState.promos);
        if (fullState.orders) setOrders(fullState.orders);
        if (fullState.settings) setSettings(fullState.settings);
        showToast('ซิงค์ข้อมูลสมบูรณ์จากเครื่องแม่ข่ายเรียบร้อย 🔄', 'success');
      },
    });

    // Boot initial realtime connection
    realtimeManager.initRealtime();
  }, [showToast]);

  // Persist to localStorage safely
  useEffect(() => {
    safeLocalStorageSet(`${LOCAL_STORAGE_PREFIX}categories`, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    safeSaveMenuToStorage(`${LOCAL_STORAGE_PREFIX}menu`, menuItems);
  }, [menuItems]);

  useEffect(() => {
    safeSaveOrdersToStorage(`${LOCAL_STORAGE_PREFIX}orders`, orders);
  }, [orders]);

  useEffect(() => {
    safeLocalStorageSet(`${LOCAL_STORAGE_PREFIX}tables`, JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    safeLocalStorageSet(`${LOCAL_STORAGE_PREFIX}promos`, JSON.stringify(promos));
  }, [promos]);

  useEffect(() => {
    safeLocalStorageSet(`${LOCAL_STORAGE_PREFIX}settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (deliveryLocation) {
      safeLocalStorageSet(`${LOCAL_STORAGE_PREFIX}deliveryLocation`, JSON.stringify(deliveryLocation));
    }
  }, [deliveryLocation]);

  // Keep activeCustomerOrder updated from orders and synced to localStorage
  useEffect(() => {
    if (activeCustomerOrder) {
      const found = orders.find(
        (o) => o.id === activeCustomerOrder.id || o.orderNumber === activeCustomerOrder.orderNumber
      );
      if (found) {
        if (
          found.orderStatus !== activeCustomerOrder.orderStatus ||
          found.items.length !== activeCustomerOrder.items.length ||
          found.roundsCount !== activeCustomerOrder.roundsCount ||
          found.paymentStatus !== activeCustomerOrder.paymentStatus
        ) {
          setActiveCustomerOrder(found);
        }
      }
      if (activeCustomerOrder.orderStatus !== 'completed' && activeCustomerOrder.orderStatus !== 'cancelled') {
        safeLocalStorageSet(`${LOCAL_STORAGE_PREFIX}my_active_order_id`, activeCustomerOrder.id);
      } else {
        try {
          localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}my_active_order_id`);
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      try {
        localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}my_active_order_id`);
      } catch (e) {
        console.error(e);
      }
    }
  }, [orders, activeCustomerOrder]);

  // URL table query param listener on load / popstate
  useEffect(() => {
    const handleCheckUrlTable = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tParam = params.get('table') || params.get('t') || params.get('tableNumber');
        if (tParam) {
          const formatted = tParam.toUpperCase().startsWith('T-')
            ? tParam.toUpperCase()
            : `T-${tParam.padStart(2, '0')}`;
          setSelectedTable(formatted);
          setIsTableScanned(true);
          setOrderType('dine_in');
          localStorage.setItem(`${LOCAL_STORAGE_PREFIX}scannedTable`, formatted);
          showToast(`📷 สแกนเข้าสู่โต๊ะ ${formatted} สำเร็จ! ยินดีต้อนรับครับ`, 'success');
        }
      } catch (e) {
        console.error(e);
      }
    };

    handleCheckUrlTable();
    window.addEventListener('popstate', handleCheckUrlTable);
    return () => window.removeEventListener('popstate', handleCheckUrlTable);
  }, []);

  // Table Scan / Manual Select / Clear functions
  const scanTable = (tableNum: string) => {
    const formatted = tableNum.trim().toUpperCase().startsWith('T-')
      ? tableNum.trim().toUpperCase()
      : `T-${tableNum.trim().padStart(2, '0')}`;

    setSelectedTable(formatted);
    setIsTableScanned(true);
    setOrderType('dine_in');
    safeLocalStorageSet(`${LOCAL_STORAGE_PREFIX}scannedTable`, formatted);
    setIsTableScannerModalOpen(false);
    showToast(`📷 สแกนเข้าสู่โต๊ะ ${formatted} เรียบร้อยแล้ว!`, 'success');
  };

  const selectTableManually = (tableNum: string) => {
    let formatted = tableNum.trim();
    if (formatted && formatted !== 'เคาน์เตอร์' && formatted !== 'สั่งที่เคาน์เตอร์' && !formatted.includes('เคาน์เตอร์')) {
      if (!formatted.toUpperCase().startsWith('T-')) {
        formatted = `T-${formatted.padStart(2, '0')}`;
      } else {
        formatted = formatted.toUpperCase();
      }
    }

    setSelectedTable(formatted);
    setIsTableScanned(Boolean(formatted));
    setOrderType('dine_in');
    if (formatted) {
      safeLocalStorageSet(`${LOCAL_STORAGE_PREFIX}scannedTable`, formatted);
      showToast(`เลือกโต๊ะ ${formatted} เรียบร้อยแล้ว สั่งอาหารได้ทันที ✨`, 'success');
    } else {
      try {
        localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}scannedTable`);
      } catch (e) {
        console.error(e);
      }
      showToast('เลือกทานที่ร้าน (สั่งที่เคาน์เตอร์ / พนักงานจัดโต๊ะ) ✨', 'info');
    }
    setIsTableScannerModalOpen(false);
  };

  const clearScannedTable = () => {
    setSelectedTable('');
    setIsTableScanned(false);
    try {
      localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}scannedTable`);
    } catch (e) {
      console.error(e);
    }
    showToast('ยกเลิกการระบุโต๊ะแล้ว', 'info');
  };

  // Category methods
  const addCategory = (catData: Omit<Category, 'id'>): Category => {
    const slug = catData.nameEn
      ? catData.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : `cat-${Date.now()}`;
    const id = slug || `cat_${Date.now()}`;
    const newCat: Category = {
      ...catData,
      id,
    };
    const nextCats = [...categories, newCat];
    setCategories(nextCats);
    realtimeManager.persistCategories(nextCats);
    realtimeManager.broadcast('CATEGORY_UPDATED', { categories: nextCats });
    showToast(`เพิ่มหมวดหมู่ "${newCat.name}" สำเร็จ!`, 'success');
    return newCat;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    const nextCats = categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCategories(nextCats);
    realtimeManager.persistCategories(nextCats);
    realtimeManager.broadcast('CATEGORY_UPDATED', { categories: nextCats });
    showToast('แก้ไขข้อมูลหมวดหมู่เรียบร้อย', 'success');
  };

  const deleteCategory = (id: string) => {
    if (id === 'all') {
      showToast('ไม่สามารถลบหมวดหมู่ "ทั้งหมด" ได้', 'warning');
      return;
    }
    const target = categories.find((c) => c.id === id);
    const nextCats = categories.filter((c) => c.id !== id);
    setCategories(nextCats);
    // Reassign items in this category to 'all' or another category so they aren't orphaned
    const nextItems = menuItems.map((m) => (m.category === id ? { ...m, category: 'all' } : m));
    setMenuItems(nextItems);
    realtimeManager.deleteCategory(id);
    realtimeManager.persistCategories(nextCats);
    realtimeManager.broadcast('CATEGORY_DELETED', { id, categories: nextCats });
    showToast(`ลบหมวดหมู่ "${target?.name || id}" สำเร็จ`, 'info');
  };

  // Menu methods
  const addMenuItem = (itemData: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...itemData,
      id: `m_${Date.now()}`,
    };
    setMenuItems((prev) => [newItem, ...prev]);
    realtimeManager.persistMenuItem(newItem);
    realtimeManager.broadcast('MENU_ITEM_CREATED', { item: newItem });
    showToast(`เพิ่มเมนู "${newItem.name}" สำเร็จ!`, 'success');
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    let updatedItem: MenuItem | undefined;
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          updatedItem = { ...item, ...updates };
          return updatedItem;
        }
        return item;
      })
    );
    if (updatedItem) {
      realtimeManager.persistMenuItem(updatedItem);
      realtimeManager.broadcast('MENU_ITEM_UPDATED', { item: updatedItem });
    }
    showToast('บันทึกการแก้ไขเมนูเรียบร้อย', 'success');
  };

  const deleteMenuItem = (id: string) => {
    const target = menuItems.find((m) => m.id === id);
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
    realtimeManager.deleteMenuItem(id);
    realtimeManager.broadcast('MENU_ITEM_DELETED', { itemId: id });
    showToast(`ลบเมนู "${target?.name || ''}" แล้ว`, 'info');
  };

  const toggleItemAvailability = (id: string) => {
    let updatedItem: MenuItem | undefined;
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const next = !item.available;
          updatedItem = { ...item, available: next };
          showToast(`เปลี่ยนสถานะ "${item.name}" เป็น ${next ? 'พร้อมเสิร์ฟ' : 'สินค้าหมด'}`, next ? 'success' : 'warning');
          return updatedItem;
        }
        return item;
      })
    );
    if (updatedItem) {
      realtimeManager.persistMenuItem(updatedItem);
      realtimeManager.broadcast('MENU_ITEM_STOCK_TOGGLED', { item: updatedItem });
    }
  };

  // Active table / customer order detection for merging (Round 2+ into same bill)
  const activeTableOrder: Order | null = useMemo(() => {
    // 1. If table is specified for dine-in, search by tableNumber in active orders
    if (orderType === 'dine_in' && selectedTable) {
      const cleanTable = selectedTable.trim().toUpperCase();
      const byTable = orders.find(
        (o) =>
          o.orderType === 'dine_in' &&
          o.tableNumber &&
          (o.tableNumber.trim().toUpperCase() === cleanTable ||
            o.tableNumber.replace(/\D/g, '') === cleanTable.replace(/\D/g, '')) &&
          o.orderStatus !== 'completed' &&
          o.orderStatus !== 'cancelled'
      );
      if (byTable) return byTable;
    }

    // 2. Otherwise check this customer's active order session on this device
    if (
      activeCustomerOrder &&
      activeCustomerOrder.orderStatus !== 'completed' &&
      activeCustomerOrder.orderStatus !== 'cancelled'
    ) {
      const matchInOrders = orders.find(
        (o) =>
          (o.id === activeCustomerOrder.id || o.orderNumber === activeCustomerOrder.orderNumber) &&
          o.orderStatus !== 'completed' &&
          o.orderStatus !== 'cancelled'
      );
      if (matchInOrders) return matchInOrders;
      return activeCustomerOrder;
    }

    return null;
  }, [orders, orderType, selectedTable, activeCustomerOrder]);

  const isAddingToExistingOrder = Boolean(activeTableOrder);

  // Cart methods
  const addToCart = (
    item: MenuItem,
    selectedOptions: SelectedOption[],
    quantity: number,
    notes?: string,
    packagingType?: 'dine_in' | 'takeaway',
    excludedIngredients?: string[]
  ) => {
    const chosenPackaging: 'dine_in' | 'takeaway' =
      packagingType || (orderType === 'dine_in' ? 'dine_in' : 'takeaway');

    const optionsTotal = selectedOptions.reduce((sum, opt) => sum + opt.priceDelta, 0);
    const unitPrice = item.price + optionsTotal;
    const itemTotal = unitPrice * quantity;

    // Check if duplicate option combination exists in cart with same packaging & exclusions
    const optionsKey = selectedOptions
      .map((o) => `${o.groupId}:${o.choiceId}`)
      .sort()
      .join('|');
    const excludedKey = (excludedIngredients || []).sort().join(',');

    setCart((prev) => {
      const existingIndex = prev.findIndex((ci) => {
        if (ci.menuItem.id !== item.id) return false;
        if ((ci.specialInstructions || '') !== (notes || '')) return false;
        if ((ci.packagingType || 'dine_in') !== chosenPackaging) return false;
        const ciExKey = (ci.excludedIngredients || []).sort().join(',');
        if (ciExKey !== excludedKey) return false;
        const ciOptKey = ci.selectedOptions
          .map((o) => `${o.groupId}:${o.choiceId}`)
          .sort()
          .join('|');
        return ciOptKey === optionsKey;
      });

      if (existingIndex > -1) {
        const updated = [...prev];
        const current = updated[existingIndex];
        const newQty = current.quantity + quantity;
        updated[existingIndex] = {
          ...current,
          quantity: newQty,
          itemTotal: unitPrice * newQty,
        };
        return updated;
      } else {
        const currentRound = (activeTableOrder?.roundsCount || 1) + (isAddingToExistingOrder ? 1 : 0);
        const newCartItem: CartItem = {
          id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          menuItem: item,
          selectedOptions,
          quantity,
          packagingType: chosenPackaging,
          round: currentRound,
          addedAt: new Date().toISOString(),
          specialInstructions: notes,
          excludedIngredients: excludedIngredients && excludedIngredients.length > 0 ? excludedIngredients : undefined,
          itemTotal,
        };
        return [...prev, newCartItem];
      }
    });

    const packLabel = chosenPackaging === 'takeaway' ? ' (สั่งกลับบ้าน 🛍️)' : ' (ทานที่ร้าน 🍽️)';
    showToast(`เพิ่ม "${item.name}"${packLabel} ${quantity} ที่ ลงตะกร้าแล้ว`, 'success');
  };

  const addCustomDishToCart = (details: {
    dishName: string;
    description?: string;
    preferences?: string;
    excludedIngredients?: string[];
    quantity: number;
    packagingType?: 'dine_in' | 'takeaway';
    notes?: string;
  }) => {
    const chosenPackaging: 'dine_in' | 'takeaway' =
      details.packagingType || (orderType === 'dine_in' ? 'dine_in' : 'takeaway');

    const customMenuItem: MenuItem = {
      id: `custom_${Date.now()}`,
      name: details.dishName.trim(),
      nameEn: 'Custom Chef Order',
      description: details.description || details.preferences || 'เมนูพิเศษสั่งทำตามใจลูกค้า (คิดราคาหลังบ้าน)',
      price: 0, // Pending quote by restaurant
      category: 'custom',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
      rating: 5.0,
      reviewsCount: 1,
      prepTimeMinutes: 15,
      available: true,
      isChefSpecial: true,
    };

    const currentRound = (activeTableOrder?.roundsCount || 1) + (isAddingToExistingOrder ? 1 : 0);
    const newCartItem: CartItem = {
      id: `cart_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      menuItem: customMenuItem,
      selectedOptions: [],
      quantity: details.quantity,
      packagingType: chosenPackaging,
      round: currentRound,
      addedAt: new Date().toISOString(),
      specialInstructions: details.notes || details.preferences,
      excludedIngredients: details.excludedIngredients && details.excludedIngredients.length > 0 ? details.excludedIngredients : undefined,
      customDishDetails: {
        isCustomDish: true,
        customName: details.dishName.trim(),
        description: details.description,
        preferences: details.preferences,
        isPricePending: true,
      },
      itemTotal: 0,
    };

    setCart((prev) => [...prev, newCartItem]);
    const packLabel = chosenPackaging === 'takeaway' ? ' (สั่งกลับบ้าน 🛍️)' : ' (ทานที่ร้าน 🍽️)';
    showToast(`เพิ่มเมนูพิเศษ "${details.dishName}"${packLabel} ลงตะกร้าแล้ว (ทางร้านจะคิดราคาให้หลังบ้าน)`, 'success');
  };

  const updateOrderItemPrice = (orderId: string, cartItemId: string, newUnitPrice: number) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;

        const updatedItems = ord.items.map((it) => {
          if (it.id === cartItemId) {
            const newItemTotal = newUnitPrice * it.quantity;
            return {
              ...it,
              menuItem: { ...it.menuItem, price: newUnitPrice },
              itemTotal: newItemTotal,
              customDishDetails: it.customDishDetails
                ? { ...it.customDishDetails, isPricePending: false }
                : undefined,
            };
          }
          return it;
        });

        const newSubtotal = updatedItems.reduce((sum, item) => sum + item.itemTotal, 0);

        let newDiscount = ord.discount;
        if (ord.promoCodeApplied) {
          const promo = promos.find((p) => p.code === ord.promoCodeApplied);
          if (promo) {
            if (promo.discountType === 'percentage') {
              const calc = (newSubtotal * promo.value) / 100;
              newDiscount = promo.maxDiscount ? Math.min(calc, promo.maxDiscount) : calc;
            }
          }
        }

        const afterDisc = Math.max(0, newSubtotal - newDiscount);
        const newServiceCharge =
          ord.orderType === 'dine_in' && settings.enableServiceCharge
            ? Math.round(afterDisc * settings.serviceChargeRate * 10) / 10
            : 0;

        const newTotal = afterDisc + newServiceCharge + (ord.deliveryFee || 0);

        const updatedOrder: Order = {
          ...ord,
          items: updatedItems,
          subtotal: newSubtotal,
          discount: newDiscount,
          serviceCharge: newServiceCharge,
          total: newTotal,
          updatedAt: new Date().toISOString(),
        };

        if (activeCustomerOrder?.id === orderId) {
          setActiveCustomerOrder(updatedOrder);
        }

        return updatedOrder;
      })
    );

    showToast(`อัปเดตราคาเมนูเป็น ฿${newUnitPrice.toLocaleString()} เรียบร้อยแล้ว`, 'success');
  };

  const updateCartItemQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) => {
          if (ci.id !== cartItemId) return ci;
          const newQty = ci.quantity + delta;
          if (newQty <= 0) return null;
          const optionsTotal = ci.selectedOptions.reduce((sum, opt) => sum + opt.priceDelta, 0);
          const unitPrice = ci.menuItem.price + optionsTotal;
          return {
            ...ci,
            quantity: newQty,
            itemTotal: unitPrice * newQty,
          };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateCartItemPackagingType = (cartItemId: string, newPackagingType: 'dine_in' | 'takeaway') => {
    setCart((prev) =>
      prev.map((ci) => {
        if (ci.id === cartItemId) {
          return { ...ci, packagingType: newPackagingType };
        }
        return ci;
      })
    );
    showToast(
      newPackagingType === 'takeaway'
        ? 'เปลี่ยนเป็น: สั่งกลับบ้าน 🛍️'
        : 'เปลี่ยนเป็น: ทานที่ร้าน 🍽️',
      'info'
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedPromo(null);
  };

  // Promo code calculation
  const applyPromoCode = (codeStr: string): { success: boolean; message: string } => {
    const cleanCode = codeStr.trim().toUpperCase();
    const promo = promos.find((p) => p.code.toUpperCase() === cleanCode && p.active);

    if (!promo) {
      return { success: false, message: 'โค้ดส่วนลดนี้ไม่ถูกต้อง หรือหมดอายุแล้ว' };
    }

    if (cartSubtotal < promo.minOrder) {
      return {
        success: false,
        message: `โค้ดนี้ใช้ได้เมื่อสั่งขั้นต่ำ ฿${promo.minOrder.toLocaleString()} (ยอดปัจจุบัน ฿${cartSubtotal.toLocaleString()})`,
      };
    }

    setAppliedPromo(promo);
    showToast(`ใช้โค้ดส่วนลด "${promo.code}" สำเร็จ!`, 'success');
    return { success: true, message: `ใช้โค้ด ${promo.code} เรียบร้อยแล้ว` };
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    showToast('ยกเลิกโค้ดส่วนลดแล้ว', 'info');
  };

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  let cartDiscount = 0;
  if (appliedPromo && cartSubtotal >= appliedPromo.minOrder) {
    if (appliedPromo.discountType === 'percentage') {
      const calcDiscount = (cartSubtotal * appliedPromo.value) / 100;
      cartDiscount = appliedPromo.maxDiscount ? Math.min(calcDiscount, appliedPromo.maxDiscount) : calcDiscount;
    } else {
      cartDiscount = appliedPromo.value;
    }
  }

  const afterDiscount = Math.max(0, cartSubtotal - cartDiscount);

  // Service charge only for dine-in if enabled
  const cartServiceCharge =
    orderType === 'dine_in' && settings.enableServiceCharge
      ? Math.round(afterDiscount * settings.serviceChargeRate * 10) / 10
      : 0;

  // Restaurant GPS Coordinates
  const restLat = settings.restaurantLat || 13.7367;
  const restLng = settings.restaurantLng || 100.5831;

  // Delivery distance calculation
  const deliveryDistanceKm = deliveryLocation?.lat && deliveryLocation?.lng
    ? calculateDistanceKm(restLat, restLng, deliveryLocation.lat, deliveryLocation.lng)
    : (deliveryLocation?.distanceKm || 0.5);

  // Max delivery radius check
  const maxDeliveryRadius = settings.deliveryMaxDistanceKm ?? 15;
  const isDeliveryOutOfRange =
    orderType === 'delivery' &&
    maxDeliveryRadius > 0 &&
    deliveryDistanceKm > maxDeliveryRadius;

  // Delivery Fee Calculation based on settings
  let cartDeliveryFee = 0;
  let isDeliveryFree = false;

  if (orderType === 'delivery') {
    // Check if free delivery minimum order is satisfied
    if (settings.deliveryFreeMinOrder && settings.deliveryFreeMinOrder > 0 && afterDiscount >= settings.deliveryFreeMinOrder) {
      cartDeliveryFee = 0;
      isDeliveryFree = true;
    } else {
      const baseFee = settings.deliveryBaseFee ?? 40;
      const perKmFee = settings.deliveryPerKmFee ?? 10;
      const freeKm = settings.deliveryFreeKm ?? 3;

      if (deliveryDistanceKm > freeKm && perKmFee > 0) {
        const extraKm = Math.ceil(deliveryDistanceKm - freeKm);
        cartDeliveryFee = baseFee + (extraKm * perKmFee);
      } else {
        cartDeliveryFee = baseFee;
      }
    }
  }

  const cartTotal = afterDiscount + cartServiceCharge + cartDeliveryFee;

  // Create Order or Merge with Existing Table Order
  const createOrder = (paymentMethod: 'promptpay' | 'credit_card' | 'cash', slipImage?: string): Order => {
    // 0. Store Closure Check: strictly prevent placing orders when closed
    if (!storeStatus.isOpen) {
      showToast(`ไม่สามารถสั่งอาหารได้ในขณะนี้ เนื่องจากร้านปิดทำการ (${storeStatus.statusText})`, 'warning');
      return null as any;
    }

    // 0.1 Delivery Constraints Checks
    if (orderType === 'delivery') {
      if (settings.deliveryMinOrderAmount && afterDiscount < settings.deliveryMinOrderAmount) {
        showToast(
          `ยอดสั่งซื้ออาหารขั้นต่ำสำหรับบริการจัดส่งเดลิเวอรี่คือ ฿${settings.deliveryMinOrderAmount.toLocaleString()} (ยอดปัจจุบัน ฿${afterDiscount.toLocaleString()})`,
          'warning'
        );
        return null as any;
      }

      if (isDeliveryOutOfRange && !settings.allowOutOfRadiusOrder) {
        showToast(
          settings.outOfRadiusMessage ||
            `ขออภัยครับ พิกัดจัดส่งของคุณห่าง ${deliveryDistanceKm} กม. ซึ่งเกินรัศมีบริการสูงสุด ${maxDeliveryRadius} กม. กรุณาเลือกสั่งแบบรับกลับหน้าร้าน`,
          'warning'
        );
        return null as any;
      }
    }

    // 1. If there is already an active order for this table/customer session, merge into the existing bill!
    if (activeTableOrder) {
      const newRoundNumber = (activeTableOrder.roundsCount || 1) + 1;
      const addedAt = new Date().toISOString();

      const newItemsWithRound: CartItem[] = cart.map((ci) => ({
        ...ci,
        round: newRoundNumber,
        packagingType: ci.packagingType || (orderType === 'dine_in' ? 'dine_in' : 'takeaway'),
        addedAt,
      }));

      const combinedItems = [...activeTableOrder.items, ...newItemsWithRound];
      const combinedSubtotal = combinedItems.reduce((s, it) => s + it.itemTotal, 0);

      let combinedDiscount = activeTableOrder.discount;
      let promoCodeApplied = activeTableOrder.promoCodeApplied;
      if (appliedPromo && combinedSubtotal >= appliedPromo.minOrder) {
        promoCodeApplied = appliedPromo.code;
        if (appliedPromo.discountType === 'percentage') {
          const calcDiscount = (combinedSubtotal * appliedPromo.value) / 100;
          combinedDiscount = appliedPromo.maxDiscount
            ? Math.min(calcDiscount, appliedPromo.maxDiscount)
            : calcDiscount;
        } else {
          combinedDiscount = appliedPromo.value;
        }
      }

      const afterDisc = Math.max(0, combinedSubtotal - combinedDiscount);
      const combinedServiceCharge = (activeTableOrder.orderType === 'dine_in' && settings.enableServiceCharge)
        ? Math.round(afterDisc * settings.serviceChargeRate * 10) / 10
        : 0;
      const combinedTotal = afterDisc + combinedServiceCharge;

      const updatedOrder: Order = {
        ...activeTableOrder,
        items: combinedItems,
        subtotal: combinedSubtotal,
        discount: combinedDiscount,
        promoCodeApplied,
        serviceCharge: combinedServiceCharge,
        total: combinedTotal,
        roundsCount: newRoundNumber,
        slipImage: slipImage || activeTableOrder.slipImage,
        hasNewItems: true,
        orderStatus:
          activeTableOrder.orderStatus === 'ready' || activeTableOrder.orderStatus === 'completed'
            ? 'cooking'
            : activeTableOrder.orderStatus,
        updatedAt: addedAt,
        notes: customerInfo.notes
          ? `${activeTableOrder.notes ? activeTableOrder.notes + ' | ' : ''}รอบ ${newRoundNumber}: ${customerInfo.notes}`
          : activeTableOrder.notes,
      };

      setOrders((prev) => prev.map((ord) => (ord.id === activeTableOrder.id ? updatedOrder : ord)));
      setActiveCustomerOrder(updatedOrder);

      // Persist to Supabase and Broadcast to other devices (Kitchen, POS, Admin)
      realtimeManager.persistOrder(updatedOrder);
      realtimeManager.broadcast('ORDER_UPDATED', { order: updatedOrder });
      audioChime.playNewOrderBell();

      // LINE Messaging API Notification (Round 2+ Added items with Slip Attachment)
      if (settings.lineNotifyEnabled !== false) {
        sendOrderLineNotification(updatedOrder, settings, true).catch((err) => {
          console.warn('LINE notification round add failed:', err);
        });
      }

      clearCart();
      setIsCheckoutModalOpen(false);
      setIsCartDrawerOpen(false);
      setIsOrderTrackerOpen(true);
      showToast(
        `สั่งอาหารเพิ่มเข้าบิลเดิม #${activeTableOrder.orderNumber} ${activeTableOrder.tableNumber ? `(โต๊ะ ${activeTableOrder.tableNumber})` : ''} สำเร็จ! (รอบที่ ${newRoundNumber}) 🍳`,
        'success'
      );

      return updatedOrder;
    }

    // 2. New Order Creation
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${randomNum}`;

    const newOrderItems: CartItem[] = cart.map((ci) => ({
      ...ci,
      round: 1,
      packagingType: ci.packagingType || (orderType === 'dine_in' ? 'dine_in' : 'takeaway'),
      addedAt: new Date().toISOString(),
    }));

    const targetTableNum = orderType === 'dine_in'
      ? (selectedTable || 'เคาน์เตอร์ / สั่งทานที่ร้าน')
      : undefined;

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber,
      orderType,
      tableNumber: targetTableNum,
      customerName: customerInfo.name || 'คุณลูกค้า',
      customerPhone: customerInfo.phone || '089-123-4567',
      items: newOrderItems,
      subtotal: cartSubtotal,
      discount: cartDiscount,
      promoCodeApplied: appliedPromo?.code,
      serviceCharge: cartServiceCharge,
      deliveryFee: cartDeliveryFee,
      deliveryAddress: orderType === 'delivery' ? (deliveryAddress || deliveryLocation?.address) : undefined,
      deliveryLocation: orderType === 'delivery' ? (deliveryLocation || undefined) : undefined,
      total: cartTotal,
      paymentMethod,
      paymentStatus: 'paid',
      orderStatus: 'pending',
      slipImage,
      roundsCount: 1,
      hasNewItems: false,
      createdAt: new Date().toISOString(),
      estimatedMinutes: 15,
      notes: customerInfo.notes,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // If dine in, update table status to occupied if matching known table
    if (orderType === 'dine_in' && selectedTable) {
      setTables((prev) =>
        prev.map((t) =>
          t.number === selectedTable
            ? { ...t, status: 'occupied', currentOrderId: newOrder.id, guestCount: t.guestCount || 2 }
            : t
        )
      );
      const matchedTable = tables.find((t) => t.number === selectedTable);
      if (matchedTable) {
        realtimeManager.persistTable({ ...matchedTable, status: 'occupied', currentOrderId: newOrder.id, guestCount: matchedTable.guestCount || 2 });
        realtimeManager.broadcast('TABLE_STATUS_CHANGED', { tableId: matchedTable.id, status: 'occupied' });
      }
    }

    // Persist & Broadcast Realtime Order
    realtimeManager.persistOrder(newOrder);
    realtimeManager.broadcast('ORDER_CREATED', { order: newOrder });

    // LINE Messaging API Notification (New Order with Slip Attachment)
    if (settings.lineNotifyEnabled !== false) {
      sendOrderLineNotification(newOrder, settings, false).catch((err) => {
        console.warn('LINE notification new order failed:', err);
      });
    }

    setActiveCustomerOrder(newOrder);
    clearCart();
    setIsCheckoutModalOpen(false);
    setIsCartDrawerOpen(false);
    setIsOrderTrackerOpen(true);
    showToast(`ส่งออเดอร์ #${orderNumber} เข้าครัวเรียบร้อยแล้ว!`, 'success');

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    let affectedTableNum: string | undefined;
    let updatedOrderObj: Order | undefined;

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          affectedTableNum = ord.tableNumber;
          const updated = { ...ord, orderStatus: newStatus };
          if (newStatus === 'completed') {
            updated.paymentStatus = 'paid';
          }
          if (activeCustomerOrder?.id === orderId) {
            setActiveCustomerOrder(updated);
          }
          updatedOrderObj = updated;
          return updated;
        }
        return ord;
      })
    );

    if (updatedOrderObj) {
      realtimeManager.persistOrder(updatedOrderObj);
      realtimeManager.broadcast('ORDER_STATUS_CHANGED', {
        orderId,
        status: newStatus,
        updatedOrder: updatedOrderObj,
      });
    }

    // If order is completed (finished & paid) and is a dine-in order, automatically clear table to available
    if (newStatus === 'completed' && affectedTableNum) {
      setTables((prev) =>
        prev.map((t) =>
          t.number === affectedTableNum
            ? { ...t, status: 'available', currentOrderId: undefined, guestCount: 0 }
            : t
        )
      );
      const matchedTable = tables.find((t) => t.number === affectedTableNum);
      if (matchedTable) {
        realtimeManager.persistTable({ ...matchedTable, status: 'available', currentOrderId: undefined, guestCount: 0 });
        realtimeManager.broadcast('TABLE_STATUS_CHANGED', { tableId: matchedTable.id, status: 'available' });
      }
    }

    const statusThai: Record<OrderStatus, string> = {
      pending: 'รอรับออเดอร์',
      cooking: 'กำลังปรุงในครัว 🍳',
      ready: 'อาหารพร้อมเสิร์ฟ/พร้อมส่ง 🛎️',
      delivering: 'กำลังจัดส่ง 🛵',
      completed: 'เสร็จสิ้นเรียบร้อย (เคลียร์บิลโต๊ะแล้ว) ✅',
      cancelled: 'ยกเลิกออเดอร์แล้ว ❌',
    };

    showToast(`อัปเดตสถานะออเดอร์เป็น: ${statusThai[newStatus]}`, 'info');
  };

  const cancelOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'cancelled');
  };

  const deleteOrder = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (activeCustomerOrder?.id === orderId) {
      setActiveCustomerOrder(null);
    }
    realtimeManager.deleteOrder(orderId);
    realtimeManager.broadcast('ORDER_DELETED', { orderId });
    showToast(`ลบประวัติออเดอร์ #${target?.orderNumber || orderId} เรียบร้อยแล้ว`, 'info');
  };

  const clearCompletedOrders = () => {
    const count = orders.filter((o) => o.orderStatus === 'completed').length;
    if (count === 0) {
      showToast('ไม่มีประวัติออเดอร์ที่เสร็จสมบูรณ์ให้ลบ', 'info');
      return;
    }
    setOrders((prev) => prev.filter((o) => o.orderStatus !== 'completed'));
    realtimeManager.clearAllCompletedOrders();
    realtimeManager.broadcast('ALL_COMPLETED_ORDERS_CLEARED', {});
    showToast(`ลบประวัติออเดอร์ที่เสร็จสมบูรณ์ทั้งหมด (${count} รายการ) เรียบร้อยแล้ว`, 'success');
  };

  // Table management & Bill clearing
  const addTable = (tableData: { number: string; name?: string; capacity: number; zone: string; status?: TableStatus }) => {
    const cleanNumber = tableData.number.trim();
    if (!cleanNumber) {
      showToast('กรุณาระบุชื่อหรือหมายเลขโต๊ะ', 'warning');
      return;
    }
    // Check if table number already exists
    if (tables.some((t) => t.number.toLowerCase() === cleanNumber.toLowerCase())) {
      showToast(`มีโต๊ะ "${cleanNumber}" ในระบบแล้ว กรุณาใช้ชื่ออื่น`, 'warning');
      return;
    }

    const newTable: Table = {
      id: `tbl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      number: cleanNumber,
      capacity: Number(tableData.capacity) || 4,
      zone: tableData.zone || 'Main Hall',
      status: tableData.status || 'available',
      guestCount: 0,
    };

    const nextTables = [...tables, newTable];
    setTables(nextTables);
    realtimeManager.persistTable(newTable);
    realtimeManager.broadcast('TABLE_CREATED', { table: newTable, tables: nextTables });
    showToast(`เพิ่มโต๊ะ "${newTable.number}" เรียบร้อยแล้ว ✨`, 'success');
  };

  const updateTable = (id: string, updates: Partial<Table>) => {
    let updatedTable: Table | undefined;
    const nextTables = tables.map((t) => {
      if (t.id === id) {
        const newNumber = updates.number ? updates.number.trim() : t.number;
        updatedTable = {
          ...t,
          ...updates,
          number: newNumber,
          capacity: updates.capacity !== undefined ? Number(updates.capacity) : t.capacity,
          zone: updates.zone !== undefined ? updates.zone : t.zone,
        };
        return updatedTable;
      }
      return t;
    });

    if (updatedTable) {
      setTables(nextTables);
      realtimeManager.persistTable(updatedTable);
      realtimeManager.broadcast('TABLE_UPDATED', { table: updatedTable, tables: nextTables });
      showToast(`บันทึกข้อมูลโต๊ะ "${updatedTable.number}" สำเร็จ ✨`, 'success');
    }
  };

  const deleteTable = (tableId: string) => {
    const target = tables.find((t) => t.id === tableId);
    if (!target) return;

    // Check if table has active order
    const hasActiveOrder = orders.some(
      (o) =>
        (o.tableNumber === target.number || o.id === target.currentOrderId) &&
        o.orderStatus !== 'completed' &&
        o.orderStatus !== 'cancelled'
    );

    if (hasActiveOrder) {
      showToast(`ไม่สามารถลบโต๊ะ "${target.number}" ได้ เนื่องจากมีออเดอร์ที่ยังไม่เสร็จสิ้น/ยังไม่เคลียร์บิล`, 'warning');
      return;
    }

    const nextTables = tables.filter((t) => t.id !== tableId);
    setTables(nextTables);
    realtimeManager.deleteTable(tableId);
    realtimeManager.broadcast('TABLE_DELETED', { tableId, tables: nextTables });
    showToast(`ลบโต๊ะ "${target.number}" เรียบร้อยแล้ว`, 'info');
  };

  const clearTableBill = (
    tableIdOrNumber: string,
    options: { markOrderCompleted?: boolean } = { markOrderCompleted: true }
  ) => {
    const targetTable = tables.find(
      (t) =>
        t.id === tableIdOrNumber ||
        t.number.toLowerCase() === tableIdOrNumber.toLowerCase()
    );

    if (!targetTable) {
      showToast(`ไม่พบข้อมูลโต๊ะ ${tableIdOrNumber}`, 'warning');
      return;
    }

    // 1. If options.markOrderCompleted, mark any active orders associated with this table as completed & paid
    if (options.markOrderCompleted !== false) {
      setOrders((prev) =>
        prev.map((ord) => {
          if (
            (ord.tableNumber === targetTable.number || ord.id === targetTable.currentOrderId) &&
            ord.orderStatus !== 'cancelled'
          ) {
            const updated = {
              ...ord,
              orderStatus: 'completed' as OrderStatus,
              paymentStatus: 'paid' as const,
              updatedAt: new Date().toISOString(),
            };
            realtimeManager.persistOrder(updated);
            realtimeManager.broadcast('ORDER_STATUS_CHANGED', {
              orderId: ord.id,
              status: 'completed',
              updatedOrder: updated,
            });
            return updated;
          }
          return ord;
        })
      );
    }

    // 2. Clear and release table to 'available'
    const clearedTable: Table = { ...targetTable, status: 'available', currentOrderId: undefined, guestCount: 0 };
    setTables((prev) =>
      prev.map((t) => (t.id === targetTable.id ? clearedTable : t))
    );
    realtimeManager.persistTable(clearedTable);
    realtimeManager.broadcast('TABLE_BILL_CLEARED', { tableIdOrNumber: targetTable.id });
    realtimeManager.broadcast('TABLE_STATUS_CHANGED', { tableId: targetTable.id, status: 'available' });

    // 3. If the active customer session was on this table, update order status
    if (activeCustomerOrder?.tableNumber === targetTable.number) {
      setActiveCustomerOrder((prev) =>
        prev ? { ...prev, orderStatus: 'completed', paymentStatus: 'paid' } : null
      );
    }

    showToast(`เคลียร์บิลโต๊ะ ${targetTable.number} สำเร็จ! โต๊ะว่างพร้อมรับลูกค้าใหม่แล้ว 🧹✨`, 'success');
  };

  const updateTableStatus = (tableId: string, status: Table['status']) => {
    let updatedTable: Table | undefined;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          // If manually switched to available, clear the order link and guest count
          if (status === 'available') {
            updatedTable = { ...t, status, currentOrderId: undefined, guestCount: 0 };
            return updatedTable;
          }
          updatedTable = { ...t, status };
          return updatedTable;
        }
        return t;
      })
    );
    if (updatedTable) {
      realtimeManager.persistTable(updatedTable);
      realtimeManager.broadcast('TABLE_STATUS_CHANGED', { tableId, status });
    }
    showToast('อัปเดตสถานะโต๊ะเรียบร้อย', 'info');
  };

  const updateTableGuestCount = (tableId: string, count: number) => {
    let updatedTable: Table | undefined;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          updatedTable = { ...t, guestCount: count };
          return updatedTable;
        }
        return t;
      })
    );
    if (updatedTable) {
      realtimeManager.persistTable(updatedTable);
    }
  };

  // Promo management
  const togglePromoActive = (code: string) => {
    const nextPromos = promos.map((p) => (p.code === code ? { ...p, active: !p.active } : p));
    setPromos(nextPromos);
    realtimeManager.persistPromos(nextPromos);
    realtimeManager.broadcast('PROMO_UPDATED', { promos: nextPromos });
  };

  const addPromo = (newPromo: PromoCode) => {
    const nextPromos = [newPromo, ...promos];
    setPromos(nextPromos);
    realtimeManager.persistPromos(nextPromos);
    realtimeManager.broadcast('PROMO_UPDATED', { promos: nextPromos });
    showToast(`เพิ่มโค้ดส่วนลด "${newPromo.code}" สำเร็จ`, 'success');
  };

  const deletePromo = (code: string) => {
    const nextPromos = promos.filter((p) => p.code.toUpperCase() !== code.toUpperCase());
    setPromos(nextPromos);
    if (appliedPromo?.code.toUpperCase() === code.toUpperCase()) {
      setAppliedPromo(null);
    }
    realtimeManager.deletePromo(code);
    realtimeManager.persistPromos(nextPromos);
    realtimeManager.broadcast('PROMO_DELETED', { code, promos: nextPromos });
    showToast(`ลบโค้ดโปรโมชั่น "${code}" แล้ว`, 'info');
  };

  // Settings
  const updateSettings = (newSettings: Partial<RestaurantSettings>) => {
    const nextSettings = { ...settings, ...newSettings };
    setSettings(nextSettings);
    realtimeManager.persistSettings(nextSettings);
    realtimeManager.broadcast('SETTINGS_UPDATED', { settings: nextSettings });
    showToast('บันทึกการตั้งค่าร้านสำเร็จ', 'success');
  };

  // Send Test LINE Notification (Includes Sample Slip Image in Flex Bill only)
  const sendLineTestNotification = async (
    customToken?: string,
    customTargetId?: string
  ): Promise<LineSendResult> => {
    const tokenToUse = customToken?.trim() || settings.lineChannelAccessToken;
    const targetIdToUse = customTargetId !== undefined ? customTargetId : settings.lineTargetId;
    const sampleSlipUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80';
    const testFlex = buildTestFlexMessage(settings, sampleSlipUrl);
    // Send only the single test Flex message with slip embedded cleanly inside the bill
    const messages = [testFlex];
    return await sendLineFlexMessage(messages, tokenToUse, targetIdToUse);
  };

  return (
    <RestaurantContext.Provider
      value={{
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        menuItems,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleItemAvailability,
        orders,
        updateOrderStatus,
        createOrder,
        cancelOrder,
        deleteOrder,
        clearCompletedOrders,
        activeCustomerOrder,
        setActiveCustomerOrder,
        tables,
        addTable,
        updateTable,
        deleteTable,
        updateTableStatus,
        updateTableGuestCount,
        clearTableBill,
        promos,
        togglePromoActive,
        addPromo,
        deletePromo,
        appliedPromo,
        applyPromoCode,
        removePromoCode,
        settings,
        updateSettings,
        storeStatus,
        isStoreOpen: storeStatus.isOpen,
        toggleWeeklyClosedDay,
        addSpecialHoliday,
        removeSpecialHoliday,
        setStoreManualOpen,
        realtimeStatus,
        realtimeDetail,
        isDatabaseModalOpen,
        setIsDatabaseModalOpen,
        reconnectSupabase,
        pushAllToCloud,
        pullAllFromCloud,
        sendLineTestNotification,
        cart,
        addToCart,
        addCustomDishToCart,
        updateOrderItemPrice,
        updateCartItemQuantity,
        updateCartItemPackagingType,
        removeFromCart,
        clearCart,
        orderType,
        setOrderType,
        selectedTable,
        setSelectedTable,
        isTableScanned,
        scanTable,
        selectTableManually,
        clearScannedTable,
        isTableScannerModalOpen,
        setIsTableScannerModalOpen,
        activeTableOrder,
        isAddingToExistingOrder,
        deliveryAddress,
        setDeliveryAddress,
        deliveryLocation,
        setDeliveryLocation,
        isMapPickerOpen,
        setIsMapPickerOpen,
        customerInfo,
        setCustomerInfo,
        cartSubtotal,
        cartDiscount,
        cartServiceCharge,
        cartDeliveryFee,
        cartTotal,
        cartItemCount,
        deliveryDistanceKm,
        isDeliveryOutOfRange,
        isDeliveryFree,
        isAdminMode,
        setIsAdminMode,
        isAdminAuthModalOpen,
        setIsAdminAuthModalOpen,
        adminActiveTab,
        setAdminActiveTab,
        isHeroCustomizerOpen,
        setIsHeroCustomizerOpen,
        updateHeroBannerSettings,
        resetHeroBannerToDefault,
        selectedDishForModal,
        setSelectedDishForModal,
        isCustomDishModalOpen,
        setIsCustomDishModalOpen,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        isOrderTrackerOpen,
        setIsOrderTrackerOpen,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
